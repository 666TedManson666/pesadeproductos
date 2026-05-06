import { SerialPort } from 'serialport'
import { ReadlineParser } from '@serialport/parser-readline'
import type { BrowserWindow } from 'electron'
import type { SerialConfig, SerialStatus, AvailablePort } from './serial.types'
import { DELIMITER_BYTES } from './serial.types'
import type { MaintenanceEvent, MaintenancePhase, MaintenanceStatus } from '../../src/types'
import { parseWeight } from './serial.parser'

const THROTTLE_MS = 100  // max 10 readings/sec to renderer
const RECONNECT_MS = 5000
const STABLE_HOLD_MS = 1000 // value must be steady for 1 second to be "stable"
const STABLE_EPSILON = 0.001 // tolerance for "same value" comparison (kg)

// ─── DEBUG FLAG ──────────────────────────────────────────────────────────────
// Set to false to disable verbose serial debug output
const SERIAL_DEBUG = true
function dbg(...args: unknown[]) { if (SERIAL_DEBUG) console.log('[SERIAL-DEBUG]', ...args) }
// ─────────────────────────────────────────────────────────────────────────────

export class SerialManager {
  private port: SerialPort | null = null
  private config: SerialConfig | null = null
  private win: BrowserWindow | null = null
  private reconnectTimer: NodeJS.Timeout | null = null
  private lastSentAt: number = 0
  private lastReadAt: string | null = null

  // Stability tracking
  private stableValue: number | null = null
  private stableSince: number = 0   // timestamp when value first held steady

  // Last parsed weight (used by readNow)
  private lastParsed: { raw: string; value: number | null; stable: boolean } | null = null

  setWindow(win: BrowserWindow): void {
    this.win = win
  }

  async connect(config: SerialConfig): Promise<void> {
    if (this.port?.isOpen) {
      await this.disconnect()
    }

    this.config = config

    dbg(`Intentando conectar a puerto=${config.port} baudRate=${config.baudRate} parity=${config.parity}`)
    dbg(`Regex configurado: "${config.weightRegex}"`)

    return new Promise((resolve, reject) => {
      const sp = new SerialPort({
        path: config.port,
        baudRate: config.baudRate,
        dataBits: config.dataBits,
        stopBits: config.stopBits as 1 | 1.5 | 2,
        parity: config.parity,
        autoOpen: false,
      })

      const delimChar = DELIMITER_BYTES[config.delimiter] ?? '\r'
      const parser = sp.pipe(new ReadlineParser({ delimiter: delimChar }))

      sp.open((err) => {
        if (err) {
          console.error(`[SERIAL-DEBUG] ERROR al abrir puerto ${config.port}:`, err.message)
          this.emitStatus({ connected: false, portName: config.port, error: err.message, lastReadAt: null })
          this.emitMaint('CONEXION', 'error', `Error al abrir ${config.port}`, err.message)
          return reject(err)
        }
        this.port = sp
        this.emitStatus({ connected: true, portName: config.port, error: null, lastReadAt: null })
        this.emitMaint('CONEXION', 'ok', `Conectado a ${config.port}`, `${config.port} @ ${config.baudRate} baud | regex: ${config.weightRegex}`)
        console.log(`[Serial] Connected to ${config.port}`)
        dbg(`Puerto ${config.port} abierto correctamente. win=${this.win ? 'OK' : 'NULL ⚠️'}`)
        resolve()
      })

      // DEBUG: escuchar datos RAW antes del parser (bytes crudos)
      sp.on('data', (chunk: Buffer) => {
        dbg(`RAW bytes (${chunk.length}B): ${JSON.stringify(chunk.toString())}`)
        this.emitMaint('BYTES_CRUDOS', 'ok', `${chunk.length} bytes recibidos`, JSON.stringify(chunk.toString()))
      })

      parser.on('data', (line: string) => {
        this.lastReadAt = new Date().toISOString()
        const now = Date.now()

        dbg(`LINEA RECIBIDA: "${line}" | hex=[${Buffer.from(line).toString('hex')}]`)
        this.emitMaint('LINEA', 'ok', `Línea recibida del parser`, `"${line.trim()}" [hex: ${Buffer.from(line.trim()).toString('hex')}]`)

        if (now - this.lastSentAt < THROTTLE_MS) {
          dbg(`  → THROTTLED (han pasado ${now - this.lastSentAt}ms de ${THROTTLE_MS}ms mínimo)`)
          return
        }
        this.lastSentAt = now

        const parsed = parseWeight(line, config.weightRegex)
        dbg(`  → parseWeight resultado: value=${parsed.value} raw="${parsed.raw}"`)

        if (parsed.value === null) {
          this.emitMaint('REGEX', 'warn', `Sin coincidencia con regex`, `Entrada: "${parsed.raw}" | Regex: ${config.weightRegex}`)
        } else {
          this.emitMaint('REGEX', 'ok', `Valor extraído: ${parsed.value}`, `match en "${parsed.raw}" → ${parsed.value}`)
        }

        // Time-based stability: value must be > 0 and hold for STABLE_HOLD_MS
        if (parsed.value !== null && parsed.value > 0) {
          if (
            this.stableValue !== null &&
            Math.abs(parsed.value - this.stableValue) <= STABLE_EPSILON
          ) {
            // Same value — check if it's been steady long enough
            parsed.stable = (now - this.stableSince) >= STABLE_HOLD_MS
            const held = now - this.stableSince
            dbg(`  → MISMO VALOR (${parsed.value}), estable desde hace ${held}ms, stable=${parsed.stable}`)
            if (parsed.stable) {
              this.emitMaint('ESTABILIDAD', 'ok', `Valor estable: ${parsed.value}`, `Sostenido por ${held}ms (requerido: ${STABLE_HOLD_MS}ms)`)
            } else {
              this.emitMaint('ESTABILIDAD', 'warn', `Oscilando: ${parsed.value}`, `${held}ms de ${STABLE_HOLD_MS}ms requeridos`)
            }
          } else {
            // New or changed value — reset the stability timer
            this.stableValue = parsed.value
            this.stableSince = now
            parsed.stable = false
            dbg(`  → VALOR NUEVO o CAMBIÓ a ${parsed.value}, reiniciando timer de estabilidad`)
            this.emitMaint('ESTABILIDAD', 'warn', `Valor nuevo: ${parsed.value}`, `Timer de estabilidad reiniciado`)
          }
        } else {
          // Zero or null → reset stability
          this.stableValue = null
          this.stableSince = 0
          parsed.stable = false
          dbg(`  → VALOR CERO o NULO (value=${parsed.value}), estabilidad reseteada`)
          this.emitMaint('ESTABILIDAD', 'idle', `Sin peso en pesa`, `value=${parsed.value}`)
        }

        this.lastParsed = { raw: parsed.raw, value: parsed.value, stable: parsed.stable }

        if (!this.win) {
          console.error('[SERIAL-DEBUG] ⚠️ win es NULL — no se puede enviar IPC al renderer!')
        } else if (this.win.isDestroyed()) {
          console.error('[SERIAL-DEBUG] ⚠️ win está DESTRUIDA — no se puede enviar IPC!')
        } else {
          dbg(`  → Enviando IPC serial:weightUpdate: value=${parsed.value} stable=${parsed.stable}`)
          this.emitMaint('IPC', 'ok', `Enviado al renderer`, `value=${parsed.value} stable=${parsed.stable} raw="${parsed.raw}"`)
          this.win.webContents.send('serial:weightUpdate', parsed)
        }
      })

      sp.on('close', () => {
        console.log('[Serial] Port closed')
        dbg(`Puerto ${config.port} cerrado, programando reconexión...`)
        this.emitStatus({ connected: false, portName: config.port, error: null, lastReadAt: this.lastReadAt })
        this.emitMaint('CONEXION', 'idle', `Puerto ${config.port} desconectado`, `Reconectando en ${RECONNECT_MS / 1000}s...`)
        this.port = null
        this.scheduleReconnect()
      })

      sp.on('error', (err) => {
        console.error('[Serial] Error:', err.message)
        console.error('[SERIAL-DEBUG] ⚠️ ERROR en puerto serial:', err.message)
        this.emitStatus({ connected: false, portName: config.port, error: err.message, lastReadAt: this.lastReadAt })
        this.emitMaint('CONEXION', 'error', `Error en puerto serial`, err.message)
      })
    })
  }

  /**
   * Re-emite el último peso leído inmediatamente (sin esperar el throttle).
   * Si el puerto está cerrado, intenta reconectar.
   * Devuelve true si se envió un peso, false si no había lectura disponible.
   */
  readNow(): boolean {
    if (!this.port?.isOpen) {
      // Puerto cerrado — intentar reconectar
      if (this.config) {
        this.connect(this.config).catch(() => {})
      }
      return false
    }
    if (this.lastParsed && this.win && !this.win.isDestroyed()) {
      this.win.webContents.send('serial:weightUpdate', this.lastParsed)
      return true
    }
    return false
  }

  async disconnect(): Promise<void> {
    this.clearReconnect()
    if (this.port?.isOpen) {
      await new Promise<void>((resolve) => this.port!.close(() => resolve()))
    }
    this.port = null
    // Reset stability state so a fresh connection starts clean
    this.stableValue = null
    this.stableSince = 0
  }

  async listPorts(): Promise<AvailablePort[]> {
    const ports = await SerialPort.list()
    return ports.map((p) => ({
      path: p.path,
      manufacturer: p.manufacturer,
      serialNumber: p.serialNumber,
    }))
  }

  /** Opens port briefly, captures one raw line, then closes. */
  async testConnection(config: SerialConfig): Promise<string | null> {
    return new Promise((resolve) => {
      const sp = new SerialPort({ path: config.port, baudRate: config.baudRate, autoOpen: false })
      const delimChar = DELIMITER_BYTES[config.delimiter] ?? '\r'
      const parser = sp.pipe(new ReadlineParser({ delimiter: delimChar }))
      const timeout = setTimeout(() => { sp.close(); resolve(null) }, 3000)

      parser.once('data', (line: string) => {
        clearTimeout(timeout)
        sp.close()
        resolve(line.trim())
      })

      sp.open((err) => {
        if (err) { clearTimeout(timeout); resolve(null) }
      })
    })
  }

  private scheduleReconnect(): void {
    if (!this.config) return
    this.clearReconnect()
    console.log(`[Serial] Reconnecting in ${RECONNECT_MS}ms...`)
    this.reconnectTimer = setTimeout(() => {
      if (this.config) this.connect(this.config).catch(() => { })
    }, RECONNECT_MS)
  }

  private clearReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
  }

  private emitStatus(status: SerialStatus): void {
    this.win?.webContents.send('serial:statusChange', status)
  }

  private emitMaint(phase: MaintenancePhase, status: MaintenanceStatus, message: string, detail?: string): void {
    if (!this.win || this.win.isDestroyed()) return
    const event: MaintenanceEvent = { phase, status, message, detail, ts: Date.now() }
    this.win.webContents.send('maintenance:event', event)
  }
}

export const serialManager = new SerialManager()

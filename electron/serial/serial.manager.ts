import { SerialPort } from 'serialport'
import { ReadlineParser } from '@serialport/parser-readline'
import type { BrowserWindow } from 'electron'
import type { SerialConfig, SerialStatus, AvailablePort } from './serial.types'
import { DELIMITER_BYTES } from './serial.types'
import type { MaintenanceEvent, MaintenancePhase, MaintenanceStatus } from '../../src/types'
import { parseWeight } from './serial.parser'

const THROTTLE_MS = 100
const RECONNECT_MS = 5000
const STABLE_HOLD_MS = 1000
const STABLE_EPSILON = 0.001

const SERIAL_DEBUG = true
function dbg(...args: unknown[]) { if (SERIAL_DEBUG) console.log('[SERIAL-DEBUG]', ...args) }

export class SerialManager {
  private scaleId: 1 | 2
  private port: SerialPort | null = null
  private config: SerialConfig | null = null
  private win: BrowserWindow | null = null
  private reconnectTimer: NodeJS.Timeout | null = null
  private lastSentAt: number = 0
  private lastReadAt: string | null = null

  private stableValue: number | null = null
  private stableSince: number = 0

  private lastParsed: { raw: string; value: number | null; stable: boolean } | null = null

  constructor(scaleId: 1 | 2) {
    this.scaleId = scaleId
  }

  setWindow(win: BrowserWindow): void {
    this.win = win
  }

  async connect(config: SerialConfig): Promise<void> {
    if (this.port?.isOpen) {
      await this.disconnect()
    }

    this.config = config

    dbg(`[PESA${this.scaleId}] Intentando conectar a puerto=${config.port} baudRate=${config.baudRate}`)
    dbg(`[PESA${this.scaleId}] Regex configurado: "${config.weightRegex}"`)

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
          console.error(`[SERIAL-DEBUG] [PESA${this.scaleId}] ERROR al abrir puerto ${config.port}:`, err.message)
          this.emitStatus({ connected: false, portName: config.port, error: err.message, lastReadAt: null })
          this.emitMaint('CONEXION', 'error', `Error al abrir ${config.port}`, err.message)
          return reject(err)
        }
        this.port = sp
        this.emitStatus({ connected: true, portName: config.port, error: null, lastReadAt: null })
        this.emitMaint('CONEXION', 'ok', `Conectado a ${config.port}`, `${config.port} @ ${config.baudRate} baud | regex: ${config.weightRegex}`)
        console.log(`[Serial][PESA${this.scaleId}] Connected to ${config.port}`)
        dbg(`[PESA${this.scaleId}] Puerto ${config.port} abierto. win=${this.win ? 'OK' : 'NULL ⚠️'}`)
        resolve()
      })

      sp.on('data', (chunk: Buffer) => {
        dbg(`[PESA${this.scaleId}] RAW bytes (${chunk.length}B): ${JSON.stringify(chunk.toString())}`)
        this.emitMaint('BYTES_CRUDOS', 'ok', `${chunk.length} bytes recibidos`, JSON.stringify(chunk.toString()))
      })

      parser.on('data', (line: string) => {
        this.lastReadAt = new Date().toISOString()
        const now = Date.now()

        dbg(`[PESA${this.scaleId}] LINEA RECIBIDA: "${line}"`)
        this.emitMaint('LINEA', 'ok', `Línea recibida del parser`, `"${line.trim()}" [hex: ${Buffer.from(line.trim()).toString('hex')}]`)

        if (now - this.lastSentAt < THROTTLE_MS) {
          dbg(`[PESA${this.scaleId}] → THROTTLED`)
          return
        }
        this.lastSentAt = now

        const parsed = parseWeight(line, config.weightRegex)
        dbg(`[PESA${this.scaleId}] → parseWeight: value=${parsed.value} raw="${parsed.raw}"`)

        if (parsed.value === null) {
          this.emitMaint('REGEX', 'warn', `Sin coincidencia con regex`, `Entrada: "${parsed.raw}" | Regex: ${config.weightRegex}`)
        } else {
          this.emitMaint('REGEX', 'ok', `Valor extraído: ${parsed.value}`, `match en "${parsed.raw}" → ${parsed.value}`)
        }

        if (parsed.value !== null && parsed.value > 0) {
          if (
            this.stableValue !== null &&
            Math.abs(parsed.value - this.stableValue) <= STABLE_EPSILON
          ) {
            parsed.stable = (now - this.stableSince) >= STABLE_HOLD_MS
            const held = now - this.stableSince
            if (parsed.stable) {
              this.emitMaint('ESTABILIDAD', 'ok', `Valor estable: ${parsed.value}`, `Sostenido por ${held}ms`)
            } else {
              this.emitMaint('ESTABILIDAD', 'warn', `Oscilando: ${parsed.value}`, `${held}ms de ${STABLE_HOLD_MS}ms requeridos`)
            }
          } else {
            this.stableValue = parsed.value
            this.stableSince = now
            parsed.stable = false
            this.emitMaint('ESTABILIDAD', 'warn', `Valor nuevo: ${parsed.value}`, `Timer de estabilidad reiniciado`)
          }
        } else {
          this.stableValue = null
          this.stableSince = 0
          parsed.stable = false
          this.emitMaint('ESTABILIDAD', 'idle', `Sin peso en pesa`, `value=${parsed.value}`)
        }

        this.lastParsed = { raw: parsed.raw, value: parsed.value, stable: parsed.stable }

        if (!this.win || this.win.isDestroyed()) {
          console.error(`[SERIAL-DEBUG] [PESA${this.scaleId}] ⚠️ win no disponible`)
        } else {
          this.emitMaint('IPC', 'ok', `Enviado al renderer`, `value=${parsed.value} stable=${parsed.stable}`)
          this.win.webContents.send(`serial:weightUpdate:${this.scaleId}`, parsed)
        }
      })

      sp.on('close', () => {
        console.log(`[Serial][PESA${this.scaleId}] Port closed`)
        this.emitStatus({ connected: false, portName: config.port, error: null, lastReadAt: this.lastReadAt })
        this.emitMaint('CONEXION', 'idle', `Puerto ${config.port} desconectado`, `Reconectando en ${RECONNECT_MS / 1000}s...`)
        this.port = null
        this.scheduleReconnect()
      })

      sp.on('error', (err) => {
        console.error(`[Serial][PESA${this.scaleId}] Error:`, err.message)
        this.emitStatus({ connected: false, portName: config.port, error: err.message, lastReadAt: this.lastReadAt })
        this.emitMaint('CONEXION', 'error', `Error en puerto serial`, err.message)
      })
    })
  }

  readNow(): boolean {
    if (!this.port?.isOpen) {
      if (this.config) this.connect(this.config).catch(() => { })
      return false
    }
    if (this.lastParsed && this.win && !this.win.isDestroyed()) {
      this.win.webContents.send(`serial:weightUpdate:${this.scaleId}`, this.lastParsed)
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

  async testConnection(config: SerialConfig): Promise<string | null> {
    return new Promise((resolve) => {
      const sp = new SerialPort({ path: config.port, baudRate: config.baudRate, autoOpen: false })
      const delimChar = DELIMITER_BYTES[config.delimiter] ?? '\r'
      const parser = sp.pipe(new ReadlineParser({ delimiter: delimChar }))

      // Avoid uncaught 'error' events if the port encounters an error during testing
      sp.on('error', () => {
        // Safe to ignore as we will handle closing and resolving below
      })

      const timeout = setTimeout(() => {
        if (sp.isOpen) {
          sp.close(() => resolve(null))
        } else {
          resolve(null)
        }
      }, 3000)

      parser.once('data', (line: string) => {
        clearTimeout(timeout)
        if (sp.isOpen) {
          sp.close(() => resolve(line.trim()))
        } else {
          resolve(line.trim())
        }
      })

      sp.open((err) => {
        if (err) {
          clearTimeout(timeout)
          resolve(null)
        }
      })
    })
  }

  private scheduleReconnect(): void {
    if (!this.config) return
    this.clearReconnect()
    console.log(`[Serial][PESA${this.scaleId}] Reconnecting in ${RECONNECT_MS}ms...`)
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
    this.win?.webContents.send(`serial:statusChange:${this.scaleId}`, status)
  }

  private emitMaint(phase: MaintenancePhase, status: MaintenanceStatus, message: string, detail?: string): void {
    if (!this.win || this.win.isDestroyed()) return
    const event: MaintenanceEvent = { phase, status, message, detail, ts: Date.now(), scaleId: this.scaleId }
    this.win.webContents.send('maintenance:event', event)
  }
}

export const serialManager1 = new SerialManager(1)
export const serialManager2 = new SerialManager(2)

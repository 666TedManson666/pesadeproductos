import { SerialPort } from 'serialport'
import { ReadlineParser } from '@serialport/parser-readline'
import type { BrowserWindow } from 'electron'
import type { SerialConfig, SerialStatus, AvailablePort } from './serial.types'
import { parseWeight } from './serial.parser'

const THROTTLE_MS = 100  // max 10 readings/sec to renderer
const RECONNECT_MS = 5000
const STABLE_HOLD_MS = 1000 // value must be steady for 1 second to be "stable"
const STABLE_EPSILON = 0.001 // tolerance for "same value" comparison (kg)

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

  setWindow(win: BrowserWindow): void {
    this.win = win
  }

  async connect(config: SerialConfig): Promise<void> {
    if (this.port?.isOpen) {
      await this.disconnect()
    }

    this.config = config

    return new Promise((resolve, reject) => {
      const sp = new SerialPort({
        path: config.port,
        baudRate: config.baudRate,
        dataBits: config.dataBits,
        stopBits: config.stopBits as 1 | 1.5 | 2,
        parity: config.parity,
        autoOpen: false,
      })

      const parser = sp.pipe(new ReadlineParser({ delimiter: '\n' }))

      sp.open((err) => {
        if (err) {
          this.emitStatus({ connected: false, portName: config.port, error: err.message, lastReadAt: null })
          return reject(err)
        }
        this.port = sp
        this.emitStatus({ connected: true, portName: config.port, error: null, lastReadAt: null })
        console.log(`[Serial] Connected to ${config.port}`)
        resolve()
      })

      parser.on('data', (line: string) => {
        this.lastReadAt = new Date().toISOString()
        const now = Date.now()
        if (now - this.lastSentAt < THROTTLE_MS) return
        this.lastSentAt = now

        const parsed = parseWeight(line, config.weightRegex)

        // Time-based stability: value must be > 0 and hold for STABLE_HOLD_MS
        if (parsed.value !== null && parsed.value > 0) {
          if (
            this.stableValue !== null &&
            Math.abs(parsed.value - this.stableValue) <= STABLE_EPSILON
          ) {
            // Same value — check if it's been steady long enough
            parsed.stable = (now - this.stableSince) >= STABLE_HOLD_MS
          } else {
            // New or changed value — reset the stability timer
            this.stableValue = parsed.value
            this.stableSince = now
            parsed.stable = false
          }
        } else {
          // Zero or null → reset stability
          this.stableValue = null
          this.stableSince = 0
          parsed.stable = false
        }

        this.win?.webContents.send('serial:weightUpdate', parsed)
      })

      sp.on('close', () => {
        console.log('[Serial] Port closed')
        this.emitStatus({ connected: false, portName: config.port, error: null, lastReadAt: this.lastReadAt })
        this.port = null
        this.scheduleReconnect()
      })

      sp.on('error', (err) => {
        console.error('[Serial] Error:', err.message)
        this.emitStatus({ connected: false, portName: config.port, error: err.message, lastReadAt: this.lastReadAt })
      })
    })
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
      const parser = sp.pipe(new ReadlineParser({ delimiter: '\n' }))
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
}

export const serialManager = new SerialManager()

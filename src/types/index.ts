// ─── Domain Models ────────────────────────────────────────────────────────────

export interface Agency {
  id:   number
  name: string
}

export interface Warehouse {
  id:         number
  code:       string
  name:       string
  agencyId:   number
  agencyName: string
  type:       'RUTA' | 'PRINCIPAL' | 'PRODUCCION'
  active:     boolean
}

export interface Product {
  id:     number
  code:   string
  name:   string
  active: boolean
}

export interface Session {
  id:            number
  warehouseId:   number
  warehouseName: string
  openedAt:      string
  closedAt:      string | null
  notes:         string | null
}

export interface Weighing {
  id:            number
  sessionId:     number | null
  warehouseId:   number
  warehouseName: string
  productId:     number
  productName:   string
  productCode:   string
  weightKg:      number
  capturedAt:    string
  mode:          'SESSION' | 'QUICK'
  rawData:       string | null
}

export interface WeighingsSummary {
  productId:   number
  productName: string
  totalKg:     number
  count:       number
}

// ─── Serial ───────────────────────────────────────────────────────────────────

export interface SerialStatus {
  connected:  boolean
  portName:   string | null
  error:      string | null
  lastReadAt: string | null
}

export interface ParsedWeight {
  raw:    string
  value:  number | null
  stable: boolean
}

// ─── IPC Payloads ─────────────────────────────────────────────────────────────

export interface CaptureWeightPayload {
  warehouseId: number
  productId:   number
  weightKg:    number
  sessionId?:  number
  mode:        'SESSION' | 'QUICK'
  rawData?:    string
}

export interface GetWeighingsPayload {
  dateFrom?:    string
  dateTo?:      string
  warehouseId?: number
  productId?:   number
  agencyId?:    number
  sessionId?:   number
  limit?:       number
  offset?:      number
}

export interface OpenSessionPayload {
  warehouseId: number
  notes?:      string
}

export type SettingsMap = Record<string, string>

export interface IpcResponse<T = unknown> {
  success: boolean
  data?:   T
  error?:  string
}

export interface AvailablePort {
  path:         string
  manufacturer: string | undefined
  serialNumber: string | undefined
}

export interface SerialConfig {
  port:        string
  baudRate:    number
  dataBits:    5 | 6 | 7 | 8
  stopBits:    1 | 1.5 | 2
  parity:      'none' | 'even' | 'odd' | 'mark' | 'space'
  weightRegex: string
  unit:        'kg' | 'lb'
}

export interface SerialConfig {
  port:         string
  baudRate:     number
  dataBits:     5 | 6 | 7 | 8
  stopBits:     1 | 1.5 | 2
  parity:       'none' | 'even' | 'odd' | 'mark' | 'space'
  weightRegex:  string
  unit:         'kg' | 'lb'
}

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

export interface AvailablePort {
  path:         string
  manufacturer: string | undefined
  serialNumber: string | undefined
}

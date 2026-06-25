import { create } from 'zustand'
import type { SerialConfig, SettingsMap } from '../types'
import { settingsApi } from '../api/electron.api'

const DEFAULT_CONFIG: SerialConfig = {
  port:        'COM3',
  baudRate:    9600,
  dataBits:    8,
  stopBits:    1,
  parity:      'none',
  delimiter:   'CR',
  weightRegex: '([0-9]+\\.?[0-9]*)',
  unit:        'kg',
}

const DEFAULT_CONFIG2: SerialConfig = {
  port:        'COM4',
  baudRate:    9600,
  dataBits:    8,
  stopBits:    1,
  parity:      'none',
  delimiter:   'CR',
  weightRegex: '([0-9]+\\.?[0-9]*)',
  unit:        'kg',
}

function mapToConfig(s: SettingsMap): SerialConfig {
  return {
    port:        s['serial.port']        ?? DEFAULT_CONFIG.port,
    baudRate:    Number(s['serial.baudRate'] ?? DEFAULT_CONFIG.baudRate),
    dataBits:    Number(s['serial.dataBits'] ?? DEFAULT_CONFIG.dataBits) as 5 | 6 | 7 | 8,
    stopBits:    Number(s['serial.stopBits'] ?? DEFAULT_CONFIG.stopBits) as 1 | 1.5 | 2,
    parity:      (s['serial.parity']     ?? DEFAULT_CONFIG.parity)      as SerialConfig['parity'],
    delimiter:   (s['serial.delimiter']  ?? DEFAULT_CONFIG.delimiter)   as SerialConfig['delimiter'],
    weightRegex: s['serial.weightRegex'] ?? DEFAULT_CONFIG.weightRegex,
    unit:        (s['serial.unit']       ?? DEFAULT_CONFIG.unit)        as 'kg' | 'lb',
  }
}

function mapToConfig2(s: SettingsMap): SerialConfig {
  return {
    port:        s['scale2.serial.port']        ?? DEFAULT_CONFIG2.port,
    baudRate:    Number(s['scale2.serial.baudRate'] ?? DEFAULT_CONFIG2.baudRate),
    dataBits:    Number(s['scale2.serial.dataBits'] ?? DEFAULT_CONFIG2.dataBits) as 5 | 6 | 7 | 8,
    stopBits:    Number(s['scale2.serial.stopBits'] ?? DEFAULT_CONFIG2.stopBits) as 1 | 1.5 | 2,
    parity:      (s['scale2.serial.parity']     ?? DEFAULT_CONFIG2.parity)      as SerialConfig['parity'],
    delimiter:   (s['scale2.serial.delimiter']  ?? DEFAULT_CONFIG2.delimiter)   as SerialConfig['delimiter'],
    weightRegex: s['scale2.serial.weightRegex'] ?? DEFAULT_CONFIG2.weightRegex,
    unit:        (s['scale2.serial.unit']       ?? DEFAULT_CONFIG2.unit)        as 'kg' | 'lb',
  }
}

interface SettingsStore {
  serialConfig:      SerialConfig
  serialConfig2:     SerialConfig
  loaded:            boolean
  loadSettings:      () => Promise<void>
  saveSerialConfig:  (config: SerialConfig) => Promise<void>
  saveSerialConfig2: (config: SerialConfig) => Promise<void>
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  serialConfig:  DEFAULT_CONFIG,
  serialConfig2: DEFAULT_CONFIG2,
  loaded:        false,

  loadSettings: async () => {
    const res = await settingsApi.getAll()
    if (res.success && res.data) {
      const s = res.data as SettingsMap
      set({ serialConfig: mapToConfig(s), serialConfig2: mapToConfig2(s), loaded: true })
    }
  },

  saveSerialConfig: async (config: SerialConfig) => {
    const partial: SettingsMap = {
      'serial.port':        config.port,
      'serial.baudRate':    String(config.baudRate),
      'serial.dataBits':    String(config.dataBits),
      'serial.stopBits':    String(config.stopBits),
      'serial.parity':      config.parity,
      'serial.delimiter':   config.delimiter,
      'serial.weightRegex': config.weightRegex,
      'serial.unit':        config.unit,
    }
    await settingsApi.save(partial)
    set({ serialConfig: config })
  },

  saveSerialConfig2: async (config: SerialConfig) => {
    const partial: SettingsMap = {
      'scale2.serial.port':        config.port,
      'scale2.serial.baudRate':    String(config.baudRate),
      'scale2.serial.dataBits':    String(config.dataBits),
      'scale2.serial.stopBits':    String(config.stopBits),
      'scale2.serial.parity':      config.parity,
      'scale2.serial.delimiter':   config.delimiter,
      'scale2.serial.weightRegex': config.weightRegex,
      'scale2.serial.unit':        config.unit,
    }
    await settingsApi.save(partial)
    set({ serialConfig2: config })
  },
}))

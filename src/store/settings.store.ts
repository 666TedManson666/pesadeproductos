import { create } from 'zustand'
import type { SerialConfig, SettingsMap } from '../types'
import { settingsApi } from '../api/electron.api'

const DEFAULT_CONFIG: SerialConfig = {
  port:        'COM3',
  baudRate:    9600,
  dataBits:    8,
  stopBits:    1,
  parity:      'none',
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
    weightRegex: s['serial.weightRegex'] ?? DEFAULT_CONFIG.weightRegex,
    unit:        (s['serial.unit']       ?? DEFAULT_CONFIG.unit)        as 'kg' | 'lb',
  }
}

interface SettingsStore {
  serialConfig: SerialConfig
  loaded:       boolean
  loadSettings: () => Promise<void>
  saveSerialConfig: (config: SerialConfig) => Promise<void>
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  serialConfig: DEFAULT_CONFIG,
  loaded:       false,

  loadSettings: async () => {
    const res = await settingsApi.getAll()
    if (res.success && res.data) {
      set({ serialConfig: mapToConfig(res.data as SettingsMap), loaded: true })
    }
  },

  saveSerialConfig: async (config: SerialConfig) => {
    const partial: SettingsMap = {
      'serial.port':        config.port,
      'serial.baudRate':    String(config.baudRate),
      'serial.dataBits':    String(config.dataBits),
      'serial.stopBits':    String(config.stopBits),
      'serial.parity':      config.parity,
      'serial.weightRegex': config.weightRegex,
      'serial.unit':        config.unit,
    }
    await settingsApi.save(partial)
    set({ serialConfig: config })
  },
}))

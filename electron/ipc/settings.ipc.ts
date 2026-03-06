import { ipcMain } from 'electron'
import { getAllSettings, saveSettings } from '../repositories/settings.repository'
import { serialManager } from '../serial/serial.manager'
import type { SerialConfig, AvailablePort } from '../serial/serial.types'
import type { IpcResponse, SettingsMap } from '../../src/types'

function settingsToConfig(s: SettingsMap): SerialConfig {
  return {
    port:        s['serial.port']        ?? 'COM3',
    baudRate:    Number(s['serial.baudRate'] ?? 9600),
    dataBits:    Number(s['serial.dataBits'] ?? 8)    as 5 | 6 | 7 | 8,
    stopBits:    Number(s['serial.stopBits'] ?? 1)    as 1 | 1.5 | 2,
    parity:      (s['serial.parity']     ?? 'none')   as SerialConfig['parity'],
    weightRegex: s['serial.weightRegex'] ?? '([0-9]+\\.?[0-9]*)',
    unit:        (s['serial.unit']       ?? 'kg')     as 'kg' | 'lb',
  }
}

export function registerSettingsHandlers(): void {
  ipcMain.handle('settings:getAll', async (): Promise<IpcResponse<unknown>> => {
    try {
      const data = await getAllSettings()
      return { success: true, data }
    } catch (err) {
      return { success: false, error: (err as Error).message }
    }
  })

  ipcMain.handle('settings:save', async (_e, partial: SettingsMap): Promise<IpcResponse<unknown>> => {
    try {
      await saveSettings(partial)
      return { success: true }
    } catch (err) {
      return { success: false, error: (err as Error).message }
    }
  })

  ipcMain.handle('serial:listPorts', async (): Promise<IpcResponse<AvailablePort[]>> => {
    try {
      const data = await serialManager.listPorts()
      return { success: true, data }
    } catch (err) {
      return { success: false, error: (err as Error).message }
    }
  })

  ipcMain.handle('serial:connect', async (_e, config: SerialConfig): Promise<IpcResponse<unknown>> => {
    try {
      await serialManager.connect(config)
      return { success: true }
    } catch (err) {
      return { success: false, error: (err as Error).message }
    }
  })

  ipcMain.handle('serial:disconnect', async (): Promise<IpcResponse<unknown>> => {
    try {
      await serialManager.disconnect()
      return { success: true }
    } catch (err) {
      return { success: false, error: (err as Error).message }
    }
  })

  ipcMain.handle('serial:testConnection', async (_e, config: SerialConfig): Promise<IpcResponse<unknown>> => {
    try {
      const rawSample = await serialManager.testConnection(config)
      return { success: true, data: { rawSample } }
    } catch (err) {
      return { success: false, error: (err as Error).message }
    }
  })

  ipcMain.handle('serial:connectFromSettings', async (): Promise<IpcResponse<unknown>> => {
    try {
      const settings = await getAllSettings()
      const config = settingsToConfig(settings)
      await serialManager.connect(config)
      return { success: true }
    } catch (err) {
      return { success: false, error: (err as Error).message }
    }
  })
}

export { settingsToConfig }

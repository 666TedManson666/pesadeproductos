import { ipcMain } from 'electron'
import { getAllSettings, saveSettings } from '../repositories/settings.repository'
import { serialManager1, serialManager2 } from '../serial/serial.manager'
import type { SerialConfig, AvailablePort } from '../serial/serial.types'
import type { IpcResponse, SettingsMap } from '../../src/types'

function settingsToConfig(s: SettingsMap): SerialConfig {
  return {
    port:        s['serial.port']        ?? 'COM3',
    baudRate:    Number(s['serial.baudRate'] ?? 9600),
    dataBits:    Number(s['serial.dataBits'] ?? 8)    as 5 | 6 | 7 | 8,
    stopBits:    Number(s['serial.stopBits'] ?? 1)    as 1 | 1.5 | 2,
    parity:      (s['serial.parity']     ?? 'none')   as SerialConfig['parity'],
    delimiter:   (s['serial.delimiter']  ?? 'CR')     as SerialConfig['delimiter'],
    weightRegex: s['serial.weightRegex'] ?? '([0-9]+\\.?[0-9]*)',
    unit:        (s['serial.unit']       ?? 'kg')     as 'kg' | 'lb',
  }
}

function settingsToConfig2(s: SettingsMap): SerialConfig {
  return {
    port:        s['scale2.serial.port']        ?? 'COM4',
    baudRate:    Number(s['scale2.serial.baudRate'] ?? 9600),
    dataBits:    Number(s['scale2.serial.dataBits'] ?? 8)   as 5 | 6 | 7 | 8,
    stopBits:    Number(s['scale2.serial.stopBits'] ?? 1)   as 1 | 1.5 | 2,
    parity:      (s['scale2.serial.parity']     ?? 'none')  as SerialConfig['parity'],
    delimiter:   (s['scale2.serial.delimiter']  ?? 'CR')    as SerialConfig['delimiter'],
    weightRegex: s['scale2.serial.weightRegex'] ?? '([0-9]+\\.?[0-9]*)',
    unit:        (s['scale2.serial.unit']       ?? 'kg')    as 'kg' | 'lb',
  }
}

export function registerSettingsHandlers(): void {
  // ── Settings CRUD ─────────────────────────────────────────────────────────────
  ipcMain.handle('settings:getAll', async (): Promise<IpcResponse<unknown>> => {
    try   { return { success: true,  data: await getAllSettings() } }
    catch (err) { return { success: false, error: (err as Error).message } }
  })

  ipcMain.handle('settings:save', async (_e, partial: SettingsMap): Promise<IpcResponse<unknown>> => {
    try   { await saveSettings(partial); return { success: true } }
    catch (err) { return { success: false, error: (err as Error).message } }
  })

  // ── Port list + test (shared, stateless) ──────────────────────────────────────
  ipcMain.handle('serial:listPorts', async (): Promise<IpcResponse<AvailablePort[]>> => {
    try   { return { success: true, data: await serialManager1.listPorts() } }
    catch (err) { return { success: false, error: (err as Error).message } }
  })

  ipcMain.handle('serial:testConnection', async (_e, config: SerialConfig): Promise<IpcResponse<unknown>> => {
    try   { return { success: true, data: { rawSample: await serialManager1.testConnection(config) } } }
    catch (err) { return { success: false, error: (err as Error).message } }
  })

  // ── Scale 1 IPC ───────────────────────────────────────────────────────────────
  ipcMain.handle('serial:connect:1', async (_e, config: SerialConfig): Promise<IpcResponse<unknown>> => {
    try   { await serialManager1.connect(config); return { success: true } }
    catch (err) { return { success: false, error: (err as Error).message } }
  })

  ipcMain.handle('serial:disconnect:1', async (): Promise<IpcResponse<unknown>> => {
    try   { await serialManager1.disconnect(); return { success: true } }
    catch (err) { return { success: false, error: (err as Error).message } }
  })

  ipcMain.handle('serial:readNow:1', (): IpcResponse<{ sent: boolean }> => {
    return { success: true, data: { sent: serialManager1.readNow() } }
  })

  ipcMain.handle('serial:connectFromSettings:1', async (): Promise<IpcResponse<unknown>> => {
    try {
      const s = await getAllSettings()
      await serialManager1.connect(settingsToConfig(s))
      return { success: true }
    } catch (err) { return { success: false, error: (err as Error).message } }
  })

  // ── Scale 2 IPC ───────────────────────────────────────────────────────────────
  ipcMain.handle('serial:connect:2', async (_e, config: SerialConfig): Promise<IpcResponse<unknown>> => {
    try   { await serialManager2.connect(config); return { success: true } }
    catch (err) { return { success: false, error: (err as Error).message } }
  })

  ipcMain.handle('serial:disconnect:2', async (): Promise<IpcResponse<unknown>> => {
    try   { await serialManager2.disconnect(); return { success: true } }
    catch (err) { return { success: false, error: (err as Error).message } }
  })

  ipcMain.handle('serial:readNow:2', (): IpcResponse<{ sent: boolean }> => {
    return { success: true, data: { sent: serialManager2.readNow() } }
  })

  ipcMain.handle('serial:connectFromSettings:2', async (): Promise<IpcResponse<unknown>> => {
    try {
      const s = await getAllSettings()
      await serialManager2.connect(settingsToConfig2(s))
      return { success: true }
    } catch (err) { return { success: false, error: (err as Error).message } }
  })
}

export { settingsToConfig, settingsToConfig2 }

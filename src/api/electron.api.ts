/**
 * Typed wrappers over window.electronAPI.
 * All functions return typed IpcResponse<T>.
 */
import type {
  Product, Warehouse, Session, Weighing, WeighingsSummary,
  CaptureWeightPayload, GetWeighingsPayload, OpenSessionPayload,
  SettingsMap, IpcResponse, AvailablePort, SerialConfig,
} from '../types'

// Re-export the global electronAPI as a typed module
const api = () => (window as unknown as { electronAPI: Window['electronAPI'] }).electronAPI

export const productsApi = {
  getAll: (): Promise<IpcResponse<Product[]>> =>
    api().products.getAll() as Promise<IpcResponse<Product[]>>,
}

export const warehousesApi = {
  getAll: (): Promise<IpcResponse<Warehouse[]>> =>
    api().warehouses.getAll() as Promise<IpcResponse<Warehouse[]>>,
}

export const sessionsApi = {
  open:      (p: OpenSessionPayload):    Promise<IpcResponse<Session>>      => api().sessions.open(p)      as Promise<IpcResponse<Session>>,
  close:     (p: { sessionId: number }): Promise<IpcResponse<Session>>      => api().sessions.close(p)     as Promise<IpcResponse<Session>>,
  getActive: ():                         Promise<IpcResponse<Session|null>>  => api().sessions.getActive()  as Promise<IpcResponse<Session|null>>,
}

export const weighingsApi = {
  capture: (p: CaptureWeightPayload): Promise<IpcResponse<Weighing>> =>
    api().weighings.capture(p) as Promise<IpcResponse<Weighing>>,

  getMany: (p: GetWeighingsPayload): Promise<IpcResponse<{ rows: Weighing[]; total: number; summary: WeighingsSummary[] }>> =>
    api().weighings.getMany(p) as Promise<IpcResponse<{ rows: Weighing[]; total: number; summary: WeighingsSummary[] }>>,

  delete: (p: { id: number }): Promise<IpcResponse<void>> =>
    api().weighings.delete(p) as Promise<IpcResponse<void>>,
}

export const settingsApi = {
  getAll:           (): Promise<IpcResponse<SettingsMap>>   => api().settings.getAll()         as Promise<IpcResponse<SettingsMap>>,
  save:             (p: SettingsMap): Promise<IpcResponse<void>> => api().settings.save(p)     as Promise<IpcResponse<void>>,
  connectFromSaved: (): Promise<IpcResponse<void>>          => api().settings.connectFromSaved() as Promise<IpcResponse<void>>,
}

export const serialApi = {
  listPorts:      (): Promise<IpcResponse<AvailablePort[]>>       => api().serial.listPorts(),
  connect:        (p: SerialConfig): Promise<IpcResponse<void>>   => api().serial.connect(p)        as Promise<IpcResponse<void>>,
  disconnect:     (): Promise<IpcResponse<void>>                   => api().serial.disconnect()       as Promise<IpcResponse<void>>,
  testConnection: (p: SerialConfig): Promise<IpcResponse<{ rawSample: string | null }>> =>
    api().serial.testConnection(p) as Promise<IpcResponse<{ rawSample: string | null }>>,
}

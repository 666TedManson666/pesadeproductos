import { contextBridge, ipcRenderer } from 'electron'
import type {
  CaptureWeightPayload,
  GetWeighingsPayload,
  OpenSessionPayload,
  SettingsMap,
  IpcResponse,
  ParsedWeight,
  SerialStatus,
} from '../src/types'
import type { SerialConfig, AvailablePort } from './serial/serial.types'

export interface DbConfigPayload {
  host:     string
  port:     number
  database: string
  user:     string
  password: string
}

const api = {
  weighings: {
    capture: (p: CaptureWeightPayload):    Promise<IpcResponse<unknown>> => ipcRenderer.invoke('weighings:capture', p),
    getMany:  (p: GetWeighingsPayload):    Promise<IpcResponse<unknown>> => ipcRenderer.invoke('weighings:getMany', p),
    delete:   (p: { id: number }):         Promise<IpcResponse<unknown>> => ipcRenderer.invoke('weighings:delete', p),
  },
  sessions: {
    open:      (p: OpenSessionPayload):    Promise<IpcResponse<unknown>> => ipcRenderer.invoke('sessions:open', p),
    close:     (p: { sessionId: number }): Promise<IpcResponse<unknown>> => ipcRenderer.invoke('sessions:close', p),
    getActive: ():                         Promise<IpcResponse<unknown>> => ipcRenderer.invoke('sessions:getActive'),
  },
  products: {
    getAll: (): Promise<IpcResponse<unknown>> => ipcRenderer.invoke('products:getAll'),
  },
  warehouses: {
    getAll: (): Promise<IpcResponse<unknown>> => ipcRenderer.invoke('warehouses:getAll'),
  },
  settings: {
    getAll:           ():               Promise<IpcResponse<unknown>> => ipcRenderer.invoke('settings:getAll'),
    save:             (p: SettingsMap): Promise<IpcResponse<unknown>> => ipcRenderer.invoke('settings:save', p),
    connectFromSaved: ():               Promise<IpcResponse<unknown>> => ipcRenderer.invoke('serial:connectFromSettings'),
  },
  serial: {
    listPorts:      ():                Promise<IpcResponse<AvailablePort[]>> => ipcRenderer.invoke('serial:listPorts'),
    connect:        (p: SerialConfig): Promise<IpcResponse<unknown>>         => ipcRenderer.invoke('serial:connect', p),
    disconnect:     ():                Promise<IpcResponse<unknown>>         => ipcRenderer.invoke('serial:disconnect'),
    testConnection: (p: SerialConfig): Promise<IpcResponse<unknown>>         => ipcRenderer.invoke('serial:testConnection', p),
  },
  app: {
    /** Pull-based: renderer calls this on mount to know if DB is ready */
    getStatus: (): Promise<{ dbReady: boolean }> => ipcRenderer.invoke('app:getStatus'),
  },
  setup: {
    testDb:     (p: DbConfigPayload): Promise<IpcResponse<unknown>> => ipcRenderer.invoke('setup:testDb', p),
    saveDb:     (p: DbConfigPayload): Promise<IpcResponse<unknown>> => ipcRenderer.invoke('setup:saveDb', p),
    getDb:      ():                   Promise<IpcResponse<unknown>> => ipcRenderer.invoke('setup:getDb'),
    notifyDone: ():                   void                          => ipcRenderer.send('app:dbSetupDone'),
  },

  // Push events from main → renderer
  onWeightUpdate: (cb: (w: ParsedWeight) => void): void => { ipcRenderer.on('serial:weightUpdate', (_e, data) => cb(data)) },
  onStatusChange: (cb: (s: SerialStatus) => void): void => { ipcRenderer.on('serial:statusChange', (_e, data) => cb(data)) },
  removeListener: (channel: string):               void => { ipcRenderer.removeAllListeners(channel) },
}

contextBridge.exposeInMainWorld('electronAPI', api)

export type ElectronAPI = typeof api

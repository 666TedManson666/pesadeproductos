import type {
  CaptureWeightPayload,
  GetWeighingsPayload,
  OpenSessionPayload,
  SettingsMap,
  IpcResponse,
  ParsedWeight,
  SerialStatus,
  AvailablePort,
  SerialConfig,
} from './index'

export interface DbConfigPayload {
  host:     string
  port:     number
  database: string
  user:     string
  password: string
}

declare global {
  interface Window {
    electronAPI: {
      weighings: {
        capture: (p: CaptureWeightPayload)   => Promise<IpcResponse>
        getMany:  (p: GetWeighingsPayload)    => Promise<IpcResponse>
        delete:   (p: { id: number })         => Promise<IpcResponse>
      }
      sessions: {
        open:      (p: OpenSessionPayload)    => Promise<IpcResponse>
        close:     (p: { sessionId: number }) => Promise<IpcResponse>
        getActive: ()                          => Promise<IpcResponse>
      }
      products: {
        getAll: () => Promise<IpcResponse>
      }
      warehouses: {
        getAll: () => Promise<IpcResponse>
      }
      settings: {
        getAll:           ()                => Promise<IpcResponse>
        save:             (p: SettingsMap)  => Promise<IpcResponse>
        connectFromSaved: ()                => Promise<IpcResponse>
      }
      serial: {
        listPorts:      ()                  => Promise<IpcResponse<AvailablePort[]>>
        connect:        (p: SerialConfig)   => Promise<IpcResponse>
        disconnect:     ()                  => Promise<IpcResponse>
        testConnection: (p: SerialConfig)   => Promise<IpcResponse>
      }
      setup: {
        testDb:     (p: DbConfigPayload) => Promise<IpcResponse>
        saveDb:     (p: DbConfigPayload) => Promise<IpcResponse>
        getDb:      ()                   => Promise<IpcResponse>
        notifyDone: ()                   => void
      }
      onWeightUpdate:    (cb: (w: ParsedWeight) => void) => void
      onStatusChange:    (cb: (s: SerialStatus) => void) => void
      onDbSetupRequired: (cb: () => void)                => void
      removeListener:    (channel: string)               => void
    }
  }
}

export {}

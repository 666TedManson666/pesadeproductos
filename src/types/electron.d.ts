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
  MaintenanceEvent,
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
      products:   { getAll: () => Promise<IpcResponse> }
      warehouses: { getAll: () => Promise<IpcResponse> }
      settings: {
        getAll:            ()               => Promise<IpcResponse>
        save:              (p: SettingsMap) => Promise<IpcResponse>
        connectFromSaved:  ()               => Promise<IpcResponse>
        connectFromSaved2: ()               => Promise<IpcResponse>
      }
      // Scale 1
      serial: {
        listPorts:      ()                => Promise<IpcResponse<AvailablePort[]>>
        connect:        (p: SerialConfig) => Promise<IpcResponse>
        disconnect:     ()                => Promise<IpcResponse>
        testConnection: (p: SerialConfig) => Promise<IpcResponse>
        readNow:        ()                => Promise<IpcResponse>
      }
      // Scale 2
      serial2: {
        connect:    (p: SerialConfig) => Promise<IpcResponse>
        disconnect: ()                => Promise<IpcResponse>
        readNow:    ()                => Promise<IpcResponse>
      }
      app: {
        getStatus: () => Promise<{ dbReady: boolean }>
      }
      setup: {
        testDb:     (p: DbConfigPayload) => Promise<IpcResponse>
        saveDb:     (p: DbConfigPayload) => Promise<IpcResponse>
        getDb:      ()                   => Promise<IpcResponse>
        notifyDone: ()                   => void
      }
      onWeightUpdate:     (scaleId: 1 | 2, cb: (w: ParsedWeight)     => void) => void
      onStatusChange:     (scaleId: 1 | 2, cb: (s: SerialStatus)     => void) => void
      onMaintenanceEvent: (cb: (e: MaintenanceEvent) => void)                  => void
      removeListener:     (channel: string)                                    => void
    }
  }
}

export {}

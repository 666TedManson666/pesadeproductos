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
      onWeightUpdate:  (cb: (w: ParsedWeight) => void) => void
      onStatusChange:  (cb: (s: SerialStatus) => void) => void
      removeListener:  (channel: string)                => void
    }
  }
}

export {}

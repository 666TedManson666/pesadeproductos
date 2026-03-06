import { ipcMain } from 'electron'
import {
  openSession,
  closeSession,
  getActiveSession,
} from '../repositories/session.repository'
import type { IpcResponse, OpenSessionPayload } from '../../src/types'

export function registerSessionHandlers(): void {
  ipcMain.handle('sessions:open', async (_e, payload: OpenSessionPayload): Promise<IpcResponse<unknown>> => {
    try {
      const data = await openSession(payload)
      return { success: true, data }
    } catch (err) {
      console.error('[IPC] sessions:open', err)
      return { success: false, error: (err as Error).message }
    }
  })

  ipcMain.handle('sessions:close', async (_e, { sessionId }: { sessionId: number }): Promise<IpcResponse<unknown>> => {
    try {
      const data = await closeSession(sessionId)
      return { success: true, data }
    } catch (err) {
      console.error('[IPC] sessions:close', err)
      return { success: false, error: (err as Error).message }
    }
  })

  ipcMain.handle('sessions:getActive', async (): Promise<IpcResponse<unknown>> => {
    try {
      const data = await getActiveSession()
      return { success: true, data }
    } catch (err) {
      console.error('[IPC] sessions:getActive', err)
      return { success: false, error: (err as Error).message }
    }
  })
}

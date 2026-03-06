import { ipcMain } from 'electron'
import {
  captureWeight,
  getWeighings,
  deleteWeighing,
} from '../repositories/weighing.repository'
import type { IpcResponse, CaptureWeightPayload, GetWeighingsPayload } from '../../src/types'

export function registerWeighingHandlers(): void {
  ipcMain.handle('weighings:capture', async (_e, payload: CaptureWeightPayload): Promise<IpcResponse<unknown>> => {
    try {
      const data = await captureWeight(payload)
      return { success: true, data }
    } catch (err) {
      console.error('[IPC] weighings:capture', err)
      return { success: false, error: (err as Error).message }
    }
  })

  ipcMain.handle('weighings:getMany', async (_e, payload: GetWeighingsPayload): Promise<IpcResponse<unknown>> => {
    try {
      const data = await getWeighings(payload)
      return { success: true, data }
    } catch (err) {
      console.error('[IPC] weighings:getMany', err)
      return { success: false, error: (err as Error).message }
    }
  })

  ipcMain.handle('weighings:delete', async (_e, { id }: { id: number }): Promise<IpcResponse<unknown>> => {
    try {
      await deleteWeighing(id)
      return { success: true }
    } catch (err) {
      console.error('[IPC] weighings:delete', err)
      return { success: false, error: (err as Error).message }
    }
  })
}

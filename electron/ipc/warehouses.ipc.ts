import { ipcMain } from 'electron'
import { getAllWarehouses } from '../repositories/warehouse.repository'
import type { IpcResponse } from '../../src/types'

export function registerWarehouseHandlers(): void {
  ipcMain.handle('warehouses:getAll', async (): Promise<IpcResponse<unknown>> => {
    try {
      const data = await getAllWarehouses()
      return { success: true, data }
    } catch (err) {
      console.error('[IPC] warehouses:getAll', err)
      return { success: false, error: (err as Error).message }
    }
  })
}

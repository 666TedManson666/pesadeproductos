import { ipcMain } from 'electron'
import { getAllProducts } from '../repositories/product.repository'
import type { IpcResponse } from '../../src/types'

export function registerProductHandlers(): void {
  ipcMain.handle('products:getAll', async (): Promise<IpcResponse<unknown>> => {
    try {
      const data = await getAllProducts()
      return { success: true, data }
    } catch (err) {
      console.error('[IPC] products:getAll', err)
      return { success: false, error: (err as Error).message }
    }
  })
}

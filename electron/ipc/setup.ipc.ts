import { ipcMain } from 'electron'
import { Pool } from 'pg'
import { loadDbConfig, saveDbConfig } from '../database/db.config'
import { resetPool, getPool } from '../database/connection'
import { runMigrations } from '../database/migrations'
import type { IpcResponse } from '../../src/types'

export interface DbConfigPayload {
  host:     string
  port:     number
  database: string
  user:     string
  password: string
}

export function registerSetupHandlers(): void {

  /** Test a connection with provided credentials (does NOT save) */
  ipcMain.handle('setup:testDb', async (_e, cfg: DbConfigPayload): Promise<IpcResponse<unknown>> => {
    const testPool = new Pool({
      host:                   cfg.host,
      port:                   cfg.port,
      database:               cfg.database,
      user:                   cfg.user,
      password:               cfg.password,
      connectionTimeoutMillis: 4000,
    })
    try {
      const client = await testPool.connect()
      await client.query('SELECT 1')
      client.release()
      return { success: true }
    } catch (err) {
      return { success: false, error: (err as Error).message }
    } finally {
      await testPool.end().catch(() => {})
    }
  })

  /** Save credentials, reset the pool, and run migrations */
  ipcMain.handle('setup:saveDb', async (_e, cfg: DbConfigPayload): Promise<IpcResponse<unknown>> => {
    try {
      saveDbConfig(cfg)
      await resetPool()
      await runMigrations()
      return { success: true }
    } catch (err) {
      return { success: false, error: (err as Error).message }
    }
  })

  /** Return current saved config (password masked) */
  ipcMain.handle('setup:getDb', async (): Promise<IpcResponse<Omit<DbConfigPayload, 'password'> & { passwordSet: boolean }>> => {
    try {
      const cfg = loadDbConfig()
      return {
        success: true,
        data: {
          host:        cfg.host,
          port:        cfg.port,
          database:    cfg.database,
          user:        cfg.user,
          passwordSet: cfg.password.trim().length > 0,
        },
      }
    } catch (err) {
      return { success: false, error: (err as Error).message }
    }
  })
}

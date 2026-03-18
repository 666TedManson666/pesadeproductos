import { Pool } from 'pg'
import { loadDbConfig } from './db.config'

let pool: Pool | null = null

export function getPool(): Pool {
  if (!pool) {
    const cfg = loadDbConfig()
    pool = new Pool({
      host:                    cfg.host,
      port:                    cfg.port,
      database:                cfg.database,
      user:                    cfg.user,
      password:                cfg.password,
      max:                     10,
      idleTimeoutMillis:       30000,
      connectionTimeoutMillis: 2000,
    })

    pool.on('error', (err) => {
      console.error('[DB] Unexpected pool error:', err.message)
    })
  }
  return pool
}

export async function resetPool(): Promise<void> {
  if (pool) {
    await pool.end().catch(() => {})
    pool = null
  }
}

export async function testConnection(): Promise<boolean> {
  try {
    const client = await getPool().connect()
    await client.query('SELECT 1')
    client.release()
    return true
  } catch (err) {
    console.error('[DB] Connection test failed:', err)
    return false
  }
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end()
    pool = null
  }
}

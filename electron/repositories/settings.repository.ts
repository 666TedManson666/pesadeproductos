import { getPool } from '../database/connection'
import type { SettingsMap } from '../../src/types'

export async function getAllSettings(): Promise<SettingsMap> {
  const { rows } = await getPool().query<{ key: string; value: string }>(
    'SELECT key, value FROM settings'
  )
  return Object.fromEntries(rows.map((r) => [r.key, r.value]))
}

export async function saveSettings(partial: SettingsMap): Promise<void> {
  const pool = getPool()
  for (const [key, value] of Object.entries(partial)) {
    await pool.query(`
      INSERT INTO settings (key, value, updated_at)
      VALUES ($1, $2, NOW())
      ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()
    `, [key, value])
  }
}

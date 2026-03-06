import { getPool } from '../database/connection'
import type { Session, OpenSessionPayload } from '../../src/types'

const SESSION_COLS = `
  s.id,
  s.warehouse_id  AS "warehouseId",
  w.name          AS "warehouseName",
  s.opened_at     AS "openedAt",
  s.closed_at     AS "closedAt",
  s.notes
`

export async function openSession(payload: OpenSessionPayload): Promise<Session> {
  const { rows } = await getPool().query(`
    INSERT INTO sessions (warehouse_id, notes)
    VALUES ($1, $2)
    RETURNING id
  `, [payload.warehouseId, payload.notes ?? null])

  return getSessionById(rows[0].id)
}

export async function closeSession(sessionId: number): Promise<Session> {
  await getPool().query(
    `UPDATE sessions SET closed_at = NOW() WHERE id = $1`,
    [sessionId]
  )
  return getSessionById(sessionId)
}

export async function getActiveSession(): Promise<Session | null> {
  const { rows } = await getPool().query(`
    SELECT ${SESSION_COLS}
    FROM sessions s
    JOIN warehouses w ON w.id = s.warehouse_id
    WHERE s.closed_at IS NULL
    ORDER BY s.opened_at DESC
    LIMIT 1
  `)
  return rows[0] ?? null
}

async function getSessionById(id: number): Promise<Session> {
  const { rows } = await getPool().query(`
    SELECT ${SESSION_COLS}
    FROM sessions s
    JOIN warehouses w ON w.id = s.warehouse_id
    WHERE s.id = $1
  `, [id])
  return rows[0]
}

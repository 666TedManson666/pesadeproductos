import { getPool } from '../database/connection'
import type {
  Weighing,
  CaptureWeightPayload,
  GetWeighingsPayload,
  WeighingsSummary,
} from '../../src/types'

const WEIGHING_COLS = `
  w.id,
  w.session_id     AS "sessionId",
  w.warehouse_id   AS "warehouseId",
  wh.name          AS "warehouseName",
  w.product_id     AS "productId",
  p.name           AS "productName",
  p.code           AS "productCode",
  w.weight_kg      AS "weightKg",
  w.captured_at    AS "capturedAt",
  w.mode,
  w.raw_data       AS "rawData"
`

export async function captureWeight(payload: CaptureWeightPayload): Promise<Weighing> {
  const { rows } = await getPool().query(`
    INSERT INTO weighings (session_id, warehouse_id, product_id, weight_kg, mode, raw_data)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id
  `, [
    payload.sessionId ?? null,
    payload.warehouseId,
    payload.productId,
    payload.weightKg,
    payload.mode,
    payload.rawData ?? null,
  ])

  return getWeighingById(rows[0].id)
}

export async function getWeighings(
  filters: GetWeighingsPayload
): Promise<{ rows: Weighing[]; total: number; summary: WeighingsSummary[] }> {
  const conditions: string[] = []
  const params: unknown[] = []
  let idx = 1

  if (filters.dateFrom) {
    conditions.push(`w.captured_at >= $${idx++}`)
    params.push(filters.dateFrom)
  }
  if (filters.dateTo) {
    conditions.push(`w.captured_at <= $${idx++}`)
    params.push(filters.dateTo)
  }
  if (filters.warehouseId) {
    conditions.push(`w.warehouse_id = $${idx++}`)
    params.push(filters.warehouseId)
  }
  if (filters.productId) {
    conditions.push(`w.product_id = $${idx++}`)
    params.push(filters.productId)
  }
  if (filters.agencyId) {
    conditions.push(`wh.agency_id = $${idx++}`)
    params.push(filters.agencyId)
  }
  if (filters.sessionId) {
    conditions.push(`w.session_id = $${idx++}`)
    params.push(filters.sessionId)
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

  const limit  = filters.limit  ?? 100
  const offset = filters.offset ?? 0

  const dataQuery = `
    SELECT ${WEIGHING_COLS}
    FROM weighings w
    JOIN warehouses wh ON wh.id = w.warehouse_id
    JOIN products   p  ON p.id  = w.product_id
    ${where}
    ORDER BY w.captured_at DESC
    LIMIT $${idx++} OFFSET $${idx++}
  `
  const countQuery = `
    SELECT COUNT(*) AS total
    FROM weighings w
    JOIN warehouses wh ON wh.id = w.warehouse_id
    JOIN products   p  ON p.id  = w.product_id
    ${where}
  `
  const summaryQuery = `
    SELECT
      w.product_id              AS "productId",
      p.name                    AS "productName",
      SUM(w.weight_kg)::FLOAT   AS "totalKg",
      COUNT(*)::INT             AS count
    FROM weighings w
    JOIN warehouses wh ON wh.id = w.warehouse_id
    JOIN products   p  ON p.id  = w.product_id
    ${where}
    GROUP BY w.product_id, p.name
    ORDER BY "totalKg" DESC
  `

  const [dataRes, countRes, summaryRes] = await Promise.all([
    getPool().query(dataQuery,    [...params, limit, offset]),
    getPool().query(countQuery,   params),
    getPool().query(summaryQuery, params),
  ])

  return {
    rows:    dataRes.rows as Weighing[],
    total:   Number(countRes.rows[0].total),
    summary: summaryRes.rows as WeighingsSummary[],
  }
}

export async function deleteWeighing(id: number): Promise<void> {
  await getPool().query('DELETE FROM weighings WHERE id = $1', [id])
}

async function getWeighingById(id: number): Promise<Weighing> {
  const { rows } = await getPool().query(`
    SELECT ${WEIGHING_COLS}
    FROM weighings w
    JOIN warehouses wh ON wh.id = w.warehouse_id
    JOIN products   p  ON p.id  = w.product_id
    WHERE w.id = $1
  `, [id])
  return rows[0]
}

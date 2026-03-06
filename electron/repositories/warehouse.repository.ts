import { getPool } from '../database/connection'
import type { Warehouse } from '../../src/types'

export async function getAllWarehouses(): Promise<Warehouse[]> {
  const { rows } = await getPool().query(`
    SELECT
      w.id,
      w.code,
      w.name,
      w.agency_id   AS "agencyId",
      a.name        AS "agencyName",
      w.type,
      w.active
    FROM warehouses w
    JOIN agencies a ON a.id = w.agency_id
    WHERE w.active = TRUE
    ORDER BY a.name, w.type, w.name
  `)
  return rows as Warehouse[]
}

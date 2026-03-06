import { getPool } from '../database/connection'
import type { Product } from '../../src/types'

export async function getAllProducts(): Promise<Product[]> {
  const { rows } = await getPool().query<Product>(`
    SELECT id, code, name, active
    FROM products
    WHERE active = TRUE
    ORDER BY code
  `)
  return rows
}

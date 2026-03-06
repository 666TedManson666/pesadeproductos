import fs from 'fs'
import path from 'path'
import { app } from 'electron'
import { getPool } from './connection'

async function runSqlFile(filePath: string): Promise<void> {
  const sql = fs.readFileSync(filePath, 'utf-8')
  const pool = getPool()
  await pool.query(sql)
}

function getSqlDir(): string {
  // En desarrollo: app.getAppPath() = raíz del proyecto
  // En producción: process.resourcesPath contiene los archivos empaquetados
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'electron', 'database')
  }
  return path.join(app.getAppPath(), 'electron', 'database')
}

export async function runMigrations(): Promise<void> {
  const dbDir     = getSqlDir()
  const schemaPath = path.join(dbDir, 'schema.sql')
  const seedPath   = path.join(dbDir, 'seed.sql')

  console.log('[DB] Running schema migration...')
  await runSqlFile(schemaPath)
  console.log('[DB] Schema OK')

  console.log('[DB] Running seed...')
  await runSqlFile(seedPath)
  console.log('[DB] Seed OK')
}

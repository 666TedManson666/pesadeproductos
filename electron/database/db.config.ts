import { app } from 'electron'
import fs from 'fs'
import path from 'path'

export interface DbConfig {
  host:     string
  port:     number
  database: string
  user:     string
  password: string
}

// Base defaults — can be overridden by userData JSON or process.env (dev fallback)
const DEFAULT_CONFIG: DbConfig = {
  host:     process.env.DB_HOST     || 'localhost',
  port:     Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME     || 'pesadeproductos',
  user:     process.env.DB_USER     || 'postgres',
  password: process.env.DB_PASSWORD || '',
}

function getConfigPath(): string {
  return path.join(app.getPath('userData'), 'db-config.json')
}

export function loadDbConfig(): DbConfig {
  try {
    const raw = fs.readFileSync(getConfigPath(), 'utf-8')
    const saved = JSON.parse(raw) as Partial<DbConfig>
    return { ...DEFAULT_CONFIG, ...saved }
  } catch {
    // No saved config — use defaults (which include .env values in dev)
    return { ...DEFAULT_CONFIG }
  }
}

export function saveDbConfig(cfg: Partial<DbConfig>): void {
  const current = loadDbConfig()
  const updated  = { ...current, ...cfg }
  fs.writeFileSync(getConfigPath(), JSON.stringify(updated, null, 2), 'utf-8')
}

export function hasDbConfig(): boolean {
  const cfg = loadDbConfig()
  return cfg.password.trim().length > 0
}

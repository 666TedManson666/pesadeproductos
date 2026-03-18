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

const DEFAULT_CONFIG: DbConfig = {
  host:     'localhost',
  port:     5432,
  database: 'pesadeproductos',
  user:     'postgres',
  password: '',
}

function getConfigPath(): string {
  return path.join(app.getPath('userData'), 'db-config.json')
}

export function loadDbConfig(): DbConfig {
  try {
    const raw = fs.readFileSync(getConfigPath(), 'utf-8')
    return { ...DEFAULT_CONFIG, ...JSON.parse(raw) }
  } catch {
    return { ...DEFAULT_CONFIG }
  }
}

export function saveDbConfig(cfg: Partial<DbConfig>): void {
  const current = loadDbConfig()
  const updated  = { ...current, ...cfg }
  fs.writeFileSync(getConfigPath(), JSON.stringify(updated, null, 2), 'utf-8')
}

export function hasDbConfig(): boolean {
  try {
    const cfg = loadDbConfig()
    return cfg.password.trim().length > 0
  } catch {
    return false
  }
}

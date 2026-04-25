import 'dotenv/config'
import { app, BrowserWindow, shell, ipcMain } from 'electron'
import path from 'path'
import { runMigrations } from './database/migrations'
import { closePool } from './database/connection'
import { getAllSettings } from './repositories/settings.repository'
import { settingsToConfig } from './ipc/settings.ipc'
import { serialManager } from './serial/serial.manager'
import { registerAllHandlers } from './ipc/index'

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

let mainWindow: BrowserWindow | null = null
let dbReady = false   // renderer pulls this via IPC on mount

async function createWindow(): Promise<void> {
  mainWindow = new BrowserWindow({
    width:     1280,
    height:    800,
    minWidth:  1024,
    minHeight: 680,
    title:     'PesaDeProductos',
    backgroundColor: '#111827',
    webPreferences: {
      preload:          path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration:  false,
      sandbox:          false,
    },
  })

  mainWindow.setMenuBarVisibility(false)

  if (isDev) {
    await mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    await mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  serialManager.setWindow(mainWindow)
}

async function tryRunMigrations(): Promise<boolean> {
  try {
    await runMigrations()
    return true
  } catch (err) {
    console.error('[Main] DB not available:', (err as Error).message)
    return false
  }
}

async function connectSerial(): Promise<void> {
  try {
    const settings = await getAllSettings()
    const config   = settingsToConfig(settings)
    console.log('[MAIN-DEBUG] Conectando serial con config:', JSON.stringify(config))
    await serialManager.connect(config)
    console.log('[MAIN-DEBUG] Serial conectado exitosamente')
  } catch (err) {
    console.error('[MAIN-DEBUG] ⚠️ FALLÓ conexión serial:', (err as Error).message)
    console.log('[Main] No serial port auto-connected (will retry when settings are saved)')
  }
}

async function init(): Promise<void> {
  console.log('[MAIN-DEBUG] ========== INICIANDO APP ==========')

  // 1. Register all IPC handlers (must be before any IPC calls)
  registerAllHandlers()

  // 2. Register the status handler so renderer can pull on mount
  ipcMain.handle('app:getStatus', () => {
    console.log('[MAIN-DEBUG] Renderer llamó app:getStatus → dbReady=' + dbReady)
    return { dbReady }
  })

  // 3. Try DB before creating window (avoids race condition with did-finish-load)
  dbReady = await tryRunMigrations()
  console.log('[MAIN-DEBUG] DB ready:', dbReady)

  // 4. Create and show the window — renderer will call app:getStatus on mount
  await createWindow()
  console.log('[MAIN-DEBUG] Ventana creada. serialManager.win set=', !!mainWindow)

  // 5. If DB is ready, connect serial. Otherwise wait for renderer to finish setup.
  if (dbReady) {
    console.log('[MAIN-DEBUG] DB lista, conectando serial...')
    await connectSerial()
  } else {
    console.warn('[MAIN-DEBUG] ⚠️ DB NO lista, esperando señal app:dbSetupDone del renderer...')
    // Listen for setup completion signal from renderer
    ipcMain.once('app:dbSetupDone', async () => {
      console.log('[MAIN-DEBUG] Recibido app:dbSetupDone, conectando serial...')
      dbReady = true
      await connectSerial()
    })
  }

  console.log('[MAIN-DEBUG] ========== INIT COMPLETO ==========')
}

app.whenReady().then(init).catch(console.error)

app.on('window-all-closed', async () => {
  await serialManager.disconnect()
  await closePool()
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

import 'dotenv/config'
import { app, BrowserWindow, shell, ipcMain } from 'electron'
import path from 'path'
import { runMigrations } from './database/migrations'
import { closePool } from './database/connection'
import { getAllSettings } from './repositories/settings.repository'
import { settingsToConfig, settingsToConfig2 } from './ipc/settings.ipc'
import { serialManager1, serialManager2 } from './serial/serial.manager'
import { registerAllHandlers } from './ipc/index'

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

let mainWindow: BrowserWindow | null = null
let dbReady = false

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

  serialManager1.setWindow(mainWindow)
  serialManager2.setWindow(mainWindow)
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
  const settings = await getAllSettings()

  // Connect scale 1
  try {
    const config1 = settingsToConfig(settings)
    console.log('[MAIN-DEBUG] Conectando PESA 1:', config1.port)
    await serialManager1.connect(config1)
    console.log('[MAIN-DEBUG] PESA 1 conectada')
  } catch (err) {
    console.error('[MAIN-DEBUG] ⚠️ PESA 1 falló:', (err as Error).message)
  }

  // Connect scale 2
  try {
    const config2 = settingsToConfig2(settings)
    console.log('[MAIN-DEBUG] Conectando PESA 2:', config2.port)
    await serialManager2.connect(config2)
    console.log('[MAIN-DEBUG] PESA 2 conectada')
  } catch (err) {
    console.error('[MAIN-DEBUG] ⚠️ PESA 2 falló:', (err as Error).message)
  }
}

async function init(): Promise<void> {
  console.log('[MAIN-DEBUG] ========== INICIANDO APP ==========')

  registerAllHandlers()

  ipcMain.handle('app:getStatus', () => {
    console.log('[MAIN-DEBUG] app:getStatus → dbReady=' + dbReady)
    return { dbReady }
  })

  dbReady = await tryRunMigrations()
  console.log('[MAIN-DEBUG] DB ready:', dbReady)

  await createWindow()

  if (dbReady) {
    console.log('[MAIN-DEBUG] DB lista, conectando serial...')
    await connectSerial()
  } else {
    console.warn('[MAIN-DEBUG] ⚠️ DB NO lista, esperando app:dbSetupDone...')
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
  await serialManager1.disconnect()
  await serialManager2.disconnect()
  await closePool()
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

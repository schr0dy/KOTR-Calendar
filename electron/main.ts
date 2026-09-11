import { app, BrowserWindow, ipcMain, shell, nativeImage } from 'electron'
import * as path from 'path'
import { setupAutoUpdater } from './updater'

import * as fs from 'fs'

// Ensure Windows taskbar groups windows properly with custom app icon
if (process.platform === 'win32') {
  app.setAppUserModelId('com.kingofthering.calendar')
}

const isDev = process.env.NODE_ENV === 'development'

let mainWindow: BrowserWindow | null = null

function getAppIcon() {
  const icoPath = isDev
    ? path.join(__dirname, '../build/icon.ico')
    : path.join(process.resourcesPath, 'icon.ico')
  const pngPath = isDev
    ? path.join(__dirname, '../build/icon.png')
    : path.join(process.resourcesPath, 'icon.png')

  if (fs.existsSync(icoPath)) {
    return nativeImage.createFromPath(icoPath)
  } else if (fs.existsSync(pngPath)) {
    return nativeImage.createFromPath(pngPath)
  }
  return undefined
}

function createWindow() {
  const appIcon = getAppIcon()

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#0A0A0A',
    icon: appIcon,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true,
    },
  })

  if (appIcon) {
    mainWindow.setIcon(appIcon)
  }

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  // Open external links in browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })
}

app.whenReady().then(() => {
  createWindow()

  if (!isDev) {
    setupAutoUpdater(mainWindow!)
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// Window controls IPC
ipcMain.on('window:minimize', () => {
  mainWindow?.minimize()
})

ipcMain.on('window:maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize()
  } else {
    mainWindow?.maximize()
  }
})

ipcMain.on('window:close', () => {
  mainWindow?.close()
})

ipcMain.handle('window:isMaximized', () => {
  return mainWindow?.isMaximized() ?? false
})

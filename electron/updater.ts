import { autoUpdater } from 'electron-updater'
import { BrowserWindow, ipcMain } from 'electron'

export function setupAutoUpdater(mainWindow: BrowserWindow) {
  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true

  autoUpdater.on('update-available', (info) => {
    mainWindow.webContents.send('update:available', info)
  })

  autoUpdater.on('update-downloaded', (info) => {
    mainWindow.webContents.send('update:downloaded', info)
  })

  autoUpdater.on('download-progress', (progress) => {
    mainWindow.webContents.send('update:progress', progress)
  })

  autoUpdater.on('error', (err) => {
    console.error('Auto-updater error:', err)
    mainWindow.webContents.send('update:error', err?.message || String(err))
  })

  autoUpdater.on('update-not-available', () => {
    mainWindow.webContents.send('update:not-available')
  })

  ipcMain.on('update:install', () => {
    autoUpdater.quitAndInstall()
  })

  ipcMain.on('update:check', () => {
    autoUpdater.checkForUpdatesAndNotify()
  })

  // Check for updates on startup (with delay)
  setTimeout(() => {
    autoUpdater.checkForUpdatesAndNotify()
  }, 3000)

  // Check every 2 hours
  setInterval(() => {
    autoUpdater.checkForUpdatesAndNotify()
  }, 2 * 60 * 60 * 1000)
}

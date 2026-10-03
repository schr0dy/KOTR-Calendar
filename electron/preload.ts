import { contextBridge, ipcRenderer } from 'electron'

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Window controls
  minimize: () => ipcRenderer.send('window:minimize'),
  maximize: () => ipcRenderer.send('window:maximize'),
  close: () => ipcRenderer.send('window:close'),
  isMaximized: () => ipcRenderer.invoke('window:isMaximized'),

  // Auto-updater events
  onUpdateAvailable: (callback: (info: unknown) => void) => {
    ipcRenderer.on('update:available', (_event, info) => callback(info))
  },
  onUpdateDownloaded: (callback: (info: unknown) => void) => {
    ipcRenderer.on('update:downloaded', (_event, info) => callback(info))
  },
  installUpdate: () => ipcRenderer.send('update:install'),
  checkForUpdates: () => ipcRenderer.send('update:check'),
  onUpdateProgress: (callback: (progress: unknown) => void) => {
    ipcRenderer.on('update:progress', (_event, progress) => callback(progress))
  },
  onUpdateError: (callback: (err: unknown) => void) => {
    ipcRenderer.on('update:error', (_event, err) => callback(err))
  },
  onUpdateNotAvailable: (callback: () => void) => {
    ipcRenderer.on('update:not-available', () => callback())
  },
})

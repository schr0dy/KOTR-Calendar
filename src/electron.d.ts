// Type declarations for Electron API exposed via preload
interface ElectronAPI {
  minimize: () => void
  maximize: () => void
  close: () => void
  isMaximized: () => Promise<boolean>
  onUpdateAvailable: (callback: (info: unknown) => void) => void
  onUpdateDownloaded: (callback: (info: unknown) => void) => void
  installUpdate: () => void
  onUpdateProgress: (callback: (progress: unknown) => void) => void
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI
  }
}

export {}

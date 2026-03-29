// src/types/electron.d.ts
interface ElectronAPI {
  send: (channel: string, ...args: any[]) => void;
  on?: (channel: string, listener: (...args: any[]) => void) => void;
  off?: (channel: string, listener: (...args: any[]) => void) => void;
  addListener?: (channel: string, listener: (...args: any[]) => void) => void;
  removeListener?: (channel: string, listener: (...args: any[]) => void) => void;
  once?: (channel: string, listener: (...args: any[]) => void) => void;
}

declare interface Window {
  electron?: ElectronAPI;
  ipcRenderer?: ElectronAPI;
}

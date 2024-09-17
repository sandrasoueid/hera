// preload.js

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),
    on: (channel, listener) => ipcRenderer.on(channel, listener),
    send: (channel, ...args) => ipcRenderer.send(channel, ...args),
  },
});

window.addEventListener("DOMContentLoaded", () => {
  // Preload scripts can expose APIs to the renderer process
});
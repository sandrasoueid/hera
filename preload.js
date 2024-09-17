// preload.js

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld("api", {
  getData: (dateKey) => ipcRenderer.invoke("get-data", dateKey),
  saveData: (dateKey, data) => ipcRenderer.invoke("save-data", dateKey, data),
});
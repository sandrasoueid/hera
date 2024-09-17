// main.js

import { app, BrowserWindow, ipcMain } from 'electron';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

// Fix __dirname and __filename in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import { JSONFilePreset } from 'lowdb/node';

// LowDB setup
const defaultData = { tasks: {} };
const db = await JSONFilePreset(path.join(__dirname, 'db.json'), defaultData);

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  win.loadFile('index.html');
}

ipcMain.handle('please', (...args) => {
    console.log('Sent args:', args)
    return 'Thanks!'
  })

ipcMain.handle('get-tasks', async () => {
  return await db.read();
});

ipcMain.handle('set-tasks', async (event, tasks) => {
  await db.write({ tasks });
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

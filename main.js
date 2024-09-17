// main.js

import { app, BrowserWindow, ipcMain } from "electron";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

// Fix __dirname and __filename in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import { JSONFilePreset } from "lowdb/node";

// LowDB setup
const defaultData = { tasks: {} };
const db = await JSONFilePreset(path.join(__dirname, "db.json"), defaultData);

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win;

function createWindow() {
  win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  win.loadFile("index.html");
}

// IPC handlers for getting and saving tasks
ipcMain.handle("get-tasks", async (event, dateKey) => {
  await db.read();
  // Ensure db.data is initialized
  db.data = db.data || { tasks: {} };
  db.data.tasks = db.data.tasks || {};
  const tasks = db.data.tasks[dateKey] || {};
  return tasks;
});

ipcMain.handle("save-tasks", async (event, dateKey, tasks) => {
  await db.read();
  // Ensure db.data is initialized
  db.data = db.data || { tasks: {} };
  db.data.tasks = db.data.tasks || {};
  db.data.tasks[dateKey] = tasks;
  await db.write();
});

app.whenReady().then(() => {
  createWindow();

  app.on("activate", function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", function () {
  if (process.platform !== "darwin") app.quit();
});

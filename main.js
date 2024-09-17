// main.js

import { app, BrowserWindow, ipcMain } from "electron";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

// Fix __dirname and __filename in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import { JSONFilePreset } from "lowdb/node";

// LowDB setup
const defaultData = { dates: {} };
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
ipcMain.handle("get-data", async (event, dateKey) => {
  await db.read();
  // Ensure db.data is initialized
  db.data ||= { dates: {} };
  db.data.dates ||= {};
  const dateData = db.data.dates[dateKey] || {
    tasks: {},
    goals: ["", "", ""],
    todos: Array.from({ length: 8 }, () => ({ text: "", completed: false })),
    meals: "",
    waterIntake: Array(8).fill(false),
  };

  console.log(`ipcMain: Returning data for ${dateKey}:`, dateData);
  return dateData;
});

ipcMain.handle(
  "save-data",
  async (event, dateKey, data) => {
    console.log(`ipcMain: Received 'save-data' for dateKey: ${dateKey}`);
    await db.read();
    db.data ||= { dates: {} };
    db.data.dates ||= {};
    db.data.dates[dateKey] = data;
    await db.write();
    console.log(`ipcMain: Data for ${dateKey} saved.`);
  }
);

app.whenReady().then(() => {
  createWindow();

  app.on("activate", function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", function () {
  if (process.platform !== "darwin") app.quit();
});

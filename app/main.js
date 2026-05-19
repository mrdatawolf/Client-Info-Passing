'use strict';

const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 520,
    height: 840,
    minWidth: 480,
    minHeight: 500,
    title: 'License Scanner',
    icon: path.join(__dirname, 'wolflicense.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  Menu.setApplicationMenu(null);
  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  // ── Scanner input capture ─────────────────────────────────────────────
  // All keyboard input is intercepted here before Chromium sees it.
  //
  // • Printable characters  → buffered
  // • Enter / Tab           → appended as \n (field terminators in PDF417)
  //                           NOT used to flush — the timer handles that
  // • Modifier combos       → blocked (AAMVA control bytes trigger these)
  //   except Ctrl+C/V/A     → allowed through for copy/paste
  //
  // After 200ms of silence, the complete buffer is sent to the renderer
  // via IPC as a single string with proper \n field separators intact.

  let scanBuffer = '';
  let scanTimer  = null;

  function flushScan() {
    clearTimeout(scanTimer);
    scanTimer = null;
    const data = scanBuffer;
    scanBuffer = '';
    if (data.trim()) win.webContents.send('scan-complete', data);
  }

  win.webContents.on('before-input-event', (event, input) => {
    if (input.type !== 'keyDown') return;

    // Pass Ctrl/Cmd + C / V / A through to renderer (copy, paste, select-all)
    if ((input.control || input.meta) && ['c', 'v', 'a'].includes(input.key.toLowerCase())) {
      return;
    }

    // Block all other modifier combos
    if (input.control || input.meta || input.alt) {
      event.preventDefault();
      return;
    }

    // Enter / Tab = field terminator → preserve as \n, reset timer
    if (input.key === 'Enter' || input.key === 'Tab') {
      event.preventDefault();
      scanBuffer += '\n';
      clearTimeout(scanTimer);
      scanTimer = setTimeout(flushScan, 200);
      return;
    }

    // Backspace
    if (input.key === 'Backspace') {
      if (scanBuffer.length > 0) {
        event.preventDefault();
        scanBuffer = scanBuffer.slice(0, -1);
        clearTimeout(scanTimer);
        if (scanBuffer.length > 0) scanTimer = setTimeout(flushScan, 200);
      }
      return;
    }

    // Printable character
    if (input.key.length === 1) {
      event.preventDefault();
      if (scanBuffer.length === 0) win.webContents.send('scan-start');
      scanBuffer += input.key;
      clearTimeout(scanTimer);
      scanTimer = setTimeout(flushScan, 200);
      return;
    }

    // Everything else (F-keys, arrows, Escape…)
    event.preventDefault();
  });
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

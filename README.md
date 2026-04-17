# License Scanner

Scan a driver's license barcode → parse AAMVA fields → copy into any authorization system.

Packaged as an Electron desktop app. No server, no browser, no keyboard-shortcut interference.

---

## How it works

```
[USB barcode scanner]
        │
        │  HID keyboard stream
        ▼
  Electron main process
  (before-input-event)
        │
        │  Buffers characters, sends complete scan via IPC
        ▼
  Renderer (renderer.js)
        │
        │  window.aamva.parse()  ←── preload.js (aamva-parser, Node context)
        ▼
  Parsed field grid
        │
  [Copy] per field  |  [Copy All as Text]
```

The main process intercepts every keystroke from the scanner before Chromium sees it, so AAMVA control characters (`\x1e`, `@`, etc.) never reach the browser engine and cannot trigger shortcuts or navigation.

---

## Supported formats

Both formats encode the same AAMVA standard fields and are auto-detected on scan:

| Format | First character | Notes |
|---|---|---|
| PDF417 Barcode | `@` | Older CA licenses; ends with `zczc` |
| QR Code | `2` (or non-`@`) | Newer CA licenses; mixed-case field IDs |

---

## Quickstart

```bash
cd app
npm install
npm start
```

`npm start` launches the Electron app directly. No build step required to run.

---

## Usage

- Point a USB barcode scanner at the back of a driver's license and scan
- Fields populate automatically — no button press needed
- Paste raw AAMVA data manually (Ctrl+V → Enter) for testing
- Expired licenses show a warning banner
- No data leaves the machine

---

## Project layout

```
app/
  main.js             Electron main process — scanner input capture, IPC
  preload.js          contextBridge — exposes window.aamva and window.scanner
  renderer/
    index.html        App shell
    styles.css        Styles
    renderer.js       UI logic — receives scan via IPC, parses and displays
  build.js            esbuild script (generates standalone dist/index.html)
  package.json
  dist/               ← generated, not tracked
  node_modules/       ← generated, not tracked
Sample/
  raw_barcode.txt     Example raw PDF417 scan output
  raw_qr.txt          Example raw QR scan output
  example.txt         Pre-formatted AAMVA reference data
```

---

## Dependencies

| Package | Purpose |
|---|---|
| [electron](https://www.electronjs.org/) | Desktop app shell; keyboard input interception |
| [aamva-parser](https://github.com/winfinit/aamva-parser) | Decode AAMVA barcode data |
| [esbuild](https://esbuild.github.io/) | Optional: bundle into standalone HTML for browser testing |

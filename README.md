# License Scanner

Electron desktop app for scanning driver's license barcodes and parsing AAMVA fields locally.

This repository contains a small offline tool that intercepts HID keyboard input from USB barcode scanners, decodes PDF417 and QR license payloads, and displays parsed fields for one-click copy.

---

## Features

- Offline Electron application with no network dependencies
- Supports both PDF417 and QR-coded driver's license scans
- Parses AAMVA standard fields and shows results in a field grid
- Copy single fields or copy all parsed data as plain text
- Prevents scanner control characters from triggering browser shortcuts
- Works with USB barcode scanners that emulate keyboard input

---

## Why this repo

Many authorization and intake systems still require manual entry of driver's license data. This app streamlines the process by converting raw license barcode scans into structured form fields without sending any data outside the local machine.

---

## Quick start

```bash
cd app
npm install
npm start
```

- `npm install` installs runtime dependencies
- `npm start` launches the Electron app

---

## Build / Package

From the `app` folder:

```bash
npm run build
npm run dist
```

- `npm run build` bundles the app assets with `esbuild`
- `npm run dist` packages a portable Windows bundle using `electron-builder`

There is also a top-level `build-portable.bat` helper for Windows packaging.

---

## Supported input formats

This app auto-detects the AAMVA payload format from raw scanner input.

| Format | Indicator | Notes |
|---|---|---|
| PDF417 barcode | `@` | Older California/US licenses; data ends with `zczc` |
| QR code | typically `2` or other non-`@` prefix | Newer licenses with mixed-case AAMVA field IDs |

---

## How it works

```text
[USB barcode scanner]
        │
        │  HID keyboard stream
        ▼
Electron main process
  (before-input-event)
        │
        │  Buffers scanner characters, then sends complete scan via IPC
        ▼
Renderer (renderer.js)
        │
        │  window.aamva.parse()  ←── preload.js (aamva-parser, Node context)
        ▼
Parsed field grid and copy controls
```

The main process captures each keystroke before Chromium processes it, so AAMVA control characters like `\x1e` and `@` do not trigger browser shortcuts or text input events.

---

## Usage

- Plug in a USB barcode scanner that emulates keyboard input
- Scan the driver's license barcode or QR code
- Parsed fields appear automatically in the UI
- Use the copy buttons to transfer individual values or copy all parsed output
- Paste raw AAMVA strings manually for testing if needed

---

## Example screenshot

The app displays parsed license fields in a simple grid with copy controls for each field and a global "Copy All" option. This makes it easy to paste scanned data directly into authorization systems, ID verification forms, or intake tools.

> Note: `Samples/Media.jpeg` contains an example scan image and sample workflow reference.

---

## Repository layout

```
app/
  main.js
  preload.js
  renderer/
    index.html
    renderer.js
    styles.css
  build.js
  package.json
  dist/            ← generated output
  node_modules/    ← generated dependencies
Samples/
  Media.jpeg
  order.txt
build-portable.bat
LICENSE
README.md
```

---

## Dependencies

- `electron` — desktop shell and input interception
- `aamva-parser` — AAMVA barcode payload decoding
- `esbuild` — optional bundling for standalone HTML output
- `electron-builder` — packaging portable Windows builds

---

## License

This project is licensed under the ISC License.

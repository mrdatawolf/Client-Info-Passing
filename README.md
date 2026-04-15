# License Scanner

Scan a driver's license barcode → parse AAMVA fields → copy into any authorization system.

No server. No install. Single HTML file output.

---

## How it works

```
app/renderer/index.html  ─┐
app/renderer/styles.css   ├─► build.js (esbuild) ─► dist/index.html
app/src/app.js            ┘         ↑
  + aamva-parser (npm)          node_modules
```

The build bundles everything (JS + CSS) inline into one self-contained `dist/index.html`.

---

## Quickstart

```bash
cd app
npm install
npm run build        # outputs dist/index.html
npm run open         # build + open in browser (Windows)
```

---

## Usage

```
[Barcode scanner] → textarea → auto-parse on Enter / focus-out
                                        ↓
                              Parsed field grid
                                        ↓
                        [Copy] per field  |  [Copy All as Text]
```

- Paste raw PDF417 barcode data or use a physical USB barcode scanner
- Expired licenses show a warning banner
- No data leaves the browser

---

## Project layout

```
app/
  src/app.js          entry point — parse + UI logic
  renderer/
    index.html        HTML shell (placeholders for injected CSS/JS)
    styles.css        styles
  build.js            esbuild bundler script
  package.json
  dist/               ← generated, not tracked
  node_modules/       ← generated, not tracked
```

---

## Dependencies

| Package | Purpose |
|---|---|
| [aamva-parser](https://github.com/winfinit/aamva-parser) | Decode AAMVA PDF417 barcode data |
| [esbuild](https://esbuild.github.io/) | Bundle + inline JS for distribution |

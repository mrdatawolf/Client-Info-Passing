const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

async function build() {
  // Bundle app.js + aamva-parser into a single IIFE script
  const result = await esbuild.build({
    entryPoints: ['src/app.js'],
    bundle: true,
    format: 'iife',
    target: ['chrome110'],   // Edge/Chrome on Windows 10+
    write: false,
    minify: false,
    logLevel: 'info',
  });

  const js  = result.outputFiles[0].text;
  const css = fs.readFileSync('renderer/styles.css', 'utf8');

  // Inline CSS and JS into the HTML template
  let html = fs.readFileSync('renderer/index.html', 'utf8');
  html = html.replace('<!-- styles injected by build -->', `<style>\n${css}\n</style>`);
  html = html.replace('<!-- script injected by build -->', `<script>\n${js}\n</script>`);

  fs.mkdirSync('dist', { recursive: true });
  fs.writeFileSync('dist/index.html', html);

  console.log('Built → dist/index.html');
}

build().catch((err) => { console.error(err); process.exit(1); });

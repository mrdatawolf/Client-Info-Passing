'use strict';

const FIELDS = [
  { key: 'licenseNumber',  label: 'License Number',  fullWidth: true },
  { key: 'lastName',       label: 'Last Name' },
  { key: 'firstName',      label: 'First Name' },
  { key: 'middleName',     label: 'Middle Name' },
  { key: 'dateOfBirth',    label: 'Date of Birth' },
  { key: 'expirationDate', label: 'Expiration Date' },
  { key: 'issueDate',      label: 'Issue Date' },
  { key: 'streetAddress',  label: 'Street Address',  fullWidth: true },
  { key: 'city',           label: 'City' },
  { key: 'state',          label: 'State' },
  { key: 'postalCode',     label: 'Zip Code' },
  { key: 'gender',         label: 'Gender' },
  { key: 'eyeColor',       label: 'Eye Color' },
  { key: 'hairColor',      label: 'Hair Color' },
  { key: 'height',         label: 'Height' },
  { key: 'weight',         label: 'Weight' },
  { key: 'country',        label: 'Country' },
];

const scanInput   = document.getElementById('scan-input');
const btnParse    = document.getElementById('btn-parse');
const btnClear    = document.getElementById('btn-clear');
const btnCopyAll  = document.getElementById('btn-copy-all');
const statusBadge = document.getElementById('status-badge');
const fieldGrid   = document.getElementById('field-grid');

const valueEls = {};
const copyBtns = {};

function buildGrid() {
  const warningEl = document.createElement('div');
  warningEl.id = 'expired-warning';
  warningEl.className = 'expired-warning';
  warningEl.textContent = '⚠  This license appears to be EXPIRED.';
  fieldGrid.appendChild(warningEl);

  FIELDS.forEach(({ key, label, fullWidth }) => {
    const row = document.createElement('div');
    row.className = 'field-row' + (fullWidth ? ' full-width' : '');

    const labelEl = document.createElement('div');
    labelEl.className = 'field-label';
    labelEl.textContent = label;

    const valueRow = document.createElement('div');
    valueRow.className = 'field-value-row';

    const valueEl = document.createElement('div');
    valueEl.className = 'field-value empty';
    valueEl.textContent = '—';
    valueEl.title = 'Click to select all';
    valueEls[key] = valueEl;

    const copyBtn = document.createElement('button');
    copyBtn.className = 'btn-copy';
    copyBtn.textContent = 'Copy';
    copyBtn.disabled = true;
    copyBtn.title = `Copy ${label}`;
    copyBtns[key] = copyBtn;

    copyBtn.addEventListener('click', () => copyField(key, copyBtn));

    valueRow.appendChild(valueEl);
    valueRow.appendChild(copyBtn);
    row.appendChild(labelEl);
    row.appendChild(valueRow);
    fieldGrid.appendChild(row);
  });
}

function detectScanFormat(raw) {
  const first = raw.trimStart()[0];
  if (first === '@') return 'PDF417 Barcode';
  if (/^ANSI\s/i.test(raw.trim())) return 'Standard';
  return 'QR Code';
}

// Dates arrive from the preload as ISO strings
const fmt = (iso) => {
  if (!iso) return null;
  const d = new Date(iso);
  return !isNaN(d) ? d.toLocaleDateString('en-US') : null;
};

function parseAndDisplay() {
  const raw = scanInput.value.trim();
  if (!raw) return;

  showBadge('processing', ' Processing…');
  requestAnimationFrame(() => setTimeout(() => _finishParse(raw), 0));
}

function _finishParse(raw) {
  const format = detectScanFormat(raw);

  let result;
  try {
    result = window.aamva.parse(raw);
  } catch (err) {
    showBadge('error', `✗  ${format} — ${err.message}`);
    return;
  }

  if (!result || !result.ok) {
    showBadge('error', `✗  ${format} — ${result?.error || 'Could not parse barcode'}`);
    return;
  }

  const d = result.data;

  const mapped = {
    licenseNumber:  d.driversLicenseId  ?? null,
    firstName:      d.firstName         ?? null,
    lastName:       d.lastName          ?? null,
    middleName:     d.middleName        ?? null,
    dateOfBirth:    fmt(d.dateOfBirth),
    expirationDate: fmt(d.expirationDate),
    issueDate:      fmt(d.issueDate),
    streetAddress:  d.streetAddress     ?? null,
    city:           d.city              ?? null,
    state:          d.state             ?? null,
    postalCode:     d.postalCode        ?? null,
    eyeColor:       d.eyeColor          ?? null,
    hairColor:      d.hairColor         ?? null,
    height:         d.height != null ? String(d.height) : null,
    weight:         d.weight            ?? null,
    gender:         d.gender            ?? null,
    country:        d.country           ?? null,
  };

  FIELDS.forEach(({ key }) => {
    const val = mapped[key];
    const el  = valueEls[key];
    const btn = copyBtns[key];

    if (val != null && String(val).trim() !== '') {
      el.textContent = String(val);
      el.classList.remove('empty');
      btn.disabled = false;
    } else {
      el.textContent = '—';
      el.classList.add('empty');
      btn.disabled = true;
    }
  });

  const warningEl = document.getElementById('expired-warning');
  if (d.expired) {
    warningEl.classList.add('visible');
    showBadge('expired', `⚠  ${format} — License Expired`);
  } else {
    warningEl.classList.remove('visible');
    showBadge('success', `✓  ${format} — Parsed successfully`);
  }

  btnCopyAll.disabled = false;
}

function copyField(key, btn) {
  const text = valueEls[key].textContent;
  if (!text || text === '—') return;
  navigator.clipboard.writeText(text).then(() => {
    btn.textContent = 'Copied!';
    btn.classList.add('copied');
    setTimeout(() => { btn.textContent = 'Copy'; btn.classList.remove('copied'); }, 1500);
  });
}

function copyAll() {
  const lines = FIELDS
    .filter(({ key }) => valueEls[key].textContent !== '—')
    .map(({ key, label }) => `${label}: ${valueEls[key].textContent}`);
  if (!lines.length) return;
  navigator.clipboard.writeText(lines.join('\n')).then(() => {
    btnCopyAll.textContent = 'Copied!';
    setTimeout(() => { btnCopyAll.textContent = 'Copy All as Text'; }, 1800);
  });
}

function clearAll() {
  scanInput.value = '';
  FIELDS.forEach(({ key }) => {
    valueEls[key].textContent = '—';
    valueEls[key].classList.add('empty');
    copyBtns[key].disabled = true;
  });
  const warningEl = document.getElementById('expired-warning');
  if (warningEl) warningEl.classList.remove('visible');
  statusBadge.className = 'badge hidden';
  statusBadge.textContent = '';
  btnCopyAll.disabled = true;
  scanInput.focus();
}

function showBadge(type, text) {
  statusBadge.className = `badge ${type}`;
  statusBadge.textContent = text;
}

// ── Scanner input via IPC (main process buffers + sends complete scan) ───
window.scanner.onScanStart(() => {
  showBadge('processing', ' Scanning…');
});

window.scanner.onScan((raw) => {
  scanInput.value = raw;
  parseAndDisplay();
});

// ── Manual paste fallback: auto-parse 200ms after Ctrl+V ─────────────────
let pasteTimer = null;
scanInput.addEventListener('input', () => {
  clearTimeout(pasteTimer);
  pasteTimer = setTimeout(() => {
    if (scanInput.value.trim()) parseAndDisplay();
  }, 200);
});

btnParse.addEventListener('click', parseAndDisplay);
btnClear.addEventListener('click', clearAll);
btnCopyAll.addEventListener('click', copyAll);

buildGrid();
scanInput.focus();

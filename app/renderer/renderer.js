'use strict';

// ── Field definitions ──────────────────────────────────────────────────────
// order matches what most authorization systems ask for left-to-right/top-to-bottom
const FIELDS = [
  { key: 'licenseNumber',  label: 'License Number',   fullWidth: true },
  { key: 'lastName',       label: 'Last Name' },
  { key: 'firstName',      label: 'First Name' },
  { key: 'middleName',     label: 'Middle Name' },
  { key: 'dateOfBirth',    label: 'Date of Birth' },
  { key: 'expirationDate', label: 'Expiration Date' },
  { key: 'issueDate',      label: 'Issue Date' },
  { key: 'streetAddress',  label: 'Street Address',   fullWidth: true },
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

// ── DOM refs ──────────────────────────────────────────────────────────────
const scanInput   = document.getElementById('scan-input');
const btnParse    = document.getElementById('btn-parse');
const btnClear    = document.getElementById('btn-clear');
const btnCopyAll  = document.getElementById('btn-copy-all');
const statusBadge = document.getElementById('status-badge');
const fieldGrid   = document.getElementById('field-grid');

// ── Build field rows (once, on load) ─────────────────────────────────────
const valueEls = {};  // key → value div
const copyBtns = {};  // key → copy button

function buildGrid() {
  // Expired warning row (hidden until needed)
  const warningEl = document.createElement('div');
  warningEl.id = 'expired-warning';
  warningEl.className = 'expired-warning';
  warningEl.textContent = '⚠️  This license appears to be EXPIRED.';
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

// ── Parse and display ─────────────────────────────────────────────────────
function parseAndDisplay() {
  const raw = scanInput.value.trim();
  if (!raw) return;

  const result = window.aamva.parse(raw);

  if (!result.ok) {
    showBadge('error', '✗  ' + (result.error || 'Could not parse barcode'));
    return;
  }

  const d = result.data;

  FIELDS.forEach(({ key }) => {
    const val = d[key];
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

  // Expired warning
  const warningEl = document.getElementById('expired-warning');
  if (d.expired === true) {
    warningEl.classList.add('visible');
    showBadge('expired', '⚠  License Expired');
  } else {
    warningEl.classList.remove('visible');
    showBadge('success', '✓  Parsed successfully');
  }

  btnCopyAll.disabled = false;
}

// ── Copy helpers ─────────────────────────────────────────────────────────
function copyField(key, btn) {
  const text = valueEls[key].textContent;
  if (!text || text === '—') return;
  navigator.clipboard.writeText(text).then(() => {
    btn.textContent = 'Copied!';
    btn.classList.add('copied');
    setTimeout(() => {
      btn.textContent = 'Copy';
      btn.classList.remove('copied');
    }, 1500);
  });
}

function copyAll() {
  const lines = FIELDS
    .filter(({ key }) => {
      const t = valueEls[key].textContent;
      return t && t !== '—';
    })
    .map(({ key, label }) => `${label}: ${valueEls[key].textContent}`);

  if (!lines.length) return;

  navigator.clipboard.writeText(lines.join('\n')).then(() => {
    btnCopyAll.textContent = 'Copied!';
    setTimeout(() => { btnCopyAll.textContent = 'Copy All as Text'; }, 1800);
  });
}

// ── Clear ─────────────────────────────────────────────────────────────────
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

// ── Status badge ──────────────────────────────────────────────────────────
function showBadge(type, text) {
  statusBadge.className = `badge ${type}`;
  statusBadge.textContent = text;
}

// ── Auto-parse on scanner input (scanners end with Enter/CR) ─────────────
scanInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    parseAndDisplay();
  }
});

// Also auto-parse when the textarea loses focus if it has content and hasn't been parsed yet
let lastParsedValue = '';
scanInput.addEventListener('blur', () => {
  const val = scanInput.value.trim();
  if (val && val !== lastParsedValue) {
    lastParsedValue = val;
    parseAndDisplay();
  }
});

// ── Button wiring ─────────────────────────────────────────────────────────
btnParse.addEventListener('click', parseAndDisplay);
btnClear.addEventListener('click', clearAll);
btnCopyAll.addEventListener('click', copyAll);

// ── Init ──────────────────────────────────────────────────────────────────
buildGrid();
scanInput.focus();

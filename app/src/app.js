'use strict';

import { parse } from 'aamva-parser';

// ── Field definitions ─────────────────────────────────────────────────────
const FIELDS = [
  { key: 'firstName',      label: 'First Name' },
  { key: 'middleName',     label: 'Middle Name' },
  { key: 'lastName',       label: 'Last Name' },
  { key: 'streetAddress',  label: 'Street Address' },
  { key: 'postalCode',     label: 'Zip Code' },
  { key: 'gender',         label: 'Gender' },
  { key: 'hairColor',      label: 'Hair Color' },
  { key: 'eyeColor',       label: 'Eye Color' },
  { key: 'height',         label: 'Height' },
  { key: 'weight',         label: 'Weight' },
  { key: 'dateOfBirth',    label: 'Date of Birth' },
  { key: 'licenseNumber',  label: 'ID Number' },
  { key: 'country',        label: 'Country' },
];

// ── DOM refs ──────────────────────────────────────────────────────────────
const scanInput   = document.getElementById('scan-input');
const btnParse    = document.getElementById('btn-parse');
const btnClear    = document.getElementById('btn-clear');
const btnCopyAll  = document.getElementById('btn-copy-all');
const statusBadge = document.getElementById('status-badge');
const fieldGrid   = document.getElementById('field-grid');
const scanOverlay = document.getElementById('scan-overlay');
const scanPanel   = document.getElementById('scan-panel');
const btnToggle   = document.getElementById('btn-toggle-panel');

// ── Build field rows (once, on load) ──────────────────────────────────────
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
    valueEls[key] = valueEl;

    const copyBtn = document.createElement('button');
    copyBtn.className = 'btn-copy';
    copyBtn.textContent = 'Copy';
    copyBtn.disabled = true;
    copyBtns[key] = copyBtn;

    copyBtn.addEventListener('click', () => copyField(key, copyBtn));

    valueRow.appendChild(valueEl);
    valueRow.appendChild(copyBtn);
    row.appendChild(labelEl);
    row.appendChild(valueRow);
    fieldGrid.appendChild(row);
  });
}

// ── Format detection ──────────────────────────────────────────────────────
function detectScanFormat(raw) {
  const first = raw.trimStart()[0];
  if (first === '@') return 'PDF417 Barcode';
  if (/^ANSI\s/i.test(raw.trim())) return 'Standard';
  return 'QR Code';
}

// ── Parse helpers ─────────────────────────────────────────────────────────
const fmt = (d) => (d instanceof Date && !isNaN(d) ? d.toLocaleDateString('en-US') : null);

function parseLicense(raw) {
  const result = parse(raw);
  return {
    firstName:      result.firstName          ?? null,
    middleName:     result.middleName         ?? null,
    lastName:       result.lastName           ?? null,
    streetAddress:  result.streetAddress      ?? null,
    postalCode:     result.postalCode         ?? null,
    gender:         result.gender             ?? null,
    hairColor:      result.hairColor          ?? null,
    eyeColor:       result.eyeColor           ?? null,
    height:         result.height != null ? String(result.height) : null,
    weight:         result.weight             ?? null,
    dateOfBirth:    fmt(result.dateOfBirth),
    licenseNumber:  result.driversLicenseId  ?? null,
    country:        result.country            ?? null,
    expired:        result.isExpired          ? result.isExpired() : false,
  };
}

// ── Parse and display ─────────────────────────────────────────────────────
function parseAndDisplay() {
  const raw = scanInput.value.trim();
  if (!raw) return;

  showBadge('processing', ' Processing…');
  requestAnimationFrame(() => setTimeout(() => _finishParse(raw), 0));
}

function _finishParse(raw) {
  const format = detectScanFormat(raw);
  let data;
  try {
    data = parseLicense(raw);
  } catch (err) {
    showBadge('error', `✗  ${format} — ${err.message || 'Could not parse'}`);
    return;
  }

  FIELDS.forEach(({ key }) => {
    const val = data[key];
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
  if (data.expired) {
    warningEl.classList.add('visible');
    showBadge('expired', `⚠  ${format} — License Expired`);
  } else {
    warningEl.classList.remove('visible');
    showBadge('success', `✓  ${format} — Parsed successfully`);
  }

  btnCopyAll.disabled = false;
}

// ── Copy helpers ──────────────────────────────────────────────────────────
function copyField(key, btn) {
  const text = valueEls[key].textContent;
  if (!text || text === '—') return;
  navigator.clipboard.writeText(text).then(() => {
    btn.textContent = 'Copied!';
    btn.classList.add('copied');
    setTimeout(() => { btn.textContent = 'Copy'; btn.classList.remove('copied'); btn.disabled = false; }, 2000);
  });
}

function copyAll() {
  const lines = FIELDS
    .filter(({ key }) => valueEls[key].textContent !== '—')
    .map(({ key, label }) => `${label}: ${valueEls[key].textContent}`);
  if (!lines.length) return;
  navigator.clipboard.writeText(lines.join('\n')).then(() => {
    btnCopyAll.textContent = 'Copied!';
    setTimeout(() => { btnCopyAll.textContent = 'Copy All as Text'; btnCopyAll.disabled = false; }, 2000);
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
  scanOverlay.classList.remove('active');
  scanOverlay.classList.add('hidden');
  btnCopyAll.disabled = true;
  scanInput.focus();
}

// ── Status badge ──────────────────────────────────────────────────────────
function showBadge(type, text) {
  statusBadge.className = `badge ${type}`;
  statusBadge.textContent = text;

  if (type === 'processing') {
    scanOverlay.classList.remove('hidden');
    scanOverlay.classList.add('active');
  } else {
    scanOverlay.classList.remove('active');
    setTimeout(() => scanOverlay.classList.add('hidden'), 200);
  }
}

// ── Auto-parse: barcode scanners end with Enter ───────────────────────────
scanInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    parseAndDisplay();
  }
});

let lastParsedValue = '';
scanInput.addEventListener('blur', () => {
  const val = scanInput.value.trim();
  if (val && val !== lastParsedValue) {
    lastParsedValue = val;
    parseAndDisplay();
  }
});

function openScanPanel() {
  scanPanel.classList.add('open');
  btnToggle.disabled = true;
}

function closeScanPanel() {
  scanPanel.classList.remove('open');
  btnToggle.disabled = false;
}

// ── Button wiring ─────────────────────────────────────────────────────────
btnParse.addEventListener('click', parseAndDisplay);
btnClear.addEventListener('click', clearAll);
btnCopyAll.addEventListener('click', copyAll);
btnToggle.addEventListener('click', openScanPanel);

document.addEventListener('click', (event) => {
  if (!scanPanel.classList.contains('open')) return;
  if (scanPanel.contains(event.target) || btnToggle.contains(event.target)) return;
  closeScanPanel();
});

// ── Init ──────────────────────────────────────────────────────────────────
buildGrid();
scanInput.focus();

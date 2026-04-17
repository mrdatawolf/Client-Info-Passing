'use strict';

const { contextBridge, ipcRenderer } = require('electron');
const { parse } = require('aamva-parser');

// ── Field ID normalization ────────────────────────────────────────────────
// Both PDF417 and QR scanners send field data packed without \n separators
// between fields.  The aamva-parser uses greedy (.+) regexes that consume
// everything to end-of-line, so each field value captures all remaining data
// unless we insert \n before every recognized field ID first.
//
// The one tricky case: California's document discriminator (DCF) embeds a
// sequence that contains "DDF" — e.g. "07/05/202252635/DDFD/27".
// We guard against that with a (?<!\/) negative lookbehind so we never
// split after a slash (slashes don't appear at the end of real field values).

const FIELD_IDS = [
  // DA series
  'DAA','DAB','DAC','DAD','DAE','DAF','DAG','DAH','DAI','DAJ','DAK',
  'DAL','DAM','DAN','DAO','DAP','DAQ','DAR','DAS','DAT','DAU','DAV',
  'DAW','DAX','DAY','DAZ',
  // DB series
  'DBA','DBB','DBC','DBD','DBE','DBF','DBG','DBH','DBI','DBJ','DBK',
  'DBL','DBM','DBN','DBO','DBP','DBQ','DBR','DBS','DBT','DBU','DBV',
  'DBW','DBX','DBY','DBZ',
  // DC series
  'DCA','DCB','DCC','DCD','DCE','DCF','DCG','DCH','DCI','DCJ','DCK',
  'DCL','DCM','DCN','DCO','DCP','DCQ','DCR','DCS','DCT','DCU','DCV',
  'DCW','DCX','DCY','DCZ',
  // DD series
  'DDA','DDB','DDC','DDD','DDE','DDF','DDG','DDH','DDI','DDJ','DDK',
  'DDL','DDM','DDN','DDO','DDP','DDQ','DDR','DDS','DDT','DDU','DDV',
  'DDW','DDX','DDY','DDZ',
  // DE series (used in newer AAMVA / QR versions)
  'DEU','DEA','DEB','DEC','DED','DEF','DEG','DEH','DEI','DEJ','DEK',
  // ZC series (California state-specific)
  'ZCA','ZCB','ZCC','ZCD','ZCE','ZCF','ZCG','ZCH','ZCI','ZCJ','ZCK',
  'ZCL','ZCM','ZCN','ZCO','ZCP','ZCQ','ZCR','ZCS','ZCT','ZCU','ZCV',
  'ZCW','ZCX','ZCY','ZCZ',
];

// Matches any known field ID NOT preceded by '/' (guards against DCF false-positives)
const FIELD_SPLIT_RE = new RegExp(`(?<!\\/)(?=${FIELD_IDS.join('|')})`, 'gi');

function isQR(raw) {
  const first = raw.trimStart()[0];
  return first !== '@' && !/^ANSI\s/i.test(raw.trim());
}

function normalizeData(raw) {
  let data = raw;

  if (isQR(data)) {
    // Strip leading compliance-indicator byte (e.g. '2' / \x02)
    data = data.replace(/^[^A-Za-z@\n]+/, '');
    // Fix mixed-case AAMVA header: 'nsI ' → 'ANSI '
    data = data.replace(/^.{0,2}[Nn][Ss][Ii]\s/, 'ANSI ');
    // Uppercase everything — AAMVA field data is all-caps; values won't change meaning
    data = data.toUpperCase();
  }

  // Insert \n before every field ID so aamva-parser's per-line regex terminates correctly
  return data.replace(FIELD_SPLIT_RE, '\n');
}

// ── Exposed API ───────────────────────────────────────────────────────────

const isoDate = (d) => (d instanceof Date && !isNaN(d) ? d.toISOString() : null);

contextBridge.exposeInMainWorld('aamva', {
  parse(raw) {
    try {
      const r = parse(normalizeData(raw));
      return {
        ok: true,
        data: {
          driversLicenseId: r.driversLicenseId  ?? null,
          firstName:        r.firstName         ?? null,
          lastName:         r.lastName          ?? null,
          middleName:       r.middleName        ?? null,
          dateOfBirth:      isoDate(r.dateOfBirth),
          expirationDate:   isoDate(r.expirationDate),
          issueDate:        isoDate(r.issueDate),
          streetAddress:    r.streetAddress     ?? null,
          city:             r.city              ?? null,
          state:            r.state             ?? null,
          postalCode:       r.postalCode        ?? null,
          eyeColor:         r.eyeColor          ?? null,
          hairColor:        r.hairColor         ?? null,
          height:           r.height != null ? String(r.height) : null,
          weight:           r.weight            ?? null,
          gender:           r.gender            ?? null,
          country:          r.country           ?? null,
          expired:          r.expired           === true,
        },
      };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  },
});

contextBridge.exposeInMainWorld('scanner', {
  onScan(callback) {
    ipcRenderer.on('scan-complete', (_event, data) => callback(data));
  },
});

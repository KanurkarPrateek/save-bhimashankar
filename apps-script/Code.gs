/** @OnlyCurrentDoc */
/**
 * Save Bhimashankar — petition signatures into this Google Sheet.
 *
 * Only the site's Cloudflare Worker can add rows: every request must carry
 * the secret key below, which lives only here and in the Worker. The web app
 * never returns any sheet data.
 *
 * Setup: Extensions → Apps Script in your sheet, paste this file,
 * Deploy → New deployment → Web app → Execute as: Me, Who has access: Anyone.
 */
const SECRET = "PASTE_SECRET_HERE";
const SHEET_NAME = "Signatures";

function doPost(e) {
  let p;
  try { p = JSON.parse(e.postData.contents); } catch (err) { return out_({ ok: false }); }
  if (!p || p.secret !== SECRET) return out_({ ok: false });           // not from our Worker
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    sheet_().appendRow([
      new Date(), clean_(p.name, 80), clean_(p.city, 60), clean_(p.email, 120),
      clean_(p.why, 400), clean_(p.lang, 5), clean_(p.country, 4),
    ]);
  } finally { lock.releaseLock(); }
  return out_({ ok: true });
}

// Nothing to read here.
function doGet() { return out_({ ok: true }); }

function sheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow(["Time", "Name", "City / village", "Email", "Why it matters", "Language", "Country"]);
    sh.setFrozenRows(1);
    sh.getRange("A1:G1").setFontWeight("bold");
  }
  return sh;
}

// Text only: a leading = + - @ would make the sheet run it as a formula.
function clean_(v, n) {
  v = String(v == null ? "" : v).replace(/[\u0000-\u001f]/g, " ").trim().slice(0, n);
  return /^[=+\-@]/.test(v) ? "'" + v : v;
}

function out_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

/**
 * Stackadoo — gift code backend (Google Apps Script)
 * One-use-each unlock codes so you control exactly how many free games you give out.
 * Codes live in a Google Sheet ('codes' tab); each burns after a single redemption.
 *
 * Setup: see gift-codes/SETUP.md
 */

function doGet(e)  { return handle(e); }
function doPost(e) { return handle(e); }

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function sheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName('codes');
  if (!sh) { sh = ss.insertSheet('codes'); sh.appendRow(['code', 'used', 'redeemedAt']); }
  return sh;
}

function handle(e) {
  var p = (e && e.parameter) || {};
  var action = p.action || 'redeem';
  var code = String(p.code || '').trim().toUpperCase();
  if (!code) return json_({ ok: false, reason: 'empty' });

  var lock = LockService.getScriptLock();
  try { lock.waitLock(8000); } catch (err) { return json_({ ok: false, reason: 'busy' }); }
  try {
    var sh = sheet_();
    var data = sh.getDataRange().getValues();        // [header, ...rows]: code | used | redeemedAt
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]).trim().toUpperCase() === code) {
        var used = data[i][1] === true || String(data[i][1]).toLowerCase() === 'true';
        if (action === 'check') return json_({ ok: !used, used: used });
        if (used) return json_({ ok: false, reason: 'used' });
        sh.getRange(i + 1, 2).setValue(true);        // burn it
        sh.getRange(i + 1, 3).setValue(new Date());
        return json_({ ok: true });
      }
    }
    return json_({ ok: false, reason: 'invalid' });
  } finally { lock.releaseLock(); }
}

/* ----- run these by hand from the Apps Script editor (Run ▸ pick the function) ----- */

/** Seed the 10 codes that currently ship in the game (run once). */
function seedShippedCodes() {
  var codes = ['STK-E8UZD', 'STK-8CSPM', 'STK-XYBJ6', 'STK-K7MUE', 'STK-7SN4K',
               'STK-EKEDD', 'STK-FBGY4', 'STK-Z3X58', 'STK-7KG4E', 'STK-EY934'];
  var sh = sheet_();
  codes.forEach(function (c) { sh.appendRow([c, false, '']); });
  Logger.log('Seeded ' + codes.length + ' codes.');
}

/** Generate N brand-new unique codes (e.g. addCodes(20) for 20 more free games). */
function addCodes(n) {
  n = n || 10;
  var chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';   // no confusable 0/O/1/I/L
  var sh = sheet_(), made = [];
  var existing = {};
  sh.getDataRange().getValues().forEach(function (r) { existing[String(r[0]).toUpperCase()] = 1; });
  while (made.length < n) {
    var s = 'STK-';
    for (var i = 0; i < 5; i++) s += chars[Math.floor(Math.random() * chars.length)];
    if (existing[s]) continue;
    existing[s] = 1; made.push(s); sh.appendRow([s, false, '']);
  }
  Logger.log('New codes (hand these out):\n' + made.join('\n'));
  return made;
}

/** How many free games are left vs redeemed. */
function stats() {
  var data = sheet_().getDataRange().getValues();
  var total = 0, used = 0;
  for (var i = 1; i < data.length; i++) {
    total++;
    if (data[i][1] === true || String(data[i][1]).toLowerCase() === 'true') used++;
  }
  Logger.log('Codes: ' + total + ' total, ' + used + ' redeemed, ' + (total - used) + ' still available.');
  return { total: total, used: used, available: total - used };
}

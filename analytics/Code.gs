/**
 * Stackadoo — anonymous usage backend (Google Apps Script)
 * Counts visits, players and active games. NO names, emails, or personal data —
 * just a random per-device tag. Powers the private admin.html page.
 *
 * Setup: see analytics/SETUP.md
 */

var ADMIN_KEY   = 'changeme';   // must match ADMIN_KEY in admin.html
var OWNER_EMAIL = '';           // your email for the weekly summary (leave '' to disable email)

function doGet(e)  { return handle(e); }
function doPost(e) { return handle(e); }

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function handle(e) {
  var p = (e && e.parameter) || {};
  if (p.report) {                                   // admin page asking for the numbers
    if (p.key !== ADMIN_KEY) return json_({ ok: false, error: 'unauthorized' });
    return json_(report());
  }
  if (p.hero) { logHero_(p.hero); return json_({ ok: true }); }   // hero tally only - no device row
  if (p.id) logPing(p.id, p.e || 'visit', p.g === '1' ? 1 : 0, Number(p.t) || Date.now());
  return json_({ ok: true });
}

function sheets_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var dev = ss.getSheetByName('devices');
  if (!dev) { dev = ss.insertSheet('devices'); dev.appendRow(['id', 'firstSeen', 'lastSeen', 'played', 'hasGame', 'lastDay']); }
  var day = ss.getSheetByName('daily');
  if (!day) { day = ss.insertSheet('daily'); day.appendRow(['date', 'visitors']); }
  var hero = ss.getSheetByName('heroes');
  if (!hero) { hero = ss.insertSheet('heroes'); hero.appendRow(['hero', 'picks', 'lastPicked']); }
  return { dev: dev, day: day, hero: hero };
}

function today_() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
}

/**
 * Normalise a date cell back to 'yyyy-MM-dd'.
 * We WRITE the string '2026-09-09', but Sheets silently turns that cell into a real
 * Date - so reading it back gives a Date object, and `String(cell) === tday` never
 * matched. Result: every heartbeat appended a brand-new daily row instead of
 * incrementing one, and the same-day check below always fired. Always compare
 * through this.
 */
function dayKey_(v) {
  if (v instanceof Date) return Utilities.formatDate(v, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  return String(v || '');
}

/** Upsert one row per device (keeps the sheet small no matter how many heartbeats). */
function logPing(id, ev, g, t) {
  var lock = LockService.getScriptLock();
  try { lock.waitLock(8000); } catch (err) { return; }
  try {
    var s = sheets_(), dev = s.dev;
    var data = dev.getDataRange().getValues();      // [header, ...rows]
    var rowIndex = -1;
    for (var i = 1; i < data.length; i++) { if (data[i][0] === id) { rowIndex = i; break; } }
    var tday = today_();
    var playedNow = (ev === 'play') ? 1 : 0;
    if (rowIndex === -1) {
      dev.appendRow([id, t, t, playedNow, g, tday]);
      bumpDay_(s.day, tday);
    } else {
      var r = rowIndex + 1;                          // 1-based sheet row
      var prev = data[rowIndex];
      var lastSeen = Math.max(Number(prev[2]) || 0, t);
      var played = (Number(prev[3]) || 0) || playedNow;
      dev.getRange(r, 3, 1, 3).setValues([[lastSeen, played, g]]);   // lastSeen, played, hasGame(latest)
      if (dayKey_(prev[5]) !== tday) { dev.getRange(r, 6).setValue(tday); bumpDay_(s.day, tday); }
    }
  } finally { lock.releaseLock(); }
}

/**
 * Tally one hero pick. Deliberately stores NO device id - just a running count per
 * hero - so it answers "is anyone playing this one?" without linking heroes to people.
 */
function logHero_(id) {
  id = String(id || '').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 24);
  if (!id) return;
  var lock = LockService.getScriptLock();
  try { lock.waitLock(8000); } catch (err) { return; }
  try {
    var h = sheets_().hero, data = h.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]) === id) {
        h.getRange(i + 1, 2, 1, 2).setValues([[(Number(data[i][1]) || 0) + 1, Date.now()]]);
        return;
      }
    }
    h.appendRow([id, 1, Date.now()]);
  } finally { lock.releaseLock(); }
}

/** Count one distinct device for "visitors today". */
function bumpDay_(day, tday) {
  var data = day.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (dayKey_(data[i][0]) === tday) { day.getRange(i + 1, 2).setValue((Number(data[i][1]) || 0) + 1); return; }
  }
  day.appendRow([tday, 1]);
}

function report() {
  var s = sheets_();
  var data = s.dev.getDataRange().getValues();
  var now = Date.now(), d7 = now - 7 * 864e5, d5m = now - 5 * 6e4;
  var visitorsAll = 0, playersAll = 0, visitors7 = 0, players7 = 0, activeNow = 0, activeGames7 = 0;
  for (var i = 1; i < data.length; i++) {
    var lastSeen = Number(data[i][2]) || 0;
    var played = (Number(data[i][3]) || 0) === 1;
    var hasGame = (Number(data[i][4]) || 0) === 1;
    var isPlayer = played || hasGame;
    visitorsAll++;
    if (isPlayer) playersAll++;
    if (lastSeen >= d7) { visitors7++; if (isPlayer) players7++; if (hasGame) activeGames7++; }
    if (lastSeen >= d5m) activeNow++;
  }
  var hd = s.hero.getDataRange().getValues(), heroes = [];
  for (var k = 1; k < hd.length; k++) heroes.push({ hero: String(hd[k][0]), picks: Number(hd[k][1]) || 0 });
  heroes.sort(function (a, b) { return b.picks - a.picks; });
  // Sum by date: the bug above scattered each day across many rows, so fold them
  // back together rather than showing the same date seven times.
  var dd = s.day.getDataRange().getValues(), byDay = {}, rows = [];
  for (var j = 1; j < dd.length; j++) {
    var k = dayKey_(dd[j][0]);
    if (k) byDay[k] = (byDay[k] || 0) + (Number(dd[j][1]) || 0);
  }
  for (var key in byDay) rows.push({ date: key, visitors: byDay[key] });
  rows.sort(function (a, b) { return a.date < b.date ? -1 : 1; });
  return {
    ok: true, generated: now,
    visitorsAll: visitorsAll, playersAll: playersAll,
    visitors7: visitors7, players7: players7,
    activeNow: activeNow, activeGames7: activeGames7,
    heroes: heroes,
    daily: rows.slice(-7)
  };
}

/**
 * Weekly email summary. Only sends if there was traffic this week, so you won't
 * get a pile of empty emails before the site has traction.
 * Add a weekly time-driven trigger for this function (see SETUP.md).
 */
function weeklyEmail() {
  if (!OWNER_EMAIL) return;
  var r = report();
  if ((r.visitors7 || 0) === 0) return;             // no traffic → stay quiet
  var drawPct = r.visitors7 ? Math.round(r.players7 / r.visitors7 * 100) : 0;
  var body = [
    'Stackadoo — weekly summary', '',
    'This week',
    '  Visitors:     ' + r.visitors7,
    '  Players:      ' + r.players7 + ' (' + drawPct + '% of visitors started a game)',
    '  Active games: ' + r.activeGames7, '',
    'All time',
    '  Visitors: ' + r.visitorsAll,
    '  Players:  ' + r.playersAll
  ].join('\n');
  MailApp.sendEmail(OWNER_EMAIL, '🌱 Stackadoo weekly — ' + r.visitors7 + ' visitors', body);
}

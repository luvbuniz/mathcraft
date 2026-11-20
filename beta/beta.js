(async function() {
  'use strict';
  const $ = id => document.getElementById(id), core = window.StackadooTransfer;
  let releaseWorld = () => {};
  let source = null, instance = null, starting = false, importing = false, localSource = false, pendingOriginal = null, lookupVersion = 0, findAfterSignIn = false;
  const BETA_JS = 'cache9';   // bump with the ?v= in play.html; printed in the console so testers can tell what is live
  const say = text => { $('status').textContent = text; };
  // cache6 (Pip dojo9: one reload in ~17 sat at 70% 'Opening the game…' for 2.5+ min with the console silent after
  // Unity's cached-code lines): every loading step is logged with its time, every device-storage read has a time
  // limit (a stuck read falls back to the network), and a watchdog offers 'Tap to retry' if nothing moves for a while.
  const T0 = performance.now(), LIMIT = 20000;
  let lastStage = 'start', lastMove = T0, loadDone = false, watchdog = 0;
  const stage = text => { lastStage = text; lastMove = performance.now(); console.log('[Stackadoo load] ' + text + ' (+' + Math.round(lastMove - T0) + ' ms)'); };
  const moved = () => { lastMove = performance.now(); };
  const limit = (promise, what, ms = LIMIT) => { let timer; return Promise.race([promise, new Promise((_, fail) => { timer = setTimeout(() => fail(Error('stalled: ' + what)), ms); })]).finally(() => clearTimeout(timer)); };
  const RETRY_KEY = 'stackadoo.beta.retryFromNetwork';
  let fromNetwork = false; try { fromNetwork = !!sessionStorage.getItem(RETRY_KEY); sessionStorage.removeItem(RETRY_KEY); } catch {}
  function offerRetry(why) {
    if (loadDone || $('load-retry')) return;
    stage('STALLED: ' + why + ' (no progress for ' + Math.round((performance.now() - lastMove) / 1000) + ' s); offering Tap to retry');
    const button = document.createElement('button'); button.id = 'load-retry'; button.className = 'button'; button.textContent = 'Tap to retry';
    button.style.cssText = 'font-size:22px;min-height:56px;padding:12px 28px;cursor:pointer';
    button.onclick = () => { try { sessionStorage.setItem(RETRY_KEY, lastStage); } catch {} location.reload(); };
    $('load-message').textContent = 'Opening is taking longer than it should. If it stays stuck, tap to retry (the game downloads again).';
    $('loading').append(button);
  }
  function startWatchdog() {
    clearInterval(watchdog);
    watchdog = setInterval(() => {
      if (loadDone) { clearInterval(watchdog); return; }
      // downloads on a slow connection may take a while per 20 MB part; everything else should keep moving
      const allowed = /^download/.test(lastStage) ? 90000 : /^unity starting/.test(lastStage) ? 60000 : 25000;
      if (performance.now() - lastMove > allowed) { clearInterval(watchdog); offerRetry(lastStage); }
    }, 2000);
  }
  // The site-wide sw.js (old game) would otherwise also control /beta/ and copy every game download into its own
  // cache. This tiny /beta/ worker takes over these pages instead; it has no fetch handler, so requests go straight out.
  try { navigator.serviceWorker?.register('sw.js?v=1', {scope:'./'}).catch(() => {}); } catch {}
  // ---- on-device game cache (Cache Storage; Unity keeps the code files in its own IndexedDB cache) ----
  async function openGameStore(version) {
    try {
      if (!window.caches || !version) return null;
      const name = 'stackadoo-beta-' + version, keys = await limit(caches.keys(), 'cache list');
      const old = keys.filter(k => k.startsWith('stackadoo-beta-') && k !== name);
      await limit(Promise.all(old.map(k => caches.delete(k))), 'old cache delete');
      let seen = null; try { seen = localStorage.getItem('stackadoo.beta.cachedBuild'); } catch {}
      if (fromNetwork || (seen && seen !== version) || (!seen && old.length)) {   // also after a stalled load: fetch Unity's code fresh   // a new build: Unity's cached code files belong to the old one
        await limit(Promise.all(keys.filter(k => k.startsWith('UnityCache')).map(k => caches.delete(k))), 'unity cache delete');
        await limit(new Promise(done => { try { const r = indexedDB.deleteDatabase('UnityCache'); r.onsuccess = r.onerror = r.onblocked = done; } catch { done(); } }), 'unity db delete', 8000).catch(() => {});
      }
      try { localStorage.setItem('stackadoo.beta.cachedBuild', version); } catch {}
      try { navigator.storage?.persist?.(); } catch {}
      return {cache: await limit(caches.open(name), 'cache open'), hit: false};
    } catch (e) { stage('device storage unavailable (' + (e.message || e) + '), using the network'); return null; }
  }
  // The world file (about 226 MB packed, 258 MB unpacked) is kept on the device already unpacked, as one disk-backed
  // entry. A later visit hands it to Unity as it is: Unity reads it once into a single buffer of the right size, with
  // no packed copy and no in-page unzip (that pair was the 500+ MB spike while 'Opening the game…').
  const WORLD = 'Build/world-unpacked', WORLD_SIZE = 'Build/world-unpacked-bytes';
  async function savedWorld(store) {
    try {
      if (!store) return null;
      if (fromNetwork) { stage('retry after a stall: dropping the saved world, downloading again'); await limit(Promise.all([store.cache.delete(WORLD_SIZE), store.cache.delete(WORLD)]), 'saved world delete'); return null; }
      const size = await limit(store.cache.match(WORLD_SIZE), 'saved size'), found = size && await limit(store.cache.match(WORLD), 'saved world lookup');
      if (!found) return null;
      const blob = await limit(found.blob(), 'saved world open');   // disk-backed: nothing is read into memory here
      if (!blob.size || blob.size !== Number(await limit(size.text(), 'saved size read'))) { await store.cache.delete(WORLD_SIZE); await store.cache.delete(WORLD); return null; }
      store.hit = true; return blob;
    } catch (e) { stage('saved world not usable (' + (e.message || e) + '), downloading'); try { store.cache.delete(WORLD_SIZE); store.cache.delete(WORLD); } catch {} return null; }
  }
  // Downloads each part (checked against its size and SHA-256), and, when it can, unpacks it straight into the
  // device cache as it arrives: only one 20 MB part is in memory at a time. Without Cache Storage or a built-in
  // gzip unpacker it falls back to handing Unity the packed parts (Unity unpacks them itself).
  async function downloadWorld(parts, store, show, unpack) {
    let writer = null, put = null, pieces = [], size = 0, done = 0;
    if (unpack) { const ds = new DecompressionStream('gzip'); writer = ds.writable.getWriter(); put = store.cache.put(WORLD, new Response(ds.readable, {headers:{'Content-Type':'application/octet-stream'}})); put.catch(() => {}); }
    for (const part of parts) {
      stage('download part ' + (parts.indexOf(part) + 1) + ' of ' + parts.length);
      const download = await fetch(part.url, {cache:'no-store'});
      if (!download.ok) { writer?.abort().catch(() => {}); throw Error('A game download was interrupted. Please try again.'); }
      let bytes = await download.arrayBuffer();
      const hash = [...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(x=>x.toString(16).padStart(2,'0')).join('');
      if (bytes.byteLength !== part.bytes || hash !== part.sha256) { writer?.abort().catch(() => {}); throw Error('A game file did not download correctly. Please reload and try again.'); }
      if (part === parts[parts.length - 1]) size = new DataView(bytes).getUint32(bytes.byteLength - 4, true);   // gzip footer: unpacked size
      if (writer) await limit(writer.write(new Uint8Array(bytes)), 'saving part to the device', 60000); else pieces.push(bytes);
      bytes = null; done += part.bytes; show(done, false);
    }
    if (!writer) return new Blob(pieces, {type:'application/octet-stream'});
    stage('download done; finishing the saved copy');
    await limit(writer.close(), 'saved copy close', 60000); await limit(put, 'saved copy write', 60000);
    const blob = await limit((async () => (await store.cache.match(WORLD))?.blob())(), 'saved copy reopen');
    if (!blob || blob.size !== size) { await store.cache.delete(WORLD); throw Error('unpack size'); }
    await limit(store.cache.put(WORLD_SIZE, new Response(String(size))), 'saved size write');   // written last: marks the saved world complete
    return blob;
  }
  // cache3 (Pip dojo6: 536-655 MB for ~2 s while opening): Unity used to read the world through a stream, so the
  // whole file passed through the page twice (thousands of small chunks waiting to be freed, plus its own buffer).
  // Now the page fills ONE buffer of exactly the world's size straight from the device copy (a BYOB read writes into
  // it in place, nothing else is allocated), hands that buffer to Unity, which keeps it as the game file, and drops
  // its own reference. The buffer is only filled when Unity asks for it, after its code has loaded.
  async function worldBuffer(blob) {
    let buffer = new ArrayBuffer(blob.size), offset = 0;
    try {
      const reader = blob.stream().getReader({mode:'byob'});
      while (offset < blob.size) {
        const {value, done} = await limit(reader.read(new Uint8Array(buffer, offset, Math.min(blob.size - offset, 4 << 20))), 'saved world read at ' + Math.round(offset / 1048576) + ' MB');
        if (done) break;
        buffer = value.buffer; offset += value.byteLength; moved();   // the read hands back the same memory
        if (offset % (64 << 20) < value.byteLength) stage('world read ' + Math.round(offset / 1048576) + ' MB');
      }
      reader.releaseLock();
    } catch (e) {   // no in-place reads here (or one stalled): copy 8 MB slices into the buffer instead
      stage('world read by slices (' + (e.message || e) + ')');
      if (buffer.detached || buffer.byteLength !== blob.size) buffer = new ArrayBuffer(blob.size);
      const into = new Uint8Array(buffer);
      for (offset = 0; offset < blob.size; offset += 8 << 20) { into.set(new Uint8Array(await limit(blob.slice(offset, offset + (8 << 20)).arrayBuffer(), 'saved world slice at ' + Math.round(offset / 1048576) + ' MB')), offset); moved(); }
      offset = blob.size;   // every slice landed (the loop steps past the end)
    }
    if (offset !== blob.size) throw Error('The saved game could not be read. Please reload.');
    return buffer;
  }
  const WORLD_URL = new URL('Build/stackadoo-world.data#device', location.href).href;
  function handWorldToUnity(blob, parts) {
    const realFetch = window.fetch;
    window.fetch = function(input, init) {
      const url = typeof input === 'string' ? input : input?.url;
      if (url !== WORLD_URL || !blob) return realFetch.apply(window, arguments);
      window.fetch = realFetch; const source = blob; blob = null;
      stage('unity asked for the world (' + Math.round(source.size / 1048576) + ' MB)');
      const fromDevice = source.packed ? source.arrayBuffer() : worldBuffer(source);
      return fromDevice.catch(e => {   // the saved copy could not be read in time: forget it and use the network
        stage('world read failed (' + (e.message || e) + '); downloading it instead');
        try { localStorage.removeItem('stackadoo.beta.cachedBuild'); caches.keys().then(keys => keys.filter(k => k.startsWith('stackadoo-beta-')).forEach(k => caches.delete(k))); } catch {}
        return downloadWorld(parts, null, (done) => { moved(); $('load-message').textContent = 'Downloading the world: ' + Math.round(done/1048576) + ' MB'; }, false).then(b => b.arrayBuffer());
      }).then(buffer => { stage('world handed to Unity'); return buffer; }).then(buffer => ({ok:true, status:200, statusText:'OK', url:WORLD_URL, type:'basic', redirected:false, body:null, bodyUsed:false,
        // Unity's reader sets aside a buffer as big as Content-Length before it looks at the body; with no body it uses
        // arrayBuffer() instead, so a 0 here keeps it from reserving a second 258 MB (and from warning about no length)
        headers:new Headers({'Content-Length':'0', 'Content-Type':'application/octet-stream'}),
        arrayBuffer() { const b = buffer; buffer = null; return b ? Promise.resolve(b) : Promise.reject(Error('used')); },   // Unity takes it; the page keeps nothing
        clone() { return this; }}));
    };
    return () => { if (window.fetch !== realFetch && blob) window.fetch = realFetch; blob = null; };
  }
  async function cachedScript(store, url) {
    try {
      if (!store) return url;
      let found = await limit(store.cache.match(url), 'loader lookup');
      if (!found) { const r = await fetch(url, {cache:'no-store'}); if (!r.ok) return url; await limit(store.cache.put(url, r), 'loader save'); found = await limit(store.cache.match(url), 'loader reopen'); }
      return found ? URL.createObjectURL(new Blob([await limit(found.blob(), 'loader read')], {type:'text/javascript'})) : url;
    } catch { return url; }
  }
  function showSource(value, label) {
    localSource = false; source = value; $('players').replaceChildren(); $('transfer').hidden = false;
    for (const name of source.names) {
      const row = document.createElement('label'), input = document.createElement('input'), text = document.createElement('span');
      input.type = 'checkbox'; input.value = name; text.textContent = name;
      input.addEventListener('change', () => { $('import').disabled = !selected().length || importing; });
      row.append(input, text); $('players').append(row);
    }
    $('import').disabled = true; $('source-note').textContent = label;
    say(source.names.length ? 'Choose the player or players you want to copy.' : 'No old games were found here. Try the browser you used before, check a cloud backup, or start a new adventure.');
  }
  function selected() { return [...$('players').querySelectorAll('input:checked')].map(input => input.value); }
  $('check-local').onclick = () => {
    ++lookupVersion;$('cloud').disabled=false;
    try { showSource(core.fromStorage(localStorage), 'Games saved in this browser. The originals will stay unchanged.'); localSource = true; }
    catch (e) { say(e.message || 'This browser did not allow access to old saves. You can choose a backup file instead.'); }
  };
  $('backup-file').onchange = async event => {
    try {
      const file = event.target.files[0]; if (!file) return;
      ++lookupVersion;$('cloud').disabled=false;
      if (file.size > 20 * 1024 * 1024) throw Error('Choose a backup smaller than 20 MB.');
      showSource(core.fromJSON(await file.text()), 'A copy from your backup file. Learning records are included.');
    } catch (e) { say(e.message || 'That backup could not be opened.'); }
    finally { event.target.value = ''; }
  };
  async function checkCloud() {
    const account = window.StackadooBetaAccount, user = account?.auth.currentUser;
    if (!user) { findAfterSignIn=true; $('signin-dialog').showModal(); say('Sign in with the parent account you used before. We will then check for its old backup.'); return; }
    localSource=false;source=null;$('players').replaceChildren();$('transfer').hidden=true;$('import').disabled=true;
    const lookup=++lookupVersion;
    $('cloud').disabled = true; say('Looking for a backup in your parent account…');
    try {
      const {sdk, db} = await firestore();
      const snap = await sdk.getDocFromServer(sdk.doc(db, 'users', user.uid));   // read only: users/{uid} is never written here
      if (lookup!==lookupVersion || account.auth.currentUser?.uid!==user.uid) return;
      const blob = snap.data()?.blob;
      if (!snap.exists() || typeof blob !== 'string') { say('No cloud backup was found. Games may still be saved on the device where you played.'); return; }
      showSource(core.fromJSON(blob), 'Copy from this parent account’s cloud backup. We will not change the cloud backup.');
    } catch { if(lookup===lookupVersion) say('We could not read the cloud backup. Check your connection and parent account, or use a backup file.'); }
    finally { if(lookup===lookupVersion) $('cloud').disabled = false; }
  }
  $('cloud').onclick=checkCloud;
  function openFinder() {
    if(importing)return;
    $('signin-dialog').close();closeWebsiteControls();
    document.body.classList.remove('playing');$('setup').hidden=false;$('game').hidden=true;
    $('check-local').click();
    $('other-saves').open=true;
    if(!source?.names.length) checkCloud();
    $('check-local').focus();
  }
  window.addEventListener('stackadoo-find-players',openFinder);
  $('signin-dialog').addEventListener('close',()=>{findAfterSignIn=false;});
  window.addEventListener('stackadoo-account',event=>{
    ++lookupVersion;
    if(!localSource){source=null;$('players').replaceChildren();$('transfer').hidden=true;$('import').disabled=true;}
    $('cloud').disabled=false;
    if(event.detail.signedIn && findAfterSignIn){findAfterSignIn=false;$('signin-dialog').close();checkCloud();}
    if(event.detail.signedIn) autoImportOldGame();
    cloudSignedIn();
  });
  // ---- d14: grown-up cloud backup / restore, and the old game brought over on sign-in ----
  // Firestore paths: users/{uid}/stackadoo/{player} only (one snapshot per player, written whole with setDoc). users/{uid}
  // and its old-game 'blob' are only ever read. Unity side: CloudSnapshot (export/import with a local copy first) and
  // OldGameAutoImport (already imported here / same name as a player here).
  let fsdk = null, fdb = null;
  const waiting = {};
  async function firestore() {
    const account = window.StackadooBetaAccount;
    if (!account) throw Object.assign(Error('signed out'), {code: 'signed-out'});
    if (!fsdk) fsdk = await import('https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js');
    if (!fdb) {
      fdb = fsdk.getFirestore(account.app);
      const emu = window.STACKADOO_AUTH_CONFIG?.emulator;   // local QA only (never set in the live auth-config.js)
      if (emu?.firestore) fsdk.connectFirestoreEmulator(fdb, emu.firestore[0], emu.firestore[1]);
    }
    return {sdk: fsdk, db: fdb};
  }
  async function gameReady(ms = 600000) {
    const t = performance.now();
    while (!(instance && !starting)) { if (performance.now() - t > ms) throw Object.assign(Error('no game'), {code: 'no-game'}); await new Promise(r => setTimeout(r, 500)); }
  }
  function askUnity(method, arg, kind, ms = 30000) {
    return new Promise((resolve, reject) => {
      if (!instance) { reject(Object.assign(Error('no game'), {code: 'no-game'})); return; }
      const timer = setTimeout(() => { delete waiting[kind]; reject(Object.assign(Error('timeout'), {code: 'timeout'})); }, ms);
      waiting[kind] = result => { clearTimeout(timer); resolve(result); };
      instance.SendMessage('Stackadoo web transfer', method, arg);
    });
  }
  const KB = bytes => Math.max(1, Math.round(bytes / 1024)) + ' KB';
  const when = iso => { try { return new Date(iso).toLocaleString([], {dateStyle: 'medium', timeStyle: 'short'}); } catch { return iso || 'an earlier day'; } };
  const SNAPSHOT_LIMIT = 900 * 1024, GZIP_FROM = 256 * 1024;
  async function pack(text) {
    if (text.length < GZIP_FROM || !window.CompressionStream) return {encoding: 'json', snapshot: text};
    const gz = new Uint8Array(await new Response(new Blob([text]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer());
    let bin = ''; for (let i = 0; i < gz.length; i += 0x8000) bin += String.fromCharCode.apply(null, gz.subarray(i, i + 0x8000));
    return {encoding: 'gzip-base64', snapshot: btoa(bin)};
  }
  async function unpack(data) {
    if (data.encoding !== 'gzip-base64') return data.snapshot;
    const bin = atob(data.snapshot), bytes = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).text();
  }
  function cloudError(e) {
    const code = e?.code || '';
    if (code === 'signed-out') return 'Sign in with your parent account first.';
    if (code === 'no-game') return 'Open the game first, then try again.';
    if (code === 'timeout') return 'The game didn\u2019t answer. Please try again.';
    if (!navigator.onLine || code === 'unavailable' || code === 'failed-precondition') return 'You\u2019re offline. Connect to the internet and try again. Nothing was changed.';
    if (code === 'permission-denied') return 'Your parent account can\u2019t save backups yet. Nothing was changed. Please try again later.';
    if (code === 'invalid-argument' || code === 'resource-exhausted') return 'This game is too big to back up. Nothing was changed.';
    return 'That didn\u2019t work. Nothing was changed. Please try again.';
  }
  const cloudSay = text => { $('cloud-status').textContent = text; };
  function cloudBusy(on) { for (const id of ['cloud-backup', 'cloud-restore', 'cloud-undo']) $(id).disabled = on; $('cloud-list').querySelectorAll('button').forEach(b => b.disabled = on); }
  function askGrownUp(text, yes) {
    return new Promise(resolve => {
      $('cloud-confirm-text').textContent = text; $('cloud-yes').textContent = yes; $('cloud-confirm').hidden = false; $('cloud-yes').focus();
      const finish = answer => { $('cloud-confirm').hidden = true; $('cloud-yes').onclick = $('cloud-no').onclick = null; resolve(answer); };
      $('cloud-yes').onclick = () => finish(true); $('cloud-no').onclick = () => finish(false);
    });
  }
  function signedInUser() { const user = window.StackadooBetaAccount?.auth.currentUser; if (!user) throw Object.assign(Error('signed out'), {code: 'signed-out'}); return user; }
  function cloudSignedIn() { const user = window.StackadooBetaAccount?.auth.currentUser; $('cloud-account').textContent = user ? 'Parent account: ' + (user.email || 'signed in') : 'Sign in with your parent account to back up or restore.'; }
  function openCloud() {
    closeWebsiteControls(); if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen();
    $('cloud-list').replaceChildren(); $('cloud-confirm').hidden = true; cloudSay(''); cloudSignedIn(); $('cloud-dialog').showModal();
  }
  async function cloudBackup() {
    cloudBusy(true); $('cloud-list').replaceChildren();
    try {
      const user = signedInUser(); await gameReady(5000);
      cloudSay('Getting the game ready to back up\u2026');
      const r = await askUnity('CloudExport', '', 'export');
      if (!r.ok) { cloudSay(r.message || 'This game couldn\u2019t be backed up.'); return; }
      const packed = await pack(r.snapshot);
      if (packed.snapshot.length > SNAPSHOT_LIMIT) { cloudSay('This game is too big to back up (' + KB(packed.snapshot.length) + '). Nothing was changed.'); return; }
      const {sdk, db} = await firestore(), ref = sdk.doc(db, 'users', user.uid, 'stackadoo', r.player);
      const old = await sdk.getDocFromServer(ref);
      if (old.exists() && old.data().name !== r.name && !await askGrownUp('Your account already has a backup of ' + (old.data().name || 'another player') + ' from ' + when(old.data().savedAt) + '. Replace it with ' + (r.name || 'this player') + '\u2019s game?', 'Replace backup')) { cloudSay('Nothing was changed.'); return; }
      if (signedInUser().uid !== user.uid) throw Object.assign(Error('account changed'), {code:'signed-out'});
      cloudSay('Backing up\u2026');
      await sdk.setDoc(ref, {schema: 1, player: r.player, name: r.name, savedAt: r.savedAt, gameVersion: JSON.parse(r.snapshot).gameVersion || '', bytes: r.bytes, encoding: packed.encoding, snapshot: packed.snapshot, updatedAt: sdk.serverTimestamp()});
      cloudSay('Backed up ' + (r.name || 'this player') + '\u2019s game to your parent account (' + KB(r.bytes) + ').');
      console.log('[Stackadoo cloud] backup ' + r.player + ' ' + r.bytes + ' bytes (' + packed.encoding + ', ' + packed.snapshot.length + ' stored)');
    } catch (e) { console.warn('[Stackadoo cloud] backup failed', e?.code || e); cloudSay(cloudError(e)); }
    finally { cloudBusy(false); }
  }
  async function cloudRestoreList() {
    cloudBusy(true); $('cloud-list').replaceChildren();
    try {
      const user = signedInUser(); const {sdk, db} = await firestore();
      cloudSay('Looking for backups in your parent account\u2026');
      const list = await sdk.getDocsFromServer(sdk.collection(db, 'users', user.uid, 'stackadoo'));
      const docs = list.docs.filter(d => d.data()?.schema === 1 && typeof d.data().snapshot === 'string');
      if (!docs.length) { cloudSay('No backup was found in this parent account yet. Use Back up to my account first.'); return; }
      cloudSay('Choose the backup to put on this device.');
      for (const d of docs) {
        const data = d.data(), row = document.createElement('div'), text = document.createElement('span'), button = document.createElement('button');
        row.className = 'cloud-row'; text.textContent = (data.name || 'Player') + ' \u00b7 saved ' + when(data.savedAt) + ' \u00b7 ' + KB(data.bytes || data.snapshot.length);
        button.className = 'button cream'; button.textContent = 'Restore this'; button.dataset.player = d.id; button.onclick = () => cloudRestore(data);
        row.append(text, button); $('cloud-list').append(row);
      }
    } catch (e) { console.warn('[Stackadoo cloud] list failed', e?.code || e); cloudSay(cloudError(e)); }
    finally { cloudBusy(false); }
  }
  async function cloudRestore(data) {
    cloudBusy(true);
    try {
      const user = signedInUser(); await gameReady(5000);
      const here = await askUnity('CloudExport', '', 'export');
      const name = here.name || 'this player';
      if (!await askGrownUp('This replaces ' + name + '\u2019s game on this device with the backup of ' + (data.name || 'a player') + ' from ' + when(data.savedAt) + '. We\u2019ll keep a copy of the current game first.', 'Replace ' + name + '\u2019s game')) { cloudSay('Nothing was changed.'); return; }
      if (signedInUser().uid !== user.uid) throw Object.assign(Error('account changed'), {code:'signed-out'});
      cloudSay('Restoring\u2026');
      const text = await unpack(data);
      const r = await askUnity('CloudImport', text, 'import', 60000);
      if (!r.ok) { cloudSay(r.message || 'The restore couldn\u2019t finish. Nothing was changed.'); return; }
      console.log('[Stackadoo cloud] restored ' + r.keys + ' keys into ' + r.player + '; copy of the old game kept in ' + r.backupKey);
      cloudSay('Restored. The game will restart in a moment.');
      setTimeout(() => location.reload(), 2500);   // Unity saved; the page restarts so the game reads the restored save
    } catch (e) { console.warn('[Stackadoo cloud] restore failed', e?.code || e); cloudSay(cloudError(e)); }
    finally { cloudBusy(false); }
  }
  async function cloudUndo() {
    cloudBusy(true);
    try {
      await gameReady(5000);
      if (!await askGrownUp('Put back the game this player had just before the last restore? We\u2019ll keep a copy of the current game first.', 'Put it back')) { cloudSay('Nothing was changed.'); return; }
      const r = await askUnity('CloudUndo', '', 'undo', 60000);
      cloudSay(r.message || (r.ok ? 'Done.' : 'That didn\u2019t work. Nothing was changed.'));
      if (r.ok) setTimeout(() => location.reload(), 2500);
    } catch (e) { cloudSay(cloudError(e)); }
    finally { cloudBusy(false); }
  }
  $('cloud-open').onclick = openCloud; $('cloud-backup').onclick = cloudBackup; $('cloud-restore').onclick = cloudRestoreList; $('cloud-undo').onclick = cloudUndo;
  $('cloud-signin').onclick = () => { $('cloud-dialog').close(); $('signin-dialog').showModal(); };
  // Old game on sign-in: users/{uid}.blob (read only) -> players not yet on this device come over with no extra tap.
  // Once per account per device (and Unity's own once-per-device guard on top); a name already used here asks instead.
  const AUTO_KEY = uid => 'stackadoo.beta.oldGameAuto.' + uid;
  let autoBusy = false;
  function sendImport(payload) { return new Promise(resolve => { waiting.transfer = resolve; importing = true; instance.SendMessage('Stackadoo web transfer', 'ImportSelected', payload); }); }
  function kidNotice(text, buttons = []) {
    $('transfer-result').replaceChildren(document.createTextNode(text));
    if (buttons.length) { const row = document.createElement('div'); row.className = 'link-row'; for (const b of buttons) row.append(b); $('transfer-result').append(row); }
    document.querySelector('.transfer-notice').hidden = false;
  }
  function choice(text, yes, no) {
    return new Promise(resolve => {
      const a = document.createElement('button'), b = document.createElement('button');
      a.className = b.className = 'button cream'; a.textContent = yes; b.textContent = no; a.id = 'auto-import-new'; b.id = 'auto-import-skip';
      $('dismiss-transfer').hidden = true;
      const finish = yes => { $('dismiss-transfer').hidden = false; resolve(yes); };
      a.onclick = () => finish(true); b.onclick = () => finish(false);
      kidNotice(text, [a, b]);
    });
  }
  async function autoImportOldGame() {
    const account = window.StackadooBetaAccount, user = account?.auth.currentUser;
    if (!user || autoBusy) return;
    let handled = null; try { handled = localStorage.getItem(AUTO_KEY(user.uid)); } catch { return; }
    if (handled) { console.log('[Stackadoo old game] already handled on this device (' + handled + ')'); return; }
    autoBusy = true;
    const mark = how => { try { localStorage.setItem(AUTO_KEY(user.uid), how + ' ' + new Date().toISOString()); } catch {} console.log('[Stackadoo old game] ' + how); };
    try {
      const {sdk, db} = await firestore();
      const snap = await sdk.getDocFromServer(sdk.doc(db, 'users', user.uid));   // read only
      if (account.auth.currentUser?.uid !== user.uid) return;
      const blob = snap.exists() ? snap.data()?.blob : null;
      if (typeof blob !== 'string') { mark('no old game'); return; }
      const old = core.fromJSON(blob);
      if (!old.names.length) { mark('no old players'); return; }
      await gameReady();
      if (account.auth.currentUser?.uid !== user.uid) return;
      while (importing) await new Promise(r => setTimeout(r, 500));
      const fresh = [], freshNames = [], taken = [];
      for (const name of old.names) {
        const p = await askUnity('OldGamePreview', core.select(old, [name]), 'preview');
        const info = p.ok && p.players[0];
        if (!info) continue;
        if (info.alreadyHere) continue;            // brought over before on this device: never twice
        if (info.nameTaken) taken.push({name, shown: info.name}); else { fresh.push(name); freshNames.push(info.name); }
      }
      const brought = [];
      if (fresh.length) {
        const r = await sendImport(core.select(old, fresh));
        if (!r.ok) { kidNotice('We couldn\u2019t bring over your old game this time. We\u2019ll try again next time you sign in.'); return; }
        brought.push(...freshNames);
      }
      for (const t of taken) {
        const yes = await choice(t.shown + ' is already a player here. Bring the old game in as a new player, or skip it?', 'Bring in as new player', 'Skip');
        if (!yes) continue;
        const r = await sendImport(core.select(old, [t.name]));
        if (r.ok) brought.push(t.shown + ' (old game)');
      }
      if (brought.length) kidNotice('We brought over your old game: ' + brought.join(', ') + '.');
      else if (taken.length) document.querySelector('.transfer-notice').hidden = true;
      mark(brought.length ? 'imported ' + brought.length : 'nothing new');
    } catch (e) { console.warn('[Stackadoo old game] auto import stopped', e?.code || e); }
    finally { autoBusy = false; }
  }
  window.StackadooBeta = {cloudResult(kind, json) { const done = waiting[kind]; delete waiting[kind]; if (done) done(JSON.parse(json)); },
  transferResult(json) {
    importing = false; const result = JSON.parse(json);
    if (waiting.transfer) { const done = waiting.transfer; delete waiting.transfer; pendingOriginal = null; done(result); return; }
    if (result.ok && pendingOriginal) {
      try {
        const current = core.select(core.fromStorage(localStorage), pendingOriginal.names);
        result.message += current === pendingOriginal.payload ? '\nChecked: the selected original browser saves are unchanged.' : '\nThe old browser saves changed during the test. Keep both versions and review before continuing.';
      } catch { result.message += '\nThe originals could not be rechecked. Please keep your old game.'; }
    }
    pendingOriginal = null;
    $('transfer-result').textContent = result.message;
    document.querySelector('.transfer-notice').hidden = false;
    $('import').disabled = !selected().length;
    if (!result.ok) $('retry-transfer').focus();
    // Originals stay in the old game's storage. Unity keeps their complete source records in its own save.
  }};
  async function start(payload, originalSnapshot = null) {
    if (starting || importing) return;
    starting = true; $('skip').disabled = $('import').disabled = true;
    try {
      if (!instance) {
        const response = await fetch('game-config.json', {cache:'no-store'});
        if (!response.ok) throw Error('The browser game is not available yet. Please try again later.');
        const config = await response.json();
        $('setup').hidden = true; $('game').hidden = false; document.body.classList.add('playing'); $('loading').hidden = false;
        stage('config ' + config.buildVersion + (fromNetwork ? ' (retry after a stall: fresh download)' : '')); startWatchdog();
        // Keep the game on this device: each build is stored once in Cache Storage (named by buildVersion; files are
        // keyed by their ?v=<sha> URLs), so later visits load the world without downloading it again. Older builds'
        // copies are removed when the version changes. If storage is unavailable (private mode, quota) we just download.
        const store = await openGameStore(config.buildVersion);
        console.log('[Stackadoo web] beta.js ' + BETA_JS + ' | game-config ' + config.buildVersion + ' | unity ' + (config.unityCommit || '?') + (config.webDeploy ? ' | deploy ' + config.webDeploy : ''));
        if (config.dataParts) {
          const total = config.dataParts.reduce((sum, part) => sum + part.bytes, 0);
          const show = (done, saved) => { $('load-progress').value = .7 * done / total; $('load-message').textContent = (saved ? 'Opening the saved world: ' : 'Downloading the world: ') + Math.round(done/1024/1024) + ' of ' + Math.round(total/1024/1024) + ' MB'; };
          stage('looking for the saved world');
          let world = await savedWorld(store);
          if (world) { stage('saved world found (' + Math.round(world.size / 1048576) + ' MB)'); show(total, true); }
          else {
            const unpack = !!(store && window.DecompressionStream);
            if (!unpack) { const w0 = await downloadWorld(config.dataParts, store, show, false); w0.packed = true; world = w0; } else
            try { world = await downloadWorld(config.dataParts, store, show, unpack); }
            catch (e) { if (!unpack || /^A game/.test(e.message)) throw e; stage('saving on the device failed (' + (e.message || e) + '), playing from the download'); try { await limit(store.cache.delete(WORLD), 'saved world delete'); } catch {} world = await downloadWorld(config.dataParts, store, show, false); world.packed = true; }   // storage full etc.: play from the download
          }
          config.dataUrl = WORLD_URL; releaseWorld = handWorldToUnity(world, config.dataParts); world = null;   // memory (phones): read once into the buffer Unity keeps
          $('load-message').textContent = 'Opening the game…';
        }
        stage('loading the Unity loader');
        const loaderSrc = await cachedScript(store, config.loaderUrl);
        try {
        await new Promise((resolve,reject) => { const script = document.createElement('script'); script.src = loaderSrc; script.onload=resolve; script.onerror=()=>reject(Error('The game download did not start. Please check your connection.')); document.body.append(script); });
        if (loaderSrc.startsWith('blob:')) URL.revokeObjectURL(loaderSrc);
        stage('unity starting');
        let shown = -1;
        instance = await createUnityInstance($('unity-canvas'), {...config, cacheControl:url=>url.startsWith('blob:')||url===WORLD_URL?'no-store':(store && /[?&]v=/.test(url)?'immutable':'must-revalidate'), devicePixelRatio:Math.min(window.devicePixelRatio || 1,1.5), showBanner:(message,type)=>{if(type==='error') $('load-message').textContent=message;}}, value => { $('load-progress').value=.7 + .3*value; const step = Math.floor(value * 4); if (step !== shown) { shown = step; stage('unity starting: ' + Math.round(value * 100) + '%'); } else moved(); });
        loadDone = true; clearInterval(watchdog); stage('game ready');
        } finally { releaseWorld(); releaseWorld = () => {}; }   // Unity has the world; the page keeps no reference to it
        $('loading').hidden = true; $('full-screen').disabled = false;
      }
      $('setup').hidden = true; $('game').hidden = false; document.body.classList.add('playing');
      if (payload) { pendingOriginal = originalSnapshot; importing = true; document.querySelector('.transfer-notice').hidden = false; $('transfer-result').textContent='Bringing your selected games and learning records…'; instance.SendMessage('Stackadoo web transfer','ImportSelected',payload); }
      try { localStorage.setItem('stackadoo.beta.hasPlayed','1'); } catch {}
      $('unity-canvas').focus();
    } catch (e) { loadDone = true; clearInterval(watchdog); stage('failed: ' + (e.message || e)); document.body.classList.remove('playing'); $('setup').hidden=false; $('game').hidden=true; say(e.message || 'The game could not start. Please try again in an up-to-date browser.'); }
    finally { starting=false; $('skip').disabled=false; $('import').disabled=importing || !selected().length; }
  }
  $('skip').onclick=()=>start(null);
  $('import').onclick=()=>{ try { const names=selected(), payload=core.select(source,names); start(payload,localSource?{names,payload}:null); } catch(e) {say(e.message);} };
  $('full-screen').onclick=async()=>{
    closeWebsiteControls();
    try {
      if (!$('unity-canvas').requestFullscreen) throw Error('Fullscreen unavailable');
      await $('unity-canvas').requestFullscreen();
    } catch {
      $('transfer-result').textContent='The game already fills your browser. This browser could not hide its tabs and address bar.';
      document.querySelector('.transfer-notice').hidden=false;
    }
  };
  function closeWebsiteControls() { $('website-tools').hidden=true; $('website-controls').setAttribute('aria-expanded','false'); $('website-controls').textContent='⋯'; }
  $('website-controls').onclick=()=>{ const open=$('website-tools').hidden; $('website-tools').hidden=!open; $('website-controls').setAttribute('aria-expanded',String(open)); $('website-controls').textContent=open?'Close website controls':'⋯'; };
  $('game-account').onclick=()=>$('signin-dialog').showModal();
  $('retry-transfer').onclick=()=>{if(importing)return; closeWebsiteControls(); document.body.classList.remove('playing'); $('setup').hidden=false;$('game').hidden=true;$('check-local').focus();};
  $('dismiss-transfer').onclick=()=>{document.querySelector('.transfer-notice').hidden=true;};
  $('game-help').onclick=()=>$('game-help-dialog').showModal();
  document.querySelector('#auth-account a[href="play.html?start=1"]').onclick=event=>{event.preventDefault();$('signin-dialog').close();start(null);};
  $('auth-find-players').onclick=event=>{event.preventDefault();openFinder();};
  const entry=new URLSearchParams(location.search);
  if(entry.has('account')) openFinder();
  else if(entry.has('transfer')) $('check-local').click();
  else start(null);
})();

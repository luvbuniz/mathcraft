(async function() {
  'use strict';
  const $ = id => document.getElementById(id), core = window.StackadooTransfer;
  let releaseWorld = () => {};
  let source = null, instance = null, starting = false, importing = false, localSource = false, pendingOriginal = null, lookupVersion = 0, findAfterSignIn = false;
  const BETA_JS = 'cache8';   // bump with the ?v= in play.html; printed in the console so testers can tell what is live
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
      const sdk = await import('https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js');
      const snap = await sdk.getDocFromServer(sdk.doc(sdk.getFirestore(account.app), 'users', user.uid));
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
  });
  window.StackadooBeta = {transferResult(json) {
    importing = false; const result = JSON.parse(json);
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

(async function() {
  'use strict';
  const $ = id => document.getElementById(id), core = window.StackadooTransfer;
  let source = null, instance = null, starting = false, importing = false, localSource = false, pendingOriginal = null, lookupVersion = 0, findAfterSignIn = false;
  const BETA_JS = 'cache2';   // bump with the ?v= in play.html; printed in the console so testers can tell what is live
  const say = text => { $('status').textContent = text; };
  // The site-wide sw.js (old game) would otherwise also control /beta/ and copy every game download into its own
  // cache. This tiny /beta/ worker takes over these pages instead; it has no fetch handler, so requests go straight out.
  try { navigator.serviceWorker?.register('sw.js?v=1', {scope:'./'}).catch(() => {}); } catch {}
  // ---- on-device game cache (Cache Storage; Unity keeps the code files in its own IndexedDB cache) ----
  async function openGameStore(version) {
    try {
      if (!window.caches || !version) return null;
      const name = 'stackadoo-beta-' + version, keys = await caches.keys();
      const old = keys.filter(k => k.startsWith('stackadoo-beta-') && k !== name);
      await Promise.all(old.map(k => caches.delete(k)));
      let seen = null; try { seen = localStorage.getItem('stackadoo.beta.cachedBuild'); } catch {}
      if ((seen && seen !== version) || (!seen && old.length)) {   // a new build: Unity's cached code files belong to the old one
        await Promise.all(keys.filter(k => k.startsWith('UnityCache')).map(k => caches.delete(k)));
        await new Promise(done => { try { const r = indexedDB.deleteDatabase('UnityCache'); r.onsuccess = r.onerror = r.onblocked = done; } catch { done(); } });
      }
      try { localStorage.setItem('stackadoo.beta.cachedBuild', version); } catch {}
      try { navigator.storage?.persist?.(); } catch {}
      return {cache: await caches.open(name), hit: false};
    } catch { return null; }
  }
  // The world file (about 226 MB packed, 258 MB unpacked) is kept on the device already unpacked, as one disk-backed
  // entry. A later visit hands it to Unity as it is: Unity reads it once into a single buffer of the right size, with
  // no packed copy and no in-page unzip (that pair was the 500+ MB spike while 'Opening the game…').
  const WORLD = 'Build/world-unpacked', WORLD_SIZE = 'Build/world-unpacked-bytes';
  async function savedWorld(store) {
    try {
      if (!store) return null;
      const size = await store.cache.match(WORLD_SIZE), found = size && await store.cache.match(WORLD);
      if (!found) return null;
      const blob = await found.blob();   // disk-backed: nothing is read into memory here
      if (!blob.size || blob.size !== Number(await size.text())) { await store.cache.delete(WORLD_SIZE); await store.cache.delete(WORLD); return null; }
      store.hit = true; return blob;
    } catch { return null; }
  }
  // Downloads each part (checked against its size and SHA-256), and, when it can, unpacks it straight into the
  // device cache as it arrives: only one 20 MB part is in memory at a time. Without Cache Storage or a built-in
  // gzip unpacker it falls back to handing Unity the packed parts (Unity unpacks them itself).
  async function downloadWorld(parts, store, show, unpack) {
    let writer = null, put = null, pieces = [], size = 0, done = 0;
    if (unpack) { const ds = new DecompressionStream('gzip'); writer = ds.writable.getWriter(); put = store.cache.put(WORLD, new Response(ds.readable, {headers:{'Content-Type':'application/octet-stream'}})); put.catch(() => {}); }
    for (const part of parts) {
      const download = await fetch(part.url, {cache:'no-store'});
      if (!download.ok) { writer?.abort().catch(() => {}); throw Error('A game download was interrupted. Please try again.'); }
      let bytes = await download.arrayBuffer();
      const hash = [...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(x=>x.toString(16).padStart(2,'0')).join('');
      if (bytes.byteLength !== part.bytes || hash !== part.sha256) { writer?.abort().catch(() => {}); throw Error('A game file did not download correctly. Please reload and try again.'); }
      if (part === parts[parts.length - 1]) size = new DataView(bytes).getUint32(bytes.byteLength - 4, true);   // gzip footer: unpacked size
      if (writer) await writer.write(new Uint8Array(bytes)); else pieces.push(bytes);
      bytes = null; done += part.bytes; show(done, false);
    }
    if (!writer) return new Blob(pieces, {type:'application/octet-stream'});
    await writer.close(); await put;
    const blob = await (await store.cache.match(WORLD))?.blob();
    if (!blob || blob.size !== size) { await store.cache.delete(WORLD); throw Error('unpack size'); }
    await store.cache.put(WORLD_SIZE, new Response(String(size)));   // written last: marks the saved world complete
    return blob;
  }
  async function cachedScript(store, url) {
    try {
      if (!store) return url;
      let found = await store.cache.match(url);
      if (!found) { const r = await fetch(url, {cache:'no-store'}); if (!r.ok) return url; await store.cache.put(url, r); found = await store.cache.match(url); }
      return found ? URL.createObjectURL(new Blob([await found.blob()], {type:'text/javascript'})) : url;
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
        // Keep the game on this device: each build is stored once in Cache Storage (named by buildVersion; files are
        // keyed by their ?v=<sha> URLs), so later visits load the world without downloading it again. Older builds'
        // copies are removed when the version changes. If storage is unavailable (private mode, quota) we just download.
        const store = await openGameStore(config.buildVersion);
        console.log('[Stackadoo web] beta.js ' + BETA_JS + ' | game-config ' + config.buildVersion + ' | unity ' + (config.unityCommit || '?') + (config.webDeploy ? ' | deploy ' + config.webDeploy : ''));
        if (config.dataParts) {
          const total = config.dataParts.reduce((sum, part) => sum + part.bytes, 0);
          const show = (done, saved) => { $('load-progress').value = .7 * done / total; $('load-message').textContent = (saved ? 'Opening the saved world: ' : 'Downloading the world: ') + Math.round(done/1024/1024) + ' of ' + Math.round(total/1024/1024) + ' MB'; };
          let world = await savedWorld(store);
          if (world) show(total, true);
          else {
            const unpack = !!(store && window.DecompressionStream);
            try { world = await downloadWorld(config.dataParts, store, show, unpack); }
            catch (e) { if (!unpack || /^A game/.test(e.message)) throw e; try { await store.cache.delete(WORLD); } catch {} world = await downloadWorld(config.dataParts, store, show, false); }   // storage full etc.: play from the download
          }
          config.dataUrl = URL.createObjectURL(world); world = null;   // memory (phones): the page keeps no copy of its own
          $('load-message').textContent = 'Opening the game…';
        }
        const loaderSrc = await cachedScript(store, config.loaderUrl);
        await new Promise((resolve,reject) => { const script = document.createElement('script'); script.src = loaderSrc; script.onload=resolve; script.onerror=()=>reject(Error('The game download did not start. Please check your connection.')); document.body.append(script); });
        if (loaderSrc.startsWith('blob:')) URL.revokeObjectURL(loaderSrc);
        instance = await createUnityInstance($('unity-canvas'), {...config, cacheControl:url=>url.startsWith('blob:')?'no-store':(store && /[?&]v=/.test(url)?'immutable':'must-revalidate'), devicePixelRatio:Math.min(window.devicePixelRatio || 1,1.5), showBanner:(message,type)=>{if(type==='error') $('load-message').textContent=message;}}, value => { $('load-progress').value=.7 + .3*value; });
        if (config.dataUrl?.startsWith('blob:')) { URL.revokeObjectURL(config.dataUrl); config.dataUrl = null; }   // Unity has its copy; let the Blob go
        $('loading').hidden = true; $('full-screen').disabled = false;
      }
      $('setup').hidden = true; $('game').hidden = false; document.body.classList.add('playing');
      if (payload) { pendingOriginal = originalSnapshot; importing = true; document.querySelector('.transfer-notice').hidden = false; $('transfer-result').textContent='Bringing your selected games and learning records…'; instance.SendMessage('Stackadoo web transfer','ImportSelected',payload); }
      try { localStorage.setItem('stackadoo.beta.hasPlayed','1'); } catch {}
      $('unity-canvas').focus();
    } catch (e) { document.body.classList.remove('playing'); $('setup').hidden=false; $('game').hidden=true; say(e.message || 'The game could not start. Please try again in an up-to-date browser.'); }
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

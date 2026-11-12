(async function() {
  'use strict';
  const $ = id => document.getElementById(id), core = window.StackadooTransfer;
  let source = null, instance = null, starting = false, importing = false, localSource = false, pendingOriginal = null;
  const say = text => { $('status').textContent = text; };
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
    try { showSource(core.fromStorage(localStorage), 'Games saved in this browser. The originals will stay unchanged.'); localSource = true; }
    catch (e) { say(e.message || 'This browser did not allow access to old saves. You can choose a backup file instead.'); }
  };
  $('backup-file').onchange = async event => {
    try {
      const file = event.target.files[0]; if (!file) return;
      if (file.size > 20 * 1024 * 1024) throw Error('Choose a backup smaller than 20 MB.');
      showSource(core.fromJSON(await file.text()), 'A copy from your backup file. Learning records are included.');
    } catch (e) { say(e.message || 'That backup could not be opened.'); }
    finally { event.target.value = ''; }
  };
  $('cloud').onclick = async () => {
    const account = window.StackadooBetaAccount, user = account?.auth.currentUser;
    if (!user) { $('signin-dialog').showModal(); say('Sign in with the parent account you used before, then check the cloud backup again.'); return; }
    $('cloud').disabled = true; say('Looking for a backup in your parent account…');
    try {
      const sdk = await import('https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js');
      const snap = await sdk.getDocFromServer(sdk.doc(sdk.getFirestore(account.app), 'users', user.uid));
      if (account.auth.currentUser?.uid !== user.uid) throw Error('Your account changed. Check the backup again with the correct account.');
      const blob = snap.data()?.blob;
      if (!snap.exists() || typeof blob !== 'string') { say('No cloud backup was found. Games may still be saved on the device where you played.'); return; }
      showSource(core.fromJSON(blob), 'Copy from this parent account’s cloud backup. We will not change the cloud backup.');
    } catch { say('We could not read the cloud backup. Check your connection and parent account, or use a backup file.'); }
    finally { $('cloud').disabled = false; }
  };
  window.addEventListener('stackadoo-account', () => { source = null; $('players').replaceChildren(); $('transfer').hidden = true; $('import').disabled = true; });
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
    $('import').disabled = !selected().length;
    if (!result.ok) $('retry-transfer').focus();
    // Originals stay in the old game's storage. Unity keeps their complete source records in its own save.
  }};
  async function start(payload) {
    if (starting || importing) return;
    starting = true; $('skip').disabled = $('import').disabled = true;
    try {
      if (!instance) {
        const response = await fetch('game-config.json', {cache:'no-store'});
        if (!response.ok) throw Error('The browser game is not available yet. Please try again later.');
        const config = await response.json();
        $('setup').hidden = true; $('game').hidden = false; $('loading').hidden = false;
        if (config.dataParts) {
          const chunks = []; let done = 0;
          const total = config.dataParts.reduce((sum, part) => sum + part.bytes, 0);
          for (const part of config.dataParts) {
            const download = await fetch(part.url, {cache:'force-cache'});
            if (!download.ok) throw Error('A game download was interrupted. Please try again.');
            const bytes = await download.arrayBuffer();
            const hash = [...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(x=>x.toString(16).padStart(2,'0')).join('');
            if (bytes.byteLength !== part.bytes || hash !== part.sha256) throw Error('A game file did not download correctly. Please reload and try again.');
            chunks.push(bytes); done += bytes.byteLength;
            $('load-progress').value = .7 * done / total;
            $('load-message').textContent = 'Downloading the world: ' + Math.round(done/1024/1024) + ' of ' + Math.round(total/1024/1024) + ' MB';
          }
          config.dataUrl = URL.createObjectURL(new Blob(chunks, {type:'application/octet-stream'}));
          $('load-message').textContent = 'Opening the game…';
        }
        await new Promise((resolve,reject) => { const script = document.createElement('script'); script.src = config.loaderUrl; script.onload=resolve; script.onerror=()=>reject(Error('The game download did not start. Please check your connection.')); document.body.append(script); });
        instance = await createUnityInstance($('unity-canvas'), {...config, cacheControl:url=>url.startsWith('blob:')?'no-store':'must-revalidate', devicePixelRatio:Math.min(window.devicePixelRatio || 1,1.5), showBanner:(message,type)=>{if(type==='error') $('load-message').textContent=message;}}, value => { $('load-progress').value=.7 + .3*value; });
        if (config.dataUrl?.startsWith('blob:')) URL.revokeObjectURL(config.dataUrl);
        $('loading').hidden = true; $('full-screen').disabled = false;
      }
      $('setup').hidden = true; $('game').hidden = false;
      if (payload) { pendingOriginal = localSource ? {names:selected(),payload} : null; importing = true; $('transfer-result').textContent='Bringing your selected games and learning records…'; instance.SendMessage('Stackadoo web transfer','ImportSelected',payload); }
      $('unity-canvas').focus();
    } catch (e) { $('setup').hidden=false; $('game').hidden=true; say(e.message || 'The game could not start. Please try again in an up-to-date browser.'); }
    finally { starting=false; $('skip').disabled=false; $('import').disabled=importing || !selected().length; }
  }
  $('skip').onclick=()=>start(null);
  $('import').onclick=()=>{ try { start(core.select(source,selected())); } catch(e) {say(e.message);} };
  $('full-screen').onclick=()=>instance?.SetFullscreen(1);
  $('retry-transfer').onclick=()=>{if(importing)return; $('setup').hidden=false;$('game').hidden=true;$('check-local').focus();};
})();

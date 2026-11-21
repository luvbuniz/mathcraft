import json, sys, threading, http.server, functools, time
from playwright.sync_api import sync_playwright
import os; ROOT=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','beta')
srv=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(http.server.SimpleHTTPRequestHandler,directory=ROOT))
threading.Thread(target=srv.serve_forever,daemon=True).start(); PORT=srv.server_address[1]
# old game: Leo/leo (one player), Mia (name taken here), Zed (already here), 3 more
blob={'stackadooSave:Leo':'{"x":1}','stackadooProfile:leo':'{"p":1}','stackadooProfile:Mia':'{}','stackadooProfile:Zed':'{}','stackadooProfile:Ann':'{}','stackadooProfile:Bob':'{}','stackadooProfile:Cy':'{}'}
FAKE_LOADER='''
window.__calls=[];
window.createUnityInstance=async()=>({SendMessage(o,m,a){ window.__calls.push([m,a]); const j=JSON.parse(a);
 const names=[...new Set(Object.keys(j.data).map(k=>k.split(':')[1].toLowerCase()))];
 const show=n=>({leo:'Leo',mia:'Mia',zed:'Zed',ann:'Ann',bob:'Bob',cy:'Cy'})[n];
 setTimeout(()=>{ if(m==='OldGamePreview') window.StackadooBeta.cloudResult('preview',JSON.stringify({ok:true,usedBytes:100*1024,askAboveBytes:700*1024,refuseAboveBytes:950*1024,limitBytes:1048576,
   players:names.map(n=>({name:show(n),alreadyHere:n==='zed',nameTaken:n==='mia',newName:n==='mia'?'Mia (old game)':show(n),bytes:(window.__big&&n==='ann')?700*1024:20*1024,sources:[]}))}));
  else if(m==='ImportSelected') window.StackadooBeta.transferResult(JSON.stringify({ok:true,message:'x',imported:names.map(n=>n==='mia'?'Mia (old game)':show(n)),skipped:[]}));
 },50);}, Quit(){}});
'''
FS='''export const getFirestore=()=>({}); export const connectFirestoreEmulator=()=>{}; export const doc=(...a)=>a;
export const getDocFromServer=async()=>({exists:()=>true,data:()=>({blob:%s})});''' % json.dumps(json.dumps(blob))
AUTH='window.StackadooBetaAccount={app:{},auth:{currentUser:{uid:"qa-uid",email:"qa@example.com"}}};'
res=[]
def check(ok,what):
    res.append((ok,what)); print(('ok  ' if ok else 'NO  ')+what); sys.stdout.flush()
def page_for(b, big=False, preset=None):
    ctx=b.new_context(); p=ctx.new_page()
    p.on('console', lambda m: m.text.startswith('[Stackadoo old game]') and print('   console:',m.text))
    p.on('pageerror', lambda e: print('   PAGEERROR', e))
    p.route('**/game-config.json', lambda r: r.fulfill(json={'loaderUrl':'fake-loader.js','buildVersion':'qa'}))
    p.route('**/fake-loader.js', lambda r: r.fulfill(body=FAKE_LOADER+('window.__big=true;' if big else ''),content_type='text/javascript'))
    p.route('**/auth-service.js', lambda r: r.fulfill(body=AUTH,content_type='text/javascript'))
    p.route('**/auth-ui.js*', lambda r: r.fulfill(body='',content_type='text/javascript'))
    p.route('**/auth-config.js', lambda r: r.fulfill(body='',content_type='text/javascript'))
    p.route('https://www.gstatic.com/**', lambda r: r.fulfill(body=FS,content_type='text/javascript',headers={'Access-Control-Allow-Origin':'*'}))
    p.goto('http://127.0.0.1:%d/play.html'%PORT)
    if preset: p.evaluate("k=>localStorage.setItem('stackadoo.beta.oldGameAuto.qa-uid',k)", preset)
    p.wait_for_function('window.__calls!==undefined', timeout=10000)
    p.evaluate("window.dispatchEvent(new CustomEvent('stackadoo-account',{detail:{signedIn:true}}))")
    return ctx,p
def imports(p): return [c for c in p.evaluate('window.__calls') if c[0]=='ImportSelected']
with sync_playwright() as pw:
    b=pw.chromium.launch(executable_path=os.environ.get('CHROME') or None, headless=True)
    # 1. gate shows, quick taps do nothing, Esc/backdrop do not dismiss, Not now remembered, nothing imported
    ctx,p=page_for(b)
    p.wait_for_selector('#old-game-dialog[open]', timeout=10000)
    check('5 players not on this device' in p.inner_text('#old-game-intro'), 'gate counts the new players (Leo/leo once, Zed already here): '+p.inner_text('#old-game-intro'))
    for i in range(6): p.click('#old-game-hold')
    p.keyboard.press('Enter'); p.keyboard.press('Escape'); p.mouse.click(5,5)
    time.sleep(.5)
    check(p.is_visible('#old-game-gate') and not p.is_visible('#old-game-pick') and p.evaluate("document.getElementById('old-game-dialog').open"), 'quick taps, Enter, Esc and a tap outside do not get past or close the gate')
    box=p.locator('#old-game-hold').bounding_box(); p.mouse.move(box['x']+20,box['y']+10); p.mouse.down(); time.sleep(1.5); p.mouse.move(box['x']-200,box['y']-200); time.sleep(2); p.mouse.up()
    check(not p.is_visible('#old-game-pick'), 'sliding off before 3 s starts the hold over')
    p.click('#old-game-later'); time.sleep(.3)
    check(not p.evaluate("document.getElementById('old-game-dialog').open") and not imports(p), 'Not now closes it and brings nobody')
    check((p.evaluate("localStorage.getItem('stackadoo.beta.oldGameAuto.qa-uid')") or '').startswith('not now'), 'Not now is remembered on this device')
    p.evaluate("window.dispatchEvent(new CustomEvent('stackadoo-account',{detail:{signedIn:true}}))"); time.sleep(1)
    check(not p.evaluate("document.getElementById('old-game-dialog').open"), 'signing in again on this device does not ask again')
    ctx.close()
    # 2. hold 3 s -> nothing ticked -> pick two -> notice from the result
    ctx,p=page_for(b)
    p.wait_for_selector('#old-game-dialog[open]', timeout=10000)
    box=p.locator('#old-game-hold').bounding_box(); p.mouse.move(box['x']+20,box['y']+10); p.mouse.down(); time.sleep(3.3); p.mouse.up()
    check(p.is_visible('#old-game-pick'), 'holding 3 s opens the checklist')
    boxes=p.locator('#old-game-list input')
    check(boxes.count()==5 and all(not boxes.nth(i).is_checked() for i in range(5)), 'checklist: 5 players, nothing ticked')
    check('Mia (old game)' in p.inner_text('#old-game-list'), 'taken name says it comes in as "Mia (old game)"')
    check(p.is_disabled('#old-game-bring') and p.inner_text('#old-game-all')=='Bring all 5', 'Bring selected is off until a tick; Bring all 5 offered')
    p.locator('#old-game-list label', has_text='Leo').locator('input').check(); p.locator('#old-game-list label', has_text='Mia').locator('input').check()
    check('KB' in p.inner_text('#old-game-size'), 'size estimate shown: '+p.inner_text('#old-game-size'))
    p.click('#old-game-bring'); time.sleep(1)
    im=imports(p); sent=json.loads(im[0][1]) if im else {}
    check(len(im)==1 and sent.get('origin')=='cloud' and sorted(sent['data'])==['stackadooProfile:Mia','stackadooProfile:leo','stackadooSave:Leo'], 'one import with just Leo (both spellings) and Mia, marked cloud')
    t=p.inner_text('#transfer-result'); check('Brought over 2 players: Leo, Mia (old game)' in t and 'Swipe' in t, 'notice built from the game result: '+t)
    check((p.evaluate("localStorage.getItem('stackadoo.beta.oldGameAuto.qa-uid')") or '').startswith('imported 2'), 'marked imported 2')
    ctx.close()
    # 3. Bring all, over the 700 KB line -> asks first; Choose fewer -> back
    ctx,p=page_for(b, big=True)
    p.wait_for_selector('#old-game-dialog[open]', timeout=10000)
    p.focus('#old-game-hold'); p.keyboard.down('Space'); time.sleep(3.3); p.keyboard.up('Space')
    check(p.is_visible('#old-game-pick'), 'holding Space 3 s also opens it (keyboard)')
    p.click('#old-game-all'); time.sleep(.3)
    check(p.is_visible('#old-game-big') and not imports(p), 'Bring all over ~700 KB asks first: '+p.inner_text('#old-game-big-text'))
    p.click('#old-game-fewer'); check(not p.is_visible('#old-game-big') and not imports(p), 'Choose fewer goes back, nothing brought')
    p.click('#old-game-all'); p.click('#old-game-anyway'); time.sleep(1)
    im=imports(p); check(len(im)==1 and len(json.loads(im[0][1])['data'])==6, 'Bring anyway brings all 5 (6 keys)')
    t=p.inner_text('#transfer-result'); check('Brought over 5 players' in t, 'notice: '+t)
    ctx.close()
    # 4. a device that already handled it (d14 "imported" mark) is not asked
    ctx,p=page_for(b, preset='imported 41 2026-11-19')
    time.sleep(2); check(not p.evaluate("document.getElementById('old-game-dialog').open"), 'already handled on this device: not asked')
    ctx.close()
    b.close()
bad=[w for ok,w in res if not ok]
print('WEBQA', 'ALL PASSED' if not bad else 'FAILED', len(res)-len(bad), 'of', len(res))
sys.exit(1 if bad else 0)

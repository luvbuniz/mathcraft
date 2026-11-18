# Fault drills for beta.js cache6: a stuck in-place read, stuck slice reads (-> network), and a Unity start that never ends (-> Tap to retry -> clean reload).
import asyncio, sys, time
from playwright.async_api import async_playwright
URL=sys.argv[1]; OUT=sys.argv[2]
STUCK_BYOB="if(!localStorage.getItem('f_byob')){localStorage.setItem('f_byob','1');ReadableStreamBYOBReader.prototype.read=function(){return new Promise(()=>{});};}"
STUCK_ALL="if(!localStorage.getItem('f_all')){localStorage.setItem('f_all','1');ReadableStreamBYOBReader.prototype.read=function(){return new Promise(()=>{});};const s=Blob.prototype.slice;Blob.prototype.slice=function(){const b=s.apply(this,arguments);b.arrayBuffer=()=>new Promise(()=>{});return b;};}"
STUCK_UNITY="if(!localStorage.getItem('f_unity')){localStorage.setItem('f_unity','1');WebAssembly.instantiate=()=>new Promise(()=>{});WebAssembly.instantiateStreaming=()=>new Promise(()=>{});}"
async def run(p, name, script, expect, clickRetry=False, never=()):
    ctx=await p.chromium.launch_persistent_context(OUT+"-profile",channel="chrome",headless=True,viewport={"width":412,"height":915},args=["--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist","--mute-audio"])
    pg=ctx.pages[0]; logs=[]; pg.on("console",lambda m: logs.append(m.text))
    await pg.goto(URL); await asyncio.sleep(2)   # warm: saved world exists from the stress run
    await pg.evaluate("localStorage.removeItem('f_byob');localStorage.removeItem('f_all');localStorage.removeItem('f_unity')")
    await ctx.add_init_script(script); logs.clear(); t0=time.time(); await pg.reload()
    ok=False
    while time.time()-t0<200:
        await asyncio.sleep(1)
        if clickRetry and await pg.locator('#load-retry').count():
            await pg.screenshot(path=OUT+"-"+name+"-retry.png"); logs.append('--- clicked Tap to retry'); await pg.click('#load-retry'); clickRetry=False
        if any(t.startswith('[Stackadoo] build ') for t in logs): ok=True; break
    st=[t for t in logs if t.startswith('[Stackadoo load]') or t.startswith('---')]
    good=ok and all(any(e in t for t in st) for e in expect) and not any(any(e in t for t in st) for e in never)
    print(name, 'PASS' if good else 'FAIL', round(time.time()-t0,1),'s'); print('  '+'\n  '.join(st))
    await ctx.close(); return good
async def main():
    async with async_playwright() as p:
        r=[await run(p,'stuck in-place read',STUCK_BYOB,['world read by slices','world handed to Unity'],False,['world read failed']),
           await run(p,'stuck slice reads',STUCK_ALL,['world read failed','world handed to Unity']),
           await run(p,'unity start never ends',STUCK_UNITY,['STALLED','retry after a stall'],True)]
        print('FAULTS PASSED',sum(r),'of',len(r))
asyncio.run(main())

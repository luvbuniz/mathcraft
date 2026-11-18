# 20+ reloads in one headless Chrome profile (device caches kept between reloads, like a phone).
# Each reload must reach the Unity build line; stage logs are kept; a 'STALLED' or a timeout is a failure.
import asyncio, sys, time, json, re
from playwright.async_api import async_playwright
URL=sys.argv[1]; N=int(sys.argv[2]); OUT=sys.argv[3]; PORTRAIT=len(sys.argv)>4
async def main():
    async with async_playwright() as p:
        vp={"width":412,"height":915} if PORTRAIT else {"width":915,"height":412}
        ctx=await p.chromium.launch_persistent_context(OUT+"-profile",channel="chrome",headless=True,viewport=vp,args=["--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist","--mute-audio"])
        pg=ctx.pages[0] if ctx.pages else await ctx.new_page()
        logs=[]; pg.on("console",lambda m: logs.append((time.time(),m.text)))
        res=[]
        for i in range(N):
            logs.clear(); t0=time.time()
            if i==0: await pg.goto(URL)
            else: await pg.reload()
            ok=False; why='timeout'
            while time.time()-t0<240:
                await asyncio.sleep(1)
                txt=[t for _,t in logs]
                if any(t.startswith('[Stackadoo] build ') for t in txt): ok=True; why='ready'; break
                if any('STALLED' in t or '[Stackadoo load] failed' in t for t in txt): why='stalled'; break
            st=[t for _,t in logs if t.startswith('[Stackadoo load]')]
            secs=round(time.time()-t0,1); res.append({"i":i+1,"ok":ok,"why":why,"s":secs,"stages":st})
            print(f"reload {i+1}: {why} {secs}s  last={st[-1] if st else '-'}",flush=True)
            if not ok: await pg.screenshot(path=f"{OUT}-fail{i+1}.png")
            await asyncio.sleep(3)
        json.dump(res,open(OUT+".json","w"),indent=1)
        print("PASSED",sum(r['ok'] for r in res),"of",N)
        await ctx.close()
asyncio.run(main())

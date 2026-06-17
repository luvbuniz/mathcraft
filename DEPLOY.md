# 🚀 Deploy: move hosting to Cloudflare Pages (commercial-OK, free)

Why: GitHub **Pages** forbids primarily-commercial sites (Stackadoo sells a $4.99
unlock). GitHub the **code host** is fine — we only move the *public hosting*.
The site is a single static `index.html` (no build step), so this is quick.

The repo is already **Cloudflare-ready**: `main` is the complete, deployable site
(index.html, sw.js, manifest.json, landing.html, icon.svg, CNAME, etc.).

---

## One-time setup (~10 min, do it once)

### 1. Create the Pages project
1. Sign up / log in at **dash.cloudflare.com** (free).
2. **Workers & Pages → Create → Pages → Connect to Git**.
3. Authorize GitHub, pick the **`luvbuniz/mathcraft`** repo.
4. Build settings — there is **no build step**:
   - **Production branch:** `main`
   - **Framework preset:** `None`
   - **Build command:** *(leave empty)*
   - **Build output directory:** `/`  (the files are at the repo root)
5. **Save and Deploy.** In ~1 min you get a test URL like
   `mathcraft-xxx.pages.dev`. Open it — the game should load. ✅

### 2. Point the domain at it
Cleanest path (recommended): **let Cloudflare manage the DNS** (free).
1. In Cloudflare: **Add a site → `stackadoo.com`** → Cloudflare shows two
   **nameservers**.
2. At your registrar (**Squarespace**), replace the nameservers with Cloudflare's.
   (Propagates in minutes–hours.)
3. Back in the **Pages project → Custom domains → Set up a custom domain**:
   add **`www.stackadoo.com`** (and `stackadoo.com` → redirect to www).
   Cloudflare creates the DNS records and the HTTPS cert automatically.

*(Alternative without moving DNS: at Squarespace add a CNAME `www → <project>.pages.dev`.
Apex/root `stackadoo.com` is harder this way — moving DNS to Cloudflare avoids that.)*

### 3. Cut over
1. Confirm **https://www.stackadoo.com** loads from Cloudflare (HTTPS auto-on).
2. **Turn off GitHub Pages:** repo **Settings → Pages → Source → None**
   (stops the old host and avoids any CNAME conflict).
3. Make sure the Stripe payment link's redirect is `https://www.stackadoo.com/?unlocked=1`.

Done — same domain, new commercial-OK host.

---

## After the move: updating the site gets *simpler*

Cloudflare watches `main` and auto-publishes every change (~1 min). So:

> edit `index.html` → commit → merge to **`main`** → *(Cloudflare auto-deploys)* → live

The old `main → claude/serene-maxwell-pvjoce` merge step **goes away** — that branch
only existed to feed GitHub Pages. (Cloudflare also gives a **preview URL per change**
if you want to eyeball something before it's live.)

## Notes
- **Code stays on GitHub** (free, commercial-fine). Cloudflare just pulls from it.
- **PWA/offline** (`sw.js`, `manifest.json`) works the same on Cloudflare.
- **Cost: $0** on the free tiers for a static site this size.

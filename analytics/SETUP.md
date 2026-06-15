# Stackadoo Admin — anonymous usage tracking

This gives you a **private admin page** (`admin.html`) showing how many people visit
Stackadoo, how many actually play, how many are active right now, and how many have
active games — plus an optional **weekly email**. It collects **no names and no
personal data**: just a random tag per device so we can count.

Because Stackadoo is a static site (no server), the counting runs on a tiny free
backend that **you** own: a Google Sheet + Apps Script. ~5 minutes to set up.

---

## 1. Create the backend (Google Sheet + Apps Script)

1. Go to <https://sheets.google.com> and create a **blank spreadsheet**. Name it e.g. `Stackadoo Stats`.
2. In the menu: **Extensions → Apps Script**.
3. Delete the sample code, then **paste the entire contents of `analytics/Code.gs`** from this repo.
4. At the top of the script set your two values:
   - `ADMIN_KEY` — a secret word of your choosing (you'll reuse it in `admin.html`).
   - `OWNER_EMAIL` — your email if you want the weekly summary (or leave `''` to skip email).
5. Click **Deploy → New deployment**.
   - Type: **Web app**
   - **Execute as:** Me
   - **Who has access:** **Anyone**
   - Click **Deploy**, approve the permissions, and **copy the Web app URL**
     (looks like `https://script.google.com/macros/s/AKfy.../exec`).

## 2. Turn tracking on in the site

In **`index.html`**, find this line near the bottom and paste your URL:

```js
const ANALYTICS_URL = '';   // ← paste your Web App URL here
```

In **`admin.html`**, set all three:

```js
const ANALYTICS_URL = '';        // same Web App URL
const ADMIN_KEY     = 'changeme';// must match ADMIN_KEY in Code.gs
const PAGE_PASS     = 'letmein'; // a passphrase to open the admin page
```

Commit those two changes (or just send me the URL + key and I'll wire them in).

## 3. Open your dashboard

Visit **`/admin.html`** on your site (e.g. `https://stackadoo.com/admin.html`),
enter your passphrase, and you'll see the numbers. Hit **Refresh** anytime.

## 4. (Optional) Weekly email

In the Apps Script editor: **Triggers** (the clock icon) → **Add Trigger**:
- Function: `weeklyEmail`
- Event source: **Time-driven** → **Week timer** → pick a day/time.

It only emails when there were visitors that week, so you won't get empty emails.

---

## What each number means

- **Visitors** — distinct devices that opened the site.
- **Players** — visitors who actually started a game (or have a saved game). Anyone who
  only looked and left is *not* counted here.
- **Draw rate** — Players ÷ Visitors. This is your "is the site a big enough draw?" number.
- **Active right now** — devices seen in the last 5 minutes.
- **Active games** — devices with a saved game that were active in the last 7 days.

## Privacy & security notes

- No names, emails, IPs, or per-child data are stored — only a random device tag and counts.
- `admin.html` is a public file, so its passphrase is a light gate, not real security.
  The data behind it is only anonymous aggregate counts. For more privacy you can rename
  `admin.html` to something unguessable (e.g. `stats-7f3a.html`).
- The weekly email and `OWNER_EMAIL` live **only** in your private Apps Script, never in
  this public repo.

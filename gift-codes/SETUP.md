# Gift codes — one-use-each unlock (Apps Script)

This makes your free-game codes **burn after a single redemption**, so you control
exactly how many free games exist and they can't spread into the ether. Codes live
in a Google Sheet you own; you can add more or check how many are left any time.

It's free (Google account only) and takes ~5 minutes.

## 1. Create the backend
1. Go to **https://sheets.google.com** → create a blank spreadsheet, name it e.g. *Stackadoo Gift Codes*.
2. **Extensions ▸ Apps Script**.
3. Delete the placeholder code, paste in everything from **`gift-codes/Code.gs`**, and **Save**.

## 2. Seed your codes
- In the Apps Script editor, choose **`seedShippedCodes`** in the function dropdown and click **Run**.
  (Grant permissions the first time.) This adds the 10 codes the game ships with to a
  new **`codes`** tab. You'll see them in the Sheet with `used = false`.
- Want more? Run **`addCodes`** — set the count by editing the call or just run it for 10.
  The new codes print in **View ▸ Logs**; hand those out.

## 3. Publish it
1. **Deploy ▸ New deployment ▸** type **Web app**.
2. **Execute as:** *Me*. **Who has access:** *Anyone*.
3. **Deploy**, authorize, and **copy the Web app URL** (ends in `/exec`).

## 4. Set your admin key
- Near the top of `Code.gs`, set **`ADMIN_KEY`** to the **same value** as `ADMIN_KEY` in
  `admin.html` (currently `remus`). This is what lets your admin page generate codes.

## 5. Connect the game + admin page
- In **`play.html`**, paste your `/exec` URL into `const REDEEM_URL = '';`.
- In **`admin.html`**, paste the same `/exec` URL into `const GIFT_URL = '';`.
- Now every code redeemed in the game (typed in the unlock dialog **or** opened via a
  `stackadoo.com/?code=STK-XXXXX` link) is validated and burned server-side.

## Managing it — from your admin page (easiest)
- Open **admin.html** → the **🎁 Gift codes** panel shows **Available / Redeemed** counts.
- Type how many you want and hit **Generate codes** → it creates tracked codes and shows
  ready-to-share `?code=` links you can copy. Each works exactly once.
- The list shows every code as **free** or **used**.

## Managing it — by hand (optional)
- **`stats`** → totals in **View ▸ Logs**. **`addCodes(20)`** → 20 more. **`seedShippedCodes`** → the original 10.
- In the `codes` tab: add a row (`code`, `used=false`) to mint one; set `used=true` or delete a row to retire it.
- The `redeemedAt` column shows when each was used.

## Notes
- Until `REDEEM_URL` is set, the game falls back to the built-in code list (works, but
  multi-use). Setting the URL switches on true one-use-each enforcement.
- If you redeploy after editing the script, use **Deploy ▸ Manage deployments ▸ Edit ▸
  New version** so the same URL keeps working.

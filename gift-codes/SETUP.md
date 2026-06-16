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

## 4. Connect the game
- In **`index.html`**, find `const REDEEM_URL = '';` and paste your `/exec` URL between the quotes.
- That's it. Now every code redeemed in the game (typed in the unlock dialog **or** opened
  via a `stackadoo.com/?code=STK-XXXXX` link) is validated and burned server-side.

## Managing it
- **See how many are left:** run **`stats`** → check **View ▸ Logs**.
- **Give out more:** run **`addCodes(20)`** for 20 new ones (or add rows to the `codes` tab:
  `code`, `used=false`).
- **Retire a code:** set its `used` to `true`, or delete its row.
- **Track redemptions:** the `redeemedAt` column shows when each was used.

## Notes
- Until `REDEEM_URL` is set, the game falls back to the built-in code list (works, but
  multi-use). Setting the URL switches on true one-use-each enforcement.
- If you redeploy after editing the script, use **Deploy ▸ Manage deployments ▸ Edit ▸
  New version** so the same URL keeps working.

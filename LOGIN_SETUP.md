# 🔐 Login & Cloud Save — setup checklist

Goal: a parent signs in once (**Google** or **email + password**) and their **purchase
(Founding Family unlock) + every kid's worlds follow them to any device** — no more
export/import. Built on **Firebase** (free Spark tier; Google + email/password + cloud
storage all included).

> **Decisions already locked (don't change without a reason):**
> - **Parent account, never a kid account.** The grown-up signs in; kids stay *nicknames
>   under* that account. **No child email / no child PII** — keeps the "kid-safe, no data
>   collection" promise true.
> - **Free game stays login-free.** Math Meadow plays with no account (local auto-save).
>   Login is the *upgrade* — "save your worlds & keep your unlock on any device."
> - **Local-first.** The cloud is a backup/sync layer on top of localStorage, not a
>   replacement. If offline or signed out, the game still works exactly as now.

---

## What YOU do (≈10 min in the Firebase console) — then send me the config

1. Go to <https://console.firebase.google.com> → **Add project** → name it `stackadoo`
   (accept defaults; you can **disable** Google Analytics for the project — not needed).
2. **Authentication** → **Get started** → **Sign-in method** tab → enable:
   - **Google** (pick a support email when prompted).
   - **Email/Password**.
3. **Authentication → Settings → Authorized domains** → add `stackadoo.com` and
   `www.stackadoo.com` (and `localhost` for testing). *(Firebase adds its own domains.)*
4. **Firestore Database** → **Create database** → **Production mode** → pick a region
   close to your users (e.g. `nam5` / a US region). (We'll paste security rules below.)
5. **Project settings (⚙️) → General → Your apps → Web app (`</>`)** → register an app
   (nickname `stackadoo-web`). Firebase shows a **`firebaseConfig`** object —
   **copy the whole thing and send it to me.** It looks like:
   ```js
   const firebaseConfig = {
     apiKey: "AIza…",            // safe to ship in the page — Firebase web keys are public by design
     authDomain: "stackadoo-xxxx.firebaseapp.com",
     projectId: "stackadoo-xxxx",
     storageBucket: "stackadoo-xxxx.appspot.com",
     messagingSenderId: "…",
     appId: "1:…:web:…"
   };
   ```
   > The `apiKey` here is **not a secret** — it just identifies the project. Security comes
   > from the Firestore **rules** (below), not from hiding the key. Safe in the static page.

That's it. Once I have that config, I wire up the rest.

---

## What I build (client-side, once I have the config)

- A small **Sign in** entry (in the grown-ups area + on the Reading Town lock screen):
  **Continue with Google** / **email + password**. Sign out too.
- On sign-in: **load the cloud save** for this account and **merge** with whatever's on
  the device (newest wins per kid), then keep them in sync.
- On change / leave: **auto-push** the save (reuses the existing auto-save hook + the
  `{app,version,data}` blob the export already produces — the format's done).
- **Unlock follows the account:** when a signed-in user is unlocked (paid, or migrates a
  locally-unlocked device), write `unlocked:true` to their cloud doc; any device they log
  into reads it back. → solves the "paid on laptop, locked on phone" problem.
- All gated so **signed-out play is unchanged** (local-only, exactly like today).

---

## Data model (Firestore)

One document per parent account, keyed by their Firebase `uid`:
```
users/{uid} = {
  unlocked: true,                      // Founding Family unlock
  updatedAt: <server timestamp>,
  saves: { "<saveKey>": "<json>", … }, // the same per-(kid,world) blobs as localStorage
  profiles: { "<profileKey>": "<json>", … }
}
```
Tiny data (a few KB/kid) → comfortably inside the free tier.

## Security rules (paste into Firestore → Rules)

Only the signed-in owner can read/write their own document — nobody can see anyone else's:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

---

## Unlock ↔ payment (how the cloud learns they paid)

- **Launch-simple (no server):** when a logged-in user lands on `…/?unlocked=1` (the Stripe
  success redirect) **or** logs in on a device that's already unlocked locally, the client
  writes `unlocked:true` to their `users/{uid}` doc. Good enough to ship.
- **Robust (later):** a tiny **Cloud Function** webhook from Stripe sets `unlocked:true`
  server-side on payment, so the unlock can't be self-granted. Still free tier. Add post-launch.

---

## Before flipping it on

- **Privacy policy (`support.html`):** disclose that a **parent email** is collected for
  sign-in / saving (and optional updates), how to delete the account, and **no child data**.
- **Budget alarm:** Firebase → Usage & billing → set a low budget alert. The free Spark
  plan can't overspend (it just stops), but the alert is peace of mind if you ever upgrade.
- Keep the **🛟 Back up** export as the offline fallback (and for the paranoid) — it stays.

---

### TL;DR
You: make the Firebase project, enable **Google + Email/Password**, create **Firestore**,
paste me the **`firebaseConfig`**. Me: build the sign-in + cloud-sync + unlock-follows-account.
Result: **buy once, sign in anywhere, worlds and unlock just appear.**

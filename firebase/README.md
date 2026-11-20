# Web beta cloud backup rules (d14)

The existing deployed rules were read using the Firebase connector on Nov 19, 2026, 11:03 PM ET. They match
LOGIN_SETUP.md. A copy is at /workspace/cobble-1116/firestore-rules-before-cloud-backup.rules.
The only addition in firestore.rules is match /users/{uid}/stackadoo/{player}. The parent match /users/{uid} is unchanged.

Local tests (no production writes):

    npm ci
    firebase emulators:exec --only firestore --project demo-stackadoo 'node rules.test.mjs'

22 checks: owner, other user, signed-out, size, schema, player path, parent document unchanged.
For a local browser test, run Auth + Firestore emulators with demo-stackadoo, and serve beta/ with a LOCAL copy of
beta/auth-config.js that sets allowLocalTesting:true, allowedOrigins:['http://localhost:8765'], firebase.projectId:
'demo-stackadoo', and emulator:{auth:'http://127.0.0.1:9099',firestore:['127.0.0.1',8080]}. Never publish that config.

No automatic cloud sync. Only manual backups and confirmed restores. users/{uid}.blob is read-only in beta/beta.js.

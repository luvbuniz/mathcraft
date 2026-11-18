# Beta load stress and stall drills (cache6)

Serve the repo root (python3 -m http.server 8765) then:

- `python3 stress.py http://localhost:8765/beta/play.html 24 out portrait`: 24 reloads in one Chrome profile; each must reach the Unity build line.
- `python3 faults.py http://localhost:8765/beta/play.html out`: stuck in-place read, stuck slice reads (network fallback), Unity start that never ends (Tap to retry).

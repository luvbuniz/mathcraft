# 🎬 Stackadoo Cartoon Pipeline (scaffold)

Batch-generates an episode's segments from a simple JSON file, pulls a QC frame
from each, and stitches the final cut with ffmpeg. Built so making a whole series
isn't hours of hand-babysitting.

**Status:** scaffold. The structure, dry-run, caps, and stitching all work TODAY.
The actual video-API calls are stubbed with TODOs — we wire your chosen provider
in together (tomorrow), after you've set a spend cap.

## 🛡️ Cost safety (this is the whole point)
- **Dry run by default.** Without `--go` it makes **zero API calls** and just
  prints the plan + a worst-case cost estimate.
- **Hard caps in code:** `MAX_SEGMENTS` (12) and `MAX_REROLLS` (2) — it physically
  can't spiral.
- **Keys live in env vars**, never in the repo: `KLING_API_KEY`, `OPENAI_API_KEY`,
  `XAI_API_KEY`. Revoke anytime.
- **Set a low spend cap on the provider dashboard** as a hard backstop independent
  of this script.

## Usage
```bash
cd tools/video_pipeline

# 1) Dry run — see the plan, spend NOTHING:
python3 generate.py --episode episode.example.json --provider kling

# 2) (Tomorrow, after wiring + setting a cap) actually generate:
KLING_API_KEY=... python3 generate.py --episode episode.example.json --provider kling --go

# optional: lay a royalty-free music bed under the final cut
... --music my_track.mp3
```

## Files
- `generate.py` — orchestrator: reads the episode, (dry-runs or) generates each
  segment with re-roll-on-bad-QC, then stitches. Cost caps live at the top.
- `providers.py` — Kling / OpenAI(Sora) / xAI adapters. Real HTTP calls are
  `TODO` — wired tomorrow once a provider is chosen.
- `episode.example.json` — the pilot ("The Stackadoo Coin"), 8 segments, 9:16.
- `finish.py` — **post-production, 100% local ffmpeg, NO API / NO cost.** Turns a
  raw clip (pipeline OR hand-made in Kling) into a posted-ready file: normalizes
  to clean full-screen 9:16 (kills letterbox bars), burns styled captions from a
  script file, and lays in your phone-recorded voiceover (+ optional music).
  ```bash
  python3 finish.py --video raw.mp4 --audio voice.m4a --script lines.txt --vertical --out final.mp4
  ```
  `lines.txt` = one caption line per line (spread evenly across the clip).
  Tested ✓ — captions render bold-white-on-outline, bottom-centered.

## Episode format
```json
{
  "title": "…", "ratio": "9:16",
  "style": "prepended to every segment prompt so the look stays consistent",
  "segments": [
    { "duration": 5, "ref_image": "refs/leo.jpg", "prompt": "what happens in this shot" }
  ]
}
```
- `ref_image` = the character reference (from `character-sheets/`) or a Gemini
  start-frame, so characters stay on-model. Put them in a `refs/` folder here.
- `style` is prepended to each prompt automatically.

## Tomorrow's plan
1. Set a low spend cap on the provider dashboard.
2. Confirm this environment can reach the API (network policy).
3. Wire ONE provider's `generate()` in `providers.py`.
4. Generate ONE test clip (`--go`, pennies) to confirm end-to-end.
5. If it works, run the full episode (still capped).

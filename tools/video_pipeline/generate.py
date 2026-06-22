#!/usr/bin/env python3
"""
Stackadoo cartoon pipeline — batch-generate an episode's segments, QC them, and
stitch the final cut.

COST-SAFE BY DEFAULT: it does a DRY RUN (no API calls, no spend) unless you pass
--go. Hard caps stop it from ever spiraling your bill.

    # See the plan + a worst-case cost estimate, make ZERO API calls:
    python3 generate.py --episode episode.example.json --provider kling

    # Actually generate (spends credits) — only with --go, and capped:
    python3 generate.py --episode episode.example.json --provider kling --go

Keys are read from the environment (KLING_API_KEY / OPENAI_API_KEY / XAI_API_KEY)
— never stored in the repo. Set a LOW spend cap on the provider dashboard too.
"""
import argparse
import json
import os
import subprocess

# ---- hard safety caps (the script literally cannot exceed these) ----
MAX_SEGMENTS = 12          # never generate more clips than this in one run
MAX_REROLLS = 2            # per-segment retries if the QC frame looks broken
EST_COST_PER_CLIP = 0.40   # rough $/clip, JUST for the warning — tune per provider


def log(m):
    print(m, flush=True)


def ffmpeg_exe():
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:
        return "ffmpeg"


def load_episode(path):
    with open(path) as f:
        ep = json.load(f)
    segs = ep.get("segments", [])
    if len(segs) > MAX_SEGMENTS:
        log(f"⚠️  Episode has {len(segs)} segments; capping at {MAX_SEGMENTS}.")
        ep["segments"] = segs[:MAX_SEGMENTS]
    return ep


def qc_frame(clip_path, out_jpg):
    """Pull a frame so a human (or Claude) can eyeball the clip for obvious fails."""
    try:
        subprocess.run([ffmpeg_exe(), "-y", "-ss", "1", "-i", clip_path,
                        "-frames:v", "1", out_jpg], capture_output=True)
        return os.path.exists(out_jpg) and os.path.getsize(out_jpg) > 0
    except Exception:
        return False


def stitch(clip_paths, out_path, music=None):
    """Concatenate the segment clips (+ optional music track) into the final cut."""
    fe = ffmpeg_exe()
    listfile = out_path + ".txt"
    with open(listfile, "w") as f:
        for c in clip_paths:
            f.write(f"file '{os.path.abspath(c)}'\n")
    cmd = [fe, "-y", "-f", "concat", "-safe", "0", "-i", listfile]
    if music:
        cmd += ["-i", music, "-shortest", "-map", "0:v", "-map", "1:a"]
    cmd += ["-c:v", "libx264", "-pix_fmt", "yuv420p", out_path]
    subprocess.run(cmd, capture_output=True)
    try:
        os.remove(listfile)
    except OSError:
        pass
    return os.path.exists(out_path)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--episode", required=True)
    ap.add_argument("--provider", default="kling", choices=["kling", "openai", "xai"])
    ap.add_argument("--out", default="out")
    ap.add_argument("--music", default=None, help="optional royalty-free music track to lay under the cut")
    ap.add_argument("--go", action="store_true", help="ACTUALLY call the API and spend credits")
    ap.add_argument("--max-rerolls", type=int, default=MAX_REROLLS)
    args = ap.parse_args()

    ep = load_episode(args.episode)
    segs = ep["segments"]
    style = ep.get("style", "")
    os.makedirs(args.out, exist_ok=True)

    log(f"\n🎬 Episode: {ep.get('title', '(untitled)')}  —  {len(segs)} segments  ({ep.get('ratio', '9:16')})")
    log(f"   Provider: {args.provider}   Output: {args.out}/")
    worst = len(segs) * (1 + args.max_rerolls) * EST_COST_PER_CLIP
    log(f"   Worst-case cost (every re-roll used): ~${worst:.2f}  "
        f"[{len(segs)} segs × {1 + args.max_rerolls} tries × ${EST_COST_PER_CLIP}/clip]")

    if not args.go:
        log("\n🟡 DRY RUN — no API calls, no spend. Here's the plan:\n")
        for i, s in enumerate(segs, 1):
            log(f"  Segment {i}:  ref={s.get('ref_image', '—')}  dur={s.get('duration', 5)}s")
            log(f"     prompt: {(style + ' ' + s['prompt']).strip()[:110]}…")
        log("\n✅ Happy with the plan? Re-run with --go to generate (this spends credits).")
        return

    # ---- real generation (only reached with --go) ----
    from providers import get_provider
    prov = get_provider(args.provider)   # reads the API key from env; exits if missing
    clips = []
    for i, s in enumerate(segs, 1):
        full_prompt = (style + " " + s["prompt"]).strip()
        clip = os.path.join(args.out, f"seg{i:02d}.mp4")
        log(f"\n🎥 Segment {i}/{len(segs)} …")
        ok = False
        for attempt in range(1 + args.max_rerolls):
            prov.generate(full_prompt, s.get("ref_image"), clip,
                          duration=s.get("duration", 5), ratio=ep.get("ratio", "9:16"))
            if qc_frame(clip, clip + ".jpg"):
                log(f"   ✓ clip saved; QC frame → {clip}.jpg (review before shipping)")
                ok = True
                break
            log(f"   ✗ attempt {attempt + 1} looked broken — re-rolling…")
        if not ok:
            log(f"   ⚠️  Segment {i} still bad after {1 + args.max_rerolls} tries — stopping for your review.")
            return
        clips.append(clip)

    final = os.path.join(args.out, "episode_final.mp4")
    if stitch(clips, final, args.music):
        log(f"\n🎉 Stitched final cut → {final}")
    else:
        log("\n⚠️  Stitch failed — individual clips are in the out/ folder to assemble by hand.")


if __name__ == "__main__":
    main()

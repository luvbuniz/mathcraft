#!/usr/bin/env python3
"""
Finish a cartoon clip into a posted-ready file — all local ffmpeg, NO API, NO cost.
Works on pipeline output OR any clip you made by hand (Kling, etc.).

Does:
  • normalize to clean full-screen 9:16 (fixes letterbox black bars)
  • burn in captions (styled like the fire-truck clip) from your script lines
  • lay in your phone-recorded voiceover (and optional music under it)

Examples:
  # caption a clip + add your recorded voice, force vertical:
  python3 finish.py --video raw.mp4 --audio voice.m4a --script lines.txt --vertical --out final.mp4

  # captions only:
  python3 finish.py --video raw.mp4 --script lines.txt --out final.mp4

lines.txt = one caption line per line (blank line = a pause/!empty caption).
"""
import argparse
import os
import re
import subprocess


def ffmpeg_exe():
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:
        return "ffmpeg"


def duration_of(path):
    out = subprocess.run([ffmpeg_exe(), "-i", path], capture_output=True, text=True).stderr
    m = re.search(r"Duration:\s*(\d+):(\d+):(\d+\.\d+)", out)
    if not m:
        return 0.0
    h, mn, s = m.groups()
    return int(h) * 3600 + int(mn) * 60 + float(s)


def _ts(t):
    h = int(t // 3600); m = int(t % 3600 // 60); s = t - h * 3600 - m * 60
    return f"{h:02d}:{m:02d}:{s:06.3f}".replace(".", ",")


def make_srt(lines, total, path):
    """Spread the script lines evenly across the clip → a simple timed .srt."""
    lines = [ln.strip() for ln in lines if ln.strip()]
    if not lines:
        return False
    per = total / len(lines)
    with open(path, "w") as f:
        for i, ln in enumerate(lines):
            f.write(f"{i+1}\n{_ts(i*per)} --> {_ts((i+1)*per)}\n{ln}\n\n")
    return True


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--video", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--audio", default=None, help="your recorded voiceover (m4a/mp3/wav)")
    ap.add_argument("--music", default=None, help="optional royalty-free music, mixed quietly under the voice")
    ap.add_argument("--script", default=None, help="text file: one caption line per line")
    ap.add_argument("--srt", default=None, help="a precise .srt to burn instead of --script")
    ap.add_argument("--vertical", action="store_true", help="normalize to full-screen 1080x1920 (fix black bars)")
    args = ap.parse_args()

    fe = ffmpeg_exe()
    outdir = os.path.dirname(os.path.abspath(args.out)) or "."
    os.makedirs(outdir, exist_ok=True)

    # --- captions: use given srt, or build one from the script lines ---
    srt = args.srt
    if not srt and args.script:
        srt = os.path.join(outdir, "_captions.srt")
        with open(args.script) as f:
            lines = f.read().splitlines()
        if not make_srt(lines, duration_of(args.video) or 10.0, srt):
            srt = None

    # --- video filter chain ---
    vchain = []
    if args.vertical:
        vchain.append("scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1")
    if srt:
        style = "Fontsize=18,Bold=1,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,Outline=3,Shadow=0,Alignment=2,MarginV=70"
        vchain.append(f"subtitles={os.path.abspath(srt)}:force_style='{style}'")
    vf = ",".join(vchain) if vchain else "null"

    inputs = ["-i", args.video]
    if args.audio:
        inputs += ["-i", args.audio]
    if args.music:
        inputs += ["-i", args.music]

    fc = f"[0:v]{vf}[vout]"
    amap = None
    if args.audio and args.music:
        fc += ";[1:a]volume=1.0[a1];[2:a]volume=0.18[a2];[a1][a2]amix=inputs=2:duration=first:dropout_transition=0[aout]"
        amap = "[aout]"
    elif args.audio:
        fc += ";[1:a]volume=1.0[aout]"
        amap = "[aout]"
    elif args.music:
        fc += ";[1:a]volume=0.5[aout]"
        amap = "[aout]"

    cmd = [fe, "-y"] + inputs + ["-filter_complex", fc, "-map", "[vout]"]
    if amap:
        cmd += ["-map", amap, "-c:a", "aac", "-b:a", "160k", "-shortest"]
    else:
        cmd += ["-map", "0:a?", "-c:a", "aac"]   # keep original audio if any
    cmd += ["-c:v", "libx264", "-pix_fmt", "yuv420p", "-movflags", "+faststart", args.out]

    print("🎬 finishing:", os.path.basename(args.video), "→", args.out)
    r = subprocess.run(cmd, capture_output=True, text=True)
    if os.path.exists(args.out) and os.path.getsize(args.out) > 0:
        print(f"✅ done → {args.out}  ({os.path.getsize(args.out)//1024} KB)")
    else:
        print("⚠️ ffmpeg error:\n", r.stderr[-1500:])


if __name__ == "__main__":
    main()

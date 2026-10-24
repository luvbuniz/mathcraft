#!/usr/bin/env python3
"""Record King Lion's talking lines into audio/intro/lion-<key>.mp3.

The lines live in play.html between /*LION_LINES_START*/ and /*LION_LINES_END*/,
so the game text and the voice never drift apart.

Engines
  elevenlabs  needs ELEVENLABS_API_KEY (and optionally ELEVENLABS_VOICE_ID).
              Used automatically when the key is set.
  kokoro      free, offline. Needs: pip install kokoro-onnx soundfile, plus
              kokoro-v1.0.onnx and voices-v1.0.bin (from the kokoro-onnx GitHub
              releases) in --model-dir. Needs ffmpeg for the mp3 step.

Examples
  python3 tools/make_lion_voice.py                     # every line, best engine available
  python3 tools/make_lion_voice.py --only hello wall   # just these lines
  python3 tools/make_lion_voice.py --engine kokoro --model-dir /path/to/models

After recording, bump LION_AUDIO_V in play.html so tablets fetch the new clips.
"""
import argparse, json, os, re, subprocess, sys, tempfile, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'audio', 'intro')
DEFAULT_EL_VOICE = 'iq1GS1mcjc63xtqTrsFh'   # ElevenLabs "Piksel" (King Lion); set ELEVENLABS_VOICE_ID to pick another


def load_lines():
    src = open(os.path.join(ROOT, 'play.html'), encoding='utf8').read()
    m = re.search(r'/\*LION_LINES_START\*/(.*?)/\*LION_LINES_END\*/', src, re.S)
    if not m:
        sys.exit('LION_LINES block not found in play.html')
    return json.loads(m.group(1))


def eleven(text, path, key, voice):
    body = json.dumps({
        'text': text,
        'model_id': 'eleven_multilingual_v2',
        'voice_settings': {'stability': 0.45, 'similarity_boost': 0.8, 'style': 0.35, 'use_speaker_boost': True},
    }).encode()
    req = urllib.request.Request(
        f'https://api.elevenlabs.io/v1/text-to-speech/{voice}?output_format=mp3_44100_64',
        data=body, headers={'xi-api-key': key, 'Content-Type': 'application/json', 'Accept': 'audio/mpeg'})
    with urllib.request.urlopen(req, timeout=120) as r:
        open(path, 'wb').write(r.read())


def kokoro_engine(model_dir):
    from kokoro_onnx import Kokoro
    k = Kokoro(os.path.join(model_dir, 'kokoro-v1.0.onnx'), os.path.join(model_dir, 'voices-v1.0.bin'))
    # A warm, slightly deep storybook voice: closest match to the original King Lion clips.
    style = k.get_voice_style('bm_lewis') * 0.5 + k.get_voice_style('am_michael') * 0.5

    def say(text, path):
        import soundfile as sf
        audio, sr = k.create(text, voice=style, speed=1.0, lang='en-us')
        with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as tmp:
            sf.write(tmp.name, audio, sr)
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', tmp.name, '-ac', '1', '-ar', '24000',
                        '-b:a', '64k', path], check=True)
        os.unlink(tmp.name)
    return say


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--engine', choices=['auto', 'elevenlabs', 'kokoro'], default='auto')
    ap.add_argument('--model-dir', default=os.environ.get('KOKORO_MODEL_DIR', '.'))
    ap.add_argument('--only', nargs='*')
    a = ap.parse_args()
    lines = load_lines()
    keys = a.only or list(lines)
    key = os.environ.get('ELEVENLABS_API_KEY')
    engine = a.engine if a.engine != 'auto' else ('elevenlabs' if key else 'kokoro')
    os.makedirs(OUT, exist_ok=True)
    if engine == 'elevenlabs':
        if not key:
            sys.exit('Set ELEVENLABS_API_KEY first.')
        voice = os.environ.get('ELEVENLABS_VOICE_ID', DEFAULT_EL_VOICE)
        say = lambda text, path: eleven(text, path, key, voice)
    else:
        say = kokoro_engine(a.model_dir)
    for k in keys:
        if k not in lines:
            print('skip unknown line', k); continue
        path = os.path.join(OUT, f'lion-{k}.mp3')
        say(lines[k]['say'], path)
        print(f'{engine}: {path}')


if __name__ == '__main__':
    main()

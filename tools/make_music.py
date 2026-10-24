#!/usr/bin/env python3
"""Make Stackadoo's background music with ElevenLabs Music: audio/music/<world>-<n>.mp3

The game (play.html, MUSIC_TRACKS) plays these quietly, with a 30-45 s gap between
tracks, ducks them under voices and mutes them in reading/spelling places. Missing
files are fine: a world with no tracks is simply silent.

Needs ELEVENLABS_API_KEY in the environment (a paid ElevenLabs plan covers commercial
use of generated music; check your plan before shipping).

Examples
  python3 tools/make_music.py                  # every track that doesn't exist yet
  python3 tools/make_music.py --only meadow    # just Math Meadow
  python3 tools/make_music.py --force          # re-make everything

Listen before shipping. Then bump MUSIC_V in play.html and the sw.js CACHE version.
"""
import argparse, json, os, sys, urllib.error, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'audio', 'music')
LENGTH_MS = 90_000

# Bright and upbeat, but not hyper, not cloying, and not "relaxing spa" bright.
COMMON = ('Instrumental only, no vocals, no humming, no whistling. Major key, bright and upbeat, '
          'playful and confident rather than sleepy or relaxing. Not hyper, no sudden loud hits, '
          'no long fade-outs. A simple catchy melody that develops and varies so it does not feel '
          'repetitive. Clean, uncluttered mix that sits nicely under spoken dialogue. '
          'For a kids building-and-learning game, ages 6 to 10.')
WORLDS = {
    # Math Meadow: a bright medieval / country-folk village fair.
    'meadow': [
        'Bright medieval village fair, 120 BPM, lively jig feel. Tin whistle and recorder melody, hammered dulcimer, '
        'lute strums, frame drum and tambourine, light hand claps.',
        'Sunny country-folk harvest festival on the village green, 112 BPM. Fiddle and mandolin melody, acoustic guitar, '
        'bodhran, warm upright bass, footstomp rhythm.',
        'Cheerful castle-town market day, 116 BPM, bouncy dance in a skipping rhythm. Recorder and hurdy-gurdy tune, '
        'plucked lute, glockenspiel sparkles, tabor drum and shaker.',
    ],
    # Reading Town: light modern pop / indie.
    'city': [
        'Light modern indie pop, 112 BPM. Clean jangly electric guitar, bright piano chords, glockenspiel hook, '
        'bouncy bass, tight soft drums with finger snaps.',
        'Sunny feel-good indie pop afternoon, 108 BPM. Ukulele and acoustic guitar strums, warm synth pad, '
        'hand claps, light groove, a simple whistle-free synth lead.',
        'Upbeat modern pop for a friendly town, 118 BPM. Soft plucky synths, electric piano, punchy-but-gentle '
        'drums, round bass, sparkly bell melody.',
    ],
    'beach': [
        'Sunny Spanish beach, 110 BPM. Nylon-string guitar, steel drums, bongos and shaker, warm bass.',
        'Playful seaside market, 118 BPM. Marimba, ukulele, light trumpet melody, claps and congas.',
    ],
    'west': [
        'Friendly country western town, 120 BPM. Banjo, fiddle melody, acoustic guitar boom-chick rhythm, upright bass.',
        'Happy frontier main street, 114 BPM. Harmonica and mandolin, slide guitar, light snare shuffle.',
    ],
}


def make(prompt, path, key):
    body = json.dumps({
        'prompt': prompt + ' ' + COMMON,
        'music_length_ms': LENGTH_MS,
        'model_id': 'music_v1',
        'force_instrumental': True,
    }).encode()
    req = urllib.request.Request('https://api.elevenlabs.io/v1/music?output_format=mp3_44100_64', data=body,
                                 headers={'xi-api-key': key, 'Content-Type': 'application/json', 'Accept': 'audio/mpeg'})
    try:
        with urllib.request.urlopen(req, timeout=600) as r:
            open(path, 'wb').write(r.read())
    except urllib.error.HTTPError as e:
        sys.exit(f'ElevenLabs said {e.code}: {e.read()[:400]!r}')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--only', nargs='*', help='world ids (meadow city beach west)')
    ap.add_argument('--force', action='store_true')
    a = ap.parse_args()
    key = os.environ.get('ELEVENLABS_API_KEY') or sys.exit('Set ELEVENLABS_API_KEY first.')
    os.makedirs(OUT, exist_ok=True)
    for world, prompts in WORLDS.items():
        if a.only and world not in a.only:
            continue
        for i, prompt in enumerate(prompts, 1):
            path = os.path.join(OUT, f'{world}-{i}.mp3')
            if os.path.exists(path) and not a.force:
                print('exists', path); continue
            make(prompt, path, key)
            print('made', path, os.path.getsize(path), 'bytes')


if __name__ == '__main__':
    main()

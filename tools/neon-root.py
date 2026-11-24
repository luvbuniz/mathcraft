#!/usr/bin/env python3
"""Publish the new (Neon) website pages from beta/ at the site root.

Run from the repo root after editing any beta/ marketing page:  python3 tools/neon-root.py
The root copies are generated; edit beta/*.html, not the root copies.

What it does to each copied page:
  * robots noindex,nofollow -> index,follow, plus a canonical URL and the root favicon / apple-touch icon
  * CSS, JS and assets/ stay in beta/ (one copy of every file): their URLs get a /beta/ prefix
  * "Play" links go to the new game at /beta/play.html (it stays under the /beta/ service worker,
    away from the old game's /sw.js)
  * index.html also keeps the old home page's hand-off of ?unlocked=1 / ?code= to the old game (Stripe return)
Pages NOT copied (kept as they are on purpose): play.html (old game, Android app start URL), support.html,
privacy.html, terms.html, delete-account.html and the privacy/terms folders (Play Store policy links).
"""
import re, pathlib, sys
ROOT = pathlib.Path(__file__).resolve().parent.parent
PAGES = ['index.html', 'worlds.html', 'heroes.html', 'grown-ups.html', 'help.html', 'how-to-play.html', 'faq.html']
UNLOCK = ("<script>/* A payment return (?unlocked=1) or gift link (?code=) on the home page goes to the classic game, "
          "which does the unlock / redeem. Runs first. */(function(){try{var q=new URLSearchParams(location.search);"
          "if(q.get('unlocked')==='1'||q.get('code'))location.replace('/play.html'+location.search+location.hash);}catch(e){}})();</script>")

def rel(v):
    return not re.match(r'^(?:[a-z][a-z0-9+.-]*:|/|#|\?)', v, re.I)

def fix_attr(m):
    name, v = m.group(1), m.group(2)
    if not rel(v): return m.group(0)
    if re.match(r'^play\.html(?:[?#]|$)', v): v = '/beta/' + v
    elif v.startswith('assets/') or re.search(r'\.(?:css|js|png|jpe?g|svg|webp|mp4|json)(?:[?#]|$)', v): v = '/beta/' + v
    return '%s="%s"' % (name, v)

def build(page):
    s = (ROOT / 'beta' / page).read_text()
    s = s.replace('<meta name="robots" content="noindex,nofollow">', '<meta name="robots" content="index,follow">')
    assert 'noindex' not in s, page
    s = re.sub(r'\b(src|href|poster|data-[a-z-]+)="([^"]*)"', fix_attr, s)
    canon = 'https://stackadoo.com/' + ('' if page == 'index.html' else page)
    head = ('<link rel="canonical" href="%s"><link rel="icon" href="/favicon.ico" sizes="any">'
            '<link rel="icon" href="/icon.svg" type="image/svg+xml"><link rel="apple-touch-icon" href="/apple-touch-icon.png">' % canon)
    if page == 'index.html': head = UNLOCK + head
    s = s.replace('<meta charset="utf-8">', '<meta charset="utf-8">' + head, 1)
    assert head in s, page
    s = s.replace('<!doctype html>', '<!doctype html><!-- Generated from beta/%s by tools/neon-root.py. Edit beta/, then rerun. -->' % page, 1) \
         .replace('<!DOCTYPE html>', '<!DOCTYPE html><!-- Generated from beta/%s by tools/neon-root.py. Edit beta/, then rerun. -->' % page, 1)
    return s

if __name__ == '__main__':
    for p in PAGES:
        (ROOT / p).write_text(build(p)); print('wrote', p)

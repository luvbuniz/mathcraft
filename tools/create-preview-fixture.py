"""Create a local development page to regenerate avatar menu pictures.

Run from the repository: python tools/create-preview-fixture.py OUTPUT_HTML BASE_URL
Serve OUTPUT_HTML locally, open it, and press Render previews. The result images
expose their target filename in data-file. Save their WebP data to avatars/previews/.
This tool does not enter a game or change any player saves.
"""
from pathlib import Path
import re
import sys

root = Path(__file__).resolve().parent.parent
s = (root / 'play.html').read_text(encoding='utf-8')
s = s.replace('<head>', '<head><base href="' + sys.argv[2] + '">', 1)
s = s.replace("try { buildMenu(); } catch (e) { console.error('Menu setup failed (home buttons still work):', e); }", '// Picker disabled for development preview rendering.')
ui = '''<section style="position:fixed;inset:0;z-index:999999;background:white;color:black;overflow:auto;font:16px sans-serif;padding:20px"><h1>Avatar preview asset generator</h1><button onclick="this.disabled=true;renderAvatarPreviews()">Render previews</button><p id="previewStatus">Ready</p><div id="previewResults" style="display:grid;grid-template-columns:repeat(4,1fr)"></div></section><script src="tools/render-avatar-previews.js"></script>'''
s = s.replace('</body>', ui + '</body>')
Path(sys.argv[1]).write_text(s, encoding='utf-8')

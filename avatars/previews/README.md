# Lightweight menu portraits

These 320 × 320 WebP pictures are rendered from Stackadoo's existing avatar models
and procedural character builders. They replace full GLB downloads and a second
WebGL renderer in the character picker. In-game models and animation are unchanged.

The 22 standard portraits total 170,380 bytes. Including all 22 classic portraits,
the total is 314,740 bytes (the classic set was redrawn in v303 to match Queen Fox and
the dragon: soft rounded blocks, 3D eyes, no dark outlines; those two pictures are unchanged;
v304 adds small soft mouths, Leo without top tufts and the Knight's closed helm; v305 drops
the shoulders below the neck line;
v306 closes the Knight's visor to a narrow eye slit with no blush). Previously the picker requested 22 GLB URLs on page
load; the 16 existing files total 116,965,964 bytes (six requests had no model).
These are asset sizes, not a measured tablet speedup.

Regeneration: use `tools/create-preview-fixture.py` with an output HTML path and
the locally served repository's base URL, then press **Render previews** in the
generated page. `tools/render-avatar-previews.js` uses the game's current avatar
builders, GLB preparation, original camera and lighting. Each resulting image has
a `data-file` filename and a WebP data URL. Save the results in this directory and
update the preview URL version in `refreshAvatarPreviews()` when replacing them.
Classic pictures use a slightly higher, wider camera than studio pictures, because
the classic heroes have tall hair, hats and ears. Every hero gets a
classic picture (hidden ones too, for old saves and town friends); a studio picture is
only redrawn when that hero has a model file.

Development tools are not loaded by the normal game page. Keep original costume
details in these portraits; earned badge overlays are not part of the models.

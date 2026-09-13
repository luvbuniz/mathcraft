# 📥 Incoming — drop raw Meshy GLBs here

This is the hand-off folder. Upload your Meshy exports here **with any filename**
(the messy Meshy names are fine) and tell Claude who's who. Claude then:

1. inspects it (mesh + texture + rig + animation clips),
2. optimizes it (strips unused maps, shrinks textures, trims polygons if needed),
3. verifies it **in the actual game** (walk/idle crossfade, celebrate move on a
   right answer, fidgets, hat fit) with screenshots,
4. ships the final tidy file to `avatars/<id>.glb` and deletes the raw one from
   here — this folder should end up empty again.

## How to upload (easiest way)

GitHub → this folder → **Add file → Upload files** → drag the GLBs in → commit.
Direct link:

https://github.com/luvbuniz/mathcraft/upload/claude/educational-game-feedback-pnmtv3/avatars/incoming

(Keep the branch as `claude/educational-game-feedback-pnmtv3` — that's the
workbench branch. GitHub accepts files up to 25 MB through the web page, which
fits every Meshy export so far.)

## Export reminders (from the guide one folder up)

- Download **GLB, with the model/skin + textures + all animations in one file**
  — a file measured in KB is animation-only (no body); expect a few MB.
- Include **Walking** + **Idle** + the fun moves. Posture clips ("Sitting Idle",
  "Lying Down") are safe — the game files those under special moves, never the
  main standing idle.

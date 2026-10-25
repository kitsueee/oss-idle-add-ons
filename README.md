# oss!idle add-ons

Add-ons for [oss!idle](https://oss.idle.rhythmgamers.net). Each `.js` file is one add-on: paste it into the game's add-on editor (or add it from file) and switch it on.

| File | Add-on | Version |
| --- | --- | --- |
| `chat-emojis.js` | chat emojis: emojis, GIFs, reactions, replies, add-on user stars (🔒 tab for your own star) | 0.9.2 |
| `lazer-ui.js` | lazer look: the lazer skin for the game, LAZER tags on banners, "Lazer only" user filter | 0.9.0 |
| `skin-editor.js` | skin editor: edit and use skins live (sideways combo/judgement moves, receptors, upscroll) | 0.33.0 |
| `skin-images.js` | skin images | 0.2.0 |
| `circle-notes.js` | circle notes | 0.4.2 |
| `upscroll.js` | upscroll | |
| `ur-bar.js` | UR bar position | |
| `live-leaderboard.js` | live leaderboard | 0.1.2 |
| `medal-tracker.js` | medal tracker | 0.3.1 |
| `pp-counter.js` | live pp counter | |
| `smooth-notes.js` | smooth notes | |
| `system-cursor.js` | system cursor | |
| `maps-at-once.js` | "Maps at once" slider for the sim | |
| `frame-doctor.js` | frame doctor | |
| `addon-tiles.js` | add-on tiles | 0.1.4 |
| `addon-sandbox.js` | add-on sandbox | 0.1.0 |
| `star-pink-hotfix.js` | pink stars hotfix (old; chat emojis 0.9.x has its own star colors) | 0.1.0 |
| `reset-star-memory.js` | clears the chat add-on's remembered users once | 0.1.0 |

`icons/` has the chat emojis and lazer look icons.

Notes
- The skin editor 0.33.0 works with the game's newer skin folders (desktop app). A brand-new skin makes the game restart itself once, because the game only lists its skin folders when it starts.
- Add-ons can't use `eval`, `Function` or `import()`; check one with `npx tsx check.ts ../<file>.js` from the rule checker.

See [CHANGELOG.md](CHANGELOG.md) for the patch notes of every add-on.

# oss!idle add-ons

Add-ons for [oss!idle](https://oss.idle.rhythmgamers.net). Each `.js` file is one add-on: paste it into the game's add-on editor (or add it from file) and switch it on.

| File | Add-on | Version |
| --- | --- | --- |
| `chat-emojis.js` | chat emojis: emojis, GIFs, reactions, replies, add-on user stars (🔒 tab for your own star) | 0.9.5 |
| `lazer-ui.js` | lazer look: the lazer skin for the game, LAZER tags on banners, "Lazer only" user filter | 0.9.4 |
| `skin-editor.js` | skin editor: edit and use skins live (sideways combo/judgement moves, receptors, upscroll) | 0.33.1 |
| `live-leaderboard.js` | live leaderboard | 0.1.3 |
| `medal-tracker.js` | medal tracker | 0.3.2 |
| `pp-counter.js` | live pp counter (no version number) | |
| `system-cursor.js` | system cursor (no version number) | |

`icons/` has the chat emojis and lazer look icons.

Notes
- The skin editor 0.33.1 works with the game's newer skin folders (desktop app). A brand-new skin makes the game restart itself once, because the game only lists its skin folders when it starts.
- Add-ons can't use `eval`, `Function` or `import()`. All seven files here pass the game's add-on rule check.

Things worth knowing
- **Invisible chat marks.** Both chat emojis and lazer look start your chat messages with some invisible characters (a few dozen). They say "I use this add-on", your add-on version and, for chat emojis, your star colors. They are stored with every message and count toward any message length limit. Chat emojis can switch its mark off in its settings.
- **Pictures from chat.** Chat emojis shows pictures and GIFs that other people link in chat. Your browser loads them from whatever site they are on (without sending a referrer). Turn "Show pictures and GIFs from links" off in its ⚙ tab if you don't want that.
- **GIF search** sends your own KLIPY key, your search words and a random id to KLIPY. The key is kept in plain text in your browser (and in the "Copy backup" text).
- **Skin editor and your skins.** Using a skin switches the game to it and turns off the game's other skins (`enabled = 0`), like picking a skin in the game does. Your osu! Skins folder is only ever read.
- **kitsue's name** gets a rainbow mark in chat emojis and lazer look (it's the author's).
- **Look of chat emojis.** The picker always has the lazer look, with or without the lazer look add-on.
- **Old key name.** Chat emojis keeps your settings under the browser key `oss-idle-lazer-emojis`, from when it was part of the lazer look add-on. Don't rename it by hand.

See [CHANGELOG.md](CHANGELOG.md) for the patch notes of every add-on.

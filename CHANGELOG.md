# Changelog

Patch notes for every add-on, newest first. Dates are 2026, in US Eastern time.

How this was put together: the notes come from the add-ons' own version history (every saved version was kept) and from the changes made along the way. Versions up to the end of 22 October were not numbered, and a few small versions were never released on their own, so some entries cover a range of versions.

---

## Code review fixes (25 Oct)

**chat emojis 0.9.5**
- Private messages work again: the game doesn't mark the sender's name in DMs, so the add-on couldn't tell who wrote a line (no ✦, no reply or reaction buttons, reactions not shown). It now finds the name anyway.

**chat emojis 0.9.4**
- The ✦ in chat now sits on the right-hand side of the name (on player cards it stays in the top right corner).
- Star colors are picked with a row of swatches and a hex box inside the picker, so nothing opens off the screen.
- The password is stored scrambled, not as plain text.

**chat emojis 0.9.3**
- A made-up version number in a chat message can no longer turn everyone's stars blue.
- Pictures from chat are loaded without a referrer. Reaction chips follow the "Show pictures and GIFs" setting.
- Your own name is only picked up from your echoed message when it carries your mark. The 🔒 tab flips to 🔓 right after the password. The browser database connections are closed after use.

**lazer look 0.9.1**
- Turning it off and on again with another add-on that also draws on the canvas no longer makes the HUD text loop forever.
- Switching it off now removes the tag titles and leaderboard lean it added; switching it on twice does nothing extra; the "running" clock restarts when the toolbar is built.

**skin editor 0.33.1**
- Skin files from an .osk whose names start with `./` or use backslashes are written to the right place, and names that climb out of the skin folder (`..`) or are absolute are skipped.
- Skin pictures no longer leave their temporary links behind.
- Versus John: his hitsound, column colors and judgement texts come from the skin in use again.
- A pending automatic restart is cancelled when the editor is closed or rebuilt; the live-preview autopilot and folder/skin loading stop cleanly when switched off; database connections are always closed.
- The extra debug text in the "game did not load it" message is gone, along with unused code.

**medal tracker 0.3.2**: no crash for one-off medals or when the character didn't load.
**live leaderboard 0.1.3**: the COUNTRY board learns your country from the global board (until you appear on one it shows the global board); an old saved "right side" position is converted again.
**pp counter**: a failed star-rating fetch is tried again after 30 seconds.

---

## chat emojis

**0.9.2** (25 Oct)
- A new 🔒 tab in the picker, locked behind a password. Unlocked, it has a "Your mark" setting: the usual star, one color, or two colors fading into each other (animated).
- The picker, search box, tabs, `:name:` suggestions, reaction chips, reply quotes and reply bar get the lazer look (rounded glass, pink glow).

**0.9.1** (25 Oct)
- Your own star color is sent with your messages (in the same invisible characters as your version), so other people with the add-on see it. One color, or two colors with an animated fade.

**0.9.0** (25 Oct)
- The debug box and the debug notes are gone.
- First version of the password-locked star colors (local only; replaced by 0.9.1).

**0.8.7** (25 Oct)
- A reaction made with a named emoji (`:heart:`) shows the emoji itself on the chip, not its name.

**0.8.6** (25 Oct)
- Reactions work: a picture in a reaction line (the game turns an emoji into a picture) counts as the emoji, and the add-on's own debug boxes no longer count as message text.

**0.8.3 – 0.8.5** (25 Oct)
- Temporary debug tools to find why reactions were not showing (a yellow box and notes under unreadable reaction lines).
- GIFs, WebMs and stickers can no longer be used as reactions (a still picture or an emoji can).

**0.8.0 – 0.8.2** (25 Oct)
- Reactions and replies read lines that carry extra invisible or variation characters.
- The lazer look's own mark (a build number under 100) is ignored here, so it never makes a ✦.
- A line the add-on can't read as a reaction is hidden instead of shown as raw text.

**0.7.0 – 0.7.7** (25 Oct)
- Your own star shows too, and turns blue when you are out of date; only kitsue's is always pink.
- kitsue's star is an animated rainbow, also on the player cards.
- The star on a profile card moved to the right-hand side.
- Reactions and replies fixed more than once (message fingerprints, hiding the raw `↩` lines, chips under the right message).
- GIF reactions removed.

**0.6.0 – 0.6.1** (25 Oct)
- The "is typing" indicator removed again.

**0.5.0 – 0.5.1** (25 Oct)
- An "is typing" line above the chat box (other add-on users only).
- Group chats (tried in a 0.4.0 build) removed.

**0.4.0** (24 Oct, never released on its own)
- Group chats in the custom chat.

**0.3.1 – 0.3.2** (24 Oct)
- A ✦ by the name of everyone using the add-on, in the chat and on player cards. Pink when up to date, blue when out of date.

**0.2.0** (24 Oct, several builds)
- Reactions (the 😊 button on a message, shown as chips under it) and replies (↪, with a quote above the answer).
- One click sends a GIF or sticker (Shift+click puts it in the chat box); WebM links and "send as WebM" for search results.
- Click any picture in chat to enlarge it; picture size and pictures per message can be capped in ⚙.
- Messages carry an invisible mark with the sender's version.

**0.1.3** (24 Oct)
- Small fixes.

**0.1.2** (24 Oct)
- GIF search in the GIF tab, through KLIPY (needs your own free KLIPY key, kept in your browser).

**0.1.1** (24 Oct)
- "Delete for me": hide a message on your screen, with a few seconds to undo. "Unhide deleted messages" brings them back. (Not in 0.9.2: it was taken out again at some point after this, and the exact version wasn't written down.)

**0.1.0** (24 Oct)
- First version, split out of the lazer look: `:name:` emojis with suggestions as you type, a picker with Favorites, emojis of your own (a picture link under a name), saved GIFs, and picture/GIF links shown as pictures.

---

## lazer look

**0.9.0** (25 Oct)
- Your own LAZER mark is a hidden mark that every version of the chat add-on ignores, so replies and reactions keep working with older chat add-ons.

**0.8.1 – 0.8.7** (25 Oct)
- The LAZER tag sits right after the name on rank banners without taking room from the text, in the same place on every banner (kitsue's tag is a rainbow).
- Fixed the tag overlapping or being cut off on long names.
- Messages with a reply keep their start; the mark goes on the end.

**0.8.0** (25 Oct)
- A "Lazer only" button by the search box in the online users panel.
- The bottom bar no longer rises when the queue opens.

**0.7.0 – 0.7.5** (25 Oct)
- Shows who else uses the lazer look: your messages carry an invisible mark (never on commands, reactions or typing signals), and a LAZER tag is drawn after the name on rank banners (not in chat).
- 0.7.4 shipped with most of its styles missing; fixed in 0.7.5.

**0.6.15** (24 Oct)
- Chat emojis and GIFs moved into their own add-on, "chat emojis".

**0.6.13 – 0.6.14** (24 Oct)
- Chat gets emojis, a picker, your own emojis, saved GIFs and picture links shown as pictures (later moved out in 0.6.15).

**0.6.5 – 0.6.12** (24 Oct)
- Song select goes back to the selected map when the cursor leaves the list, and glides to it with the card in the middle.
- A button to show only the selected map's set (its other difficulties), and back.
- The search matches the set's title, artist and mapper as separate filters.

**0.6.1 – 0.6.4** (24 Oct)
- The main logo after lazer's: a flat pink disc in a thick white ring, with triangles drifting up inside.
- The global rank beside a name, in the game's tier colors (gold, platinum, the shining #1).
- The leaderboard reaches down to the bottom bar.

**0.3.0** (24 Oct)
- lazer's toolbar across the top, with shortcuts for the options and the in-game web panel.

**0.2.0** (24 Oct)
- The profile top right, like lazer's toolbar; lazer's search box and star-rating filter in song select.

**0.1.0** (24 Oct)
- First version: the game's look after osu!lazer.

---

## skin editor (earlier called "osu! skin importer")

**0.33.0** (25 Oct)
- Works with the game's newer skin folders on your computer (desktop app). The game only lists its skin folders when it starts, so a new skin, or files the game hasn't seen, make the game restart by itself (or offer "Reload now" when you're in a song). Changes to the same files, and everything in `skin.ini` (upscroll, receptor position, sideways moves), still apply live.

**0.32.0 – 0.32.4** (25 Oct)
- Writes skins to the game's skin folders instead of its old browser storage.
- Adds the skin's row before its folder and waits for the game before loading it.
- Shows what happened when a skin is applied (how many files the game loaded).

**0.31.0 – 0.31.4** (24–25 Oct)
- A skin you drop in or pick is used right away, and from then on changes show in the game live (the "Use this skin" button is gone).
- Combo and judgements can be grabbed and moved in the preview, including sideways in the game itself: the game's own text and the skin's judgement and combo pictures are shifted; notes are never moved.
- Upscroll and downscroll are written for every skin (`UpsideDown`), not only when upscroll is on.

**0.30.1 – 0.30.2** (24 Oct)
- Renamed to "skin editor". Open it from Options → Skin → "Skin editor", right-click the logo, or press Alt+Shift+S.
- Two looks: osu!lazer's (with the lazer look add-on) and its own. MIT license.

**0.30.0** (24 Oct)
- Adds a skin (an .osk, or one from your osu! Skins folder, which is remembered) straight into the game's own skins and switches to it, with no reload.

**0.28.0 – 0.29.2** (24 Oct)
- Grab-and-move handles over the combo, judgements, UR bar and health bar (in the preview or over the game in see-through mode).
- Hotkey and versus John settings in Options (Skin and Gameplay); a small window to set versus John's four keys.

**0.27.0 – 0.27.2** (24 Oct)
- Judgement and health bar images come along too (sideways and animated bars work), applepie's live judgement counter in the skin's colors, a switch for map hitsounds, and a see-through live preview over a map that plays itself.
- Follows osu!lazer's look when the lazer look add-on is on.

**0.26.0** (24 Oct)
- lazer's look in the panel: its font, switches and sliders.

**0.23.0 – 0.25.0** (24 Oct)
- A folder dragged onto the importer (the Skins folder or one skin) works even where the browser can't keep the folder; images are encoded off the page's thread, many at once.
- Sizes follow the game window. The skin's images are in three groups that can each be left out.

**0.22.0** (24 Oct)
- "Percy" long notes: the far end of each long note is cut off by a set distance, like an osu! percy skin.

**0.20.0 – 0.21.1** (23–24 Oct)
- Versus John: play the map yourself next to John (the bot) on the same chart, with the same notes, judgement windows and scroll speed.
- John can be moved and shrunk beside you.

**0.19.0 – 0.19.2** (23 Oct)
- Circle notes and upscroll built in (shared with the separate add-ons), set from the preview box. Ctrl+Shift+U switches upscroll. A skin's long note body shaped into the rounded bar.

**0.17.0 – 0.18.3** (23 Oct)
- Animated images (name-0, name-1...) played at the skin's frame rate, with an animation speed slider.
- Upscroll flips the playfield, not the text.
- Using a skin changes the one in use in place, so a running map switches on its next frame.

**0.15.0 – 0.16.1** (23 Oct)
- Stage images (the sides, bottom and judgement line); keys over or under the notes (`KeysUnderNotes`).
- "Using a skin": saved in the game's skin list and switched to live. Uses the skin.ini nearest the top.

**0.12.0 – 0.14.3** (23 Oct)
- The skin's note, long note and key images come along and are drawn in the game instead of colored bars (Alt+Shift+I switches them off and on).
- The Skins folder is remembered. Workarounds for desktop builds whose folder window never shows or never hands the folder over.

**Before 0.12** (22 Oct, unnumbered)
- First versions: add an osu!mania skin from an .osk or your osu! Skins folder (read on your computer, nothing uploaded); a preview with bar and circle notes; column width and note height (with their result in pixels); receptor position; UR bar position kept on screen; the judgement text's height; "Preview in upscroll".

---

## live leaderboard

**0.1.2** (24 Oct) and **0.1.1** (24 Oct): the live leaderboard. 0.1.1 was the first version kept.

## Medal tracker

**0.3.1** (24 Oct): levels and XP using the game's own curve (much dearer past level 100).
**0.3.0** (24 Oct): for medals won on a map, the easiest ranked maps to go for (click one to search for it); takes osu!lazer's look when the lazer look add-on is on.
**0.2.0** (24 Oct): first version kept.

## live pp counter, system cursor
First versions, 22–23 Oct.

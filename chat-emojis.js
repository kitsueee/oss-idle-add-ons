// oss!idle add-on: chat emojis  (version 0.9.3)
//
// Copyright (c) 2026 kitsue. Released under the MIT License: free to use, copy, change
// and share, as long as this notice stays in; it comes with no warranty.
//
// Emojis and GIFs for the game's chat:
// - type :name: (a list of matches shows as you type; Tab or Enter picks one), or use
//   the 😊 button by the chat box for a picker with Favorites, your own emojis, saved
//   GIFs and seven groups of emojis
// - your own emojis: a name and a link to a picture. Chat only carries text, so when you
//   send :name: it goes out as the picture's link; anyone with this add-on sees the
//   picture, everyone else sees the link
// - picture and GIF links in chat (Tenor, Giphy, Imgur, Discord, .gif/.mp4...) show as
//   the picture itself; hover one and click its star to save it to your GIF tab
// - GIF search in the GIF tab, through KLIPY (Tenor's search was shut down by Google on
//   June 30, 2026; KLIPY is what Discord moved to). It needs your own free KLIPY key:
//   partner.klipy.com → API Keys. The key stays in this browser.
// Everything you save stays in this browser. Works with or without the lazer look.

const STYLE_ID = 'oss-chat-emojis';
const CSS = String.raw`
:root{--ce-pink:var(--lz-pink,#ff66ab);--ce-yellow:var(--lz-yellow,#ffcc22);--ce-red:var(--lz-red,#ff5a5a);--ce-bg1:var(--lz-bg1,hsl(333 10% 9%));--ce-bg2:var(--lz-bg2,hsl(333 10% 14%));--ce-bg3:var(--lz-bg3,hsl(333 10% 19%));--ce-dim:var(--lz-dim,rgba(255,255,255,.6))}
.chat__link.ce-emo-link{position:relative;background:none !important;display:inline-block;font-size:0;line-height:0;text-decoration:none;padding:0 1px;vertical-align:middle}
.ce-emo{display:inline-block;height:28px;width:auto;max-width:200px;vertical-align:middle;object-fit:contain;margin:-4px 0}
.chat__text.ce-emo-only .ce-emo{height:64px;max-width:320px;margin:2px 0}
.ce-emo.ce-emo--gif,.chat__text.ce-emo-only .ce-emo.ce-emo--gif{height:auto;width:auto;max-height:var(--ce-gh,150px);max-width:var(--ce-gw,260px);margin:3px 0;border-radius:8px}
.ce-size-s{--ce-gh:100px;--ce-gw:170px}
.ce-size-l{--ce-gh:230px;--ce-gw:400px}
.ce-emo-link{cursor:zoom-in}
.ce-emo-save{position:absolute;top:6px;right:6px;display:none;width:24px;height:24px;border-radius:50%;background:rgba(0,0,0,.65);color:#fff;font-size:15px;line-height:24px;text-align:center;cursor:pointer}
.ce-emo-link:hover .ce-emo-save,.ce-emo-save.is-on{display:block}
.ce-emo-save.is-on{color:var(--ce-yellow)}
.ce-emo-save:hover{background:var(--ce-pink);color:#fff}
.ce-emo-link:not(:has(.ce-emo--gif)) .ce-emo-save{top:-6px;right:-8px;width:16px;height:16px;font-size:10px;line-height:16px}
.ce-emo-btn{flex:none;width:30px;height:28px;padding:0;border:0;border-radius:8px;background:none;font-size:18px;line-height:1;cursor:pointer;filter:grayscale(1);opacity:.7;transition:filter .15s,opacity .15s,background .15s}
.ce-emo-btn:hover{filter:none;opacity:1;background:rgba(255,255,255,.08)}
.ce-emo-pick{position:fixed;z-index:99999;display:flex;flex-direction:column;width:380px;max-width:calc(100vw - 16px);height:420px;max-height:calc(100vh - 16px);border-radius:12px;background:var(--ce-bg2);box-shadow:0 10px 34px rgba(0,0,0,.6);overflow:hidden;color:#fff;font-size:13px}
.ce-emo-pick__search{margin:10px 10px 6px;height:32px;padding:0 14px;border:0;border-radius:999px;background:var(--ce-bg1);color:#fff;font-size:14px;outline:none}
.ce-emo-pick__tabs{display:flex;gap:2px;padding:0 8px;border-bottom:1px solid rgba(255,255,255,.08)}
.ce-emo-pick__tab{flex:1;height:32px;padding:0;border:0;border-bottom:3px solid transparent;background:none;color:var(--ce-yellow);font-size:17px;cursor:pointer;opacity:.6}
.ce-emo-pick__tab:hover{opacity:1}
.ce-emo-pick__tab.is-text{font-size:12px;font-weight:800;letter-spacing:.04em}
.ce-emo-pick__tab.is-on{opacity:1;border-bottom-color:var(--ce-pink)}
.ce-emo-pick__grid{flex:1;display:grid;grid-template-columns:repeat(8,1fr);align-content:start;gap:2px;padding:8px;overflow-y:auto}
.ce-emo-pick__cell{position:relative;height:38px;padding:0;border:0;border-radius:8px;background:none;font-size:23px;line-height:1;cursor:pointer;display:flex;align-items:center;justify-content:center}
.ce-emo-pick__cell:hover{background:var(--ce-bg3)}
.ce-emo-pick__cell img,.ce-emo-pick__cell video{max-width:32px;max-height:32px;object-fit:contain;pointer-events:none}
.ce-emo-pick__grid.is-gifs{grid-template-columns:repeat(3,1fr);gap:6px}
.ce-emo-pick__grid.is-gifs .ce-emo-pick__cell{height:96px;overflow:hidden;background:var(--ce-bg1)}
.ce-emo-pick__grid.is-gifs .ce-emo-pick__cell img,.ce-emo-pick__grid.is-gifs .ce-emo-pick__cell video{width:100%;height:100%;max-width:none;max-height:none;object-fit:cover}
.ce-emo-pick__fav{position:absolute;top:-1px;left:1px;display:none;font-size:11px;line-height:1;color:var(--ce-dim)}
.ce-emo-pick__fav:hover{color:var(--ce-yellow)}
.ce-emo-pick__cell:hover .ce-emo-pick__fav{display:block}
.ce-emo-pick__fav.is-on{display:block;color:var(--ce-yellow)}
.ce-emo-pick__del{position:absolute;top:1px;right:1px;z-index:1;display:none;width:15px;height:15px;border-radius:50%;background:var(--ce-red);font-size:9px;line-height:15px;text-align:center;color:#fff}
.ce-emo-pick__cell:hover .ce-emo-pick__del{display:block}
.ce-emo-pick__label{grid-column:1/-1;padding:4px 2px 2px;font-size:11px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:var(--ce-dim)}
.ce-emo-pick__empty{grid-column:1/-1;padding:16px 8px;text-align:center;line-height:1.5;color:var(--ce-dim)}
.ce-emo-pick__foot{display:flex;flex-direction:column;gap:6px;padding:8px 10px 10px;background:var(--ce-bg1)}
.ce-emo-pick__add{display:flex;gap:6px}
.ce-emo-pick__add input{min-width:0;height:28px;padding:0 10px;border:0;border-radius:8px;background:var(--ce-bg3);color:#fff;font-size:13px;outline:none}
.ce-emo-pick__add input:first-child{flex:0 0 90px}
.ce-emo-pick__add input:nth-child(2),.ce-emo-pick__add input:only-of-type{flex:1}
.ce-emo-pick__add button{flex:none;height:28px;padding:0 14px;border:0;border-radius:8px;background:var(--ce-pink);color:#fff;font-weight:600;cursor:pointer}
.ce-emo-pick__msg:empty{display:none}
.ce-emo-pick__msg{font-size:12px;color:var(--ce-yellow)}
.ce-emo-pick__opt{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--ce-dim);cursor:pointer}
.ce-emo-pick__opt input{accent-color:var(--ce-pink);margin:0}
.ce-emo-suggest{position:fixed;z-index:99999;min-width:220px;padding:4px;border-radius:10px;background:var(--ce-bg2);box-shadow:0 8px 26px rgba(0,0,0,.55);color:#fff;font-size:14px}
.ce-emo-suggest__row{display:flex;align-items:center;gap:10px;padding:4px 10px;border-radius:6px;cursor:pointer}
.ce-emo-suggest__row.is-on,.ce-emo-suggest__row:hover{background:var(--ce-bg3)}
.ce-emo-suggest__row.is-on{box-shadow:inset 3px 0 var(--ce-pink)}
.ce-emo-suggest__row video,.ce-emo-suggest__row img{width:22px;height:22px;object-fit:contain}
.ce-emo-suggest__ch{width:22px;font-size:19px;text-align:center}
.ce-emo-suggest__hint{padding:4px 10px 2px;font-size:11px;color:var(--ce-dim)}
/* GIF search */
.ce-emo-pick__more{grid-column:1/-1;height:32px;border:0;border-radius:8px;background:var(--ce-bg3);color:#fff;font:inherit;font-weight:600;cursor:pointer}
.ce-emo-pick__more:hover{background:var(--ce-pink)}
.ce-emo-pick__grid.is-gifs .ce-emo-pick__fav{top:4px;left:4px;width:22px;height:22px;border-radius:50%;background:rgba(0,0,0,.6);font-size:13px;line-height:22px;text-align:center}
.ce-emo-pick__key{display:flex;flex-direction:column;gap:6px;font-size:12px;line-height:1.45;color:var(--ce-dim)}
.ce-emo-pick__key a{color:var(--ce-pink)}
.ce-emo-pick__powered{align-self:flex-end;font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:var(--ce-dim)}
.ce-emo-pick__keylink{align-self:flex-start;padding:0;border:0;background:none;color:var(--ce-dim);font:inherit;font-size:11px;cursor:pointer;text-decoration:underline}
.ce-badge{margin:0 4px 0 2px;color:var(--ce-star,var(--ce-pink));font-size:.85em;cursor:default}
.ce-badge.is-old{color:var(--ce-star-old,#4ba3ff)}
.ce-badge--rainbow{background:linear-gradient(90deg,#ff5a5a,#ffb84d,#f3ee5a,#5ee07a,#4dc9ff,#8a7bff,#ff6ad5,#ff5a5a);background-size:200% 100%;-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;color:transparent;animation:ce-rainbow 4s linear infinite}
.ce-badge--grad{background:linear-gradient(90deg,var(--g1),var(--g2),var(--g1));background-size:200% 100%;-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;color:transparent;animation:ce-rainbow 4s linear infinite}
.ce-badge--card.ce-badge--grad{-webkit-background-clip:border-box;background-clip:border-box;-webkit-text-fill-color:#fff;color:#fff}
.ce-badge--card.ce-badge--rainbow{background:linear-gradient(90deg,#ff5a5a,#ffb84d,#f3ee5a,#5ee07a,#4dc9ff,#8a7bff,#ff6ad5,#ff5a5a);background-size:200% 100%;-webkit-background-clip:border-box;background-clip:border-box;-webkit-text-fill-color:#fff;color:#fff}
@keyframes ce-rainbow{to{background-position:200% 0}}
.ce-badge--card.is-old{background:var(--ce-star-old,#4ba3ff);color:#fff}
.ce-badge--card{position:absolute;z-index:3;top:5px;right:5px;display:flex;align-items:center;justify-content:center;width:20px;height:20px;margin:0;border-radius:50%;background:var(--ce-star,var(--ce-pink));color:#fff;font-size:12px;line-height:1;box-shadow:0 1px 4px rgba(0,0,0,.5)}
/* enlarge */
.ce-box{position:fixed;inset:0;z-index:100000;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;background:rgba(0,0,0,.84);cursor:zoom-out}
.ce-box__m{max-width:92vw;max-height:82vh;border-radius:10px;background:#000;box-shadow:0 10px 40px rgba(0,0,0,.6);object-fit:contain;cursor:default}
.ce-box__bar{display:flex;gap:8px;font-size:13px}
.ce-box__bar a,.ce-box__bar button{padding:6px 16px;border:0;border-radius:999px;background:var(--ce-bg3);color:#fff;font:inherit;text-decoration:none;cursor:pointer}
.ce-box__bar a:hover,.ce-box__bar button:hover{background:var(--ce-pink)}
/* reactions */
.chat__line.ce-react-line{display:none !important}
.chat__line.ce-hasrx{flex-wrap:wrap}
.ce-rx{display:flex;flex:0 0 100%;flex-wrap:wrap;gap:4px;margin:3px 0 2px}
.ce-rx__chip{display:inline-flex;align-items:center;gap:5px;height:22px;padding:0 8px;border:1px solid transparent;border-radius:999px;background:var(--ce-bg3);color:#fff;font:inherit;font-size:13px;line-height:1;cursor:pointer}
.ce-rx__chip:hover{border-color:var(--ce-pink)}
.ce-rx__chip.is-mine{border-color:var(--ce-pink);background:rgba(255,102,171,.22)}
.ce-rx__chip img,.ce-rx__chip video{height:16px;width:auto;max-width:42px;object-fit:contain}
.ce-rx__n{font-size:11px;color:var(--ce-dim)}
.ce-acts{display:none;flex:none;align-items:center;gap:1px;margin:0 6px 0 0;vertical-align:middle}
.ce-reply-btn,.ce-react-btn{display:inline-block;width:20px;height:20px;border:0;border-radius:6px;padding:0;background:none;color:rgba(255,255,255,.4);font-size:13px;line-height:20px;cursor:pointer;opacity:.7}
.chat__line:hover .ce-acts{display:inline-flex}
.chat__line:hover .ce-reply-btn,.chat__line:hover .ce-react-btn{opacity:1}
.ce-reply-btn:hover{background:rgba(255,255,255,.12);color:var(--ce-pink)}
.ce-quote{display:block;margin:0 0 2px;padding:1px 8px;border-left:3px solid var(--ce-pink);border-radius:2px;font-size:.88em;color:var(--ce-dim);cursor:pointer;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ce-quote:hover{color:#fff;background:rgba(255,255,255,.06)}
.ce-quote b{color:var(--ce-pink);font-weight:600}
.chat__line.ce-flash{background:rgba(255,102,171,.25)}
.ce-replybar{display:flex;align-items:center;gap:8px;margin:0 0 4px;padding:4px 10px;border-left:3px solid var(--ce-pink);border-radius:2px;background:rgba(255,255,255,.07);font-size:13px;color:var(--ce-dim)}
.ce-replybar span{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ce-replybar b{color:var(--ce-pink);font-weight:600}
.ce-replybar button{border:0;background:none;color:inherit;font-size:15px;cursor:pointer}
.ce-replybar button:hover{color:#fff}
.ce-react-btn:hover{background:rgba(255,255,255,.12);color:var(--ce-yellow)}
/* hidden links, mentions */
.chat__link.ce-linkhid{font-size:0 !important;line-height:0;background:none !important;text-decoration:none;cursor:pointer}
.chat__link.ce-linkhid::before{content:"🔗 link hidden";font-size:12px;line-height:1.5;padding:1px 9px;border-radius:999px;background:rgba(255,255,255,.12);color:var(--ce-dim)}
.chat__link.ce-linkhid:hover::before{background:var(--ce-pink);color:#fff}
.ce-emo-btn.is-on{filter:none;opacity:1;background:rgba(255,102,171,.28)}
.chat__line.ce-mention{background:rgba(255,204,34,.12);box-shadow:inset 3px 0 var(--ce-yellow)}
/* picker: GIF/sticker switch, settings */
.ce-emo-pick__kind{grid-column:1/-1;display:flex;gap:4px}
.ce-emo-pick__kind button{flex:1;height:26px;border:0;border-radius:999px;background:var(--ce-bg1);color:var(--ce-dim);font:inherit;font-size:12px;cursor:pointer}
.ce-emo-pick__kind button.is-on{background:var(--ce-pink);color:#fff}
.ce-emo-pick__grid.is-set{display:flex;flex-direction:column;flex-wrap:nowrap;gap:10px;padding:12px}
.ce-set{display:flex;align-items:center;gap:8px;font-size:13px;color:#fff}
.ce-set select,.ce-set input[type=text]{min-width:0;height:26px;border:0;border-radius:8px;background:var(--ce-bg3);color:#fff;padding:0 8px;font:inherit}
.ce-set input[type=text]{flex:1}
.ce-set input[type=checkbox]{accent-color:var(--ce-pink);margin:0}
.ce-set select{margin-left:auto}
.ce-set button{height:26px;padding:0 12px;border:0;border-radius:8px;background:var(--ce-bg3);color:#fff;font:inherit;cursor:pointer}
.ce-set button:hover{background:var(--ce-pink)}
.ce-set__sub{font-size:11px;line-height:1.4;color:var(--ce-dim)}
.ce-set__h{margin-top:4px;font-size:11px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:var(--ce-dim)}
/* the lazer look */
.ce-emo-pick{border-radius:18px;border:1px solid rgba(255,102,171,.3);background:linear-gradient(180deg,hsl(333 12% 16% / .96),hsl(333 12% 9% / .97));-webkit-backdrop-filter:blur(16px);backdrop-filter:blur(16px);box-shadow:0 14px 44px rgba(0,0,0,.7),0 0 30px rgba(255,102,171,.14)}
.ce-emo-pick__search{margin:12px 12px 8px;height:34px;background:rgba(0,0,0,.38);box-shadow:inset 0 0 0 1px rgba(255,255,255,.08);transition:box-shadow .15s}
.ce-emo-pick__search:focus{box-shadow:inset 0 0 0 1.5px var(--ce-pink),0 0 14px rgba(255,102,171,.3)}
.ce-emo-pick__tabs{gap:3px;padding:2px 10px 8px;border-bottom:1px solid rgba(255,255,255,.06)}
.ce-emo-pick__tab{height:30px;border:0;border-radius:999px;color:#fff;opacity:.55;transition:background .15s,opacity .15s,box-shadow .15s}
.ce-emo-pick__tab:hover{background:rgba(255,255,255,.08)}
.ce-emo-pick__tab.is-on{background:rgba(255,102,171,.22);box-shadow:inset 0 0 0 1px rgba(255,102,171,.6),0 0 12px rgba(255,102,171,.25)}
.ce-emo-pick__cell{border-radius:12px;transition:background .12s,transform .12s}
.ce-emo-pick__cell:hover{background:rgba(255,102,171,.16);transform:scale(1.12)}
.ce-emo-pick__grid.is-gifs .ce-emo-pick__cell{border-radius:12px}
.ce-emo-pick__grid.is-gifs .ce-emo-pick__cell:hover{transform:none;box-shadow:0 0 0 2px var(--ce-pink)}
.ce-emo-pick__label,.ce-set__h{color:var(--ce-pink);letter-spacing:.14em}
.ce-emo-pick__foot{background:rgba(0,0,0,.28)}
.ce-emo-pick__add input,.ce-set select,.ce-set input[type=text],.ce-set input[type=password]{border-radius:999px;background:rgba(0,0,0,.38);box-shadow:inset 0 0 0 1px rgba(255,255,255,.08);padding:0 12px}
.ce-set input[type=password]{flex:1;min-width:0;height:28px;border:0;color:#fff;font:inherit;outline:none}
.ce-set input[type=color]{margin-left:auto;width:44px;height:26px;padding:0;border:0;border-radius:999px;background:none;cursor:pointer}
.ce-emo-pick__add button,.ce-set button,.ce-emo-pick__more,.ce-box__bar a,.ce-box__bar button{border-radius:999px;background:linear-gradient(135deg,#ff66ab,#ff8ec4);color:#fff;font-weight:600;box-shadow:0 2px 10px rgba(255,102,171,.3)}
.ce-set button{background:rgba(255,255,255,.1);box-shadow:none;font-weight:500}
.ce-set button:hover,.ce-emo-pick__add button:hover,.ce-emo-pick__more:hover{filter:brightness(1.12);background:linear-gradient(135deg,#ff66ab,#ff8ec4)}
.ce-emo-pick__kind button{border-radius:999px;background:rgba(0,0,0,.35)}
.ce-emo-pick__kind button.is-on{background:linear-gradient(135deg,#ff66ab,#ff8ec4)}
.ce-emo-suggest{border-radius:14px;border:1px solid rgba(255,102,171,.25);background:hsl(333 12% 11% / .96);-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px)}
.ce-emo-suggest__row{border-radius:10px}
.ce-emo-btn{border-radius:999px}
.ce-emo-btn.is-on{box-shadow:0 0 12px rgba(255,102,171,.4)}
.ce-rx__chip{height:24px;border-radius:999px;background:rgba(255,255,255,.07);border-color:rgba(255,255,255,.1)}
.ce-rx__chip.is-mine{border-color:var(--ce-pink);background:rgba(255,102,171,.2);box-shadow:0 0 10px rgba(255,102,171,.25)}
.ce-quote{border-left:0;border-radius:999px;padding:2px 12px;background:rgba(255,255,255,.07);box-shadow:inset 3px 0 var(--ce-pink)}
.ce-replybar{border-left:0;border-radius:999px;padding:5px 14px;background:rgba(255,102,171,.12);box-shadow:inset 3px 0 var(--ce-pink)}
.chat__line.ce-mention{border-radius:10px;background:rgba(255,204,34,.1)}
.ce-acts .ce-reply-btn,.ce-acts .ce-react-btn{border-radius:999px}
`;

const EMO_KEY = 'oss-idle-lazer-emojis'; // { custom: [{ name, url }], embed, fav: [key], gifs: [link] }
const EMOJI_SETS = [
	['😄', 'Faces', 'smile=😄 grin=😁 joy=😂 rofl=🤣 laughing=😆 sweat_smile=😅 slight_smile=🙂 upside_down=🙃 wink=😉 blush=😊 innocent=😇 heart_eyes=😍 star_struck=🤩 kissing_heart=😘 yum=😋 tongue=😛 zany=🤪 stuck_out_tongue_winking_eye=😜 money_mouth=🤑 hugging=🤗 thinking=🤔 shush=🤫 zipper_mouth=🤐 raised_eyebrow=🤨 neutral=😐 expressionless=😑 no_mouth=😶 smirk=😏 unamused=😒 eye_roll=🙄 grimacing=😬 relieved=😌 pensive=😔 sleepy=😪 drooling=🤤 sleeping=😴 mask=😷 nauseated=🤢 vomiting=🤮 hot=🥵 cold=🥶 woozy=🥴 dizzy_face=😵 exploding_head=🤯 cowboy=🤠 partying=🥳 sunglasses=😎 nerd=🤓 monocle=🧐 confused=😕 worried=😟 slight_frown=🙁 frowning=☹️ open_mouth=😮 hushed=😯 astonished=😲 flushed=😳 pleading=🥺 fearful=😨 cold_sweat=😰 cry=😢 sob=😭 scream=😱 confounded=😖 persevere=😣 disappointed=😞 sweat=😓 weary=😩 tired=😫 yawning=🥱 triumph=😤 rage=😡 angry=😠 cursing=🤬 smiling_imp=😈 skull=💀 poop=💩 clown=🤡 ghost=👻 alien=👽 robot=🤖 melting=🫠 salute=🫡 face_holding_back_tears=🥹 skull_crossbones=☠️'],
	['👍', 'Hands', 'wave=👋 ok_hand=👌 pinched=🤌 v=✌️ crossed_fingers=🤞 love_you=🤟 metal=🤘 call_me=🤙 point_left=👈 point_right=👉 point_up=👆 point_down=👇 middle_finger=🖕 thumbsup=👍 +1=👍 thumbsdown=👎 -1=👎 fist=✊ punch=👊 clap=👏 raised_hands=🙌 open_hands=👐 handshake=🤝 pray=🙏 writing=✍️ muscle=💪 eyes=👀 eye=👁️ brain=🧠 tongue_out=👅 lips=👄 facepalm=🤦 shrug=🤷 bow=🙇 ninja=🥷'],
	['❤️', 'Hearts', 'heart=❤️ orange_heart=🧡 yellow_heart=💛 green_heart=💚 blue_heart=💙 purple_heart=💜 black_heart=🖤 white_heart=🤍 brown_heart=🤎 pink_heart=🩷 broken_heart=💔 two_hearts=💕 sparkling_heart=💖 heartpulse=💗 heartbeat=💓 revolving_hearts=💞 cupid=💘 gift_heart=💝 heart_exclamation=❣️ kiss=💋 100=💯 anger=💢 boom=💥 dizzy=💫 sweat_drops=💦 dash=💨 zzz=💤 speech=💬 thought=💭'],
	['🐱', 'Nature', 'cat=🐱 dog=🐶 mouse=🐭 hamster=🐹 rabbit=🐰 fox=🦊 bear=🐻 panda=🐼 koala=🐨 tiger=🐯 lion=🦁 cow=🐮 pig=🐷 frog=🐸 monkey=🐵 see_no_evil=🙈 hear_no_evil=🙉 speak_no_evil=🙊 chicken=🐔 penguin=🐧 bird=🐦 duck=🦆 owl=🦉 bat=🦇 wolf=🐺 horse=🐴 unicorn=🦄 bee=🐝 bug=🐛 butterfly=🦋 snail=🐌 turtle=🐢 snake=🐍 octopus=🐙 fish=🐟 dolphin=🐬 whale=🐳 shark=🦈 crab=🦀 seal=🦭 cherry_blossom=🌸 rose=🌹 sunflower=🌻 tulip=🌷 four_leaf_clover=🍀 maple_leaf=🍁 mushroom=🍄 cactus=🌵 tree=🌳 sun=☀️ moon=🌙 star=⭐ star2=🌟 sparkles=✨ zap=⚡ fire=🔥 rainbow=🌈 cloud=☁️ snowflake=❄️ snowman=⛄ droplet=💧 ocean=🌊 earth=🌍'],
	['🍕', 'Food', 'apple=🍎 green_apple=🍏 banana=🍌 grapes=🍇 strawberry=🍓 watermelon=🍉 peach=🍑 cherries=🍒 lemon=🍋 pineapple=🍍 mango=🥭 avocado=🥑 eggplant=🍆 carrot=🥕 corn=🌽 hot_pepper=🌶️ bread=🍞 cheese=🧀 egg=🥚 bacon=🥓 pancakes=🥞 burger=🍔 fries=🍟 pizza=🍕 hotdog=🌭 taco=🌮 burrito=🌯 sushi=🍣 ramen=🍜 spaghetti=🍝 rice=🍚 rice_ball=🍙 curry=🍛 bento=🍱 dumpling=🥟 popcorn=🍿 cookie=🍪 cake=🍰 birthday=🎂 cupcake=🧁 pie=🥧 chocolate=🍫 candy=🍬 lollipop=🍭 doughnut=🍩 icecream=🍦 coffee=☕ tea=🍵 bubble_tea=🧋 milk=🥛 beer=🍺 wine=🍷 cocktail=🍸 juice=🧃'],
	['🎮', 'Things', 'video_game=🎮 joystick=🕹️ keyboard=⌨️ computer=💻 desktop=🖥️ mouse_three_button=🖱️ headphones=🎧 microphone=🎤 musical_note=🎵 notes=🎶 musical_keyboard=🎹 guitar=🎸 drum=🥁 trophy=🏆 medal=🏅 first_place=🥇 second_place=🥈 third_place=🥉 dart=🎯 game_die=🎲 jigsaw=🧩 tada=🎉 confetti=🎊 balloon=🎈 gift=🎁 crown=👑 gem=💎 money=💰 dollar=💵 bell=🔔 alarm=⏰ hourglass=⌛ stopwatch=⏱️ bulb=💡 lock=🔒 key=🔑 hammer=🔨 wrench=🔧 gear=⚙️ bomb=💣 knife=🔪 pill=💊 phone=📱 camera=📷 tv=📺 book=📖 memo=📝 pencil=✏️ pushpin=📌 paperclip=📎 chart=📈 calendar=📅 rocket=🚀 car=🚗 airplane=✈️ house=🏠 checkered_flag=🏁 flag_white=🏳️ rainbow_flag=🏳️‍🌈'],
	['✅', 'Symbols', 'check=✅ heavy_check=✔️ x=❌ cross=✖️ warning=⚠️ no_entry=⛔ stop=🛑 question=❓ grey_question=❔ exclamation=❗ bangbang=‼️ interrobang=⁉️ plus=➕ minus=➖ infinity=♾️ recycle=♻️ new=🆕 free=🆓 up=🆙 cool=🆒 ok=🆗 sos=🆘 red_circle=🔴 orange_circle=🟠 yellow_circle=🟡 green_circle=🟢 blue_circle=🔵 purple_circle=🟣 black_circle=⚫ white_circle=⚪ arrow_up=⬆️ arrow_down=⬇️ arrow_left=⬅️ arrow_right=➡️ arrows_counterclockwise=🔄 repeat=🔁 fast_forward=⏩ rewind=⏪ play=▶️ pause=⏸️ mute=🔇 loud=🔊 copyright=©️ tm=™️ hash=#️⃣ zero=0️⃣ one=1️⃣ two=2️⃣ three=3️⃣ four=4️⃣ five=5️⃣ six=6️⃣ seven=7️⃣ eight=8️⃣ nine=9️⃣ keycap_ten=🔟'],
];
const EMOJI = new Map(); // name -> emoji
const EMOJI_ORDER = []; // [name, emoji, set index]
EMOJI_SETS.forEach(([, , list], set) => {
	for (const pair of list.split(' ')) {
		const at = pair.indexOf('=');
		const name = pair.slice(0, at), ch = pair.slice(at + 1);
		if (!EMOJI.has(name)) EMOJI_ORDER.push([name, ch, set]);
		EMOJI.set(name, ch);
	}
});
/** Whatever was stored (or pasted from a backup), made into settings we can trust. */
const normEmo = (v) => {
	v = v && typeof v === 'object' ? v : {};
	const strings = (a) => (Array.isArray(a) ? a.filter(x => typeof x === 'string') : []);
	const n = Number(v.maxEmbeds);
	return {
		custom: Array.isArray(v.custom) ? v.custom.filter(e => e && typeof e.name === 'string' && typeof e.url === 'string') : [],
		embed: v.embed !== false,
		fav: strings(v.fav), // 'e:name' (an emoji) or 'c:name' (one of yours)
		gifs: strings(v.gifs), // links, as you saved them (GIFs, stickers, WebMs)
		klipyKey: typeof v.klipyKey === 'string' ? v.klipyKey : '', // your KLIPY key, for GIF search
		cid: typeof v.cid === 'string' ? v.cid : '', // a random id KLIPY asks for (the same each time)
		sendOne: v.sendOne !== false, // one click sends a GIF or sticker
		size: ['s', 'm', 'l'].includes(v.size) ? v.size : 'm', // how big pictures get in chat
		maxEmbeds: n >= 1 && n <= 8 ? Math.floor(n) : 3, // pictures shown per message
		fmt: v.fmt === 'webm' ? 'webm' : 'gif', // what GIF search results are sent as
		hideLinks: v.hideLinks === true,
		star: v.star === true, // the star colors panel is unlocked
		starMode: ['solid', 'gradient'].includes(v.starMode) ? v.starMode : '', // your own star: '' (the usual), a color, or two colors that fade into each other
		starC1: /^#[0-9a-f]{6}$/i.test(v.starC1) ? v.starC1.toLowerCase() : '#ff66ab',
		starC2: /^#[0-9a-f]{6}$/i.test(v.starC2) ? v.starC2.toLowerCase() : '#4ba3ff',
		badge: v.badge !== false, // your messages carry an invisible mark, so other add-on users can show ✦ by your name
		ping: v.ping !== false, // a sound when someone @mentions you
		me: typeof v.me === 'string' ? v.me.slice(0, 40) : '', // your chat name, for @pings
	};
};
const loadEmo = () => {
	try { return normEmo(JSON.parse(localStorage.getItem(EMO_KEY) || '{}')); } catch { return normEmo({}); }
};
// a second copy in IndexedDB, in case localStorage gets cleared
const DB_NAME = 'oss-idle-chat-emojis';
const idb = () => new Promise((done) => {
	try {
		const r = indexedDB.open(DB_NAME, 1);
		r.onupgradeneeded = () => r.result.createObjectStore('kv');
		r.onsuccess = () => done(r.result);
		r.onerror = () => done(null);
	} catch { done(null); }
});
const idbPut = async (value) => {
	const db = await idb();
	if (!db) return;
	try {
		const tx = db.transaction('kv', 'readwrite');
		tx.objectStore('kv').put(value, EMO_KEY);
		tx.oncomplete = tx.onerror = tx.onabort = () => db.close();
	} catch { db.close(); /* not available */ }
};
const idbGet = async () => {
	const db = await idb();
	if (!db) return null;
	return new Promise((done) => {
		try {
			const q = db.transaction('kv').objectStore('kv').get(EMO_KEY);
			q.onsuccess = () => { done(typeof q.result === 'string' ? q.result : null); db.close(); };
			q.onerror = () => { done(null); db.close(); };
		} catch { done(null); db.close(); }
	});
};
const saveEmo = (s) => {
	const json = JSON.stringify(s);
	try { localStorage.setItem(EMO_KEY, json); } catch { /* private window */ }
	idbPut(json);
};
const NAME_RE = /^[a-z0-9_+-]{1,32}$/;
const PIC_EXT = /\.(png|jpe?g|gif|webp|avif|apng|bmp)$/i;
const VID_EXT = /\.(mp4|webm)$/i;
const PIC_HOSTS = /^(?:cdn\.discordapp\.com\/emojis\/|i\.imgur\.com\/|cdn\.7tv\.app\/emote\/|cdn\.betterttv\.net\/emote\/|static-cdn\.jtvnw\.net\/emoticons\/|cdn\.frankerfacez\.com\/|media\.tenor\.com\/|media\d?\.giphy\.com\/|i\.giphy\.com\/)/i;
const withScheme = (url) => (/^https?:\/\//i.test(url) ? url : `https://${url}`);
/**
 * What a link shows as, if it's a picture: { src, video, gif, own }. Page links from
 * Tenor, Giphy and Imgur become their GIF; .mp4/.webm GIFs play as silent loops.
 */
const mediaOf = (raw, emo) => {
	const url = withScheme(raw.replace(/[\u200b-\u200d\u2060\u2063]/g, '').trim()); // (invisible marks stuck to a link don't count)
	if (emo.custom.some(c => c.url === url)) return { src: url, own: true, video: VID_EXT.test(url.split(/[?#]/)[0]) };
	let u;
	try { u = new URL(url); } catch { return null; }
	const host = u.hostname.replace(/^www\./, '').toLowerCase(), path = u.pathname;
	let m;
	if (host === 'tenor.com' && (m = /^\/(?:[a-z]{2}(?:-[a-z]{2})?\/)?view\/([^/]+-\d+)\/?$/i.exec(path))) {
		return { src: `https://tenor.com/view/${m[1]}.gif`, gif: true };
	}
	if (host === 'giphy.com' && (m = /^\/(?:gifs|stickers|embed)\/(?:[^/]*-)?([A-Za-z0-9]{6,})\/?$/.exec(path))) {
		return { src: `https://media.giphy.com/media/${m[1]}/giphy.gif`, gif: true };
	}
	if (host === 'imgur.com' && (m = /^\/([A-Za-z0-9]{5,8})\/?$/.exec(path))) return { src: `https://i.imgur.com/${m[1]}.gif`, gif: true };
	if (host === 'i.imgur.com' && /\.gifv$/i.test(path)) return { src: url.replace(/\.gifv(?=$|[?#])/i, '.mp4'), video: true, gif: true };
	if (VID_EXT.test(path)) return { src: url, video: true, gif: true };
	const gif = /\.gif$/i.test(path) || /^(tenor|giphy)\.com$|\.(tenor|giphy)\.com$/.test(host);
	if (PIC_EXT.test(path) || PIC_HOSTS.test(host + path)) return { src: url, gif };
	return null;
};
/** An <img>, or a silent looping <video> for .mp4 GIFs. */
const mediaEl = (info, cls, alt) => {
	const e = document.createElement(info.video ? 'video' : 'img');
	e.className = cls;
	if (info.video) Object.assign(e, { muted: true, loop: true, autoplay: true, playsInline: true, preload: 'auto' });
	else Object.assign(e, { alt, draggable: false, loading: 'lazy' });
	e.referrerPolicy = 'no-referrer'; // (a picture someone posted shouldn't learn where it was opened from)
	e.title = alt;
	return e;
};
/** A message as it will be sent: :name: as the emoji, your own ones as their link. */
const expandEmoji = (text, emo) => text.replace(/:([a-z0-9_+-]{1,32}):/gi, (all, raw, at) => {
	const name = raw.toLowerCase();
	const own = emo.custom.find(c => c.name === name);
	if (own) { // a link needs a space after it, or the next words become part of it
		const next = text[at + all.length];
		return own.url + (next && !/\s/.test(next) ? ' ' : '');
	}
	return EMOJI.get(name) ?? all;
});

const chatName = (line) => (line.querySelector('.chat__name')?.textContent || '').replace(/[:\s]+$/, '').trim();
const chatTime = (line) => (/\d{1,2}:\d{2}(?::\d{2})?/.exec(line.querySelector('.chat__from')?.textContent || '') || [''])[0];
// every message from this add-on starts with these three invisible characters
const VERSION = '0.9.3';
const buildOf = (v) => { const [a = 0, b = 0, c = 0] = v.split('.').map(Number); return a * 10000 + b * 100 + c; };
const BUILD = buildOf(VERSION);
const MAX_BUILD = BUILD + 300; // (a few minor versions ahead is believable)
const STAR_SINCE = '0.9.2'; // the first version that sends and shows star colors
const showBuild = (n) => (n > 0 ? `${Math.floor(n / 10000)}.${Math.floor(n / 100) % 100}.${n % 100}` : 'an older version');
// after the three characters come 24 more (zero / one), which are this add-on's version number: that's how others tell who is out of date
const bitsOf = (n) => [...n.toString(2).padStart(24, '0')].map(b => (b === '1' ? '\u200d' : '\u200b')).join('');
const MARK = '\u200c\u2060\u200c';
// after the version come your star colors (if you picked some): 2 bits for the kind (1 = a color, 2 = two colors), then 24 bits for each color
const bitsN = (n, len) => [...n.toString(2).padStart(len, '0')].map(b => (b === '1' ? '\u200d' : '\u200b')).join('');
const starBits = (mode, c1, c2) => (mode === 'solid' ? bitsN(1, 2) + bitsN(parseInt(c1.slice(1), 16), 24) : mode === 'gradient' ? bitsN(2, 2) + bitsN(parseInt(c1.slice(1), 16), 24) + bitsN(parseInt(c2.slice(1), 16), 24) : '');
const numOf = (bits) => parseInt([...bits].map(c => (c === '\u200d' ? '1' : '0')).join(''), 2);
const hexOf = (bits) => `#${numOf(bits).toString(16).padStart(6, '0')}`;
/** The star colors a message carries: null if none. */
const colorFrom = (raw) => {
	for (const m of raw.matchAll(/\u200c\u2060\u200c([\u200b\u200d]{24})([\u200b\u200d]*)/g)) {
		if (numOf(m[1]) < 100) continue;
		const r = m[2];
		if (r.length === 26 && numOf(r.slice(0, 2)) === 1) return { c1: hexOf(r.slice(2)), c2: '' };
		if (r.length === 50 && numOf(r.slice(0, 2)) === 2) return { c1: hexOf(r.slice(2, 26)), c2: hexOf(r.slice(26)) };
		return null;
	}
	return null;
};
const MARK_RE = /\u200c\u2060\u200c[\u200b\u200d]*|\u2063\u200b\u2063/g; // (the second is the lazer look's own mark, which is ignored here)
/** The version a message was sent from: 0 if it has the mark but no version (an old one), -1 if no mark. */
// (a mark's build under 100 is the lazer look's own mark, not this add-on: it doesn't make a ✦)
const buildFrom = (raw) => {
	let best = -1;
	for (const m of raw.matchAll(/\u200c\u2060\u200c([\u200b\u200d]{24})?/g)) {
		const b = m[1] ? parseInt([...m[1]].map(c => (c === '\u200d' ? '1' : '0')).join(''), 2) : 0;
		if (b >= 100 && b <= MAX_BUILD && b > best) best = b; // (a build far above ours is a fake: it would turn everybody's stars blue)
	}
	return best;
};
const rawText = (line) => { // (the add-on's own boxes don't count as text; a picture counts as the emoji it shows)
	const t = line.querySelector('.chat__text');
	if (!t) return '';
	const c = t.cloneNode(true);
	c.querySelectorAll('.ce-quote, .ce-dbg, .ce-rx').forEach(e => e.remove());
	c.querySelectorAll('img').forEach(i => i.replaceWith(document.createTextNode(i.alt || i.getAttribute('title') || i.dataset.emoji || i.dataset.char || '')));
	return c.textContent;
};
// a reply travels as: ↪ Name #k3f9: “what it was about” ‣ your message (the #code is a short fingerprint of the message, the same for everyone)
const REPLY_RE = /^\s*↪[\uFE0E\uFE0F]? (.{1,40}?) #([0-9a-z]{3,8}): “([^”]{0,80})” ‣ ([\s\S]*)$/u;
/** What a message says, the same on every screen: no pictures, stars or quote boxes, :name: as emoji. */
const msgText = (line) => {
	const t = line.querySelector('.chat__text');
	if (!t) return '';
	const c = t.cloneNode(true);
	c.querySelectorAll('.ce-quote, .ce-dbg, .ce-rx, .ce-emo-save, img, video').forEach(e => e.remove());
	let x = c.textContent.replace(MARK_RE, '').replace(/[\u200b-\u200f\u2060-\u2064\ufeff]/g, '').replace(/:([a-z0-9_+-]{1,32}):/gi, (a, n) => EMOJI.get(n.toLowerCase()) ?? a).replace(/\s+/g, ' ').trim();
	const rp = REPLY_RE.exec(x);
	if (rp) x = rp[4].trim();
	return x;
};
/** A short fingerprint of a message: who said it, and what. */
const msgHash = (line) => {
	if (line._ceHash) return line._ceHash;
	let h = 5381;
	for (const ch of `${chatName(line).toLowerCase()}\n${msgText(line)}`) h = (Math.imul(h, 33) + ch.codePointAt(0)) >>> 0;
	return (line._ceHash = h.toString(36).slice(-5));
};
const lineText = (line) => rawText(line).replace(MARK_RE, '').replace(/[\u200b-\u200f\u2060-\u2064\ufeff]/g, ''); // (no invisible characters, whoever added them)
const USERS_KEY = 'oss-idle-chat-addon-users';
const loadUsers = () => { // name -> the version they were last seen on
	try {
		const v = JSON.parse(localStorage.getItem(USERS_KEY) || '{}');
		if (Array.isArray(v)) return new Map(v.filter(x => typeof x === 'string').map(x => [x, 0]));
		return new Map(Object.entries(v).filter(([k, n]) => typeof k === 'string' && Number.isFinite(n)));
	} catch { return new Map(); }
};
const COLORS_KEY = 'oss-idle-chat-addon-colors';
const loadColors = () => { // name -> the star colors they last sent
	try { return new Map(Object.entries(JSON.parse(localStorage.getItem(COLORS_KEY) || '{}')).filter(([, c]) => c && /^#[0-9a-f]{6}$/.test(c.c1) && (!c.c2 || /^#[0-9a-f]{6}$/.test(c.c2)))); } catch { return new Map(); }
};
const saveColors = (map) => { try { localStorage.setItem(COLORS_KEY, JSON.stringify(Object.fromEntries([...map].slice(-500)))); } catch { /* private window */ } };
const saveUsers = (map) => { try { localStorage.setItem(USERS_KEY, JSON.stringify(Object.fromEntries([...map].slice(-500)))); } catch { /* private window */ } };
// a reaction travels as one short chat line: ↩ Name #k3f9 reacted 😂 (and "unreacted" takes yours back)
const TYPING = '⌨'; // a hidden line that says "this person started typing"
const REACT_RE = /^\s*(?:\d{1,2}:\d{2}(?::\d{2})?\s*)?↩[\uFE0E\uFE0F]? (.{1,40}?) #([0-9a-z]{3,8}) (un)?reacted (\S{1,300})\s*$/u;
const escRe = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const chatEmoji = (() => {
	let emo = loadEmo();
	let picker = null, suggest = null;
	let pickSet = null; // which tab of the picker: 'fav', 'own', 'gif' or an emoji set's number
	const setInput = (input, value, caret) => {
		Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, value);
		input.dispatchEvent(new Event('input', { bubbles: true })); // so the game's chat box knows
		if (caret !== undefined) input.setSelectionRange(caret, caret);
	};
	const composeInput = () => document.querySelector('.community-chat-container .chat__compose input') || document.querySelector('.chat__compose input');
	/** The message as sent: with the invisible mark that tells other add-on users you have it (not for /commands). */
	const marked = (text) => (emo.badge && text && !text.startsWith(MARK) && !text.startsWith('/') ? MARK + bitsOf(BUILD) + starBits(emo.star ? emo.starMode : '', emo.starC1, emo.starC2) + text : text);
	/** Send a chat message right now, leaving whatever you were typing in the box. */
	const sendNow = (plain) => {
		const input = composeInput();
		if (!input) return;
		const form = input.form, draft = input.value;
		const body = plain.startsWith('↩') ? plain : withReply(plain);
		const text = marked(body);
		if (!plain.startsWith('↩')) { lastSent = expandEmoji(body, emo).trim(); lastSentAt = Date.now(); } // (the echo of it tells us your name)
		setInput(input, text);
		requestAnimationFrame(() => {
			if (!form?.isConnected) return;
			form.requestSubmit();
			setTimeout(() => { if (input.isConnected && (input.value === '' || input.value === text)) setInput(input, draft); }, 90);
		});
	};
	/** GIFs, WebMs and stickers can't be reactions (a still picture or an emoji can). */
	const isMotion = (content) => {
		if (!/^(https?:\/\/|[\w.-]+\.[a-z]{2,}\/)/i.test(content)) return false;
		const info = mediaOf(content, emo);
		return !!info && !!(info.gif || info.video);
	};
	const react = (t, content, undo) => { if (!undo && isMotion(expandEmoji(content, emo).trim())) return; sendNow(`↩ ${t.name} #${t.hash} ${undo ? 'unreacted' : 'reacted'} ${expandEmoji(content, emo).trim().split(/\s/)[0]}`); };
	/** A GIF or sticker picked in the picker: sent at once (Shift+click: into the chat box instead). */
	const pickGif = (url, e) => {
		const r = picker?.react;
		closePicker();
		if (r) return; // (no GIFs as reactions)
		else if (emo.sendOne && !e?.shiftKey) sendNow(url);
		else insert(`${url} `, true);
	};
	const insert = (text, spaced) => {
		if (picker?.react) { const r = picker.react; closePicker(); react(r, text.trim()); return; }
		const input = picker?.input || composeInput();
		if (!input) return;
		const v = input.value, a = input.selectionStart ?? v.length, b = input.selectionEnd ?? v.length;
		const before = v.slice(0, a), pad = spaced && before && !/\s$/.test(before) ? ' ' : '';
		const add = pad + text;
		input.focus();
		setInput(input, before + add + v.slice(b), a + add.length);
	};
	const isFav = (key) => emo.fav.includes(key);
	const toggleFav = (key) => {
		emo.fav = isFav(key) ? emo.fav.filter(k => k !== key) : [...emo.fav, key];
		saveEmo(emo);
	};
	const hasGif = (url) => emo.gifs.includes(url);
	const toggleGif = (url) => {
		emo.gifs = hasGif(url) ? emo.gifs.filter(g => g !== url) : [url, ...emo.gifs];
		saveEmo(emo);
	};

	// --- what's in the chat: pictures and GIFs for their links, emojis for :name: others typed
	const near = (log) => log.scrollHeight - log.scrollTop - log.clientHeight < 160;
	// names seen in chat (for @), reactions heard (by who they're on), and the add-on's own memory
	const names = new Map(); // lowercase -> name, oldest first
	let replyTo = null; // the message you're answering: { name, hash, snippet }
	let users = loadUsers(); // people seen using this add-on (their messages carry the mark)
	const colors = loadColors();
	let rxVer = 0, lastSent = '', lastSentAt = 0;
	/** A reaction line came in: put it on the newest message above it with that name and fingerprint. */
	const addReaction = (from, target, hash, content, by, undo) => {
		content = (EMOJI.get(((/^:([a-z0-9_+-]{1,32}):$/i.exec(content) || [])[1] || '').toLowerCase()) || content); // (:heart: shows as the heart)
		let line = from.previousElementSibling, n = 0;
		while (line && n++ < 400) {
			if (line.dataset.ceLine && !line.classList.contains('ce-react-line') && chatName(line).toLowerCase() === target.toLowerCase() && msgHash(line) === hash) break;
			line = line.previousElementSibling;
		}
		if (!line) return false;
		if (isMotion(content)) return true; // (a GIF reaction from an older version: hidden, no chip)
		const m = line._ceRx || (line._ceRx = new Map());
		let who = m.get(content);
		if (undo) {
			if (who?.delete(by)) { if (!who.size) m.delete(content); rxVer++; }
			return true;
		}
		if (!who) m.set(content, who = new Set());
		if (!who.has(by)) { who.add(by); rxVer++; }
		return true;
	};
	/** Debug note under a reaction line that couldn't be used (shown instead of hiding it). */
	const isMe = (name) => !!emo.me && name.toLowerCase() === emo.me.toLowerCase();
	const mentions = (text) => !!emo.me && new RegExp(`(^|[^\\w])@${escRe(emo.me)}(?![\\w-])`, 'i').test(text);
	let audio = null;
	const ping = () => {
		try {
			audio = audio || new AudioContext();
			if (audio.state === 'suspended') audio.resume();
			const t0 = audio.currentTime;
			for (const [f, d] of [[880, 0], [1318, 0.11]]) {
				const o = audio.createOscillator(), g = audio.createGain();
				o.type = 'sine';
				o.frequency.value = f;
				g.gain.setValueAtTime(0.0001, t0 + d);
				g.gain.linearRampToValueAtTime(0.18, t0 + d + 0.015);
				g.gain.exponentialRampToValueAtTime(0.0001, t0 + d + 0.28);
				o.connect(g).connect(audio.destination);
				o.start(t0 + d);
				o.stop(t0 + d + 0.3);
			}
		} catch { /* no sound available */ }
	};
	/** A short plain-text taste of a message, for quoting. */
	const snippetOf = (line) => {
		let t = lineText(line);
		const rm = REPLY_RE.exec(t);
		if (rm) t = rm[4];
		t = t.replace(/https?:\/\/\S+/g, (u) => (mediaOf(u, emo) ? '[picture]' : '[link]')).replace(/[“”]/g, '"').replace(/\s+/g, ' ').trim();
		return t.length > 50 ? `${t.slice(0, 49)}…` : t;
	};
	const composeForm = () => document.querySelector('.community-chat-container .chat__compose') || document.querySelector('.chat__compose');
	const syncReplyBar = () => {
		const form = composeForm();
		let bar = document.querySelector('.ce-replybar');
		if (!replyTo || !form) { bar?.remove(); return; }
		if (bar && bar.dataset.k === `${replyTo.name}|${replyTo.hash}|${replyTo.snippet}` && bar.nextSibling === form) return;
		bar?.remove();
		bar = el('div', 'ce-replybar');
		bar.dataset.k = `${replyTo.name}|${replyTo.hash}|${replyTo.snippet}`;
		const t = el('span');
		t.append('↪ Replying to ', el('b', '', replyTo.name), `: ${replyTo.snippet}`);
		const x = el('button', '', '✕');
		x.type = 'button';
		x.title = 'Cancel the reply';
		x.addEventListener('mousedown', e => e.preventDefault());
		x.addEventListener('click', () => { replyTo = null; syncReplyBar(); });
		bar.append(t, x);
		form.before(bar);
	};
	const startReply = (line) => {
		replyTo = { name: chatName(line), hash: msgHash(line), snippet: snippetOf(line) || '…' };
		syncReplyBar();
		composeInput()?.focus();
	};
	/** Your message with the reply prefix on it (once), if you're answering someone. */
	const withReply = (text) => {
		if (!replyTo || !text.trim() || text.startsWith('/')) return text;
		const r = replyTo;
		replyTo = null;
		syncReplyBar();
		return `↪ ${r.name} #${r.hash}: “${r.snippet.replace(/[“”]/g, '"')}” ‣ ${text.toLowerCase().startsWith(`@${r.name.toLowerCase()}`) ? text : `@${r.name} ${text}`}`;
	};
	/** A reply line, shown as a quote box over the message itself. */
	const quoteIt = (line, rm) => {
		const text = line.querySelector('.chat__text');
		const node = text && [...text.childNodes].find(n => n.nodeType === 3 && n.nodeValue.includes('‣ '));
		if (!node) return;
		node.nodeValue = node.nodeValue.slice(node.nodeValue.indexOf('‣ ') + 2);
		const q = el('span', 'ce-quote');
		q.append('↪ ', el('b', '', rm[1]), `  ${rm[3]}`);
		q.title = 'Go to the message';
		q.addEventListener('click', (e) => {
			e.preventDefault();
			e.stopPropagation();
			const all = [...document.querySelectorAll('.chat__log > .chat__line')];
			const from = all.indexOf(line);
			const hit = all.slice(0, from).reverse().find(l => !l.classList.contains('ce-react-line') && chatName(l).toLowerCase() === rm[1].toLowerCase() && msgHash(l) === rm[2]);
			if (!hit) return;
			hit.scrollIntoView({ block: 'center', behavior: 'smooth' });
			hit.classList.add('ce-flash');
			setTimeout(() => hit.classList.remove('ce-flash'), 1400);
		});
		text.prepend(q);
	};
	const startReact = (line) => {
		const form = document.querySelector('.community-chat-container .chat__compose') || document.querySelector('.chat__compose');
		if (form) togglePicker(form, { name: chatName(line), hash: msgHash(line) });
	};
	const lines = () => {
		const fresh = [...document.querySelectorAll('.chat__log > .chat__line:not([data-ce-line])')];
		const history = fresh.length > 4 || fresh.length === document.querySelectorAll('.chat__log > .chat__line').length; // (opening a chat shows old lines: no pings)
		for (const line of fresh) {
			line.dataset.ceLine = '1';
			line.classList.add('ce-line');
			const who = chatName(line);
			if (who && who.length <= 30 && !/\s/.test(who)) { names.delete(who.toLowerCase()); names.set(who.toLowerCase(), who); }
			if (who && rawText(line).includes(MARK)) { // they have the add-on, and this is the version they sent from
				const k = who.toLowerCase(), b = buildFrom(rawText(line));
				if ((users.get(k) ?? -1) < b) { users.set(k, b); saveUsers(users); }
				if (b >= 100) { // their star colors, as of this message
					const c = colorFrom(rawText(line)), was = colors.get(k);
					if (JSON.stringify(c) !== JSON.stringify(was ?? null)) { if (c) colors.set(k, c); else colors.delete(k); saveColors(colors); }
				}
			}
			if (who && lineText(line).trim() === TYPING) { line.classList.add('ce-react-line'); continue; } // (a leftover "typing" line from an older version: hidden)
			const rm = REACT_RE.exec(lineText(line));
			if (rm) {
				addReaction(line, rm[1], rm[2], rm[4], who || '?', !!rm[3]);
				line.classList.add('ce-react-line'); // (read, or not found: never shown as raw text)
				continue;
			}
			if (/^\s*(?:\d{1,2}:\d{2}(?::\d{2})?\s*)?↩/u.test(lineText(line))) {
				line.classList.add('ce-react-line');
				continue;
			} // (a reaction we can't read: never shown as raw text)
			if (!emo.me && lastSent && Date.now() - lastSentAt < 10000 && lineText(line).trim() === lastSent && who && (!emo.badge || rawText(line).includes(MARK))) { // your own message came back: that's your name
				emo.me = who;
				saveEmo(emo);
			}
			if (who && !isMe(who) && mentions(lineText(line))) {
				line.classList.add('ce-mention');
				if (!history && emo.ping) ping();
			}
			const rp = REPLY_RE.exec(lineText(line));
			if (rp) quoteIt(line, rp);
			const acts = document.createElement('span');
			acts.className = 'ce-acts';
			if (!rp) { // (a message that is itself a reply can't be replied to)
				const pb = document.createElement('button');
				pb.type = 'button';
				pb.className = 'ce-reply-btn';
				pb.title = 'Reply';
				pb.textContent = '↪';
				pb.addEventListener('click', (e) => { e.stopPropagation(); startReply(line); });
				acts.append(pb);
			}
			const rb = document.createElement('button');
			rb.type = 'button';
			rb.className = 'ce-react-btn';
			rb.title = 'React';
			rb.textContent = '☺';
			rb.addEventListener('click', (e) => { e.stopPropagation(); startReact(line); });
			acts.append(rb);
			const from = line.querySelector('.chat__from');
						if (from) from.prepend(acts); else line.prepend(acts); // (on hover, at the very left, before the time)
		}
		renderReactions();
	};
	const latestBuild = () => Math.max(BUILD, ...[...users.values()].filter(v => v <= MAX_BUILD));
	/** Who a ✦ is for, and whether they're out of date (null if they don't have the add-on). */
	const badgeInfo = (name) => {
		const b = isMe(name.trim()) ? BUILD : users.get(name.trim().toLowerCase()); // (you always have it: your own star shows too)
		const k = name.trim().toLowerCase();
		const own = isMe(name.trim());
		const c = own ? (emo.star && emo.starMode ? { c1: emo.starC1, c2: emo.starMode === 'gradient' ? emo.starC2 : '' } : null) : colors.get(k);
		return b === undefined ? null : { old: k !== 'kitsue' && b < latestBuild(), build: b, rainbow: k === 'kitsue', color: c || null }; // (only kitsue's star is always up to date; yours turns blue too when you're behind)
	};
	const setBadge = (b, info) => {
		b.classList.toggle('is-old', info.old);
		b.classList.toggle('ce-badge--rainbow', !!info.rainbow);
		const c = !info.old && !info.rainbow ? info.color : null;
		b.classList.toggle('ce-badge--grad', !!(c && c.c2));
		for (const [v, x] of [['--ce-star', c && !c.c2 ? c.c1 : ''], ['--g1', c?.c2 ? c.c1 : ''], ['--g2', c?.c2 || '']]) { if (x) b.style.setProperty(v, x); else b.style.removeProperty(v); }
		const t = info.old ? `Out of date: ${showBuild(info.build)} (the newest seen is ${showBuild(latestBuild())})` : `Uses the chat emojis add-on (${showBuild(info.build)})`;
		if (b.title !== t) b.title = t;
	};
	/** ✦ on the left edge of player cards (the rankings, the player list) for people known to use the add-on. */
	const cardBadges = () => {
		for (const nm of document.querySelectorAll('.player-card__name')) {
			const card = nm.closest('.player-card');
			if (!card) continue;
			const own = card.querySelector(':scope > .ce-badge');
			const info = emo.badge ? badgeInfo(nm.textContent) : null;
			if (info && !own) {
				const b = el('span', 'ce-badge ce-badge--card', '✦');
				setBadge(b, info);
				card.append(b);
			} else if (info) setBadge(own, info);
			else own?.remove();
		}
	};
	/** The little counters under a message. */
	const renderReactions = () => {
		for (const line of document.querySelectorAll('.chat__line[data-ce-line]:not(.ce-react-line)')) {
			const nm = line.querySelector('.chat__name');
			const info = nm && emo.badge ? badgeInfo(chatName(line)) : null;
			const had = line.querySelector('.ce-badge');
			if (info) {
				if (had) setBadge(had, info);
				else {
					const b = el('span', 'ce-badge', '✦');
					setBadge(b, info);
					nm.before(b);
				}
			} else had?.remove();
			const m = line._ceRx?.size ? line._ceRx : null;
			const bar = line.querySelector(':scope > .ce-rx');
			if (!m) { bar?.remove(); continue; }
			if (bar && bar.dataset.v === `${rxVer}|${emo.hideLinks}|${emo.me}`) continue;
			bar?.remove();
			const box = el('div', 'ce-rx');
			box.dataset.v = `${rxVer}|${emo.hideLinks}|${emo.me}`;
			const target = { name: chatName(line), hash: msgHash(line) };
			for (const [content, who] of m) {
				const chip = el('button', `ce-rx__chip${[...who].some(isMe) ? ' is-mine' : ''}`);
				chip.type = 'button';
				chip.title = `${[...who].join(', ')} reacted${[...who].some(isMe) ? ' (click to remove yours)' : ''}`;
				const info = /^https?:\/\//i.test(content) ? mediaOf(content, emo) : null;
				if (info && !emo.hideLinks && emo.embed) chip.append(Object.assign(mediaEl(info, '', content), { src: info.src }));
				else chip.append(el('span', '', info || /^https?:/i.test(content) ? '🔗' : content));
				chip.append(el('span', 'ce-rx__n', String(who.size)));
				chip.addEventListener('click', (e) => {
					e.stopPropagation();
					react(target, content, [...who].some(isMe)); // yours: click to take it back
				});
				box.append(chip);
			}
			line.classList.add('ce-hasrx');
			line.append(box);
		}
	};
	const decorate = () => {
		for (const text of document.querySelectorAll('.chat__text:not([data-ce-emo])')) {
			text.dataset.ceEmo = '1';
			for (const node of text.childNodes) {
				if (node.nodeType === 3 && node.nodeValue.includes(':')) {
					const v = node.nodeValue.replace(/:([a-z0-9_+-]{1,32}):/gi, (all, n) => EMOJI.get(n.toLowerCase()) ?? all);
					if (v !== node.nodeValue) node.nodeValue = v;
				}
			}
			const links = [...text.querySelectorAll('.chat__link')];
			let shown = 0;
			for (const link of links) {
				if (link.classList.contains('ce-emo-link')) { shown++; continue; }
				if (emo.hideLinks && !link.classList.contains('ce-shown')) { link.classList.add('ce-linkhid'); continue; }
				const url = (link.textContent || '').trim();
				const info = emo.embed ? mediaOf(url, emo) : null;
				if (!info || shown >= emo.maxEmbeds) continue; // (past the cap they stay plain links)
				shown++;
				const own = info.own && emo.custom.find(c => c.url === withScheme(url));
				const media = mediaEl(info, `ce-emo${info.gif && !own ? ' ce-emo--gif' : ''}`, own ? `:${own.name}:` : url);
				const log = text.closest('.chat__log');
				const stick = log && near(log);
				const loaded = () => { if (log && stick) log.scrollTop = log.scrollHeight; };
				const failed = () => { // not a picture after all: the plain link
					media.remove();
					link.querySelector('.ce-emo-save')?.remove();
					link.classList.remove('ce-emo-link');
				};
				if (info.video) { media.onloadeddata = loaded; media.onerror = failed; } else { media.onload = loaded; media.onerror = failed; }
				link.classList.add('ce-emo-link');
				link.addEventListener('click', (e) => {
					if (!link.classList.contains('ce-emo-link')) return; // (not a picture after all: a normal link)
					e.preventDefault();
					e.stopPropagation();
					openBox(info, withScheme(url));
				});
				link.append(media);
				if (!own) { // a star to keep it in your GIF tab
					const save = document.createElement('span');
					save.className = 'ce-emo-save';
					const show = () => {
						const on = hasGif(url);
						save.textContent = on ? '★' : '☆';
						save.classList.toggle('is-on', on);
						save.title = on ? 'Saved in your GIFs (click to remove)' : 'Save to your GIFs';
					};
					show();
					save.addEventListener('click', (e) => {
						e.preventDefault();
						e.stopPropagation(); // (not the link's own click)
						toggleGif(url);
						document.querySelectorAll('.ce-emo-save').forEach(s => s.dispatchEvent(new Event('ce-refresh')));
						if (picker && pickSet === 'gif') fill();
					});
					save.addEventListener('ce-refresh', show);
					link.append(save);
				}
				media.src = info.src;
			}
			// a message that is only pictures: show them bigger
			const rest = [...text.childNodes].filter(n => !(n.nodeType === 1 && (n.classList.contains('ce-emo-link') || n.classList.contains('ce-quote')))).map(n => n.textContent).join('').replace(MARK_RE, '');
			if (text.querySelector('.ce-emo-link') && !rest.replace(/^\d{1,2}:\d{2}(?::\d{2})?\s*/, '').trim()) text.classList.add('ce-emo-only');
		}
	};
	const undecorate = () => {
		document.querySelectorAll('.ce-linkhid, .ce-shown').forEach(e => e.classList.remove('ce-linkhid', 'ce-shown'));
		document.querySelectorAll('.ce-emo, .ce-emo-save').forEach(e => e.remove());
		document.querySelectorAll('.ce-emo-link').forEach(e => e.classList.remove('ce-emo-link'));
		document.querySelectorAll('.ce-emo-only').forEach(e => e.classList.remove('ce-emo-only'));
		document.querySelectorAll('[data-ce-emo]').forEach(e => delete e.dataset.ceEmo);
	};

	// --- the button by the chat box, and the picker
	const ensureButtons = () => {
		for (const form of document.querySelectorAll('.chat__compose')) {
			if (form.querySelector('.ce-emo-btn')) continue;
			const b = document.createElement('button');
			b.type = 'button';
			b.className = 'ce-emo-btn';
			b.title = 'Emojis and GIFs';
			b.textContent = '😊';
			b.addEventListener('mousedown', e => e.preventDefault()); // keep the chat box's caret
			b.addEventListener('click', (e) => { e.stopPropagation(); togglePicker(form); });
			form.append(b);
			const lk = document.createElement('button');
			lk.type = 'button';
			lk.className = 'ce-emo-btn ce-links-btn';
			lk.textContent = '🔗';
			lk.addEventListener('mousedown', e => e.preventDefault());
			lk.addEventListener('click', (e) => { e.stopPropagation(); setHideLinks(!emo.hideLinks); });
			form.append(lk);
		}
		syncLinksBtn();
		syncReplyBar();
	};
	const syncLinksBtn = () => document.querySelectorAll('.ce-links-btn').forEach((b) => {
		b.classList.toggle('is-on', emo.hideLinks);
		b.title = emo.hideLinks ? 'Links are hidden: click to show them' : 'Hide all links in chat';
	});
	/** Everything in chat drawn again (after a setting that changes how messages look). */
	const redo = () => { undecorate(); decorate(); renderReactions(); };
	const setHideLinks = (on) => {
		emo.hideLinks = on;
		saveEmo(emo);
		redo();
		syncLinksBtn();
		if (picker && pickSet === 'set') refill();
	};
	const applySize = () => {
		for (const c of ['s', 'm', 'l']) document.documentElement.classList.toggle(`ce-size-${c}`, emo.size === c);
	};
	// --- click a picture to enlarge it
	let box = null;
	const boxKey = (e) => { if (e.key === 'Escape') { e.stopPropagation(); closeBox(); } };
	const closeBox = () => {
		box?.remove();
		box = null;
		document.removeEventListener('keydown', boxKey, true);
	};
	const openBox = (info, url) => {
		closeBox();
		box = el('div', 'ce-box');
		const m = mediaEl(info, 'ce-box__m', url);
		if (info.video) m.controls = true;
		m.addEventListener('click', e => e.stopPropagation());
		m.src = info.src;
		const bar = el('div', 'ce-box__bar');
		bar.addEventListener('click', e => e.stopPropagation());
		const open = el('a', '', 'Open original');
		open.href = url;
		open.target = '_blank';
		open.rel = 'noopener noreferrer';
		const copy = el('button', '', 'Copy link');
		copy.type = 'button';
		copy.addEventListener('click', () => { navigator.clipboard?.writeText(url).then(() => { copy.textContent = 'Copied'; }, () => {}); });
		const close = el('button', '', 'Close');
		close.type = 'button';
		close.addEventListener('click', closeBox);
		bar.append(open, copy, close);
		box.append(m, bar);
		box.addEventListener('click', closeBox);
		document.body.append(box);
		document.addEventListener('keydown', boxKey, true);
	};
	const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };
	const TABS = [['fav', '⭐', 'Favorites'], ['own', '🖼️', 'Your emojis'], ['gif', 'GIF', 'GIFs and stickers'], ...EMOJI_SETS.map(([icon, title], i) => [i, icon, title]), ['lock', '🔒', 'Locked'], ['set', '⚙️', 'Settings']];
	const togglePicker = (form, reacting) => {
		if (picker && !reacting) { closePicker(); return; }
		if (picker) closePicker();
		const root = el('div', 'ce-emo-pick');
		root.addEventListener('mousedown', e => { if (!/^(INPUT|SELECT|OPTION|TEXTAREA)$/.test(e.target.tagName)) e.preventDefault(); });
		root.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Escape') closePicker(); }); // (keys here aren't the game's)
		const search = el('input', 'ce-emo-pick__search');
		search.placeholder = 'Search emojis';
		const tabs = el('div', 'ce-emo-pick__tabs');
		const grid = el('div', 'ce-emo-pick__grid');
		const foot = el('div', 'ce-emo-pick__foot');
		root.append(search, tabs, grid, foot);
		picker = { root, form, input: form.querySelector('input'), search, tabs, grid, foot, react: reacting || null };
		for (const [set, label, title] of TABS) {
			if (reacting && set === 'gif') continue; // (no GIFs as reactions)
			const t = el('button', `ce-emo-pick__tab${set === 'gif' ? ' is-text' : ''}`, set === 'lock' && emo.star ? '🔓' : label);
			t.type = 'button';
			t.title = title;
			t.dataset.set = String(set);
			t.addEventListener('click', () => { pickSet = set; search.value = ''; fill(); });
			tabs.append(t);
		}
		search.addEventListener('input', fill);
		document.body.append(root);
		place();
		if (pickSet === null || (reacting && (pickSet === 'set' || pickSet === 'gif' || pickSet === 'lock'))) pickSet = emo.fav.length ? 'fav' : emo.custom.length ? 'own' : 0;
		fill();
		search.focus();
		setTimeout(() => document.addEventListener('mousedown', outside, true));
	};
	const outside = (e) => {
		if (picker && !picker.root.contains(e.target) && !e.target.closest?.('.ce-emo-btn')) closePicker();
	};
	const closePicker = () => {
		picker?.root.remove();
		picker = null;
		document.removeEventListener('mousedown', outside, true);
	};
	const place = () => {
		if (!picker) return;
		const r = picker.form.getBoundingClientRect();
		const w = picker.root.offsetWidth || 380, h = picker.root.offsetHeight || 420;
		picker.root.style.left = `${Math.max(8, Math.min(window.innerWidth - w - 8, r.right - w - 40))}px`;
		picker.root.style.top = `${Math.max(8, r.top - h - 8)}px`;
	};
	/** One emoji in the picker; favKey gives it a star (and right-click) for Favorites. */
	const cell = (label, title, onPick, picture, favKey) => {
		const c = el('button', 'ce-emo-pick__cell');
		c.type = 'button';
		c.title = favKey ? `${title}  (right-click: ${isFav(favKey) ? 'unfavorite' : 'favorite'})` : title;
		if (picture) c.append(Object.assign(mediaEl(picture, '', title), { src: picture.src }));
		else c.textContent = label;
		c.addEventListener('click', onPick);
		if (favKey) {
			const star = el('span', `ce-emo-pick__fav${isFav(favKey) ? ' is-on' : ''}`, isFav(favKey) ? '★' : '☆');
			const flip = (e) => { e.preventDefault(); e.stopPropagation(); toggleFav(favKey); refill(); };
			star.addEventListener('click', flip);
			c.addEventListener('contextmenu', flip);
			c.append(star);
		}
		return c;
	};
	const removeX = (title, onRemove) => {
		const x = el('span', 'ce-emo-pick__del', '✕');
		x.title = title;
		x.addEventListener('click', (e) => { e.stopPropagation(); onRemove(); refill(); });
		return x;
	};
	const refill = () => { // (keeping your place in the list)
		const top = picker?.grid.scrollTop || 0;
		fill();
		if (picker) picker.grid.scrollTop = top;
	};
	const stdCell = (name, ch) => cell(ch, `:${name}:`, () => insert(ch), null, `e:${name}`);
	const ownCell = (c, withRemove) => {
	const b = cell('', `:${c.name}:`, (e) => {
		if (e.shiftKey && !picker.react) { closePicker(); sendNow(c.url); } // Shift+click: send it alone, as a sticker
		else insert(`:${c.name}: `, true);
	}, mediaOf(c.url, emo) || { src: c.url }, `c:${c.name}`);
		if (withRemove) {
			b.append(removeX(`Remove :${c.name}:`, () => {
				emo.custom = emo.custom.filter(o => o !== c);
				emo.fav = emo.fav.filter(k => k !== `c:${c.name}`);
				saveEmo(emo);
			}));
		}
		return b;
	};
	const empty = (text) => el('div', 'ce-emo-pick__empty', text);
	/** An add-by-link row; check(link) gives an error message, or saves it. */
	const addRow = (fields, onAdd) => {
		const form = el('form', 'ce-emo-pick__add');
		const inputs = fields.map(([ph, max]) => { const i = el('input'); i.placeholder = ph; if (max) i.maxLength = max; return i; });
		const add = el('button', '', 'Add');
		add.type = 'submit';
		const msg = el('div', 'ce-emo-pick__msg');
		form.append(...inputs, add);
		form.addEventListener('submit', (e) => {
			e.preventDefault();
			onAdd(inputs.map(i => i.value.trim()), (m) => { msg.textContent = m; });
		});
		picker.foot.append(form, msg);
	};
	const tryLoad = (info, ok, bad) => {
		const test = mediaEl(info, '', '');
		test.loading = 'eager'; // (a lazy picture that isn't on the page never loads)
		if (info.video) { test.onloadeddata = ok; test.onerror = bad; } else { test.onload = ok; test.onerror = bad; }
		test.src = info.src;
	};
	// --- GIF search, through KLIPY (with your own key)
	const KLIPY = 'https://api.klipy.com/api/v1';
	const gifCache = new Map(); // 'gifs|cat' -> { items, page, more } or { error }
			let gifKind = 'gifs'; // what search looks for: 'gifs' or 'stickers'
	let gifTimer = 0;
	let keyOpen = false; // showing the key box even though there's a key (to change it)
	const customerId = () => {
		if (!emo.cid) { emo.cid = `oss-${Math.random().toString(36).slice(2, 12)}`; saveEmo(emo); }
		return emo.cid;
	};
	/** One result: the GIF link to send (as KLIPY gives it) and a small preview. */
	const klipyItem = (it) => {
		const f = it?.file || {};
		const pick = (...ways) => { for (const [size, kind] of ways) { const u = f[size]?.[kind]?.url; if (u) return u; } return null; };
		return {
			send: pick(['sm', 'gif'], ['md', 'gif'], ['hd', 'gif']),
			webm: pick(['sm', 'webm'], ['md', 'webm'], ['hd', 'webm']),
			thumb: pick(['sm', 'webp'], ['xs', 'gif'], ['sm', 'gif']),
			title: it?.title || it?.slug || 'GIF',
		};
	};
	const klipySearch = async (key, q, page, kind = 'gifs') => {
		const url = `${KLIPY}/${encodeURIComponent(key)}/${kind}/search?q=${encodeURIComponent(q)}&page=${page}&per_page=24`
			+ `&customer_id=${encodeURIComponent(customerId())}&content_filter=high`;
		const res = await fetch(url);
		const body = await res.json().catch(() => null);
		if (!res.ok || !body?.result) throw new Error(body?.errors?.message?.[0] || `KLIPY answered ${res.status}`);
		const d = body.data || {};
		return { items: (d.data || []).map(klipyItem).filter(x => x.send && x.thumb), more: !!d.has_next };
	};
	const gifQuery = () => (picker ? picker.search.value.trim() : '');
	const loadGifs = (q, page) => {
		clearTimeout(gifTimer);
		const kind = gifKind, ck = `${kind}|${q}`;
		gifTimer = setTimeout(async () => {
			const had = gifCache.get(ck);
			try {
				const r = await klipySearch(emo.klipyKey, q, page, kind);
				gifCache.set(ck, page > 1 && had?.items ? { items: [...had.items, ...r.items], page, more: r.more } : { ...r, page });
			} catch (e) {
				gifCache.set(ck, { error: String(e.message || e) });
			}
			if (picker && pickSet === 'gif' && gifQuery() === q && gifKind === kind) refill();
		}, page > 1 ? 0 : 600); // (a pause while you type, so it doesn't search every letter)
	};
	const gifResults = (q) => {
		const { grid } = picker;
		const ck = `${gifKind}|${q}`;
		const got = gifCache.get(ck);
		if (!got) { grid.append(empty('Searching KLIPY…')); loadGifs(q, 1); return; }
		if (got.error) { gifCache.delete(ck); grid.append(empty(`GIF search didn't work: ${got.error}`)); return; }
		if (!got.items.length) { grid.append(empty(`No ${gifKind} found.`)); return; }
		for (const it of got.items) {
			const url = emo.fmt === 'webm' && it.webm ? it.webm : it.send; // what gets sent and saved
			const b = cell('', it.title, (e) => pickGif(url, e), { src: it.thumb });
			const star = el('span', `ce-emo-pick__fav${hasGif(url) ? ' is-on' : ''}`, hasGif(url) ? '★' : '☆');
			star.title = hasGif(url) ? 'Saved in your GIFs (click to remove)' : 'Save to your GIFs';
			star.addEventListener('click', (e) => { e.stopPropagation(); toggleGif(url); refill(); });
			b.append(star);
			grid.append(b);
		}
		if (got.more) {
			const more = el('button', 'ce-emo-pick__more', 'More GIFs');
			more.type = 'button';
			more.addEventListener('click', () => { more.disabled = true; more.textContent = 'Loading…'; loadGifs(q, got.page + 1); });
			grid.append(more);
		}
	};
	/** The box for your KLIPY key (GIF search needs one). */
	const keyBox = () => {
		const box = el('div', 'ce-emo-pick__key');
		const text = el('div');
		const link = el('a', '', 'partner.klipy.com');
		link.href = 'https://partner.klipy.com/api-keys';
		link.target = '_blank';
		link.rel = 'noopener noreferrer';
		text.append("GIF search uses KLIPY (Tenor's search shut down in June 2026). Get a free key at ", link, ' → API Keys, and paste it here:');
		box.append(text);
		picker.foot.append(box);
		addRow([['your KLIPY key']], ([key], say) => {
			if (!key) {
				emo.klipyKey = '';
				saveEmo(emo);
				keyOpen = false;
				fill();
				return;
			}
			say('Checking the key…');
			klipySearch(key, 'hello', 1, 'gifs').then(() => {
				emo.klipyKey = key;
				saveEmo(emo);
				keyOpen = false;
				gifCache.clear();
				fill();
			}, (e) => say(`That key didn't work: ${e.message || e}`));
		});
		const input = picker.foot.querySelector('.ce-emo-pick__add input');
		if (input) { input.value = emo.klipyKey; input.type = 'password'; }
	};

	const fill = () => {
		if (!picker) return;
		const { grid, foot, tabs, search } = picker;
		const gifs = pickSet === 'gif'; // (in the GIF tab the search box searches GIFs)
		const q = gifs ? '' : search.value.trim().toLowerCase().replace(/^:|:$/g, '');
		search.placeholder = picker.react ? `React to ${picker.react.name}: search emojis` : gifs ? (emo.klipyKey ? `Search KLIPY ${gifKind}` : 'Search KLIPY (needs a key, below)') : 'Search emojis';
		search.style.display = pickSet === 'set' || pickSet === 'lock' ? 'none' : '';
		grid.replaceChildren();
		foot.replaceChildren();
		grid.classList.toggle('is-gifs', gifs);
		grid.classList.toggle('is-set', (pickSet === 'set' || pickSet === 'lock') && !q);
		tabs.querySelectorAll('.ce-emo-pick__tab').forEach(t => t.classList.toggle('is-on', !q && t.dataset.set === String(pickSet)));
		if (gifs && gifQuery()) { // GIF search
			if (emo.klipyKey) gifResults(gifQuery());
			else grid.append(empty('GIF search needs a KLIPY key: see below.'));
			if (!emo.klipyKey || keyOpen) keyBox();
			else foot.append(el('div', 'ce-emo-pick__powered', 'Powered by KLIPY'));
		} else if (q) { // searching: yours first, then the emojis
			const own = emo.custom.filter(c => c.name.includes(q));
			const list = EMOJI_ORDER.filter(([name]) => name.includes(q));
			if (own.length) grid.append(el('div', 'ce-emo-pick__label', 'Yours'), ...own.map(c => ownCell(c)));
			if (list.length) grid.append(el('div', 'ce-emo-pick__label', 'Emojis'), ...list.map(([n, ch]) => stdCell(n, ch)));
			if (!own.length && !list.length) grid.append(empty('Nothing by that name.'));
		} else if (pickSet === 'fav') {
			const cells = emo.fav.map((key) => {
				const name = key.slice(2);
				if (key.startsWith('c:')) { const c = emo.custom.find(o => o.name === name); return c && ownCell(c); }
				return EMOJI.has(name) ? stdCell(name, EMOJI.get(name)) : null;
			}).filter(Boolean);
			if (cells.length) grid.append(...cells);
			else grid.append(empty('No favorites yet. Right-click any emoji (or click its ☆) to keep it here.'));
		} else if (pickSet === 'own') {
			grid.append(...emo.custom.map(c => ownCell(c, true)));
			if (!emo.custom.length) grid.append(empty('No emojis of your own yet. Give one a name and a link to a picture (png, gif, webp…) below.'));
			addRow([['name', 32], ['link to a picture']], ([rawName, link], say) => {
				const n = rawName.toLowerCase().replace(/^:|:$/g, '');
				const u = link && withScheme(link);
				if (!NAME_RE.test(n)) { say('Names are letters, numbers, _ + - (no spaces).'); return; }
				if (!u || !/^https?:\/\/\S+\.\S+/.test(u)) { say('That needs to be a link to a picture.'); return; }
				say('Checking the picture…');
				const info = mediaOf(u, emo) || { src: u };
				const keep = info.src !== u && !info.video ? info.src : u; // a page link (Tenor, Giphy): keep the picture's own link
				tryLoad(info, () => {
					emo.custom = [...emo.custom.filter(c => c.name !== n), { name: n, url: keep }];
					saveEmo(emo);
					fill();
				}, () => say("Couldn't load a picture from that link."));
			});
		} else if (pickSet === 'lock') {
			lockTab();
		} else if (pickSet === 'set') {
			settingsTab();
			return;
		} else if (pickSet === 'gif') {
			for (const url of emo.gifs) {
				const info = mediaOf(url, emo);
				if (!info) continue;
				const b = cell('', url, (e) => pickGif(url, e), info);
				b.append(removeX('Remove from your GIFs', () => { emo.gifs = emo.gifs.filter(g => g !== url); saveEmo(emo); }));
				grid.append(b);
			}
			if (!emo.gifs.length) grid.append(empty('No GIFs saved yet. Paste a GIF link below (Tenor, Giphy, Imgur, Discord…), or click the ☆ on any GIF in chat.'));
			addRow([['paste a GIF link']], ([link], say) => {
				const info = link && mediaOf(link, emo);
				if (!info) { say("That doesn't look like a GIF or picture link."); return; }
				if (hasGif(link)) { say('Already saved.'); return; }
				say('Checking the GIF…');
				tryLoad(info, () => { toggleGif(link); fill(); }, () => say("Couldn't load a GIF from that link."));
			});
			if (!emo.klipyKey || keyOpen) keyBox();
			else {
				const change = el('button', 'ce-emo-pick__keylink', 'KLIPY key…');
				change.type = 'button';
				change.title = 'Change or remove the key GIF search uses';
				change.addEventListener('click', () => { keyOpen = true; fill(); });
				foot.append(change);
			}
		} else {
			grid.append(...EMOJI_ORDER.filter(([, , set]) => set === pickSet).map(([n, ch]) => stdCell(n, ch)));
		}
	};
	/** The 🔒 tab: a password, and then your own look. */
	const lockTab = () => {
		const { grid } = picker;
		const done = (fn) => () => { saveEmo(emo); fn?.(); };
		const note = (t) => el('div', 'ce-set__sub', t);
		const say = el('div', 'ce-set__sub');
		if (!emo.star) {
			const row = el('label', 'ce-set');
			const code = el('input');
			code.type = 'password';
			code.placeholder = 'password';
			code.autocomplete = 'off';
			const go = el('button', '', 'Enter');
			go.type = 'button';
			const tryCode = () => {
				if (code.value.trim().toLowerCase() === 'skibidi') { emo.star = true; saveEmo(emo); redo(); const tb = document.querySelector('.ce-emo-pick__tab[data-set="lock"]'); if (tb) tb.textContent = '🔓'; fill(); } else { say.textContent = 'Wrong password.'; code.value = ''; }
			};
			go.addEventListener('click', tryCode);
			code.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter') { e.preventDefault(); tryCode(); } });
			row.append(code, go);
			grid.append(row, say);
			setTimeout(() => code.focus(), 0);
			return;
		}
		const choose = (label, key, options, after) => {
			const l = el('label', 'ce-set', label);
			const sel = el('select');
			for (const [v, t] of options) { const o = el('option', '', t); o.value = String(v); sel.append(o); }
			sel.value = String(emo[key]);
			sel.addEventListener('change', () => { emo[key] = sel.value; done(after)(); });
			l.append(sel);
			return l;
		};
		const pick = (label, key) => {
			const l = el('label', 'ce-set', label);
			const c = el('input');
			c.type = 'color';
			c.value = emo[key];
			c.addEventListener('input', () => { emo[key] = c.value; done(redo)(); });
			l.append(c);
			return l;
		};
		grid.append(el('div', 'ce-set__h', 'Your mark'), choose('Look', 'starMode', [['', 'The usual'], ['solid', 'One color'], ['gradient', 'Two colors, fading (animated)']], () => { redo(); fill(); }));
		if (emo.starMode) grid.append(pick(emo.starMode === 'gradient' ? 'First color' : 'Color', 'starC1'));
		if (emo.starMode === 'gradient') grid.append(pick('Second color', 'starC2'));
		grid.append(note(`People with this add-on (${STAR_SINCE} or newer) see it from your next message on. Everyone else sees the usual one.`));
	};
	/** The ⚙ tab. */
	const settingsTab = () => {
		const { grid } = picker;
		const done = (fn) => () => { saveEmo(emo); fn?.(); };
		const check = (label, key, after) => {
			const l = el('label', 'ce-set');
			const b = el('input');
			b.type = 'checkbox';
			b.checked = !!emo[key];
			b.addEventListener('change', () => { emo[key] = b.checked; done(after)(); });
			l.append(b, label);
			return l;
		};
		const choose = (label, key, options, after) => {
			const l = el('label', 'ce-set', label);
			const sel = el('select');
			for (const [v, t] of options) { const o = el('option', '', t); o.value = String(v); sel.append(o); }
			sel.value = String(emo[key]);
			sel.addEventListener('change', () => { emo[key] = typeof emo[key] === 'number' ? Number(sel.value) : sel.value; done(after)(); });
			l.append(sel);
			return l;
		};
		const note = (t) => el('div', 'ce-set__sub', t);
		const say = el('div', 'ce-set__sub');
		const meRow = el('label', 'ce-set', 'Your chat name');
		const me = el('input');
		me.type = 'text';
		me.placeholder = 'found when you send a message';
		me.value = emo.me;
		me.addEventListener('change', () => { emo.me = me.value.trim().replace(/^@/, ''); me.value = emo.me; done(redo)(); });
		meRow.append(me);
		const test = el('button', '', 'Test');
		test.type = 'button';
		test.addEventListener('click', ping);
		const pingRow = check('Ping when someone @mentions you', 'ping');
		const badgeRow = check('Mark my messages, and show ✦ by other add-on users', 'badge', redo);
		pingRow.append(test);
		const copy = el('button', '', 'Copy backup');
		copy.type = 'button';
		copy.addEventListener('click', () => {
			const text = JSON.stringify(emo);
			(navigator.clipboard?.writeText(text) || Promise.reject()).then(() => { say.textContent = 'Backup copied. It has your favorites, GIFs, emojis and KLIPY key: keep it private.'; }, () => { say.textContent = "Couldn't copy. (Your browser blocked it.)"; });
		});
		const backup = el('input');
		backup.type = 'text';
		backup.placeholder = 'paste a backup here';
		const restore = el('button', '', 'Restore');
		restore.type = 'button';
		restore.addEventListener('click', () => {
			try {
				const v = JSON.parse(backup.value);
				if (!v || typeof v !== 'object') throw new Error('x');
				emo = normEmo(v);
				saveEmo(emo);
				applySize();
				redo();
				syncLinksBtn();
				fill();
			} catch { say.textContent = "That doesn't look like a backup."; }
		});
		const bRow = el('div', 'ce-set');
		bRow.append(copy, backup, restore);
		const items = [
			el('div', 'ce-set__h', 'Sending'),
			check('One click sends a GIF or sticker (Shift+click puts it in the chat box)', 'sendOne'),
			choose('GIF search results are sent as', 'fmt', [['gif', 'GIF'], ['webm', 'WebM (smaller)']]),
			el('div', 'ce-set__h', 'In chat'),
			check('Show pictures and GIFs from links', 'embed', redo),
			check('Hide all links until clicked (also the 🔗 button by the chat box)', 'hideLinks', () => { redo(); syncLinksBtn(); }),
			choose('Picture size', 'size', [['s', 'Small'], ['m', 'Medium'], ['l', 'Large']], applySize),
			choose('Pictures shown per message', 'maxEmbeds', [[1, '1'], [2, '2'], [3, '3'], [5, '5'], [8, '8']], redo),
			el('div', 'ce-set__h', '@mentions'),
			meRow,
			pingRow,
			el('div', 'ce-set__h', 'Add-on users'),
			badgeRow,
			note('Your messages start with some invisible characters (they include your version). Anyone with this add-on sees ✦ by your name, blue if you are out of date; nobody else sees a thing.'),
			note(`You are on ${VERSION}.${latestBuild() > BUILD ? ` Someone you've seen is on ${showBuild(latestBuild())}: update this add-on.` : ''}`),
			el('div', 'ce-set__h', 'Your data'),
			bRow,
			note('Everything is saved in this browser (twice). If it ever gets cleared, paste a backup here to bring it all back.'),
			say,
		];
		grid.append(...items);
	};

	// --- :name: suggestions while typing, and :name: turned into emojis on send
	let matches = [], chosen = 0, token = null;
	const closeSuggest = () => { suggest?.remove(); suggest = null; matches = []; token = null; };
	const findToken = (input) => {
	const caret = input.selectionStart ?? input.value.length;
	const before = input.value.slice(0, caret);
	const m = /(^|\s):([a-z0-9_+-]{2,32})$/i.exec(before);
	if (m) return { start: caret - m[2].length - 1, end: caret, q: m[2].toLowerCase() };
	const a = /(^|\s)@([^\s@:]{1,24})$/.exec(before);
	return a ? { start: caret - a[2].length - 1, end: caret, q: a[2].toLowerCase(), at: true } : null;
};
	const showSuggest = (input) => {
		token = findToken(input);
		if (!token) { closeSuggest(); return; }
		const { q } = token;
		if (token.at) { // @name: people seen in chat lately, best match first
			matches = [...names.values()].reverse().filter(n => n.toLowerCase().includes(q) && !isMe(n))
				.sort((a, b) => (b.toLowerCase().startsWith(q) ? 1 : 0) - (a.toLowerCase().startsWith(q) ? 1 : 0)).slice(0, 8).map(n => ({ name: n, at: true }));
		} else {
		const score = (m) => (isFav(m.key) ? 0 : 2) + (m.name.startsWith(q) ? 0 : 1); // favorites first
		const own = emo.custom.filter(c => c.name.includes(q)).map(c => ({ name: c.name, url: c.url, key: `c:${c.name}` }));
		const std = EMOJI_ORDER.filter(([n]) => n.includes(q)).map(([name, ch]) => ({ name, ch, key: `e:${name}` }));
		matches = [...own, ...std].sort((a, b) => score(a) - score(b)).slice(0, 8);
		}
		if (!matches.length) { closeSuggest(); return; }
		chosen = Math.min(chosen, matches.length - 1);
		if (!suggest) {
			suggest = el('div', 'ce-emo-suggest');
			suggest.addEventListener('mousedown', e => e.preventDefault());
			document.body.append(suggest);
		}
		suggest.replaceChildren(...matches.map((m, i) => {
			const row = el('div', `ce-emo-suggest__row${i === chosen ? ' is-on' : ''}`);
			if (m.at) {
				row.append(el('span', 'ce-emo-suggest__ch', '@'), el('span', '', m.name));
			} else {
				if (m.url) {
					const info = mediaOf(m.url, emo) || { src: m.url };
					row.append(Object.assign(mediaEl(info, '', m.name), { src: info.src }));
				} else row.append(el('span', 'ce-emo-suggest__ch', m.ch));
				row.append(el('span', '', `:${m.name}:${isFav(m.key) ? ' ⭐' : ''}`));
			}
			row.addEventListener('click', () => { pick(input, i); input.focus(); });
			return row;
		}), el('div', 'ce-emo-suggest__hint', 'Tab or Enter to pick · Esc to close'));
		const r = input.getBoundingClientRect();
		suggest.style.left = `${Math.max(8, r.left)}px`;
		suggest.style.bottom = `${window.innerHeight - r.top + 6}px`;
	};
	const pick = (input, i) => {
		const m = matches[i];
		if (!m || !token) return;
		const v = input.value;
		const put = m.at ? `@${m.name} ` : m.url ? `:${m.name}: ` : m.ch;
		setInput(input, v.slice(0, token.start) + put + v.slice(token.end), token.start + put.length);
		closeSuggest();
	};
	const isCompose = (t) => t instanceof HTMLInputElement && t.closest('.chat__compose');
	const onInput = (e) => { if (isCompose(e.target)) { chosen = 0; showSuggest(e.target); } };
	const onKey = (e) => {
		const input = e.target;
		if (!isCompose(input)) return;
		if (suggest && matches.length) {
			const stop = () => { e.preventDefault(); e.stopImmediatePropagation(); };
			if (e.key === 'Tab' || e.key === 'Enter') { stop(); pick(input, chosen); return; }
			if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
				stop();
				chosen = (chosen + (e.key === 'ArrowDown' ? 1 : matches.length - 1)) % matches.length;
				showSuggest(input);
				return;
			}
			if (e.key === 'Escape') { stop(); closeSuggest(); return; }
		}
		if (e.key === 'Escape' && replyTo) { replyTo = null; syncReplyBar(); return; }
		if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
			const plain = withReply(expandEmoji(input.value.replace(MARK_RE, ''), emo));
			if (!plain.trim()) return;
			lastSent = plain.trim();
			lastSentAt = Date.now();
			const out = marked(plain);
			if (out === input.value) return;
			e.preventDefault();
			e.stopImmediatePropagation();
			setInput(input, out);
			const form = input.form;
			requestAnimationFrame(() => form?.isConnected && form.requestSubmit()); // after the chat box has the new text
		}
	};
	const onClick = (e) => { // a hidden link: first click shows it
		const a = e.target.closest?.('.chat__link.ce-linkhid');
		if (!a) return;
		e.preventDefault();
		e.stopPropagation();
		a.classList.replace('ce-linkhid', 'ce-shown');
		const t = a.closest('.chat__text');
		if (t) delete t.dataset.ceEmo;
		decorate();
	};
	const onBlur = (e) => { if (isCompose(e.target)) setTimeout(closeSuggest, 120); };
	const onStorage = (e) => {
		if (e.key === EMO_KEY) { emo = loadEmo(); applySize(); redo(); syncLinksBtn(); }
	};

	return {
		scan: () => { try { lines(); } catch { /* keep going */ } cardBadges(); decorate(); ensureButtons(); if (picker && !picker.form.isConnected) closePicker(); },
		mount: () => {
			emo = loadEmo();
			applySize();
			try { navigator.storage?.persist?.(); } catch { /* fine */ }
			if (localStorage.getItem(EMO_KEY) === null) { // localStorage was cleared: bring the IndexedDB copy back
				idbGet().then((json) => {
					if (!json || localStorage.getItem(EMO_KEY) !== null) return;
					try { emo = normEmo(JSON.parse(json)); } catch { return; }
					saveEmo(emo);
					applySize();
					redo();
					syncLinksBtn();
				});
			}
			document.addEventListener('input', onInput, true);
			document.addEventListener('keydown', onKey, true);
			document.addEventListener('focusout', onBlur, true);
			document.addEventListener('click', onClick, true);
			window.addEventListener('resize', place);
			window.addEventListener('storage', onStorage);
		},
		unmount: () => {
			document.removeEventListener('input', onInput, true);
			document.removeEventListener('keydown', onKey, true);
			document.removeEventListener('focusout', onBlur, true);
			document.removeEventListener('click', onClick, true);
			window.removeEventListener('resize', place);
			window.removeEventListener('storage', onStorage);
			closePicker();
			closeSuggest();
			closeBox();
			undecorate();
			for (const c of ['s', 'm', 'l']) document.documentElement.classList.remove(`ce-size-${c}`);
			document.querySelectorAll('.ce-emo-btn, .ce-react-btn, .ce-reply-btn, .ce-replybar, .ce-quote, .ce-rx, .ce-badge, .ce-acts').forEach(b => b.remove());
			document.querySelectorAll('.chat__line[data-ce-line]').forEach((l) => {
				l.classList.remove('ce-line', 'ce-react-line', 'ce-hasrx', 'ce-mention');
				delete l.dataset.ceLine;
			});
		},
	};
})();

let observer = null, frame = 0;
const soon = () => {
	if (!frame) frame = requestAnimationFrame(() => { frame = 0; chatEmoji.scan(); });
};

export const mount = () => {
	let style = document.getElementById(STYLE_ID);
	if (!style) {
		style = document.createElement('style');
		style.id = STYLE_ID;
		document.head.append(style);
	}
	style.textContent = CSS;
	chatEmoji.mount();
	observer = new MutationObserver(soon);
	observer.observe(document.body, { childList: true, subtree: true, characterData: true });
	chatEmoji.scan();
};

export const unmount = () => {
	observer?.disconnect();
	observer = null;
	if (frame) cancelAnimationFrame(frame);
	frame = 0;
	chatEmoji.unmount();
	document.getElementById(STYLE_ID)?.remove();
};

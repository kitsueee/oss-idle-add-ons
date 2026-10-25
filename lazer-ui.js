// oss!idle add-on: lazer look  (version 0.9.4)
//
// Copyright (c) 2026 kitsue. Released under the MIT License: free to use, copy, change
// and share, as long as this notice stays in; it comes with no warranty.
//
// Restyles the game after osu!lazer: a rounder, flatter look with lazer's
// colours and a Torus-like font (Outfit), across the main menu, song select,
// options, the in-game HUD and the results screen (with lazer's accuracy ring).
// (Chat emojis and GIFs are their own add-on now: "chat emojis".)
// Only looks change: nothing about playing, scores or settings does.

const STYLE_ID = 'oss-lazer-ui';
const FONT_ID = 'oss-lazer-ui-font';
const FONT = 'Outfit';
const FONT_URL = 'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap';

// lazer's rank colours, and where each rank starts (accuracy, mania)
const RANKS = [
	{ from: 0, to: 70, color: '#ff5a5a' },   // D
	{ from: 70, to: 80, color: '#ff8e5d' },  // C
	{ from: 80, to: 90, color: '#e3b130' },  // B
	{ from: 90, to: 95, color: '#88da20' },  // A
	{ from: 95, to: 100, color: '#02b5c3' }, // S
];

const CSS = String.raw`
.lz-corner{content:'LAZER';display:inline-block;margin-left:8px;padding:0 6px;height:14px;border-radius:7px;background:linear-gradient(90deg,#66ccff,#b48cff);color:#0b0b16;font:700 9px/14px "Exo 2",system-ui,sans-serif;letter-spacing:.08em;vertical-align:middle;box-shadow:0 0 8px rgba(140,160,255,.35)}
.lz-corner{position:absolute;z-index:3;top:11px;left:100px;margin:0;pointer-events:none}
.lz-corner--rainbow{background:linear-gradient(90deg,#ff5a5a,#ffb84d,#f3ee5a,#5ee07a,#4dc9ff,#8a7bff,#ff6ad5,#ff5a5a);background-size:200% 100%;animation:lz-rainbow 6s linear infinite;box-shadow:0 0 8px rgba(255,160,220,.4)}
@keyframes lz-rainbow{to{background-position:200% 0}}
.lz-only{flex:none;height:28px;margin-right:8px;padding:0 12px;border:0;border-radius:999px;background:rgba(255,255,255,.1);color:#fff;font:700 11px/28px "Exo 2",system-ui,sans-serif;letter-spacing:.06em;text-transform:uppercase;cursor:pointer;transition:background .15s}
.lz-only:hover{background:rgba(255,255,255,.18)}
.lz-only.is-on{background:linear-gradient(90deg,#66ccff,#b48cff);color:#0b0b16}
.community-body .player-card.lz-nolazer{display:none !important}
:root{--lz-pink:#ff66ab;--lz-yellow:#ffcc22;--lz-red:#ff5a5a;--lz-r:10px;--lz-panel:rgba(30,26,33,.94);--lz-panel2:rgba(255,255,255,.05);
 --lz-bg1:hsl(333 10% 9%);--lz-bg2:hsl(333 10% 14%);--lz-bg3:hsl(333 10% 19%);--lz-dim:rgba(255,255,255,.6);
 --osu-pink:#ff66ab;--osu-pink-light:#ff8cc4;--osu-pink-dark:#ff4d9d}
/* the font for the game; code boxes (the add-on editor) keep their own fixed-width font */
:root,body{font-family:"${FONT}","Exo 2",system-ui,sans-serif !important}
button,select,input:not([type=checkbox]):not([type=radio]){font-family:inherit}
.dropdown__current{border-radius:var(--lz-r) !important;background:var(--lz-panel) !important;border:0 !important;font-size:14px !important;font-weight:500 !important}
.dropdown__options{border-radius:var(--lz-r) !important;background:var(--lz-bg2) !important;overflow:hidden}
.dropdown__option{font-weight:500 !important}
.dropdown__option.is-selected{color:var(--lz-yellow) !important}

/* ---------- main menu: flat, slanted buttons in lazer's colours ---------- */
.menu__option_bg{display:none}
.menu__option_bg_safe{background:var(--lz-c,#6644cc) !important;border-radius:14px;transform:skewX(-12deg);box-shadow:0 6px 22px rgba(0,0,0,.35);width:92%}
.menu__option_bg_safe.on{background:color-mix(in srgb,var(--lz-c,#6644cc) 78%,#fff) !important}
.menu_option_contents{font-weight:600;font-size:38px;text-transform:lowercase;left:36%;text-shadow:0 2px 10px rgba(0,0,0,.25)}
.menu__option_group:nth-child(1) .menu__option:nth-child(1){--lz-c:#6644cc}
.menu__option_group:nth-child(1) .menu__option:nth-child(2){--lz-c:#eeaa00}
.menu__option_group:nth-child(1) .menu__option:nth-child(3){--lz-c:#555}
.menu__option_group:nth-child(1) .menu__option:nth-child(4){--lz-c:#ee3399}
.menu__option_group:nth-child(2) .menu__option:nth-child(1){--lz-c:#6644cc}
.menu__option_group:nth-child(2) .menu__option:nth-child(2){--lz-c:#5e3fba}
.menu__option_group:nth-child(3) .menu__option:nth-child(1){--lz-c:#a5cc00}
.menu__option_group:nth-child(3) .menu__option:nth-child(2){--lz-c:#4f9cff}
.menu__option_group:nth-child(3) .menu__option:nth-child(3){--lz-c:#eeaa00}
.menu__option_group .menu__option:last-child{--lz-c:#444}
.menu__option_group:nth-child(1) .menu__option:last-child{--lz-c:#ee3399}
.announce__body{border-radius:var(--lz-r) !important}

/* ---------- the main logo, after lazer's: a flat pink disc in a thick white ring, triangles drifting up inside ---------- */
.main-logo__pulse{position:relative;container-type:size}
.main-logo__pulse>img,.main-logo__overlay{opacity:0 !important}
.main-logo__pulse::before{content:"";position:absolute;inset:4%;box-sizing:border-box;border-radius:50%;border:4.4cqw solid #fff;
 background:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 104'><g fill='%23fff'><polygon points='10,40 26,12 42,40' opacity='.10'/><polygon points='62,70 84,32 106,70' opacity='.08'/><polygon points='30,100 44,76 58,100' opacity='.13'/><polygon points='86,22 96,4 106,22' opacity='.12'/></g><g fill='%23c2185b'><polygon points='44,60 56,40 68,60' opacity='.22'/><polygon points='0,96 12,76 24,96' opacity='.18'/><polygon points='96,100 110,76 124,100' opacity='.2'/></g></svg>") 0 0/34cqw 29.5cqw repeat,
 radial-gradient(circle at 50% 30%,#ff7cba,#ff5aa6 55%,#f0438f);
 box-shadow:0 1.5cqw 6cqw rgba(0,0,0,.45),inset 0 0 3cqw rgba(0,0,0,.12);animation:lz-logo-tri 14s linear infinite}
.main-logo__pulse::after{content:"id!e";position:absolute;inset:0;display:grid;place-items:center;padding-bottom:2cqw;
 font:800 29cqw/1 "${FONT}","Exo 2",sans-serif;letter-spacing:-.03em;color:#fff;text-shadow:0 .8cqw 2.5cqw rgba(110,0,50,.25);pointer-events:none}
@keyframes lz-logo-tri{to{background-position:0 -59cqw,0 0}}

/* ---------- song select ---------- */
.game__scrim{background:linear-gradient(90deg,rgba(0,0,0,.55),rgba(0,0,0,.15) 55%,rgba(0,0,0,.35))}
.game__topshape{display:none}
.game__topbar{height:96px}
.game__topinfo{top:58px;left:0;width:min(640px,42vw);max-width:none;height:auto}
.game__top_md-container{width:auto;margin-left:-22px;padding:14px 22px 14px 44px;background:var(--lz-panel);
 border-radius:var(--lz-r);transform:skewX(-12deg);box-shadow:0 6px 24px rgba(0,0,0,.45);overflow:hidden}
.game__top_md-container>*{transform:skewX(12deg)}
.game__top_md_icon{display:none}
.game__top_md_title{font-size:26px;font-weight:600;overflow:hidden;text-overflow:ellipsis}
.game__top_md_creator{font-size:15px;font-weight:400;color:var(--lz-dim)}
.game__top_version{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}
.game__top_music,.game__top_hos,.game__top_diff{font-size:12.5px;font-weight:600;padding:3px 10px;border-radius:999px;background:var(--lz-panel2)}
.game__top_diff{background:var(--lz-yellow);color:#16141a}
.game__top_lb-container{top:calc(100% + 14px);height:calc(100vh - 330px)}
.game__topfilter{position:fixed;top:154px;right:14px;width:var(--lz-fw);height:auto;padding:0}
.game__topfilter_scroll{display:none}
.game__topfilter_sort{justify-content:flex-start;gap:8px;pointer-events:auto}
.game__group,.game__sort{position:relative;flex:1;align-items:stretch;border-radius:var(--lz-r);background:var(--lz-panel)}
.game__group>span,.game__sort>span{align-self:stretch;display:flex;align-items:center;padding:0 12px;border-radius:var(--lz-r) 0 0 var(--lz-r);font-size:14px;font-weight:600;color:#fff;background:rgba(255,255,255,.08);text-transform:none}
.game__group .dropdown,.game__sort .dropdown{flex:1}
.game__group .dropdown__current,.game__sort .dropdown__current{width:100%;height:100%;justify-content:space-between;background:transparent !important}
.game__group .dropdown__options,.game__sort .dropdown__options{z-index:50;min-width:100%}
.songsearch{display:none !important}
.songsearch__row{border-radius:var(--lz-r);background:var(--lz-panel);padding:9px 14px;font-weight:500;box-shadow:0 4px 16px rgba(0,0,0,.35)}
.songsearch__row span{display:none}
.songsearch__input,.songsearch__input::placeholder{font-size:15px;font-weight:500;color:#fff}
.songsearch__count{font-weight:500}
.game__body,.game--queueing .game__body,.game--queue .game__body{height:calc(100% - 160px)}
.game__body{padding-left:44vw;padding-top:112px}
/* the leaderboard reaches down to the bottom bar: the global scores keep their full
   space, and the personal best sits below them, just above the bar */
.game__top_lb-container{height:calc(100vh - 300px)}
.game__top_lb-container .lb{display:flex;flex-direction:column}
.game__top_lb-container .lb__body{flex:1 1 auto;min-height:0;max-height:none}
.lb__pb{flex:0 0 auto;margin-top:auto;padding:4px 0 6px}
.lb__pb_label{padding:2px 0 6px;font-size:14px;font-weight:600;letter-spacing:.04em;text-align:left;padding-left:18px;color:var(--lz-dim)}
.carousel{padding:30vh 0}
.bm-card{width:92%;height:84px;margin-bottom:6px;border-radius:var(--lz-r);transform:translate(calc(var(--pop) + 24px)) scale(var(--scale));
 box-shadow:0 3px 10px rgba(0,0,0,.4);border:2px solid transparent}
.bm-card:hover{--pop:-10px}
.bm-card.is-sibling{--pop:-14px;box-shadow:0 3px 12px rgba(0,0,0,.45)}
.bm-card.is-sibling:hover{--pop:-20px}
.bm-card.is-active{--pop:-30px;--scale:1;border-color:var(--lz-pink);box-shadow:0 0 18px rgba(255,102,171,.55)}
.bm-card.is-active:hover{--pop:-32px}
/* the other difficulties of the selected map's set */
.bm-card.is-sibling:not(.is-active),.bm-card.lz-sameset:not(.is-active){--pop:-26px;border:2px solid #ff66ab !important;border-left-width:8px !important;
 box-shadow:0 0 22px rgba(255,102,171,.7),inset 0 0 0 1px rgba(255,255,255,.25);animation:lz-sameset 1.6s ease-in-out infinite}
.bm-card.is-sibling:not(.is-active) .bm-card__scrim,.bm-card.lz-sameset:not(.is-active) .bm-card__scrim{background:linear-gradient(90deg,rgba(170,40,100,.85),rgba(120,30,75,.55) 50%,rgba(60,20,40,.2)) !important}
@keyframes lz-sameset{0%,100%{box-shadow:0 0 14px rgba(255,102,171,.55),inset 0 0 0 1px rgba(255,255,255,.2)}50%{box-shadow:0 0 30px rgba(255,102,171,.95),inset 0 0 0 1px rgba(255,255,255,.35)}}
.bm-card__scrim{background:linear-gradient(90deg,rgba(20,18,22,.92),rgba(20,18,22,.7) 50%,rgba(20,18,22,.35))}
.bm-card.is-active .bm-card__scrim{background:linear-gradient(90deg,rgba(20,18,22,.85),rgba(20,18,22,.55) 50%,rgba(20,18,22,.2))}
.bm-card__title{font-weight:600;font-size:17px}
.bm-card__artist{font-size:13px;font-weight:500}
.bm-card__meta{gap:8px}
.bm-card__stars{font-size:11.5px;font-weight:700;padding:1px 8px;border-radius:999px;background:currentColor;-webkit-text-fill-color:#16141a;text-shadow:none !important}
.bm-card__version{font-size:12.5px;font-weight:600;text-shadow:none !important}
.bm-card__creator{font-size:12px}
.bm-card__dl{color:var(--lz-yellow);font-weight:600;font-size:13px;text-shadow:none;animation:none}
.bm-card__xp-chip{border-radius:999px;border-color:transparent;background:rgba(0,0,0,.55)}
.carousel::-webkit-scrollbar-thumb{background:rgba(255,255,255,.25)}
/* leaderboard like lazer's: upright rows, each one a step further left than the one
   above (so the list leans), with the right end cut on a slant */
:is(.lb__list>li,.game__top_lb-container li,.lz-lbrow){position:relative;height:52px;margin:0 0 6px !important;width:calc(100% - 100px) !important;border:0 !important;border-radius:0 !important;
 background:transparent !important;box-shadow:none !important;
 transform:translateX(calc(14px + (10 - var(--lz-i,0)) * 7px)) !important;transition:opacity .4s}
:is(.lb__list>li,.game__top_lb-container li,.lz-lbrow)::before{content:"";position:absolute;inset:0;z-index:-1;border-radius:10px 0 0 10px;pointer-events:none;
 background:linear-gradient(90deg,rgba(72,60,76,.94),rgba(46,38,50,.94));clip-path:polygon(0 0,100% 0,calc(100% - 16px) 100%,0 100%)}
.score_entry__row:not(.loaded){transform:translateX(calc((10 - var(--lz-i,0)) * 7px - 6px)) !important}
:is(.lb__list>li,.game__top_lb-container li,.lz-lbrow):hover::before{background:linear-gradient(90deg,rgba(96,78,100,.96),rgba(62,50,66,.96))}
.lz-top10::before{background:linear-gradient(90deg,rgba(96,80,50,.94),rgba(52,44,34,.94))}
.score_entry__row>.score_entry__avatar{height:52px;width:56px;border-radius:10px 0 0 10px;background-size:cover;background-position:center;overflow:hidden}
.score_entry__rank{border-radius:10px 0 0 10px}
.score_entry__name{font-size:15px;font-weight:600;letter-spacing:0}
.score_entry__score{font-size:13px;letter-spacing:0;color:var(--lz-dim)}
.score_entry__acc{font-size:12px;font-weight:600;color:var(--lz-yellow)}
/* everything fits inside the row, clear of its slanted end */
:is(.lb__list>li,.game__top_lb-container li,.lz-lbrow){padding-right:24px !important;overflow:visible}
.score_entry__main{min-width:0;overflow:hidden}
.score_entry__name,.score_entry__score{display:block;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;line-height:1.2}
.score_entry__stats{justify-content:center;gap:0 !important;line-height:1.15}
.score_entry__stats>*{font-size:11px !important;line-height:1.15 !important}
.score_entry__stats .score_entry__acc{font-size:12px !important}
.score_entry__grade img{width:40px;height:40px}
.game__botbar{position:absolute !important;left:0;right:0;bottom:0;height:64px;background:var(--lz-panel);border-top:0;box-shadow:0 -4px 18px rgba(0,0,0,.35)} /* (stuck to the bottom of the screen, whatever the queue does to the space above it) */
.game__botbar-left{height:64px}
.game__exit{height:64px;padding:0 34px 0 46px;margin-left:-14px;font-size:18px;font-weight:600;text-transform:lowercase;background:var(--lz-pink);transform:skewX(-12deg)}
.game__exit:hover{transform:skewX(-12deg);filter:brightness(1.1)}
.select-footer{margin-left:22px;gap:2px}
.select-footer__btn{width:110px;font-size:15px;font-weight:600;background:transparent;border-top:0;border-bottom:4px solid var(--strip);text-transform:lowercase}
.select-footer__btn:hover{background:rgba(255,255,255,.06);filter:none}
.select-footer__btn.is-mods{--strip:#ff66ab}.select-footer__btn.is-random{--strip:#88b300}.select-footer__btn.is-options{--strip:#4f9cff}
.select-footer__key{display:none}
.game__user{height:64px}
.game__user-name{font-size:17px;font-weight:600}
.game__user-pp{font-size:13px;font-weight:400;color:var(--lz-dim)}
.game__avatar{border-radius:var(--lz-r)}
.game__user-level-bar{height:6px;border:0;border-radius:3px;background:rgba(255,255,255,.12)}
.game__user-level-bar-fill{background:var(--lz-yellow)}


/* the profile: the game's card is shown on the toolbar instead (a copy; clicks go to the game's) */
html.lz-has-toolbar .game__user{display:none}
/* lazer's search and star rating filter */
:root{--lz-fw:min(640px,46vw)}
.lz-filter{position:fixed;top:52px;right:14px;z-index:14;width:var(--lz-fw);display:grid;gap:8px;font-family:"${FONT}","Exo 2",sans-serif}
.lz-filter[hidden]{display:none}
.lz-search{display:flex;border-radius:var(--lz-r);background:var(--lz-panel);box-shadow:0 4px 16px rgba(0,0,0,.35);overflow:hidden}
.lz-search__main{flex:1;min-width:0;padding:8px 14px 6px}
.lz-search__input{width:100%;padding:0;border:0;outline:0;background:transparent;color:#fff;font:400 22px "${FONT}","Exo 2",sans-serif}
.lz-search__input::placeholder{color:rgba(255,255,255,.55)}
.lz-search__count{font-size:12px;font-weight:600;color:var(--lz-yellow)}
.lz-search__go{width:58px;display:grid;place-items:center;border:0;background:rgba(255,255,255,.06);color:#fff;cursor:pointer}
.lz-search__go svg{width:20px;height:20px}
.lz-stars{display:flex;align-items:center;gap:8px}
.lz-setbtn{flex-shrink:0;align-self:stretch;max-width:46%;display:flex;align-items:center;gap:6px;padding:0 12px;border:0;border-radius:var(--lz-r);background:var(--lz-panel);
 color:#fff;font:600 13px "${FONT}","Exo 2",sans-serif;cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.lz-setbtn:hover{filter:brightness(1.2)}
.lz-setbtn.is-on{background:var(--lz-pink)}
.lz-chip{flex-shrink:0;align-self:stretch;display:flex;align-items:center;padding:0 12px;border-radius:var(--lz-r);background:var(--lz-panel);font-size:14px;font-weight:600;color:#fff}
.lz-range{position:relative;flex:1;height:30px;border-radius:var(--lz-r);overflow:hidden;
 background:linear-gradient(90deg,#4290fb 0%,#4fc0ff 12%,#4fffd5 20%,#7cff4f 25%,#f6f05c 33%,#ff8068 42%,#ff4e6f 49%,#c645b8 58%,#6563de 67%,#18158e 77%,#000 92%)}
.lz-range__dim{position:absolute;inset:0;pointer-events:none;
 background:linear-gradient(90deg,rgba(0,0,0,.65) var(--a),transparent var(--a),transparent var(--b),rgba(0,0,0,.65) var(--b))}
.lz-range input{position:absolute;inset:0;width:100%;height:100%;margin:0;appearance:none;-webkit-appearance:none;background:transparent;pointer-events:none}
.lz-range input::-webkit-slider-thumb{-webkit-appearance:none;width:44px;height:30px;border-radius:var(--lz-r);background:rgba(30,26,33,.9);border:2px solid rgba(255,255,255,.5);pointer-events:auto;cursor:pointer}
.lz-range__val{position:absolute;top:0;width:44px;height:30px;display:grid;place-items:center;pointer-events:none;font-size:13px;font-weight:600;color:#fff;
 left:calc(var(--p) * (100% - 44px) / 100)}


/* ---------- lazer's toolbar across the top ---------- */
.lz-toolbar{position:fixed;top:0;left:0;right:0;z-index:9000;height:44px;display:flex;align-items:stretch;background:hsl(333 10% 10% / .96);box-shadow:0 2px 14px rgba(0,0,0,.45);font-family:"${FONT}","Exo 2",sans-serif;color:#fff;user-select:none}
.lz-toolbar[hidden]{display:none}
.lz-tb__btn{position:relative;display:flex;align-items:center;justify-content:center;gap:8px;min-width:46px;padding:0 12px;border:0;background:transparent;color:#fff;cursor:pointer;font:500 14px "${FONT}","Exo 2",sans-serif}
.lz-tb__btn:hover{background:rgba(255,255,255,.08)}
.lz-tb__btn svg{width:20px;height:20px;flex-shrink:0}
.lz-tb__btn::after{content:attr(data-tip);position:absolute;top:50px;left:50%;transform:translateX(-50%);padding:5px 10px;border-radius:8px;background:rgba(20,17,20,.95);font-size:12px;font-weight:500;white-space:nowrap;opacity:0;pointer-events:none;transition:opacity .12s}
.lz-tb__btn:hover::after{opacity:1}
.lz-tb__btn.is-on{box-shadow:inset 0 -3px var(--lz-pink)}
.lz-tb__sep{width:1px;margin:10px 6px;background:rgba(255,255,255,.18)}
.lz-tb__grow{flex:1}
.lz-tb__user{display:flex;align-items:center;gap:10px;max-width:340px;padding:0 14px 0 6px;border:0;background:transparent;color:#fff;cursor:pointer;text-align:left}
.lz-tb__user:hover{background:rgba(255,255,255,.08)}
.lz-tb__user[hidden]{display:none}
/* the global rank beside the name, in the game's tier colours (gold, platinum... and the shining #1) */
.lz-tb__rank{flex-shrink:0;margin-left:4px;font-size:24px;font-weight:300;line-height:1;letter-spacing:-.02em;color:rgba(255,255,255,.6)}
.lz-tb__rank:empty{display:none}
.lz-tb__rank.is-tiered{-webkit-background-clip:text;background-clip:text;color:transparent}
.lz-tb__rank.is-first{background-image:linear-gradient(110deg,transparent 35%,rgba(255,255,255,.85) 50%,transparent 65%),linear-gradient(#ffe600,#ed82ff);
 background-size:250% 100%,100% 100%;filter:drop-shadow(0 0 6px rgba(237,130,255,.55));animation:lz-rank-shine 3.5s ease-in-out infinite}
@keyframes lz-rank-shine{0%{background-position:150% 0,0 0}100%{background-position:-50% 0,0 0}}
.lz-tb__user img{width:34px;height:34px;flex-shrink:0;border-radius:8px;object-fit:cover;background:rgba(255,255,255,.08)}
.lz-tb__who{display:grid;min-width:0}
.lz-tb__name,.lz-tb__sub{overflow:hidden;white-space:nowrap;text-overflow:ellipsis}
.lz-tb__name{font-size:14px;font-weight:600;line-height:1.15}
.lz-tb__sub{font-size:11px;font-weight:500;color:var(--lz-dim);line-height:1.2}
.lz-tb__clock{display:flex;flex-direction:column;justify-content:center;align-items:flex-end;width:150px;padding:0 16px 0 0;font-variant-numeric:tabular-nums}
.lz-tb__time{font-size:15px;font-weight:600;line-height:1.1}
.lz-tb__run{font-size:11px;font-weight:500;color:var(--lz-pink);line-height:1.2}
html.lz-has-toolbar .menu__brand{top:52px}
html.lz-has-toolbar .resultscreen{padding-top:44px}
html.lz-has-toolbar .options__quick_access,html.lz-has-toolbar .options__panel{padding-top:44px}


/* ---------- online users and chat: lazer's dashboard overlay ---------- */
html.lz-has-toolbar .community{top:44px}
.community-panel{background:hsl(333 10% 9% / .97);box-shadow:0 8px 30px rgba(0,0,0,.5)}
.community-header{align-items:center;gap:10px 28px;padding:18px 28px 14px;background:hsl(333 10% 13%)}
.community-header__brand{font-size:30px;font-weight:300;letter-spacing:0;text-transform:lowercase}
.community-header__online{font-size:13px;font-weight:600;color:var(--lz-yellow)}
.community-header__filters{align-items:center;gap:12px;margin-top:0;font-size:14px}
.community-header__filters .cols{flex-direction:row;align-items:center;gap:10px;padding:0;color:var(--lz-dim)}
.community-header__search{height:34px;min-width:220px;padding:0 16px;border:0 !important;border-radius:999px;background:hsl(333 10% 7%);font-size:14px}
.community-header__search::placeholder{color:rgba(255,255,255,.45)}
/* the now playing box: a lazer card, with a glowing progress bar and round buttons */
.community-music{position:relative;box-sizing:border-box;align-items:stretch!important;gap:12px;padding:14px 16px 16px;border-radius:16px;overflow:hidden;
 background:linear-gradient(135deg,hsl(333 16% 21%),hsl(333 10% 11%));box-shadow:0 8px 24px rgba(0,0,0,.45),inset 0 0 0 1px rgba(255,255,255,.07)}
.community-music::before{content:"";position:absolute;left:0;top:0;bottom:0;width:4px;background:linear-gradient(180deg,var(--lz-pink),#b48cff)}
.community-music::after{content:"";position:absolute;right:-40px;top:-40px;width:130px;height:130px;border-radius:50%;background:radial-gradient(circle,rgba(255,102,171,.28),transparent 70%);pointer-events:none}
.community-music__meta{align-items:flex-start!important;text-align:left;gap:3px;min-width:0}
.community-music__label{font-size:10px;font-weight:700;letter-spacing:.16em;color:var(--lz-pink)}
.community-music__label::before{content:"\266A\00a0";letter-spacing:0}
.community-music__title{width:100%;font-size:16px;font-weight:600;line-height:1.3;text-overflow:ellipsis}
.community-music__transport{position:relative;z-index:1;justify-content:center;width:100%;gap:10px}
.community-music__transport button{width:34px;height:34px;padding:0;border:0;border-radius:50%;color:#fff;background:rgba(255,255,255,.09);opacity:1;cursor:pointer;place-items:center;transition:background .14s,transform .14s,box-shadow .14s}
.community-music__transport button:hover{background:rgba(255,255,255,.2);transform:scale(1.08)}
.community-music__transport button:nth-child(2){width:44px;height:44px;background:var(--lz-pink);box-shadow:0 0 14px rgba(255,102,171,.55)}
.community-music__transport button:nth-child(2):hover{background:#ff85bf;box-shadow:0 0 20px rgba(255,102,171,.8)}
.community-music__transport svg{width:18px;height:18px}
.community-music__transport button:nth-child(2) svg{width:20px;height:20px}
.community-music__bar{width:100%!important;box-sizing:border-box;height:6px;border-radius:999px;background:rgba(255,255,255,.14);overflow:hidden}
.community-music__fill{border-radius:999px;background:linear-gradient(90deg,var(--lz-pink),#ff9ec9);box-shadow:0 0 10px rgba(255,102,171,.7)}
/* tabs: lazer's underlined ones */
.tabs.classic{height:auto;gap:4px;margin:0;padding:0 22px;border-bottom:1px solid rgba(255,255,255,.08);overflow-x:auto}
.tabs.classic .tab,.tabs.classic .tab.special,.tabs.classic .tab.read{margin:0 !important;padding:10px 14px 8px;border-radius:0;box-shadow:none;background:none;border-bottom:3px solid transparent;color:var(--lz-dim);font-size:14px;font-weight:600;line-height:1.2;text-transform:lowercase}
.tabs.classic .tab:hover{filter:none;color:#fff}
.tabs.classic .tab.is-active{background:none;color:#fff;border-bottom-color:var(--lz-pink)}
/* the people: lazer's user cards */
.community-grid{grid-template-columns:repeat(auto-fill,minmax(300px,1fr));grid-auto-rows:92px;gap:10px;padding:16px 28px}
.player-card{--lz-st:#a8a8a8;gap:12px;padding:8px 12px 8px 8px;border:0;border-radius:var(--lz-r);overflow:hidden;
 box-shadow:inset 4px 0 var(--lz-st),0 4px 14px rgba(0,0,0,.35);transition:transform .15s,box-shadow .15s}
.player-card::before{background:linear-gradient(90deg,color-mix(in srgb,var(--lz-st) 18%,hsl(333 10% 17%)),hsl(333 10% 15%) 65%)}
.player-card:hover{transform:translateY(-2px);box-shadow:inset 4px 0 var(--lz-st),0 8px 20px rgba(0,0,0,.45)}
.player-card:hover::after{opacity:.06}
.player-card[data-status="playing"]{--lz-st:#b3d944}
.player-card[data-status="idle"]{--lz-st:#66ccff}
.player-card[data-status="afk"]{--lz-st:#ffcc22}
.player-card__avatar{border-radius:8px;box-shadow:none}
.player-card__body{justify-content:center;gap:4px;padding-right:64px;min-width:0}
.player-card__name{font-size:17px;line-height:1.25;font-weight:600;text-shadow:none}
/* the two lines under the name (the game stacks two sets, swapped on hover): room for both lines */
.player-card__meta{flex:none;height:36px}
.player-card-side{gap:2px;width:100%}
.player-card__sub{font-size:13px;line-height:17px;color:var(--lz-dim);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.player-card__rank{bottom:4px;right:10px;font-size:34px;line-height:1;font-weight:700;opacity:.12}
.player-card__rank.is-tiered{opacity:.5}
.player-card__rank.is-first{opacity:.9}
.community-map{border:0;border-radius:var(--lz-r);background:hsl(333 10% 13%)}
.community-map__svg path{fill:hsl(333 10% 22%);stroke-opacity:.25}
.community-map__dot{width:8px;height:8px;border-radius:50%;box-shadow:0 0 8px var(--lz-pink)}
.community-empty{font-size:15px}
.community-chat-container{background:hsl(333 10% 9% / .97);border-top:1px solid rgba(255,255,255,.06)}
/* chat: lazer's channel tabs (the close cross sits after the name, not on it) */
.chat__tabs{align-items:center;background:hsl(333 10% 13%)}
.chat__tabs .tabs.classic{border-bottom:0;padding:0 6px 0 14px}
.chat__tabs .tab>span{display:inline-flex;align-items:center;gap:7px}
.chat__close{position:static;display:block !important;flex:none;width:14px;height:14px;transform:none;color:#fff;opacity:0;transition:opacity .15s,color .15s}
.chat__tabs .tab:hover .chat__close{opacity:.6}
.chat__tabs .chat__close:hover{opacity:1;color:var(--lz-red)}
.chat__close::before{width:14px;height:14px;border-radius:0;box-shadow:none;
 background:linear-gradient(45deg,transparent 42%,currentColor 42% 58%,transparent 58%),linear-gradient(-45deg,transparent 42%,currentColor 42% 58%,transparent 58%)}
.chat__add{align-self:center;justify-content:center;width:26px;height:26px;margin:0 8px 0 2px;padding:0;border-radius:50%;background:var(--lz-bg3);box-shadow:none;transition:background .15s}
.chat__add:hover{filter:none;background:var(--lz-pink)}
.tabs:empty+.chat__add{margin-left:14px;padding:0;border-radius:50%}
.chat__add::before{--glyph:#fff;--disc:transparent;width:16px;height:16px;box-shadow:none}
.chat__log{padding:4px 10px;gap:0}
.chat__line{font-size:16px;line-height:1.5;padding:1px 6px;border-radius:6px}
.chat__line:hover{background:rgba(255,255,255,.04)}
.chat__name{font-weight:700}
.chat__link{padding:0;background:none;color:#66ccff;text-decoration:underline;text-decoration-color:rgba(102,204,255,.4);text-underline-offset:2px}
.chat__link:hover{background:none;color:#99ddff}
.chat__compose{gap:6px;background:hsl(333 10% 13%)}
.chat__compose span{font-size:18px;color:var(--lz-pink)}
.chat__compose input{font-size:16px}
/* the corner buttons and the activity line */
.community-controls{gap:6px;bottom:6px;right:10px}
.community-controls__btn{padding:5px 12px;border:0;border-radius:8px;background:var(--lz-panel);font-size:12px;font-weight:600;opacity:.8;box-shadow:0 3px 10px rgba(0,0,0,.35)}
.community-controls__btn[data-on="true"]{opacity:1;box-shadow:inset 0 -2px var(--lz-pink),0 3px 10px rgba(0,0,0,.35)}
.community-controls__btn[data-unread="true"]{opacity:1;background:var(--lz-pink)}
.community-ticker{background:linear-gradient(90deg,rgba(20,17,20,.85),rgba(20,17,20,.5));font-size:12px}

/* ---------- mods: lazer's mod select (columns by kind, slanted mod panels) ---------- */
.mod-select{align-items:flex-end;justify-content:center;padding:60px 20px 90px;background:linear-gradient(transparent,rgba(0,0,0,.55) 30%,rgba(0,0,0,.8));overflow-y:auto}
.mod-select__panel{display:grid;grid-template-columns:repeat(2,minmax(260px,360px));justify-content:center;column-gap:18px;row-gap:14px;width:auto;margin:0}
.mod-select__intro{grid-column:1/-1;max-width:740px;font-size:14px;line-height:1.45;color:var(--lz-dim)}
.mod-select__multiplier{grid-column:1/-1;justify-self:end;padding:8px 16px;border-radius:var(--lz-r);background:var(--lz-panel);font-size:15px;font-weight:600;text-align:right}
.mod-select__xp{justify-content:flex-end;gap:0 12px;font-size:15px;color:#fff}
.mod-select__xp-skill,.mod-select__unranked{font-size:13px;color:var(--lz-yellow)}
.mod-select__row{display:flex;flex-direction:column;align-self:start;min-height:0;padding:0 0 14px;border-radius:14px;background:hsl(333 10% 13% / .97);box-shadow:0 10px 30px rgba(0,0,0,.45);overflow:hidden}
.mod-select__heading{align-self:stretch;width:auto;text-align:left;padding:12px 18px;margin-bottom:12px;font-size:16px;font-weight:600;white-space:nowrap;color:#16141a !important;background:#b2ff66}
.mod-select__heading.is-increase{background:#ff6666}
.mod-select__mods{flex-direction:column;align-items:stretch;gap:8px;padding:0 16px 0 22px}
.mod-select__mod{align-items:stretch}
.mod-tile{flex-direction:row;justify-content:flex-start;gap:12px;width:100%;height:46px;padding:0 16px 0 20px;border-radius:8px;opacity:1;background:hsl(333 10% 21%);
 box-shadow:inset 6px 0 var(--tint);transform:skewX(-10deg);transition:background .15s,box-shadow .15s,filter .15s}
.mod-tile>*{transform:skewX(10deg)}
.mod-tile:hover:not(:disabled){opacity:1;filter:brightness(1.18)}
.mod-tile.is-on{transform:skewX(-10deg);background:var(--tint);box-shadow:0 0 16px color-mix(in srgb,var(--tint) 55%,transparent)}
.mod-tile:disabled{opacity:.35}
.mod-tile__glyph{width:24px;height:24px}
.mod-tile__label{font-size:15px;font-weight:600}
.mod-tile__short{position:static;margin-left:auto;font-size:12px;font-weight:700;opacity:.85}
.rate-stepper{position:static;align-self:center;margin-top:6px;border-radius:999px;background:hsl(333 10% 21%);overflow:hidden}
.rate-stepper__value{font-size:13px}
.rate-stepper__arrow{font-size:18px}
.mod-select__panel>.ctxmenu__options{grid-column:1/-1;display:flex;justify-content:center;gap:10px;margin-top:6px}
.mod-select__panel>.ctxmenu__options .ctxmenu__option{width:auto;min-width:160px;padding:10px 22px;border:0;border-radius:var(--lz-r);background:var(--lz-panel);box-shadow:inset 0 -3px var(--accent),0 4px 14px rgba(0,0,0,.35);font-size:15px;font-weight:600;text-transform:lowercase}

/* ---------- beatmap options and the game's other pop-up choices: lazer's dialog ---------- */
.ctxmenu{align-items:center;justify-content:center;background:rgba(0,0,0,.6);backdrop-filter:blur(6px)}
.ctxmenu>.ctxmenu__header{position:static;width:min(560px,92vw);padding:24px 30px 6px;text-align:center;font-size:22px;font-weight:600;background:hsl(333 10% 13% / .98);border-radius:16px 16px 0 0;box-shadow:0 -6px 30px rgba(0,0,0,.25)}
.ctxmenu>.ctxmenu__header .ctxmenu__title{font-size:22px;font-weight:600}
.ctxmenu>.ctxmenu__header .ctxmenu__sub{margin-top:6px;font-size:14px;font-weight:400;color:var(--lz-dim)}
.ctxmenu>.ctxmenu__options{width:min(560px,92vw);margin-top:0;padding:18px 30px 26px;gap:10px;background:hsl(333 10% 13% / .98);border-radius:0 0 16px 16px;box-shadow:0 14px 40px rgba(0,0,0,.5);pointer-events:auto}
.ctxmenu>.ctxmenu__options:first-child{border-radius:16px}
.ctxmenu>.ctxmenu__options .ctxmenu__option{width:100%;padding:13px 0;font-size:16px;font-weight:600;letter-spacing:.01em;text-shadow:none;box-shadow:none;background:var(--accent);
 clip-path:polygon(14px 0,100% 0,calc(100% - 14px) 100%,0 100%);transition:filter .12s,transform .12s}
.ctxmenu>.ctxmenu__options .ctxmenu__option:hover{filter:brightness(1.15);transform:scaleX(1.02)}
.ctxmenu.lz-pop{position:fixed!important;inset:auto!important;left:var(--lz-px,0)!important;top:var(--lz-py,0)!important;width:min(280px,92vw);height:auto!important;display:flex;flex-direction:column;align-items:stretch;justify-content:flex-start;background:hsl(333 10% 13% / .98);-webkit-backdrop-filter:none;backdrop-filter:none;border-radius:14px;overflow:hidden;box-shadow:0 12px 36px rgba(0,0,0,.6),0 0 0 1px rgba(255,255,255,.07)}
.ctxmenu.lz-pop>.ctxmenu__header{width:auto;padding:14px 18px 4px;text-align:left;font-size:15px;background:none;border-radius:0;box-shadow:none}
.ctxmenu.lz-pop>.ctxmenu__header .ctxmenu__title{font-size:15px}
.ctxmenu.lz-pop>.ctxmenu__header .ctxmenu__sub{margin-top:3px;font-size:12px}
.ctxmenu.lz-pop>.ctxmenu__options{width:auto;padding:8px 14px 14px;gap:6px;background:none;border-radius:0;box-shadow:none}
.ctxmenu.lz-pop>.ctxmenu__options .ctxmenu__option{padding:9px 0;font-size:14px}
.ctxmenu__input{width:min(500px,86vw);padding:10px 16px;border:0;border-radius:var(--lz-r);background:hsl(333 10% 8%);font-size:16px}

/* ---------- options: lazer's settings overlay ---------- */
.options__container{background:rgba(0,0,0,.45)}
.options__quick_access{flex-basis:88px;padding-top:20px;background:var(--lz-bg1)}
.options__tab{overflow:hidden;text-overflow:ellipsis;font-size:10.5px;font-weight:600;line-height:1.4;padding:14px 4px;color:var(--lz-dim);border-right:0;border-left:4px solid transparent;text-transform:lowercase}
.options__tab.is-active{color:#fff;border-left-color:var(--lz-pink);background:rgba(255,255,255,.05)}
.options__panel{flex-basis:min(72vw,440px);font-weight:400;background:var(--lz-bg2);box-shadow:8px 0 30px rgba(0,0,0,.4)}
.options__heading{margin-top:20px;padding:20px 24px 0;text-align:left;font-size:28px;font-weight:600;text-transform:lowercase}
.options__subheading{padding:2px 24px 10px;text-align:left;font-size:14px;color:var(--lz-pink)}
.options__search{margin:6px 20px 14px;padding:10px 16px;border:0;border-radius:999px;background:var(--lz-bg1)}
.options__search_input{font-size:14px}
.options__category_title{margin:22px 10px 2px;text-align:left;font-size:26px;font-weight:600;color:#fff;text-transform:lowercase}
.options__group{margin:8px 0 14px;border-left:0;gap:2px}
.options__group_title{margin:8px 10px 4px;font-size:15px;font-weight:700;text-transform:none;letter-spacing:0;color:#fff}
.opt-row__label,.opt-slider__head{font-size:14px;font-weight:400}
.opt-row__hint{font-size:12px}
.opt-checkbox{justify-content:space-between;font-size:14px;font-weight:400}
.opt-checkbox__label{order:0;flex:1}
.opt-checkbox__box{order:1;display:flex;align-items:center;justify-content:flex-start;width:38px;height:20px;padding:0 2px;border-radius:999px;border:2px solid var(--lz-pink);background:transparent}
.opt-checkbox__tick{width:12px;height:12px;border-radius:50%;background:var(--lz-pink);transform:none;transition:transform .15s,background .15s}
.opt-checkbox.is-on .opt-checkbox__box{background:var(--lz-pink)}
.opt-checkbox.is-on .opt-checkbox__tick{background:#fff;transform:translateX(18px)}
.opt-slider__value{font-size:13px;color:var(--lz-yellow)}
.opt-slider__input{height:4px;background:linear-gradient(to right,var(--lz-pink) var(--fill,0%),rgba(255,102,171,.25) var(--fill,0%))}
.opt-slider__input::-webkit-slider-thumb{width:28px;height:14px;border-radius:7px;background:var(--lz-bg2);border:3px solid var(--lz-pink);box-shadow:none}
.opt-button{--accent:var(--lz-pink);border-radius:var(--lz-r);font-size:14px;font-weight:600;padding:9px 14px}

/* ---------- playing ---------- */
.play__abort,.play__quit{padding:7px 16px;border:0;border-radius:var(--lz-r);background:var(--lz-panel);font-size:14px;font-weight:600;text-transform:lowercase;box-shadow:inset 3px 0 var(--lz-red)}
.play__quit{box-shadow:inset 3px 0 var(--lz-pink)}
.play__abort:hover,.play__quit:hover{filter:brightness(1.25)}
.play__title{font-size:15px;font-weight:600}
.play__grade{right:196px;top:12px;height:46px}
.play__title span{color:var(--lz-yellow)}
.play__skip{border:0;border-radius:var(--lz-r);background:var(--lz-panel);font-weight:600;text-transform:lowercase;box-shadow:inset 0 -3px var(--lz-yellow)}

/* ---------- results: a score card and lazer's accuracy ring ---------- */
.resultscreen{background:linear-gradient(rgba(10,9,12,.55),rgba(10,9,12,.85));backdrop-filter:blur(8px)}
.result__meta{padding:16px 28px;background:var(--lz-panel);box-shadow:0 4px 20px rgba(0,0,0,.35)}
.result__title{font-size:26px;font-weight:600}
.result__version{color:var(--lz-yellow);font-weight:600}
.result__creator,.result__played{font-size:13px;font-weight:400}
.result__panel{padding:22px 26px;border-radius:16px;background:var(--lz-panel);box-shadow:0 10px 40px rgba(0,0,0,.45)}
.result__score{margin:0 0 16px;font-size:64px;font-weight:300;letter-spacing:.06em;text-align:center;text-shadow:none}
.result__judges{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.result__judge{width:auto;flex-direction:column;align-items:center;justify-content:center;gap:2px;padding:10px 6px;border:0;border-radius:var(--lz-r);background:var(--lz-panel2)}
.result__judge-label{font-size:12px;font-weight:700;letter-spacing:.08em;text-shadow:none !important}
.result__judge-count{font-size:28px;font-weight:500;text-shadow:none !important}
.result__totals{gap:8px;margin-top:8px}
.result__total{flex:1;align-items:center;padding:10px;border-radius:var(--lz-r);background:var(--lz-panel2)}
.result__total-label{font-size:11px;font-weight:600;letter-spacing:.12em}
.result__total-value{font-size:28px;font-weight:500}
.result__pfc{color:var(--lz-yellow)}
.result__failed{color:var(--lz-red);font-weight:700;text-shadow:none}
.result__graph{border:0;border-radius:var(--lz-r);background:var(--lz-panel)}
.result__actions{gap:10px;bottom:18px}
.result__exit{padding:12px 30px;border-radius:var(--lz-r);background:var(--lz-panel);font-size:18px;font-weight:600;text-transform:lowercase}
.result__exit:first-child{margin-left:-12px;padding-left:44px;border-radius:0 var(--lz-r) var(--lz-r) 0;background:var(--lz-pink);transform:skewX(-12deg)}
.result__exit:first-child:hover{transform:skewX(-12deg);filter:brightness(1.1)}
.result__grade-box{align-items:center;width:min(56vh,30vw);aspect-ratio:1}
.result__grade-box .result__grade{width:46%;max-height:none;filter:drop-shadow(0 8px 24px rgba(0,0,0,.5))}
.lz-ring{position:absolute;inset:0;width:100%;height:100%;transform:rotate(-90deg);overflow:visible;pointer-events:none}
.lz-ring__fill{transition:stroke-dasharray 1.2s cubic-bezier(.2,.8,.2,1)}
.lz-ring__acc{position:absolute;left:0;right:0;bottom:14%;text-align:center;font-size:clamp(14px,2.2vh,22px);font-weight:600;color:#fff;text-shadow:0 2px 8px rgba(0,0,0,.5)}
`;

// ---------- the results screen's accuracy ring ----------
const SVG = 'http://www.w3.org/2000/svg';
const svgEl = (name, attrs) => {
	const e = document.createElementNS(SVG, name);
	for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
	return e;
};
const arc = (r, width, from, to, color, cls) => svgEl('circle', {
	cx: 100, cy: 100, r, fill: 'none', stroke: color, 'stroke-width': width, pathLength: 100,
	'stroke-dasharray': `${Math.max(0, to - from)} 100`, 'stroke-dashoffset': -from, ...(cls ? { class: cls } : {}),
});

/** The accuracy shown on the results screen, in percent; null if not found. */
const readAccuracy = (screen) => {
	for (const t of screen.querySelectorAll('.result__total')) {
		const label = t.querySelector('.result__total-label');
		if (label && /acc/i.test(label.textContent)) {
			const v = parseFloat((t.querySelector('.result__total-value') || {}).textContent || '');
			if (Number.isFinite(v)) return v;
		}
	}
	return null;
};

const addRing = (screen) => {
	const box = screen.querySelector('.result__grade-box');
	const acc = readAccuracy(screen);
	if (!box || acc === null) return;
	const old = box.querySelector('.lz-ring');
	if (old && old.dataset.acc === String(acc)) return;
	old?.remove();
	box.querySelector('.lz-ring__acc')?.remove();
	const ring = svgEl('svg', { class: 'lz-ring', viewBox: '0 0 200 200' });
	ring.dataset.acc = String(acc);
	// the rank bands inside, with small gaps between them
	for (const r of RANKS) ring.append(arc(80, 6, r.from + 0.3, r.to - 0.3, r.color));
	// the accuracy around them, filling up
	ring.append(arc(93, 11, 0, 100, 'rgba(255,255,255,.1)'));
	const fill = arc(93, 11, 0, 0, '#fff', 'lz-ring__fill');
	ring.append(fill);
	box.prepend(ring);
	const label = document.createElement('div');
	label.className = 'lz-ring__acc';
	label.textContent = `${acc.toFixed(2)}%`;
	box.append(label);
	requestAnimationFrame(() => requestAnimationFrame(() => {
		fill.setAttribute('stroke-dasharray', `${Math.min(100, Math.max(0, acc))} 100`);
	}));
};

// ---------- the in-game HUD (drawn on the playfield canvas) ----------
const proto = CanvasRenderingContext2D.prototype;
const HUD_CANVASES = ['play__canvas', 'versus__canvas'];
let prevFillText = null, ourFillText = null, active = false;
const fontReady = () => {
	try { return document.fonts.check(`16px "${FONT}"`); } catch { return false; }
};
const hudFillText = function (text, x, y, ...rest) {
	const cv = this.canvas;
	const font = this.font;
	if (!active || !cv || !cv.classList || !HUD_CANVASES.some(c => cv.classList.contains(c)) || !font.includes('Exo 2') || !fontReady()) {
		return prevFillText.call(this, text, x, y, ...rest);
	}
	let f = font.replace(/"?Exo 2"?/, `"${FONT}"`);
	const s = String(text);
	if (this.textAlign === 'right' && /^(bold|700) 30px/.test(font) && /%$/.test(s)) {
		// accuracy: smaller, under the score
		f = `500 20px "${FONT}", sans-serif`;
		y += 30;
	} else if (this.textAlign === 'right' && /^500 18px/.test(font) && /^[\d,]+$/.test(s)) {
		// score: big, with leading zeros, on top
		f = `300 38px "${FONT}", sans-serif`;
		y -= 26;
		text = s.replace(/,/g, '').padStart(7, '0');
	}
	this.font = f;
	try { return prevFillText.call(this, text, x, y, ...rest); } finally { this.font = font; }
};


// ---------- song select: lazer's search box and star rating filter ----------
// The game's own search understands "stars>=4 stars<=6", so the star range is
// added to what's typed there; the box shown is a lazer-style one in its place.
const STARS_KEY = 'oss-lazer-ui-stars';
const STAR_MAX = 10; // the far end means "no limit"
let stars = { min: 0, max: STAR_MAX };
try { Object.assign(stars, JSON.parse(localStorage.getItem(STARS_KEY) || '{}')); } catch {}
const STAR_TOKEN = /\s*\bstars?[<>]=?\d+(\.\d+)?/gi;
let filter = null; // { root, input, count, lo, hi, dim, vLo, vHi }

const realInput = () => document.querySelector('.songsearch__input');
const setReal = (value) => {
	const inp = realInput();
	if (!inp || inp.value === value) return;
	Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(inp, value);
	inp.dispatchEvent(new Event('input', { bubbles: true }));
};
const starQuery = () => [
	stars.min > 0 ? `stars>=${stars.min.toFixed(1)}` : '',
	stars.max < STAR_MAX ? `stars<=${stars.max.toFixed(1)}` : '',
].filter(Boolean).join(' ');
let setOnly = null; // { id, query, title }: only the selected map's set
const setQuery = () => (setOnly ? setOnly.query : '');
const typedPart = (value) => {
	let v = value.replace(STAR_TOKEN, ' ');
	if (setOnly) v = v.split(setOnly.query).join(' ');
	return v.replace(/\s+/g, ' ').trim();
};
const applySearch = () => {
	if (!filter) return;
	setReal([filter.input.value.trim(), starQuery(), setQuery()].filter(Boolean).join(' '));
};
const showStars = () => {
	if (!filter) return;
	const pct = v => (v / STAR_MAX) * 100;
	filter.range.style.setProperty('--a', `${pct(stars.min)}%`);
	filter.range.style.setProperty('--b', `${pct(stars.max)}%`);
	filter.vLo.style.setProperty('--p', String(pct(stars.min)));
	filter.vHi.style.setProperty('--p', String(pct(stars.max)));
	filter.vLo.textContent = stars.min.toFixed(1);
	filter.vHi.textContent = stars.max >= STAR_MAX ? '∞' : stars.max.toFixed(1);
};
const buildFilter = () => {
	const root = document.createElement('div');
	root.className = 'lz-filter';
	root.hidden = true;
	const search = document.createElement('div');
	search.className = 'lz-search';
	const main = document.createElement('div');
	main.className = 'lz-search__main';
	const input = document.createElement('input');
	input.className = 'lz-search__input';
	input.placeholder = 'search...';
	input.spellcheck = false;
	const count = document.createElement('div');
	count.className = 'lz-search__count';
	main.append(input, count);
	const go = document.createElement('button');
	go.className = 'lz-search__go';
	go.type = 'button';
	go.title = 'Search';
	const icon = svgEl('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 2.6, 'stroke-linecap': 'round' });
	icon.append(svgEl('circle', { cx: 10.5, cy: 10.5, r: 6.5 }), svgEl('line', { x1: 15.5, y1: 15.5, x2: 21, y2: 21 }));
	go.append(icon);
	go.addEventListener('click', () => input.focus());
	search.append(main, go);

	const row = document.createElement('div');
	row.className = 'lz-stars';
	const chip = document.createElement('div');
	chip.className = 'lz-chip';
	chip.textContent = 'Star Rating';
	const range = document.createElement('div');
	range.className = 'lz-range';
	const dim = document.createElement('div');
	dim.className = 'lz-range__dim';
	const slider = () => {
		const r = document.createElement('input');
		r.type = 'range'; r.min = '0'; r.max = String(STAR_MAX); r.step = '0.1';
		return r;
	};
	const lo = slider(), hi = slider();
	lo.value = String(stars.min); hi.value = String(stars.max);
	const val = () => { const v = document.createElement('div'); v.className = 'lz-range__val'; return v; };
	const vLo = val(), vHi = val();
	range.append(dim, lo, hi, vLo, vHi);
	// one button: only the selected map's set (its difficulties), and back
	const setBtn = document.createElement('button');
	setBtn.type = 'button';
	setBtn.className = 'lz-setbtn';
	setBtn.addEventListener('click', () => {
		if (setOnly) { setOnly = null; applySearch(); showSet(); return; }
		const set = selectedSet();
		if (!set) return;
		// the game's search matches words: the set's title, artist and mapper, each as a filter
		const words = (key, text) => String(text || '').toLowerCase().split(/\s+/).filter(w => w && !/[=<>:]/.test(w)).map(w => `${key}=${w}`);
		const query = [...words('title', set.title), ...words('artist', set.artist), ...words('creator', set.creator)].join(' ');
		if (!query) return;
		setOnly = { id: set.id, query, title: set.title };
		applySearch();
		showSet();
	});
	row.append(chip, range, setBtn);
	root.append(search, row);

	const onRange = (which) => () => {
		let a = Number(lo.value), b = Number(hi.value);
		if (a > b) { if (which === 'lo') b = a; else a = b; lo.value = String(a); hi.value = String(b); }
		stars = { min: a, max: b };
		try { localStorage.setItem(STARS_KEY, JSON.stringify(stars)); } catch {}
		showStars();
		applySearch();
	};
	lo.addEventListener('input', onRange('lo'));
	hi.addEventListener('input', onRange('hi'));
	input.addEventListener('input', applySearch);
	// typing here is for the search; the keys that move around or play go on to the game
	input.addEventListener('keydown', (e) => {
		if (!['Enter', 'Escape', 'ArrowUp', 'ArrowDown', 'Tab'].includes(e.key) && !/^F\d+$/.test(e.key)) e.stopPropagation();
		if (e.key === 'Escape' && input.value) { e.stopPropagation(); input.value = ''; applySearch(); }
	});
	document.body.append(root);
	filter = { root, input, count, range, lo, hi, vLo, vHi, setBtn };
	showSet();
	showStars();
};
const showSet = () => {
	if (!filter) return;
	filter.setBtn.classList.toggle('is-on', !!setOnly);
	filter.setBtn.textContent = setOnly ? `✕ ${setOnly.title}` : 'This set only';
	filter.setBtn.title = setOnly ? 'Show every map again' : 'Show only the difficulties of the selected map\'s set';
};
// the selected map's set, from the song list
const fiberOf = (node) => { const k = node && Object.keys(node).find(x => x.startsWith('__reactFiber$')); return k ? node[k] : null; };
// (read fresh each time: the list reuses its cards for other maps as it scrolls)
const setOfCard = (card) => {
	for (let f = fiberOf(card), d = 0; f && d < 10; d++, f = f.return) {
		const b = f.memoizedProps && f.memoizedProps.beatmap;
		if (b && b.set && b.set.metadata) return b.set.metadata;
	}
	return null;
};
// the selected map: its card when it's in the list (the list only builds the cards near view),
// else the game's own "selected map" (the leaderboard beside the list follows it), else the last seen
let lastSet = null;
const selectedSet = () => {
	const fromCard = setOfCard(document.querySelector('.bm-card.is-active'));
	if (fromCard) return (lastSet = fromCard);
	for (const st of storesNear('.lb', 8)) {
		let v;
		try { v = st.get(); } catch { continue; }
		if (v && v.set && v.set.metadata && v.metadata) return (lastSet = v.set.metadata);
	}
	return lastSet;
};
// mark the other difficulties of the selected map's set
let markTimer;
const markSet = () => {
	const set = selectedSet();
	for (const card of document.querySelectorAll('.bm-card')) {
		const s = set && !card.classList.contains('is-active') ? setOfCard(card) : null;
		card.classList.toggle('lz-sameset', !!(s && s.id === set.id));
	}
};
const syncFilter = () => {
	if (!filter) return;
	const real = realInput();
	const covered = document.querySelector('.resultscreen, .options__container.open, .page-overlay.is-open');
	const show = !!real && !covered;
	if (filter.root.hidden === show) filter.root.hidden = !show;
	if (!real) return;
	// the game's box changed by itself (cleared, or typed into): follow it
	const typed = typedPart(real.value);
	if (document.activeElement !== filter.input && typed !== filter.input.value.trim()) filter.input.value = typed;
	if (document.activeElement === real) filter.input.focus();
	// the star range belongs in the game's search whenever the song list is up
	if ((starQuery() && !real.value.includes(starQuery())) || (setOnly && !real.value.includes(setOnly.query))) applySearch();
	const n = (document.querySelector('.songsearch__count') || {}).textContent || '';
	const m = n.match(/^([\d,]+)(?: of [\d,]+)? results?/);
	const text = m ? `${m[1]} matches` : n;
	if (filter.count.textContent !== text) filter.count.textContent = text;
};


// ---------- lazer's toolbar: shortcuts along the top ----------
// The game keeps "open" switches for its options and its in-game web panel; the
// toolbar finds them through the game's own components (like the skin importer
// finds the skin in use) and flips them, so everything opens the game's way.
const storesNear = (selector, depth = 5) => {
	const el = document.querySelector(selector);
	if (!el) return [];
	const key = Object.keys(el).find(k => k.startsWith('__reactFiber$'));
	const out = [];
	let f = key ? el[key] : null;
	for (let d = 0; f && d < depth; d++, f = f.return) {
		for (let h = f.memoizedState, n = 0; h && n < 120; h = h.next, n++) {
			const deps = h.memoizedState && h.memoizedState.deps;
			if (!Array.isArray(deps)) continue;
			for (const x of deps) if (x && typeof x.get === 'function' && typeof x.set === 'function' && !out.includes(x)) out.push(x);
		}
	}
	return out;
};
const storeOf = (selector, type) => storesNear(selector).find(x => { try { return typeof x.get() === type; } catch { return false; } });
/** Opens a page of the game's website in its in-game web panel (rankings, news, ...). */
const openWeb = async (route) => {
	const open = storeOf('.web', 'boolean'), where = storeOf('.web', 'string');
	if (!open || !where) return false;
	await where.set(route);
	await open.set(true);
	return true;
};
const toggleOptions = async () => {
	const s = storeOf('.options__container', 'boolean');
	if (s) await s.set(!s.get());
};
const clickText = (selector, re) => {
	const b = [...document.querySelectorAll(selector)].find(e => re.test(e.textContent || ''));
	if (b) b.click();
	return !!b;
};
const ICONS = { // simple line icons, 24x24
	gear: 'M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z M19.4 13a7.6 7.6 0 0 0 0-2l2-1.6-2-3.4-2.4 1a7.4 7.4 0 0 0-1.7-1L15 3.5h-4l-.4 2.5a7.4 7.4 0 0 0-1.7 1l-2.4-1-2 3.4L6.6 11a7.6 7.6 0 0 0 0 2l-2 1.6 2 3.4 2.4-1a7.4 7.4 0 0 0 1.7 1l.4 2.5h4l.4-2.5a7.4 7.4 0 0 0 1.7-1l2.4 1 2-3.4Z',
	home: 'M3 11 12 4l9 7 M5 9.5V20h5v-6h4v6h5V9.5',
	news: 'M4 5h13v14H6a2 2 0 0 1-2-2Z M17 9h3v8a2 2 0 0 1-2 2 M7 9h7 M7 13h7 M7 16h4',
	changelog: 'M8 6h12 M8 12h12 M8 18h12 M4 6h.01 M4 12h.01 M4 18h.01',
	rankings: 'M4 20V13h5v7 M9 20V8h6v12 M15 20v-9h5v9 M3 20h18',
	beatmaps: 'M9 18V6l11-2v12 M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z M20 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
	medals: 'M8 3h8l-2 6h-4Z M12 21a6 6 0 1 0 0-12 6 6 0 0 0 0 12Z M12 13l1 2h2l-1.5 1.3.5 2-2-1.2-2 1.2.5-2L9 15h2Z',
	chat: 'M4 5h16v11H9l-5 4Z',
	users: 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z M2 21a7 7 0 0 1 14 0 M16 3.5a4 4 0 0 1 0 7.5 M18 14a6 6 0 0 1 4 6',
	skins: 'M12 3a9 9 0 1 0 0 18c1 0 1.5-.8 1.5-1.5 0-1.5 1-2 2-2H18a3 3 0 0 0 3-3A9 9 0 0 0 12 3Z M7.5 11h.01 M10 7.5h.01 M14 7.5h.01 M16.5 11h.01',
	addons: 'M10 4h4v3a2 2 0 1 0 0 0h3v4h-2a2 2 0 1 0 0 4h2v5H4v-5h2a2 2 0 1 0 0-4H4V7h6Z',
};
const icon = (name) => {
	const svg = svgEl('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 1.9, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
	svg.append(svgEl('path', { d: ICONS[name] }));
	return svg;
};
let toolbar = null; // { root, time, run, timer, chat, users }
let startedAt = Date.now();
const buildToolbar = () => {
	const root = document.createElement('div');
	root.className = 'lz-toolbar';
	const btn = (name, tip, onClick) => {
		const b = document.createElement('button');
		b.type = 'button';
		b.className = 'lz-tb__btn';
		b.dataset.tip = tip;
		b.append(icon(name));
		b.addEventListener('click', (e) => { e.stopPropagation(); onClick(); });
		return b;
	};
	const sep = () => { const d = document.createElement('div'); d.className = 'lz-tb__sep'; return d; };
	const grow = document.createElement('div');
	grow.className = 'lz-tb__grow';
	const chat = btn('chat', 'chat', () => clickText('.community-controls__btn', /chat/i));
	const users = btn('users', 'online users', () => clickText('.community-controls__btn', /online|users/i));
	root.append(
		btn('gear', 'options', toggleOptions),
		btn('home', 'main menu', () => clickText('.game__exit, .result__exit', /back/i)),
		sep(),
		btn('news', 'news', () => openWeb('news')),
		btn('changelog', 'changelog', () => openWeb('changelog')),
		btn('rankings', 'rankings', () => openWeb('rankings/global')),
		btn('beatmaps', 'beatmap listing', () => {
			const direct = document.querySelector('.direct-tab'); // the game's own (oss!direct), on the main menu
			if (direct) direct.click(); else openWeb('maps');
		}),
		// the game's own skin and add-on managers (the same as their buttons in options)
		btn('skins', 'skins', () => clickText('.opt-button', /manage skins/i)),
		btn('addons', 'add-ons', () => clickText('.opt-button', /manage add-ons/i)),
		chat, users,
		grow,
	);
	// the profile, copied from the game's card (on song select); clicking it is clicking that
	const user = document.createElement('button');
	user.type = 'button';
	user.className = 'lz-tb__user';
	user.hidden = true;
	const face = document.createElement('img');
	face.alt = '';
	const who = document.createElement('div');
	who.className = 'lz-tb__who';
	const name = document.createElement('div');
	name.className = 'lz-tb__name';
	const sub = document.createElement('div');
	sub.className = 'lz-tb__sub';
	who.append(name, sub);
	const rank = document.createElement('div');
	rank.className = 'lz-tb__rank';
	user.append(face, who, rank);
	user.addEventListener('click', (e) => {
		e.stopPropagation();
		const card = document.querySelector('.game__user');
		if (card) card.click(); else openWeb('');
	});
	root.append(user);
	const clock = document.createElement('div');
	clock.className = 'lz-tb__clock';
	const time = document.createElement('div');
	time.className = 'lz-tb__time';
	const run = document.createElement('div');
	run.className = 'lz-tb__run';
	clock.append(time, run);
	root.append(clock);
	document.body.append(root);
	startedAt = Date.now();
	const pad = (n) => String(n).padStart(2, '0');
	const tick = () => {
		const now = new Date();
		time.textContent = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
		const t = Math.floor((Date.now() - startedAt) / 1000);
		run.textContent = `running ${pad(Math.floor(t / 3600))}:${pad(Math.floor(t / 60) % 60)}:${pad(t % 60)}`;
	};
	tick();
	toolbar = { root, timer: setInterval(tick, 1000), chat, users, user, face, name, sub, rank };
	document.documentElement.classList.add('lz-has-toolbar');
};
const syncToolbar = () => {
	if (!toolbar) return;
	// out of the way while playing, like lazer
	const playing = !!document.querySelector('canvas.play__canvas') && !document.querySelector('.resultscreen');
	// and inside the game's own pages (skins, add-ons and the like), which have their own bars
	const page = !!document.querySelector('.page-overlay.is-open');
	const hide = playing || page;
	if (toolbar.root.hidden !== hide) {
		toolbar.root.hidden = hide;
		document.documentElement.classList.toggle('lz-has-toolbar', !hide);
	}
	// the profile copy follows the game's card while it's there, and keeps the last one after
	const card = document.querySelector('.game__user');
	if (card) {
		const img = card.querySelector('img');
		const n = (card.querySelector('.game__user-name') || {}).textContent || '';
		const p = (card.querySelector('.game__user-pp') || {}).textContent || '';
		if (img && img.src && toolbar.face.src !== img.src) toolbar.face.src = img.src;
		if (toolbar.name.textContent !== n) toolbar.name.textContent = n;
		if (toolbar.sub.textContent !== p) toolbar.sub.textContent = p;
		// the rank, with the game's tier colours (its classes and gradient)
		const r = card.querySelector('.game__user-rank');
		const rt = r ? r.textContent : '';
		if (toolbar.rank.textContent !== rt) toolbar.rank.textContent = rt;
		const cls = `lz-tb__rank${r && r.classList.contains('is-tiered') ? ' is-tiered' : ''}${r && r.classList.contains('is-first') ? ' is-first' : ''}`;
		if (toolbar.rank.className !== cls) toolbar.rank.className = cls;
		const bg = r && !r.classList.contains('is-first') ? r.style.backgroundImage : '';
		if (toolbar.rank.style.backgroundImage !== bg) toolbar.rank.style.backgroundImage = bg;
		if (toolbar.user.hidden) toolbar.user.hidden = false;
	}
	const chatOpen = document.documentElement.classList.contains('is-chat-open');
	toolbar.chat.classList.toggle('is-on', chatOpen);
};

// ---------- the leaderboard rows, found by what they show ----------
// The rows are found by their "Score: 992,180 (1752x)" line, whatever the game
// calls them, and marked so the slant above applies to them.
let rowClass = null, lastMark = 0;
const SCORE_LINE = /^Score:\s*[\d,.\s]+\(\s*[\d,]+\s*x\s*\)$/i;
const markRows = () => {
	const now = performance.now();
	if (now - lastMark < 400) return;
	lastMark = now;
	if (!document.querySelector('.game__body, .carousel')) return; // song select only
	// the line may be split into several pieces of text, so whole small elements are checked
	const lines = [];
	for (const el of document.querySelectorAll('body *')) {
		if (el.childElementCount > 2 || el.closest('.lz-toolbar, .lz-filter')) continue;
		const t = el.textContent;
		if (t.length < 60 && SCORE_LINE.test(t.trim().replace(/\s+/g, ' '))) lines.push(el);
	}
	if (!rowClass) {
		// the row: the line's nearest ancestor that has look-alike siblings
		for (const line of lines) {
			let e = line;
			for (let up = 0; e && up < 6; up++, e = e.parentElement) {
				const p = e.parentElement;
				if (p && e.className && [...p.children].filter(c => c.className === e.className).length >= 2) { rowClass = e.className; break; }
			}
			if (rowClass) break;
		}
	}
	if (!rowClass) return;
	const first = rowClass.split(/\s+/).filter(Boolean)[0];
	for (const line of lines) {
		let e = line;
		for (let up = 0; e && up < 6; up++, e = e.parentElement) {
			if (e.classList && e.classList.contains(first)) {
				if (!e.classList.contains('lz-lbrow')) e.classList.add('lz-lbrow');
				// gold for the top 10 of the leaderboard (not the personal best, which sits on its own)
				const rows = e.parentElement ? [...e.parentElement.children].filter(c => c.classList.contains(first)) : [];
				e.classList.toggle('lz-top10', rows.length > 1 && rows.indexOf(e) < 10);
				break;
			}
		}
	}
};

/** The lean: each row's step left follows where it is on screen, in its list's window. */
let leanFrame = 0;
const leanRows = () => {
	leanFrame = 0;
	for (const e of document.querySelectorAll('.lz-lbrow, .lb__list>li')) {
		const box = e.closest('.lb__body');
		let i = 0;
		if (box) {
			const top = box.getBoundingClientRect().top, y = e.getBoundingClientRect().top;
			i = Math.max(0, Math.min(10, (y - top) / 58));
		}
		const v = i.toFixed(2);
		if (e.style.getPropertyValue('--lz-i') !== v) e.style.setProperty('--lz-i', v);
	}
};
const onScroll = () => { if (!leanFrame) leanFrame = requestAnimationFrame(leanRows); };

// ---------- mounting ----------
let observer = null, headObserver = null;
const keepLast = () => {
	const style = document.getElementById(STYLE_ID);
	if (style && document.head.lastElementChild !== style) document.head.append(style);
};
// ---------- song select: back to the selected map when the cursor leaves the list ----------
// Like lazer: scroll through the maps freely, and once the cursor goes over to the left
// (the leaderboard side), the list glides back to the map that's selected.
const carouselReturn = (() => {
	let home = null;      // where the list sat with the selected map in the middle
	let away = false;     // the list was scrolled by you since
	let inLeft = false;
	let anim = 0, ours = false;
	const list = () => document.querySelector('.carousel');
	// note where the selected map is, while it's on screen (the list only keeps the cards near view)
	// where the list sits with the selected card in the middle (exact while the card is in the page)
	const targetOf = (sc, a) => {
		const ar = a.getBoundingClientRect(), sr = sc.getBoundingClientRect();
		return Math.max(0, Math.min(sc.scrollHeight - sc.clientHeight, sc.scrollTop + (ar.top - sr.top) - (sc.clientHeight - ar.height) / 2));
	};
	const note = () => {
		const sc = list(), a = sc && sc.querySelector('.bm-card.is-active');
		if (!a) return;
		const key = a.style.backgroundImage + '|' + a.textContent.slice(0, 80);
		const target = targetOf(sc, a);
		if (!home || home.key !== key) {
			const ar = a.getBoundingClientRect(), sr = sc.getBoundingClientRect();
			if (ar.bottom < sr.top || ar.top > sr.bottom) return; // a new selection: once it's been seen
			home = { key, top: target }; away = false; return;
		}
		home.top = target; // the list keeps cards a little way off screen too: kept exact
	};
	// glide there; the list only builds the cards near view, so where it lands is checked, and
	// put right (a couple of times at most) once the selected card is there
	const glide = (sc, to, tries = 3) => {
		cancelAnimationFrame(anim);
		const from = sc.scrollTop, t0 = performance.now(), ms = Math.min(700, 250 + Math.abs(to - from) / 20);
		const step = (now) => {
			const t = Math.min(1, (now - t0) / ms);
			const e = 1 - Math.pow(1 - t, 3); // ease out
			ours = true;
			sc.scrollTop = from + (to - from) * e;
			if (t < 1) { anim = requestAnimationFrame(step); return; }
			anim = requestAnimationFrame(() => requestAnimationFrame(() => {
				const a = sc.querySelector('.bm-card.is-active');
				const fix = a ? targetOf(sc, a) : null;
				if (tries > 0 && fix !== null && Math.abs(fix - sc.scrollTop) > 4) { if (home) home.top = fix; glide(sc, fix, tries - 1); return; }
				if (tries > 0 && !a && home) { glide(sc, home.top, tries - 1); return; }
				away = false;
				setTimeout(() => { ours = false; }, 50);
			}));
		};
		anim = requestAnimationFrame(step);
	};
	const onMove = (e) => {
		const sc = list();
		if (!sc || !active) return;
		// over the leaderboard (the left side of song select), not just anywhere left of the list
		const lb = document.querySelector('.lb');
		const r = lb && lb.getBoundingClientRect();
		const left = r && r.width > 0 ? e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom : e.clientX < sc.getBoundingClientRect().left * 0.5;
		if (left && !inLeft && away && home) {
			const a = sc.querySelector('.bm-card.is-active');
			glide(sc, a ? targetOf(sc, a) : home.top);
		}
		inLeft = left;
	};
	const onListScroll = (e) => {
		const sc = list();
		if (!sc || e.target !== sc) return;
		if (!ours) away = true;
		note();
	};
	const onWheel = (e) => { if (list()?.contains(e.target)) { cancelAnimationFrame(anim); ours = false; } };
	let timer;
	const mount = () => {
		window.addEventListener('pointermove', onMove, true);
		document.addEventListener('scroll', onListScroll, true);
		window.addEventListener('wheel', onWheel, { capture: true, passive: true });
		timer = setInterval(note, 400);
	};
	const unmount = () => {
		window.removeEventListener('pointermove', onMove, true);
		document.removeEventListener('scroll', onListScroll, true);
		window.removeEventListener('wheel', onWheel, { capture: true });
		clearInterval(timer);
		cancelAnimationFrame(anim);
		home = null;
	};
	return { mount, unmount };
})();

// --- who else uses the lazer look: their chat messages end with an invisible mark
// The mark looks like the chat add-on's own mark (so every version of that add-on already strips it
// out of the text), with the build number 1: the chat add-on knows that means "lazer look".
const LZ_MARK = '\u200c\u2060\u200c' + '\u200b'.repeat(23) + '\u200d';
const LZ_OLD = '\u2063\u200b\u2063'; // (what 0.7.x to 0.8.x put on messages: still recognised)
const LZ_KEY = 'oss-idle-lazer-ui-users';
const lzUsers = new Set();
const LZ_ONLY_KEY = 'oss-idle-lazer-ui-only';
let lzOnly = false;
const LZ_ALWAYS = 'kitsue'; // (always shown as a lazer user)
const lzLoad = () => {
	try { lzOnly = localStorage.getItem(LZ_ONLY_KEY) === '1'; } catch { lzOnly = false; } try { for (const n of JSON.parse(localStorage.getItem(LZ_KEY) || '[]')) if (typeof n === 'string') lzUsers.add(n); } catch { /* none yet */ } };
const lzHas = (k) => k === LZ_ALWAYS || lzUsers.has(k);
const lzSave = () => { try { localStorage.setItem(LZ_KEY, JSON.stringify([...lzUsers])); } catch { /* fine */ } };
// lines that are not real messages (commands, reactions, typing signals) never carry the mark
const lzSkip = (t) => { const x = t.replace(/[\u200b-\u200d\u2060\u2063]/g, '').trimStart(); return !x || x.startsWith('/') || x.startsWith('↩') || x.startsWith('⌨'); };
const lzName = (line) => (line.querySelector('.chat__name')?.textContent || '').replace(/[:\s]+$/, '').trim().toLowerCase();
const lzOnSubmit = (e) => {
	const form = e.target;
	if (!active || !form?.matches?.('.chat__compose')) return;
	const input = form.querySelector('input');
	if (!input || !input.value || input.value.includes(LZ_MARK) || lzSkip(input.value)) return;
	const own = /^\u200c\u2060\u200c[\u200b\u200d]*/.exec(input.value); // (the chat add-on's mark comes first, so it keeps being read first)
	const at = own ? own[0].length : 0;
	Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, input.value.slice(0, at) + LZ_MARK + input.value.slice(at));
	input.dispatchEvent(new Event('input', { bubbles: true })); // (so the game's chat box has it)
};
const lzScan = () => {
	let changed = false;
	for (const line of document.querySelectorAll('.chat__log > .chat__line:not([data-lz-seen])')) {
		line.dataset.lzSeen = '1';
		const text = line.querySelector('.chat__text')?.textContent || '';
		const k = lzName(line);
		if (!k || lzSkip(text)) continue;
		if (text.includes(LZ_MARK) || text.includes(LZ_OLD)) { if (!lzUsers.has(k)) { lzUsers.add(k); changed = true; } }
		else if (lzUsers.delete(k)) changed = true; // (their newest message has no mark: they turned it off)
	}
	if (changed) lzSave();
	// a "Lazer only" button by the search box in the online users panel
	const box = document.querySelector('.community-header__filters .cols.right');
	let ob = document.querySelector('.lz-only');
	if (box && !ob) {
		ob = document.createElement('button');
		ob.type = 'button';
		ob.className = 'lz-only';
		ob.textContent = 'Lazer only';
		ob.title = 'Only show people who use the lazer look (the ones you have seen chat)';
		ob.addEventListener('click', () => { lzOnly = !lzOnly; try { localStorage.setItem(LZ_ONLY_KEY, lzOnly ? '1' : '0'); } catch { /* fine */ } lzScan(); });
		box.prepend(ob);
	}
	ob?.classList.toggle('is-on', lzOnly);
	// on the rank banners: a tag drawn after the name (it's only styling, so the name's text and the layout stay as they are)
	for (const nm of document.querySelectorAll('.player-card__name')) {
		const k = (nm.textContent || '').trim().toLowerCase();
		const on = lzHas(k);
		const card = nm.closest('.player-card');
		if (card) card.classList.toggle('lz-nolazer', lzOnly && !on);
		if (on && nm.title !== 'Uses the lazer look') nm.title = 'Uses the lazer look';
		else if (!on && nm.title === 'Uses the lazer look') nm.removeAttribute('title');
		// always right after the name
		let corner = card?.querySelector(':scope > .lz-corner');
		if (!on) { corner?.remove(); continue; }
		if (!corner && card) {
			corner = document.createElement('span');
			corner.className = 'lz-corner';
			corner.textContent = 'LAZER';
			corner.title = 'Uses the lazer look';
			card.append(corner);
		}
		if (corner) {
			// right after the name (or after where it's cut short), without taking any room from the text under it
			const range = document.createRange();
			range.selectNodeContents(nm);
			const t = range.getBoundingClientRect(), n = nm.getBoundingClientRect(), c = card.getBoundingClientRect();
			const left = Math.round(Math.min(t.right, n.right) - c.left + 8), top = Math.round(n.top - c.top + (n.height - 14) / 2);
			if (n.width > 0) {
				if (corner.style.left !== `${left}px`) corner.style.left = `${left}px`;
				if (corner.style.top !== `${top}px`) corner.style.top = `${top}px`;
			}
			corner.classList.toggle('lz-corner--rainbow', k === LZ_ALWAYS);
		}
	}
};
// A menu from a right-click opens next to the mouse as a small card (the game's other pop-ups stay centered dialogs)
const RIGHT_EVENTS = ['contextmenu', 'pointerdown', 'mousedown', 'mouseup', 'auxclick'];
let rightAt = { x: 0, y: 0, t: 0 };
const closePop = () => { const m = document.querySelector('.ctxmenu.lz-pop'); if (m && Date.now() - (m._lzBorn || 0) > 400) m.click(); }; // (not the one this very click just opened) // (the game closes a menu when its backdrop is clicked: here the menu is the backdrop)
// (the game opens its menu on the right button going down or up, before or after the browser's own contextmenu event: any of them marks the spot)
const onRight = (e) => { if (e.type !== 'contextmenu' && e.button !== 2) return; if (!e.target.closest?.('.ctxmenu.lz-pop')) closePop(); rightAt = { x: e.clientX, y: e.clientY, t: Date.now() }; };
const onClickOutside = (e) => {
	const pop = document.querySelector('.ctxmenu.lz-pop');
	if (pop && !pop.contains(e.target)) { e.preventDefault(); e.stopPropagation(); pop.click(); } // (this click only closes the menu)
};
const popScan = () => {
	for (const m of document.querySelectorAll('.ctxmenu:not([data-lz-pop])')) {
		m.dataset.lzPop = '1';
		if (Date.now() - rightAt.t > 700) continue; // not from a right-click
		m.classList.add('lz-pop');
		m._lzBorn = Date.now();
		m.style.setProperty('--lz-px', `${rightAt.x + 4}px`);
		m.style.setProperty('--lz-py', `${rightAt.y + 4}px`);
		const r = m.getBoundingClientRect(); // (kept on the screen)
		m.style.setProperty('--lz-px', `${Math.max(8, Math.min(rightAt.x + 4, innerWidth - r.width - 8))}px`);
		m.style.setProperty('--lz-py', `${Math.max(8, Math.min(rightAt.y + 4, innerHeight - r.height - 8))}px`);
	}
};
const scan = () => {
	popScan();
	lzScan();
	const screen = document.querySelector('.resultscreen');
	if (screen) addRing(screen);
	syncFilter();
	syncToolbar();
	markRows();
	onScroll();
};

export const mount = () => {
	if (observer) return; // already on
	window.__ossIdleLazerUi = true; // other add-ons (the skin importer) take lazer's look too
	if (!document.getElementById(FONT_ID)) {
		const link = document.createElement('link');
		link.id = FONT_ID;
		link.rel = 'stylesheet';
		link.href = FONT_URL;
		document.head.append(link);
	}
	let style = document.getElementById(STYLE_ID);
	if (!style) {
		style = document.createElement('style');
		style.id = STYLE_ID;
		document.head.append(style);
	}
	style.textContent = CSS;
	active = true;
	if (!ourFillText) {
		prevFillText = proto.fillText;
		ourFillText = hudFillText;
		proto.fillText = ourFillText;
	}
	if (!filter) buildFilter();
	if (!toolbar) buildToolbar();
	observer = new MutationObserver(scan);
	observer.observe(document.body, { childList: true, subtree: true, characterData: true });
	document.addEventListener('scroll', onScroll, true);
	for (const t of RIGHT_EVENTS) document.addEventListener(t, onRight, true);
	document.addEventListener('click', onClickOutside, true);
	lzLoad();
	document.addEventListener('submit', lzOnSubmit, true);
	carouselReturn.mount();
	markTimer = setInterval(markSet, 200); // (on its own clock: picking a map doesn't always change the page much)
	// the game loads some of its styles later (per screen); ours stay after them
	headObserver = new MutationObserver(keepLast);
	headObserver.observe(document.head, { childList: true });
	keepLast();
	scan();
};

export const unmount = () => {
	active = false;
	window.__ossIdleLazerUi = false;
	observer?.disconnect();
	headObserver?.disconnect();
	headObserver = null;
	document.removeEventListener('scroll', onScroll, true);
	for (const t of RIGHT_EVENTS) document.removeEventListener(t, onRight, true);
	document.removeEventListener('click', onClickOutside, true);
	document.querySelectorAll('.ctxmenu.lz-pop').forEach(m => { m.classList.remove('lz-pop'); m.style.removeProperty('--lz-px'); m.style.removeProperty('--lz-py'); });
	document.querySelectorAll('.ctxmenu[data-lz-pop]').forEach(m => delete m.dataset.lzPop);
	document.removeEventListener('submit', lzOnSubmit, true);
	document.querySelectorAll('.lz-only').forEach(b => b.remove());
	document.querySelectorAll('.lz-nolazer').forEach(c => c.classList.remove('lz-nolazer'));
	document.querySelectorAll('.lz-corner').forEach(c => c.remove());
	document.querySelectorAll('.player-card__name').forEach(n => { if (n.title === 'Uses the lazer look') n.removeAttribute('title'); });
	document.querySelectorAll('.chat__line[data-lz-seen]').forEach(l => delete l.dataset.lzSeen);
	carouselReturn.unmount();
	clearInterval(markTimer);
	document.querySelectorAll('.lz-sameset').forEach(c => c.classList.remove('lz-sameset'));
	observer = null;
	document.getElementById(STYLE_ID)?.remove();
	document.getElementById(FONT_ID)?.remove();
	document.querySelectorAll('.lz-ring, .lz-ring__acc').forEach(e => e.remove());
	if (leanFrame) { cancelAnimationFrame(leanFrame); leanFrame = 0; }
	document.querySelectorAll('.lz-lbrow, .lb__list>li').forEach(e => { e.classList.remove('lz-lbrow', 'lz-top10'); e.style.removeProperty('--lz-i'); });
	if (toolbar) {
		clearInterval(toolbar.timer);
		toolbar.root.remove();
		toolbar = null;
		document.documentElement.classList.remove('lz-has-toolbar');
	}
	if (filter) {
		filter.root.remove();
		filter = null;
		const typedOnly = typedPart((realInput() || {}).value || '');
		setOnly = null;
		setReal(typedOnly); // the game's search back to just what was typed
	}
	// put the canvas back only when nothing else wrapped it after us; otherwise our (now inert) wrapper stays in the chain and mount() reuses it
	if (ourFillText && proto.fillText === ourFillText) {
		proto.fillText = prevFillText;
		ourFillText = null;
	}
};

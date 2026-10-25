// oss!idle add-on: live leaderboard  (version 0.1.2)
//
// Copyright (c) 2026 YOUR NAME. Released under the MIT License: free to use, copy, change
// and share, as long as this notice stays in; it comes with no warranty.
//
// While a map plays, a leaderboard sits beside the playfield like osu!'s: the map's
// scores (global, country or local, whichever the song select leaderboard is set to)
// with the score being played climbing past them live.
// It takes osu!lazer's look when the lazer look add-on is on, and osu!'s otherwise.
// Drag it to move it (double-click puts it back). Its settings are in Options → Gameplay →
// "Live leaderboard". Alt+Shift+L shows or hides it.

const SETTINGS_KEY = 'oss-idle-live-leaderboard';
const ME_KEY = 'oss-idle-live-leaderboard-me';
const API = 'https://api.oss.idle.rhythmgamers.net/v1/scores/beatmap';
const FADE_MS = 250;

const defaults = () => ({ show: true, rows: 7, x: 1, y: 50 }); // x: its left edge, y: its middle, in % of the screen
let settings = defaults();
try { Object.assign(settings, JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}')); } catch {}
if (settings.side === 'right' && settings.x === undefined) settings.x = 80;
if (!Number.isFinite(settings.x)) settings.x = 1;
delete settings.side;
const save = () => { try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch {} };

let me = { name: 'You', avatar: '' };
try { Object.assign(me, JSON.parse(localStorage.getItem(ME_KEY) || '{}')); } catch {}

let root, list, style, timer, onKey, observer;
let shown = false, hideTimer;
const lazer = () => !!window.__ossIdleLazerUi;

// ---------- the play: the game in the playfield's React tree ----------
let cached = { canvas: null, props: null, game: null };
const readGame = (fiber) => {
	for (let hook = fiber.memoizedState; hook; hook = hook.next) {
		const ref = hook.memoizedState;
		const game = ref && typeof ref === 'object' && 'current' in ref ? ref.current : null;
		if (game && game.score && game.score.counts && Array.isArray(game.notes)) return game;
	}
	return null;
};
const findPlay = (canvas) => {
	if (cached.canvas === canvas && cached.game) return cached;
	const key = Object.keys(canvas).find(k => k.startsWith('__reactFiber$'));
	let fiber = key ? canvas[key] : null;
	for (let depth = 0; fiber && depth < 40; depth++, fiber = fiber.return) {
		const p = fiber.memoizedProps;
		if (!p || !p.play || !p.beatmapInfo) continue;
		cached = { canvas, props: p, game: readGame(fiber) };
		return cached;
	}
	cached = { canvas, props: null, game: null };
	return cached;
};
const showing = (canvas) => {
	if (!canvas || !canvas.isConnected) return false;
	const r = canvas.getBoundingClientRect();
	return r.width > 50 && r.height > 50 && !document.querySelector('.resultscreen');
};

// ---------- the board: from the game's server, or this computer's scores ----------
const boards = new Map(); // `${source}:${beatmapId}` -> Promise<entries>
const source = () => {
	try { return JSON.parse(localStorage.getItem('leaderboard') || '"GLOBAL"'); } catch { return 'GLOBAL'; }
};
const fetchGlobal = async (id, country) => {
	const url = `${API}/${encodeURIComponent(id)}/board${country ? `?country=${encodeURIComponent(country)}` : ''}`;
	const res = await fetch(url, { credentials: 'include' });
	if (!res.ok) return [];
	const rows = await res.json();
	return (Array.isArray(rows) ? rows : []).map(({ score: s, player: p }) => ({
		key: `g${s.id}`, name: (p && p.name) || '?', avatar: (p && p.avatarUrl) || '', country: p && p.country,
		score: Math.round(s.score || 0), accuracy: s.accuracy, combo: s.maxCombo,
	}));
};
const fetchLocal = async (id) => {
	const db = window.db;
	if (!db || !db.read) return [];
	const res = await db.read(d => d.exec(
		'SELECT s.id, s.score, s.accuracy, s.maxCombo, c.name FROM score s LEFT JOIN character c ON c.id = s.characterId WHERE s.beatmapId = ? ORDER BY s.score DESC LIMIT 50', [id]));
	return (res[0] ? res[0].values : []).map(([sid, score, accuracy, combo, name]) => ({
		key: `l${sid}`, name: name || '?', avatar: '', score: Math.round(score || 0), accuracy, combo,
	}));
};
const boardFor = (id) => {
	const src = source();
	const country = src === 'COUNTRY' ? me.country : undefined;
	const k = `${src}:${id}:${country || ''}`;
	if (!boards.has(k)) {
		boards.set(k, (src === 'LOCAL' ? fetchLocal(id) : fetchGlobal(id, country)).catch(() => []));
		if (boards.size > 30) boards.delete(boards.keys().next().value);
	}
	return boards.get(k);
};

// who's playing: the profile card on song select, remembered for during the map
const noteMe = () => {
	const card = document.querySelector('.game__user');
	if (!card) return;
	const name = (card.querySelector('.game__user-name') || {}).textContent;
	const img = card.querySelector('img');
	if (!name) return;
	const next = { ...me, name: name.trim(), avatar: img && img.src ? img.src : me.avatar };
	if (next.name !== me.name || next.avatar !== me.avatar) {
		me = next;
		try { localStorage.setItem(ME_KEY, JSON.stringify(me)); } catch {}
	}
};

// ---------- drawing ----------
const CSS = `
.llb{position:fixed;top:0;z-index:11;pointer-events:auto;cursor:move;touch-action:none;opacity:0;transition:opacity ${FADE_MS}ms ease;user-select:none;font-variant-numeric:tabular-nums}
.llb__list{position:relative}
.llb__row{position:absolute;left:0;right:0;display:flex;align-items:center;box-sizing:border-box;transition:transform .35s cubic-bezier(.2,.8,.3,1),opacity .3s,background .3s}
.llb__avatar{flex-shrink:0;object-fit:cover;background:rgba(255,255,255,.1)}
.llb__body{min-width:0;flex:1;display:grid}
.llb__name{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.llb__gap{position:absolute;left:0;right:0;text-align:center;transition:transform .35s cubic-bezier(.2,.8,.3,1),opacity .3s}
/* osu! (stable) */
.llb--osu{width:200px;font:13px "Exo 2",system-ui,sans-serif;color:#fff;text-shadow:0 1px 2px rgba(0,0,0,.7)}
.llb--osu .llb__row{height:46px;gap:8px;padding:0 8px 0 4px;background:linear-gradient(90deg,rgba(0,0,0,.55),rgba(0,0,0,.25));border-left:3px solid rgba(255,255,255,.25)}
.llb--osu .llb__avatar{width:38px;height:38px;border-radius:3px}
.llb--osu .llb__name{font-weight:600;font-size:13px}
.llb--osu .llb__score{font-size:15px;font-weight:300;letter-spacing:.02em}
.llb--osu .llb__side{display:grid;justify-items:end;font-size:11px;opacity:.85}
.llb--osu .llb__rank{font-size:18px;font-weight:700;opacity:.35}
.llb--osu .llb__row.is-me{background:linear-gradient(90deg,rgba(255,204,34,.45),rgba(255,204,34,.12));border-left-color:#ffcc22}
.llb--osu .llb__row.is-first{border-left-color:#7fe4ff}
.llb--osu .llb__gap{font-size:16px;opacity:.6}
/* osu!lazer */
.llb--lazer{width:230px;font:13px "Outfit","Exo 2",system-ui,sans-serif;color:#fff}
.llb--lazer .llb__row{height:44px;gap:10px;padding:0 12px 0 6px;border-radius:10px;background:rgba(30,26,33,.72);box-shadow:inset 4px 0 rgba(255,255,255,.18),0 4px 14px rgba(0,0,0,.3)}
.llb--lazer .llb__avatar{width:32px;height:32px;border-radius:8px}
.llb--lazer .llb__name{font-weight:600;font-size:13px;line-height:1.15}
.llb--lazer .llb__score{font-size:12px;font-weight:500;color:rgba(255,255,255,.65)}
.llb--lazer .llb__side{display:grid;justify-items:end;font-size:11px;color:rgba(255,255,255,.6);line-height:1.2}
.llb--lazer .llb__rank{font-size:15px;font-weight:600;color:#fff;opacity:.9}
.llb--lazer .llb__row.is-me{background:rgba(255,102,171,.32);box-shadow:inset 4px 0 #ff66ab,0 0 18px rgba(255,102,171,.35)}
.llb--lazer .llb__row.is-first .llb__rank{color:#ffcc22}
.llb--lazer .llb__gap{font-size:14px;color:rgba(255,255,255,.5)}
`;
const ROW_GAP = 4;
const rowH = () => (lazer() ? 44 : 46) + ROW_GAP;
const fmt = (n) => Math.round(n).toLocaleString('en-US');
const pct = (a) => (a == null ? '' : `${(a * 100).toFixed(2)}%`);
const rows = new Map(); // key -> element

const rowEl = (key) => {
	let r = rows.get(key);
	if (r) return r;
	r = document.createElement('div');
	r.className = 'llb__row';
	const img = document.createElement('img');
	img.className = 'llb__avatar';
	img.alt = '';
	img.referrerPolicy = 'no-referrer';
	const body = document.createElement('div');
	body.className = 'llb__body';
	const name = document.createElement('div');
	name.className = 'llb__name';
	const score = document.createElement('div');
	score.className = 'llb__score';
	body.append(name, score);
	const side = document.createElement('div');
	side.className = 'llb__side';
	const rank = document.createElement('div');
	rank.className = 'llb__rank';
	const extra = document.createElement('div');
	side.append(rank, extra);
	r.append(img, body, side);
	r._p = { img, name, score, rank, extra };
	r.style.opacity = '0';
	list.append(r);
	rows.set(key, r);
	return r;
};
const fill = (r, e, rank, isMe, unranked) => {
	const p = r._p;
	if (p.name.textContent !== e.name) p.name.textContent = e.name;
	const sc = fmt(e.score);
	if (p.score.textContent !== sc) p.score.textContent = sc;
	const rk = unranked ? '-' : `#${rank}`;
	if (p.rank.textContent !== rk) p.rank.textContent = rk;
	const ex = isMe ? `${e.combo}x` : pct(e.accuracy);
	if (p.extra.textContent !== ex) p.extra.textContent = ex;
	if (e.avatar && p.img.getAttribute('src') !== e.avatar) p.img.src = e.avatar;
	if (!e.avatar) p.img.removeAttribute('src');
	r.classList.toggle('is-me', isMe);
	r.classList.toggle('is-first', rank === 1);
};

// which rows show: the top one, then the ones just above you (and one below), like osu!
const pick = (all, meIndex, n) => {
	if (all.length <= n) return all.map((e, i) => i);
	if (meIndex < n - 1) return [...Array(n).keys()];
	const out = [0];
	const end = Math.min(all.length - 1, meIndex + 1);
	for (let i = end - (n - 2); i <= end; i++) out.push(i);
	return out;
};

let gapEl;
const render = (board, mine) => {
	const all = [...board, mine].sort((a, b) => b.score - a.score || (a === mine ? -1 : b === mine ? 1 : 0));
	const meIndex = all.indexOf(mine);
	const n = Math.max(3, Math.min(12, settings.rows | 0));
	const idx = pick(all, meIndex, n);
	const h = rowH();
	const used = new Set();
	idx.forEach((i, slot) => {
		const e = all[i];
		const r = rowEl(e.key);
		used.add(e.key);
		// below the 50 scores the game gives out: no telling the real rank
		fill(r, e, i + 1, e === mine, e === mine && board.length >= 50 && i >= board.length);
		r.style.transform = `translateY(${slot * h}px)`;
		r.style.height = `${h - ROW_GAP}px`;
		r.style.opacity = '1';
	});
	for (const [k, r] of rows) {
		if (used.has(k)) continue;
		r.style.opacity = '0';
		if (!r._gone) r._gone = setTimeout(() => { r.remove(); rows.delete(k); }, 400);
	}
	for (const k of used) { const r = rows.get(k); if (r && r._gone) { clearTimeout(r._gone); r._gone = 0; } }
	// a "…" between the top one and the rest when rows are skipped
	if (!gapEl) { gapEl = document.createElement('div'); gapEl.className = 'llb__gap'; gapEl.textContent = '⋮'; list.append(gapEl); }
	const skipped = idx.length > 1 && idx[1] > 1;
	gapEl.style.opacity = skipped ? '1' : '0';
	gapEl.style.transform = `translateY(${h - ROW_GAP / 2 - 9}px)`;
	list.style.height = `${idx.length * h}px`;
};

const place = (canvas) => {
	if (drag) return;
	const r = canvas.getBoundingClientRect();
	const w = root.offsetWidth || 220;
	root.style.left = `${Math.min(r.right - w, Math.max(r.left, r.left + r.width * settings.x / 100))}px`;
	root.style.top = `${r.top + r.height * settings.y / 100 - list.offsetHeight / 2}px`;
};
// grab it and move it (double-click: back to its spot)
let drag = null;
const onDown = (e) => {
	if (e.button !== 0) return;
	e.preventDefault(); e.stopPropagation();
	const b = root.getBoundingClientRect();
	drag = { dx: e.clientX - b.left, dy: e.clientY - b.top };
	root.setPointerCapture(e.pointerId);
};
const onMove = (e) => {
	if (!drag) return;
	const canvas = document.querySelector('canvas.play__canvas');
	const r = canvas ? canvas.getBoundingClientRect() : { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight };
	const left = e.clientX - drag.dx, top = e.clientY - drag.dy;
	root.style.left = `${left}px`;
	root.style.top = `${top}px`;
	settings.x = Math.min(100, Math.max(0, (left - r.left) / r.width * 100));
	settings.y = Math.min(100, Math.max(0, (top + list.offsetHeight / 2 - r.top) / r.height * 100));
};
const onUp = () => { if (!drag) return; drag = null; save(); };
const onReset = (e) => { e.stopPropagation(); settings.x = defaults().x; settings.y = defaults().y; save(); };
const setShown = (on) => {
	if (on === shown) return;
	shown = on;
	clearTimeout(hideTimer);
	if (on) {
		root.style.visibility = 'visible';
		requestAnimationFrame(() => { if (shown && root) root.style.opacity = '1'; });
	} else {
		root.style.opacity = '0';
		hideTimer = setTimeout(() => { if (!shown && root) root.style.visibility = 'hidden'; }, FADE_MS);
	}
};

let currentId = null, board = [];
const tick = () => {
	if (!root) return;
	root.className = `llb ${lazer() ? 'llb--lazer' : 'llb--osu'}`;
	noteMe();
	const canvas = document.querySelector('canvas.play__canvas');
	if (!settings.show || !showing(canvas)) { setShown(false); return; }
	const play = findPlay(canvas);
	const g = play.game;
	if (!play.props || !g) { setShown(false); return; }
	const id = play.props.beatmapInfo && play.props.beatmapInfo.metadata && play.props.beatmapInfo.metadata.id;
	if (id == null) { setShown(false); return; }
	if (id !== currentId) {
		currentId = id;
		board = [];
		for (const r of rows.values()) r.remove();
		rows.clear();
		boardFor(id).then(b => { if (currentId === id) board = b; });
	}
	const s = g.score;
	const mine = { key: 'me', name: me.name || 'You', avatar: me.avatar, score: Math.round(s.score || 0), combo: s.combo || 0, accuracy: s.accuracy };
	render(board, mine);
	place(canvas);
	setShown(true);
};

// ---------- its settings: Options → Gameplay ----------
const GROUP_CLASS = 'llb-opt-group';
const node = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text !== undefined) n.textContent = text; return n; };
const optCheckbox = (label, get, set) => {
	const b = node('button', 'opt-checkbox');
	b.type = 'button';
	const box = node('span', 'opt-checkbox__box');
	box.append(node('span', 'opt-checkbox__tick'));
	b.append(box, node('span', 'opt-checkbox__label', label));
	const show = () => b.classList.toggle('is-on', !!get());
	b.addEventListener('click', (e) => { e.stopPropagation(); set(!get()); show(); });
	show();
	return b;
};
const optSlider = (label, min, max, step, get, set, fmtV) => {
	const wrap = node('label', 'opt-slider');
	const head = node('div', 'opt-slider__head');
	const value = node('span', 'opt-slider__value');
	head.append(node('span', 'opt-slider__label', label), value);
	const input = node('input', 'opt-slider__input');
	input.type = 'range'; input.min = String(min); input.max = String(max); input.step = String(step);
	const show = () => { input.value = String(get()); value.textContent = fmtV(get()); input.style.setProperty('--fill', `${((get() - min) / (max - min)) * 100}%`); };
	input.addEventListener('input', () => { set(Number(input.value)); show(); });
	wrap.append(head, input);
	show();
	return wrap;
};
const optButton = (text, onClick) => {
	const b = node('button', 'opt-button', text);
	b.type = 'button';
	b.addEventListener('click', (e) => { e.stopPropagation(); onClick(); });
	return b;
};
const hint = (text) => { const d = node('div', '', text); d.style.cssText = 'font-size:13px;opacity:.6;margin:2px 0 4px'; return d; };
const buildGroup = () => {
	const g = node('div', `options__group ${GROUP_CLASS}`);
	g.append(
		node('div', 'options__group_title', 'Live leaderboard'),
		optCheckbox('Show the live leaderboard (Alt+Shift+L)', () => settings.show, v => { settings.show = v; save(); }),
		optSlider('Rows', 3, 12, 1, () => settings.rows, v => { settings.rows = v; save(); }, v => String(v)),
		optButton('Put it back on the left', () => { settings.x = defaults().x; settings.y = defaults().y; save(); }),
		hint('Drag the leaderboard during a map to move it; double-click it to put it back.'),
	);
	return g;
};
const ensureGroup = () => {
	const cats = [...document.querySelectorAll('.options__category')];
	const gameplay = cats.find(c => /^gameplay$/i.test((c.querySelector('.options__category_title')?.textContent || '').trim())) || cats[2];
	if (gameplay && !gameplay.querySelector(`.${GROUP_CLASS}`)) gameplay.append(buildGroup());
};

export const mount = () => {
	style = document.createElement('style');
	style.textContent = CSS;
	document.head.append(style);
	root = document.createElement('div');
	root.className = 'llb llb--osu';
	root.style.visibility = 'hidden';
	list = document.createElement('div');
	list.className = 'llb__list';
	root.append(list);
	root.title = 'Drag to move · double-click to put it back';
	root.addEventListener('pointerdown', onDown);
	root.addEventListener('pointermove', onMove);
	root.addEventListener('pointerup', onUp);
	root.addEventListener('pointercancel', onUp);
	root.addEventListener('dblclick', onReset);
	document.body.append(root);
	timer = setInterval(tick, 100);
	let queued = false;
	observer = new MutationObserver(() => {
		if (queued) return;
		queued = true;
		requestAnimationFrame(() => { queued = false; ensureGroup(); });
	});
	observer.observe(document.body, { childList: true, subtree: true });
	ensureGroup();
	onKey = (e) => {
		if (e.altKey && e.shiftKey && !e.ctrlKey && e.code === 'KeyL') {
			e.preventDefault();
			settings.show = !settings.show;
			save();
			document.querySelectorAll(`.${GROUP_CLASS}`).forEach(g => g.remove());
			ensureGroup();
		}
	};
	window.addEventListener('keydown', onKey, true);
};

export const unmount = () => {
	clearInterval(timer);
	clearTimeout(hideTimer);
	observer?.disconnect();
	window.removeEventListener('keydown', onKey, true);
	document.querySelectorAll(`.${GROUP_CLASS}`).forEach(g => g.remove());
	root?.remove();
	style?.remove();
	root = list = style = gapEl = undefined;
	rows.clear();
	boards.clear();
	currentId = null;
	board = [];
	shown = false;
	cached = { canvas: null, props: null, game: null };
};

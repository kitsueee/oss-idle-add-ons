// oss!idle add-on: add-on tiles  (version 0.1.4)
//
// Copyright (c) 2026 kitsue. Released under the MIT License: free to use, copy, change
// and share, as long as this notice stays in; it comes with no warranty.
//
// Adds a List / Tiles switch to the Add-ons page (both Manage and Browse). Tiles show
// each add-on as a card with a big picture on top, its name, author, description and
// buttons below. Your choice is remembered. With the lazer look add-on on, the tiles
// take lazer's rounder style.
// The Manage tab also gets a search box that narrows both of its lists (your own
// add-ons and the installed ones) by name, author, description or tag as you type.

const KEY = 'oss-idle-addon-tiles';
const STYLE_ID = 'oss-addon-tiles';

const CSS = String.raw`
/* the List / Tiles switch, at the right of the page's title */
.at-view{display:inline-flex;align-self:center;margin-left:auto;padding:3px;gap:2px;border-radius:6px;background:rgba(0,0,0,.45)}
.at-view button{display:inline-flex;align-items:center;gap:6px;padding:5px 12px;border:0;border-radius:4px;background:none;color:rgba(255,255,255,.6);font:inherit;font-size:.85rem;font-weight:500;cursor:pointer;transition:background .14s,color .14s}
.at-view button:hover{color:#fff}
.at-view button.is-on{background:var(--osu-pink-darkest,#b3325f);color:#fff}
.at-view svg{width:14px;height:14px;fill:currentColor}
/* the Manage tab's search box: left of the switch */
.at-search{display:inline-flex;align-items:center;align-self:center;gap:8px;margin-left:auto}
.at-search+.at-view{margin-left:10px}
.at-search input{width:240px;padding:.4rem .8rem;border:1px solid rgba(255,255,255,.18);border-radius:3px;background:rgba(0,0,0,.55);color:var(--text,#fff);font:inherit;font-size:.9rem;outline:none}
.at-search input:focus{border-color:var(--osu-pink-light,#ff8cc4)}
.at-search input::placeholder{color:var(--text-dim,rgba(255,255,255,.5))}
.at-search__count{min-width:4.5em;text-align:right;font-size:.8rem;color:var(--text-dim,rgba(255,255,255,.5));white-space:nowrap}
.at-search__count:empty{display:none}
.page .listing.at-hidden{display:none}
.page .page__list.at-none::after{content:"Nothing here matches your search.";display:block;padding:8px 2px;font-size:.85rem;color:var(--text-dim,rgba(255,255,255,.5))}
.page.at-tiles .page__list.at-none::after{grid-column:1/-1}

/* tiles */
.page.at-tiles .page__list{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:14px;margin-bottom:24px}
.page.at-tiles .listing{position:relative;flex-direction:column;align-items:stretch;gap:0;padding:0;border-left:0;border-radius:6px;overflow:hidden;
 background:rgba(0,0,0,.42);box-shadow:0 4px 14px rgba(0,0,0,.35);transition:background .14s,transform .14s,box-shadow .14s}
.page.at-tiles .listing:hover{transform:translateY(-3px);box-shadow:0 10px 24px rgba(0,0,0,.45)}
.page.at-tiles .listing.is-on{border-left:0;box-shadow:inset 0 0 0 2px var(--osu-pink),0 4px 14px rgba(0,0,0,.35)}
/* the picture: big, whole (not cropped), over a blurred copy of itself */
.page.at-tiles .listing::before{content:"";position:absolute;top:0;left:0;right:0;aspect-ratio:4/3;background:var(--at-bg,none) center/cover;filter:blur(18px) brightness(.55);transform:scale(1.2)}
.page.at-tiles .listing .listing__icon{position:relative;width:100%;height:auto;aspect-ratio:4/3;object-fit:contain;background:none}
.page.at-tiles .listing .listing__icon--empty{background:linear-gradient(135deg,rgba(255,102,171,.35),rgba(102,68,204,.35));font-size:4.5rem;color:#fff}
.page.at-tiles .listing__main{position:relative;flex:1 1 auto;gap:.25rem;padding:12px 14px 6px;background:rgba(10,8,14,.88)}
.page.at-tiles .listing__name{font-size:1.1rem;line-height:1.25;white-space:normal;overflow-wrap:anywhere}
/* the version on its own line under the name (not wrapping in after it, indented) */
.page.at-tiles .listing .listing__ver{display:block;margin:2px 0 0;font-size:.8rem}
.page.at-tiles .listing__desc{-webkit-line-clamp:3;margin-top:2px}
.page.at-tiles .listing .listing__tags{margin-top:4px}
.page.at-tiles .listing__actions{position:relative;flex-wrap:wrap;gap:.4rem;padding:8px 14px 14px;background:rgba(10,8,14,.88)}
.page.at-tiles .listing__actions .listing-btn{flex:1 1 auto;text-align:center}
.page.at-tiles .listing__actions .listing-toggle{flex:1 0 100%}
/* your own add-ons: the published / unpublished badges in a row under the name */
.page.at-tiles .listing__row{gap:.35rem;margin-top:4px}

/* an add-on's details page: the picture the size of a tile's, with the text underneath it (the tile rules above are for the cards only) */
.page.at-tiles .listing-view__head{flex-direction:column;align-items:flex-start;gap:12px}
.page.at-tiles .listing-view__head .listing__icon{width:240px;max-width:100%;height:180px;aspect-ratio:4/3;object-fit:contain;border-radius:10px;background:rgba(0,0,0,.35)}
.page.at-tiles .listing-view__head .listing__icon--empty{display:flex;align-items:center;justify-content:center;font-size:4.5rem;color:#fff;background:linear-gradient(135deg,rgba(255,102,171,.35),rgba(102,68,204,.35))}
.page.at-tiles .listing-view__headmeta{min-width:0}

/* with the lazer look */
.at-lazer .at-view{border-radius:999px;background:hsl(333 10% 13%)}
.at-lazer .at-view button{border-radius:999px}
.at-lazer .at-view button.is-on{background:var(--lz-pink,#ff66ab)}
.at-lazer .at-search input{border:0;border-radius:999px;background:hsl(333 10% 7%);padding:.45rem 1rem}
.page.at-tiles.at-lazer .listing{border-radius:12px;background:hsl(333 10% 15%)}
.page.at-tiles.at-lazer .listing.is-on{box-shadow:inset 0 0 0 2px var(--lz-pink,#ff66ab),0 4px 14px rgba(0,0,0,.35)}
.page.at-tiles.at-lazer .listing__main,.page.at-tiles.at-lazer .listing__actions{background:hsl(333 10% 15% / .94)}
.page.at-tiles.at-lazer .listing-btn{border-radius:8px}
`;

const ICON_LIST = '<svg viewBox="0 0 16 16"><path d="M1 2h14v2.5H1zm0 4.75h14v2.5H1zM1 11.5h14V14H1z"/></svg>';
const ICON_TILES = '<svg viewBox="0 0 16 16"><path d="M1 1h6v6H1zm8 0h6v6H9zM1 9h6v6H1zm8 0h6v6H9z"/></svg>';

let tiles = true;
try { tiles = JSON.parse(localStorage.getItem(KEY) ?? 'true') !== false; } catch { /* private window */ }
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(tiles)); } catch { /* private window */ } };

let observer = null, frame = 0;
let query = ''; // the Manage tab's search (kept while you switch tabs)

/** Is this page the Add-ons one (the game's title for it, or what's on it)? */
const isAddonsPage = (page) =>
	/add-?ons?\b/i.test(page.querySelector('.page__title')?.textContent || '') ||
	!!page.querySelector('.addon-types, .addon__downloads');

const makeSwitch = () => {
	const box = document.createElement('div');
	box.className = 'at-view';
	box.setAttribute('role', 'group');
	box.setAttribute('aria-label', 'Show add-ons as');
	for (const [id, label, icon] of [['list', 'List', ICON_LIST], ['tiles', 'Tiles', ICON_TILES]]) {
		const b = document.createElement('button');
		b.type = 'button';
		b.dataset.view = id;
		b.innerHTML = `${icon}<span>${label}</span>`;
		b.addEventListener('click', () => {
			tiles = id === 'tiles';
			save();
			scan();
		});
		box.append(b);
	}
	return box;
};

const makeSearch = () => {
	const box = document.createElement('label');
	box.className = 'at-search';
	const input = document.createElement('input');
	input.type = 'search';
	input.placeholder = 'Search your add-ons';
	input.value = query;
	const count = document.createElement('span');
	count.className = 'at-search__count';
	input.addEventListener('input', () => { query = input.value; scan(); });
	input.addEventListener('keydown', (e) => {
		e.stopPropagation(); // typing here isn't for the game's keys
		if (e.key === 'Escape' && input.value) { input.value = query = ''; scan(); }
	});
	box.append(input, count);
	return box;
};
/** Narrow the Manage tab's lists to what matches the search (or show them all again). */
const filter = (page, on) => {
	const words = on ? query.toLowerCase().split(/\s+/).filter(Boolean) : [];
	let shown = 0, total = 0;
	for (const list of page.querySelectorAll('.page__list')) {
		const rows = [...list.querySelectorAll(':scope > .listing')];
		let here = 0;
		for (const row of rows) {
			const text = ['.listing__name', '.listing__by', '.listing__desc', '.listing__tags']
				.map(sel => row.querySelector(sel)?.textContent || '').join(' ').toLowerCase();
			const hit = words.every(w => text.includes(w));
			row.classList.toggle('at-hidden', !hit);
			if (hit) here++;
		}
		list.classList.toggle('at-none', words.length > 0 && rows.length > 0 && here === 0);
		shown += here;
		total += rows.length;
	}
	return { shown, total, words: words.length };
};

const scan = () => {
	frame = 0;
	const lazer = !!window.__ossIdleLazerUi;
	for (const page of document.querySelectorAll('.page')) {
		const ours = isAddonsPage(page);
		page.classList.toggle('at-tiles', ours && tiles);
		page.classList.toggle('at-lazer', ours && lazer);
		if (!ours) continue;
		const header = page.querySelector('.page__header');
		let sw = header?.querySelector('.at-view');
		if (header && !sw) header.append(sw = makeSwitch());
		// the search: only on the Manage tab's lists (the first tab), not Browse or a details view
		const tabsAll = [...page.querySelectorAll('.page__tab')];
		const manage = tabsAll.length > 0 && tabsAll[0].classList.contains('is-active') && !page.querySelector('.listing-view');
		let search = header?.querySelector('.at-search');
		if (header && manage && !search) header.insertBefore(search = makeSearch(), sw);
		if (search && !manage) { search.remove(); search = null; }
		const { shown, total, words } = filter(page, manage);
		const count = search?.querySelector('.at-search__count');
		const label = words ? `${shown} of ${total}` : '';
		if (count && count.textContent !== label) count.textContent = label; // (only when it changes: it wakes the page watcher)
		sw?.querySelectorAll('button').forEach(b => {
			const on = (b.dataset.view === 'tiles') === tiles;
			b.classList.toggle('is-on', on);
			b.setAttribute('aria-pressed', String(on));
		});
		// each tile's blurred backdrop is its own picture
		for (const img of page.querySelectorAll('.page__list .listing > img.listing__icon')) {
			const card = img.parentElement;
			if (card.dataset.atBg !== img.src) {
				card.dataset.atBg = img.src;
				card.style.setProperty('--at-bg', `url("${img.src.replace(/"/g, '%22')}")`);
			}
		}
	}
};
const soon = () => { if (!frame) frame = requestAnimationFrame(scan); };

export const mount = () => {
	let style = document.getElementById(STYLE_ID);
	if (!style) {
		style = document.createElement('style');
		style.id = STYLE_ID;
		document.head.append(style);
	}
	style.textContent = CSS;
	observer = new MutationObserver(soon);
	observer.observe(document.body, { childList: true, subtree: true });
	scan();
};

export const unmount = () => {
	observer?.disconnect();
	observer = null;
	if (frame) cancelAnimationFrame(frame);
	frame = 0;
	document.getElementById(STYLE_ID)?.remove();
	document.querySelectorAll('.at-view, .at-search').forEach(e => e.remove());
	document.querySelectorAll('.at-hidden').forEach(e => e.classList.remove('at-hidden'));
	document.querySelectorAll('.at-none').forEach(e => e.classList.remove('at-none'));
	document.querySelectorAll('.at-tiles, .at-lazer').forEach(e => e.classList.remove('at-tiles', 'at-lazer'));
	document.querySelectorAll('[data-at-bg]').forEach(e => { delete e.dataset.atBg; e.style.removeProperty('--at-bg'); });
};

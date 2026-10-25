// oss!idle add-on: Skin images  (version 0.2.0)
//
// Draws the note, long note and key images of skins brought in with the osu!
// skin importer, in place of the game's coloured bars. The game's skins only
// have colours for notes, so the importer saves the images alongside the skin
// and this add-on draws them. Skins without images look exactly as before.
//
// - tap notes and long note heads, tails and bodies use the skin's images
// - receptors become the skin's key images, under the notes like in osu!, lighting
//   up (the pressed image) when you hit
// - in upscroll, notes stay the right way up; keys flip, like in osu!
// - anything the skin has no image for keeps its usual colour
//
// Turn circle notes off (Alt+Shift+C) to see the images: both replace the notes.
// Alt+Shift+I turns the images off and on, to compare.
//
// The osu! skin importer (v0.14.0 and later) has this built in, so you only need
// this add-on without the importer. With both installed, only one of them draws.

const OWNER = 'skin-images';
const STORAGE_KEY = 'oss-idle-skin-images';
const CANVAS_CLASSES = ['play__canvas', 'skin-preview__canvas'];
const POLL_MS = 2000; // how often to check which skin is in use

const proto = CanvasRenderingContext2D.prototype;
const NAMES = ['clearRect', 'fillRect', 'strokeRect', 'fillText', 'beginPath', 'moveTo', 'arcTo', 'fill'];
const prev = {};
const ours = {};

let enabled = true;
let images = null; // the current skin's images, decoded: { note: [img|'blank'|null] x4, ..., keyBelow }
let loadedKey = '';
let pollTimer, onKey, toast, toastTimer;

const frames = new WeakMap();
const isPlayfield = (canvas) =>
	canvas && canvas.classList && CANVAS_CLASSES.some(c => canvas.classList.contains(c));
const near = (a, b) => Math.abs(a - b) < 0.75;

const stateOf = (ctx) => {
	let s = frames.get(ctx);
	// cols: each column's left edge (+4) and note width, learnt from the receptors
	if (!s) frames.set(ctx, s = { phase: 'off', cols: [], noteW: 0, path: null, hold: null, receptor: 0, glow: [], glowNext: [] });
	return s;
};
const columnAt = (s, x) => {
	for (let c = 0; c < s.cols.length; c++) if (near(x, s.cols[c])) return c;
	return -1;
};
/** The image of a kind for a column: an image, 'blank' (draw nothing), or null (none). */
const imageOf = (kind, c) => (images && images[kind] ? images[kind][c] ?? null : null);

// ---------- drawing ----------
/** An image as wide as the note, its bottom edge at `bottom`; the right way up even when flipped. */
const drawNote = (ctx, img, x, bottom, w) => {
	const dh = w * img.height / img.width;
	const top = bottom - dh;
	if (ctx.getTransform().d < 0) {
		ctx.save();
		ctx.translate(0, 2 * top + dh);
		ctx.scale(1, -1);
		ctx.drawImage(img, x, top, w, dh);
		ctx.restore();
	} else {
		ctx.drawImage(img, x, top, w, dh);
	}
};

/** The alpha in a fill style ('rgba(r,g,b,a)' or '#rrggbbaa'); 1 if it has none. */
const alphaOf = (style) => {
	if (typeof style !== 'string') return 1;
	const m = style.match(/rgba?\([^)]*,\s*([\d.]+)\s*\)$/);
	if (m) return Number(m[1]);
	if (/^#[0-9a-f]{8}$/i.test(style)) return parseInt(style.slice(7), 16) / 255;
	return 1;
};

ours.clearRect = function (x, y, w, h) {
	if (isPlayfield(this.canvas)) {
		const s = stateOf(this);
		s.phase = enabled && images ? 'field' : 'off';
		s.path = null;
		s.hold = null;
		s.receptor = 0;
		s.keysDrawn = false;
		// how lit each key is: measured at the receptors, drawn from the next frame on
		s.glow = s.glowNext;
		s.glowNext = [];
	}
	return prev.clearRect.call(this, x, y, w, h);
};

// the HUD starts with text: leave everything after it alone
ours.fillText = function (...args) {
	const s = frames.get(this);
	if (s) s.phase = 'off';
	return prev.fillText.apply(this, args);
};

ours.fillRect = function (x, y, w, h) {
	const s = frames.get(this);
	if (!s || !s.noteW || (s.phase !== 'field' && s.phase !== 'receptors')) return prev.fillRect.call(this, x, y, w, h);

	// the press flash over a receptor: with key images, the pressed key shows instead
	// (drawn under the notes with the other keys, fading the same way)
	if (s.phase === 'receptors') {
		const c = columnAt(s, x);
		if (c >= 0 && near(w, s.noteW) && hasKey(c)) {
			s.glowNext[c] = Math.min(1, alphaOf(this.fillStyle) / 0.35);
			return;
		}
		return prev.fillRect.call(this, x, y, w, h);
	}

	// a long note's body (4px narrower than a note, 2px further in)
	if (near(w, s.noteW - 4)) {
		const c = columnAt(s, x - 2);
		if (c >= 0) drawKeys(this, s); // the first note of the frame: keys go under it
		const body = c >= 0 ? imageOf('body', c) : null;
		s.hold = { c, caps: 0, body: !!body };
		if (body === 'blank') return;
		if (body) {
			// from the middle of the tail to the middle of the head, under the end images
			const nh = s.noteH || s.noteW / 2;
			this.drawImage(body, x - 2, y - nh / 2, s.noteW, h);
			return;
		}
		return prev.fillRect.call(this, x, y, w, h);
	}

	// note-sized: a long note's tail (first) or head (second)
	if (near(w, s.noteW)) {
		s.noteH = h;
		const c = columnAt(s, x);
		if (c >= 0) drawKeys(this, s);
		if (c >= 0 && s.hold && s.hold.c === c) {
			const isTail = s.hold.caps++ === 0;
			const img = isTail ? imageOf('tail', c) : (imageOf('head', c) || imageOf('note', c));
			if (img === 'blank') return;
			if (img) return drawNote(this, img, x, y + h, w);
			// no tail image under an image body: osu! leaves the end bare
			if (isTail && s.hold.body) return;
		}
	}
	return prev.fillRect.call(this, x, y, w, h);
};

/** Does this column have a key image (or a blank one, hiding the receptor)? */
const hasKey = (c) => !!imageOf('key', c);

/** A key image across the whole column, its bottom keyBelow under the receptors. */
const drawKey = (ctx, img, s, c) => {
	const x = s.cols[c] - 4, w = s.noteW + 8;
	const dh = w * img.height / img.width;
	const bottom = s.lineY + (images.keyBelow || 0);
	ctx.drawImage(img, x, bottom - dh, w, dh);
};

/** The keys, once per frame, before the first note: so the notes go over them. */
const drawKeys = (ctx, s) => {
	if (s.keysDrawn || !s.lineY || s.cols.length < 1) return;
	s.keysDrawn = true;
	for (let c = 0; c < s.cols.length; c++) {
		const key = imageOf('key', c);
		if (!key || key === 'blank') continue;
		drawKey(ctx, key, s, c);
		const down = imageOf('keyDown', c);
		const glow = s.glow[c] || 0;
		if (glow > 0 && down && down !== 'blank') {
			ctx.save();
			ctx.globalAlpha *= glow;
			drawKey(ctx, down, s, c);
			ctx.restore();
		}
	}
};

// Receptors: learn the columns from them, and draw the key images in their place.
ours.strokeRect = function (x, y, w, h) {
	const s = frames.get(this);
	if (s && (s.phase === 'field' || s.phase === 'receptors') && w > 0) {
		if (s.phase === 'field') { s.phase = 'receptors'; s.receptor = 0; }
		const c = s.receptor++;
		s.cols[c] = x;
		s.cols.length = Math.max(s.cols.length, c + 1);
		s.noteW = w;
		s.lineY = y + h;
		if (hasKey(c)) {
			drawKeys(this, s); // no notes on screen this frame: the keys still go down
			return;
		}
	}
	return prev.strokeRect.call(this, x, y, w, h);
};

// Tap notes are rounded rectangles: moveTo + four arcTo, then fill.
ours.beginPath = function () {
	const s = frames.get(this);
	if (s) s.path = s.phase === 'field' ? { move: null, arcs: [] } : null;
	return prev.beginPath.call(this);
};
ours.moveTo = function (x, y) {
	const s = frames.get(this);
	if (s && s.path) {
		if (s.path.move) s.path = null;
		else s.path.move = [x, y];
	}
	return prev.moveTo.call(this, x, y);
};
ours.arcTo = function (x1, y1, x2, y2, r) {
	const s = frames.get(this);
	if (s && s.path) s.path.arcs.push([x1, y1, x2, y2, r]);
	return prev.arcTo.call(this, x1, y1, x2, y2, r);
};
ours.fill = function (...args) {
	const s = frames.get(this);
	const p = s && s.phase === 'field' && s.noteW ? s.path : null;
	if (p && p.move && p.arcs.length === 4 && args.length === 0) {
		// undo the rounded rectangle's maths: moveTo(x + r, y), arcTo(x + w, y, x + w, y + h, r)
		const [x1, y1, , y2, r] = p.arcs[0];
		const x = p.move[0] - r, y = p.move[1];
		const w = x1 - x, h = y2 - y1;
		s.path = null;
		const c = near(w, s.noteW) ? columnAt(s, x) : -1;
		if (c >= 0) drawKeys(this, s);
		const img = c >= 0 ? imageOf('note', c) : null;
		if (img === 'blank') return;
		if (img) return drawNote(this, img, x, y + h, w);
	}
	return prev.fill.apply(this, args);
};

// ---------- the skin in use ----------
const decode = (url) => new Promise((resolve) => {
	const img = new Image();
	img.onload = () => resolve(img);
	img.onerror = () => resolve(null);
	img.src = url;
});

/** Load the images of the skin the game is using, when it changes. */
const refresh = async () => {
	const db = window.db;
	if (!db || !db.read) return;
	let row;
	try {
		row = await db.read(d => {
			const res = d.exec('SELECT id, updatedAt, length(definition) FROM skin WHERE enabled = 1 LIMIT 1');
			return res[0] && res[0].values[0];
		});
	} catch { return; }
	const key = row ? row.join('|') : 'none';
	if (key === loadedKey) return;
	loadedKey = key;
	if (!row) { images = null; return; }

	let def;
	try {
		const text = await db.read(d => d.exec('SELECT definition FROM skin WHERE id = ?', [row[0]])[0].values[0][0]);
		def = JSON.parse(text);
	} catch { images = null; return; }
	const src = def && def.images;
	if (!src || !Array.isArray(src.list)) { images = null; return; }

	const decoded = await Promise.all(src.list.map(decode));
	if (loadedKey !== key) return; // changed again while decoding
	const pick = (arr) => [0, 1, 2, 3].map(c => {
		const i = arr ? arr[c] : null;
		return i == null ? null : i < 0 ? 'blank' : decoded[i] || null;
	});
	images = {
		note: pick(src.note), head: pick(src.head), body: pick(src.body), tail: pick(src.tail),
		key: pick(src.key), keyDown: pick(src.keyDown),
		keyBelow: Number(src.keyBelow) || 0,
	};
};

const showToast = (message) => {
	if (!toast) {
		toast = document.createElement('div');
		toast.style.cssText = [
			'position:fixed', 'left:50%', 'top:24px', 'transform:translateX(-50%)',
			'z-index:99000', 'pointer-events:none', // under the game's cursor
			'padding:8px 16px', 'border-radius:8px',
			'background:#191622', 'border:1px solid #3d3550', 'color:#eceaf2',
			'font:600 13px system-ui,sans-serif', 'box-shadow:0 6px 24px rgba(0,0,0,.5)',
			'transition:opacity .25s',
		].join(';');
		document.body.append(toast);
	}
	toast.textContent = message;
	toast.style.opacity = '1';
	clearTimeout(toastTimer);
	toastTimer = setTimeout(() => { if (toast) toast.style.opacity = '0'; }, 1400);
};

let patched = false;
export const mount = () => {
	try { enabled = localStorage.getItem(STORAGE_KEY) !== '0'; } catch {}
	// the skin importer has this built in, and so does this add-on: only one may draw
	if (window.__ossIdleSkinImages) return;
	window.__ossIdleSkinImages = OWNER;
	patched = true;
	for (const name of NAMES) {
		prev[name] = proto[name];
		proto[name] = ours[name];
	}
	refresh();
	pollTimer = setInterval(refresh, POLL_MS);
	onKey = (e) => {
		if (e.altKey && e.shiftKey && !e.ctrlKey && e.code === 'KeyI') {
			e.preventDefault();
			enabled = !enabled;
			try { localStorage.setItem(STORAGE_KEY, enabled ? '1' : '0'); } catch {}
			showToast(!images ? 'This skin has no images' : enabled ? 'Skin images on' : 'Skin images off');
		}
	};
	window.addEventListener('keydown', onKey, true);
};

export const unmount = () => {
	if (!patched) return;
	patched = false;
	clearInterval(pollTimer);
	window.removeEventListener('keydown', onKey, true);
	for (const name of NAMES) {
		if (proto[name] === ours[name]) proto[name] = prev[name];
		else enabled = false; // still wrapped by another add-on: switch ourselves off
	}
	if (window.__ossIdleSkinImages === OWNER) delete window.__ossIdleSkinImages;
	clearTimeout(toastTimer);
	toast?.remove();
	toast = undefined;
	images = null;
	loadedKey = '';
};

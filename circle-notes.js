// oss!idle add-on: Circle notes  (version 0.4.2)
//
// Draws tap notes, hold heads and receptors as circles. A hold's body is a bar
// with a rounded-off tail end, optionally with a circle on the tail too.
// Colours still come from your skin. The bottom of each note sits where the
// bottom of the bar would, so timing looks exactly the same.
//
// Upscroll is built in too: notes travel up toward receptors at the top of the
// screen. Only the playfield flips; the HUD stays the right way up, and the
// judgement, combo and skip text move to match. It works with circles on or off,
// and shares its on/off setting with the separate Upscroll add-on (if you have
// both, only one of them flips the screen).
//
// The osu! skin importer (v0.19.0 and later) has all of this built in: with it
// installed you don't need this add-on, and if you have both, the one that loads
// first does the drawing.
//
// Alt+Shift+C opens the settings (remembered between sessions).
// Ctrl+Shift+U turns upscroll on or off.

const STORAGE_KEY = 'oss-idle-circle-notes-settings';
const OLD_STORAGE_KEY = 'oss-idle-circle-notes';
const UPSCROLL_KEY = 'oss-idle-upscroll'; // shared with the Upscroll add-on
const CANVAS_CLASSES = ['play__canvas', 'skin-preview__canvas'];
const RING = 'rgba(0, 0, 0, 0.28)';

const proto = CanvasRenderingContext2D.prototype;
const NAMES = ['clearRect', 'fillRect', 'strokeRect', 'fillText', 'beginPath', 'moveTo', 'arcTo', 'fill'];
const prev = {};      // what was on the prototype before this add-on (may be another add-on)
const ours = {};      // this add-on's wrappers

let enabled = true;      // circles on at all
let tailCircles = false; // a solid circle on the tail end of holds
let upscroll = false;    // flip the playfield
let flipsHere = false;   // this add-on does the flipping (not the Upscroll add-on)
let onKey;
let panel;
let toast, toastTimer;

const frames = new WeakMap();
const isPlayfield = (canvas) =>
	canvas && canvas.classList && CANVAS_CLASSES.some(c => canvas.classList.contains(c));

const stateOf = (ctx) => {
	let s = frames.get(ctx);
	if (!s) frames.set(ctx, s = { phase: 'off', noteW: 0, path: null, hold: null });
	return s;
};
const near = (a, b) => Math.abs(a - b) < 0.75;

const load = () => {
	try {
		const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
		if (saved) {
			enabled = saved.enabled !== false;
			tailCircles = saved.tailCircles === true;
		} else {
			enabled = localStorage.getItem(OLD_STORAGE_KEY) !== '0';
		}
	} catch {}
	try { upscroll = localStorage.getItem(UPSCROLL_KEY) === '1'; } catch {}
};
const save = () => {
	try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ enabled, tailCircles })); } catch {}
	try { localStorage.setItem(UPSCROLL_KEY, upscroll ? '1' : '0'); } catch {}
};

// ---------- upscroll ----------
// mirror about the canvas's vertical middle, in device pixels
const flipFor = (canvas) => new DOMMatrix([1, 0, 0, -1, 0, canvas.height]);

/** Start of a frame: undo a flip left over from the last frame, then flip if on. */
const startFlip = (ctx, s) => {
	let current = ctx.getTransform();
	if (s.flip === 'on') {
		current = flipFor(ctx.canvas).multiply(current);
		ctx.setTransform(current);
	}
	s.flip = 'off';
	s.fieldLeft = Infinity;
	s.fieldRight = -Infinity;
	if (!flipsHere || !upscroll) return;
	s.base = current;
	s.height = ctx.canvas.height / (current.d || 1); // canvas height in CSS px
	s.flipPending = true; // applied right after the clear
};

/** A filled circle in place of a bar at (x, y, w, h): same width, bottom edge kept. */
const circle = (ctx, x, y, w, h) => {
	const r = w / 2;
	ctx.save();
	prev.beginPath.call(ctx);
	ctx.arc(x + r, y + h - r, r, 0, Math.PI * 2);
	prev.fill.call(ctx);
	ctx.lineWidth = Math.max(1, r * 0.09);
	ctx.strokeStyle = RING;
	ctx.stroke();
	ctx.restore();
	prev.beginPath.call(ctx);
};

/** An outlined circle in place of a receptor box. */
const ring = (ctx, x, y, w, h) => {
	const r = w / 2;
	prev.beginPath.call(ctx);
	ctx.arc(x + r, y + h - r, r - ctx.lineWidth / 2, 0, Math.PI * 2);
	ctx.stroke();
	prev.beginPath.call(ctx);
};

ours.clearRect = function (x, y, w, h) {
	if (!isPlayfield(this.canvas)) return prev.clearRect.call(this, x, y, w, h);
	const s = stateOf(this);
	s.phase = enabled ? 'field' : 'off';
	s.path = null;
	s.hold = null;
	startFlip(this, s);
	const result = prev.clearRect.call(this, x, y, w, h);
	if (s.flipPending) {
		s.flipPending = false;
		this.setTransform(flipFor(this.canvas).multiply(s.base));
		s.flip = 'on';
	}
	return result;
};

// The HUD always starts with text: stop changing shapes from there on, draw the
// HUD unflipped, and mirror the text centred on the playfield (judgement, combo,
// skip prompt) so it sits on the same side as the receptors.
ours.fillText = function (text, x, y, maxWidth) {
	const s = frames.get(this);
	if (s) {
		s.phase = 'off';
		if (s.flip === 'on') {
			this.setTransform(s.base);
			s.flip = 'hud';
		}
		if (s.flip === 'hud' && this.textAlign === 'center' && s.fieldRight > s.fieldLeft
			&& Math.abs(x - (s.fieldLeft + s.fieldRight) / 2) < 2) {
			y = s.height - y;
		}
	}
	return maxWidth === undefined
		? prev.fillText.call(this, text, x, y)
		: prev.fillText.call(this, text, x, y, maxWidth);
};

/** A rounded bar: a rectangle whose ends are half circles. */
const capsulePath = (ctx, x, y, w, h) => {
	const r = w / 2;
	prev.beginPath.call(ctx);
	if (h <= w) {
		ctx.arc(x + r, y + h - r, r, 0, Math.PI * 2);
		return;
	}
	ctx.arc(x + r, y + r, r, Math.PI, 0);
	ctx.lineTo(x + w, y + h - r);
	ctx.arc(x + r, y + h - r, r, 0, Math.PI);
	ctx.closePath();
};

ours.fillRect = function (x, y, w, h) {
	const s = frames.get(this);
	if (s && s.noteW && (s.phase === 'field' || s.phase === 'receptors')) {
		const capSized = near(w, s.noteW);

		// receptor glow: a filled circle under the ring
		if (s.phase === 'receptors') {
			if (capSized) return circle(this, x, y, w, h);
			return prev.fillRect.call(this, x, y, w, h);
		}

		// A hold body (4px narrower than a note). Draw the whole hold as one
		// rounded bar, from the top of the tail end to the bottom of the head end,
		// so each end lines up with where a tap circle would be.
		if (near(w, s.noteW - 4)) {
			const bx = x - 2;
			capsulePath(this, bx, y - s.noteW, s.noteW, h + s.noteW);
			prev.fill.call(this);
			prev.beginPath.call(this);
			s.hold = { x: bx, y: y - s.noteW, h: h + s.noteW, outlined: false };
			return;
		}

		// The game draws a hold's tail cap first, then its head cap.
		// Tail: the rounded end of the bar, plus a solid circle if that setting is
		// on. It also gives the bar's outline its solid colour.
		// Head: a solid circle, like a tap note. (A dropped hold has no head.)
		if (capSized && s.hold && near(x, s.hold.x)) {
			if (!s.hold.outlined) {
				this.save();
				capsulePath(this, s.hold.x, s.hold.y, s.noteW, s.hold.h);
				this.strokeStyle = this.fillStyle;
				this.lineWidth = Math.max(1.5, s.noteW * 0.05);
				this.stroke();
				this.restore();
				prev.beginPath.call(this);
				s.hold.outlined = true;
				if (tailCircles) circle(this, x, y, w, h);
				return;
			}
			return circle(this, x, y, w, h);
		}

		// anything else tap-sized (no body before it): a plain circle
		if (capSized) return circle(this, x, y, w, h);
	}
	return prev.fillRect.call(this, x, y, w, h);
};

// Receptors: learn the note width from them, and draw them as rings.
ours.strokeRect = function (x, y, w, h) {
	const s = frames.get(this);
	// the receptors' outlines give the playfield's edges (for the mirrored text)
	if (s && s.flip === 'on') {
		s.fieldLeft = Math.min(s.fieldLeft, x);
		s.fieldRight = Math.max(s.fieldRight, x + w);
	}
	if (s && (s.phase === 'field' || s.phase === 'receptors') && w > 0) {
		s.noteW = w;
		s.phase = 'receptors';
		s.hold = null;
		// let add-ons underneath (Upscroll, the skin importer's key and stage images)
		// see the receptor, invisibly: they use the receptors to find the playfield
		this.save();
		this.globalAlpha = 0;
		prev.strokeRect.call(this, x, y, w, h);
		this.restore();
		return ring(this, x, y, w, h);
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
		if (s.path.move) s.path = null; // more than one moveTo: not a note
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
	const p = s && s.phase === 'field' ? s.path : null;
	if (p && p.move && p.arcs.length === 4 && args.length === 0) {
		// undo the rounded rectangle's maths: moveTo(x + r, y), arcTo(x + w, y, x + w, y + h, r)
		const [x1, y1, , y2, r] = p.arcs[0];
		const x = p.move[0] - r, y = p.move[1];
		const w = x1 - x, h = y2 - y1;
		s.path = null;
		if (w > 0 && h > 0) {
			if (!s.noteW) s.noteW = w;
			if (near(w, s.noteW)) return circle(this, x, y, w, h);
		}
	}
	return prev.fill.apply(this, args);
};

// ---------- settings panel ----------
const option = (label, get, set) => {
	const row = document.createElement('label');
	row.style.cssText = 'display:flex;align-items:center;gap:8px;cursor:pointer';
	const box = document.createElement('input');
	box.type = 'checkbox';
	box.checked = get();
	box.style.cssText = 'width:16px;height:16px;accent-color:#ff66ab;cursor:pointer';
	box.addEventListener('change', () => { set(box.checked); save(); refresh(); });
	const text = document.createElement('span');
	text.textContent = label;
	row.append(box, text);
	return { row, box };
};

let tailOption, upOption, upNote;
const refresh = () => {
	if (!tailOption) return;
	tailOption.box.disabled = !enabled;
	tailOption.row.style.opacity = enabled ? '1' : '0.45';
	upOption.box.checked = upscroll;
	// an older Upscroll add-on that can't be switched from here
	const locked = window.__ossIdleUpscroll === 'old-upscroll';
	upOption.box.disabled = locked;
	upOption.row.style.opacity = locked ? '0.45' : '1';
	upNote.style.display = locked ? 'block' : 'none';
};

const setUpscroll = (on) => {
	upscroll = on;
	save();
	// tell the Upscroll add-on, if it's the one flipping
	window.dispatchEvent(new Event('oss-idle-upscroll'));
	refresh();
};
const onUpscrollChanged = () => {
	try { upscroll = localStorage.getItem(UPSCROLL_KEY) === '1'; } catch {}
	refresh();
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

const buildPanel = () => {
	panel = document.createElement('div');
	panel.style.cssText = [
		'position:fixed', 'left:16px', 'bottom:16px', 'z-index:99000', // under the game's cursor (99999-100000), above its menus
		'display:none', 'flex-direction:column', 'gap:10px',
		'padding:12px 14px', 'border-radius:10px',
		'background:#191622', 'border:1px solid #3d3550', 'color:#eceaf2',
		'font:13px system-ui,sans-serif', 'box-shadow:0 6px 24px rgba(0,0,0,.5)',
	].join(';');

	const title = document.createElement('div');
	title.textContent = 'Circle notes';
	title.style.cssText = 'font-weight:600;color:#ff66ab';

	const main = option('Circle notes', () => enabled, v => { enabled = v; });
	tailOption = option('Circles on hold ends', () => tailCircles, v => { tailCircles = v; });
	tailOption.row.style.paddingLeft = '24px';

	upOption = option('Upscroll', () => upscroll, v => { upscroll = v; });
	// the checkbox goes through setUpscroll so the Upscroll add-on hears about it
	upOption.box.addEventListener('change', () => setUpscroll(upOption.box.checked));
	upOption.row.style.cssText += ';margin-top:4px;padding-top:10px;border-top:1px solid #3d3550';
	upNote = document.createElement('div');
	upNote.textContent = 'Your Upscroll add-on is an older version: switch with Ctrl+Shift+U, or remove it and use this.';
	upNote.style.cssText = 'color:#ffbe5c;font-size:11px;max-width:220px';

	const hint = document.createElement('div');
	hint.textContent = 'Alt+Shift+C to close · Ctrl+Shift+U upscroll';
	hint.style.cssText = 'color:#9a92ae;font-size:11px';

	const version = document.createElement('div');
	version.textContent = 'v0.4.2';
	version.style.cssText = 'color:#6f6785;font-size:10px';

	panel.append(title, main.row, tailOption.row, upOption.row, upNote, hint, version);
	document.body.append(panel);
	refresh();
};

let active = false;
export const mount = () => {
	// the skin importer has this built in: if it's already drawing circles, let it
	if (window.__ossIdleCircleNotes) return;
	active = true;
	load();
	for (const name of NAMES) {
		prev[name] = proto[name];
		proto[name] = ours[name];
	}
	// Only one add-on may flip the screen, or two flips cancel out. The older
	// Upscroll add-on doesn't take part in this, so look for its flip directly.
	const oldUpscroll = /flipFor/.test(String(prev.clearRect)) && !window.__ossIdleUpscroll;
	if (oldUpscroll) window.__ossIdleUpscroll = 'old-upscroll';
	flipsHere = !window.__ossIdleUpscroll;
	if (flipsHere) window.__ossIdleUpscroll = 'circle-notes';
	window.addEventListener('oss-idle-upscroll', onUpscrollChanged);

	// tell other add-ons (the skin importer's skin images) when circles are drawing the notes
	window.__ossIdleCircleNotes = { owner: 'circle-notes', get enabled() { return enabled; } };

	buildPanel();
	onKey = (e) => {
		if (e.altKey && e.shiftKey && !e.ctrlKey && e.code === 'KeyC') {
			e.preventDefault();
			panel.style.display = panel.style.display === 'none' ? 'flex' : 'none';
		} else if (e.key === 'Escape' && panel.style.display !== 'none') {
			panel.style.display = 'none';
		} else if (e.ctrlKey && e.shiftKey && !e.altKey && e.code === 'KeyU' && flipsHere) {
			// (when the Upscroll add-on flips, its own Ctrl+Shift+U does this)
			e.preventDefault();
			setUpscroll(!upscroll);
			showToast(upscroll ? 'Upscroll on' : 'Upscroll off (downscroll)');
		}
	};
	window.addEventListener('keydown', onKey);
};

export const unmount = () => {
	if (!active) return;
	active = false;
	window.removeEventListener('keydown', onKey);
	window.removeEventListener('oss-idle-upscroll', onUpscrollChanged);
	if (window.__ossIdleCircleNotes && window.__ossIdleCircleNotes.owner === 'circle-notes') delete window.__ossIdleCircleNotes;
	// put back what was there, unless another add-on has wrapped ours since
	for (const name of NAMES) {
		if (proto[name] === ours[name]) proto[name] = prev[name];
		else { enabled = false; flipsHere = false; } // still wrapped by someone else: switch ourselves off
	}
	if (window.__ossIdleUpscroll === 'circle-notes' || window.__ossIdleUpscroll === 'old-upscroll') {
		delete window.__ossIdleUpscroll;
	}
	clearTimeout(toastTimer);
	toast?.remove();
	toast = undefined;
	panel?.remove();
	panel = undefined;
	tailOption = undefined;
	upOption = undefined;
	upNote = undefined;
};

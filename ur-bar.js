// oss!idle add-on: UR bar position
//
// Moves the UR (hit error) bar wherever you like, and keeps it on screen by
// default: the game draws it a fixed 78px below the receptors, so on skins with
// low receptors it ends up off the bottom of the screen.
//
// Alt+Shift+E opens the settings (remembered between sessions).
// Works together with the Upscroll and Circle notes add-ons.

const STORAGE_KEY = 'oss-idle-ur-bar';
const CANVAS_CLASSES = ['play__canvas', 'skin-preview__canvas'];
const MARGIN = 6; // gap kept from the screen edges

// The bar's pieces, relative to its centre line y (from the game's hitError.ts):
//   bands      fillRect(x, y - 4, w, 8)
//   centre     fillRect(cx - 1, y - 8, 2, 16)
//   hit ticks  fillRect(x, y - 10, 2, 20)
//   mean arrow moveTo(mx, y - 12), lineTo(mx -/+ 4, y - 19)
const TOP = 19, BOTTOM = 10; // how far the bar reaches above and below its centre

let settings = { dx: 0, dy: 0, keepOnScreen: true };
let onKey, panel;

const proto = CanvasRenderingContext2D.prototype;
const NAMES = ['fillRect', 'moveTo', 'lineTo'];
const prev = {};
const ours = {};

const frames = new WeakMap(); // ctx -> { y, shiftX, shiftY, lastMove }
const isPlayfield = (canvas) =>
	canvas && canvas.classList && CANVAS_CLASSES.some(c => canvas.classList.contains(c));
const near = (a, b) => Math.abs(a - b) < 0.01;

const load = () => {
	try { Object.assign(settings, JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')); } catch {}
};
const save = () => {
	try { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)); } catch {}
	window.dispatchEvent(new Event('oss-idle-ur-bar')); // tell the skin importer, if it's open
};

/** Where the bar should go, given where the game put its centre (y) and middle (cx). */
const placement = (ctx, cx, y) => {
	const t = ctx.getTransform();
	const w = ctx.canvas.width / (t.a || 1), h = ctx.canvas.height / (t.d || 1);
	let shiftX = settings.dx, shiftY = settings.dy;
	if (settings.keepOnScreen) {
		const ny = Math.min(Math.max(y + shiftY, TOP + MARGIN), h - BOTTOM - MARGIN);
		shiftY = ny - y;
		const nx = Math.min(Math.max(cx + shiftX, MARGIN), w - MARGIN);
		shiftX = nx - cx;
	}
	return { shiftX, shiftY };
};

ours.fillRect = function (x, y, w, h) {
	if (!isPlayfield(this.canvas)) return prev.fillRect.call(this, x, y, w, h);
	let s = frames.get(this);
	// the centre line: tells us where the bar is this frame
	if (w === 2 && h === 16) {
		const centre = y + 8;
		s = { ...(s || {}), y: centre, ...placement(this, x + 1, centre) };
		frames.set(this, s);
	}
	if (s && s.y !== undefined && (
		(h === 8 && near(y, s.y - 4))            // bands (drawn before the centre: last frame's position)
		|| (w === 2 && h === 16 && near(y, s.y - 8)) // centre
		|| (w === 2 && h === 20 && near(y, s.y - 10)) // hit ticks
	)) {
		return prev.fillRect.call(this, x + s.shiftX, y + s.shiftY, w, h);
	}
	return prev.fillRect.call(this, x, y, w, h);
};

// the mean arrow: a moveTo then two lineTo. The moveTo is only known to be the
// arrow once the lineTo arrives, so the path is restarted, shifted, at that point.
ours.moveTo = function (x, y) {
	const s = frames.get(this);
	if (s) s.lastMove = [x, y];
	return prev.moveTo.call(this, x, y);
};
ours.lineTo = function (x, y) {
	const s = frames.get(this);
	if (s && s.y !== undefined && near(y, s.y - 19)) {
		const m = s.lastMove;
		if (m && near(m[1], s.y - 12)) {
			this.beginPath();
			prev.moveTo.call(this, m[0] + s.shiftX, m[1] + s.shiftY);
			s.lastMove = null;
		}
		return prev.lineTo.call(this, x + s.shiftX, y + s.shiftY);
	}
	return prev.lineTo.call(this, x, y);
};

// ---------- settings panel ----------
const C = { bg: '#191622', sunken: '#221d2e', line: '#3d3550', ink: '#eceaf2', muted: '#9a92ae', accent: '#ff66ab' };
const el = (tag, css, text) => {
	const e = document.createElement(tag);
	if (css) e.style.cssText = css;
	if (text !== undefined) e.textContent = text;
	return e;
};

const slider = (label, key, min, max, describe) => {
	const wrap = el('label', `display:grid;gap:4px;font-size:12px;color:${C.muted}`);
	const text = el('span');
	const input = el('input', `width:100%;accent-color:${C.accent}`);
	input.type = 'range';
	input.min = String(min); input.max = String(max); input.step = '2';
	const show = () => { input.value = String(settings[key]); text.textContent = `${label}: ${describe(settings[key])}`; };
	input.addEventListener('input', () => { settings[key] = Number(input.value); save(); show(); });
	window.addEventListener('oss-idle-ur-bar', () => { load(); show(); }); // changed in the skin importer
	wrap.append(text, input);
	return { wrap, show };
};

const buildPanel = () => {
	panel = el('div', [
		'position:fixed', 'left:16px', 'bottom:16px', 'z-index:99000', // under the game's cursor (99999-100000)
		'display:none', 'flex-direction:column', 'gap:10px', 'width:260px',
		'padding:12px 14px', 'border-radius:10px', `background:${C.bg}`, `border:1px solid ${C.line}`,
		`color:${C.ink}`, 'font:13px system-ui,sans-serif', 'box-shadow:0 6px 24px rgba(0,0,0,.5)',
	].join(';'));
	panel.addEventListener('keydown', e => e.stopPropagation());

	const px = (v) => (v === 0 ? 'default' : `${Math.abs(v)}px`);
	const up = slider('Up / down', 'dy', -900, 300, v => (v === 0 ? 'default' : `${px(v)} ${v < 0 ? 'up' : 'down'}`));
	const side = slider('Left / right', 'dx', -600, 600, v => (v === 0 ? 'default' : `${px(v)} ${v < 0 ? 'left' : 'right'}`));

	const keep = el('label', 'display:flex;gap:8px;align-items:center;cursor:pointer');
	const box = el('input', `width:15px;height:15px;accent-color:${C.accent};cursor:pointer`);
	box.type = 'checkbox';
	box.checked = settings.keepOnScreen;
	box.addEventListener('change', () => { settings.keepOnScreen = box.checked; save(); });
	window.addEventListener('oss-idle-ur-bar', () => { box.checked = settings.keepOnScreen; });
	keep.append(box, el('span', '', 'Keep it on screen'));

	const reset = el('button', `font:600 12px system-ui,sans-serif;color:${C.ink};background:${C.sunken};border:1px solid ${C.line};border-radius:8px;padding:5px 10px;cursor:pointer;justify-self:start`, 'Reset position');
	reset.addEventListener('click', () => { settings.dx = 0; settings.dy = 0; save(); up.show(); side.show(); });

	up.show(); side.show();
	panel.append(
		el('div', `font-weight:600;color:${C.accent}`, 'UR bar'),
		up.wrap, side.wrap, keep, reset,
		el('div', `color:${C.muted};font-size:11px`, 'Changes show on the next frame. Alt+Shift+E to close.'),
	);
	document.body.append(panel);
};

let patched = false;
export const mount = () => {
	load();
	buildPanel();
	// the skin importer has this built in: if it's already moving the bar, let it
	if (!window.__ossIdleUrBar) {
		window.__ossIdleUrBar = 'ur-bar';
		patched = true;
		for (const name of NAMES) {
			prev[name] = proto[name];
			proto[name] = ours[name];
		}
	}
	onKey = (e) => {
		if (e.altKey && e.shiftKey && !e.ctrlKey && e.code === 'KeyE') {
			e.preventDefault();
			panel.style.display = panel.style.display === 'none' ? 'grid' : 'none';
		}
	};
	window.addEventListener('keydown', onKey, true);
};

export const unmount = () => {
	window.removeEventListener('keydown', onKey, true);
	if (patched) {
		for (const name of NAMES) {
			if (proto[name] === ours[name]) proto[name] = prev[name];
			else { settings = { dx: 0, dy: 0, keepOnScreen: false }; } // still wrapped by another add-on: go inert
		}
		if (window.__ossIdleUrBar === 'ur-bar') delete window.__ossIdleUrBar;
		patched = false;
	}
	panel?.remove();
	panel = undefined;
};

// oss!idle add-on: Upscroll
//
// Notes travel up toward receptors at the top of the screen instead of down.
// Only the playfield is flipped (columns, barlines, notes, receptors). The HUD
// stays the right way up, and the judgement, combo and skip text move to match.
//
// Ctrl+Shift+U turns upscroll on or off (remembered between sessions).
// It also applies to the gameplay preview in the skin screen.
// The Circle notes add-on has upscroll built in too and shares this setting;
// with both installed, only one of them flips the screen.  (version 0.2.0)

const STORAGE_KEY = 'oss-idle-upscroll';
const CANVAS_CLASSES = ['play__canvas', 'skin-preview__canvas'];

const proto = CanvasRenderingContext2D.prototype;
const original = {
	clearRect: proto.clearRect,
	fillText: proto.fillText,
	strokeRect: proto.strokeRect,
};

let enabled = true;
let flipsHere = false; // this add-on does the flipping (not Circle notes)
let onKey;
let toast;
let toastTimer;

// per-context frame state
const frames = new WeakMap();

const isPlayfield = (canvas) =>
	canvas && canvas.classList && CANVAS_CLASSES.some(c => canvas.classList.contains(c));

// mirror about the canvas's vertical middle, in device pixels
const flipFor = (canvas) => new DOMMatrix([1, 0, 0, -1, 0, canvas.height]);

const load = () => {
	try { return localStorage.getItem(STORAGE_KEY) !== '0'; } catch { return true; }
};
const save = () => {
	try { localStorage.setItem(STORAGE_KEY, enabled ? '1' : '0'); } catch {}
};
// switched in the Circle notes settings
const onChanged = () => { enabled = load(); };

// The game clears the canvas at the start of every frame. If upscroll is on,
// flip everything drawn after that, until the HUD starts.
function clearRect(x, y, w, h) {
	const canvas = this.canvas;
	if (!isPlayfield(canvas)) return original.clearRect.call(this, x, y, w, h);

	let state = frames.get(this);
	if (!state) frames.set(this, state = {});

	// work out the game's own transform, undoing our flip if it is still on
	let current = this.getTransform();
	if (state.phase === 'flipped') {
		current = flipFor(canvas).multiply(current);
		this.setTransform(current);
	}
	original.clearRect.call(this, x, y, w, h);

	state.phase = 'off';
	state.fieldLeft = Infinity;
	state.fieldRight = -Infinity;
	if (!enabled || !flipsHere) return;

	state.base = current;
	state.height = canvas.height / (current.d || 1); // canvas height in CSS px
	this.setTransform(flipFor(canvas).multiply(current));
	state.phase = 'flipped';
}

// The receptors are the last thing drawn before the HUD. Their outlines give
// the playfield's edges, used to find the text that belongs over it.
function strokeRect(x, y, w, h) {
	const state = frames.get(this);
	if (state && state.phase === 'flipped') {
		state.fieldLeft = Math.min(state.fieldLeft, x);
		state.fieldRight = Math.max(state.fieldRight, x + w);
	}
	return original.strokeRect.call(this, x, y, w, h);
}

// The HUD's first draw is always text. From there on, draw unflipped, and
// mirror the text centred on the playfield (judgement, combo, skip prompt).
function fillText(text, x, y, maxWidth) {
	const state = frames.get(this);
	if (state && state.phase === 'flipped') {
		this.setTransform(state.base);
		state.phase = 'hud';
	}
	if (state && state.phase === 'hud' && this.textAlign === 'center' && state.fieldRight > state.fieldLeft) {
		const centre = (state.fieldLeft + state.fieldRight) / 2;
		if (Math.abs(x - centre) < 2) y = state.height - y;
	}
	return maxWidth === undefined
		? original.fillText.call(this, text, x, y)
		: original.fillText.call(this, text, x, y, maxWidth);
}

const showToast = (message) => {
	if (!toast) {
		toast = document.createElement('div');
		toast.style.cssText = [
			'position:fixed', 'left:50%', 'top:24px', 'transform:translateX(-50%)',
			'z-index:99000', 'pointer-events:none', // under the game's cursor (99999-100000), above its menus
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
	toastTimer = setTimeout(() => { toast.style.opacity = '0'; }, 1400);
};

let patched = false;
export const mount = () => {
	enabled = load();
	save(); // so Circle notes shows the same setting
	// only one add-on may flip the screen, or two flips cancel out
	flipsHere = !window.__ossIdleUpscroll;
	if (flipsHere) {
		window.__ossIdleUpscroll = 'upscroll';
		original.clearRect = proto.clearRect;
		original.fillText = proto.fillText;
		original.strokeRect = proto.strokeRect;
		proto.clearRect = clearRect;
		proto.fillText = fillText;
		proto.strokeRect = strokeRect;
		patched = true;
	}
	window.addEventListener('oss-idle-upscroll', onChanged);

	onKey = (e) => {
		if (e.ctrlKey && e.shiftKey && !e.altKey && e.code === 'KeyU') {
			e.preventDefault();
			enabled = !enabled;
			save();
			window.dispatchEvent(new Event('oss-idle-upscroll'));
			showToast(enabled ? 'Upscroll on' : 'Upscroll off (downscroll)');
		}
	};
	window.addEventListener('keydown', onKey);
};

export const unmount = () => {
	window.removeEventListener('keydown', onKey);
	window.removeEventListener('oss-idle-upscroll', onChanged);
	if (patched) {
		// put back what was there, unless another add-on has wrapped ours since
		const ours = { clearRect, fillText, strokeRect };
		for (const name of Object.keys(ours)) {
			if (proto[name] === ours[name]) proto[name] = original[name];
			else flipsHere = false; // still wrapped by someone else: switch ourselves off
		}
		if (window.__ossIdleUpscroll === 'upscroll') delete window.__ossIdleUpscroll;
		patched = false;
	}
	clearTimeout(toastTimer);
	toast?.remove();
	toast = undefined;
};

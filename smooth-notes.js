// oss!idle add-on: smooth notes
//
// Makes notes scroll smoothly at high frame rates.
// During a song the game places notes using the audio clock, which only moves
// forward in steps of a few milliseconds (each time a chunk of sound is sent out).
// At 60 FPS you never see it, but at 200+ FPS several frames in a row get the same
// time, so the notes stop, then jump. This fills in the time between the steps
// from the system clock, staying within one step of the audio so timing and
// judgements are unchanged.
//
// Alt+Shift+N turns it off and on, to compare (remembered between sessions).

const STORAGE_KEY = 'oss-idle-smooth-notes';
const MAX_AHEAD = 0.025; // never run more than 25 ms past the last audio time (s)

const proto = (window.BaseAudioContext || window.AudioContext).prototype;
let original; // the browser's currentTime getter
let ours;
let enabled = true;
let onKey, toast, toastTimer;

const state = new WeakMap(); // context -> { real, at, out }

const smoothed = function () {
	const real = original.get.call(this);
	if (!enabled || this.state !== 'running') return real;
	const now = performance.now() / 1000;
	let s = state.get(this);
	if (!s) {
		s = { real, at: now, out: real };
		state.set(this, s);
		return real;
	}
	if (real !== s.real) {
		// the audio clock moved on: start counting from here
		s.real = real;
		s.at = now;
	}
	let out = s.real + Math.min(now - s.at, MAX_AHEAD);
	// never step backwards (when the audio clock lands a little behind our guess)
	if (out < s.out && s.out - out < MAX_AHEAD) out = s.out;
	s.out = out;
	return out;
};

const load = () => {
	try { enabled = localStorage.getItem(STORAGE_KEY) !== '0'; } catch {}
};
const save = () => {
	try { localStorage.setItem(STORAGE_KEY, enabled ? '1' : '0'); } catch {}
};

const showToast = (text) => {
	if (!toast) {
		toast = document.createElement('div');
		toast.style.cssText = [
			'position:fixed', 'left:50%', 'top:24px', 'transform:translateX(-50%)',
			'z-index:99000', 'pointer-events:none', // under the game's cursor
			'padding:8px 14px', 'border-radius:8px', 'background:#191622', 'border:1px solid #3d3550',
			'color:#eceaf2', 'font:600 13px system-ui,sans-serif', 'box-shadow:0 6px 24px rgba(0,0,0,.5)',
		].join(';');
		document.body.append(toast);
	}
	toast.textContent = text;
	toast.style.display = 'block';
	clearTimeout(toastTimer);
	toastTimer = setTimeout(() => { if (toast) toast.style.display = 'none'; }, 1500);
};

export const mount = () => {
	load();
	original = Object.getOwnPropertyDescriptor(proto, 'currentTime');
	ours = { configurable: true, enumerable: original.enumerable, get: smoothed };
	Object.defineProperty(proto, 'currentTime', ours);

	onKey = (e) => {
		if (e.altKey && e.shiftKey && !e.ctrlKey && e.code === 'KeyN') {
			e.preventDefault();
			enabled = !enabled;
			save();
			showToast(`Smooth notes: ${enabled ? 'on' : 'off'}`);
		}
	};
	window.addEventListener('keydown', onKey, true);
};

export const unmount = () => {
	window.removeEventListener('keydown', onKey, true);
	const now = Object.getOwnPropertyDescriptor(proto, 'currentTime');
	if (now && now.get === smoothed) Object.defineProperty(proto, 'currentTime', original);
	else enabled = false; // something else wrapped it after us: just go inert
	clearTimeout(toastTimer);
	toast?.remove();
	toast = undefined;
};

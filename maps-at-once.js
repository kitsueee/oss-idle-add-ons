// oss!idle add-on: "Maps at once" slider for oss!idle sim
//
// oss!idle sim runs (reported CPU cores - 1) maps at once, capped at 8.
// This add-on changes the core count the page reports, so the sim runs
// the number of maps you pick. The game itself never reads this value.
//
// Press Ctrl+Shift+M to show or hide the slider. Changes apply to the next scan.

const STORAGE_KEY = 'oss-idle-sim-maps-at-once';
const SIM_CAP = 8; // the sim never runs more than 8 maps at once

// read the real value from the prototype, past our own override
const realCores = () =>
	Reflect.get(Object.getPrototypeOf(navigator), 'hardwareConcurrency', navigator) || 2;

const maxMaps = () => Math.max(1, Math.min(realCores(), SIM_CAP));
const autoMaps = () => Math.max(1, Math.min(realCores() - 1, SIM_CAP));

const load = () => {
	try { return Number(localStorage.getItem(STORAGE_KEY)) || 0; } catch { return 0; }
};
const save = (n) => {
	try { n ? localStorage.setItem(STORAGE_KEY, String(n)) : localStorage.removeItem(STORAGE_KEY); } catch {}
};

// 0 = auto (the sim's normal behaviour)
let chosen = 0;

const apply = () => {
	if (chosen > 0) {
		const n = Math.min(chosen, maxMaps());
		// the sim uses cores - 1, so report one more than the maps wanted
		Object.defineProperty(navigator, 'hardwareConcurrency', {
			configurable: true,
			get: () => n + 1,
		});
	} else {
		delete navigator.hardwareConcurrency; // back to the real value
	}
};

let panel, label, slider, autoBtn, onKey;

const render = () => {
	const shown = chosen > 0 ? Math.min(chosen, maxMaps()) : autoMaps();
	slider.value = String(shown);
	label.textContent = chosen > 0 ? `Maps at once: ${shown}` : `Maps at once: ${shown} (auto)`;
	autoBtn.disabled = chosen === 0;
	autoBtn.style.opacity = chosen === 0 ? '0.4' : '1';
};

const build = () => {
	panel = document.createElement('div');
	panel.style.cssText = [
		'position:fixed', 'left:16px', 'bottom:16px', 'z-index:99000', // under the game's cursor (99999-100000), above its menus
		'display:none', 'flex-direction:column', 'gap:8px',
		'padding:12px 14px', 'border-radius:10px',
		'background:#191622', 'border:1px solid #3d3550', 'color:#eceaf2',
		'font:12px system-ui,sans-serif', 'box-shadow:0 6px 24px rgba(0,0,0,.5)',
	].join(';');

	const title = document.createElement('div');
	title.textContent = 'oss!idle sim';
	title.style.cssText = 'font-weight:600;color:#b98cff';

	label = document.createElement('div');

	const row = document.createElement('div');
	row.style.cssText = 'display:flex;align-items:center;gap:8px';

	slider = document.createElement('input');
	slider.type = 'range';
	slider.min = '1';
	slider.max = String(maxMaps());
	slider.step = '1';
	slider.style.cssText = 'width:150px;accent-color:#b98cff';
	slider.addEventListener('input', () => {
		chosen = Number(slider.value);
		save(chosen);
		apply();
		render();
	});

	autoBtn = document.createElement('button');
	autoBtn.textContent = 'Auto';
	autoBtn.style.cssText = 'font:inherit;color:#eceaf2;background:#221d2e;border:1px solid #3d3550;border-radius:6px;padding:3px 10px;cursor:pointer';
	autoBtn.addEventListener('click', () => {
		chosen = 0;
		save(0);
		apply();
		render();
	});

	const hint = document.createElement('div');
	hint.textContent = 'Applies to the next scan. Lower it if the game stutters. Ctrl+Shift+M to hide.';
	hint.style.cssText = 'color:#9a92ae;font-size:11px;max-width:220px';

	row.append(slider, autoBtn);
	panel.append(title, label, row, hint);
	document.body.append(panel);
};

export const mount = () => {
	chosen = load();
	apply();
	build();
	render();

	onKey = (e) => {
		if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'm') {
			e.preventDefault();
			panel.style.display = panel.style.display === 'none' ? 'flex' : 'none';
		}
	};
	window.addEventListener('keydown', onKey);
};

export const unmount = () => {
	window.removeEventListener('keydown', onKey);
	panel?.remove();
	delete navigator.hardwareConcurrency; // leave the real value behind
};

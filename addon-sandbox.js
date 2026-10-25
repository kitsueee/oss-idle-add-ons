// oss!idle add-on: add-on sandbox  (version 0.1.0)
//
// Copyright (c) 2026 YOUR NAME. Released under the MIT License: free to use, copy, change
// and share, as long as this notice stays in; it comes with no warranty.
//
// Try an add-on without installing it: press Alt+Shift+T for a box, paste an add-on's code
// (anything with `export const mount` / `unmount`), and press Run. Stop undoes it. Change the
// code and press Run again to test the change. Your code is kept between visits.

const KEY = 'oss-idle-sandbox-code';
const AUTO = 'oss-idle-sandbox-auto';
const ID = 'oss-sandbox-panel';

let panel = null, running = null, url = null;
const read = (k) => { try { return localStorage.getItem(k) || ''; } catch { return ''; } };
const write = (k, v) => { try { localStorage.setItem(k, v); } catch { /* fine */ } };

const stop = (say) => {
	if (running) {
		try { running.unmount?.(); } catch (e) { say?.(`It stopped, but its unmount had an error: ${e.message || e}`, true); return; }
		running = null;
	}
	if (url) { URL.revokeObjectURL(url); url = null; }
	say?.('Stopped.');
};

const run = async (code, say) => {
	stop();
	try {
		url = URL.createObjectURL(new Blob([code], { type: 'text/javascript' }));
		const mod = await import(/* @vite-ignore */ url);
		if (typeof mod.mount !== 'function') { say('No `export const mount` found in that code.', true); return; }
		await mod.mount();
		running = mod;
		say('Running. Edit the code and press Run again to try a change.');
	} catch (e) {
		running = null;
		say(`Error: ${e.message || e}`, true);
	}
};

const build = () => {
	const p = document.createElement('div');
	p.id = ID;
	p.style.cssText = 'position:fixed;z-index:2147483000;right:16px;bottom:16px;width:min(560px,calc(100vw - 32px));display:flex;flex-direction:column;gap:6px;padding:10px;border-radius:12px;background:#1b1519;color:#fff;font:13px system-ui,sans-serif;box-shadow:0 10px 34px rgba(0,0,0,.6)';
	const ta = document.createElement('textarea');
	ta.value = read(KEY);
	ta.placeholder = 'Paste an add-on here (export const mount = () => {...}; export const unmount = () => {...})';
	ta.spellcheck = false;
	ta.style.cssText = 'height:260px;resize:vertical;padding:8px;border:0;border-radius:8px;background:#0e0b0d;color:#fff;font:12px/1.4 ui-monospace,Consolas,monospace;tab-size:2;outline:none';
	const msg = document.createElement('div');
	msg.style.cssText = 'min-height:16px;font-size:12px;color:rgba(255,255,255,.7);white-space:pre-wrap';
	const say = (t, bad) => { msg.textContent = t; msg.style.color = bad ? '#ff7a7a' : 'rgba(255,255,255,.7)'; };
	const row = document.createElement('div');
	row.style.cssText = 'display:flex;gap:6px;align-items:center';
	const btn = (label, fn, hot) => {
		const b = document.createElement('button');
		b.type = 'button';
		b.textContent = label;
		b.style.cssText = `height:28px;padding:0 14px;border:0;border-radius:999px;background:${hot ? '#ff66ab' : '#3a3036'};color:#fff;font-size:12px;font-weight:600;cursor:pointer`;
		b.addEventListener('click', fn);
		return b;
	};
	const auto = document.createElement('label');
	auto.style.cssText = 'margin-left:auto;display:flex;gap:6px;align-items:center;font-size:12px;color:rgba(255,255,255,.7);cursor:pointer';
	const cb = document.createElement('input');
	cb.type = 'checkbox';
	cb.checked = read(AUTO) === '1';
	cb.addEventListener('change', () => write(AUTO, cb.checked ? '1' : '0'));
	auto.append(cb, 'Run when the game opens');
	ta.addEventListener('input', () => write(KEY, ta.value));
	for (const t of ['keydown', 'keyup', 'keypress']) ta.addEventListener(t, (e) => {
		e.stopPropagation(); // the game's shortcuts stay out of the box
		if (t === 'keydown' && e.key === 'Tab') { e.preventDefault(); document.execCommand('insertText', false, '\t'); }
		if (t === 'keydown' && e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); run(ta.value, say); }
	});
	row.append(btn('Run  (Ctrl+Enter)', () => run(ta.value, say), true), btn('Stop', () => stop(say)), btn('Hide', () => hide()), auto);
	p.append(ta, row, msg);
	p.addEventListener('keydown', e => e.stopPropagation());
	return { p, say };
};

const show = () => {
	if (panel) return;
	const b = build();
	panel = b;
	document.body.append(b.p);
	b.p.querySelector('textarea').focus();
};
const hide = () => { panel?.p.remove(); panel = null; };
const onKey = (e) => {
	if (e.altKey && e.shiftKey && e.code === 'KeyT') { e.preventDefault(); if (panel) hide(); else show(); }
};

export const mount = () => {
	document.addEventListener('keydown', onKey, true);
	if (read(AUTO) === '1' && read(KEY)) run(read(KEY), () => {});
};

export const unmount = () => {
	document.removeEventListener('keydown', onKey, true);
	stop();
	hide();
};

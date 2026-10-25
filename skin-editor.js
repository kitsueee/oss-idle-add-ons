// oss!idle add-on: skin editor  (version 0.33.0)
//
// Copyright (c) 2026 YOUR NAME. Released under the MIT License: free to use, copy, change
// and share, as long as this notice stays in; it comes with no warranty.
// The live judgement counter in it is based on applepie's judgement counter add-on.
//
// Adds an osu!mania skin (.osk, or one from your osu! Skins folder) to the game's own
// skins, which the game draws itself since 1.2.4, and switches to it, right in the game.
// The Skins folder is remembered, so next time the list is there straight away and only
// the skin you pick is read. Everything is read on your computer; nothing is uploaded.
// Before it goes in you can change the column width, receptor position and upscroll (written into the skin's skin.ini), and leave out its notes,
// keys, stage, judgements, health bar, grades or hitsounds (the game then uses its own).
// A skin you drop in or pick is used right away, and from then on changes show in game live.
// The combo, judgements, UR bar and health bar can be grabbed and moved in the preview.
// Also: applepie's live
// judgement counter (in the skin's judgement colours); a switch for map hitsounds; a
// live preview with a map that plays itself behind the editor; and versus John.
// The look follows osu!lazer's when the lazer look add-on is on.
// Open it from Options → Skin → "Skin editor" (with a map that plays itself
// behind it), by right-clicking the logo, or with Alt+Shift+S (which can be
// switched off in Options). Versus John's settings are in Options → Gameplay.

const JUDGEMENTS = ['DIVINE', 'MARVELOUS', 'PERFECT', 'GREAT', 'GOOD', 'BAD', 'MISS'];
const JUDGE_SOURCE = { DIVINE: 'Hit300g', MARVELOUS: 'Hit300g', PERFECT: 'Hit300', GREAT: 'Hit200', GOOD: 'Hit100', BAD: 'Hit50', MISS: 'Hit0' };
const JUDGE_FILE = { Hit300g: 'mania-hit300g', Hit300: 'mania-hit300', Hit200: 'mania-hit200', Hit100: 'mania-hit100', Hit50: 'mania-hit50', Hit0: 'mania-hit0' };
const JUDGE_DEFAULT_COLOR = { DIVINE: '#a8f0ff', MARVELOUS: '#ffe88a', PERFECT: '#ffd24a', GREAT: '#6fe07a', GOOD: '#4aa6ff', BAD: '#b06bd6', MISS: '#ff5a72' };
const GRADE_SOURCE = { XX: 'ranking-XH', X: 'ranking-X', SS: 'ranking-X', S: 'ranking-S', A: 'ranking-A', B: 'ranking-B', C: 'ranking-C', D: 'ranking-D' };
const NOTE_FILES = ['mania-note1', 'mania-note2', 'mania-note2', 'mania-note1'];
const KEY_FILES = ['mania-key1', 'mania-key2', 'mania-key2', 'mania-key1'];
const STAGE_PARTS = {
	left: ['stageleft', 'mania-stage-left'],
	right: ['stageright', 'mania-stage-right'],
	bottom: ['stagebottom', 'mania-stage-bottom'],
	hint: ['stagehint', 'mania-stage-hint'],
};
const keyHeight = (img, colW, screenH) => (img.osuH ? img.osuH * screenH / 768 : colW * img.height / img.width);

const RAW = (() => {
	const P = CanvasRenderingContext2D.prototype;
	return { drawImage: P.drawImage, arc: P.arc, lineTo: P.lineTo, scale: P.scale };
})();
const rawDrawImage = (ctx, ...a) => RAW.drawImage.apply(ctx, a);
const rawArc = (ctx, ...a) => RAW.arc.apply(ctx, a);
const rawLineTo = (ctx, x, y) => RAW.lineTo.call(ctx, x, y);
const rawScale = (ctx, x, y) => RAW.scale.call(ctx, x, y);

const frameAt = (img, speed = 1) => (img && typeof img === 'object' && img.frames && img.frames.length > 1
	? img.frames[Math.floor(performance.now() * img.fps * speed / 1000) % img.frames.length]
	: img);

const noteFrameAt = (img, elapsed, speed = 1) => (img && typeof img === 'object' && img.frames && img.frames.length > 1
	? img.frames[Math.floor(Math.max(0, elapsed) * img.fps * speed / 1000) % img.frames.length]
	: img);
const DEFAULT_SCROLL_MS = 11485 / 16;

const STAGE_REFERENCE_H = 480;

const drawStage = (ctx, part, x0, fieldW, lineY, H, only = ['left', 'right', 'bottom', 'hint'], scale = 1) => {
	const k = H / STAGE_REFERENCE_H * scale;
	const get = (name) => { const p = only.includes(name) && part(name); return p && p !== 'blank' ? p : null; };
	const left = get('left'), right = get('right'), bottom = get('bottom'), hint = get('hint');
	if (left) ctx.drawImage(left.img, x0 - left.w * k, 0, left.w * k, H);
	if (right) ctx.drawImage(right.img, x0 + fieldW, 0, right.w * k, H);
	if (bottom) {
		const w = bottom.w * k, h = bottom.h * k;
		ctx.drawImage(bottom.img, x0 + fieldW / 2 - w / 2, H - h, w, h);
	}
	if (hint) {
		const h = hint.h * k;
		ctx.drawImage(hint.img, x0, lineY - h / 2, fieldW, h);
	}
};

const IMAGE_KINDS = {
	note: { ini: c => `noteimage${c}`, file: c => NOTE_FILES[c], maxW: 128, maxH: 256 },
	head: { ini: c => `noteimage${c}h`, file: c => `${NOTE_FILES[c]}H`, maxW: 128, maxH: 256 },
	body: { ini: c => `noteimage${c}l`, file: c => `${NOTE_FILES[c]}L`, maxW: 128, maxH: 512 },
	tail: { ini: c => `noteimage${c}t`, file: c => `${NOTE_FILES[c]}T`, maxW: 128, maxH: 256 },
	key: { ini: c => `keyimage${c}`, file: c => KEY_FILES[c], maxW: 128, maxH: 768 },
	keyDown: { ini: c => `keyimage${c}d`, file: c => `${KEY_FILES[c]}D`, maxW: 128, maxH: 768 },
};
const DEFAULT_COLORS = ['#e8e8f0', '#63b3ff', '#63b3ff', '#e8e8f0'];
const HITSOUND_KEY = 'default/normal-hitnormal';
const MIN_HIT_POSITION = 100;

// two looks: osu!lazer's (when the lazer look add-on is on) and the editor's own
const LAZER_C = {
	bg: '#271f23', sunken: '#1a1517', line: '#3d3236', control: '#3d3236', ink: '#ffffff', muted: '#a89ca2',
	accent: '#ff66ab', warn: '#ffcc22', ok: '#88da20',
};
const CLASSIC_C = {
	bg: '#191622', sunken: '#221d2e', line: '#3d3550', control: '#221d2e', ink: '#eceaf2', muted: '#9a92ae',
	accent: '#ff66ab', warn: '#ffbe5c', ok: '#6fd99a',
};
const lazerWanted = () => !!window.__ossIdleLazerUi;
let lazerLook = lazerWanted();
const C = { ...(lazerLook ? LAZER_C : CLASSIC_C) };
// lazer's look in the panel: its font (when the lazer look add-on loaded it, else the game's), switches and sliders
let UI_FONT = lazerLook ? '"Outfit","Exo 2",system-ui,sans-serif' : 'system-ui,-apple-system,"Segoe UI",sans-serif';
const PANEL_CSS = `
.ssi-lz input[type=checkbox]{appearance:none;-webkit-appearance:none;position:relative;flex-shrink:0;width:34px !important;height:18px !important;margin:0;border:2px solid ${C.accent};border-radius:999px;background:transparent;cursor:pointer;transition:background .15s}
.ssi-lz input[type=checkbox]::before{content:"";position:absolute;top:2px;left:2px;width:10px;height:10px;border-radius:50%;background:${C.accent};transition:transform .15s,background .15s}
.ssi-lz input[type=checkbox]:checked{background:${C.accent}}
.ssi-lz input[type=checkbox]:checked::before{background:#fff;transform:translateX(16px)}
.ssi-lz input[type=range]{appearance:none;-webkit-appearance:none;height:4px;margin:8px 0;border-radius:2px;cursor:pointer;
 background:linear-gradient(to right,${C.accent} var(--fill,50%),rgba(255,102,171,.25) var(--fill,50%))}
.ssi-lz input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:26px;height:14px;border-radius:7px;background:${C.bg};border:3px solid ${C.accent}}
.ssi-lz select,.ssi-lz input[type=text]{outline:none}
.ssi-lz button:hover{filter:brightness(1.15)}
.ssi-lz ::-webkit-scrollbar{width:6px}.ssi-lz ::-webkit-scrollbar-thumb{background:rgba(255,255,255,.2);border-radius:3px}
`;
/** Sliders show their filled part, lazer-style. */
const syncFills = () => {
	if (!panel) return;
	for (const r of panel.querySelectorAll('input[type=range]')) {
		const min = Number(r.min) || 0, max = Number(r.max) || 100;
		r.style.setProperty('--fill', `${((Number(r.value) - min) / (max - min || 1)) * 100}%`);
	}
};

const readZip = async (file) => {
	const buf = new Uint8Array(await file.arrayBuffer());
	const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
	let end = -1;
	for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65557); i--) {
		if (dv.getUint32(i, true) === 0x06054b50) { end = i; break; }
	}
	if (end < 0) throw new Error('this is not a zip or .osk file');

	const count = dv.getUint16(end + 10, true);
	let p = dv.getUint32(end + 16, true);
	const utf8 = new TextDecoder();
	const entries = new Map();
	for (let n = 0; n < count && dv.getUint32(p, true) === 0x02014b50; n++) {
		const method = dv.getUint16(p + 10, true);
		const size = dv.getUint32(p + 20, true);
		const nameLen = dv.getUint16(p + 28, true);
		const extraLen = dv.getUint16(p + 30, true);
		const commentLen = dv.getUint16(p + 32, true);
		const local = dv.getUint32(p + 42, true);
		const name = utf8.decode(buf.subarray(p + 46, p + 46 + nameLen));
		p += 46 + nameLen + extraLen + commentLen;
		if (!name.endsWith('/')) entries.set(name, { method, size, local });
	}

	const read = async (name) => {
		const e = entries.get(name);
		const start = e.local + 30 + dv.getUint16(e.local + 26, true) + dv.getUint16(e.local + 28, true);
		const data = buf.subarray(start, start + e.size);
		if (e.method === 0) return data.slice();
		if (e.method !== 8) throw new Error(`${name} uses a compression this editor can't read`);
		const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
		return new Uint8Array(await new Response(stream).arrayBuffer());
	};
	return { names: [...entries.keys()], read };
};

const skinsInFolder = (fileList) => {
	const files = [...fileList].filter(f => f.webkitRelativePath);
	const rel = (f) => f.webkitRelativePath.split('/').slice(1).join('/'); // drop the picked folder's own name
	const root = files.length ? files[0].webkitRelativePath.split('/')[0] : '';
	const asSource = (list, strip) => {
		const byName = new Map(list.map(f => [rel(f).slice(strip.length), f]));
		return { names: [...byName.keys()], read: async (name) => new Uint8Array(await byName.get(name).arrayBuffer()) };
	};

	if (files.some(f => rel(f).toLowerCase() === 'skin.ini')) {
		return [{ name: root, source: asSource(files, '') }];
	}
	const groups = new Map();
	for (const f of files) {
		const parts = rel(f).split('/');
		if (parts.length < 2) continue; // loose files next to the skin folders
		if (!groups.has(parts[0])) groups.set(parts[0], []);
		groups.get(parts[0]).push(f);
	}
	return [...groups.entries()]
		.filter(([, list]) => list.some(f => /\.(png|ini)$/i.test(f.name)))
		.map(([name, list]) => ({ name, source: asSource(list, name + '/') }))
		.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
};

const canRemember = typeof window.showDirectoryPicker === 'function';
const PICKER_KEY = 'oss-idle-skin-importer-picker';
const useNewPicker = () => {
	try { return canRemember && localStorage.getItem(PICKER_KEY) !== 'old'; } catch { return canRemember; }
};
const useOldPicker = () => {
	try { localStorage.setItem(PICKER_KEY, 'old'); } catch {}
};
const FOLDER_DB = 'oss-idle-skin-importer', FOLDER_STORE = 'folders', FOLDER_KEY = 'skins';
const LIST_KEY = 'oss-idle-skin-importer-folder';

const folderDb = () => new Promise((resolve, reject) => {
	const req = indexedDB.open(FOLDER_DB, 1);
	req.onupgradeneeded = () => req.result.createObjectStore(FOLDER_STORE);
	req.onsuccess = () => resolve(req.result);
	req.onerror = () => reject(req.error);
});
const folderDo = async (mode, fn) => {
	const db = await folderDb();
	try {
		return await new Promise((resolve, reject) => {
			const req = fn(db.transaction(FOLDER_STORE, mode).objectStore(FOLDER_STORE));
			req.onsuccess = () => resolve(req.result);
			req.onerror = () => reject(req.error);
		});
	} finally { db.close(); }
};
const savedFolder = () => folderDo('readonly', st => st.get(FOLDER_KEY)).catch(() => undefined);
const saveFolder = (handle) => folderDo('readwrite', st => st.put(handle, FOLDER_KEY));
const forgetFolder = () => folderDo('readwrite', st => st.delete(FOLDER_KEY)).catch(() => {});

const savedList = () => {
	try { return JSON.parse(localStorage.getItem(LIST_KEY) || 'null'); } catch { return null; }
};
const saveList = (list) => {
	try { localStorage.setItem(LIST_KEY, JSON.stringify(list)); } catch {}
};

const allowed = async (handle, ask) => {
	if (typeof handle.queryPermission !== 'function') return true; // a dropped folder: readable this session
	try {
		if (await handle.queryPermission({ mode: 'read' }) === 'granted') return true;
		return ask && await handle.requestPermission({ mode: 'read' }) === 'granted';
	} catch { return false; }
};

const sourceFromDir = async (dir) => {
	const handles = new Map();
	const walk = async (d, prefix, depth) => {
		for await (const [name, h] of d.entries()) {
			if (h.kind === 'file') handles.set(prefix + name, h);
			else if (depth < 3) await walk(h, `${prefix}${name}/`, depth + 1);
		}
	};
	await walk(dir, '', 0);
	return {
		names: [...handles.keys()],
		read: async (name) => new Uint8Array(await (await handles.get(name).getFile()).arrayBuffer()),
	};
};

// A folder dropped on the page, where the browser can't hand over a folder it can
// keep: its entries, read only when needed, made to look like a kept folder.
const entryHandle = (entry) => (entry.isDirectory ? {
	kind: 'directory',
	name: entry.name,
	async *entries() {
		const reader = entry.createReader();
		for (;;) {
			const batch = await new Promise((resolve, reject) => reader.readEntries(resolve, reject));
			if (!batch.length) return;
			for (const e of batch) yield [e.name, entryHandle(e)];
		}
	},
	getFileHandle: (n) => new Promise((resolve, reject) => entry.getFile(n, {}, e => resolve(entryHandle(e)), reject)),
	getDirectoryHandle: (n) => new Promise((resolve, reject) => entry.getDirectory(n, {}, e => resolve(entryHandle(e)), reject)),
} : {
	kind: 'file',
	name: entry.name,
	getFile: () => new Promise((resolve, reject) => entry.file(resolve, reject)),
});

const listFolder = async (root) => {
	const skins = [];
	let self = false;
	for await (const [name, h] of root.entries()) {
		if (h.kind === 'file' && name.toLowerCase() === 'skin.ini') self = true;
		if (h.kind === 'directory') skins.push({ name, entry: name, kind: 'dir' });
		else if (/\.osk$/i.test(name)) skins.push({ name: name.replace(/\.osk$/i, ''), entry: name, kind: 'osk' });
	}
	if (self) return { folder: root.name, skins: [{ name: root.name, entry: '', kind: 'self' }] };
	skins.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
	return { folder: root.name, skins };
};

const openListed = async (root, item) => {
	if (item.kind === 'self') return sourceFromDir(root);
	if (item.kind === 'osk') return readZip(await (await root.getFileHandle(item.entry)).getFile());
	return sourceFromDir(await root.getDirectoryHandle(item.entry));
};

const hex2 = (n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
const toHex = (r, g, b) => `#${hex2(r)}${hex2(g)}${hex2(b)}`;

const loadImage = (bytes) => new Promise((resolve, reject) => {
	const url = URL.createObjectURL(new Blob([bytes], { type: 'image/png' }));
	const img = new Image();
	img.onload = () => resolve(img);
	img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('unreadable image')); };
	img.src = url;
});

const dominantColor = (img) => {
	const scale = Math.min(1, 64 / Math.max(img.width, img.height));
	const w = Math.max(1, Math.round(img.width * scale)), h = Math.max(1, Math.round(img.height * scale));
	const c = document.createElement('canvas');
	c.width = w; c.height = h;
	const ctx = c.getContext('2d', { willReadFrequently: true });
	ctx.drawImage(img, 0, 0, w, h);
	const data = ctx.getImageData(0, 0, w, h).data;
	const buckets = new Map();
	for (let i = 0; i < data.length; i += 4) {
		const a = data[i + 3];
		if (a < 160) continue;
		const r = data[i], g = data[i + 1], b = data[i + 2];
		const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
		if (mx < 28) continue; // black outlines and shadows
		const sat = (mx - mn) / mx;
		const key = (r >> 4) << 8 | (g >> 4) << 4 | (b >> 4);
		const weight = (a / 255) * (0.35 + sat);
		const e = buckets.get(key) || { w: 0, r: 0, g: 0, b: 0 };
		e.w += weight; e.r += r * weight; e.g += g * weight; e.b += b * weight;
		buckets.set(key, e);
	}
	let best = null;
	for (const e of buckets.values()) if (!best || e.w > best.w) best = e;
	return best ? toHex(best.r / best.w, best.g / best.w, best.b / best.w) : null;
};

const shrinkToDataUrl = (img, maxH) => {
	const scale = Math.min(1, maxH / img.height);
	const c = document.createElement('canvas');
	c.width = Math.max(1, Math.round(img.width * scale));
	c.height = Math.max(1, Math.round(img.height * scale));
	c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
	return new Promise(resolve => c.toBlob(resolve, 'image/png')).then(b => bytesToDataUrl(b, 'image/png'));
};

// The image at its size for the game, and (later) as a small file to save.
// Encoding happens off the page's thread, many at once, instead of one by one.
const shrinkFit = (img, maxW, maxH) => {
	const scale = Math.min(1, maxW / img.width, maxH / img.height);
	const c = document.createElement('canvas');
	c.width = Math.max(1, Math.round(img.width * scale));
	c.height = Math.max(1, Math.round(img.height * scale));
	c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
	const blobOf = (type, q) => new Promise(resolve => c.toBlob(resolve, type, q));
	const url = (async () => {
		let blob = await blobOf('image/webp', 0.92);
		if (!blob || blob.type !== 'image/webp') blob = await blobOf('image/png');
		return bytesToDataUrl(blob, blob.type);
	})();
	return { canvas: c, url };
};

const isBlank = (img) => {
	const w = Math.max(1, Math.min(64, img.width)), h = Math.max(1, Math.min(64, img.height));
	const c = document.createElement('canvas');
	c.width = w; c.height = h;
	const ctx = c.getContext('2d', { willReadFrequently: true });
	ctx.drawImage(img, 0, 0, w, h);
	const d = ctx.getImageData(0, 0, w, h).data;
	for (let i = 3; i < d.length; i += 4) if (d[i] > 8) return false;
	return true;
};

const bytesToDataUrl = (bytes, type) => new Promise((resolve, reject) => {
	const r = new FileReader();
	r.onload = () => resolve(r.result);
	r.onerror = () => reject(r.error);
	r.readAsDataURL(new Blob([bytes], { type }));
});

const silentWav = () => {
	const samples = 64, rate = 22050;
	const buf = new ArrayBuffer(44 + samples * 2), v = new DataView(buf);
	const str = (o, s) => [...s].forEach((ch, i) => v.setUint8(o + i, ch.charCodeAt(0)));
	str(0, 'RIFF'); v.setUint32(4, 36 + samples * 2, true); str(8, 'WAVE');
	str(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
	v.setUint32(24, rate, true); v.setUint32(28, rate * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
	str(36, 'data'); v.setUint32(40, samples * 2, true);
	let bin = '';
	new Uint8Array(buf).forEach(b => { bin += String.fromCharCode(b); });
	return 'data:audio/wav;base64,' + btoa(bin);
};

const parseIni = (text) => {
	const sections = [];
	let cur = null;
	for (let line of text.replace(/^\uFEFF/, '').split(/\r?\n/)) {
		line = line.replace(/\s*\/\/.*$/, '').trim();
		if (!line) continue;
		const sec = line.match(/^\[(.+)\]$/);
		if (sec) { cur = { name: sec[1].trim().toLowerCase(), values: {} }; sections.push(cur); continue; }
		const kv = line.match(/^([^:]+):(.*)$/);
		if (kv && cur) cur.values[kv[1].trim().toLowerCase()] = kv[2].trim();
	}
	return sections;
};

const norm = (p) => p.replace(/\\/g, '/').replace(/^\.?\//, '').toLowerCase();

const convert = async (zip, fallbackName) => {
	const iniName = zip.names
		.filter(n => /(^|\/)skin\.ini$/i.test(n))
		.sort((x, y) => x.split('/').length - y.split('/').length)[0];
	const base = iniName ? norm(iniName).replace(/skin\.ini$/, '') : '';
	const files = new Map(); // lowercase path inside the skin folder -> name in the zip
	for (const n of zip.names) {
		const p = norm(n);
		if (p.startsWith(base)) files.set(p.slice(base.length), n);
	}

	const warnings = [];
	let general = {}, mania = {}, comboPrefix = 'score';
	if (iniName) {
		const sections = parseIni(new TextDecoder().decode(await zip.read(iniName)));
		general = (sections.find(s => s.name === 'general') || {}).values || {};
		comboPrefix = String(((sections.find(s => s.name === 'fonts') || {}).values || {}).comboprefix || 'score').trim().replace(/\\/g, '/') || 'score';
		const m = sections.find(s => s.name === 'mania' && s.values.keys === '4');
		if (m) mania = m.values;
		else warnings.push('No 4K mania settings in this skin, so osu! defaults were used for sizes.');
	} else {
		warnings.push('No skin.ini found, so osu! defaults were used for sizes.');
	}

	const findImage = (name) => {
		const n = norm(name).replace(/\.png$/, '');
		for (const cand of [`${n}@2x.png`, `${n}.png`, `${n}-0@2x.png`, `${n}-0.png`]) {
			if (files.has(cand)) return files.get(cand);
		}
		return null;
	};
	const readImage = async (name) => {
		const found = findImage(name);
		if (!found) return null;
		try { return await loadImage(await zip.read(found)); } catch { return null; }
	};

	const out = {
		name: general.name || fallbackName,
		author: general.author || '',
		colors: [...DEFAULT_COLORS],
		judges: { ...JUDGE_DEFAULT_COLOR },
		grades: {},
		sound: null,
	};

	const widths = (mania.columnwidth || '').split(',').map(Number).filter(n => n > 0).slice(0, 4);
	out.raw = {
		widths: [0, 1, 2, 3].map(c => widths[c] || 30),
		scorePosition: Number(mania.scoreposition) > 0 ? Number(mania.scoreposition) : 300,
		comboPosition: Number(mania.comboposition) > 0 ? Number(mania.comboposition) : 111,
		columnWidth: widths.length ? widths.reduce((a, b) => a + b, 0) / widths.length : 30,
		hitPosition: Number(mania.hitposition) > 0 ? Math.min(480, Number(mania.hitposition)) : 402,
		noteAspect: null,
	};

	const aspects = [];
	for (let c = 0; c < 4; c++) {
		const img = await readImage(mania[`noteimage${c}`] || NOTE_FILES[c]);
		if (!img) { warnings.push(`Column ${c + 1} has no note image, so it keeps the default colour.`); continue; }
		out.colors[c] = dominantColor(img) || out.colors[c];
		if (img.width) aspects.push(img.height / img.width);
	}
	if (aspects.length) out.raw.noteAspect = aspects.reduce((a, b) => a + b, 0) / aspects.length;

	const judgeImages = {};
	for (const key of JUDGEMENTS) {
		const src = JUDGE_SOURCE[key];
		if (!(src in judgeImages)) judgeImages[src] = await readImage(mania[src.toLowerCase()] || JUDGE_FILE[src]);
		const img = judgeImages[src];
		if (img) out.judges[key] = dominantColor(img) || out.judges[key];
	}

	const gradeCache = {};
	for (const src of new Set(Object.values(GRADE_SOURCE))) {
		gradeCache[src] = readImage(src).then(img => (img ? shrinkToDataUrl(img, 160) : null));
	}
	for (const [grade, src] of Object.entries(GRADE_SOURCE)) {
		const url = await gradeCache[src];
		if (url) out.grades[grade] = url;
	}

	const soundPath = ['normal-hitnormal.wav', 'normal-hitnormal.ogg', 'normal-hitnormal.mp3'].find(p => files.has(p));
	if (soundPath) {
		const bytes = await zip.read(files.get(soundPath));
		const type = soundPath.endsWith('.ogg') ? 'audio/ogg' : soundPath.endsWith('.mp3') ? 'audio/mpeg' : 'audio/wav';
		out.sound = bytes.length < 64
			? { url: silentWav(), silent: true }
			: { url: await bytesToDataUrl(bytes, type), silent: false };
	}


	const images = { list: [], canvases: [], heights: [], anim: {}, count: 0 };
	const skinFps = Number(general.animationframerate) > 0 ? Number(general.animationframerate) : 0;

	// each file once (the same file used for several columns is stored once), all read at the same time
	const started = new Map();
	const addFile = (found, maxW, maxH) => {
		const key = `${found}|${maxW}|${maxH}`;
		if (!started.has(key)) started.set(key, (async () => {
			let img = null;
			try { img = await loadImage(await zip.read(found)); } catch { img = null; }
			if (!img || !img.width || !img.height) return null;
			if (isBlank(img)) return { blank: true };
			const hd = /@2x\.png$/i.test(found) ? 2 : 1;
			const { canvas, url } = shrinkFit(img, maxW, maxH);
			const i = images.list.length;
			images.list.push(url);
			canvas.osuH = img.height / hd;
			images.canvases.push(canvas);
			images.heights.push(img.height / hd);
			return { i, hd, w: img.width / hd, h: img.height / hd };
		})());
		return started.get(key);
	};
	const findFrames = (name) => {
		const n = norm(name).replace(/\.png$/, '');
		const frames = [];
		for (let i = 0; i < 120; i++) {
			const f = [`${n}-${i}@2x.png`, `${n}-${i}.png`].find(cand => files.has(cand));
			if (!f) break;
			frames.push(files.get(f));
		}
		if (frames.length) return frames;
		const single = [`${n}@2x.png`, `${n}.png`].find(cand => files.has(cand));
		return single ? [files.get(single)] : [];
	};
	const addElement = async (name, maxW, maxH) => {
		const found = findFrames(name).slice(0, 60);
		if (!found.length) return null;
		const results = await Promise.all(found.map(f => addFile(f, maxW, maxH)));
		const first = results[0];
		if (!first || first.blank || found.length < 2) return first;
		const frames = results.filter(r => r && !r.blank).map(r => r.i);
		if (frames.length > 1) {
			const fps = skinFps || frames.length;
			images.anim[first.i] = { frames, fps };
			const canvas = images.canvases[first.i];
			canvas.frames = frames.map(i => images.canvases[i]);
			canvas.fps = fps;
		}
		return first;
	};

	const jobs = [];
	for (const [kind, spec] of Object.entries(IMAGE_KINDS)) {
		images[kind] = [null, null, null, null];
		for (let c = 0; c < 4; c++) {
			jobs.push(addElement(mania[spec.ini(c)] || spec.file(c), spec.maxW, spec.maxH).then(r => {
				images[kind][c] = !r ? null : r.blank ? -1 : r.i;
				if (r && !r.blank) images.count++;
			}));
		}
	}
	images.stage = {};
	for (const [part, [ini, file]] of Object.entries(STAGE_PARTS)) {
		images.stage[part] = null;
		jobs.push(addElement(mania[ini] || file, 1280, 1280).then(r => {
			images.stage[part] = !r ? null : r.blank ? { i: -1 } : { i: r.i, w: r.w, h: r.h };
			if (r && !r.blank) images.count++;
		}));
	}
	// judgements (PERFECT, MISS...) and the health bar, animated ones too
	images.judge = {};
	const judgeJobs = {};
	for (const key of JUDGEMENTS) {
		const src = JUDGE_SOURCE[key];
		if (!judgeJobs[src]) judgeJobs[src] = addElement(mania[src.toLowerCase()] || JUDGE_FILE[src], 1024, 512);
		jobs.push(judgeJobs[src].then(r => { if (r) images.count++; images.judge[key] = !r ? null : r.blank ? { i: -1 } : { i: r.i, w: r.w, h: r.h }; }));
	}
	images.hp = {};
	for (const part of ['bg', 'colour']) {
		jobs.push(addElement(`scorebar-${part}`, 1600, 1600).then(r => { if (r && !r.blank) images.count++; images.hp[part] = !r || r.blank ? null : { i: r.i, w: r.w, h: r.h }; }));
	}
	images.hp.marker = !!findImage('scorebar-marker');
	// the sizes of the combo's digit pictures (only to recognise them when the game draws them)
	images.comboDims = [];
	for (let d = 0; d <= 9; d++) {
		for (const nm of [`${comboPrefix}-${d}`, `${comboPrefix}-${d}@2x`]) {
			const f = files.get(norm(nm) + '.png');
			if (!f) continue;
			try { const im = await loadImage(await zip.read(f)); images.comboDims.push([im.width, im.height]); } catch { /* skip it */ }
		}
	}
	await Promise.all(jobs);
	// the saved files, once all are encoded; identical ones (under other names) kept once
	const urls = await Promise.all(images.list);
	const firstOf = new Map(), remap = [], canvases = [], heights = [];
	urls.forEach((u, i) => {
		if (!firstOf.has(u)) { firstOf.set(u, canvases.length); canvases.push(images.canvases[i]); heights.push(images.heights[i]); }
		remap[i] = firstOf.get(u);
	});
	images.list = [...firstOf.keys()];
	images.canvases = canvases;
	images.heights = heights;
	for (const kind of Object.keys(IMAGE_KINDS)) images[kind] = images[kind].map(i => (i != null && i >= 0 ? remap[i] : i));
	for (const st of [...Object.values(images.stage), ...Object.values(images.judge), images.hp.bg, images.hp.colour]) {
		if (st && st.i >= 0) st.i = remap[st.i];
	}
	if (!images.hp.bg) images.hp = null;
	if (!Object.values(images.judge).some(j => j)) {
		images.judge = null;
		warnings.push('No judgement images in this skin (mania-hit300, mania-hit0…), so PERFECT, MISS and the rest stay as text.');
	}
	images.anim = Object.fromEntries(Object.entries(images.anim).map(([k, a]) => [remap[k], { ...a, frames: a.frames.map(i => remap[i]) }]));
	images.keysUnder = String(mania.keysundernotes || '').trim() === '1';
	out.images = images;

	// what the game needs later: the skin's files as they are, skin.ini's text and the image names it gives
	const iniPaths = {};
	for (const [k, v] of Object.entries(mania)) {
		for (const [kind, rule] of Object.entries(FILE_KINDS)) {
			if (rule.ini && rule.ini.test(k) && v) (iniPaths[kind] ||= new Set()).add(elementName(norm(v)));
		}
	}
	out.author = general.author || '';
	out.source = {
		zip, files, baseLen: base.length, iniPaths,
		iniText: iniName ? new TextDecoder().decode(await zip.read(iniName)) : null,
	};
	return { skin: out, warnings };
};

let skin = null;          // the converted skin
let windowH = window.innerHeight; // the game window's height (this window), kept up to date
let widthPct = 100;       // column width, in percent of the skin's
let receptorPos = null;   // receptors' height up the screen in px; null: the skin's own
let useGrades = true, useSound = true;
// the skin's images, in three groups that can each be left out
let useNoteImgs = true, useKeyImgs = true, useStageImgs = true;
const NOTE_KINDS = ['note', 'head', 'body', 'tail'], KEY_KINDS = ['key', 'keyDown'];
const hasKinds = (kinds) => !!(skin && skin.images && kinds.some(k => (skin.images[k] || []).some(i => i != null)));
const hasNoteImgs = () => hasKinds(NOTE_KINDS);
const hasKeyImgs = () => hasKinds(KEY_KINDS);
const hasStageImgs = () => !!(skin && skin.images && skin.images.stage && Object.values(skin.images.stage).some(Boolean));
const usingImages = () => (useNoteImgs && hasNoteImgs()) || (useKeyImgs && hasKeyImgs()) || (useStageImgs && hasStageImgs());
let animSpeed = 100; // animation speed, in percent of the skin's own
// judgement and health bar images, and their sizes (percent)
let useJudgeImgs = true, useHpImgs = true, judgeSize = 100, hpSize = 100;
const hasJudgeImgs = () => !!(skin && skin.images && skin.images.judge);
const hasHpImgs = () => !!(skin && skin.images && skin.images.hp);
const judgeImgsOn = () => useJudgeImgs && hasJudgeImgs();
const hpImgsOn = () => useHpImgs && hasHpImgs();
// the health bar's size on screen: its length up the screen, and its thickness
const hpGeometry = () => {
	const bg = skin.images.hp.bg;
	const side = bg.w > bg.h;
	const k = windowH / 768 * hpSize / 100;
	return { side, thick: Math.max(2, Math.round((side ? bg.h : bg.w) * k)), long: Math.max(10, Math.min(windowH, Math.round((side ? bg.w : bg.h) * k))) };
};

const circles = false, tailCircles = false; // (the game draws the skin's own notes now)
let upscroll = false;
try { upscroll = localStorage.getItem('oss-idle-upscroll') === '1'; } catch {}
const percyPx = () => 0;

const skinHitPosition = () => Math.max(0, Math.round((480 - Math.min(480, Math.max(240, skin.raw.hitPosition))) * windowH / 480));
const hasImages = () => !!(skin && skin.images && skin.images.count);

const sizes = () => {
	const s = windowH / 480;
	const baseWidth = skin.raw.columnWidth * s;
	const columnWidth = Math.max(8, Math.round(baseWidth * widthPct / 100));
	const baseNote = skin.raw.noteAspect
		? Math.min(120, baseWidth * skin.raw.noteAspect)
		: 24 * (s / 2.08);
	const noteHeight = Math.max(4, Math.round(baseNote));
	return {
		columnWidth,
		noteHeight,
		receptorHeight: Math.max(6, noteHeight + 6),
		hitPosition: receptorPos ?? skinHitPosition(),
	};
};

// ---------- the game's own skins (since 1.2.4 the game reads osu! skins itself) ----------
// "Use this skin" now puts the skin's own files into the game's skin storage, with the
// editor's changes written into its skin.ini, and switches the game to it live.
const GAME_EXT = /\.(png|jpe?g|wav|ogg|mp3|ini|txt)$/i;
const GAME_MAX_BYTES = 250 * 1024 * 1024, GAME_MAX_FILES = 10000;
const gamePath = (p) => p.replace(/\\/g, '/').replace(/^(\.\/|\/)+/, '').toLowerCase();
const gameSkinDb = () => new Promise((resolve, reject) => {
	const r = indexedDB.open('skins');
	r.onupgradeneeded = () => { r.result.createObjectStore('manifests', { keyPath: 'id' }); r.result.createObjectStore('files'); };
	r.onsuccess = () => resolve(r.result);
	r.onerror = () => reject(r.error);
});
const txDone = (tx) => new Promise((resolve, reject) => { tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error); tx.onabort = () => reject(tx.error); });
const reqDone = (r) => new Promise((resolve, reject) => { r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error); });
// the files: replaces the skin's set (like the game does), or just some of them
// Newer game versions in the desktop app keep skins as folders of files on the computer (window.ossIdleDesktop.library); the editor writes there when it exists.
const hostLib = () => { try { return (window.ossIdleDesktop && window.ossIdleDesktop.library) || null; } catch { return null; } };
const libEntry = async (id) => ((await hostLib().list('skins')) || []).find(e => e && e.info && e.info.id === id) || null;
const libName = async (want) => {
	const base = String(want || 'Imported skin').replace(/[<>:"/\\|?*\u0000-\u001f]/g, '_').slice(0, 80).replace(/^[. ]+|[. ]+$/g, '') || 'Imported skin';
	const used = new Set(((await hostLib().list('skins')) || []).map(e => String(e.name).toLowerCase()));
	for (let i = 1; ; i++) { const n = i === 1 ? base : `${base} (${i})`; if (!used.has(n.toLowerCase())) return n; }
};
const libBytes = async (name, path) => { const r = await hostLib().read('skins', name, path); return r ? new Blob([r]) : null; };
// the game watches its skin folders: it notices a change, then (about 300 ms later) checks its skin list against them; give it time before telling it to load the skin
const libSettled = () => new Promise((resolve) => setTimeout(resolve, 900));
// What the game knows of each skin folder: it lists its folders once, when it starts, and only hears about our writes after a restart.
// So a folder it hasn't seen, or files it hasn't seen in a folder, need a reload of the game to show up.
const gameKnows = new Map(); // skin id -> the paths the game listed for it at its start (null: the folder didn't exist then)
const needsReload = (id, list) => { const k = gameKnows.get(id); return k === null || (k instanceof Set && list.some(f => !k.has(gamePath(f.path)))); };
const writeGameFiles = async (id, list, blobs, only = null, wantName = '') => {
	if (hostLib()) {
		const entry = await libEntry(id);
		if (!gameKnows.has(id)) gameKnows.set(id, entry ? new Set(entry.files.map(f => gamePath(f.path))) : null);
		const name = entry ? entry.name : await libName(wantName);
		const c = {};
		if (!only) {
			const keep = new Set(list.map(f => gamePath(f.path)));
			for (const f of (entry && entry.files) || []) if (!keep.has(gamePath(f.path))) c[f.path] = undefined;
		}
		for (const f of list) {
			const p = gamePath(f.path);
			if (only && !only.has(p)) continue;
			const b = blobs.get(p);
			if (b) c[f.path] = new Uint8Array(await b.arrayBuffer());
		}
		await hostLib().write('skins', name, c, { id, files: list.map(f => ({ path: f.path, size: f.size })) }, false);
		return needsReload(id, list);
	}
	const idb = await gameSkinDb();
	const old = (await reqDone(idb.transaction('manifests').objectStore('manifests').get(id)))?.files || [];
	const tx = idb.transaction(['manifests', 'files'], 'readwrite');
	const files = tx.objectStore('files');
	if (!only) {
		const keep = new Set(list.map(f => gamePath(f.path)));
		for (const f of old) if (!keep.has(gamePath(f.path))) files.delete(`${id}/${gamePath(f.path)}`);
	}
	for (const f of list) {
		const p = gamePath(f.path);
		if (only && !only.has(p)) continue;
		const b = blobs.get(p);
		if (b) files.put(b, `${id}/${p}`);
	}
	tx.objectStore('manifests').put({ id, files: list.map(f => ({ path: f.path, size: f.size })) });
	await txDone(tx);
	idb.close();
};

// the game's stores: the loaded skin (always reachable from the page) and the skin in use
const reachableStores = () => {
	const host = document.getElementById('root');
	const key = host && Object.keys(host).find(k => k.startsWith('__reactContainer$'));
	const out = new Set();
	const stack = key ? [host[key]] : [];
	for (let n = 0; stack.length && n < 300000; n++) {
		const f = stack.pop();
		for (let h = f.memoizedState, i = 0; h && typeof h === 'object' && 'next' in h && i < 200; h = h.next, i++) {
			const deps = h.memoizedState && h.memoizedState.deps;
			if (Array.isArray(deps)) for (const x of deps) if (x && typeof x.get === 'function' && typeof x.set === 'function' && typeof x.sync === 'function') out.add(x);
		}
		if (f.sibling) stack.push(f.sibling);
		if (f.child) stack.push(f.child);
	}
	return [...out];
};
let loadedStore = null, inUseStore = null;
const isLoadedSkin = (v) => !!(v && typeof v === 'object' && v.mania instanceof Map && v.ready instanceof Map && typeof v.id === 'string');
const findLoaded = () => {
	try { if (loadedStore && isLoadedSkin(loadedStore.get())) return loadedStore; } catch {}
	loadedStore = reachableStores().find(s => { try { return isLoadedSkin(s.get()); } catch { return false; } }) || null;
	return loadedStore;
};
// the skin in use isn't in the page; the game reads it (right after the editor's skin setting)
// whenever the loaded skin is set, so set that to itself and see which store is read
const findInUse = () => {
	if (inUseStore) return inUseStore;
	const loaded = findLoaded();
	if (!loaded) return null;
	const proto = Object.getPrototypeOf(loaded);
	const get = proto.get;
	const seen = [];
	proto.get = function () { seen.push(this); return get.call(this); };
	try { loaded.set(loaded.get()); } catch {} finally { proto.get = get; }
	const i = seen.findIndex(s => typeof s.current === 'number');
	inUseStore = (i >= 0 ? seen.slice(i + 1) : seen).find(s => s !== loaded
		&& (s.current === undefined || (s.current && typeof s.current === 'object' && 'installedAt' in s.current))) || null;
	return inUseStore;
};
// the skin in use, as the game sees it: its layout (for versus John), judgement colours and hitsound
const gameSkinNow = () => { try { return findLoaded()?.get() || null; } catch { return null; } };
const gameMania = () => {
	const v = gameSkinNow();
	const src = v && (v.osu || v.fallback);
	const m = src && src.ini && Array.isArray(src.ini.mania) ? src.ini.mania.find(x => x.keys === 4) : null;
	return (m && m.values) || {};
};
const gameJudgeColors = () => {
	const v = gameSkinNow();
	const j = v && v.data && v.data.judgements;
	return j ? Object.fromEntries(Object.entries(j).map(([k, x]) => [k, x && x.judge])) : null;
};
const gameHitSound = () => { const v = gameSkinNow(); return v ? `${v.id}:normal-hitnormal` : null; };

// which files each switch in the sidebar leaves out (by osu!'s names, or the names skin.ini gives them)
const FILE_KINDS = {
	notes: { names: /^mania-note/, ini: /^noteimage\d+[hlt]?$/ },
	keys: { names: /^mania-key/, ini: /^keyimage\d+d?$/ },
	stage: { names: /^mania-stage/, ini: /^stage(left|right|bottom|hint|light)$/ },
	judge: { names: /^mania-hit/, ini: /^hit(0|50|100|200|300|300g|divine)$/ },
	hp: { names: /^scorebar-/ },
	grades: { names: /^ranking-/ },
	sound: { names: /^(normal|soft|drum)-hit(normal|whistle|finish|clap)|^combobreak/ },
};
const kindOn = (kind) => ({
	notes: useNoteImgs, keys: useKeyImgs, stage: useStageImgs, judge: useJudgeImgs, hp: useHpImgs, grades: useGrades, sound: useSound,
}[kind]);
const elementName = (p) => p.replace(/\.[a-z0-9]+$/, '').replace(/@2x$/, '').replace(/-\d+$/, '');
const fileKind = (p, iniPaths) => {
	const name = elementName(p), base = name.split('/').pop();
	for (const [kind, rule] of Object.entries(FILE_KINDS)) {
		if (rule.names.test(base)) return kind;
		if (iniPaths[kind] && iniPaths[kind].has(name)) return kind;
	}
	return null;
};

// skin.ini, with the editor's changes in its 4K [Mania] section
const iniWithChanges = (text) => {
	const raw = skin.raw;
	const s = windowH / 480;
	const set = {};
	if (widthPct !== 100) set.ColumnWidth = raw.widths.map(w => Math.round(w * widthPct) / 100).join(',');
	if (receptorPos !== null) set.HitPosition = String(Math.round(Math.min(480, Math.max(240, 480 - receptorPos / s))));
	if (judge.fromBottom !== null) set.ScorePosition = String(Math.round(480 - judge.fromBottom / s));
	if (combo.dy) set.ComboPosition = String(Math.round(raw.comboPosition + combo.dy / s));
	set.UpsideDown = upscroll ? '1' : '0';
	if (!useNoteImgs || !useKeyImgs || !useStageImgs || !useJudgeImgs) set.__drop = true;
	const lines = (text || `[General]\r\nName: ${skin.name}\r\nVersion: 2.5\r\n`).replace(/^﻿/, '').split(/\r?\n/);
	// find the 4K [Mania] section
	let start = -1, end = lines.length;
	for (let i = 0, sec = null, from = -1; i <= lines.length; i++) {
		const line = i < lines.length ? lines[i].trim() : '[end]';
		const m = line.match(/^\[(.+)\]$/);
		if (m) {
			if (sec === 'mania' && start < 0 && lines.slice(from + 1, i).some(l => /^\s*keys\s*:\s*4\s*$/i.test(l))) { start = from; end = i; }
			sec = m[1].trim().toLowerCase(); from = i;
		}
	}
	if (start < 0) { lines.push('', '[Mania]', 'Keys: 4'); start = lines.length - 3; end = lines.length; }
	const ours = new Set(Object.keys(set).map(k => k.toLowerCase()));
	const section = lines.slice(start + 1, end).filter(l => {
		const k = (l.match(/^\s*([^:\/]+?)\s*:/) || [])[1];
		if (!k) return true;
		if (ours.has(k.toLowerCase())) return false;
		// images switched off: their skin.ini lines go too, so the game uses its own
		if (set.__drop) {
			const lk = k.toLowerCase();
			if (!useNoteImgs && FILE_KINDS.notes.ini.test(lk)) return false;
			if (!useKeyImgs && FILE_KINDS.keys.ini.test(lk)) return false;
			if (!useStageImgs && FILE_KINDS.stage.ini.test(lk)) return false;
			if (!useJudgeImgs && FILE_KINDS.judge.ini.test(lk)) return false;
		}
		return true;
	});
	for (const [k, v] of Object.entries(set)) if (k !== '__drop') section.push(`${k}: ${v}`);
	return [...lines.slice(0, start + 1), ...section, ...lines.slice(end)].join('\r\n');
};

let needReload = false; // the game has to restart to see the skin's files (it only lists its skin folders when it starts)
let liveId = null;     // the game skin being edited live, once "Use this skin" is clicked
let liveFiles = '';    // which files it has, to write only skin.ini when just that changes
let liveIni = '';
let inUseObj = null;

// the files to give the game, and the blobs
const gameFiles = async (onlyIni) => {
	const src = skin.source;
	const list = [], blobs = new Map();
	let total = 0;
	let iniPath = null;
	for (const [p, zipName] of src.files) {
		if (!GAME_EXT.test(p)) continue;
		if (p === 'skin.ini') { iniPath = zipName.slice(src.baseLen); continue; }
		const kind = fileKind(p, src.iniPaths);
		if (kind && !kindOn(kind)) continue;
		list.push({ path: zipName.slice(src.baseLen), lower: p });
	}
	if (list.length + 1 > GAME_MAX_FILES) throw new Error('this skin has too many files for the game');
	const iniText = iniWithChanges(src.iniText);
	const iniBlob = new Blob([iniText], { type: 'text/plain' });
	if (!onlyIni) {
		await Promise.all(list.map(async (f) => {
			const bytes = await src.zip.read(src.files.get(f.lower));
			const b = new Blob([bytes]);
			f.size = b.size; total += b.size;
			blobs.set(gamePath(f.path), b);
		}));
		if (total > GAME_MAX_BYTES) throw new Error('this skin is too big for the game (over 250 MB)');
	}
	const ini = { path: iniPath || 'skin.ini', size: iniBlob.size };
	blobs.set(gamePath(ini.path), iniBlob);
	return { list: [...list.map(f => ({ path: f.path, size: f.size })), ini], blobs, iniText, key: list.map(f => f.lower).join('|'), iniKey: gamePath(ini.path) };
};

const applySkin = async () => {
	const name = (els.name.value || skin.name).trim().slice(0, 80) || 'Imported skin';
	const now = new Date().toISOString();
	// the same game skin each time (the one made last time with this name, or a new one)
	if (liveId === null) {
		const rows = await window.db.read(d => d.exec('SELECT id, name FROM skin'));
		const all = rows[0] ? rows[0].values : [];
		const same = all.find(([id, n]) => id < 0 && n === name);
		liveId = same ? same[0] : Math.min(0, ...all.map(r => r[0])) - 1;
	}
	const id = liveId;
	const files = await gameFiles(false);
	const row = {
		id, name, description: '', version: '1.0.0', icon: null, authorId: 0, authorName: skin.author || '', tags: '', status: 'UNPUBLISHED',
		enabled: 1, installedAt: Date.now(), createdAt: now, publishedAt: null, updatedAt: now,
	};
	// (the game's skin list row first: when it sees the new folder it checks that every folder has a row)
	await window.db.write(d => {
		const found = d.exec('SELECT id FROM skin WHERE id = ?', [id]);
		d.exec('UPDATE skin SET enabled = 0 WHERE id != ?', [id]);
		if (found[0] && found[0].values.length) d.exec('UPDATE skin SET name = ?, enabled = 1, updatedAt = ? WHERE id = ?', [name, now, id]);
		else d.exec('INSERT INTO skin (id, name, description, version, icon, authorId, authorName, tags, status, enabled, installedAt, createdAt, publishedAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
			[row.id, row.name, row.description, row.version, row.icon, row.authorId, row.authorName, row.tags, row.status, row.enabled, row.installedAt, row.createdAt, row.publishedAt, row.updatedAt]);
	});
	const reload = await writeGameFiles(id, files.list, files.blobs, null, name);
	liveFiles = files.key; liveIni = files.iniText;
	if (reload) { needReload = true; return false; } // (the game has to start again to see these files)
	return switchGame(row);
};
// the game loads the skin in use again whenever it's set, even to the same one
const switchGame = async (row) => {
	const store = findInUse();
	if (!store) return false;
	const cur = store.get();
	if (cur && typeof cur === 'object' && cur.id === row.id) {
		if (row.name) cur.name = row.name;
		cur.updatedAt = row.updatedAt || new Date().toISOString();
		await store.set(cur);
		return true;
	}
	const obj = cur && typeof cur === 'object' && typeof cur.constructor === 'function' && cur.constructor !== Object
		? Object.assign(Object.create(Object.getPrototypeOf(cur)), cur, row, { enabled: true })
		: { ...row, enabled: true, get local() { return this.id < 0; } };
	inUseObj = obj;
	await store.set(obj);
	return true;
};

// a key in a skin.ini's 4K [Mania] section, set (or added)
const setManiaKey = (text, key, value) => {
	const lines = (text || '[General]\r\nVersion: 2.5\r\n').replace(/^\uFEFF/, '').split(/\r?\n/);
	let start = -1, end = lines.length;
	for (let i = 0, sec = null, from = -1; i <= lines.length; i++) {
		const m = (i < lines.length ? lines[i].trim() : '[end]').match(/^\[(.+)\]$/);
		if (!m) continue;
		if (sec === 'mania' && start < 0 && lines.slice(from + 1, i).some(l => /^\s*keys\s*:\s*4\s*$/i.test(l))) { start = from; end = i; }
		sec = m[1].trim().toLowerCase(); from = i;
	}
	if (start < 0) { lines.push('', '[Mania]', 'Keys: 4'); start = lines.length - 3; end = lines.length; }
	const re = new RegExp(`^\\s*${key}\\s*:`, 'i');
	const section = lines.slice(start + 1, end).filter(l => !re.test(l));
	section.push(`${key}: ${value}`);
	return [...lines.slice(0, start + 1), ...section, ...lines.slice(end)].join('\r\n');
};
// upscroll on the skin in use: its skin.ini's UpsideDown, then the game loads it again
const upscrollInUse = async (on) => {
	const store = findInUse();
	const cur = store && store.get();
	if (!cur || typeof cur !== 'object' || typeof cur.id !== 'number') {
		setStatus('Upscroll works on skins in the game\'s skin list (the game\'s default skin can\'t be changed). Use a skin first.', C.warn);
		return;
	}
	let files, ini, old;
	if (hostLib()) {
		const entry = await libEntry(cur.id);
		files = entry && entry.files.map(f => ({ path: f.path, size: f.size }));
		if (files) { ini = files.find(f => gamePath(f.path) === 'skin.ini'); old = ini ? await libBytes(entry.name, ini.path) : null; }
	} else {
		const idb = await gameSkinDb();
		files = (await reqDone(idb.transaction('manifests').objectStore('manifests').get(cur.id)))?.files;
		if (files) { ini = files.find(f => gamePath(f.path) === 'skin.ini'); old = ini ? await reqDone(idb.transaction('files').objectStore('files').get(`${cur.id}/skin.ini`)) : null; }
		idb.close();
	}
	if (!files) { setStatus('That skin is from the game\'s online list; upscroll only changes skins added here or from a file.', C.warn); return; }
	const text = setManiaKey(old ? await old.text() : null, 'UpsideDown', on ? '1' : '0');
	const blob = new Blob([text], { type: 'text/plain' });
	const list = [...files.filter(f => gamePath(f.path) !== 'skin.ini'), { path: ini ? ini.path : 'skin.ini', size: blob.size }];
	await writeGameFiles(cur.id, list, new Map([['skin.ini', blob]]), new Set(['skin.ini']));
	await switchGame({ id: cur.id, updatedAt: new Date().toISOString() });
	setStatus(on ? 'Upscroll is on for the skin in use.' : 'Upscroll is off for the skin in use.', C.ok);
};

let liveTimer;
const queueLive = () => {
	if (liveId === null || !skin) return;
	clearTimeout(liveTimer);
	liveTimer = setTimeout(async () => {
		if (liveId === null || !skin) return;
		try {
			const quick = await gameFiles(true);
			if (quick.key === liveFiles) {
				if (quick.iniText === liveIni) return;
				// only skin.ini changed: just that file
				await writeGameFiles(liveId, (await currentManifest(liveId, quick)), quick.blobs, new Set([quick.iniKey]));
				liveIni = quick.iniText;
				await switchGame({ id: liveId, updatedAt: new Date().toISOString() });
			} else {
				if (!(await applySkin()) && needReload) els.needReload?.();
			}
		} catch (e) { setStatus(`Couldn't update the game: ${e.message || e}`, C.warn); }
	}, 300);
};
// the stored list of files, with skin.ini's new size
const currentManifest = async (id, quick) => {
	let files;
	if (hostLib()) files = ((await libEntry(id)) || { files: [] }).files.map(f => ({ path: f.path, size: f.size }));
	else {
		const idb = await gameSkinDb();
		files = (await reqDone(idb.transaction('manifests').objectStore('manifests').get(id)))?.files || [];
		idb.close();
	}
	const ini = quick.list.find(f => gamePath(f.path) === quick.iniKey);
	return [...files.filter(f => gamePath(f.path) !== quick.iniKey), ini];
};

const UR_KEY = 'oss-idle-ur-bar';
const UR_CANVASES = ['play__canvas', 'skin-preview__canvas', 'versus__canvas'];
const UR_TOP = 19, UR_BOTTOM = 10, UR_MARGIN = 6;
const ur = { dx: 0, dy: 0, keepOnScreen: true };
const urLoad = () => {
	try { Object.assign(ur, JSON.parse(localStorage.getItem(UR_KEY) || '{}')); } catch {}
};
const urSave = () => {
	try { localStorage.setItem(UR_KEY, JSON.stringify(ur)); } catch {}
	window.dispatchEvent(new Event('oss-idle-ur-bar')); // tell the standalone add-on, if it's on
};

const canvasProto = CanvasRenderingContext2D.prototype;
const UR_NAMES = ['fillRect', 'moveTo', 'lineTo'];
const urPrev = {}, urOurs = {};
let urPatched = false;
const urFrames = new WeakMap();
const urNear = (a, b) => Math.abs(a - b) < 0.01;
const urOnPlayfield = (canvas) =>
	canvas && canvas.classList && UR_CANVASES.some(c => canvas.classList.contains(c));

const urPlacement = (ctx, cx, y) => {
	const t = ctx.getTransform();
	const w = ctx.canvas.width / (t.a || 1), h = ctx.canvas.height / (t.d || 1);
	let shiftX = ur.dx, shiftY = ur.dy;
	if (ur.keepOnScreen) {
		shiftY = Math.min(Math.max(y + shiftY, UR_TOP + UR_MARGIN), h - UR_BOTTOM - UR_MARGIN) - y;
		shiftX = Math.min(Math.max(cx + shiftX, UR_MARGIN), w - UR_MARGIN) - cx;
	}
	return { shiftX, shiftY };
};

urOurs.fillRect = function (x, y, w, h) {
	if (!urOnPlayfield(this.canvas)) return urPrev.fillRect.call(this, x, y, w, h);
	let s = urFrames.get(this);
	if (w === 2 && h === 16) { // the centre line: where the bar is this frame
		const centre = y + 8;
		s = { ...(s || {}), y: centre, ...urPlacement(this, x + 1, centre) };
		urFrames.set(this, s);
	}
	if (s && s.y !== undefined && (
		(h === 8 && urNear(y, s.y - 4))
		|| (w === 2 && h === 16 && urNear(y, s.y - 8))
		|| (w === 2 && h === 20 && urNear(y, s.y - 10))
	)) {
		return urPrev.fillRect.call(this, x + s.shiftX, y + s.shiftY, w, h);
	}
	return urPrev.fillRect.call(this, x, y, w, h);
};
urOurs.moveTo = function (x, y) {
	const s = urFrames.get(this);
	if (s) s.lastMove = [x, y];
	return urPrev.moveTo.call(this, x, y);
};
urOurs.lineTo = function (x, y) {
	const s = urFrames.get(this);
	if (s && s.y !== undefined && urNear(y, s.y - 19)) {
		const m = s.lastMove;
		if (m && urNear(m[1], s.y - 12)) {
			this.beginPath();
			urPrev.moveTo.call(this, m[0] + s.shiftX, m[1] + s.shiftY);
			s.lastMove = null;
		}
		return urPrev.lineTo.call(this, x + s.shiftX, y + s.shiftY);
	}
	return urPrev.lineTo.call(this, x, y);
};

const urMount = () => {
	urLoad();
	window.addEventListener('oss-idle-ur-bar', urLoad);
	if (window.__ossIdleUrBar) return; // the standalone UR bar add-on is already moving it
	window.__ossIdleUrBar = 'skin-importer';
	urPatched = true;
	for (const name of UR_NAMES) {
		urPrev[name] = canvasProto[name];
		canvasProto[name] = urOurs[name];
	}
};
const urUnmount = () => {
	window.removeEventListener('oss-idle-ur-bar', urLoad);
	if (!urPatched) return;
	for (const name of UR_NAMES) {
		if (canvasProto[name] === urOurs[name]) canvasProto[name] = urPrev[name];
		else Object.assign(ur, { dx: 0, dy: 0, keepOnScreen: false }); // still wrapped by another add-on: go inert
	}
	if (window.__ossIdleUrBar === 'skin-importer') delete window.__ossIdleUrBar;
	urPatched = false;
};

const JUDGE_KEY = 'oss-idle-judgement-position';
const JUDGE_ABOVE_RECEPTORS = 90; // the game's own spot
const judge = { fromBottom: null, dx: 0 };
// the combo counter's offset from its spot, and the health bar's place (for the editor's skins)
const COMBO_KEY = 'oss-idle-combo-position';
const combo = { dx: 0, dy: 0 };
try { Object.assign(combo, JSON.parse(localStorage.getItem(COMBO_KEY) || '{}')); } catch {}
const comboSave = () => { try { localStorage.setItem(COMBO_KEY, JSON.stringify(combo)); } catch {} };
const HP_POS_KEY = 'oss-idle-skin-importer-hp-position';
const hpPos = { gap: null, fromBottom: 0 }; // gap null: the bar's usual gap beside the stage
try { Object.assign(hpPos, JSON.parse(localStorage.getItem(HP_POS_KEY) || '{}')); } catch {}
const hpPosSave = () => { try { localStorage.setItem(HP_POS_KEY, JSON.stringify(hpPos)); } catch {} };
const judgeLoad = () => {
	try { Object.assign(judge, JSON.parse(localStorage.getItem(JUDGE_KEY) || '{}')); } catch {}
};
const judgeSave = () => {
	try { localStorage.setItem(JUDGE_KEY, JSON.stringify(judge)); } catch {}
};
// Sideways moves in the game itself: the skin.ini only has up and down (ScorePosition,
// ComboPosition), so left and right are done as the game draws. The game's own text
// (judgements, the combo) is shifted, and a judgement picture drawn at the middle of the
// screen at the judgement's height too. Up and down stay with the skin.ini.
let judgePrev = null, judgeImgPrev = null;
const onGameCanvas = (canvas) => !!(canvas && canvas.classList && canvas.classList.contains('play__canvas'));
const judgeFillText = function (text, x, y, ...rest) {
	if ((judge.dx || combo.dx) && onGameCanvas(this.canvas) && this.textAlign === 'center') {
		if (/\b(700|bold) 26px/.test(this.font)) x += judge.dx || 0;
		else if (/\b800 44px/.test(this.font) && /^\d+x$/.test(String(text))) x += combo.dx || 0;
	}
	return judgePrev.call(this, text, x, y, ...rest);
};
// Is this picture one of the skin's judgement pictures? Same file size as one of them, or the
// same shape drawn at the judgement's height.
const judgeSizes = () => {
	const out = [];
	const j = skin && skin.images && skin.images.judge;
	if (!j) return out;
	for (const e of Object.values(j)) {
		if (!e || e.i < 0) continue;
		const c = skin.images.canvases[e.i];
		for (const f of (c && c.frames) || [c]) if (f) out.push([f.width, f.height]);
	}
	return out;
};
const noteSizes = () => {
	const out = [];
	const im = skin && skin.images;
	if (!im) return out;
	for (const kind of Object.keys(IMAGE_KINDS)) for (const i of im[kind] || []) {
		const c = i != null && i >= 0 ? im.canvases[i] : null;
		for (const f of (c && c.frames) || [c]) if (f) out.push([f.width, f.height]);
	}
	for (const e of Object.values(im.stage || {})) {
		const c = e && e.i >= 0 ? im.canvases[e.i] : null;
		if (c) out.push([c.width, c.height]);
	}
	return out;
};
const judgeDrawImage = function (img, ...a) {
	if ((judge.dx || combo.dx) && onGameCanvas(this.canvas) && img && skin && (a.length === 2 || a.length === 4 || a.length === 8)) {
		try {
			const n = a.length;
			const [sw, sh] = n === 8 ? [a[2], a[3]] : [img.naturalWidth || img.videoWidth || img.width, img.naturalHeight || img.videoHeight || img.height];
			const di = n === 8 ? 4 : 0; // where the destination x, y, w, h start
			const dw = n === 2 ? sw : a[di + 2], dh = n === 2 ? sh : a[di + 3];
			// only pictures with the exact size of a judgement (or combo digit) picture, never one the notes, keys or stage use
			if (noteSizes().some(([w, h]) => w === sw && h === sh)) return judgeImgPrev.call(this, img, ...a);
			let hit = false;
			if (judge.dx && judgeSizes().some(([w, h]) => w === sw && h === sh)) {
				const t = this.getTransform();
				const H = this.canvas.height / (t.d || 1);
				let jy = judge.fromBottom !== null ? H - judge.fromBottom : skin.raw.scorePosition / 480 * H;
				if (upscroll) jy = H - jy;
				hit = Math.abs(a[di + 1] + dh / 2 - jy) < dh * 2 + 40; // (and drawn about where the judgement goes)
			}
			if (hit) a[di] += judge.dx;
			else if (combo.dx) {
				const cd = (skin.images && skin.images.comboDims) || [];
				if (cd.some(([w, h]) => w === sw && h === sh)) a[di] += combo.dx;
			}
		} catch { /* draw it where the game wants it */ }
	}
	return judgeImgPrev.call(this, img, ...a);
};
const judgeMount = () => {
	judgeLoad();
	judgePrev = canvasProto.fillText;
	canvasProto.fillText = judgeFillText;
	judgeImgPrev = canvasProto.drawImage;
	canvasProto.drawImage = judgeDrawImage;
};
const judgeUnmount = () => {
	if (canvasProto.fillText === judgeFillText) canvasProto.fillText = judgePrev;
	else judge.dx = combo.dx = 0; // still wrapped by another add-on: stop moving them
	if (canvasProto.drawImage === judgeDrawImage) canvasProto.drawImage = judgeImgPrev;
	else judge.dx = 0;
};

const CIRCLES_KEY = 'oss-idle-circle-notes-settings'; // shared with the Circle notes add-on
const UPSCROLL_KEY = 'oss-idle-upscroll';            // shared with the Upscroll add-on
const saveCircles = () => {
	try { localStorage.setItem(CIRCLES_KEY, JSON.stringify({ enabled: circles, tailCircles })); } catch {}
};
const setUpscroll = (on) => {
	upscroll = on;
	try { localStorage.setItem(UPSCROLL_KEY, upscroll ? '1' : '0'); } catch {}
	// the skin in use right now (whichever it is) gets it too, unless the editor is about to write its own
	if (liveId === null) upscrollInUse(on).catch(e => setStatus(`Couldn't change upscroll: ${e.message || e}`, C.warn));
	window.dispatchEvent(new Event('oss-idle-upscroll'));
	els.syncCircleBoxes?.();
	els.showSizes?.();
	drawPreview();
};
const VERSUS_KEY = 'oss-idle-versus';
const VERSUS_CLASS = 'versus__canvas';
const versus = (() => {
	const LEAD_IN_MS = 2000; // the game's lead-in before a map starts
	const J = ['DIVINE', 'MARVELOUS', 'PERFECT', 'GREAT', 'GOOD', 'BAD', 'MISS'];
	const ACC = { DIVINE: 1, MARVELOUS: 1, PERFECT: 1, GREAT: 0.66, GOOD: 0.33, BAD: 0.16, MISS: 0 };
	const settings = {
		enabled: false, keys: ['KeyD', 'KeyF', 'KeyJ', 'KeyK'], side: 'pair-left', gap: 60, offset: 0, hitsounds: true,
		johnScale: 100, // John's playfield size, in percent
	};
	try { Object.assign(settings, JSON.parse(localStorage.getItem(VERSUS_KEY) || '{}')); } catch {}
	if (settings.side === 'left' || settings.side === 'right') settings.side = `pair-${settings.side}`;
	const save = () => {
		try { localStorage.setItem(VERSUS_KEY, JSON.stringify(settings)); } catch {}
	};

	let cv = null, cx = null, raf = 0, onDown, onUp, resultBox, resultTimer;
	let play = null; // { canvas, game, clock }
	let myScale = 1;  // your playfield's size, when shrunk to fit
	let run = null;  // this map's state: notes, score, presses
	const held = [false, false, false, false];
	const pressedAt = [-1e9, -1e9, -1e9, -1e9];

	const findPlay = (canvas) => {
		const key = Object.keys(canvas).find(k => k.startsWith('__reactFiber$'));
		for (let fiber = key ? canvas[key] : null, depth = 0; fiber && depth < 40; depth++, fiber = fiber.return) {
			const props = fiber.memoizedProps;
			if (!props || !props.play || !props.beatmapInfo) continue;
			let game = null, clock = null;
			for (let hook = fiber.memoizedState; hook; hook = hook.next) {
				const ref = hook.memoizedState;
				const cur = ref && typeof ref === 'object' && 'current' in ref ? ref.current : null;
				if (!cur || typeof cur !== 'object') continue;
				if (Array.isArray(cur.notes) && cur.score && cur.windows && cur.scroll) game = cur;
				else if ('leadStart' in cur && 'paused' in cur) clock = cur;
			}
			return game ? { canvas, game, clock, fiber } : null;
		}
		return null;
	};
	const songNow = () => {
		const c = play.clock;
		if (c) {
			if (c.pauseAt !== undefined) return c.pauseAt;
			if (c.paused) return -LEAD_IN_MS;
			return performance.now() - c.leadStart - LEAD_IN_MS;
		}
		return play.game.lastTime || 0;
	};

	// the stage as the game lays it out from the skin in use (osu!'s 480-high units)
	const skinData = () => {
		const m = gameMania();
		const H = window.innerHeight / 480;
		const widths = String(m.ColumnWidth || '').split(',').map(Number).filter(n => n > 0);
		const cw = widths.length ? widths.reduce((a, b) => a + b, 0) / widths.length : 30;
		const hp = Math.min(480, Math.max(240, Number(m.HitPosition) || 402));
		return { playfield: { columnWidth: cw * H, hitPosition: (480 - hp) * H, noteHeight: Math.max(8, cw * H * 0.4), receptorHeight: Math.max(10, cw * H * 0.5) } };
	};
	const colorA = (c, a) => {
		if (typeof c !== 'string') return `rgba(255,255,255,${a})`;
		if (c[0] === '#') {
			const n = parseInt(c.slice(1, 7), 16);
			return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`;
		}
		const m = c.match(/[\d.]+/g);
		return m ? `rgba(${m[0]},${m[1]},${m[2]},${a})` : c;
	};

	const judgeTap = (abs, w) => {
		for (const j of J.slice(0, 6)) if (w[j] >= 0 && abs <= w[j]) return j;
		return 'MISS';
	};
	const judgeHold = (head, tail, w) => {
		const tiers = [['DIVINE', 1.2, 2.4], ['MARVELOUS', 1.2, 2.4], ['PERFECT', 1.1, 2.2], ['GREAT', 1, 2], ['GOOD', 1, 2]];
		for (const [j, h, c] of tiers) if (w[j] >= 0 && head <= w[j] * h && head + tail <= w[j] * c) return j;
		return 'BAD';
	};
	const newRun = (game) => ({
		game,
		notes: game.notes.map(n => ({
			t: n.time, end: n.hold ? n.endTime : n.time, col: n.column, hold: !!n.hold,
			headPos: n.headPos, tailPos: n.tailPos,
			headDone: false, tailDone: false, holding: false, headOffset: 0,
		})),
		counts: Object.fromEntries(J.map(j => [j, 0])), earned: 0, possible: 0,
		combo: 0, maxCombo: 0, last: null, done: false,
	});
	const record = (j, now) => {
		run.counts[j]++;
		run.earned += ACC[j];
		run.possible += 1;
		run.combo = j === 'MISS' ? 0 : run.combo + 1;
		run.maxCombo = Math.max(run.maxCombo, run.combo);
		run.last = { j, at: performance.now() };
	};
	const accuracy = () => (run && run.possible ? run.earned / run.possible : 1);

	const press = (c, now) => {
		const w = run.game.windows;
		const t = now - settings.offset;
		const n = run.notes.find(x => x.col === c && !x.headDone);
		if (!n || t < n.t - w.MISS) return; // nothing close enough: a free press
		n.headDone = true;
		const offset = t - n.t;
		if (!n.hold) { record(judgeTap(Math.abs(offset), w), now); return; }
		n.holding = true;
		n.headOffset = offset;
	};
	const release = (c, now) => {
		const w = run.game.windows;
		const t = now - settings.offset;
		const n = run.notes.find(x => x.col === c && x.holding);
		if (!n) return;
		n.holding = false;
		n.tailDone = true;
		const rel = t - n.end;
		record(rel > w.GOOD || rel < -w.BAD ? 'MISS' : judgeHold(Math.abs(n.headOffset), Math.abs(rel), w), now);
	};
	const timeouts = (now) => {
		const w = run.game.windows;
		const t = now - settings.offset;
		for (const n of run.notes) {
			if (n.t > t + 1000) break;
			if (!n.headDone && t > n.t + w.MISS) {
				n.headDone = true;
				if (n.hold) n.tailDone = true;
				record('MISS', now);
			} else if (n.holding && t > n.end + w.MISS) {
				n.holding = false;
				n.tailDone = true;
				record('MISS', now);
			}
		}
	};

	let audio = null, hitBuffer = null, hitUrl = '';
	const loadHitsound = async (data) => {
		const url = data && data.hitSounds && data.hitSounds['default/normal-hitnormal'];
		if (!url || url === hitUrl) return;
		hitUrl = url;
		try {
			audio = audio || new AudioContext();
			const bytes = await (await fetch(url)).arrayBuffer();
			hitBuffer = await audio.decodeAudioData(bytes);
		} catch { hitBuffer = null; }
	};
	const setting = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return typeof v === 'number' ? v : d; } catch { return d; } };
	const playHit = () => {
		if (!settings.hitsounds || !hitBuffer || !audio) return;
		const src = audio.createBufferSource();
		src.buffer = hitBuffer;
		const gain = audio.createGain();
		gain.gain.value = setting('mainVolume', 1) * setting('effectVolume', 0.15);
		src.connect(gain).connect(audio.destination);
		src.start();
	};

	const roundRect = (x, y, w, h, r) => {
		cx.beginPath();
		cx.moveTo(x + r, y);
		cx.arcTo(x + w, y, x + w, y + h, r);
		cx.arcTo(x + w, y + h, x, y + h, r);
		cx.arcTo(x, y + h, x, y, r);
		cx.arcTo(x, y, x + w, y, r);
		cx.closePath();
	};
	const layout = (W, colW) => {
		const fw = 4 * colW, gap = settings.gap;
		const js = Math.min(1, Math.max(0.2, (settings.johnScale || 100) / 100));
		const fwJ = fw * js; // John's width on screen
		const mid = W / 2;
		const onScreen = (cx, w) => Math.min(Math.max(w / 2, cx), Math.max(w / 2, W - w / 2));
		const side = settings.side;
		if (side === 'pair-left' || side === 'pair-right') {
			const myW = Math.min(fw, Math.max(40, W - fwJ - gap));
			const start = Math.max(0, (W - (fwJ + gap + myW)) / 2);
			const youLeft = side === 'pair-left';
			const x0 = youLeft ? start : start + fwJ + gap;
			const johnCx = youLeft ? start + myW + gap + fwJ / 2 : start + fwJ / 2;
			return { x0: Math.min(x0, Math.max(0, W - myW)), scale: myW / fw, johnCx: onScreen(johnCx, fwJ), js };
		}
		const myW = Math.min(fw, W);
		const johnCx = side === 'middle-left' ? mid - myW / 2 - gap - fwJ / 2 : mid + myW / 2 + gap + fwJ / 2;
		return { x0: mid - myW / 2, scale: myW / fw, johnCx: onScreen(johnCx, fwJ), js };
	};

	const EDGE = 60; // the band reaches this far past his playfield (his HP bar and such)
	let hooked = null; // { ctx, names }
	const xf = { on: false, flipped: false, js: 1, ox: 0, cx: 0, lo: 0, hi: -1, lineY: 0, H: 0, pending: false, depth: 0 };
	const inBand = x => x >= xf.lo && x <= xf.hi;
	const johnMatrix = (T) => {
		const k = Math.hypot(T.a, T.b) || 1; // device pixels per CSS pixel
		const ay = (xf.flipped ? xf.H : 0) * k; // the top, or the bottom in upscroll
		return new DOMMatrix().translate(xf.cx * k, ay).scale(xf.js, xf.js).translate(-xf.ox * k, -ay).multiply(T);
	};
	const hookJohn = (canvas) => {
		const g = canvas.getContext('2d');
		if (hooked && hooked.ctx === g) return;
		unhookJohn();
		const names = [];
		const own = (name, fn) => { names.push(name); g[name] = fn; };
		const wrap = (name, idx) => {
			const orig = g[name];
			const text = name.endsWith('Text');
			own(name, function (...a) {
				if (!xf.on || xf.depth > 0 || !(idx < a.length) || !inBand(a[idx])) return orig.apply(this, a);
				if (text) orig.call(this, '', a[1], a[2]);
				const T = this.getTransform();
				this.setTransform(johnMatrix(T));
				try { return orig.apply(this, a); } finally { this.setTransform(T); }
			});
		};
		for (const n of ['fillRect', 'strokeRect', 'moveTo', 'lineTo', 'rect', 'roundRect', 'arc', 'ellipse', 'arcTo', 'quadraticCurveTo', 'bezierCurveTo']) wrap(n, 0);
		wrap('fillText', 1); // (text, x, y)
		wrap('strokeText', 1);
		own('drawImage', (() => {
			const di = g.drawImage;
			return function (...a) {
				const i = a.length === 9 ? 5 : 1;
				if (!xf.on || xf.depth > 0 || !inBand(a[i])) return di.apply(this, a);
				const T = this.getTransform();
				this.setTransform(johnMatrix(T));
				try { return di.apply(this, a); } finally { this.setTransform(T); }
			};
		})());
		const cr = g.clearRect;
		own('clearRect', function (...a) {
			xf.pending = true;
			xf.depth = 0;
			return cr.apply(this, a);
		});
		const sv = g.save;
		own('save', function () {
			sv.call(this);
			if (xf.depth > 0) { xf.depth++; return; }
			if (!xf.on || !xf.pending) return;
			xf.pending = false;
			xf.depth = 1;
			const T = this.getTransform();
			xf.flipped = T.d < 0; // the game's or the editor's upscroll
			this.setTransform(johnMatrix(T));
		});
		const rs = g.restore;
		own('restore', function () {
			if (xf.depth > 0) xf.depth--;
			return rs.call(this);
		});
		hooked = { ctx: g, names };
	};
	const unhookJohn = () => {
		if (!hooked) return;
		for (const n of hooked.names) delete hooked.ctx[n]; // back to the shared ones
		hooked = null;
		xf.on = false;
		xf.depth = 0;
	};
	const stageHere = (canvas) => {
		if (!settings.enabled || !play || !cv) return true;
		const middle = settings.side === 'middle-left' || settings.side === 'middle-right';
		return middle ? canvas === cv : canvas !== cv;
	};

	const draw = () => {
		const W = cv.clientWidth || play.canvas.clientWidth, H = cv.clientHeight || play.canvas.clientHeight;
		if (!W || !H) return;
		const dpr = Math.min(window.devicePixelRatio || 1, 2);
		if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) {
			cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
		}
		cx.setTransform(dpr, 0, 0, dpr, 0, 0);

		const data = skinData();
		const pf = (data && data.playfield) || {};
		const skinColW = pf.columnWidth || 74;
		const lay = layout(W, skinColW);
		const colW = skinColW * lay.scale, nh = (pf.noteHeight || 24) * lay.scale, rh = (pf.receptorHeight || 30) * lay.scale;
		const lineY = H - (pf.hitPosition != null ? pf.hitPosition : 100);
		myScale = lay.scale;
		if (Math.abs(lay.johnCx - W / 2) > 0.5 || lay.js < 0.999) {
			hookJohn(play.canvas);
			const fwOrig = 4 * skinColW;
			Object.assign(xf, {
				on: true, js: lay.js, ox: W / 2, cx: lay.johnCx,
				lo: W / 2 - fwOrig / 2 - EDGE, hi: W / 2 + fwOrig / 2 + EDGE, lineY, H,
			});
		} else if (hooked) unhookJohn();
		const colors = [0, 1, 2, 3].map(c => (data && data.hitObjects && data.hitObjects[c] && data.hitObjects[c].color) || '#e8e8f0');
		loadHitsound(data);

		const now = songNow();
		timeouts(now);
		const game = run.game;
		const speed = setting('scrollspeed', 16) || 16;
		const pxPerUnit = lineY / (11485 / speed);
		const nowPos = game.scroll.positionAt(now - settings.offset);
		const posY = (pos) => lineY - (pos - nowPos) * pxPerUnit;
		const x0 = lay.x0, fw = 4 * colW;

		cx.clearRect(0, 0, W, H);
		cx.fillStyle = 'rgba(0,0,0,0.55)';
		cx.fillRect(x0, 0, fw, H);
		cx.strokeStyle = 'rgba(255,255,255,0.06)';
		cx.lineWidth = 1;
		for (let c = 1; c < 4; c++) {
			cx.beginPath(); cx.moveTo(x0 + c * colW + 0.5, 0); cx.lineTo(x0 + c * colW + 0.5, H); cx.stroke();
		}

		for (const n of run.notes) {
			const cxl = x0 + n.col * colW;
			if (n.hold) {
				if (n.tailDone) continue;
				const yHead = n.holding ? lineY : posY(n.headPos);
				// held past its end: it stops at the receptors (not past them)
				const yTail = n.holding ? Math.min(posY(n.tailPos), lineY) : posY(n.tailPos);
				const top = Math.min(yHead, yTail), bottom = Math.max(yHead, yTail);
				if (bottom < -2 - nh || top > H + 2) { if (top > H + 2) continue; else break; }
				cx.fillStyle = colorA(colors[n.col], n.holding ? 0.85 : 0.5);
				cx.fillRect(cxl + 6, top, colW - 12, bottom - top);
				cx.fillStyle = colors[n.col];
				cx.fillRect(cxl + 4, yTail - nh, colW - 8, nh);
				cx.fillRect(cxl + 4, yHead - nh, colW - 8, nh);
			} else {
				if (n.headDone) continue;
				const y = posY(n.headPos);
				if (y < -nh) break;          // the rest are further up still
				if (y > H + nh) continue;
				cx.fillStyle = colors[n.col];
				roundRect(cxl + 4, y - nh, colW - 8, nh, 4);
				cx.fill();
			}
		}

		for (let c = 0; c < 4; c++) {
			const cxl = x0 + c * colW;
			cx.strokeStyle = 'rgba(255,255,255,0.4)';
			cx.lineWidth = 2;
			cx.strokeRect(cxl + 4, lineY - rh, colW - 8, rh);
			const glow = held[c] ? 1 : Math.max(0, 1 - (performance.now() - pressedAt[c]) / 140);
			if (glow > 0) {
				cx.fillStyle = colorA(colors[c], 0.35 * glow);
				cx.fillRect(cxl + 4, lineY - rh, colW - 8, rh);
			}
		}

		const mid = x0 + fw / 2;
		cx.textAlign = 'center';
		if (run.last && performance.now() - run.last.at < 450) {
			const jd = data && data.judgements && data.judgements[run.last.j];
			cx.fillStyle = (jd && jd.judge) || '#fff';
			cx.font = '700 26px "Exo 2", sans-serif';
			cx.fillText((jd && jd.text) || run.last.j, mid, lineY - 90);
		}
		if (run.combo > 0) {
			cx.fillStyle = '#fff';
			cx.font = '800 44px "Exo 2", sans-serif';
			cx.fillText(`${run.combo}x`, mid, H * 0.42);
		}
		cx.textAlign = 'left';
		cx.font = '700 18px "Exo 2", sans-serif';
		cx.fillStyle = '#fff';
		cx.fillText(`You ${(accuracy() * 100).toFixed(2)}%`, x0 + 6, 96);
		cx.font = '500 14px "Exo 2", sans-serif';
		cx.fillStyle = 'rgba(255,255,255,0.7)';
		cx.fillText(`John ${(game.score.accuracy * 100).toFixed(2)}%`, x0 + 6, 116);

		if (!run.done && now > game.songEndMs + 500) {
			run.done = true;
			showResult();
		}
	};

	const showResult = () => {
		const mine = accuracy() * 100, john = run.game.score.accuracy * 100;
		const won = mine > john + 1e-9, tie = Math.abs(mine - john) < 1e-9;
		if (!resultBox) {
			resultBox = document.createElement('div');
			resultBox.style.cssText = [
				'position:fixed', 'left:50%', 'top:18%', 'transform:translateX(-50%)', 'z-index:99000',
				'pointer-events:none', 'padding:14px 22px', 'border-radius:12px', 'text-align:center',
				`background:${C.bg}`, `border:1px solid ${C.line}`, `color:${C.ink}`,
				'font:600 15px ' + UI_FONT, 'box-shadow:0 8px 32px rgba(0,0,0,.55)',
			].join(';');
			document.body.append(resultBox);
		}
		resultBox.replaceChildren(
			el('div', `font:800 22px ${UI_FONT};color:${tie ? C.ink : won ? C.ok : C.warn}`, tie ? 'A draw!' : won ? 'You beat John!' : 'John wins'),
			el('div', 'margin-top:6px', `You ${mine.toFixed(2)}% · max combo ${run.maxCombo}x`),
			el('div', `color:${C.muted}`, `John ${john.toFixed(2)}% · max combo ${run.game.score.maxCombo}x`),
			el('div', `margin-top:6px;font-size:12px;color:${C.muted}`,
				J.filter(j => j !== 'DIVINE' || run.counts.DIVINE).map(j => `${j[0]}${j.slice(1).toLowerCase()} ${run.counts[j]}`).join(' · ')),
		);
		resultBox.style.display = 'block';
		clearTimeout(resultTimer);
		resultTimer = setTimeout(() => { if (resultBox) resultBox.style.display = 'none'; }, 8000);
	};

	const loop = () => {
		raf = requestAnimationFrame(loop);
		xf.pending = true; // once a frame: the game's next block is his playfield
		const canvas = settings.enabled ? document.querySelector('canvas.play__canvas') : null;
		if (!canvas) {
			if (cv) cv.style.display = 'none';
			unhookJohn();
			play = null;
			return;
		}
		if (!play || play.canvas !== canvas || !play.game) play = findPlay(canvas);
		if (!play) return;
		if (!run || run.game !== play.game) {
			run = newRun(play.game);
			held.fill(false);
		}
		if (!cv || !cv.isConnected || cv.previousElementSibling !== canvas) {
			cv = cv || document.createElement('canvas');
			cv.className = VERSUS_CLASS;
			cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;z-index:3;pointer-events:none;display:block';
			canvas.after(cv);
			cx = cv.getContext('2d');
		}
		cv.style.display = 'block';
		draw();
	};

	const typing = (e) => {
		const t = e.target;
		return t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
	};
	const mount = () => {
		onDown = (e) => {
			if (!settings.enabled || !play || !run || typing(e)) return;
			const c = settings.keys.indexOf(e.code);
			if (c < 0) return;
			e.preventDefault();
			e.stopPropagation(); // the keys are yours while you play
			if (e.repeat || held[c]) return;
			held[c] = true;
			pressedAt[c] = performance.now();
			if (audio && audio.state === 'suspended') audio.resume();
			playHit();
			press(c, songNow());
		};
		onUp = (e) => {
			if (!settings.enabled || !play || !run) return;
			const c = settings.keys.indexOf(e.code);
			if (c < 0) return;
			e.preventDefault();
			e.stopPropagation();
			held[c] = false;
			release(c, songNow());
		};
		window.addEventListener('keydown', onDown, true);
		window.addEventListener('keyup', onUp, true);
		raf = requestAnimationFrame(loop);
	};
	const unmount = () => {
		cancelAnimationFrame(raf);
		unhookJohn();
		window.removeEventListener('keydown', onDown, true);
		window.removeEventListener('keyup', onUp, true);
		cv?.remove();
		cv = null; cx = null; play = null; run = null;
		clearTimeout(resultTimer);
		resultBox?.remove();
		resultBox = null;
		if (audio) { audio.close().catch(() => {}); audio = null; hitBuffer = null; hitUrl = ''; }
	};
	const fieldScale = (canvas) => (cv && canvas === cv ? myScale : 1);
	return { mount, unmount, settings, save, stageHere, fieldScale, keyName: (code) => code.replace(/^Key/, '').replace(/^Digit/, '') };
})();

let panel, onKey, els = {};

const el = (tag, css, text) => {
	const e = document.createElement(tag);
	if (css) e.style.cssText = css;
	if (text !== undefined) e.textContent = text;
	return e;
};
let BTN, BTN_MAIN, INPUT, LABEL, BOX;
const styleTheme = () => {
	const lz = lazerLook;
	Object.assign(C, lz ? LAZER_C : CLASSIC_C);
	UI_FONT = lz ? '"Outfit","Exo 2",system-ui,sans-serif' : 'system-ui,-apple-system,"Segoe UI",sans-serif';
	const border = lz ? 'border:0' : `border:1px solid ${C.line}`;
	const r = lz ? 10 : 8;
	BTN = `font:600 13px ${UI_FONT};color:${C.ink};background:${C.control};${border};border-radius:${r}px;padding:8px 14px;cursor:pointer`;
	BTN_MAIN = `font:600 13px ${UI_FONT};color:#fff;background:${C.accent};border:0;border-radius:${r}px;padding:8px 14px;cursor:pointer`;
	INPUT = `font:13px ${UI_FONT};color:${C.ink};background:${C.control};${border};border-radius:${r}px;padding:7px 10px;min-width:0`;
	LABEL = `display:grid;gap:4px;font-size:12px;color:${C.muted}`;
	BOX = lz ? `background:${C.sunken};border-radius:12px` : `background:${C.sunken};border:1px solid ${C.line};border-radius:10px`;
};
styleTheme();

const check = (text, get, set) => {
	const row = el('label', 'display:flex;gap:8px;align-items:center;cursor:pointer;font-size:13px');
	const box = el('input', `width:15px;height:15px;accent-color:${C.accent};cursor:pointer`);
	box.type = 'checkbox';
	box.checked = get();
	box.addEventListener('change', () => { set(box.checked); drawPreview(); });
	row.append(box, el('span', '', text));
	return row;
};

const setStatus = (text, color = C.muted) => {
	if (els.actionNote) els.actionNote.style.display = 'none'; // a new message: the last button's is done with
	els.status.textContent = text;
	els.status.style.color = color;
	els.spinner.style.display = 'none';
};
const setBusy = (text) => {
	els.status.textContent = text;
	els.status.style.color = C.ink;
	els.spinner.style.display = 'block';
};
const nextFrame = () => new Promise(resolve => requestAnimationFrame(() => setTimeout(resolve, 0)));

const drawPreview = () => {
	// sizes follow the game window: a resized window resizes the skin too
	if (window.innerHeight && window.innerHeight !== windowH) {
		windowH = window.innerHeight;
		els.showSizes?.();
		els.showJudge?.();
	}
	queueLive();
	renderPreview();
	syncFills();
};
// the health bar images in the preview, the way they're drawn in game
const previewHp = (ctx, x, bottom, k, frac) => {
	const g = hpGeometry();
	const box = { x, y: bottom - g.long * k, w: g.thick * k, h: g.long * k };
	const imgOf = (e) => (e && e.i >= 0 ? frameAt(skin.images.canvases[e.i], animSpeed / 100) : null);
	const bg = imgOf(skin.images.hp.bg), col = imgOf(skin.images.hp.colour);
	const draw = (img, isColour, f) => {
		if (!img) return;
		const ref = bg || img;
		const long = g.side ? ref.width : ref.height;
		const s = box.h / long;
		ctx.save();
		if (g.side) { ctx.translate(box.x, box.y + box.h); ctx.rotate(-Math.PI / 2); } else ctx.translate(box.x, box.y);
		let dx = 0, dy = 0;
		if (isColour && bg) {
			const hd = ref.height / (ref.osuH || ref.height);
			if (g.side) { dx = (skin.images.hp.marker ? 12 : 3) * hd * s; dy = (skin.images.hp.marker ? 13 : 10) * hd * s; }
			else { dx = (box.w - img.width * s) / 2; dy = box.h - img.height * s; }
		}
		const w = img.width * s, h = img.height * s;
		if (f < 1) {
			ctx.beginPath();
			if (g.side) ctx.rect(0, 0, dx + w * f, box.w + h); else ctx.rect(-box.w, dy + h * (1 - f), box.w * 3, h * f + 1);
			ctx.clip();
		}
		ctx.drawImage(img, dx, dy, w, h);
		ctx.restore();
	};
	draw(bg, false, 1);
	draw(col, true, frac);
};
let animTimer;
const animating = () => !!(skin && (usingImages() || judgeImgsOn() || hpImgsOn()) && Object.keys(skin.images.anim || {}).length);
const renderPreview = () => {
	const cv = els.preview;
	if (!cv || !panel || panel.style.display === 'none') return;
	const W = cv.clientWidth, H = cv.clientHeight;
	if (!W || !H) return;
	const dpr = Math.min(window.devicePixelRatio || 1, 2);
	cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
	const ctx = cv.getContext('2d');
	ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
	ctx.fillStyle = '#0b0910';
	ctx.fillRect(0, 0, W, H);
	if (!skin) {
		hideHandles();
		ctx.fillStyle = C.muted;
		ctx.font = '600 15px ' + UI_FONT;
		ctx.textAlign = 'center';
		ctx.fillText('Choose a skin to see it here, at the size it will be in game', W / 2, H / 2);
		return;
	}

	const s = sizes();
	const k = H / windowH; // 1 when previewing this window
	const cw = s.columnWidth * k, nh = Math.max(2, s.noteHeight * k), rh = Math.max(2, s.receptorHeight * k);
	const fieldW = cw * 4, x0 = (W - fieldW) / 2, lineY = H - s.hitPosition * k;
	const fieldCx = x0 + fieldW / 2;

	ctx.save();
	if (upscroll) { ctx.translate(0, H); ctx.scale(1, -1); }

	ctx.fillStyle = 'rgba(0,0,0,0.55)';
	ctx.fillRect(x0, 0, fieldW, H);
	ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 1;
	for (let c = 0; c <= 4; c++) { ctx.beginPath(); ctx.moveTo(x0 + c * cw + 0.5, 0); ctx.lineTo(x0 + c * cw + 0.5, H); ctx.stroke(); }
	ctx.strokeStyle = 'rgba(255,255,255,0.16)';
	for (const y of [lineY - H * 0.35, lineY - H * 0.7]) { ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x0 + fieldW, y); ctx.stroke(); }

	const pad = 4 * k;
	const noteW = cw - pad * 2;

	const imgsOn0 = useStageImgs && hasImages() && skin.images.stage;
	const previewStage = (only) => {
		if (!imgsOn0) return;
		drawStage(ctx, (part) => {
			const e = skin.images.stage[part];
			return !e ? null : e.i < 0 ? 'blank' : { img: frameAt(skin.images.canvases[e.i], animSpeed / 100), w: e.w, h: e.h };
		}, x0, fieldW, lineY, H, only);
	};
	previewStage(['left', 'right', 'hint']);
	const r = noteW / 2;
	const cx = (c) => x0 + c * cw + pad + r;

	const imgsOn = useNoteImgs && hasImages();
	const objOn = imgsOn && !circles;
	const imgOf = (kind, c) => {
		const on = kind === 'key' || kind === 'keyDown' ? useKeyImgs && hasImages() : objOn;
		const i = on ? skin.images[kind][c] : null;
		return i == null ? null : i < 0 ? 'blank' : frameAt(skin.images.canvases[i], animSpeed / 100);
	};
	const noteImage = (img, c, y) => {
		const dh = noteW * img.height / img.width;
		const x = x0 + c * cw + pad, top = y - dh;
		ctx.save();
		if (upscroll) { ctx.translate(0, 2 * top + dh); ctx.scale(1, -1); }
		ctx.drawImage(img, x, top, noteW, dh);
		ctx.restore();
	};

	const note = (c, y, kind = 'note') => {
		const rawI = objOn ? (skin.images[kind][c] ?? (kind === 'head' ? skin.images.note[c] : null)) : null;
		const raw = rawI == null ? null : rawI < 0 ? 'blank' : skin.images.canvases[rawI];
		const img = noteFrameAt(raw, (y / Math.max(1, lineY)) * DEFAULT_SCROLL_MS, animSpeed / 100);
		if (img === 'blank') return;
		if (img) return noteImage(img, c, y);
		ctx.fillStyle = skin.colors[c];
		if (!circles) {
			ctx.beginPath();
			if (ctx.roundRect) ctx.roundRect(x0 + c * cw + pad, y - nh, noteW, nh, Math.min(4 * k, nh / 2)); else ctx.rect(x0 + c * cw + pad, y - nh, noteW, nh);
			ctx.fill();
			return;
		}
		ctx.beginPath();
		ctx.arc(cx(c), y - r, r, 0, Math.PI * 2);
		ctx.fill();
		ctx.lineWidth = Math.max(1, r * 0.09);
		ctx.strokeStyle = 'rgba(0,0,0,0.28)';
		ctx.stroke();
	};

	const headY = lineY - H * 0.18, tailY = Math.min(headY, lineY - H * 0.5 + percyPx(H));
	const bodyImg = imgOf('body', 3);
	if (objOn && (bodyImg || imgOf('head', 3) || imgOf('note', 3))) {
		if (bodyImg && bodyImg !== 'blank') ctx.drawImage(bodyImg, x0 + 3 * cw + pad, tailY - nh / 2, noteW, headY - tailY);
		else if (!bodyImg) { ctx.fillStyle = skin.colors[3] + '80'; ctx.fillRect(x0 + 3 * cw + 6 * k, tailY, cw - 12 * k, headY - tailY); }
		const tailImg = imgOf('tail', 3);
		if (tailImg && tailImg !== 'blank') noteImage(tailImg, 3, tailY);
		else if (!tailImg && !bodyImg) { ctx.fillStyle = skin.colors[3]; ctx.fillRect(x0 + 3 * cw + pad, tailY - nh, noteW, nh); }
		note(3, headY, 'head');
	} else if (!circles) {
		ctx.fillStyle = skin.colors[3] + '80';
		ctx.fillRect(x0 + 3 * cw + 6 * k, tailY, cw - 12 * k, headY - tailY);
		note(3, tailY); note(3, headY);
	} else {
		const top = tailY - noteW, bottom = headY;
		ctx.beginPath();
		ctx.arc(cx(3), top + r, r, Math.PI, 0);
		ctx.lineTo(cx(3) + r, bottom - r);
		ctx.arc(cx(3), bottom - r, r, 0, Math.PI);
		ctx.closePath();
		const bi = imgsOn ? skin.images.body[3] : null;
		const bimg = bi != null && bi >= 0 ? frameAt(skin.images.canvases[bi], animSpeed / 100) : null;
		if (bimg) {
			ctx.save(); ctx.clip();
			ctx.drawImage(bimg, x0 + 3 * cw + pad, top, noteW, bottom - top);
			ctx.restore();
		} else {
			ctx.fillStyle = skin.colors[3] + '80'; ctx.fill();
			ctx.strokeStyle = skin.colors[3]; ctx.lineWidth = Math.max(1, noteW * 0.05); ctx.stroke();
		}
		if (tailCircles) note(3, tailY);
		note(3, headY);
	}
	note(0, lineY - H * 0.06); note(1, lineY - H * 0.24); note(2, lineY - H * 0.4); note(0, lineY - H * 0.55); note(1, lineY - H * 0.72);

	previewStage(['bottom']);

	ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 2;
	for (let c = 0; c < 4; c++) {
		const key = imgOf('key', c);
		if (key === 'blank') continue;
		if (key) {
			const dh = keyHeight(key, cw, H);
			const bottom = lineY + skinHitPosition() * k;
			ctx.drawImage(key, x0 + c * cw, bottom - dh, cw, dh);
			continue;
		}
		if (!circles) { ctx.strokeRect(x0 + c * cw + pad, lineY - rh, noteW, rh); continue; }
		ctx.beginPath();
		ctx.arc(cx(c), lineY - r, r - 1, 0, Math.PI * 2);
		ctx.stroke();
	}
	ctx.restore();

	const mirror = (y) => (upscroll ? H - y : y);
	ctx.textAlign = 'center';
	ctx.fillStyle = skin.judges.PERFECT;
	ctx.font = `700 ${26 * k}px "Exo 2", system-ui, sans-serif`;
	// where the game puts them: the skin's ScorePosition and ComboPosition (osu!'s 480-high units)
	const judgeY = mirror(judge.fromBottom !== null ? H - judge.fromBottom * k : skin.raw.scorePosition / 480 * H);
	const judgeX = fieldCx + (judge.dx || 0) * k;
	const boxes = [];
	const judgeFb = (H - mirror(judgeY)) / k;
	const jImg = judgeImgsOn() && skin.images.judge.PERFECT && skin.images.judge.PERFECT.i >= 0
		? frameAt(skin.images.canvases[skin.images.judge.PERFECT.i], animSpeed / 100) : null;
	if (jImg) {
		const jh = (jImg.osuH || jImg.height) * H / 768 * judgeSize / 100, jw = jImg.width * jh / jImg.height;
		ctx.drawImage(jImg, judgeX - jw / 2, judgeY - jh / 2, jw, jh);
		boxes.push({ id: 'judge', label: 'Judgements', fb: judgeFb, x: judgeX - Math.max(jw, 60 * k) / 2, y: judgeY - Math.max(jh, 30 * k) / 2, w: Math.max(jw, 60 * k), h: Math.max(jh, 30 * k) });
	} else {
		if (!(judgeImgsOn() && skin.images.judge.PERFECT)) ctx.fillText('PERFECT', judgeX, judgeY + 9 * k);
		boxes.push({ id: 'judge', label: 'Judgements', fb: judgeFb, x: judgeX - 80 * k, y: judgeY - 18 * k, w: 160 * k, h: 36 * k });
	}
	ctx.fillStyle = '#fff';
	ctx.font = `800 ${44 * k}px "Exo 2", system-ui, sans-serif`;
	const comboX = fieldCx + combo.dx * k, comboY = mirror(skin.raw.comboPosition / 480 * H + combo.dy * k);
	ctx.fillText('727x', comboX, comboY + 16 * k);
	boxes.push({ id: 'combo', label: 'Combo', x: comboX - 70 * k, y: comboY - 26 * k, w: 140 * k, h: 52 * k });
	ctx.textAlign = 'right';
	ctx.font = `700 ${30 * k}px "Exo 2", system-ui, sans-serif`;
	ctx.fillText('98.76%', W - 28 * k, 48 * k);
	ctx.font = `500 ${18 * k}px "Exo 2", system-ui, sans-serif`;
	ctx.fillStyle = 'rgba(255,255,255,0.75)';
	ctx.fillText('727,727', W - 28 * k, 76 * k);
	ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(0, 0, W, 4 * k);
	ctx.fillStyle = '#ff66ab'; ctx.fillRect(0, 0, W * 0.4, 4 * k);

	const hpBottom = H - hpPos.fromBottom * k;
	if (hpImgsOn()) {
		const g = hpGeometry(), hx = x0 + fieldW + (hpPos.gap ?? 0) * k;
		previewHp(ctx, hx, hpBottom, k, 0.72);
	} else {
		const hpH = Math.min(340, windowH) * k, hpW = 16 * k, hx = x0 + fieldW + (hpPos.gap ?? 5) * k;
		ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(hx, hpBottom - hpH, hpW, hpH);
		ctx.fillStyle = '#ffffff';
		ctx.fillRect(hx, hpBottom - hpH * 0.72, hpW, hpH * 0.72);
	}
	{ // the health bar's outline for grab and move
		const g2 = hpImgsOn() ? hpGeometry() : null;
		const hpW2 = g2 ? g2.thick * k : 16 * k, hpH2 = g2 ? g2.long * k : Math.min(340, windowH) * k;
		const hx2 = x0 + fieldW + (hpPos.gap ?? (g2 ? 0 : 5)) * k;
		boxes.push({ id: 'hp', label: 'Health bar', x: hx2, y: hpBottom - hpH2, w: g2 && g2.side ? hpH2 : hpW2, h: g2 && g2.side ? hpW2 : hpH2 });
	}

	let ux = fieldCx + ur.dx * k, uy = lineY + 78 * k + ur.dy * k;
	if (ur.keepOnScreen) {
		uy = Math.min(Math.max(uy, (19 + 6) * k), H - (10 + 6) * k);
		ux = Math.min(Math.max(ux, 6 * k), W - 6 * k);
	}
	const half = Math.min(170 * k, fieldW / 2) * 1.3;
	const windowsMs = [16, 40, 73, 103, 127, 164];
	let prevW = 0;
	JUDGEMENTS.slice(0, 6).forEach((j, i) => {
		const wpx = windowsMs[i] / 188 * half;
		ctx.fillStyle = skin.judges[j] + '66';
		ctx.fillRect(ux + prevW, uy - 4 * k, wpx - prevW, 8 * k);
		ctx.fillRect(ux - wpx, uy - 4 * k, wpx - prevW, 8 * k);
		prevW = wpx;
	});
	ctx.fillStyle = '#fff'; ctx.fillRect(ux - 1, uy - 8 * k, 2, 16 * k);
	ctx.fillStyle = skin.judges.PERFECT;
	for (const off of [-0.3, -0.12, 0.05, 0.1, 0.22]) ctx.fillRect(ux + off * half - 1, uy - 10 * k, 2, 20 * k);
	boxes.push({ id: 'ur', label: 'UR bar', x: ux - half, y: uy - 14 * k, w: half * 2, h: 28 * k });
	placeHandles(boxes, cv.getBoundingClientRect(), k);

	els.previewNote.textContent = Math.abs(k - 1) < 0.001
		? `Pixel for pixel with this ${Math.round(H)}px-tall window`
		: `Scaled to show a ${windowH}px-tall game window`;
};

const animSlider = () => {
	const wrap = el('label', LABEL);
	const text = el('span');
	const input = el('input', `width:100%;accent-color:${C.accent}`);
	input.type = 'range';
	input.min = '10'; input.max = '400'; input.step = '5';
	input.value = String(animSpeed);
	const anims = Object.values(skin.images.anim);
	const show = () => {
		const fps = anims.length ? Math.round(anims[0].fps * animSpeed) / 100 : 0;
		text.textContent = `Animation speed: ${animSpeed}%${animSpeed === 100 ? ' (the skin\'s own)' : ''} · ${fps} frames a second`;
	};
	input.addEventListener('input', () => { animSpeed = Number(input.value); show(); drawPreview(); });
	input.addEventListener('dblclick', () => { animSpeed = 100; input.value = '100'; show(); drawPreview(); });
	show();
	wrap.title = 'Double-click to reset';
	wrap.append(text, input);
	return wrap;
};

const pctSlider = (label, get, set, min, max) => {
	const wrap = el('label', LABEL + ';padding-left:24px');
	const text = el('span');
	const input = el('input', `width:100%;accent-color:${C.accent}`);
	input.type = 'range'; input.min = String(min); input.max = String(max); input.step = '5';
	input.value = String(get());
	const show = () => { text.textContent = `${label}: ${get()}%`; };
	input.addEventListener('input', () => { set(Number(input.value)); show(); drawPreview(); });
	input.addEventListener('dblclick', () => { set(100); input.value = '100'; show(); drawPreview(); });
	wrap.title = 'Double-click to reset';
	show();
	wrap.append(text, input);
	return wrap;
};
const renderSkin = (warnings) => {
	els.details.style.display = skin ? 'grid' : 'none';
	if (!skin) return;
	els.name.value = skin.name;
	els.colors.replaceChildren(...skin.colors.map((col, c) => {
		const pick = el('input', `width:100%;height:28px;padding:2px;border:0;border-radius:8px;background:${C.sunken};cursor:pointer`);
		pick.type = 'color';
		pick.value = col;
		pick.title = `Column ${c + 1}`;
		pick.addEventListener('input', () => { skin.colors[c] = pick.value; drawPreview(); });
		return pick;
	}));
	els.extras.replaceChildren(
		...(Object.keys(skin.grades).length ? [check('Grade images', () => useGrades, v => { useGrades = v; })] : []),
		...(skin.sound ? [check(skin.sound.silent ? 'Hitsound (silent in this skin)' : 'Hitsound', () => useSound, v => { useSound = v; })] : []),
		...(hasImages() ? [
			...(hasNoteImgs() ? [check('Note images', () => useNoteImgs, v => { useNoteImgs = v; })] : []),
			...(hasKeyImgs() ? [check('Key images', () => useKeyImgs, v => { useKeyImgs = v; })] : []),
			...(hasStageImgs() ? [check('Stage images', () => useStageImgs, v => { useStageImgs = v; })] : []),
			el('div', `font-size:11px;color:${C.muted};padding-left:24px`,
				'Switched off, the game uses its own for those (and the skin.ini lines naming them are left out).'),
			...(hasJudgeImgs() ? [check(`Judgement images (${(() => {
				const j = skin.images.judge, n = JUDGEMENTS.filter(k => j[k] && j[k].i >= 0).length, b = JUDGEMENTS.filter(k => j[k] && j[k].i < 0).length;
				return `${n} of ${JUDGEMENTS.length}${b ? `, ${b} blank: shown as nothing` : ''}`;
			})()})`, () => useJudgeImgs, v => { useJudgeImgs = v; })] : []),
			...(hasHpImgs() ? [check('Health bar images', () => useHpImgs, v => { useHpImgs = v; })] : []),
		] : []),
		...(hasImages() && Object.keys(skin.images.anim || {}).length ? [animSlider()] : []),
	);
	els.warnings.replaceChildren(...warnings.map(w => el('div', `font-size:12px;color:${C.warn}`, w)));
	els.showSizes();
	els.showJudge?.();
	drawPreview();
};

const load = async (open, label) => {
	setBusy(`Converting ${label}…`);
	await nextFrame(); // let the spinner show before the work starts
	try {
		const result = await convert(await open(), label.replace(/\.(osk|zip)$/i, ''));
		skin = result.skin;
		receptorPos = null;
		liveId = null; // a new skin: it goes live as soon as it's converted (see load)
		animSpeed = 100;
		renderSkin(result.warnings);
		setStatus(`Converted ${label}. Using it now…`, C.ok);
		await els.useSkin?.();
	} catch (e) {
		skin = null;
		renderSkin([]);
		setStatus(`Couldn't read ${label}: ${e.message || e}`, C.warn);
	}
};
const loadFile = (file) => { if (file) load(() => readZip(file), file.name); };

let folderSkins = [];
let waitingForFolder = false, onFocusBack;
let folderHandle = null; // the remembered Skins folder, when the browser can keep one

const showList = (list, note) => {
	folderSkins = list.skins;
	els.folder.style.display = 'grid';
	els.folderName.textContent = `${list.folder} · ${list.skins.length} skin${list.skins.length === 1 ? '' : 's'}`;
	els.folderTools.style.display = folderHandle ? 'flex' : 'none';
	renderFolder();
	if (note) setStatus(note, list.skins.length ? C.ok : C.warn);
};

const refreshList = async (ask) => {
	if (!folderHandle) return false;
	if (!(await allowed(folderHandle, ask))) return false;
	const list = await listFolder(folderHandle);
	saveList(list);
	showList(list);
	return true;
};

const openRemembered = async (item) => {
	if (!folderHandle || !(await allowed(folderHandle, true))) {
		setStatus('The browser didn\'t allow reading your Skins folder. Choose it again.', C.warn);
		return;
	}
	load(() => openListed(folderHandle, item), item.name);
};

let picking = false; // the folder window is open: more clicks would only open it again
const STUCK_MS = 2000; // after the folder window closes, how long the folder may take to arrive
let pickCall = 0;
const pickFolder = async () => {
	picking = true;
	const call = ++pickCall;
	setBusy('Choose your Skins folder in the window that opened…');
	const onBack = () => setTimeout(() => {
		if (!picking || call !== pickCall) return;
		picking = false;
		pickCall++; // whatever this call returns now is too late
		useOldPicker();
		setStatus('This game\'s folder window didn\'t hand the folder over, so the editor switched to its other one. Click "Choose your osu! Skins folder" again.', C.warn);
	}, STUCK_MS);
	const onAway = () => window.addEventListener('focus', onBack, { once: true });
	window.addEventListener('blur', onAway, { once: true });
	const stopWatching = () => {
		window.removeEventListener('blur', onAway);
		window.removeEventListener('focus', onBack);
	};
	let handle;
	try {
		handle = await window.showDirectoryPicker({ id: 'osu-skins', mode: 'read' });
		if (call !== pickCall) return; // gave up on this one already
		stopWatching();
	} catch (e) {
		stopWatching();
		if (call !== pickCall) return;
		if (e && e.name === 'AbortError') setStatus('No folder chosen.');
		else if (/already active/i.test(String(e && e.message))) {
			useOldPicker();
			setStatus('This game\'s folder window isn\'t working, so the editor switched to its other one. Click "Choose your osu! Skins folder" again.', C.warn);
		} else setStatus(`Couldn't open that folder: ${e.message || e}`, C.warn);
		picking = false;
		return;
	}
	stopWatching();
	picking = false;
	setBusy('Listing your skins…');
	await nextFrame();
	try {
		folderHandle = handle;
		await saveFolder(handle).catch(() => {});
		const list = await listFolder(handle);
		saveList(list);
		els.filter.value = '';
		showList(list, `Found ${list.skins.length} skin${list.skins.length === 1 ? '' : 's'}. Pick one to convert. This folder is remembered for next time.`);
	} catch (e) {
		setStatus(`Couldn't read that folder: ${e.message || e}`, C.warn);
	}
};

// A folder dragged onto the editor (the Skins folder, or one skin): only the
// names at the top are read, and a skin's files once it's picked. The folder is
// remembered when the browser hands over one it can keep.
const openDroppedFolder = async (kept, entry) => {
	setBusy('Listing your skins…');
	await nextFrame();
	try {
		let handle = null;
		try { handle = kept ? await kept : null; } catch {}
		const keepable = !!(handle && handle.kind === 'directory');
		if (!keepable) handle = entryHandle(entry);
		folderHandle = handle;
		if (keepable) await saveFolder(handle).catch(() => {});
		const list = await listFolder(handle);
		if (keepable) saveList(list);
		els.filter.value = '';
		showList(list, `Found ${list.skins.length} skin${list.skins.length === 1 ? '' : 's'}. Pick one to convert.${keepable ? ' This folder is remembered for next time.' : ''}`);
	} catch (e) {
		setStatus(`Couldn't read that folder: ${e.message || e}`, C.warn);
	}
};

const restoreFolder = async () => {
	if (folderSkins.length) return;
	const handle = await savedFolder();
	const list = savedList();
	if (!handle || !list) return;
	folderHandle = handle;
	showList(list, `Your skins from last time (${list.folder}). Pick one to convert.`);
	refreshList(false).catch(() => {});
};
const renderFolder = () => {
	const q = els.filter.value.trim().toLowerCase();
	const shown = folderSkins.filter(sk => sk.name.toLowerCase().includes(q));
	els.list.replaceChildren(...shown.map(sk => {
		const b = el('button', `text-align:left;font:13px ${UI_FONT};color:${C.ink};background:transparent;border:0;border-radius:6px;padding:6px 8px;cursor:pointer`, sk.name);
		b.addEventListener('mouseenter', () => { b.style.background = C.sunken; });
		b.addEventListener('mouseleave', () => { b.style.background = 'transparent'; });
		b.addEventListener('click', () => (sk.source ? load(async () => sk.source, sk.name) : openRemembered(sk)));
		return b;
	}));
	if (!shown.length) els.list.append(el('div', `padding:6px 8px;color:${C.muted}`, folderSkins.length ? 'No skins match.' : 'No skins found in that folder.'));
};

const buildPanel = () => {
	panel = el('div', [
		'position:fixed', 'inset:0', 'z-index:99000', // under the game's cursor (99999-100000), above its menus
		'display:none', 'grid-template-columns:minmax(320px, 420px) minmax(0, 1fr)',
		`background:${C.bg}`, `color:${C.ink}`, 'font:13px ' + UI_FONT,
	].join(';'));
	const sidebar = el('div', `display:flex;flex-direction:column;gap:12px;padding:16px;overflow:auto;box-sizing:border-box;border-right:1px solid ${C.line};min-height:0`);
	els.sidebar = sidebar;
	panel.addEventListener('keydown', e => e.stopPropagation());
	if (lazerLook) {
		panel.classList.add('ssi-lz');
		const lzStyle = document.createElement('style');
		lzStyle.textContent = PANEL_CSS;
		panel.append(lzStyle);
	}
	panel.addEventListener('input', syncFills);

	const head = el('div', 'display:flex;align-items:center;gap:10px');
	const close = el('button', BTN, 'Close');
	close.addEventListener('click', () => closePanel());
	const seeBtn = el('button', BTN + ';margin-left:auto', 'Live preview');
	seeBtn.title = 'A map plays itself behind the editor, so your changes show in game as you make them';
	seeBtn.addEventListener('click', () => {
		if (see.on) { see.on = false; liveMap.stop(); applySee(); return; }
		openLive();
	});
	els.seeBtn = seeBtn;
	head.append(
		el('div', lazerLook ? `font:600 18px ${UI_FONT};color:${C.ink}` : `font:700 16px ${UI_FONT};color:${C.ink}`, 'skin editor'),
		el('span', `font-size:11px;color:${C.muted}`, 'v0.33.0'),
		seeBtn,
		close,
	);

	const drop = el('label', `display:grid;gap:4px;justify-items:center;text-align:center;padding:18px;border:2px dashed ${C.line};border-radius:10px;background:${C.sunken};cursor:pointer`);
	const file = el('input', 'position:absolute;width:1px;height:1px;opacity:0');
	file.type = 'file';
	file.accept = '.osk,.zip';
	file.addEventListener('change', () => loadFile(file.files[0]));
	drop.append(file, el('strong', 'font-size:14px', 'Choose or drop an .osk file'), el('span', `color:${C.muted};font-size:12px`, 'or drag your whole Skins folder here (the quickest way). Read on your computer, never uploaded'));
	drop.addEventListener('dragover', e => { e.preventDefault(); drop.style.borderColor = C.accent; });
	drop.addEventListener('dragleave', () => { drop.style.borderColor = C.line; });
	drop.addEventListener('drop', e => {
		e.preventDefault();
		drop.style.borderColor = C.line;
		// the dropped thing must be taken now, during the drop
		const item = e.dataTransfer.items && e.dataTransfer.items[0];
		const kept = item && typeof item.getAsFileSystemHandle === 'function' ? item.getAsFileSystemHandle() : null;
		const entry = item && typeof item.webkitGetAsEntry === 'function' ? item.webkitGetAsEntry() : null;
		const file = e.dataTransfer.files[0];
		if (entry && entry.isDirectory) openDroppedFolder(kept, entry);
		else loadFile(file);
	});

	const folderRow = el('div', 'display:flex;gap:10px;align-items:center;flex-wrap:wrap');
	const folderBtn = el('label', BTN + ';display:inline-block');
	const folderInput = el('input', 'position:absolute;width:1px;height:1px;opacity:0');
	folderInput.type = 'file';
	folderInput.webkitdirectory = true;
	folderInput.multiple = true;
	const folderDone = () => {
		waitingForFolder = false;
		folderBtn.style.opacity = '1';
		folderBtn.style.pointerEvents = '';
	};
	folderBtn.addEventListener('click', (e) => {
		if (useNewPicker()) {
			e.preventDefault();
			if (picking) {
				picking = false;
				useOldPicker();
				folderInput.click();
				return;
			}
			pickFolder();
			return;
		}
		if (waitingForFolder) return;
		waitingForFolder = true;
		folderBtn.style.opacity = '0.6';
		folderBtn.style.pointerEvents = 'none';
		setBusy('Choose your Skins folder in the window that opened…');
		window.removeEventListener('focus', onFocusBack);
		onFocusBack = () => {
			if (!waitingForFolder) return;
			setBusy('Reading your Skins folder… big folders can take a little while.');
			folderBtn.style.opacity = '1';
			folderBtn.style.pointerEvents = '';
			waitingForFolder = false;
		};
		window.addEventListener('focus', onFocusBack, { once: true });
	});
	folderInput.addEventListener('cancel', () => {
		folderDone();
		setStatus('No folder chosen.');
	});
	folderInput.addEventListener('change', async () => {
		setBusy(`Sorting ${folderInput.files.length.toLocaleString()} files into skins…`);
		await nextFrame();
		try {
			folderSkins = skinsInFolder(folderInput.files);
			els.folder.style.display = 'grid';
			els.folderName.textContent = `${folderSkins.length} skin${folderSkins.length === 1 ? '' : 's'}`;
			els.filter.value = '';
			renderFolder();
			setStatus(`Found ${folderSkins.length} skin${folderSkins.length === 1 ? '' : 's'}. Pick one to convert.`, folderSkins.length ? C.ok : C.warn);
		} catch (e) {
			setStatus(`Couldn't read that folder: ${e.message || e}`, C.warn);
		} finally {
			folderDone();
			folderInput.value = '';
		}
	});
	folderBtn.append(folderInput, document.createTextNode('Choose your osu! Skins folder'));
	folderRow.append(
		folderBtn,
		el('span', `font-size:12px;color:${C.muted}`, 'Usually C:\\Users\\<you>\\AppData\\Local\\osu!\\Skins'),
	);
	// the slow way (every file in every skin read first): say so, and offer the quick ones
	const slowNote = el('div', `font-size:12px;color:${C.muted};line-height:1.45`);
	const retry = el('button', `font:inherit;color:${C.accent};background:none;border:0;padding:0;cursor:pointer;text-decoration:underline`, 'try the quick folder window again');
	retry.addEventListener('click', () => {
		try { localStorage.removeItem(PICKER_KEY); } catch {}
		showSlowNote();
		setStatus('Click "Choose your osu! Skins folder" to use the quick folder window. If it doesn\'t hand the folder over, the editor goes back to the slow one.');
	});
	const showSlowNote = () => {
		const slow = !useNewPicker();
		slowNote.style.display = slow ? 'block' : 'none';
		if (!slow) return;
		slowNote.replaceChildren(
			document.createTextNode('The button reads every file in every skin before listing them, which is slow for a big folder. Much quicker: drag the Skins folder from File Explorer onto the box above, which lists skins straight away'),
			...(canRemember ? [document.createTextNode(', or '), retry] : []),
			document.createTextNode('.'),
		);
	};
	showSlowNote();
	folderBtn.addEventListener('click', () => setTimeout(showSlowNote, 0));

	els.folder = el('div', `display:none;gap:6px;padding:8px;${BOX}`);
	const folderHead = el('div', 'display:flex;gap:8px;align-items:center;flex-wrap:wrap');
	els.folderName = el('span', `font-size:12px;color:${C.muted};margin-right:auto`);
	els.folderTools = el('div', 'display:none;gap:6px');
	const SMALL = `font:600 11px ${UI_FONT};color:${C.ink};background:${C.control};border:0;border-radius:8px;padding:4px 10px;cursor:pointer`;
	const refreshBtn = el('button', SMALL, 'Refresh');
	refreshBtn.title = 'Look for skins added or removed since';
	refreshBtn.addEventListener('click', async () => {
		setBusy('Listing your skins…');
		const ok = await refreshList(true).catch(() => false);
		if (ok) setStatus(`Found ${folderSkins.length} skin${folderSkins.length === 1 ? '' : 's'}.`, C.ok);
		else setStatus('The browser didn\'t allow reading your Skins folder. Choose it again.', C.warn);
	});
	const forgetBtn = el('button', SMALL, 'Forget');
	forgetBtn.title = 'Stop remembering this folder';
	forgetBtn.addEventListener('click', async () => {
		await forgetFolder();
		try { localStorage.removeItem(LIST_KEY); localStorage.removeItem(PICKER_KEY); } catch {}
		folderHandle = null;
		folderSkins = [];
		els.folder.style.display = 'none';
		setStatus('Forgot your Skins folder.');
	});
	els.folderTools.append(refreshBtn, forgetBtn);
	folderHead.append(els.folderName, els.folderTools);
	els.folder.append(folderHead);
	els.filter = el('input', INPUT);
	els.filter.type = 'text';
	els.filter.placeholder = 'Search your skins';
	els.filter.addEventListener('input', renderFolder);
	els.list = el('div', 'display:grid;max-height:180px;overflow:auto');
	els.folder.append(els.filter, els.list);

	els.status = el('div', `font-size:12px;color:${C.muted}`, 'Converts the 4K settings, colours, grade images and hitsound.');
	els.spinner = el('div', `display:none;flex:none;width:14px;height:14px;border-radius:50%;border:2px solid ${C.line};border-top-color:${C.accent};box-sizing:border-box`);
	els.spinner.animate([{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }], { duration: 800, iterations: Infinity });
	const statusRow = el('div', 'display:flex;gap:8px;align-items:center;min-height:18px');
	statusRow.append(els.spinner, els.status);
	els.warnings = el('div', 'display:grid;gap:3px');

	els.details = el('div', 'display:none;gap:14px');
	const left = el('div', 'display:grid;gap:10px;min-width:0');

	const nameLabel = el('label', LABEL, 'Skin name');
	els.name = el('input', INPUT);
	els.name.type = 'text';
	els.name.maxLength = 80;
	nameLabel.append(els.name);

	const sizeSliders = [];
	const sizeSlider = (label, get, set, min, max, px) => {
		const wrap = el('label', LABEL);
		const text = el('span');
		const input = el('input', `width:100%;accent-color:${C.accent}`);
		input.type = 'range';
		input.min = String(min); input.max = String(max); input.step = '5'; input.value = String(get());
		const show = () => { text.textContent = `${label}: ${get()}%${skin ? ` (${px()}px)` : ''}`; };
		input.addEventListener('input', () => { set(Number(input.value)); sizeSliders.forEach(f => f()); drawPreview(); });
		sizeSliders.push(show);
		wrap.append(text, input);
		return wrap;
	};
	const sizeLabel = el('div', 'display:grid;gap:8px');

	const recWrap = el('label', LABEL);
	const recText = el('span');
	const recInput = el('input', `width:100%;accent-color:${C.accent}`);
	recInput.type = 'range';
	recInput.min = '0'; recInput.step = '2';
	const recHint = el('div', `font-size:11px;color:${C.warn}`, 'Below 96px the UR bar would go off the screen, so keep "Keep it on screen" on in the UR bar settings.');
	const showReceptor = () => {
		recInput.max = String(Math.round(windowH * 0.5));
		if (!skin) { recText.textContent = 'Receptor position'; recHint.style.display = 'none'; return; }
		const px = sizes().hitPosition;
		recInput.value = String(px);
		recText.textContent = `Receptor position: ${px}px ${upscroll ? 'down from the top' : 'up from the bottom'}${receptorPos === null ? ' (skin\'s)' : ''}`;
		recHint.style.display = px < 96 ? '' : 'none';
	};
	recInput.addEventListener('input', () => { receptorPos = Number(recInput.value); showReceptor(); els.showJudge?.(); drawPreview(); });
	sizeSliders.push(showReceptor);
	recWrap.append(recText, recInput);

	sizeLabel.append(
		sizeSlider('Column width', () => widthPct, v => { widthPct = v; }, 25, 200, () => sizes().columnWidth),
		recWrap,
		recHint,
	);
	els.showSizes = () => sizeSliders.forEach(f => f());
	els.showSizes();

	const colorsLabel = el('div', LABEL, 'Note colours, columns 1–4');
	els.colors = el('div', 'display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px');
	colorsLabel.append(els.colors);

	els.extras = el('div', 'display:grid;gap:6px');

	left.append(nameLabel, sizeLabel, els.extras); // (note colours: the game draws the skin's own note images)
	els.details.append(left);

	const stage = el('div', 'position:relative;min-width:0;min-height:0');
	els.stage = stage;
	els.preview = el('canvas', 'position:absolute;inset:0;width:100%;height:100%;display:block');
	const upRow = check('Upscroll', () => upscroll, v => setUpscroll(v));
	els.syncCircleBoxes = () => { upRow.querySelector('input').checked = upscroll; };
	els.previewNote = el('div', `font-size:11px;color:${C.muted}`);
	const overlay = el('div', `position:absolute;left:12px;top:12px;padding:6px 10px;border-radius:8px;background:rgba(25,22,34,.85);border:1px solid ${C.line};max-width:260px`);
	overlay.append(els.previewNote);
	els.stageOverlay = overlay;
	stage.append(els.preview, overlay);

	const actions = el('div', 'display:flex;gap:8px;flex-wrap:wrap;align-items:center');
	const installBtn = el('button', BTN_MAIN, 'Use this skin');
	const confirmBox = el('div', `display:none;gap:10px;padding:12px;border-radius:10px;background:#2b2112;border:1px solid ${C.warn}`);
	const confirmText = el('div', 'font-size:13px;line-height:1.45');
	const confirmYes = el('button', BTN_MAIN, 'Reload now');
		els.needReload = () => {
			const playing = !!document.querySelector('canvas.play__canvas');
			confirmText.replaceChildren(
				el('strong', `color:${C.warn}`, 'The game has to restart to see these files. '),
				document.createTextNode(playing ? 'Reloading ends the song you\'re playing.' : 'Restarting it now...'),
			);
			confirmBox.style.display = 'grid';
			if (!playing) { clearTimeout(els.reloadTimer); els.reloadTimer = setTimeout(() => location.reload(), 1800); }
		};
	const confirmNo = el('button', BTN, 'Later');
	const confirmRow = el('div', 'display:flex;gap:8px;flex-wrap:wrap');
	confirmRow.append(confirmYes, confirmNo);
	confirmBox.append(confirmText, confirmRow);
	const hideConfirm = () => { confirmBox.style.display = 'none'; };
	// what the two buttons did, right under them
	els.actionNote = el('div', 'display:none;font-size:13px;line-height:1.45');
	const actionMsg = (text, color = C.ok) => {
		els.actionNote.textContent = text;
		els.actionNote.style.color = color;
		els.actionNote.style.display = 'block';
	};

	// what the game made of the skin: how many files it loaded (a game that couldn't find the folder shows its own default)
	const gameLoaded = async () => {
		await new Promise(r => setTimeout(r, 900));
		const v = gameSkinNow();
		const o = v && v.osu;
		return o && o !== v.fallback && o.set ? o.set.size : 0;
	};
	const where = () => (hostLib() ? "the game's skin folders" : "the game's browser storage");
	const useSkin = async () => {
		if (!skin) return actionMsg('Choose an .osk file first.', C.warn);
		installBtn.disabled = true;
		installBtn.style.display = 'none';
		hideConfirm();
		try {
			if (await applySkin()) {
				const n = await gameLoaded();
				let found = '';
				const apis = () => { try { const d = window.ossIdleDesktop; return d ? `desktop[${Object.keys(d).join(',')}] library[${Object.keys(d.library || {}).join(',')}]` : 'no desktop api'; } catch { return '?'; } };
				try { if (hostLib()) { const e = await libEntry(liveId); found = e ? `, folder "${e.name}" with ${e.files.length} files` : ', folder NOT found'; } } catch (e) { found = `, folder check failed: ${e && e.message}`; }
				const msg = n ? `Using this skin now (the game loaded ${n} files; skin ${liveId}, saved in ${where()}${found}). Your edits show in game straight away.`
					: `Saved (skin ${liveId}, in ${where()}${found}), but the game did not load it: it still shows its own skin.`;
				actionMsg(n ? msg : `${msg} ${apis()}`, n ? C.ok : C.warn);
				setStatus(msg, n ? C.ok : C.warn);
			} else if (needReload) {
				els.needReload();
				actionMsg('Saved to the game\'s skins.');
			} else {
				const playing = !!document.querySelector('canvas.play__canvas');
				confirmText.replaceChildren(
					el('strong', `color:${C.warn}`, 'Saved, but the game couldn\'t switch to it live. '),
					document.createTextNode(playing
						? 'Reloading switches to it, but ends the song you\'re playing.'
						: 'Reload the game to switch to it.'),
				);
				confirmBox.style.display = 'grid';
				actionMsg('Saved to your skins.');
			}
		} catch (e) {
			actionMsg(`Couldn't use this skin: ${e.message || e}`, C.warn);
			installBtn.textContent = 'Try again';
			installBtn.style.display = '';
		} finally {
			installBtn.disabled = false;
		}
	};
	els.useSkin = useSkin; // a skin dropped in or picked is used right away
	installBtn.addEventListener('click', useSkin);
	installBtn.style.display = 'none'; // only shows again as "Try again" if using it fails
	confirmNo.addEventListener('click', () => { clearTimeout(els.reloadTimer); hideConfirm(); });
	confirmYes.addEventListener('click', () => location.reload());
	actions.append(installBtn, el('span', `font-size:12px;color:${C.muted}`, 'A skin you drop in or pick is added to the game\'s skins and used straight away, no reload. After that, edits show in game live.'));

	const urBox = el('div', 'display:grid;gap:8px');
	const urSlider = (label, key, min, max, dir) => {
		const wrap = el('label', LABEL);
		const text = el('span');
		const input = el('input', `width:100%;accent-color:${C.accent}`);
		input.type = 'range';
		input.min = String(min); input.max = String(max); input.step = '2';
		const show = () => {
			input.value = String(ur[key]);
			text.textContent = `${label}: ${ur[key] === 0 ? 'default' : `${Math.abs(ur[key])}px ${ur[key] < 0 ? dir[0] : dir[1]}`}`;
		};
		input.addEventListener('input', () => { ur[key] = Number(input.value); urSave(); });
		wrap.append(text, input);
		return { wrap, show };
	};
	const urUp = urSlider('Up / down', 'dy', -900, 300, ['up', 'down']);
	const urSide = urSlider('Left / right', 'dx', -600, 600, ['left', 'right']);
	const urKeep = el('label', 'display:flex;gap:8px;align-items:center;cursor:pointer;font-size:13px');
	const urKeepBox = el('input', `width:15px;height:15px;accent-color:${C.accent};cursor:pointer`);
	urKeepBox.type = 'checkbox';
	urKeepBox.addEventListener('change', () => { ur.keepOnScreen = urKeepBox.checked; urSave(); });
	urKeep.append(urKeepBox, el('span', '', 'Keep it on screen'));
	const urReset = el('button', BTN + ';justify-self:start;padding:5px 10px;font-size:12px', 'Reset position');
	urReset.addEventListener('click', () => { ur.dx = 0; ur.dy = 0; urSave(); });
	const urRow = el('div', 'display:grid;grid-template-columns:1fr 1fr;gap:12px');
	urRow.append(urUp.wrap, urSide.wrap);
	urBox.append(
		el('div', `font:600 12px ${UI_FONT};color:${C.ink}`, 'UR bar position'),
		urRow,
		el('div', 'display:flex;gap:14px;align-items:center;flex-wrap:wrap'),
		el('div', `font-size:11px;color:${C.muted}`, 'Moves the hit error bar.'),
	);
	urBox.children[2].append(urKeep, urReset);
	els.urShow = () => { urUp.show(); urSide.show(); urKeepBox.checked = ur.keepOnScreen; drawPreview(); };
	window.addEventListener('oss-idle-ur-bar', els.urShow);
	els.urShow();

	const judgeBox = el('div', 'display:grid;gap:8px');
	const judgeWrap = el('label', LABEL);
	const judgeText = el('span');
	const judgeInput = el('input', `width:100%;accent-color:${C.accent}`);
	judgeInput.type = 'range';
	judgeInput.min = '0'; judgeInput.step = '2';
	const showJudge = () => {
		judgeInput.max = String(Math.max(0, windowH - 30));
		const where = judge.fromBottom ?? (skin ? Math.round(windowH - skin.raw.scorePosition / 480 * windowH) : 0);
		judgeInput.value = String(where);
		judgeText.textContent = judge.fromBottom === null
			? 'Judgement height: the skin\'s own'
			: `Judgement height: ${judge.fromBottom}px up from the bottom of the screen`;
	};
	judgeInput.addEventListener('input', () => { judge.fromBottom = Number(judgeInput.value); judgeSave(); showJudge(); drawPreview(); });
	const judgeReset = el('button', BTN + ';justify-self:start;padding:5px 10px;font-size:12px', 'Use the skin\'s own');
	judgeReset.addEventListener('click', () => { judge.fromBottom = null; judgeSave(); showJudge(); drawPreview(); });
	els.showJudge = showJudge;
	judgeWrap.append(judgeText, judgeInput);
	judgeBox.append(
		el('div', `font:600 12px ${UI_FONT};color:${C.ink}`, 'Judgement position'),
		judgeWrap, judgeReset,
		el('div', `font-size:11px;color:${C.muted}`, 'Places PERFECT, GREAT and the rest (the skin\'s ScorePosition), for skins used from the editor.'),
	);
	showJudge();

	const notesBox = el('div', 'display:grid;gap:8px');
	notesBox.append(
		el('div', `font:600 12px ${UI_FONT};color:${C.ink}`, 'Notes'),
		upRow,
		el('div', `font-size:11px;color:${C.muted};margin-top:-4px`, 'Changes the skin in use straight away (its skin.ini\'s UpsideDown).'),
	);
	// the three together, in one box
	const settingsBox = el('div', `display:grid;gap:12px;padding:10px 12px;${BOX}`);
	const rule = () => el('div', `height:1px;background:${C.line}`);
	settingsBox.append(
		el('div', `font:600 15px ${UI_FONT};color:${C.ink}`, lazerLook ? 'other settings' : 'Other settings'),
		el('div', `font-size:11px;color:${C.muted};margin-top:-6px`, 'Changes apply straight away, in game and in the preview.'),
		notesBox, rule(), urBox, rule(), judgeBox, rule(),
		el('div', `font:600 12px ${UI_FONT};color:${C.ink}`, 'Hitsounds'),
		check('Map hitsounds', () => mapSounds, v => { mapSounds = v; saveMapSounds(); }),
		el('div', `font-size:11px;color:${C.muted};margin-top:-4px`, 'Off: every note plays the skin\'s own hitsound instead of the map\'s, and the map\'s storyboard sounds are left out.'),
		rule(), counter.controls(),
	);
	const vs = versus.settings;
	const vsBox = el('div', `display:grid;gap:8px;padding:10px 12px;${BOX}`);
	const vsOn = check('Play against John', () => vs.enabled, v => { vs.enabled = v; versus.save(); showVs(); });
	const vsMore = el('div', 'display:grid;gap:8px');
	const keysRow = el('div', 'display:flex;gap:6px;align-items:center;flex-wrap:wrap');
	const keyBtns = vs.keys.map((code, c) => {
		const b = el('button', `${BTN};min-width:44px;padding:5px 8px`, versus.keyName(code));
		b.title = `Column ${c + 1}`;
		b.addEventListener('click', () => {
			b.textContent = '…';
			const take = (e) => {
				e.preventDefault(); e.stopPropagation();
				window.removeEventListener('keydown', take, true);
				if (e.code !== 'Escape') { vs.keys[c] = e.code; versus.save(); }
				b.textContent = versus.keyName(vs.keys[c]);
			};
			window.addEventListener('keydown', take, true);
		});
		return b;
	});
	keysRow.append(el('span', `font-size:12px;color:${C.muted}`, 'Keys'), ...keyBtns);
	const sideLabel = el('label', 'display:flex;gap:8px;align-items:center;font-size:12px;color:' + C.muted);
	const sideSel = el('select', INPUT);
	for (const [v, t] of [
		['pair-left', 'Side by side, you on the left'], ['pair-right', 'Side by side, you on the right'],
		['middle-left', 'Middle, John on the left'], ['middle-right', 'Middle, John on the right'],
	]) {
		const o = el('option', '', t); o.value = v; sideSel.append(o);
	}
	sideSel.value = vs.side;
	sideSel.addEventListener('change', () => { vs.side = sideSel.value; versus.save(); });
	sideLabel.append(el('span', '', 'Your playfield'), sideSel);
	const vsSlider = (label, key, min, max, step, show) => {
		const wrap = el('label', LABEL);
		const text = el('span');
		const input = el('input', `width:100%;accent-color:${C.accent}`);
		input.type = 'range'; input.min = String(min); input.max = String(max); input.step = String(step);
		input.value = String(vs[key]);
		const upd = () => { text.textContent = `${label}: ${show(vs[key])}`; };
		input.addEventListener('input', () => { vs[key] = Number(input.value); versus.save(); upd(); });
		upd();
		wrap.append(text, input);
		return wrap;
	};
	vsMore.append(
		keysRow,
		sideLabel,
		vsSlider('Gap from John', 'gap', 0, 600, 10, v => `${v}px`),
		vsSlider('Shrink John', 'johnScale', 30, 100, 5, v => (v >= 100 ? 'full size' : `${v}%`)),
		vsSlider('Your chart offset', 'offset', -200, 200, 1, v => (v === 0 ? '0 ms' : `${v > 0 ? '+' : ''}${v} ms (${v > 0 ? 'hit later' : 'hit earlier'})`)),
		check('Hitsounds on your presses', () => vs.hitsounds, v => { vs.hitsounds = v; versus.save(); }),
	);
	const showVs = () => { vsMore.style.display = vs.enabled ? 'grid' : 'none'; };
	showVs();
	vsBox.append(
		el('div', `font:600 15px ${UI_FONT};color:${C.ink}`, lazerLook ? 'versus John' : 'Versus John'),
		vsOn, vsMore,
		el('div', `font-size:11px;color:${C.muted}`, 'Play the map yourself next to John, on the same chart. Your side uses your skin, images, circle notes and upscroll.'),
	);
	sidebar.append(head, drop, folderRow, slowNote, els.folder, statusRow, els.warnings, els.details, actions, els.actionNote, confirmBox, settingsBox,
		el('div', `font-size:11px;color:${C.muted}`, 'The Alt+Shift+S shortcut is in the game\'s Options under Skin, and versus John under Gameplay.'));
	panel.append(sidebar, stage);
	document.body.append(panel);
	window.addEventListener('resize', drawPreview);
};

// The live judgement counter (after applepie's add-on): ratio (MAX : Perf), SD, and
// the count of each judgement, beside the playfield while you play. Its rows can
// take the judgement colours of the skin in use. Alt+Shift+J shows or hides it;
// its settings are in the editor, where it can also be dragged into place.
const COUNTER_KEY = 'oss-idle-judgement-counter';          // shared with the standalone add-on
const COUNTER_SETTINGS = 'oss-idle-judgement-counter-settings';
const counter = (() => {
	const FADE_MS = 250;
	const ROWS = [
		{
			key: 'MA', label: 'Ratio', color: '#ffffff', optional: true,
			read: (c) => {
				const max = (c.counts.DIVINE || 0) + (c.counts.MARVELOUS || 0);
				const perf = c.counts.PERFECT || 0;
				if (perf === 0) return max === 0 ? '–' : '∞';
				return (max / perf).toFixed(1);
			},
		},
		{ key: 'SD', label: 'SD', read: (c) => `${c.sd.toFixed(2)} ms`, color: '#cccccc', optional: true, gap: true, bare: true },
		{ key: 'MAX', label: 'MAX', judge: 'MARVELOUS', read: (c) => (c.counts.DIVINE || 0) + (c.counts.MARVELOUS || 0), color: '#ffffff' },
		{ key: 'Perf', label: 'Perf', judge: 'PERFECT', read: (c) => c.counts.PERFECT || 0, color: '#ffe066' },
		{ key: 'Great', label: 'Great', judge: 'GREAT', read: (c) => c.counts.GREAT || 0, color: '#6ee06e' },
		{ key: 'Good', label: 'Good', judge: 'GOOD', read: (c) => c.counts.GOOD || 0, color: '#5ab4ff' },
		{ key: 'Bad', label: 'Bad', judge: 'BAD', read: (c) => c.counts.BAD || 0, color: '#c78bff' },
		{ key: 'Miss', label: 'Miss', judge: 'MISS', read: (c) => c.counts.MISS || 0, color: '#ff5a5a' },
	];
	const SAMPLE = { counts: { DIVINE: 120, PERFECT: 84, GREAT: 31, GOOD: 9, BAD: 3, MISS: 2 }, ur: 78.4, sd: 7.84 };
	const LEGACY_ORDER = ['MAX', 'Perf', 'Great', 'Good', 'Bad', 'Miss'];
	const defaults = () => ({
		x: 2, y: 50, size: 22,
		colors: Object.fromEntries(ROWS.map((r) => [r.key, r.color])),
		show: { MA: true, SD: true },
		skinColors: true,
	});
	const isHex = (c) => typeof c === 'string' && /^#[0-9a-f]{6}$/i.test(c);

	let visible = true;
	let settings = defaults();
	let shown = false, hideTimer, box, rows, timer, onKey;
	let lastColors = '';

	const load = () => {
		try { visible = localStorage.getItem(COUNTER_KEY) !== '0'; } catch {}
		try {
			const s = JSON.parse(localStorage.getItem(COUNTER_SETTINGS) || 'null');
			if (s && typeof s === 'object') {
				const d = defaults();
				let saved = s.colors;
				if (Array.isArray(saved)) saved = Object.fromEntries(LEGACY_ORDER.map((k, i) => [k, saved[i]]));
				saved = saved && typeof saved === 'object' ? saved : {};
				settings = {
					x: Number.isFinite(s.x) ? s.x : d.x,
					y: Number.isFinite(s.y) ? s.y : d.y,
					size: Number.isFinite(s.size) ? s.size : d.size,
					colors: Object.fromEntries(ROWS.map((r) => [r.key, isHex(saved[r.key]) ? saved[r.key] : d.colors[r.key]])),
					show: { MA: !(s.show && s.show.MA === false), SD: !(s.show && s.show.SD === false) },
					skinColors: s.skinColors !== false,
				};
			}
		} catch {}
	};
	const saveVisible = () => { try { localStorage.setItem(COUNTER_KEY, visible ? '1' : '0'); } catch {} };
	const saveSettings = () => { try { localStorage.setItem(COUNTER_SETTINGS, JSON.stringify(settings)); } catch {} };

	// the running game, from the playfield canvas up through React's tree
	let cached = { canvas: null, play: null };
	const readGame = (fiber) => {
		for (let hook = fiber.memoizedState; hook; hook = hook.next) {
			const ref = hook.memoizedState;
			const game = ref && typeof ref === 'object' && 'current' in ref ? ref.current : null;
			if (game && game.score && game.score.counts && Array.isArray(game.notes)) return game;
		}
		return null;
	};
	const findPlay = (canvas) => {
		if (cached.canvas === canvas && cached.play) return cached.play;
		cached = { canvas, play: null };
		const key = Object.keys(canvas).find(k => k.startsWith('__reactFiber$'));
		let fiber = key ? canvas[key] : null;
		for (let depth = 0; fiber && depth < 40; depth++, fiber = fiber.return) {
			const props = fiber.memoizedProps;
			if (!props || !props.play || !props.beatmapInfo) continue;
			cached.play = { fiber, game: readGame(fiber) };
			return cached.play;
		}
		return null;
	};
	const gameOf = (play) => play.game || (play.game = readGame(play.fiber));
	const statsOf = (game) => {
		let ur = 0;
		try {
			ur = typeof game.unstableRate === 'function' ? game.unstableRate() : 0;
			if (!Number.isFinite(ur) && Array.isArray(game.timings) && game.timings.length) {
				const t = game.timings;
				const mean = t.reduce((a, b) => a + b, 0) / t.length;
				ur = Math.sqrt(t.reduce((a, b) => a + (b - mean) ** 2, 0) / t.length) * 10;
			}
		} catch {}
		if (!Number.isFinite(ur)) ur = 0;
		return { counts: game.score.counts, ur, sd: ur / 10 };
	};

	// where it's placed: the playfield's screen; while editing (not see-through), the editor's preview
	const viewRect = (canvas) => {
		if (editing() && !see.on && els.stage) return els.stage.getBoundingClientRect();
		return canvas ? canvas.getBoundingClientRect() : { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight };
	};
	// the colour each row shows: the skin's judgement colour, or its own
	// (while the editor is open with a skin in it: that skin's, as it's being edited)
	const judgeColors = () => (editing() && skin ? skin.judges : gameJudgeColors());
	const colorOf = (def) => {
		if (settings.skinColors && def.judge) {
			const j = judgeColors();
			if (j && typeof j[def.judge] === 'string' && j[def.judge]) return j[def.judge];
		}
		return settings.colors[def.key];
	};
	const applyStyle = () => {
		if (!box) return;
		box.style.fontSize = `${settings.size}px`;
		rows.forEach((row, i) => {
			const def = ROWS[i];
			row.style.color = colorOf(def);
			row.style.display = def.optional && settings.show[def.key] === false ? 'none' : '';
		});
		lastColors = JSON.stringify(judgeColors());
	};
	const setShown = (on) => {
		if (on === shown) return;
		shown = on;
		clearTimeout(hideTimer);
		if (on) {
			box.style.visibility = 'visible';
			requestAnimationFrame(() => { if (shown && box) box.style.opacity = '1'; });
		} else {
			box.style.opacity = '0';
			hideTimer = setTimeout(() => { if (!shown && box) box.style.visibility = 'hidden'; }, FADE_MS);
		}
	};
	const isShowing = (canvas) => {
		if (!canvas || !canvas.isConnected) return false;
		const r = canvas.getBoundingClientRect();
		if (r.width < 50 || r.height < 50) return false;
		for (let n = canvas; n && n.nodeType === 1; n = n.parentElement) {
			const s = getComputedStyle(n);
			if (s.display === 'none' || s.visibility === 'hidden' || Number(s.opacity) === 0) return false;
		}
		return true;
	};
	const editing = () => !!(panel && panel.style.display !== 'none');

	const tick = () => {
		if (!box) return;
		if (JSON.stringify(judgeColors()) !== lastColors) applyStyle();
		const found = document.querySelector('canvas.play__canvas');
		const canvas = isShowing(found) ? found : null;
		let stats = null;
		if (visible && canvas) {
			const play = findPlay(canvas);
			const game = play && gameOf(play);
			if (game) stats = statsOf(game);
		}
		// while the editor is open, sample numbers, so you can see what you're changing
		const edit = visible && editing();
		if (!stats && edit) stats = SAMPLE;
		if (!stats) { setShown(false); return; }
		ROWS.forEach((def, i) => {
			const text = def.bare ? `${def.read(stats)}` : `${def.label}: ${def.read(stats)}`;
			if (rows[i].textContent !== text) rows[i].textContent = text;
		});
		// during a map: just above the playfield, under the game's menus; while editing: over the editor
		box.style.zIndex = edit ? '99001' : '11';
		box.style.pointerEvents = edit ? 'auto' : 'none';
		box.style.cursor = edit ? 'move' : '';
		if (!dragging) {
			const r = viewRect(canvas);
			box.style.left = `${r.left + (r.width * settings.x) / 100}px`;
			box.style.top = `${r.top + (r.height * settings.y) / 100}px`;
		}
		setShown(true);
	};

	let dragging = false, grab = { x: 0, y: 0 };
	const onDragMove = (e) => {
		if (!dragging) return;
		const found = document.querySelector('canvas.play__canvas');
		const r = viewRect(isShowing(found) ? found : null);
		const left = e.clientX - grab.x, top = e.clientY - grab.y;
		settings.x = Math.min(100, Math.max(0, ((left - r.left) / r.width) * 100));
		settings.y = Math.min(100, Math.max(0, ((top - r.top) / r.height) * 100));
		box.style.left = `${left}px`;
		box.style.top = `${top}px`;
		sync?.();
	};
	const onDragEnd = () => {
		dragging = false;
		window.removeEventListener('mousemove', onDragMove, true);
		window.removeEventListener('mouseup', onDragEnd, true);
		saveSettings();
	};
	const onBoxDown = (e) => {
		if (!editing()) return;
		e.preventDefault();
		e.stopPropagation();
		const b = box.getBoundingClientRect();
		grab = { x: e.clientX - b.left, y: e.clientY - (b.top + b.height / 2) };
		dragging = true;
		window.addEventListener('mousemove', onDragMove, true);
		window.addEventListener('mouseup', onDragEnd, true);
	};

	// its settings, in the editor's sidebar
	let sync;
	const controls = () => {
		const wrap = el('div', 'display:grid;gap:8px');
		const showRow = check('Show the counter (Alt+Shift+J)', () => visible, v => { visible = v; saveVisible(); tick(); });
		const skinRow = check('Use the skin\'s judgement colours', () => settings.skinColors, v => { settings.skinColors = v; saveSettings(); applyStyle(); showPickers(); });
		const optRows = ROWS.filter(r => r.optional).map(def => check(`Show ${def.label}${def.key === 'MA' ? ' (MAX : Perf)' : ''}`,
			() => settings.show[def.key] !== false, v => { settings.show[def.key] = v; saveSettings(); applyStyle(); }));
		const slider = (name, label, min, max, step, unit) => {
			const w = el('label', LABEL);
			const text = el('span');
			const input = el('input', `width:100%;accent-color:${C.accent}`);
			input.type = 'range'; input.min = String(min); input.max = String(max); input.step = String(step);
			const show = () => { input.value = String(settings[name]); text.textContent = `${label}: ${Math.round(settings[name])}${unit}`; };
			input.addEventListener('input', () => { settings[name] = Number(input.value); saveSettings(); applyStyle(); show(); tick(); });
			w.append(text, input);
			return { w, show };
		};
		const sx = slider('x', 'Across', 0, 100, 0.5, '%'), sy = slider('y', 'Down', 0, 100, 0.5, '%'), ss = slider('size', 'Text size', 10, 64, 1, 'px');
		const pickRow = el('div', 'display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px');
		const pickers = ROWS.map(def => {
			const cell = el('label', `display:grid;gap:2px;font-size:11px;color:${C.muted}`, def.label);
			const p = el('input', `width:100%;height:24px;padding:1px;border:0;border-radius:6px;background:${C.control};cursor:pointer`);
			p.type = 'color';
			p.addEventListener('input', () => { settings.colors[def.key] = p.value; saveSettings(); applyStyle(); });
			cell.append(p);
			pickRow.append(cell);
			return { def, cell, p };
		});
		const showPickers = () => pickers.forEach(({ def, cell, p }) => {
			p.value = settings.colors[def.key];
			cell.style.display = settings.skinColors && def.judge ? 'none' : '';
		});
		const reset = el('button', BTN + ';justify-self:start;padding:5px 10px;font-size:12px', 'Reset');
		reset.addEventListener('click', () => { settings = defaults(); saveSettings(); applyStyle(); sync(); tick(); });
		const posRow = el('div', 'display:grid;grid-template-columns:1fr 1fr;gap:12px');
		posRow.append(sx.w, sy.w);
		wrap.append(
			el('div', `font:600 12px ${UI_FONT};color:${C.ink}`, 'Judgement counter'),
			showRow, skinRow, ...optRows, posRow, ss.w, pickRow, reset,
			el('div', `font-size:11px;color:${C.muted}`, 'While this window is open the counter shows sample numbers: drag it to move it.'),
		);
		sync = () => {
			sx.show(); sy.show(); ss.show(); showPickers();
			showRow.querySelector('input').checked = visible;
			skinRow.querySelector('input').checked = settings.skinColors;
			optRows.forEach((r, i) => { r.querySelector('input').checked = settings.show[ROWS.filter(d => d.optional)[i].key] !== false; });
			syncFills();
		};
		sync();
		return wrap;
	};

	const mount = () => {
		load();
		shown = false;
		box = document.createElement('div');
		box.style.cssText = [
			'position:fixed', 'visibility:hidden', 'opacity:0', 'text-align:left', 'pointer-events:none',
			`transition:opacity ${FADE_MS}ms ease`, 'transform:translateY(-50%)', 'user-select:none', 'z-index:11',
			'color:#fff', 'text-shadow:0 1px 3px rgba(0,0,0,.6)', 'font-variant-numeric:tabular-nums',
			'font:600 22px "Exo 2", system-ui, sans-serif', 'line-height:1.25',
		].join(';');
		rows = ROWS.map((def) => {
			const row = document.createElement('div');
			if (def.gap) row.style.marginBottom = '0.4em';
			box.append(row);
			return row;
		});
		box.addEventListener('mousedown', onBoxDown, true);
		document.body.append(box);
		applyStyle();
		timer = setInterval(tick, 50);
		onKey = (e) => {
			if (e.altKey && e.shiftKey && !e.ctrlKey && e.code === 'KeyJ') {
				e.preventDefault();
				visible = !visible;
				saveVisible();
				sync?.();
				tick();
			}
		};
		window.addEventListener('keydown', onKey, true);
	};
	const unmount = () => {
		clearInterval(timer);
		clearTimeout(hideTimer);
		window.removeEventListener('keydown', onKey, true);
		window.removeEventListener('mousemove', onDragMove, true);
		window.removeEventListener('mouseup', onDragEnd, true);
		box?.remove();
		box = rows = sync = undefined;
		dragging = shown = false;
		cached = { canvas: null, play: null };
	};
	return { mount, unmount, controls, tick: () => tick() };
})();

// Map hitsounds off: every note plays the skin's own hitsound instead of the
// map's samples (once per moment), and the map's storyboard sounds are left out.
const MAP_SOUNDS_KEY = 'oss-idle-map-hitsounds';
let mapSounds = true;
try { mapSounds = localStorage.getItem(MAP_SOUNDS_KEY) !== '0'; } catch {}
const saveMapSounds = () => { try { localStorage.setItem(MAP_SOUNDS_KEY, mapSounds ? '1' : '0'); } catch {} };
const hitsounds = (() => {
	const DEFAULT_NORMAL = '/skins/default/hitsounds/normal-hitnormal.wav';
	let fx = null, prevPlay = null, ours = null, waitTimer;
	let lastAt = -1;
	const normalKey = () => {
		const own = gameHitSound();
		return own && fx.isLoaded(own) ? own : DEFAULT_NORMAL;
	};
	const wrap = () => {
		fx = globalThis.__ossIdleEffects;
		if (!fx || typeof fx.play !== 'function') return false;
		prevPlay = fx.play;
		ours = function (key, opts, ...rest) {
			if (mapSounds || !opts || typeof opts.atMs !== 'number') return prevPlay.call(this, key, opts, ...rest);
			// the storyboard's sounds come through its queue
			if (/\bqueue\b/.test(new Error().stack || '')) return undefined;
			const normal = normalKey();
			if (Math.abs(opts.atMs - lastAt) < 1) return undefined; // this moment has its sound already
			lastAt = opts.atMs;
			if (!fx.isLoaded(normal)) return prevPlay.call(this, key, opts, ...rest);
			return prevPlay.call(this, normal, { atMs: opts.atMs, volume: opts.volume }, ...rest);
		};
		fx.play = ours;
		return true;
	};
	const mount = () => {
		if (wrap()) return;
		waitTimer = setInterval(() => { if (wrap()) clearInterval(waitTimer); }, 1000);
	};
	const unmount = () => {
		clearInterval(waitTimer);
		if (fx && ours && fx.play === ours) fx.play = prevPlay;
		fx = prevPlay = ours = null;
	};
	return { mount, unmount };
})();

// Live preview: the editor's preview steps aside so the game shows behind it, with a
// map playing itself, and the sidebar kept on screen.
const see = { on: false };
const applySee = () => {
	if (!panel || !els.stage) return;
	const on = see.on;
	panel.style.background = on ? 'transparent' : C.bg;
	panel.style.pointerEvents = on ? 'none' : '';
	els.sidebar.style.pointerEvents = 'auto';
	els.sidebar.style.background = on ? C.bg : '';
	els.stage.style.background = '';
	els.preview.style.visibility = on ? 'hidden' : '';
	followGame();
	els.stageOverlay.style.display = on ? 'none' : '';
	els.seeBtn.style.background = on ? C.accent : C.control;
	els.seeBtn.style.color = on ? '#fff' : C.ink;
	if (!on) drawPreview();
};

// In the game's Options (Skin): a group for the editor's hotkey, and versus John's settings,
// built from the game's own option pieces so they look like the rest.
const HOTKEY_KEY = 'oss-idle-skin-importer-hotkey';
let hotkeyOn = true;
try { hotkeyOn = localStorage.getItem(HOTKEY_KEY) !== '0'; } catch {}
const optionGroups = (() => {
	const GROUP_CLASS = 'ssi-opt-group';
	const node = (tag, cls, text) => {
		const n = document.createElement(tag);
		if (cls) n.className = cls;
		if (text !== undefined) n.textContent = text;
		return n;
	};
	const checkbox = (label, get, set) => {
		const b = node('button', 'opt-checkbox');
		b.type = 'button';
		const box = node('span', 'opt-checkbox__box');
		box.setAttribute('aria-hidden', 'true');
		box.append(node('span', 'opt-checkbox__tick'));
		b.append(box, node('span', 'opt-checkbox__label', label));
		const show = () => b.classList.toggle('is-on', !!get());
		b.addEventListener('click', (e) => { e.stopPropagation(); set(!get()); show(); });
		show();
		return { el: b, show };
	};
	const slider = (label, min, max, step, get, set, fmt) => {
		const wrap = node('label', 'opt-slider');
		const head = node('div', 'opt-slider__head');
		const value = node('span', 'opt-slider__value');
		head.append(node('span', 'opt-slider__label', label), value);
		const input = node('input', 'opt-slider__input');
		input.type = 'range'; input.min = String(min); input.max = String(max); input.step = String(step);
		const show = () => {
			input.value = String(get());
			value.textContent = fmt(get());
			input.style.setProperty('--fill', `${((get() - min) / (max - min)) * 100}%`);
		};
		input.addEventListener('input', () => { set(Number(input.value)); show(); });
		wrap.append(head, input);
		show();
		return { el: wrap, show };
	};
	const button = (text, onClick) => {
		const b = node('button', 'opt-button', text);
		b.type = 'button';
		b.addEventListener('click', (e) => { e.stopPropagation(); onClick(b); });
		return b;
	};
	// a small window to set versus John's four keys: click a column, press a key
	const openKeys = (vs, done) => {
		const back = node('div', '');
		back.style.cssText = 'position:fixed;inset:0;z-index:99500;display:grid;place-items:center;background:rgba(0,0,0,.6)';
		const box = node('div', '');
		box.style.cssText = `display:grid;gap:14px;padding:20px 22px;min-width:320px;border-radius:12px;background:${C.bg};color:${C.ink};font:600 14px ${UI_FONT};box-shadow:0 12px 40px rgba(0,0,0,.6)`;
		const hint = node('div', '', 'Click a column, then press its key. Esc cancels.');
		hint.style.cssText = `font-size:12px;font-weight:400;color:${C.muted}`;
		const row = node('div', '');
		row.style.cssText = 'display:grid;grid-template-columns:repeat(4,1fr);gap:8px';
		let waiting = -1;
		const slots = vs.keys.map((code, c) => {
			const b = node('button', '');
			b.type = 'button';
			b.style.cssText = `display:grid;gap:4px;justify-items:center;padding:12px 6px;border:2px solid ${C.line};border-radius:10px;background:${C.sunken};color:${C.ink};font:inherit;cursor:pointer`;
			b.addEventListener('click', (e) => { e.stopPropagation(); waiting = c; show(); });
			row.append(b);
			return b;
		});
		const show = () => slots.forEach((b, c) => {
			b.replaceChildren(node('span', '', `Column ${c + 1}`), node('strong', '', waiting === c ? '…' : versus.keyName(vs.keys[c])));
			b.firstChild.style.cssText = `font-size:11px;font-weight:400;color:${C.muted}`;
			b.lastChild.style.cssText = 'font-size:20px';
			b.style.borderColor = waiting === c ? C.accent : C.line;
		});
		const close = () => {
			window.removeEventListener('keydown', onKey, true);
			back.remove();
			done();
		};
		const onKey = (e) => {
			e.preventDefault(); e.stopPropagation();
			if (e.code === 'Escape') { if (waiting >= 0) { waiting = -1; show(); } else close(); return; }
			if (waiting < 0) return;
			vs.keys[waiting] = e.code;
			versus.save();
			waiting = waiting < 3 ? waiting + 1 : -1; // on to the next column
			show();
		};
		const buttons = node('div', '');
		buttons.style.cssText = 'display:flex;gap:8px;justify-content:flex-end';
		const reset = node('button', 'opt-button', 'Reset (D F J K)');
		reset.addEventListener('click', (e) => { e.stopPropagation(); vs.keys.splice(0, 4, 'KeyD', 'KeyF', 'KeyJ', 'KeyK'); versus.save(); waiting = -1; show(); });
		const ok = node('button', 'opt-button', 'Done');
		ok.addEventListener('click', (e) => { e.stopPropagation(); close(); });
		for (const b of [reset, ok]) { b.type = 'button'; b.style.width = 'auto'; b.style.padding = '6px 16px'; }
		buttons.append(reset, ok);
		box.append(node('div', '', 'Versus John: your keys'), hint, row, buttons);
		back.append(box);
		back.addEventListener('pointerdown', (e) => { if (e.target === back) close(); });
		['mousedown', 'click', 'wheel'].forEach(t => box.addEventListener(t, (e) => e.stopPropagation()));
		show();
		document.body.append(back);
		window.addEventListener('keydown', onKey, true);
	};
	const SIDES = [
		['pair-left', 'Side by side, you on the left'], ['pair-right', 'Side by side, you on the right'],
		['middle-left', 'Middle, John on the left'], ['middle-right', 'Middle, John on the right'],
	];
	const buildImporter = () => {
		const editor = node('div', `options__group ${GROUP_CLASS} ssi-opt-importer`);
		editor.append(
			node('div', 'options__group_title', 'Skin editor'),
			button('Open the skin editor (live preview)', () => openLive()),
			checkbox('Alt+Shift+S opens the skin editor', () => hotkeyOn, v => { hotkeyOn = v; try { localStorage.setItem(HOTKEY_KEY, v ? '1' : '0'); } catch {} }).el,
		);
		return editor;
	};
	const buildVersus = () => {
		const vs = versus.settings;
		const group = node('div', `options__group ${GROUP_CLASS} ssi-opt-versus`);
		const more = node('div', '');
		more.style.cssText = 'display:contents';
		const on = checkbox('Play against John', () => vs.enabled, v => { vs.enabled = v; versus.save(); showMore(); });
		const showMore = () => { more.style.display = vs.enabled ? 'contents' : 'none'; };
		// the keys: one button, opening a small window to set all four
		const keysText = () => `Your keys: ${vs.keys.map(k => versus.keyName(k)).join(' ')}`;
		const keysBtn = button(keysText(), () => openKeys(vs, () => { keysBtn.textContent = keysText(); }));
		// your playfield: the game's own dropdown
		const sideRow = node('div', 'opt-row');
		const drop = node('div', 'dropdown');
		const current = node('button', 'dropdown__current');
		current.type = 'button';
		const curLabel = node('span', 'dropdown__label');
		const caret = node('span', 'dropdown__caret');
		caret.setAttribute('aria-hidden', 'true');
		current.append(curLabel, caret);
		const list = node('div', 'dropdown__options');
		list.setAttribute('role', 'listbox');
		const opts = SIDES.map(([v, t]) => {
			const o = node('button', 'dropdown__option', t);
			o.type = 'button';
			o.setAttribute('role', 'option');
			o.addEventListener('click', (e) => { e.stopPropagation(); vs.side = v; versus.save(); showSide(); drop.classList.remove('is-open'); });
			list.append(o);
			return [v, o];
		});
		const showSide = () => {
			curLabel.textContent = (SIDES.find(x => x[0] === vs.side) || SIDES[0])[1];
			for (const [v, o] of opts) { o.classList.toggle('is-selected', v === vs.side); o.setAttribute('aria-selected', String(v === vs.side)); }
		};
		current.addEventListener('click', (e) => {
			e.stopPropagation();
			drop.classList.toggle('is-open');
			if (drop.classList.contains('is-open')) {
				const away = (ev) => { if (!drop.contains(ev.target)) { drop.classList.remove('is-open'); window.removeEventListener('pointerdown', away, true); } };
				window.addEventListener('pointerdown', away, true);
			}
		});
		drop.append(current, list);
		sideRow.append(node('span', 'opt-row__label', 'Your playfield'), drop);
		showSide();
		more.append(
			keysBtn, sideRow,
			slider('Gap from John', 0, 600, 10, () => vs.gap, v => { vs.gap = v; versus.save(); }, v => `${v}px`).el,
			slider('Shrink John', 30, 100, 5, () => vs.johnScale, v => { vs.johnScale = v; versus.save(); }, v => (v >= 100 ? 'full size' : `${v}%`)).el,
			slider('Your chart offset', -200, 200, 1, () => vs.offset, v => { vs.offset = v; versus.save(); }, v => (v === 0 ? '0 ms' : `${v > 0 ? '+' : ''}${v} ms`)).el,
			checkbox('Hitsounds on your presses', () => vs.hitsounds, v => { vs.hitsounds = v; versus.save(); }).el,
		);
		group.append(node('div', 'options__group_title', 'Versus John'), on.el, more);
		showMore();
		return group;
	};
	// the editor's group goes in the Skin section, versus John in Gameplay; put back if the game redraws them
	const categoryOf = (re) => [...document.querySelectorAll('.options__category')]
		.find(c => re.test((c.querySelector('.options__category_title')?.textContent || '').trim()));
	const ensure = () => {
		// by title, or (with the game in another language) by place: Gameplay is the third section, Skin the fourth
		const all = document.querySelectorAll('.options__category');
		const skin = categoryOf(/^skin$/i) || all[3], gameplay = categoryOf(/^gameplay$/i) || all[2];
		if (skin && !skin.querySelector('.ssi-opt-importer')) skin.append(buildImporter());
		if (gameplay && !gameplay.querySelector('.ssi-opt-versus')) gameplay.append(buildVersus());
	};
	const remove = () => document.querySelectorAll(`.${GROUP_CLASS}`).forEach(g => g.remove());
	return { ensure, remove };
})();

// Ways in: a button in the game's Options (under Skinning), and right-clicking the logo.
const entries = (() => {
	const BTN_CLASS = 'ssi-open-btn';
	let observer, queued = false;
	const addButton = () => {
		queued = false;
		optionGroups.ensure();
		return; // the button is in the editor's own group in Options now
		const manage = [...document.querySelectorAll('.opt-button')].find(b => !b.classList.contains(BTN_CLASS) && /manage skins/i.test(b.textContent));
		if (!manage || manage.parentElement.querySelector(`.${BTN_CLASS}`)) return;
		const browse = [...manage.parentElement.querySelectorAll('.opt-button')].find(b => /browse skins/i.test(b.textContent));
		const b = document.createElement('button');
		b.type = 'button';
		b.className = `opt-button ${BTN_CLASS}`;
		b.textContent = 'Skin editor';
		b.title = 'Opens the skin editor over a map that plays itself, to see your changes live (Alt+Shift+S opens it on its own)';
		b.addEventListener('click', (e) => { e.stopPropagation(); openLive(); });
		(browse || manage).after(b);
	};
	const onMutate = () => {
		if (queued) return;
		queued = true;
		requestAnimationFrame(addButton);
	};
	const onContext = (e) => {
		if (!e.target || !e.target.closest || !e.target.closest('.main-logo')) return;
		e.preventDefault();
		e.stopPropagation();
		openPanel();
	};
	const mount = () => {
		observer = new MutationObserver(onMutate);
		observer.observe(document.body, { childList: true, subtree: true });
		addButton();
		window.addEventListener('contextmenu', onContext, true);
	};
	const unmount = () => {
		observer?.disconnect();
		observer = null;
		window.removeEventListener('contextmenu', onContext, true);
		document.querySelectorAll(`.${BTN_CLASS}`).forEach(b => b.remove());
		optionGroups.remove();
	};
	return { mount, unmount };
})();

const isOpen = () => !!(panel && panel.style.display !== 'none');
const rebuildPanel = () => {
	lazerLook = lazerWanted();
	styleTheme();
	window.removeEventListener('resize', drawPreview);
	if (els.urShow) window.removeEventListener('oss-idle-ur-bar', els.urShow);
	const listShown = els.folder && els.folder.style.display !== 'none';
	const folderText = els.folderName?.textContent, toolsShown = els.folderTools?.style.display;
	panel?.remove();
	els = {};
	buildPanel();
	if (skin) renderSkin([]);
	if (listShown) {
		els.folder.style.display = 'grid';
		els.folderName.textContent = folderText;
		els.folderTools.style.display = toolsShown;
		renderFolder();
	}
};
const openPanel = () => {
	if (!panel) return;
	if (lazerWanted() !== lazerLook) rebuildPanel();
	panel.style.display = 'grid';
	applySee();
	drawPreview();
	counter.tick();
	restoreFolder().catch(() => {});
};
const closePanel = () => {
	liveMap.stop();
	hideHandles();
	if (panel) panel.style.display = 'none';
	counter.tick();
};

// A live map for editing: the game's own test play (its bot plays the map, no fail,
// nothing saved, John isn't tired by it) of the map picked in song select, started
// again when it ends while the editor is open and see-through.
const liveMap = (() => {
	let on = false, timer, lastStart = 0, sawPlay = false;
	const fiberOf = (node) => {
		const k = node && Object.keys(node).find(x => x.startsWith('__reactFiber$'));
		return k ? node[k] : null;
	};
	const sleep = (ms) => new Promise(r => setTimeout(r, ms));
	const playing = () => {
		const c = document.querySelector('canvas.play__canvas');
		return !!(c && c.isConnected && c.getBoundingClientRect().width > 50);
	};
	const inSongSelect = () => !!document.querySelector('.game__botbar');
	// song select's own "test play" (its debug menu's play button)
	const testPlay = () => {
		let f = fiberOf(document.querySelector('.game__botbar')), top = f;
		for (let d = 0; f && d < 12; d++, f = f.return) top = f;
		const stack = top ? [top] : [];
		for (let n = 0; stack.length && n < 30000; n++) {
			const x = stack.pop();
			const p = x.memoizedProps;
			if (p && typeof p.onPlay === 'function' && 'onOpen' in p && 'enabled' in p) return p.onPlay;
			if (x.sibling) stack.push(x.sibling);
			if (x.child) stack.push(x.child);
		}
		return null;
	};
	const beatmapOf = (node) => {
		for (let f = fiberOf(node), d = 0; f && d < 10; d++, f = f.return) {
			const b = f.memoizedProps && f.memoizedProps.beatmap;
			if (b && typeof b.isPlayable === 'function') return b;
		}
		return null;
	};
	const pickMap = () => {
		const active = beatmapOf(document.querySelector('.bm-card.is-active'));
		if (active && active.isPlayable()) return active;
		for (const card of document.querySelectorAll('.bm-card')) {
			const b = beatmapOf(card);
			if (b && b.isPlayable()) return b;
		}
		return null;
	};
	// from the main menu: logo, Play, Solo
	const toSongSelect = async () => {
		if (inSongSelect()) return true;
		const option = (re) => [...document.querySelectorAll('.menu__option.visible')].find(o => re.test(o.textContent.trim()));
		const logo = document.querySelector('.main-logo');
		if (!logo) return false;
		if (!option(/^Play$/)) { logo.click(); await sleep(500); }
		option(/^Play$/)?.click();
		await sleep(700);
		option(/^Solo$/)?.click();
		for (let i = 0; i < 25 && !inSongSelect(); i++) await sleep(200);
		await sleep(400); // its list
		return inSongSelect();
	};
	const startOnce = async () => {
		if (playing()) return 'playing';
		if (!(await toSongSelect())) return 'nowhere';
		const play = testPlay(), map = pickMap();
		if (!play || !map) return 'nomap';
		lastStart = Date.now();
		play(map);
		return 'started';
	};
	const loop = () => {
		if (!on) return;
		if (!isOpen() || !see.on) { stop(); return; }
		if (playing()) { sawPlay = true; return; }
		if (!sawPlay) return;
		// the map ended: from its results back to song select, and again
		const back = [...document.querySelectorAll('.resultscreen .result__exit')].find(b => /back/i.test(b.textContent));
		if (back) { back.click(); return; }
		if (inSongSelect() && Date.now() - lastStart > 6000) { sawPlay = false; startOnce(); }
	};
	const start = async () => {
		on = true;
		sawPlay = false;
		clearInterval(timer);
		timer = setInterval(loop, 1000);
		const r = await startOnce();
		if (r === 'nowhere' || r === 'nomap') {
			setStatus(r === 'nomap'
				? 'No downloaded map to play in song select. Download one, pick it, and open the editor again.'
				: 'Go to song select and pick a map, then open the editor from Options again, for a map that plays itself behind it.', C.warn);
		}
	};
	const stop = () => { on = false; clearInterval(timer); };
	return { start, stop };
})();
const closeGameOptions = () => {
	const node = document.querySelector('.options__container');
	const k = node && Object.keys(node).find(x => x.startsWith('__reactFiber$'));
	for (let f = k ? node[k] : null, d = 0; f && d < 5; d++, f = f.return) {
		for (let h = f.memoizedState, n = 0; h && n < 120; h = h.next, n++) {
			const deps = h.memoizedState && h.memoizedState.deps;
			if (!Array.isArray(deps)) continue;
			for (const x of deps) {
				// the first on/off store there is the panel's own (open or not)
				let v;
				try { v = x && typeof x.get === 'function' && typeof x.set === 'function' ? x.get() : undefined; } catch { v = undefined; }
				if (typeof v !== 'boolean') continue;
				if (v) x.set(false);
				return;
			}
		}
	}
};
// The Options button: the editor, see-through, over a map that plays itself.
const openLive = () => {
	closeGameOptions();
	see.on = true;
	openPanel();
	liveMap.start();
};

// Grab and move: outlines over the combo, judgements, UR bar and health bar, in the
// preview (or over the game, in see-through), to drag them where you want them.
let handleLayer = null, handleDrag = null;
const HANDLE_IDS = ['combo', 'judge', 'ur', 'hp'];
const handleStart = (box) => ({
	combo: { dx: combo.dx, dy: combo.dy },
	judge: { dx: judge.dx || 0, fb: box.fb },
	ur: { dx: ur.dx, dy: ur.dy },
	hp: { gap: hpPos.gap ?? (hpImgsOn() ? 0 : 5), fb: hpPos.fromBottom },
}[box.id]);
const handleMove = (id, st, dx, dy) => {
	const r = (v) => Math.round(v);
	const up = upscroll ? -1 : 1; // upside down, the game measures from the other end
	if (id === 'combo') { combo.dx = r(st.dx + dx); combo.dy = r(st.dy + dy * up); comboSave(); }
	if (id === 'judge') { judge.dx = r(st.dx + dx); judge.fromBottom = Math.max(0, r(st.fb - dy * up)); judgeSave(); els.showJudge?.(); }
	if (id === 'ur') { ur.dx = r(st.dx + dx); ur.dy = r(st.dy + dy); urSave(); }
	if (id === 'hp') { hpPos.gap = r(st.gap + dx); hpPos.fromBottom = r(st.fb - dy); hpPosSave(); }
};
const placeHandles = (boxes, rect, k) => {
	if (!handleLayer) {
		handleLayer = el('div', 'position:fixed;inset:0;z-index:99001;pointer-events:none');
		document.body.append(handleLayer);
	}
	handleLayer.style.display = isOpen() && skin ? 'block' : 'none';
	for (const b of boxes) {
		let h = handleLayer.querySelector(`[data-id="${b.id}"]`);
		if (!h) {
			h = el('div', `position:absolute;pointer-events:auto;cursor:move;box-sizing:border-box;border:1px dashed rgba(255,255,255,.35);border-radius:6px;transition:border-color .15s,background .15s`);
			h.dataset.id = b.id;
			const tag = el('span', `position:absolute;left:0;top:-18px;padding:1px 6px;border-radius:4px;background:${C.accent};color:#fff;font:600 10px ${UI_FONT};white-space:nowrap;opacity:0;transition:opacity .15s`, b.label);
			h.append(tag);
			h.title = `Drag to move the ${b.label.toLowerCase()} · double-click to put it back`;
			h.addEventListener('mouseenter', () => { h.style.borderColor = C.accent; h.style.background = 'rgba(255,102,171,.12)'; tag.style.opacity = '1'; });
			h.addEventListener('mouseleave', () => { if (!handleDrag) { h.style.borderColor = 'rgba(255,255,255,.35)'; h.style.background = ''; tag.style.opacity = '0'; } });
			h.addEventListener('pointerdown', (e) => {
				e.preventDefault(); e.stopPropagation();
				h.setPointerCapture(e.pointerId);
				handleDrag = { id: b.id, x: e.clientX, y: e.clientY, k: h._k, st: handleStart(h._box) };
			});
			h.addEventListener('pointermove', (e) => {
				if (!handleDrag || handleDrag.id !== b.id) return;
				handleMove(b.id, handleDrag.st, (e.clientX - handleDrag.x) / handleDrag.k, (e.clientY - handleDrag.y) / handleDrag.k);
				drawPreview();
			});
			const end = () => { handleDrag = null; h.dispatchEvent(new Event('mouseleave')); };
			h.addEventListener('pointerup', end);
			h.addEventListener('pointercancel', end);
			h.addEventListener('dblclick', () => {
				if (b.id === 'combo') { combo.dx = 0; combo.dy = 0; comboSave(); }
				if (b.id === 'judge') { judge.dx = 0; judge.fromBottom = null; judgeSave(); els.showJudge?.(); }
				if (b.id === 'ur') { ur.dx = 0; ur.dy = 0; urSave(); }
				if (b.id === 'hp') { hpPos.gap = null; hpPos.fromBottom = 0; hpPosSave(); }
				drawPreview();
			});
			handleLayer.append(h);
		}
		h._box = b; h._k = k;
		Object.assign(h.style, { left: `${rect.left + b.x}px`, top: `${rect.top + b.y}px`, width: `${b.w}px`, height: `${b.h}px` });
	}
};
const hideHandles = () => { if (handleLayer) handleLayer.style.display = 'none'; };
// in see-through, the (hidden) preview sits exactly over the game's playfield, so the outlines line up with it
let seeTimer;
const followGame = () => {
	if (!els.preview) return;
	if (!see.on || !isOpen()) {
		clearInterval(seeTimer); seeTimer = undefined;
		Object.assign(els.preview.style, { position: 'absolute', inset: '0', left: '', top: '', width: '100%', height: '100%' });
		return;
	}
	const c = document.querySelector('canvas.play__canvas');
	const r = c && c.getBoundingClientRect().width > 50 ? c.getBoundingClientRect() : { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight };
	Object.assign(els.preview.style, { position: 'fixed', inset: '', left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px` });
	if (!seeTimer) seeTimer = setInterval(() => { followGame(); renderPreview(); }, 500);
};

export const mount = () => {
	animTimer = setInterval(() => { if (animating()) renderPreview(); }, 33);
	urMount();
	judgeMount();
	versus.mount();
	hitsounds.mount();
	buildPanel();
	counter.mount();
	entries.mount();
	onKey = (e) => {
		if (e.altKey && e.shiftKey && !e.ctrlKey && e.code === 'KeyS') {
			if (!hotkeyOn && !isOpen()) return; // switched off in Options (it still closes an open editor)
			e.preventDefault();
			if (isOpen()) closePanel(); else openPanel();
		}
	};
	window.addEventListener('keydown', onKey, true);
};

export const unmount = () => {
	window.removeEventListener('keydown', onKey, true);
	window.removeEventListener('focus', onFocusBack);
	entries.unmount();
	urUnmount();
	judgeUnmount();
	liveMap.stop();
	clearInterval(seeTimer); seeTimer = undefined;
	handleLayer?.remove(); handleLayer = null;
	counter.unmount();
	hitsounds.unmount();
	see.on = false;
	window.removeEventListener('resize', drawPreview);
	if (els.urShow) window.removeEventListener('oss-idle-ur-bar', els.urShow);
	versus.unmount();
	waitingForFolder = false;
	panel?.remove();
	panel = undefined;
	els = {};
	skin = null;
	folderSkins = [];
	folderHandle = null;
	clearTimeout(liveTimer);
	clearInterval(animTimer);
	liveId = null;
};

// oss!idle add-on: Medal tracker  (version 0.3.1)
//
// Shows which medals you can get next and how close you are, from the game's own
// medal progress for your character:
//   - Ready: medals you've already earned but not been given yet (the game hands
//     them out on your next result screen)
//   - Next up: the next medal in every series (plays, stars, levels, pp...), with
//     your progress, closest first
//   - To do: the one-off medals you don't have yet
//   - Secret (Hush-Hush) medals stay secret until you have them, like in the
//     game, unless you tick "Show how to get them" (remembered)
//
//   - For medals won on a map: the easiest ranked maps to go for, from the game's map list
//     (click one to search for it in song select)
// It takes osu!lazer's look when the lazer look add-on is on.
//
// Alt+Shift+M opens and closes it.

const API_FALLBACK = 'https://api.oss.idle.rhythmgamers.net';
// two looks: osu!lazer's (when the lazer look add-on is on) and the tracker's own
const CLASSIC_C = {
	bg: '#191622', sunken: '#221d2e', line: '#3d3550', ink: '#eceaf2', muted: '#9a92ae',
	accent: '#ff66ab', ok: '#6fd99a', warn: '#ffbe5c',
};
const LAZER_C = {
	bg: '#271f23', sunken: '#1a1517', line: '#3d3236', ink: '#ffffff', muted: '#a89ca2',
	accent: '#ff66ab', ok: '#88da20', warn: '#ffcc22',
};
const lazerWanted = () => !!window.__ossIdleLazerUi;
let lazerLook = lazerWanted();
const C = { ...(lazerLook ? LAZER_C : CLASSIC_C) };
let FONT = 'system-ui,sans-serif';
let BORDER = '', RADIUS = 8;
const styleTheme = () => {
	lazerLook = lazerWanted();
	Object.assign(C, lazerLook ? LAZER_C : CLASSIC_C);
	FONT = lazerLook ? '"Outfit","Exo 2",system-ui,sans-serif' : 'system-ui,sans-serif';
	BORDER = lazerLook ? 'border:0' : `border:1px solid ${C.line}`;
	RADIUS = lazerLook ? 10 : 8;
};
styleTheme();
const TIER_COLOURS = { bronze: '#c98450', silver: '#b9c2cc', gold: '#e8b33a', platinum: '#8fd6f5', divine: '#d48cff' };

// ---------- the game's medals (from its catalogue and texts) ----------
const SKILLS = {
	accuracy: 'Accuracy', speed: 'Speed', stamina: 'Stamina', jackspeed: 'Jack Speed',
	coordination: 'Coordination', release: 'Release', reading: 'Reading', consistency: 'Consistency',
	concentration: 'Concentration', speedjam: 'Speed Jam', memory: 'Memory',
};
const STAR_TIERS = ['bronze', 'bronze', 'silver', 'silver', 'gold', 'gold', 'platinum', 'platinum', 'divine', 'divine'];
const T = (ids, tiers) => ids.map((id, i) => [id, Array.isArray(tiers) ? tiers[i] : tiers]);

/** [id, tier] by category, in the game's order. */
const MEDALS = {
	skill: [
		...T(STAR_TIERS.map((_, i) => `pass-${i + 1}`), STAR_TIERS),
		...T(STAR_TIERS.map((_, i) => `fc-${i + 1}`), STAR_TIERS),
		['grade-ss', 'silver'], ['grade-x', 'gold'], ['grade-xx', 'divine'], ['rice', 'gold'], ['ln', 'gold'],
	],
	dedication: [
		...T(['plays-100', 'plays-1k', 'plays-5k', 'plays-25k', 'plays-100k'], ['bronze', 'silver', 'gold', 'platinum', 'divine']),
		...T(['hits-100k', 'hits-1m', 'hits-10m', 'hits-50m', 'hits-1b'], ['bronze', 'silver', 'gold', 'platinum', 'divine']),
		...T(['time-10h', 'time-100h', 'time-1000h', 'time-10000h'], ['bronze', 'silver', 'gold', 'platinum']),
	],
	mastery: [
		...Object.keys(SKILLS).flatMap(s => T([`${s}-50`, `${s}-100`, `${s}-105`, `${s}-110`], ['silver', 'gold', 'platinum', 'divine'])),
		...T(['overall-25', 'overall-50', 'overall-75', 'overall-100', 'overall-105', 'overall-110'], ['bronze', 'silver', 'gold', 'gold', 'platinum', 'divine']),
		...T(['upgrades-1', 'upgrades-10', 'upgrades-50', 'upgrades-100'], ['bronze', 'silver', 'gold', 'platinum']),
		...T(['ladders-1', 'ladders-5', 'ladders-10', 'ladders-11'], ['silver', 'gold', 'platinum', 'divine']),
		...T(['overdrive-2', 'overdrive-10', 'overdrive-100', 'overdrive-1000'], ['silver', 'gold', 'platinum', 'divine']),
		...T(['prestige-1', 'prestige-5', 'prestige-25', 'prestige-100'], ['silver', 'gold', 'platinum', 'divine']),
		['rebirth', 'divine'],
	],
	ranked: [
		...T(['first-1', 'first-10', 'first-100', 'first-1000'], ['silver', 'gold', 'platinum', 'divine']),
		...T(['pp-1k', 'pp-5k', 'pp-10k', 'pp-20k'], ['silver', 'gold', 'platinum', 'divine']),
		...T(['top-75', 'top-50', 'top-25', 'top-10', 'top-1'], ['bronze', 'silver', 'gold', 'platinum', 'divine']),
		...T(['play-pp-50', 'play-pp-100', 'play-pp-200', 'play-pp-500', 'play-pp-750', 'play-pp-1k'], ['bronze', 'bronze', 'silver', 'gold', 'platinum', 'divine']),
		...T(['curator-1', 'curator-5', 'curator-25', 'curator-100'], ['bronze', 'silver', 'gold', 'platinum']),
	],
	secret: T(['combo-727', 'same-map-100', 'fail-99', 'night-owl', 'first-chat', 'possessed'], 'silver'),
};
const CATEGORY_NAMES = { skill: 'Skill', dedication: 'Dedication', mastery: 'Mastery', ranked: 'Ranked', secret: 'Hush-Hush' };
const ALL = Object.entries(MEDALS).flatMap(([category, list]) => list.map(([id, tier]) => ({ id, tier, category })));

const NAMES = {
	'pass-1': 'First Steps', 'pass-2': 'Finding the Beat', 'pass-3': 'Keeping Up', 'pass-4': 'Hands Awake',
	'pass-5': 'Into the Storm', 'pass-6': 'Wall of Notes', 'pass-7': 'Beyond Reason', 'pass-8': 'Eight Stars Up',
	'pass-9': 'Nine Lives', 'pass-10': 'Ten-Star Legend',
	'fc-1': 'Clean Start', 'fc-2': 'Unbroken', 'fc-3': 'Steady Hands', 'fc-4': 'Flawless Flow', 'fc-5': 'Iron Combo',
	'fc-6': 'Glass Cannon', 'fc-7': 'Perfect Storm', 'fc-8': 'Untouchable', 'fc-9': 'Beyond Perfect', 'fc-10': 'Absolute',
	'grade-ss': 'Spotless', 'grade-x': 'Crystal Clear', 'grade-xx': 'Divine Touch', rice: 'Rice Cooker', ln: 'Hold the Line',
	'plays-100': 'Warming Up', 'plays-1k': 'Regular', 'plays-5k': 'Devoted', 'plays-25k': 'No Life', 'plays-100k': 'Eternal',
	'hits-100k': 'Tapping Away', 'hits-1m': 'Million Taps', 'hits-10m': 'Worn Switches', 'hits-50m': 'Keyboard Breaker', 'hits-1b': 'Billion Club',
	'time-10h': 'Time Flies', 'time-100h': 'Where Did The Day Go', 'time-1000h': 'Lifer', 'time-10000h': 'Ten Thousand Hours',
	'overall-25': 'Well Rounded', 'overall-50': 'Halfway There', 'overall-75': 'Seasoned', 'overall-100': 'Centurion',
	'overall-105': 'Overachiever', 'overall-110': 'Ascendant',
	'upgrades-1': 'Gearing Up', 'upgrades-10': 'Shopping Spree', 'upgrades-50': 'Big Spender', 'upgrades-100': 'Fully Loaded',
	'ladders-1': 'Top of the Line', 'ladders-5': 'Kitted Out', 'ladders-10': 'Perfectionist', 'ladders-11': 'Completionist',
	'overdrive-2': 'Redline', 'overdrive-10': 'Overclocked', 'overdrive-100': 'Meltdown', 'overdrive-1000': 'Singularity',
	'prestige-1': 'Fresh Start', 'prestige-5': 'Again and Again', 'prestige-25': 'Prestigious', 'prestige-100': 'Eternal Return',
	rebirth: 'Born Again',
	'first-1': 'Number One', 'first-10': 'Collector', 'first-100': 'Royalty', 'first-1000': 'Undisputed',
	'pp-1k': 'Liftoff', 'pp-5k': 'High Orbit', 'pp-10k': 'Escape Velocity', 'pp-20k': 'Beyond the Stars',
	'top-75': 'In the Running', 'top-50': 'Upper Half', 'top-25': 'Top Quarter', 'top-10': 'Elite', 'top-1': 'One Percent',
	'play-pp-50': 'First Spark', 'play-pp-100': 'Triple Digits', 'play-pp-200': 'Heating Up', 'play-pp-500': 'Wildfire',
	'play-pp-750': 'Inferno', 'play-pp-1k': 'Supernova',
	'curator-1': 'Curator', 'curator-5': 'Talent Scout', 'curator-25': 'Tastemaker', 'curator-100': 'Archivist',
	'combo-727': 'When You See It', 'same-map-100': 'Broken Record', 'fail-99': 'So Close', 'night-owl': 'Night Owl',
	'first-chat': 'Hello World', possessed: 'Possessed',
};
const DESCRIPTIONS = {
	'grade-ss': 'Get an SS on a ranked map', 'grade-x': 'Get an X on a ranked map', 'grade-xx': 'Get an XX on a ranked map',
	rice: 'Pass a 4★ or harder map made of over 90% single notes',
	ln: 'Pass a 4★ or harder map made of over 50% long notes',
	'upgrades-1': 'Buy your first upgrade', 'ladders-1': 'Buy every upgrade of a skill', 'prestige-1': 'Prestige a skill',
	rebirth: 'Rebirth your character', 'first-1': 'Take #1 on a ranked map', 'curator-1': 'Propose a map that gets ranked',
	'combo-727': 'Finish a play at exactly 727 combo', 'same-map-100': 'Play the same map 100 times',
	'fail-99': 'Fail a map with 1% of it left', 'night-owl': 'Play between 3 and 5 am',
	'first-chat': 'Say something in #oss!idle', possessed: 'Get a 1,000,000 score on TAG underground - POSSESSION',
};
const SERIES = {
	pass: n => `Pass a ranked map of ${n}★ or more`,
	fc: n => `Full combo a ranked map of ${n}★ or more`,
	plays: n => `Play ${num(n)} ranked maps`,
	hits: n => `Hit ${num(n)} notes`,
	time: n => `Play for ${num(n)} hours`,
	overall: n => `Reach overall level ${n}`,
	upgrades: n => `Hold ${num(n)} upgrades at once`,
	ladders: n => `Max out the upgrades of ${n} skills at once`,
	overdrive: n => `Reach ${n}ω overdrive on a skill`,
	prestige: n => `Prestige ${n} times in total`,
	first: n => `Hold #1 on ${num(n)} ranked maps`,
	pp: n => `Reach ${num(n)} pp`,
	'play-pp': n => `Set a ${num(n)} pp play`,
	top: n => `Be in the top ${n}% of players by pp`,
	curator: n => `Have ${n} of your proposed maps ranked`,
};
/** The fine print for the secret medals, from the server's own rules. */
const SECRET_TIPS = {
	'combo-727': 'Any stored score whose max combo is exactly 727. Not with EZ.',
	'same-map-100': 'Your most-played single map needs 100 plays.',
	'fail-99': 'Fail after at least 99% of the map, on a play whose result screen you see.',
	'night-owl': 'A play that ends between 3:00 and 4:59 am in your time zone. Not with EZ.',
	'first-chat': 'Send any message in the #oss!idle chat channel.',
	possessed: 'A 1,000,000 score on TAG underground - POSSESSION [CHALLENGE]. Not with EZ.',
};

/** What the progress numbers count, for "340 / 1,000 plays". */
const UNITS = {
	pass: '★', fc: '★', plays: 'plays', hits: 'notes', time: 'hours', overall: 'level', upgrades: 'upgrades',
	ladders: 'skills', overdrive: 'ω', prestige: 'prestiges', first: '#1s', pp: 'pp', 'play-pp': 'pp', curator: 'maps',
};
const SKILL_TIERS = { 50: 'Adept', 100: 'Master', 105: 'Grandmaster', 110: 'Legend' };

const num = (n) => Number(n).toLocaleString('en-US', { maximumFractionDigits: 1 });
/** A numbered medal's series and number: `plays-1k` is plays, 1000. */
const seriesOf = (id) => {
	const m = /^(.+)-(\d+)([kmb]?)h?$/.exec(id);
	return m ? { name: m[1], n: Number(m[2]) * ({ '': 1, k: 1e3, m: 1e6, b: 1e9 })[m[3]] } : null;
};
const medalName = (id) => {
	const s = seriesOf(id);
	if (s && SKILLS[s.name]) return `${SKILLS[s.name]} ${SKILL_TIERS[s.n]}`;
	return NAMES[id] || id;
};
const medalText = (id) => {
	if (DESCRIPTIONS[id]) return DESCRIPTIONS[id];
	const s = seriesOf(id);
	if (!s) return '';
	if (SKILLS[s.name]) return `Reach level ${s.n} in ${SKILLS[s.name]}`;
	return SERIES[s.name] ? SERIES[s.name](s.n) : '';
};
const unitOf = (id) => {
	const s = seriesOf(id);
	if (!s) return '';
	return SKILLS[s.name] ? 'level' : (UNITS[s.name] || '');
};

// ---------- levels and XP (the game's own curve) ----------
// XP for one level: grows along two curves, then very steeply past level 100.
const bezier = (x1, y1, x2, y2) => {
	const ax = 1 - 3 * x2 + 3 * x1, bx = 3 * x2 - 6 * x1, cx = 3 * x1;
	const ay = 1 - 3 * y2 + 3 * y1, by = 3 * y2 - 6 * y1, cy = 3 * y1;
	const xAt = t => ((ax * t + bx) * t + cx) * t, yAt = t => ((ay * t + by) * t + cy) * t;
	return (x) => {
		if (x <= 0) return 0;
		if (x >= 1) return 1;
		let lo = 0, hi = 1, t = x;
		for (let i = 0; i < 64; i++) { const v = xAt(t); if (Math.abs(v - x) < 1e-6) break; if (v < x) lo = t; else hi = t; t = (lo + hi) / 2; }
		return yAt(t);
	};
};
const curveA = bezier(0.1, 0.4, 0.95, 0), curveB = bezier(0.5, 0, 1, 0.4);
const xpForLevel = (l) => 100 + curveA(l / 100) * 9900 + curveB((l - 60) / 40) * 9e4 + (l < 100 ? 0 : (l - 99) * (l - 98) / 2 * 1e7);
const xpTo = (level) => { let t = 0; for (let l = 0; l < level; l++) t += xpForLevel(l); return t; };
const XP_COLUMNS = [...Object.keys(SKILLS).map(k => `${k}TotalXp`), 'overallTotalXp'];

// ---------- your character ----------
const apiBase = () => {
	try { return localStorage.getItem('oss-idle:api-base') || API_FALLBACK; } catch { return API_FALLBACK; }
};

/** The signed-in character: the game keeps a copy of it locally, by its server id. */
const myCharacter = async () => {
	const db = window.db;
	if (!db || !db.read) return null;
	try {
		return await db.read(d => {
			const res = d.exec(`SELECT id, name, ${XP_COLUMNS.join(', ')} FROM character WHERE id > 0 ORDER BY generation DESC, id DESC LIMIT 1`);
			const row = res[0] && res[0].values[0];
			if (!row) return null;
			const xp = Object.fromEntries(XP_COLUMNS.map((c, i) => [c.replace(/TotalXp$/, ''), Number(row[i + 2]) || 0]));
			return { id: Number(row[0]), name: String(row[1] || ''), xp };
		});
	} catch { return null; }
};

const fetchMedals = async (id) => {
	const res = await fetch(`${apiBase()}/v1/characters/${id}/medals`);
	if (!res.ok) throw new Error(`the server said ${res.status}`);
	return res.json();
};

// ---------- what you can get ----------
/**
 * Sort every medal: held, ready (earned, not given yet), next in each series
 * with progress, the rest of each series, one-offs and secrets.
 */
const sortOut = (data) => {
	const held = new Set((data.held || []).map(h => h.id));
	const progress = data.progress || {};
	const players = (data.holders && data.holders.players) || 0;
	const holders = (data.holders && data.holders.held) || {};
	const rarity = (id) => (players ? (holders[id] || 0) / players : null);

	const ready = [], next = [], later = [], oneOff = [], secret = [];
	const seenSeries = new Set();
	for (const m of ALL) {
		if (held.has(m.id)) continue;
		const entry = { ...m, rarity: rarity(m.id) };
		if (m.category === 'secret') { secret.push(entry); continue; }
		const p = progress[m.id];
		if (p) {
			entry.value = p.value; entry.current = p.current; entry.goal = p.goal;
			if (p.value >= p.goal) { ready.push(entry); continue; }
			// a level: how far along in XP (the levels get much dearer the higher they go)
			const sr = seriesOf(m.id);
			const have = character && character.xp ? character.xp[sr.name] : undefined;
			if (have !== undefined && (SKILLS[sr.name] || sr.name === 'overall')) {
				entry.xpHave = have;
				entry.xpNeed = xpTo(p.goal);
			}
			const line = seriesOf(m.id).name;
			if (seenSeries.has(line)) { later.push(entry); continue; }
			seenSeries.add(line);
			next.push(entry);
		} else {
			oneOff.push(entry);
		}
	}
	const share = (m) => (m.xpNeed ? m.xpHave / m.xpNeed : m.value / m.goal);
	next.sort((a, b) => share(b) - share(a));
	return {
		held: held.size, total: ALL.length, ready, next, later, oneOff, secret,
		secretHeld: ALL.filter(m => m.category === 'secret' && held.has(m.id)).length,
	};
};

// ---------- the easiest maps to go for ----------
// The game's list of ranked maps (each difficulty: stars, notes, rice and long notes,
// length), kept for ten minutes.
let catalog = null, catalogAt = 0;
const loadCatalog = async () => {
	if (catalog && Date.now() - catalogAt < 10 * 60 * 1000) return catalog;
	const res = await fetch(`${apiBase()}/v1/beatmap/catalog`, { credentials: 'include' });
	if (!res.ok) throw new Error(`the server said ${res.status}`);
	const data = await res.json();
	const sets = [...(data.intro ? [data.intro] : []), ...(data.beatmaps || [])];
	const seen = new Set();
	catalog = [];
	for (const set of sets) {
		if (!set || set.ranked === false || seen.has(set.id)) continue;
		seen.add(set.id);
		for (const v of set.versions || []) {
			const objects = Number(v.objects) || 0;
			catalog.push({
				setId: set.id, id: v.id, title: set.title, artist: set.artist, version: v.version,
				stars: Number(v.difficulty) || 0, keys: v.keys, objects, rice: Number(v.rice) || 0, ln: Number(v.ln) || 0,
				combo: objects + (Number(v.ln) || 0), length: Number(v.total_length) || 0, plays: Number(set.plays) || 0,
				tags: (v.tags || []).join(' '), intro: set === data.intro,
			});
		}
	}
	catalogAt = Date.now();
	return catalog;
};
const byEase = (a, b) => a.stars - b.stars || a.objects - b.objects;
/** For a medal won on a map: the few maps that get it most easily, and why. */
const mapsFor = (id, maps) => {
	if (!maps || !maps.length) return null;
	const s = seriesOf(id);
	const top = (list, why) => ({ maps: list.slice(0, 3), why });
	if (s && (s.name === 'pass' || s.name === 'fc')) {
		return top(maps.filter(m => m.stars >= s.n).sort(byEase), s.name === 'pass' ? `the lowest ${s.n}★ and up` : `the lowest ${s.n}★ and up, fewest notes (easier to full combo)`);
	}
	if (/^grade-/.test(id)) return top([...maps].sort((a, b) => a.objects - b.objects || a.stars - b.stars), 'fewest notes, so fewest chances to slip');
	if (id === 'rice') return top(maps.filter(m => m.stars >= 4 && m.objects && m.rice / m.objects > 0.9).sort(byEase), 'the lowest 4★+ that are over 90% single notes');
	if (id === 'ln') return top(maps.filter(m => m.stars >= 4 && m.objects && m.ln / m.objects > 0.5).sort(byEase), 'the lowest 4★+ that are over 50% long notes');
	if (id === 'possessed') return top(maps.filter(m => /possession/i.test(m.title) && /challenge/i.test(m.version)), 'the map itself (TAG underground)');
	if (id === 'combo-727') {
		return top(maps.filter(m => m.combo >= 727).sort((a, b) => Math.abs(a.combo - 727) - Math.abs(b.combo - 727) || a.stars - b.stars),
			'a full combo is exactly 727 (or the closest above, to end on 727)');
	}
	if (id === 'same-map-100') return top(maps.filter(m => m.length > 0).sort((a, b) => a.length - b.length || a.stars - b.stars), 'the shortest, to play it 100 times quickly');
	if (s && s.name === 'first') return top(maps.filter(m => !m.intro).sort((a, b) => a.plays - b.plays || a.stars - b.stars), 'the least played: fewest scores to beat for #1');
	return null;
};
const mapLabel = (m) => `${m.artist} - ${m.title} [${m.version}]`;
/** Look the map up in song select (the lazer look's search box, if it's there). */
const searchFor = (m) => {
	const box = document.querySelector('.lz-filter input[type=text], .lz-filter input:not([type])') || document.querySelector('.songsearch__input');
	if (!box) return false;
	Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(box, m.title);
	box.dispatchEvent(new Event('input', { bubbles: true }));
	return true;
};

// ---------- the panel ----------
let panel, body, onKey, showLater = false, lastData = null, character = null, mapList = null;
const SPOIL_KEY = 'oss-idle-medal-tracker-secrets';
let showSecrets = false;
try { showSecrets = localStorage.getItem(SPOIL_KEY) === '1'; } catch {}

const el = (tag, css, text) => {
	const e = document.createElement(tag);
	if (css) e.style.cssText = css;
	if (text !== undefined) e.textContent = text;
	return e;
};

const rarityText = (r) => (r == null ? '' : r === 0 ? 'nobody has it yet' : `${r < 0.001 ? '<0.1' : num(r * 100)}% of players have it`);

const medalRow = (m, { bar = false } = {}) => {
	const row = el('div', `display:grid;grid-template-columns:12px minmax(0,1fr);gap:4px 8px;padding:8px 10px;border-radius:${RADIUS}px;background:${C.sunken}`);
	const dot = el('div', `width:10px;height:10px;border-radius:50%;margin-top:4px;background:${TIER_COLOURS[m.tier]}`);
	dot.title = `${m.tier[0].toUpperCase()}${m.tier.slice(1)} medal`;
	const main = el('div', 'display:grid;gap:3px;min-width:0');
	const top = el('div', 'display:flex;gap:8px;align-items:baseline');
	top.append(
		el('span', 'font-weight:600', medalName(m.id)),
		el('span', `font-size:11px;color:${C.muted};margin-left:auto;white-space:nowrap`, CATEGORY_NAMES[m.category]),
	);
	main.append(top, el('div', `font-size:12px;color:${C.muted}`, medalText(m.id)));
	if (SECRET_TIPS[m.id]) main.append(el('div', `font-size:11px;color:${C.warn}`, SECRET_TIPS[m.id]));
	if (bar && m.goal) {
		const pct = Math.max(0, Math.min(1, m.xpNeed ? m.xpHave / m.xpNeed : m.value / m.goal));
		const track = el('div', `height:6px;border-radius:3px;background:${C.line};overflow:hidden;margin-top:2px`);
		track.append(el('div', `height:100%;width:${(pct * 100).toFixed(1)}%;background:${TIER_COLOURS[m.tier]}`));
		const unit = unitOf(m.id);
		const amount = unit === 'level' ? `level ${num(m.value)} / ${num(m.goal)}` : `${num(m.value)} / ${num(m.goal)}${unit ? ` ${unit}` : ''}`;
		const shown = pct > 0 && pct < 0.01 ? (pct * 100).toFixed(pct < 0.001 ? 3 : 2) : Math.floor(pct * 100);
		const label = m.xpNeed
			? `${amount} · ${num(Math.round(m.xpHave))} / ${num(Math.round(m.xpNeed))} XP · ${shown}%`
			: `${amount} · ${shown}%`;
		// "now" differs from the best when progress went back (a prestige, a lost #1)
		const now = m.current !== undefined && m.current < m.value ? ` (now ${num(m.current)})` : '';
		main.append(track, el('div', `font-size:11px;color:${C.muted}`, label + now));
	}
	const r = rarityText(m.rarity);
	if (r) main.append(el('div', `font-size:11px;color:${C.muted};opacity:.75`, r));
	const pick = mapsFor(m.id, mapList);
	if (pick && pick.maps.length) {
		const box = el('div', `display:grid;grid-template-columns:minmax(0,1fr);gap:3px;margin-top:4px;padding:6px 8px;border-radius:${RADIUS}px;background:${lazerLook ? C.bg : C.bg}`);
		box.append(el('div', `font-size:11px;color:${C.muted}`, `Easiest maps · ${pick.why}`));
		for (const map of pick.maps) {
			const line = el('button', `display:flex;gap:8px;align-items:baseline;width:100%;padding:3px 4px;border:0;border-radius:6px;background:transparent;color:${C.ink};font:12px ${FONT};text-align:left;cursor:pointer`);
			line.append(
				el('span', `flex-shrink:0;font-weight:600;color:${C.warn}`, `${map.stars.toFixed(2)}★`),
				el('span', 'min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap', mapLabel(map)),
				el('span', `flex-shrink:0;margin-left:auto;font-size:11px;color:${C.muted}`, `${map.keys}K · ${num(map.objects)} notes`),
			);
			line.title = 'Search for it in song select';
			line.addEventListener('mouseenter', () => { line.style.background = C.sunken; });
			line.addEventListener('mouseleave', () => { line.style.background = 'transparent'; });
			line.addEventListener('click', () => {
				if (!searchFor(map)) {
					line.title = 'Open song select first, then click it again';
					line.lastChild.textContent = 'open song select first';
				}
			});
			box.append(line);
		}
		main.append(box);
	} else if (pick && mapList) {
		main.append(el('div', `font-size:11px;color:${C.muted};opacity:.75`, 'No ranked map fits this one yet.'));
	}
	row.append(dot, main);
	return row;
};

const section = (title, note, items) => {
	const wrap = el('div', 'display:grid;grid-template-columns:minmax(0,1fr);gap:6px');
	const head = el('div', 'display:flex;gap:8px;align-items:baseline');
	head.append(el('div', lazerLook ? `font-weight:600;font-size:15px;color:${C.ink};text-transform:lowercase` : `font-weight:700;color:${C.accent}`, title), el('div', `font-size:11px;color:${C.muted}`, note));
	wrap.append(head, ...items);
	return wrap;
};

const render = () => {
	if (!body) return;
	body.replaceChildren();
	if (!lastData) return;
	const s = sortOut(lastData);
	const parts = [];
	parts.push(el('div', `font-size:12px;color:${C.muted}`,
		`${character.name || 'Your character'} · ${s.held} of ${s.total} medals`));
	if (s.ready.length) {
		parts.push(section('Ready', 'earned: you get these on your next result screen', s.ready.map(m => medalRow(m))));
	}
	if (s.next.length) parts.push(section('Next up', 'closest first', s.next.map(m => medalRow(m, { bar: true }))));
	if (s.oneOff.length) parts.push(section('To do', 'one-off medals', s.oneOff.map(m => medalRow(m))));
	if (s.later.length) {
		const toggle = el('button', `font:600 12px ${FONT};color:${C.ink};background:${C.sunken};${BORDER};border-radius:${RADIUS}px;padding:5px 10px;cursor:pointer;justify-self:start`,
			showLater ? `Hide the later ${s.later.length}` : `Show the later ${s.later.length} in each series`);
		toggle.addEventListener('click', () => { showLater = !showLater; render(); });
		parts.push(toggle);
		if (showLater) parts.push(section('Later', 'after the next one in their series', s.later.map(m => medalRow(m, { bar: true }))));
	}
	const left = s.secret.length;
	const secretItems = [];
	if (left) {
		const spoil = el('label', 'display:flex;gap:8px;align-items:center;cursor:pointer;font-size:12px;padding:0 2px');
		const box = el('input', `width:15px;height:15px;accent-color:${C.accent};cursor:pointer`);
		box.type = 'checkbox';
		box.checked = showSecrets;
		box.addEventListener('change', () => {
			showSecrets = box.checked;
			try { localStorage.setItem(SPOIL_KEY, showSecrets ? '1' : '0'); } catch {}
			render();
		});
		spoil.append(box, el('span', '', 'Show how to get them (spoilers)'));
		secretItems.push(spoil);
		if (showSecrets) secretItems.push(...s.secret.map(m => medalRow(m)));
		else secretItems.push(el('div', `font-size:12px;color:${C.muted};padding:0 2px`, `${left} secret medal${left === 1 ? '' : 's'} left to find.`));
	}
	parts.push(section('Hush-Hush', `${s.secretHeld} of ${s.secretHeld + left} found`, secretItems));
	if (!s.ready.length && !s.next.length && !s.oneOff.length && !left) {
		parts.unshift(el('div', `color:${C.ok};font-weight:600`, 'You have every medal!'));
	}
	body.append(...parts);
};

const status = (text, colour = C.muted) => {
	if (!body) return;
	body.replaceChildren(el('div', `font-size:13px;color:${colour};padding:6px 2px`, text));
};

const load = async () => {
	status('Loading your medals…');
	character = await myCharacter();
	if (!character) {
		status('Sign in to an online character to see your medals: offline characters don\'t earn them.', C.warn);
		return;
	}
	try {
		lastData = await fetchMedals(character.id);
		render();
		// the maps to go for come after (the list is big): shown once it's in
		loadCatalog().then(list => { mapList = list; render(); }).catch(() => {});
	} catch (e) {
		status(`Couldn't load your medals: ${e.message || e}`, C.warn);
	}
};

const buildPanel = () => {
	panel = el('div', [
		'position:fixed', 'right:16px', 'top:16px', 'bottom:16px', 'z-index:99000', // under the game's cursor
		'display:none', 'flex-direction:column', 'width:min(380px, calc(100vw - 32px))',
		`background:${C.bg}`, lazerLook ? 'border:0' : `border:1px solid ${C.line}`, `border-radius:${lazerLook ? 16 : 12}px`,
		`color:${C.ink}`, `font:13px ${FONT}`, 'box-shadow:0 8px 32px rgba(0,0,0,.55)',
	].join(';'));
	panel.addEventListener('keydown', e => e.stopPropagation());
	const head = el('div', `display:flex;gap:8px;align-items:center;padding:12px 14px;${lazerLook ? `background:${C.sunken};border-radius:16px 16px 0 0` : `border-bottom:1px solid ${C.line}`}`);
	const btn = `font:600 12px ${FONT};color:${C.ink};background:${lazerLook ? C.line : C.sunken};${BORDER};border-radius:${RADIUS}px;padding:5px 10px;cursor:pointer`;
	const refresh = el('button', btn + ';margin-left:auto', 'Refresh');
	refresh.addEventListener('click', load);
	const close = el('button', btn, 'Close');
	close.addEventListener('click', () => { panel.style.display = 'none'; });
	head.append(el('div', lazerLook ? `font:600 18px ${FONT};color:${C.ink}` : `font:700 15px ${FONT};color:${C.accent}`, lazerLook ? 'medals' : 'Medals you can get'), refresh, close);
	body = el('div', 'display:grid;grid-template-columns:minmax(0,1fr);gap:14px;align-content:start;padding:12px 14px;overflow:auto;min-height:0;flex:1');
	panel.append(head, body, el('div', `padding:8px 14px;font-size:11px;color:${C.muted};border-top:1px solid ${C.line}`, 'Alt+Shift+M to close · v0.3.1'));
	document.body.append(panel);
};

export const mount = () => {
	buildPanel();
	onKey = (e) => {
		if (e.altKey && e.shiftKey && !e.ctrlKey && e.code === 'KeyM') {
			e.preventDefault();
			const open = panel.style.display === 'none';
			if (open && lazerWanted() !== lazerLook) { panel.remove(); styleTheme(); buildPanel(); }
			panel.style.display = open ? 'flex' : 'none';
			if (open) load();
		}
	};
	window.addEventListener('keydown', onKey, true);
};

export const unmount = () => {
	window.removeEventListener('keydown', onKey, true);
	panel?.remove();
	panel = undefined;
	body = undefined;
	lastData = null;
};

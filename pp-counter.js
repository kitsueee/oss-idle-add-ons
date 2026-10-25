// oss!idle add-on: live pp counter
//
// Shows the pp your play is worth while it's running, under the score:
//   - the big number: pp if you keep hitting the way you have so far
//   - "max": pp if every note from here on is a MAX (320)
// It uses osu!mania's pp formula (the one the game runs through rosu-pp) with
// the play's own hit counts, star rating, rate and mods. When the map ends,
// both numbers equal what the game computes for the play.
//
// Alt+Shift+P shows or hides it (remembered between sessions).

const STORAGE_KEY = 'oss-idle-pp-counter';
const API_FALLBACK = 'https://api.oss.idle.rhythmgamers.net';

let visible = true;
let box, main, sub, timer, onKey;

// ---------- pp (osu!mania, stable) ----------
/**
 * osu!mania pp for a set of hit counts.
 * c: { n320, n300, n200, n100, n50, miss }, total: the map's note count (a hold is one).
 */
const maniaPP = (stars, c, total, mods) => {
	if (total <= 0) return 0;
	const acc = (c.n320 * 320 + c.n300 * 300 + c.n200 * 200 + c.n100 * 100 + c.n50 * 50) / (total * 320);
	let multiplier = 8;
	if (mods.includes('NF')) multiplier *= 0.75;
	if (mods.includes('EZ')) multiplier *= 0.5;
	return multiplier
		* Math.pow(Math.max(stars - 0.15, 0.05), 2.2)
		* Math.max(0, 5 * acc - 4)
		* (1 + 0.1 * Math.min(1, total / 1500));
};

/** The game's judgements, in pp's terms. Divine and marvelous are both 320s. */
const countsOf = (score) => {
	const k = score.counts || {};
	return {
		n320: (k.DIVINE || 0) + (k.MARVELOUS || 0),
		n300: k.PERFECT || 0,
		n200: k.GREAT || 0,
		n100: k.GOOD || 0,
		n50: k.BAD || 0,
		miss: k.MISS || 0,
	};
};
const judged = (c) => c.n320 + c.n300 + c.n200 + c.n100 + c.n50 + c.miss;

// ---------- finding the play ----------
/**
 * The gameplay screen keeps the running game in a React ref. From the playfield
 * canvas, walk up React's tree to the component that has the play, and find it.
 */
let cached = { canvas: null, play: null };
const findPlay = (canvas) => {
	if (cached.canvas === canvas && cached.play) return cached.play;
	cached = { canvas, play: null };
	const key = Object.keys(canvas).find(k => k.startsWith('__reactFiber$'));
	let fiber = key ? canvas[key] : null;
	for (let depth = 0; fiber && depth < 40; depth++, fiber = fiber.return) {
		const props = fiber.memoizedProps;
		if (!props || !props.play || !props.beatmapInfo) continue;
		for (let hook = fiber.memoizedState; hook; hook = hook.next) {
			const ref = hook.memoizedState;
			const game = ref && typeof ref === 'object' && 'current' in ref ? ref.current : null;
			if (game && game.score && game.score.counts && Array.isArray(game.notes)) {
				cached.play = { fiber, game, props };
				return cached.play;
			}
		}
		// the play component, but its game isn't built yet
		cached.play = { fiber, game: null, props };
		return null;
	}
	return null;
};
// the ref's object never changes, but the game inside it is built a moment later
const gameOf = (play) => {
	if (play.game) return play.game;
	for (let hook = play.fiber.memoizedState; hook; hook = hook.next) {
		const ref = hook.memoizedState;
		const game = ref && typeof ref === 'object' && 'current' in ref ? ref.current : null;
		if (game && game.score && game.score.counts && Array.isArray(game.notes)) return (play.game = game);
	}
	return null;
};

// ---------- star rating ----------
const starsByRate = new Map(); // rate -> Map(beatmap id -> stars), or 'loading' / 'failed'
const apiBase = () => {
	try { return localStorage.getItem('oss-idle:api-base') || API_FALLBACK; } catch { return API_FALLBACK; }
};
const loadRate = async (rate) => {
	starsByRate.set(rate, 'loading');
	try {
		const res = await fetch(`${apiBase()}/v1/beatmap/stars/${rate}`);
		if (!res.ok) throw new Error(String(res.status));
		const json = await res.json();
		starsByRate.set(rate, new Map(Object.entries(json).map(([id, s]) => [Number(id), s])));
	} catch {
		starsByRate.set(rate, 'failed');
	}
};
/** { stars, estimate }: the map's star rating at the play's rate. */
const starsFor = (meta, rate) => {
	const x1 = Number(meta.difficulty) || 0;
	if (Math.abs(rate - 1) < 1e-6) return { stars: x1, estimate: false };
	const known = starsByRate.get(rate);
	if (known === undefined) loadRate(rate);
	if (known instanceof Map && known.has(meta.id)) return { stars: known.get(meta.id), estimate: false };
	// not known here (yet): a rough guess, flagged as one
	return { stars: x1 * rate, estimate: true };
};

// ---------- display ----------
const fmt = (pp) => (pp >= 100 ? pp.toFixed(0) : pp.toFixed(1));

const tick = () => {
	const canvas = document.querySelector('canvas.play__canvas');
	if (!visible || !canvas) { box.style.display = 'none'; return; }
	const play = findPlay(canvas);
	const game = play && gameOf(play);
	if (!game) { box.style.display = 'none'; return; }

	const meta = (play.props.beatmapInfo && play.props.beatmapInfo.metadata) || {};
	const p = play.props.play || {};
	const rate = Number(p.rate) || 1;
	const mods = Array.isArray(p.mods) ? p.mods : [];
	const { stars, estimate } = starsFor(meta, rate);

	const total = game.notes.length;
	const c = countsOf(game.score);
	const done = judged(c);

	// keep going at the same hit ratio: scale the counts so far up to the whole map
	let now;
	if (done === 0) now = maniaPP(stars, { n320: total, n300: 0, n200: 0, n100: 0, n50: 0, miss: 0 }, total, mods);
	else {
		const f = total / done;
		now = maniaPP(stars, {
			n320: c.n320 * f, n300: c.n300 * f, n200: c.n200 * f, n100: c.n100 * f, n50: c.n50 * f, miss: c.miss * f,
		}, total, mods);
	}
	// every note left is a MAX
	const max = maniaPP(stars, { ...c, n320: c.n320 + Math.max(0, total - done) }, total, mods);

	main.textContent = `${estimate ? '~' : ''}${fmt(now)}pp`;
	sub.textContent = `max ${fmt(max)}pp · ${stars.toFixed(2)}★${estimate ? ' (estimated)' : ''}`;

	// under the accuracy and score the game draws at the top right
	const r = canvas.getBoundingClientRect();
	const mobile = r.width < 700;
	box.style.top = `${r.top + (mobile ? 132 : 88)}px`;
	box.style.right = `${Math.max(0, window.innerWidth - r.right) + 28}px`;
	box.style.display = 'block';
};

const load = () => {
	try { visible = localStorage.getItem(STORAGE_KEY) !== '0'; } catch {}
};
const save = () => {
	try { localStorage.setItem(STORAGE_KEY, visible ? '1' : '0'); } catch {}
};

export const mount = () => {
	load();
	box = document.createElement('div');
	box.style.cssText = [
		'position:fixed', 'display:none', 'text-align:right', 'pointer-events:none',
		'z-index:99000', // under the game's cursor (99999-100000)
		'color:#fff', 'text-shadow:0 1px 3px rgba(0,0,0,.6)', 'font-variant-numeric:tabular-nums',
	].join(';');
	main = document.createElement('div');
	main.style.cssText = 'font:700 26px "Exo 2", system-ui, sans-serif;line-height:1.1';
	sub = document.createElement('div');
	sub.style.cssText = 'font:500 13px "Exo 2", system-ui, sans-serif;color:rgba(255,255,255,.7)';
	box.append(main, sub);
	document.body.append(box);

	timer = setInterval(tick, 100);
	onKey = (e) => {
		if (e.altKey && e.shiftKey && !e.ctrlKey && e.code === 'KeyP') {
			e.preventDefault();
			visible = !visible;
			save();
			tick();
		}
	};
	window.addEventListener('keydown', onKey, true);
};

export const unmount = () => {
	clearInterval(timer);
	window.removeEventListener('keydown', onKey, true);
	box?.remove();
	box = undefined;
	cached = { canvas: null, play: null };
};

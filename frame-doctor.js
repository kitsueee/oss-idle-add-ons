// oss!idle add-on: frame doctor
//
// Finds out where stutter comes from. During a map it measures every frame:
//   - the gap between frames (what you see as smooth or choppy)
//   - how long the game's own drawing code took in that frame
//   - long stalls of the main thread from anything else (timers, the idle sim, add-ons)
// and sorts every hitch into "the game's code was slow" or "the code was fast but
// the frame still came late" (the display, GPU, or frame pacing).
//
// Alt+Shift+F shows or hides the overlay. "Copy report" copies the numbers for the
// map so far, to paste somewhere.

const WINDOW_MS = 5000; // the live numbers cover the last 5 seconds

let visible = true;
let box, text, copyBtn, onKey, observer;
let prevRaf, ourRaf, loopId = 0, running = false;
let workSinceTick = 0;
let lastTick = 0;

let recent = []; // { at, gap, work }
let session; // since the current map started
let longTasks = []; // { at, duration }

const newSession = () => ({
	start: performance.now(), frames: 0, gaps: [], hitches: 0, slowCode: 0, outside: 0,
	worstGap: 0, worstWork: 0, longTasks: 0, longTaskMs: 0,
});

const median = (a) => {
	if (!a.length) return 0;
	const s = [...a].sort((x, y) => x - y);
	return s[Math.floor(s.length / 2)];
};
const pct = (a, p) => {
	if (!a.length) return 0;
	const s = [...a].sort((x, y) => x - y);
	return s[Math.min(s.length - 1, Math.floor(s.length * p))];
};
const inGameplay = () => !!document.querySelector('canvas.play__canvas');

/** A frame that came noticeably later than the usual frame. */
const isHitch = (gap, typical) => gap > Math.max(typical * 1.8, typical + 6);

const tick = (t) => {
	if (!running) return;
	loopId = prevRaf.call(window, tick);
	const now = performance.now();
	const gap = lastTick ? now - lastTick : 0;
	const work = workSinceTick;
	lastTick = now;
	workSinceTick = 0;

	if (!inGameplay()) { session = undefined; recent = []; render(); return; }
	if (!session) session = newSession();
	if (!gap) return;

	recent.push({ at: now, gap, work });
	while (recent.length && recent[0].at < now - WINDOW_MS) recent.shift();

	const typical = median(recent.map(f => f.gap));
	session.frames++;
	if (session.gaps.length < 200000) session.gaps.push(gap);
	session.worstGap = Math.max(session.worstGap, gap);
	session.worstWork = Math.max(session.worstWork, work);
	if (recent.length > 30 && isHitch(gap, typical)) {
		session.hitches++;
		// the code that ran in the frame ate most of the gap: slow code. Otherwise
		// the frame was simply delivered late.
		if (work > gap * 0.5 || work > typical * 2) session.slowCode++;
		else session.outside++;
	}
	if (session.frames % 10 === 0) render();
};

const render = () => {
	if (!box) return;
	if (!visible || !session || recent.length < 10) { box.style.display = 'none'; return; }
	const gaps = recent.map(f => f.gap);
	const typical = median(gaps);
	const works = recent.map(f => f.work);
	const hitches = recent.filter(f => isHitch(f.gap, typical));
	const slow = hitches.filter(f => f.work > f.gap * 0.5 || f.work > typical * 2).length;
	const now = performance.now();
	const lt = longTasks.filter(l => l.at > now - WINDOW_MS);
	text.textContent = [
		`FPS ${(1000 / typical).toFixed(0)}   frame ${typical.toFixed(1)} ms`,
		`slowest 1% ${pct(gaps, 0.99).toFixed(1)} ms   worst ${Math.max(...gaps).toFixed(1)} ms`,
		`game code ${median(works).toFixed(2)} ms   (worst ${Math.max(...works).toFixed(1)} ms)`,
		`hitches ${hitches.length}  (slow code ${slow}, late frames ${hitches.length - slow})`,
		`long stalls ${lt.length}${lt.length ? ` (worst ${Math.max(...lt.map(l => l.duration)).toFixed(0)} ms)` : ''}`,
	].join('\n');
	box.style.display = 'block';
};

const report = () => {
	if (!session) return 'No map running yet.';
	const s = session;
	const typical = median(s.gaps);
	const secs = (performance.now() - s.start) / 1000;
	return [
		'oss!idle frame doctor report',
		`played ${secs.toFixed(0)} s, ${s.frames} frames`,
		`typical frame ${typical.toFixed(2)} ms (~${(1000 / typical).toFixed(0)} FPS)`,
		`slowest 1% ${pct(s.gaps, 0.99).toFixed(1)} ms, slowest 0.1% ${pct(s.gaps, 0.999).toFixed(1)} ms, worst ${s.worstGap.toFixed(1)} ms`,
		`worst game code in one frame ${s.worstWork.toFixed(1)} ms`,
		`hitches ${s.hitches} (${(s.hitches / Math.max(1, secs)).toFixed(2)}/s): slow code ${s.slowCode}, late frames ${s.outside}`,
		`long stalls ${s.longTasks}, ${s.longTaskMs.toFixed(0)} ms in total`,
		`screen ${screen.width}x${screen.height} @${devicePixelRatio}x, window ${innerWidth}x${innerHeight}`,
		navigator.userAgent,
	].join('\n');
};

export const mount = () => {
	try { visible = localStorage.getItem('oss-idle-frame-doctor') !== '0'; } catch {}

	// time every animation-frame callback the game queues (its drawing)
	prevRaf = window.requestAnimationFrame;
	ourRaf = function (cb) {
		return prevRaf.call(window, (t) => {
			const s = performance.now();
			try { cb(t); } finally { workSinceTick += performance.now() - s; }
		});
	};
	window.requestAnimationFrame = ourRaf;

	// main-thread stalls outside of drawing (50 ms and over: the browser's threshold)
	try {
		observer = new PerformanceObserver((list) => {
			for (const e of list.getEntries()) {
				longTasks.push({ at: e.startTime, duration: e.duration });
				if (session) { session.longTasks++; session.longTaskMs += e.duration; }
			}
			const cut = performance.now() - WINDOW_MS;
			while (longTasks.length && longTasks[0].at < cut) longTasks.shift();
		});
		observer.observe({ type: 'longtask', buffered: false });
	} catch { observer = undefined; }

	box = document.createElement('div');
	box.style.cssText = [
		'position:fixed', 'left:12px', 'top:12px', 'z-index:99000', 'display:none',
		'padding:8px 10px', 'border-radius:8px', 'background:rgba(25,22,34,.88)', 'border:1px solid #3d3550',
		'color:#eceaf2', 'font:12px/1.45 ui-monospace,Consolas,monospace', 'pointer-events:auto',
	].join(';');
	text = document.createElement('pre');
	text.style.cssText = 'margin:0 0 6px;font:inherit;white-space:pre';
	copyBtn = document.createElement('button');
	copyBtn.textContent = 'Copy report';
	copyBtn.style.cssText = 'font:600 11px system-ui,sans-serif;color:#eceaf2;background:#221d2e;border:1px solid #3d3550;border-radius:6px;padding:3px 8px;cursor:pointer';
	copyBtn.addEventListener('click', async () => {
		try { await navigator.clipboard.writeText(report()); copyBtn.textContent = 'Copied'; }
		catch { copyBtn.textContent = 'Copy failed'; }
		setTimeout(() => { if (copyBtn) copyBtn.textContent = 'Copy report'; }, 1500);
	});
	box.append(text, copyBtn);
	document.body.append(box);

	running = true;
	loopId = prevRaf.call(window, tick);

	onKey = (e) => {
		if (e.altKey && e.shiftKey && !e.ctrlKey && e.code === 'KeyF') {
			e.preventDefault();
			visible = !visible;
			try { localStorage.setItem('oss-idle-frame-doctor', visible ? '1' : '0'); } catch {}
			render();
		}
	};
	window.addEventListener('keydown', onKey, true);
};

export const unmount = () => {
	running = false;
	window.cancelAnimationFrame(loopId);
	if (window.requestAnimationFrame === ourRaf) window.requestAnimationFrame = prevRaf;
	observer?.disconnect();
	observer = undefined;
	window.removeEventListener('keydown', onKey, true);
	box?.remove();
	box = undefined;
	session = undefined;
	recent = [];
	longTasks = [];
	lastTick = 0;
};

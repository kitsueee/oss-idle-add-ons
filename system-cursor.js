// oss!idle add-on: system cursor
//
// Uses your normal mouse cursor instead of the game's osu! cursor.
// The game hides your cursor by putting a "custom-cursor" class on the page and
// draws its own cursor and trail; this keeps that class off and hides them.
// Disable the add-on to get the osu! cursor back.

const CLASS = 'custom-cursor';
let observer, style;

const keepOff = () => {
	const html = document.documentElement;
	if (html.classList.contains(CLASS)) html.classList.remove(CLASS);
};

export const mount = () => {
	style = document.createElement('style');
	style.textContent = '.cursor, .cursor-trail { display: none !important; }';
	document.head.append(style);

	keepOff();
	// the game adds the class back (for example when its in-game browser closes)
	observer = new MutationObserver(keepOff);
	observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
};

export const unmount = () => {
	observer?.disconnect();
	observer = undefined;
	style?.remove();
	style = undefined;
	// hand the osu! cursor back, unless the game's in-game browser is open
	const html = document.documentElement;
	if (!html.classList.contains('web-open')) html.classList.add(CLASS);
};

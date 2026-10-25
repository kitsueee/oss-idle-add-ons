// oss!idle add-on: pink stars hotfix  (version 0.1.0)
//
// Copyright (c) 2026 YOUR NAME. Released under the MIT License: free to use, copy, change
// and share, as long as this notice stays in; it comes with no warranty.
//
// Makes the chat add-on's ✦ stars pink again for everyone, including the ones that turned
// blue for being on an older version. Works with the chat emojis add-on you already have.

const STYLE_ID = 'oss-pink-stars-hotfix';

export const mount = () => {
	let style = document.getElementById(STYLE_ID);
	if (!style) {
		style = document.createElement('style');
		style.id = STYLE_ID;
		document.head.append(style);
	}
	style.textContent = `
.ce-badge,.ce-badge.is-old{color:var(--lz-pink,#ff66ab) !important}
.ce-badge--card,.ce-badge--card.is-old{background:var(--lz-pink,#ff66ab) !important;color:#fff !important}
`;
};

export const unmount = () => {
	document.getElementById(STYLE_ID)?.remove();
};

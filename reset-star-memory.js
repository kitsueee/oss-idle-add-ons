// oss!idle add-on: reset star memory  (version 0.1.0)
//
// Copyright (c) 2026 YOUR NAME. Released under the MIT License: free to use, copy, change
// and share, as long as this notice stays in; it comes with no warranty.
//
// Clears the chat emojis add-on's memory of who uses it (and which version they're on), so
// stars that turned blue from a bad version number start fresh. Turn it on once: the game
// reloads one time, then you can turn this add-on off and delete it.

const KEY = 'oss-idle-chat-addon-users';
const DONE = 'oss-idle-reset-star-memory-done';

export const mount = () => {
	try {
		if (sessionStorage.getItem(DONE)) return;
		sessionStorage.setItem(DONE, '1');
		localStorage.removeItem(KEY);
		setTimeout(() => location.reload(), 300);
	} catch { /* storage is blocked: nothing to reset */ }
};

export const unmount = () => {
	try { sessionStorage.removeItem(DONE); } catch { /* fine */ }
};

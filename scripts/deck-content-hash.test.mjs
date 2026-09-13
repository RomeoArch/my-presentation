import { test } from 'node:test';
import assert from 'node:assert/strict';
import { deckContentHash } from './deck-content-hash.mjs';

test('Windows and Linux checkouts produce the same screenshot hash', () => {
	const lf = 'window.CODEFORCE = {\n\ttitle: "Meetup 🛠️",\n};\n';
	assert.equal(deckContentHash(Buffer.from(lf)), deckContentHash(Buffer.from(lf.replace(/\n/g, '\r\n'))));
});

test('actual content changes still invalidate screenshots', () => {
	assert.notEqual(deckContentHash('title: "June"\n'), deckContentHash('title: "July"\n'));
});

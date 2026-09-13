import { createHash } from 'node:crypto';

// Git checks this file out with CRLF on Windows and LF on Linux. Those
// line endings do not change the slides and must not invalidate captures.
export function deckContentHash(content) {
	const text = content.toString('utf8').replace(/\r\n/g, '\n');
	return createHash('sha256').update(text, 'utf8').digest('hex');
}

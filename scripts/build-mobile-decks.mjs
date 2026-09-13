// Validate committed screenshots. Regeneration is explicit, not part of deployment.
import { readFile, readdir, access } from 'node:fs/promises';
import { deckContentHash } from './deck-content-hash.mjs';
const root = new URL('../public/decks/', import.meta.url);
// GitHub's branch publisher otherwise drops _mobile/ and _lite/. Keep the
// marker in both the source root and public/ (copied to the Vite build root).
await access(new URL('../.nojekyll', import.meta.url));
await access(new URL('../public/.nojekyll', import.meta.url));
for (const id of await readdir(root)) {
	if (!/^\d{4}-\d{2}$/.test(id)) continue;
	const folder = new URL('_mobile/' + id + '/', root);
	const data = JSON.parse(await readFile(new URL('slides.json', folder), 'utf8'));
	const hash = deckContentHash(await readFile(new URL(id + '/content.js', root)));
	if (hash !== data.contentHash) throw new Error('Mobile screenshots are stale. Run npm run capture-decks.');
	if (!data.slides.length) throw new Error('No mobile slides: ' + id);
	for (const slide of data.slides) await access(new URL(slide.image, folder));
	console.log('Verified mobile images: ' + id);
}

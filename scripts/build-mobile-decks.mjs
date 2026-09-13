// Render archive content at build time. Phones never run the presentation engine.
import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises';
import vm from 'node:vm';

const root = new URL('../public/decks/', import.meta.url);
await mkdir(new URL('_mobile/', root), { recursive: true });
for (const edition of await readdir(root)) {
	if (!/^\d{4}-\d{2}$/.test(edition)) continue;
	const folder = new URL(edition + '/', root);
	let html = '';
	const context = vm.createContext({
		window: {},
		document: { querySelector: (selector) => {
			if (selector !== '#deck') throw new Error('Unexpected render dependency: ' + selector);
			return { set innerHTML(value) { html = value; } };
		} }
	});
	for (const file of ['vendor/qrcode.js', 'content.js']) {
		vm.runInContext(await readFile(new URL(file, folder), 'utf8'), context);
	}
	const source = await readFile(new URL('engine.js', folder), 'utf8');
	const boot = 'if (document.readyState === "loading")';
	if (!source.includes(boot)) throw new Error('Unsupported deck engine: ' + edition);
	vm.runInContext(source.slice(0, source.lastIndexOf(boot)) + 'render();})();', context);
	if (!html.includes('class="slide"')) throw new Error('No slides: ' + edition);
	await writeFile(new URL('_mobile/' + edition + '.html', root), html);
	console.log('Mobile slides: ' + edition);
}

// Capture the real desktop deck once; ship only JPEGs and link coordinates to phones.
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { deckContentHash } from './deck-content-hash.mjs';

const root = path.resolve(fileURLToPath(new URL('../public/', import.meta.url)));
const requestedEdition = process.argv[2];
if (requestedEdition && !/^\d{4}-\d{2}$/.test(requestedEdition)) throw new Error('Use an edition such as 2026-07.');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
const server = createServer(async (req, res) => {
	try {
		const name = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://local').pathname));
		if (!name.startsWith(root + path.sep)) throw new Error('Outside public');
		res.setHeader('Content-Type', types[path.extname(name)] || 'application/octet-stream');
		res.end(await readFile(name));
	} catch { res.writeHead(404); res.end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
let browser;
try {
	browser = await chromium.launch(process.platform === 'win32' ? { channel: 'msedge' } : {});
	const page = await browser.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 });
	for (const id of requestedEdition ? [requestedEdition] : await readdir(path.join(root, 'decks'))) {
		if (!/^\d{4}-\d{2}$/.test(id)) continue;
		const output = path.join(root, 'decks', '_mobile', id);
		await mkdir(output, { recursive: true });
		await page.goto(`${origin}/decks/${id}/index.html?lite=0&theme=aia`, { waitUntil: 'load' });
		await page.locator('.slide.active').waitFor();
		await page.evaluate(() => document.fonts.ready);
		// Live websites cannot become interactive screenshots. Keep their link
		// inside the original styled panel, without loading third-party frames.
		await page.evaluate(() => {
			document.querySelectorAll('iframe[data-src]').forEach(frame => {
				const link = document.createElement('a');
				link.href = frame.dataset.src;
				link.className = 'ph';
				link.innerHTML = '<div>↗<br><b></b><br>Tap to open the interactive website</div>';
				link.querySelector('b').textContent = frame.title || 'Interactive website';
				frame.replaceWith(link);
			});
		});
		await page.addStyleTag({ content: '.hint,.hud__right{visibility:hidden!important} html,.slide{scrollbar-width:none} ::-webkit-scrollbar{display:none} .slide{scroll-behavior:auto!important}' });
		const count = await page.locator('.slide').count();
		const slides = [];
		for (let i = 0; i < count; i++) {
			if (i) await page.keyboard.press('ArrowRight');
			// Finish entrance animations before freezing this state in an image.
			await page.waitForTimeout(i === 0 ? 3500 : 1800);
			await page.evaluate(async () => {
				await Promise.all([...document.querySelectorAll('.slide.active img')].map(img => img.decode().catch(() => {})));
			});
			const data = await page.evaluate(() => {
				const active = document.querySelector('.slide.active');
				const links = [];
				const add = (el, href, label) => {
					if (!/^https?:\/\//.test(href || '')) return;
					const r = el.getBoundingClientRect();
					const style = getComputedStyle(el);
					if (style.visibility === 'hidden' || style.display === 'none' || r.width < 1 || r.height < 1) return;
					const x = Math.max(0, r.left), y = Math.max(0, r.top);
					const right = Math.min(1600, r.right), bottom = Math.min(900, r.bottom);
					if (right <= x || bottom <= y) return;
					links.push({ href, label: (label || href).trim(), x: x / 16, y: y / 9, width: (right - x) / 16, height: (bottom - y) / 9 });
				};
				active.querySelectorAll('a[href]').forEach(el => add(el, el.href, el.textContent));
				active.querySelectorAll('[data-copy]').forEach(el => {
					const row = el.closest('.linkmono') || el;
					add(row, el.dataset.copy, el.dataset.copy);
					const card = row.parentElement;
					const qr = card.querySelector('.qr-card');
					if (qr) add(qr, el.dataset.copy, 'Open ' + el.dataset.copy);
				});
				return { title: active.dataset.title, text: active.innerText, links };
			});
			const image = `slide-${String(i + 1).padStart(2, '0')}.jpg`;
			await page.screenshot({ path: path.join(output, image), type: 'jpeg', quality: 85 });
			slides.push({ ...data, image });
			console.log(`${id}: ${i + 1}/${count} ${data.title} (${data.links.length} links)`);
		}
		const contentHash = deckContentHash(await readFile(path.join(root, 'decks', id, 'content.js')));
		await writeFile(path.join(output, 'slides.json'), JSON.stringify({ width: 1600, height: 900, contentHash, slides }, null, 2));
	}
} finally {
	await browser?.close();
	server.close();
}

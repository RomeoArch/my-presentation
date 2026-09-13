// Mobile gets one compressed slide image and its link map, never a live deck.
export function createMobileDeck(stage) {
	stage.classList.add('is-mobile-reader');
	const shell = document.createElement('div');
	shell.className = 'mobile-deck';
	shell.innerHTML = `<nav class="mobile-deck__controls" aria-label="Slide navigation">
		<button type="button" data-previous aria-label="Previous slide">←</button>
		<span role="status" aria-live="polite"></span>
		<button type="button" data-next aria-label="Next slide">→</button>
		<button type="button" data-expand>Enlarge</button>
		<button type="button" data-zoom hidden>Zoom in</button>
	</nav><div class="mobile-deck__viewport"><div class="mobile-deck__picture"></div></div>
	<p class="mobile-deck__hint">Tap links on the slide. Enlarge to zoom and read.</p>
	<details class="mobile-deck__links"><summary>Links on this slide</summary><ul></ul></details>`;
	const previous = shell.querySelector('[data-previous]');
	const next = shell.querySelector('[data-next]');
	const expand = shell.querySelector('[data-expand]');
	const zoom = shell.querySelector('[data-zoom]');
	const status = shell.querySelector('[role="status"]');
	const viewport = shell.querySelector('.mobile-deck__viewport');
	const picture = shell.querySelector('.mobile-deck__picture');
	const links = shell.querySelector('.mobile-deck__links');
	const hint = shell.querySelector('.mobile-deck__hint');
	const dialog = document.createElement('dialog');
	dialog.className = 'mobile-deck__dialog';
	dialog.setAttribute('aria-label', 'Enlarged presentation');
	document.body.append(dialog);
	stage.replaceChildren(shell);
	let slides = [], index = 0, request = 0, assetBase, zoomed = false, oldOverflow;

	function safeUrl(value) {
		const url = new URL(value, assetBase);
		return ['https:', 'http:'].includes(url.protocol) ? url.href : null;
	}
	function resetZoom() {
		zoomed = false;
		picture.style.width = '';
		zoom.textContent = 'Zoom in';
		viewport.scrollTo(0, 0);
	}
	function render() {
		const slide = slides[index];
		resetZoom();
		status.textContent = `${index + 1} / ${slides.length}`;
		previous.disabled = index === 0;
		next.disabled = index === slides.length - 1;
		const img = document.createElement('img');
		img.alt = `${slide.title}. ${slide.text.replace(/\s+/g, ' ').trim()}`;
		img.width = 1600; img.height = 900;
		img.draggable = false;
		picture.classList.add('is-loading');
		img.addEventListener('load', () => {
			if (picture.firstChild === img) picture.classList.remove('is-loading');
		});
		img.addEventListener('error', () => {
			if (picture.firstChild !== img) return;
			picture.classList.remove('is-loading');
			const retry = document.createElement('button');
			retry.type = 'button'; retry.textContent = 'Image unavailable — retry';
			retry.addEventListener('click', render);
			picture.replaceChildren(retry);
		});
		img.src = new URL(slide.image, assetBase).href;
		picture.replaceChildren(img);
		const list = links.querySelector('ul');
		list.replaceChildren();
		const seen = new Set();
		for (const link of slide.links) {
			const href = safeUrl(link.href);
			if (!href) continue;
			const anchor = document.createElement('a');
			anchor.href = href;
			anchor.target = '_blank';
			anchor.rel = 'noopener noreferrer';
			anchor.setAttribute('aria-label', link.label);
			anchor.title = link.label;
			anchor.className = 'mobile-deck__hotspot';
			Object.assign(anchor.style, { left: link.x + '%', top: link.y + '%', width: link.width + '%', height: link.height + '%' });
			picture.append(anchor);
			if (seen.has(href)) continue;
			seen.add(href);
			const item = document.createElement('li');
			const textLink = anchor.cloneNode();
			textLink.removeAttribute('class'); textLink.removeAttribute('style');
			textLink.textContent = link.label;
			item.append(textLink); list.append(item);
		}
		links.hidden = !seen.size;
		links.open = false;
	}
	previous.addEventListener('click', () => { if (index > 0) { index--; render(); } });
	next.addEventListener('click', () => { if (index < slides.length - 1) { index++; render(); } });
	expand.addEventListener('click', () => {
		if (dialog.open) { dialog.close(); return; }
		oldOverflow = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		dialog.append(shell);
		expand.textContent = 'Close';
		hint.textContent = 'Zoom in, then drag to move around. Rotate your phone for a wider view.';
		zoom.hidden = false;
		dialog.showModal();
	});
	dialog.addEventListener('close', () => {
		stage.append(shell);
		document.body.style.overflow = oldOverflow;
		expand.textContent = 'Enlarge';
		hint.textContent = 'Tap links on the slide. Enlarge to zoom and read.';
		zoom.hidden = true;
		resetZoom();
		expand.focus({ preventScroll: true });
	});
	zoom.addEventListener('click', () => {
		zoomed = !zoomed;
		picture.style.width = zoomed ? Math.max(viewport.clientWidth * 2, 1100) + 'px' : '';
		zoom.textContent = zoomed ? 'Fit slide' : 'Zoom in';
	});
	shell.addEventListener('keydown', event => {
		if (event.key === 'ArrowRight' && !zoomed) { event.preventDefault(); next.click(); }
		if (event.key === 'ArrowLeft' && !zoomed) { event.preventDefault(); previous.click(); }
	});

	return async function load(url) {
		const current = ++request;
		previous.disabled = next.disabled = expand.disabled = true;
		status.textContent = 'Loading…';
		links.hidden = true;
		picture.textContent = 'Loading slides…';
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), 15000);
		try {
			const edition = new URL(url, document.baseURI);
			const id = edition.pathname.split('/').at(-2);
			const base = new URL('../_mobile/' + id + '/', edition);
			const response = await fetch(new URL('slides.json', base), { signal: controller.signal });
			if (!response.ok) throw new Error('Slides unavailable');
			const data = await response.json();
			if (current !== request) return;
			if (!data.slides?.length) throw new Error('No slides');
			assetBase = base; slides = data.slides; index = 0;
			expand.disabled = false;
			render();
		} catch (error) {
			if (current !== request) return;
			status.textContent = 'Unavailable';
			const retry = document.createElement('button');
			retry.type = 'button'; retry.textContent = 'Slides could not load — retry';
			retry.addEventListener('click', () => load(url));
			picture.replaceChildren(retry);
		} finally { clearTimeout(timeout); }
	};
}

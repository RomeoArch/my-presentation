// A document reader, with one slide in the page at a time. No iframe or FX.
export function createMobileDeck(stage) {
	stage.classList.add('is-mobile-reader');
	const content = document.createElement('article');
	content.className = 'mobile-deck__content';
	content.tabIndex = -1;
	const controls = document.createElement('nav');
	controls.className = 'mobile-deck__controls';
	controls.setAttribute('aria-label', 'Slide navigation');
	controls.innerHTML = '<button type="button">← Previous</button><span role="status" aria-live="polite"></span><button type="button">Next →</button>';
	const [previous, next] = controls.querySelectorAll('button');
	const status = controls.querySelector('span');
	stage.replaceChildren(controls, content);
	let slides = [], index = 0, request = 0;

	function render(focus = false) {
		content.replaceChildren(slides[index].cloneNode(true));
		status.textContent = `${index + 1} / ${slides.length}`;
		previous.disabled = index === 0;
		next.disabled = index === slides.length - 1;
		if (focus) {
			content.focus({ preventScroll: true });
			stage.scrollIntoView({ block: 'start', behavior: 'auto' });
		}
	}
	previous.addEventListener('click', () => { if (index > 0) { index--; render(true); } });
	next.addEventListener('click', () => { if (index < slides.length - 1) { index++; render(true); } });

	return async function load(url) {
		const current = ++request;
		previous.disabled = next.disabled = true;
		status.textContent = 'Loading…';
		content.textContent = 'Loading slides…';
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), 15000);
		try {
			const edition = new URL(url, document.baseURI);
			const id = edition.pathname.split('/').at(-2);
			const response = await fetch(new URL('../_mobile/' + id + '.html', edition), { signal: controller.signal });
			if (!response.ok) throw new Error('Slides unavailable');
			const doc = new DOMParser().parseFromString(await response.text(), 'text/html');
			if (current !== request) return;
			slides = Array.from(doc.querySelectorAll('section.slide'));
			if (!slides.length) throw new Error('No slides');
			for (const slide of slides) {
				// Remove presentation-only decoration and controls. All reveal panels
				// become ordinary visible content, so nothing requires a hover or key.
				slide.querySelectorAll('script,style,svg,canvas,[aria-hidden="true"],.qr-card,.copybtn,.ag-rail,.ag-sub,.news-vcr,.news-tc,.countdown,.lp-go,[data-stat-go]').forEach(el => el.remove());
				slide.querySelectorAll('iframe').forEach(frame => {
					const link = doc.createElement('a');
					link.href = frame.getAttribute('data-src') || frame.getAttribute('src') || '';
					link.textContent = 'Visit ' + (frame.title || 'interactive content');
					frame.replaceWith(link);
				});
				slide.querySelectorAll('button').forEach(button => {
					const label = doc.createElement('p');
					label.textContent = button.textContent;
					button.replaceWith(label);
				});
				slide.querySelectorAll('.linkmono__txt').forEach(text => {
					const link = doc.createElement('a');
					link.textContent = text.textContent;
					link.href = 'https://' + text.textContent.replace(/^https?:\/\//, '');
					text.replaceWith(link);
				});
				for (const el of [slide, ...slide.querySelectorAll('*')]) {
					const card = el.matches('.panel,.person,.ag-card,.flip,.seg-pane,.hx-detail,.tof-def-body');
					for (const attr of Array.from(el.attributes)) {
						if (!['href', 'src', 'alt'].includes(attr.name)) el.removeAttribute(attr.name);
					}
					if (card) el.className = 'mobile-deck__card';
					for (const attr of ['href', 'src']) {
						if (!el.hasAttribute(attr)) continue;
						const resolved = new URL(el.getAttribute(attr), edition);
						if (['http:', 'https:'].includes(resolved.protocol)) el.setAttribute(attr, resolved.href);
						else el.removeAttribute(attr);
					}
					if (el.tagName === 'IMG') { el.loading = 'lazy'; el.decoding = 'async'; }
				}
			}
			index = 0;
			render();
		} catch (error) {
			if (current !== request) return;
			status.textContent = 'Unavailable';
			content.textContent = 'The slides could not load. ';
			const retry = document.createElement('button');
			retry.type = 'button'; retry.textContent = 'Try again';
			retry.addEventListener('click', () => load(url));
			content.append(retry);
		} finally { clearTimeout(timeout); }
	};
}

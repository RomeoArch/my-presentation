import { createMobileDeck } from './mobile-deck.js';

(function () {
	"use strict";

	const navbar = document.querySelector(".navbar");
	const burger = document.querySelector("[data-nav-toggle]");
	const dropdowns = Array.from(document.querySelectorAll("[data-dropdown]"));

	function closeMenu() {
		if (!navbar) return;
		navbar.classList.remove("is-open");
		if (burger) burger.setAttribute("aria-expanded", "false");
	}

	function closeAll(except) {
		dropdowns.forEach(function (dropdown) {
			if (dropdown === except) return;
			dropdown.classList.remove("is-open");
			const toggle = dropdown.querySelector(".dropdown__toggle");
			if (toggle) toggle.setAttribute("aria-expanded", "false");
		});
	}

	// Hamburger (mobile) toggle
	if (burger && navbar) {
		burger.addEventListener("click", function (event) {
			event.stopPropagation();
			const willOpen = !navbar.classList.contains("is-open");
			navbar.classList.toggle("is-open", willOpen);
			burger.setAttribute("aria-expanded", String(willOpen));
			if (!willOpen) closeAll(null);
		});
	}

	dropdowns.forEach(function (dropdown) {
		const toggle = dropdown.querySelector(".dropdown__toggle");
		const menu = dropdown.querySelector(".dropdown__menu");
		if (!toggle || !menu) return;

		toggle.addEventListener("click", function (event) {
			event.stopPropagation();
			const willOpen = !dropdown.classList.contains("is-open");
			closeAll(dropdown);
			dropdown.classList.toggle("is-open", willOpen);
			toggle.setAttribute("aria-expanded", String(willOpen));
		});

		// Close after picking an item (also collapse the mobile menu).
		menu.addEventListener("click", function (event) {
			if (event.target.closest(".dropdown__item")) {
				dropdown.classList.remove("is-open");
				toggle.setAttribute("aria-expanded", "false");
				closeMenu();
			}
		});
	});

	// Close when clicking outside the navbar.
	document.addEventListener("click", function (event) {
		if (!event.target.closest(".navbar")) {
			closeAll(null);
			closeMenu();
		}
	});

	// Close on Escape.
	document.addEventListener("keydown", function (event) {
		if (event.key === "Escape") {
			closeAll(null);
			closeMenu();
		}
	});

	// Meetup decks: each archived edition is a standalone offline page under
	// public/decks/<id>/. The deck sizes itself in vh/vw and has its own
	// breakpoints, so it is rendered at a fixed 1600x900 viewport and scaled to
	// fit — otherwise a narrow iframe would trigger the deck's mobile layout.
	const deckStage = document.querySelector("[data-deck-stage]");
	const deckFrame = document.querySelector("[data-deck-frame]");
	const deckOpen = document.querySelector("[data-deck-open]");
	const deckPoster = document.querySelector("[data-deck-poster]");
	const deckPosterLink = document.querySelector("[data-deck-poster-link]");
	const deckTabs = Array.from(document.querySelectorAll("[data-deck]"));

	if (deckStage && deckFrame) {
		const DECK_WIDTH = 1600;
		let mounted = false;
		let readinessTimer;
		let loadDeadline;
		let requestedUrl;

		// Phones do not get the embed. --deck-scale is a paint-time transform:
		// the iframe still renders a full 1600x900 document, and the deck keeps
		// every slide in the DOM at once on top of a dozen canvas/rAF effects,
		// several backdrop-filter layers and a grain overlay. On iOS Safari
		// that blows the per-tab memory budget the moment the section scrolls
		// into view — the renderer is killed and the page reloads itself, which
		// is exactly the "it refreshes when I reach Last Meetup" crash. Scaled
		// to a 360px stage the deck would be unreadable anyway, so small and
		// touch screens get lightweight slide images with clickable link maps.
		const canEmbed = !window.matchMedia("(max-width: 1024px), (pointer: coarse)").matches;
		let loadMobileDeck;

		// Vite supplies BASE_URL in development and production. If a static host
		// accidentally serves the source checkout, resolve public/ relative to
		// this module instead of throwing before the mobile fallback can start.
		function deckUrl(id) {
			const base = import.meta.env?.BASE_URL || new URL(/* @vite-ignore */ "../../public/", import.meta.url).href;
			return base + "decks/" + encodeURIComponent(id) + "/index.html";
		}

		function finishLoading(ready) {
			clearInterval(readinessTimer);
			deckStage.classList.remove("is-loading");
			deckStage.classList.toggle("is-loaded", ready);
			deckStage.classList.toggle("is-poster", !ready);
			deckStage.setAttribute("aria-busy", "false");
			if (deckPoster) deckPoster.hidden = ready;
			if (!ready) {
				mounted = false; // Clicking the selected edition retries the load.
				deckFrame.removeAttribute("src");
				const message = deckPoster && deckPoster.querySelector("p");
				if (message) message.textContent = "The preview could not load. Open the deck directly, or select the month to retry.";
			}
		}

		function checkDeckReady() {
			try {
				const doc = deckFrame.contentDocument;
				// The deck adds #1 (and subsequent slide numbers) during boot.
				if (doc && doc.URL.split("#")[0] === requestedUrl && doc.querySelector(".slide.active")) {
					hideDeckScrollbars();
					finishLoading(true);
					return;
				}
			} catch (error) { /* The deadline also handles inaccessible frames. */ }
			if (Date.now() >= loadDeadline) finishLoading(false);
		}

		function fitDeck() {
			const width = deckStage.clientWidth;
			if (!width) return;
			deckStage.style.setProperty("--deck-scale", String(width / DECK_WIDTH));
		}

		// The decks give every .slide `overflow: auto`, and the rotated cover
		// artwork pushes that scroll area past the viewport at any size, so the
		// embed shows scrollbars the fullscreen deck never has. Same-origin, so
		// hide the scrollbar chrome inside the frame — scrolling still works for
		// the genuinely tall slides.
		function hideDeckScrollbars() {
			let doc;
			try {
				doc = deckFrame.contentDocument;
			} catch (error) {
				return; // cross-origin deck, nothing to do
			}
			if (!doc || !doc.head || doc.getElementById("deck-embed-style")) return;

			const style = doc.createElement("style");
			style.id = "deck-embed-style";
			style.textContent =
				"html,.slide{scrollbar-width:none}" +
				"html::-webkit-scrollbar,.slide::-webkit-scrollbar{display:none}";
			doc.head.appendChild(style);
		}

		deckFrame.addEventListener("load", hideDeckScrollbars);

		// The deck wires its own on-screen arrows to prev()/next() but hides them
		// on the cover slide, and it only answers the keyboard once the iframe
		// has focus. Clicking those buttons from out here steps the slides
		// without asking the visitor to click into the frame first.
		function navDeck(direction) {
			let doc;
			try {
				doc = deckFrame.contentDocument;
			} catch (error) {
				return;
			}
			if (!doc) return;

			const button = doc.getElementById(direction === "prev" ? "nav-prev" : "nav-next");
			if (button) button.click();
		}

		Array.from(document.querySelectorAll("[data-deck-nav]")).forEach(function (button) {
			button.addEventListener("click", function () {
				navDeck(button.getAttribute("data-deck-nav"));
			});
		});

		// Tab state and the two "open it full-screen" links follow the selected
		// edition on every device — only the iframe is desktop-only.
		function selectDeck(tab) {
			const id = tab.getAttribute("data-deck");

			deckTabs.forEach(function (other) {
				const isActive = other === tab;
				other.classList.toggle("is-active", isActive);
				other.setAttribute("aria-pressed", String(isActive));
			});

			const url = deckUrl(id) + (canEmbed ? "" : "?lite=1");
			if (deckOpen) deckOpen.href = url;
			if (deckPosterLink) deckPosterLink.href = url;
		}

		function showDeck(tab) {
			const id = tab.getAttribute("data-deck");
			const label = tab.getAttribute("data-deck-label") || id;

			selectDeck(tab);

			if (!canEmbed) {
				if (loadMobileDeck) loadMobileDeck(deckUrl(id));
				return;
			}

			clearInterval(readinessTimer);
			deckStage.classList.remove("is-loaded", "is-poster");
			deckStage.classList.add("is-loading");
			deckStage.setAttribute("aria-busy", "true");
			if (deckPoster) deckPoster.hidden = true;
			requestedUrl = new URL(deckUrl(id), document.baseURI).href;
			deckFrame.src = requestedUrl;
			deckFrame.title = "Codeforce deck — " + label;
			loadDeadline = Date.now() + 15000;
			readinessTimer = setInterval(checkDeckReady, 200);

			mounted = true;
			fitDeck();
		}

		deckTabs.forEach(function (tab) {
			tab.addEventListener("click", function () {
				if (canEmbed && mounted && tab.classList.contains("is-active")) return;
				showDeck(tab);
			});
		});

		document.querySelectorAll('[data-deck-link]').forEach(function (link) {
			link.addEventListener('click', function () {
				const tab = deckTabs.find(function (item) {
					return item.getAttribute('data-deck') === link.getAttribute('data-deck-link');
				});
				if (tab) tab.click();
			});
		});

		const initial = deckTabs.filter(function (tab) {
			return tab.classList.contains("is-active");
		})[0] || deckTabs[0];

		if (initial) {
			// showDeck() only runs once the section scrolls into view, so point
			// the fullscreen links at the right deck straight away.
			selectDeck(initial);
		}

		if (!canEmbed) {
			// Slide images stay on this page; no presentation engine.
			if (deckOpen) deckOpen.hidden = true;
			loadMobileDeck = createMobileDeck(deckStage);
			if (initial) showDeck(initial);
		} else {
			fitDeck();

			if (window.ResizeObserver) {
				new ResizeObserver(fitDeck).observe(deckStage);
			} else {
				window.addEventListener("resize", fitDeck);
			}

			// The decks run canvas/rAF effects non-stop, so only load one once the
			// section is actually on screen.
			if (initial) {
				if (window.IntersectionObserver) {
					const observer = new IntersectionObserver(function (entries) {
						entries.forEach(function (entry) {
							if (!entry.isIntersecting || mounted) return;
							observer.disconnect();
							showDeck(initial);
						});
					}, { rootMargin: "200px" });

					observer.observe(deckStage);
				} else {
					showDeck(initial);
				}
			}
		}
	}
})();

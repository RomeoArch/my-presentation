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
	const deckTabs = Array.from(document.querySelectorAll("[data-deck]"));

	if (deckStage && deckFrame) {
		const DECK_WIDTH = 1600;
		let mounted = false;

		function deckUrl(id) {
			return "/decks/" + id + "/index.html";
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

		function showDeck(tab) {
			const id = tab.getAttribute("data-deck");
			const label = tab.getAttribute("data-deck-label") || id;

			deckFrame.src = deckUrl(id);
			deckFrame.title = "Codeforce deck — " + label;
			deckStage.classList.add("is-loaded");

			if (deckOpen) deckOpen.href = deckUrl(id);

			deckTabs.forEach(function (other) {
				const isActive = other === tab;
				other.classList.toggle("is-active", isActive);
				other.setAttribute("aria-pressed", String(isActive));
			});

			mounted = true;
			fitDeck();
		}

		deckTabs.forEach(function (tab) {
			tab.addEventListener("click", function () {
				if (mounted && tab.classList.contains("is-active")) return;
				showDeck(tab);
			});
		});

		fitDeck();

		if (window.ResizeObserver) {
			new ResizeObserver(fitDeck).observe(deckStage);
		} else {
			window.addEventListener("resize", fitDeck);
		}

		// The decks run canvas/rAF effects non-stop, so only load one once the
		// section is actually on screen.
		const initial = deckTabs.filter(function (tab) {
			return tab.classList.contains("is-active");
		})[0] || deckTabs[0];

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
})();

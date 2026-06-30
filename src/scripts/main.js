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
})();

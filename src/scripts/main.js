(function () {
	"use strict";

	const dropdowns = Array.from(document.querySelectorAll("[data-dropdown]"));
	if (!dropdowns.length) return;

	function closeAll(except) {
		dropdowns.forEach(function (dropdown) {
			if (dropdown === except) return;
			dropdown.classList.remove("is-open");
			const toggle = dropdown.querySelector(".dropdown__toggle");
			if (toggle) toggle.setAttribute("aria-expanded", "false");
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

		// Close after picking an item.
		menu.addEventListener("click", function (event) {
			if (event.target.closest(".dropdown__item")) {
				dropdown.classList.remove("is-open");
				toggle.setAttribute("aria-expanded", "false");
			}
		});
	});

	// Close when clicking outside any dropdown.
	document.addEventListener("click", function (event) {
		if (!event.target.closest("[data-dropdown]")) {
			closeAll(null);
		}
	});

	// Close on Escape.
	document.addEventListener("keydown", function (event) {
		if (event.key === "Escape") {
			closeAll(null);
		}
	});
})();

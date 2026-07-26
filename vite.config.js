import { defineConfig } from "vite";

// The site is published to GitHub Pages at romeoarch.github.io/my-presentation/,
// so every asset URL has to carry that prefix — the default base of "/" points
// the browser at the domain root, which is outside this project.
//
// `base` also feeds import.meta.env.BASE_URL, which main.js uses to build the
// deck URLs, and it applies in dev too: `npm start` now serves the site at
// http://localhost:5173/my-presentation/ so both environments resolve paths
// the same way.
export default defineConfig({
	base: "/my-presentation/",
});

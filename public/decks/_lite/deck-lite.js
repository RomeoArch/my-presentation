/* =============================================================================
   GenAI-Codeforce decks — LITE MODE (phones & tablets)
   -----------------------------------------------------------------------------
   NOT part of an archived edition. This file is site-owned and injected into
   every published deck by scripts/publish-deck.ps1, so the public/decks/<id>/
   folders stay verbatim copies of what was actually presented.

   Why it exists: the decks are built for a laptop driving a projector. Each one
   keeps every slide in the DOM at once, paints two full-screen blur(64-80px)
   layers that animate forever, blends a grain overlay over the lot, stacks
   backdrop-filter panels on top and then runs 15 fx modules with ~35 rAF loops
   and 3 canvases. Mobile Safari's per-tab memory budget cannot hold that: the
   renderer gets killed and the tab silently reloads itself.

   On a phone this script therefore does two things:
     1. sets html[data-lite], which deck-lite.css uses to drop the expensive
        layers and render only the active slide
     2. claims every fx module's run-once guard, so each module bails at its own
        `if (window.__cfX) return;` line without installing anything

   Load it in <head> (the fx tags are in <body>, so any head position is early
   enough) and link deck-lite.css AFTER styles.css.

   Testing from a desktop: ?lite=1 forces it on, ?lite=0 forces it off.
   ============================================================================= */
(function () {
  "use strict";

  if (typeof document === "undefined" || typeof window === "undefined") return;

  // Same test the site uses to decide it will not embed the deck at all (see
  // src/scripts/main.js). The coarse-pointer half catches tablets and phones
  // that report a wide viewport.
  var QUERY = "(max-width: 1024px), (pointer: coarse)";

  var forced = null;
  try {
    var flag = new URLSearchParams(window.location.search).get("lite");
    if (flag === "1" || flag === "true") forced = true;
    if (flag === "0" || flag === "false") forced = false;
  } catch (error) {
    forced = null; // no URLSearchParams here — fall through to the media query
  }

  var lite = forced !== null
    ? forced
    : !!(window.matchMedia && window.matchMedia(QUERY).matches);

  if (!lite) return;

  // Synchronous <head> script, so this lands before the first paint.
  document.documentElement.setAttribute("data-lite", "");

  // Every fx module opens with `if (window.__cfX) return;` as its "already
  // installed" guard, so claiming the flag first is a supported off switch —
  // no edits inside fx/, no rewriting of the <script> tags.
  //
  // This list has to track fx/. A module added in a future edition whose guard
  // is missing here simply stays on: check a new deck's fx/ folder against it.
  [
    "__cfAmbient",            // fx/ambient.js              token-rain canvas + parallax tilt
    "__cfEntranceFx",         // fx/entrance.js             boot-up takeover + vanish glitch
    "__cfHudFx",              // fx/hud.js                  news ticker + 72h clock
    "__cfInteractive",        // fx/interactive.js          emoji burst + rave mode
    "__cfPersonality",        // fx/personality.js          hype meter + AI orb
    "__cfIntroConstellation", // fx/intro-constellation.js  neural canvas backdrop
    "__cfIntroCounter",       // fx/intro-counter.js        live counter + sparkline
    "__cfIntroCrt",           // fx/intro-crt.js            retro CRT toggle
    "__cfIntroDecrypt",       // fx/intro-decrypt.js        scramble headline reveal
    "__cfIntroEq",            // fx/intro-eq.js             synthwave equalizer
    "__cfIntroFlip",          // fx/intro-flip.js           flip-card facts
    "__cfIntroRoulette",      // fx/intro-roulette.js       goal-chip roulette
    "__cfIntroStamp",         // fx/intro-stamp.js          rubber stamp + confetti
    "__cfIntroTagline",       // fx/intro-tagline.js        rotating tagline
    "__cfIntroTilt"           // fx/intro-tilt.js           3D tilt + cursor spotlight
  ].forEach(function (guard) {
    window[guard] = true;
  });
})();

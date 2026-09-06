/* =============================================================================
   GenAI-Codeforce — deck engine (vanilla JS, no build step)
   Builds every slide from window.CODEFORCE, then runs the presentation.

   Controls:
     →  Space  ·  next (steps through reveals first)
     ←         ·  back
     Home/End  ·  first / last
     T         ·  cycle theme (Neon → Synth → Plasma → Volt)
     F         ·  fullscreen
     K  or  /  ·  command palette (jump to any slide)
     Esc       ·  close palette / lightbox
   ============================================================================= */
(function () {
  "use strict";
  const C = window.CODEFORCE;
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, m =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
  // Inline emphasis for headline strings: wrap words in **double asterisks**
  // to render them as an animated highlight (e.g. the cover motto).
  const hot = (s) => esc(s).replace(/\*\*([^*]+)\*\*/g, '<span class="hot">$1</span>');

  /* ---- QR generation (offline, via vendor/qrcode.js) -------------------- */
  function qrURL(text, cell = 6, margin = 2, ec = "M") {
    for (let t = 0; t <= 16; t++) {
      try { const qr = qrcode(t, ec); qr.addData(String(text)); qr.make(); return qr.createDataURL(cell, margin); }
      catch (e) { /* try a bigger symbol */ }
    }
    return "";
  }
  // opts.img  -> use a ready-made QR image instead of generating one.
  // opts.logo -> badge image shown at the QR's bottom-right corner (off the
  //              matrix; see styles.css). Generated codes still use "H" error
  //              correction for extra robustness.
  const qrCard = (text, size = 132, cell = 5, opts = {}) => {
    const src = opts.img ? esc(opts.img) : qrURL(text, cell, 2, opts.logo ? "H" : "M");
    const cls = "qr-card" + (opts.logo ? " qr-card--logo" : "") + (opts.img ? " qr-card--img" : "");
    const logo = opts.logo
      ? `<img class="qr-logo" src="${esc(opts.logo)}" alt="" aria-hidden="true">` : "";
    return `<div class="${cls}">`
      + `<img class="qr" width="${size}" height="${size}" alt="QR code" src="${src}">${logo}</div>`;
  };

  /* ---- Link line with a one-click copy button --------------------------
     Shows the URL in monospace (protocol stripped, just for looks) and a copy
     icon beside it. Clicking copies the FULL url so it pastes straight into a
     chat. Behaviour is wired in initCopy(). */
  const COPY_ICON = '<svg class="copybtn__i copybtn__i--copy" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2"></rect><path d="M5 15V5a2 2 0 0 1 2-2h10"></path></svg>';
  const CHECK_ICON = '<svg class="copybtn__i copybtn__i--ok" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12.5l5 5 11-12"></path></svg>';
  const linkmono = (url, extra = "") => {
    if (!url) return "";
    const shown = esc(String(url).replace(/^https?:\/\//, ""));
    return `<div class="linkmono${extra ? " " + extra : ""}">`
      + `<span class="linkmono__txt">${shown}</span>`
      + `<button class="copybtn" type="button" data-copy="${esc(url)}" title="Copy link" aria-label="Copy link">${COPY_ICON}${CHECK_ICON}</button>`
      + `</div>`;
  };

  /* ---- Presenter card (LinkedIn QR + badge) ----------------------------
     Shared by the "Show a demo?" slide and the closing "Reach the team"
     panel so both render the exact same QR cards. `size` tunes the QR for
     the tighter half-width panel on the closing slide. */
  const personCard = (p, size = 132) =>
    `<div class="person fragment">
        ${qrCard(p.linkedin, size, 5, { logo: "assets/brand/linkedin.svg", img: p.qr })}
        <div class="role">${esc(p.role || "")}</div>
        <b>${esc(p.name)}</b>
        ${p.title ? `<span class="cred">${esc(p.title)}</span>` : ""}
        ${p.phone ? `<small>${esc(p.phone)}</small>` : ""}
        ${linkmono(p.linkedin)}
      </div>`;

  /* ---- Slide builders --------------------------------------------------- */
  const slide = (id, title, inner) =>
    `<section class="slide" data-id="${id}" data-title="${esc(title)}"><div class="slide__inner">${inner}</div></section>`;

  function eyememe() {
    const m = C.coverMeme; if (!m) return "";
    let fig;
    if (m.image) {
      fig = `<figure class="eyememe eyememe--img">
        <img src="${esc(m.image)}" alt="${esc(m.alt || m.footer || "Keep up with AI news meme")}">
        ${m.credit ? `<span class="eyememe__credit">${esc(m.credit)}</span>` : ""}
      </figure>`;
    } else {
      const rows = m.rows.map((r, i) =>
        `<div class="band lvl${i + 1}"><span class="eyes">${esc(r.eyes || "👀")}</span><span class="lbl">${esc(r.label)}</span></div>`).join("");
      const skull = m.skull ? `<div class="band skull"><span class="eyes">💀</span></div>` : "";
      fig = `<figure class="eyememe">
        ${m.credit ? `<span class="eyememe__credit">${esc(m.credit)}</span>` : ""}
        <div class="eyememe__rows">${rows}${skull}</div>
        <div class="eyememe__footer">${esc(m.footer || "KEEP UP WITH AI NEWS")}</div>
      </figure>`;
    }
    // The link sits OUTSIDE .eyememe on purpose: that figure is rotated, and
    // rotated text renders soft. Kept out of the transform, it stays crisp.
    // Renders only with a real `url` — same rule as the meme cards.
    if (!m.url) return fig;
    return `<div class="eyememe-wrap">${fig}` +
      `<a class="eyememe__see" href="${esc(m.url)}" target="_blank" rel="noopener noreferrer nofollow">` +
      `See the meme <span aria-hidden="true">↗</span></a></div>`;
  }

  function buildCover() {
    return slide("cover", "Cover", `
      <div class="cover">
        <div class="cover__main">
          <div class="cover__logo"><img src="assets/brand/logo.png" alt="GenAI-Codeforce"></div>
          <span class="kicker">Virtual Meetup · ${esc(C.meta.edition)}</span>
          <h1>GenAI-<span class="grad">Codeforce</span></h1>
          <p class="lead motto">${hot(C.meta.motto)}</p>
          <div class="row mt2">
            <span class="chip">📅 ${esc(C.next.dateLabel)} · ${esc(C.next.time)}</span>
            <span class="chip chip--accent">🎙️ Live & community-driven</span>
          </div>
          <div class="partner">Part of the <span class="aia-plate aia-plate--lg"><img src="assets/brand/ai-austria.png" alt="AI Austria"></span> community</div>
        </div>
        <div class="cover__meme">${eyememe()}</div>
      </div>`);
  }

  function buildMemes() {
    const tiles = C.memes.map(m => {
      if (m.type === "link")
        return `<figure class="meme meme--link panel">
            <div><div class="muted" style="font-size:.8rem;letter-spacing:.2em;text-transform:uppercase">${esc(m.caption || "Meme drop")}</div>
            <div class="lbl mt">${esc(m.label || m.url)}</div>${qrCard(m.url, 110, 4)}${linkmono(m.url)}</div></figure>`;
      // No `src` → a "described" card: our own words about the joke, plus a link
      // out to the original. Linking is not reproduction, so it needs no licence
      // — that's the whole point of pointing at the image instead of shipping a
      // copy of it. See CREDITS.md.
      // The link renders ONLY with a real per-meme `url`: a "See the meme" that
      // lands on a site's homepage promises the specific image and doesn't
      // deliver, which is worse than no link at all. No url → no button.
      if (!m.src) {
        const seeUrl = m.url || "";
        return `<figure class="meme meme--told panel">
            <div class="meme__format">${esc(m.format || "Meme")}</div>
            <blockquote class="meme__punchline">${esc(m.caption || "")}</blockquote>
            ${m.explain ? `<figcaption class="meme__explain">${esc(m.explain)}</figcaption>` : ""}
            ${seeUrl ? `<a class="meme__see" href="${esc(seeUrl)}" target="_blank" rel="noopener noreferrer nofollow">See the meme <span aria-hidden="true">↗</span></a>` : ""}</figure>`;
      }
      return `<figure class="meme" data-full="${esc(m.src)}" data-caption="${esc(m.caption || "")}" data-explain="${esc(m.explain || "")}">
          <img src="${esc(m.src)}" alt="meme" loading="lazy">
          ${m.caption ? `<figcaption>${esc(m.caption)}</figcaption>` : ""}</figure>`;
    }).join("");
    return slide("memes", "Memes", `
      <span class="kicker">What's so funny</span>
      <h2>This month in <span class="grad">AI memes</span></h2>
      <div class="memes mt2">${tiles}</div>`);
  }

  function buildFunSites() {
    if (!C.funSites || !C.funSites.length) return "";
    return C.funSites.map((f, i) => {
      const fsBtn = f.embed ? `<button class="embed-fs" type="button" title="Fullscreen the site" aria-label="Fullscreen the site">⛶ Fullscreen</button>` : "";
      const embed = f.embed
        ? `<iframe data-src="${esc(f.embed)}" title="${esc(f.name)}" allow="clipboard-write; fullscreen; autoplay"></iframe>`
        : `<div class="ph"><div>🌐<br><b>Embed slot</b><br><span class="muted">Set funSites[${i}].embed in content.js to show the live site here. The QR always works.</span></div></div>`;
      return slide("funsite" + (i + 1), f.name || "Fun site", `
        <span class="kicker">Fun AI site of the month</span>
        <h2>${esc(f.name)} <span class="grad">${esc(f.emoji || "🌐")}</span></h2>
        ${f.blurb ? `<p class="muted">${esc(f.blurb)}</p>` : ""}
        <div class="slido mt2">
          <div class="slido__embed">${embed}${fsBtn}</div>
          <div class="slido__side panel">
            <div class="muted" style="letter-spacing:.2em;text-transform:uppercase;font-size:.78rem">Scan to open</div>
            ${qrCard(f.url, 168, 6)}
            ${linkmono(f.url)}
          </div>
        </div>`);
    }).join("");
  }

  function buildDemoCall() {
    const people = C.presenters.filter(p => !p.hideOnDemoCall).map(p => personCard(p)).join("");
    return slide("demo-call", "Show a demo?", `
      <span class="kicker">Ideas? Let's make 'em work</span>
      <h2>Want to show a <span class="grad">demo</span>? Hit us up 👋</h2>
      <p>Scan a code to connect on LinkedIn — or grab us in Discord. Anyone can present.</p>
      <div class="people mt2">${people}</div>`);
  }

  function buildIntro() {
    const facts = C.events.facts.map(f => `<li class="fragment">${esc(f)}</li>`).join("");
    const goals = C.events.goals.map(g => `<span class="chip fragment">${esc(g)}</span>`).join("");
    return slide("intro", "What is it", `
      <span class="kicker">GenAI-Codeforce — Introduction</span>
      <h2>A monthly jam for <span class="grad">Generative AI</span></h2>
      <div class="grid-2 mt2">
        <div class="panel"><h3 class="muted" style="margin-bottom:.8rem">The format</h3><ul class="list">${facts}</ul></div>
        <div class="panel"><h3 class="muted" style="margin-bottom:.8rem">What we're here for</h3>
          <div class="row">${goals}</div>
          <p class="lead mt2" style="color:var(--text)">${esc(C.events.goalLine)}</p></div>
      </div>`);
  }

  // Merged "Community & Discord" slide: the AI Austria meetup on the left, the
  // Discord card on the right. (Replaces the old separate events + discord
  // slides; the podcast was dropped.)
  //
  // meetup.com refuses to be framed (X-Frame-Options), so by default the meetup
  // side is a self-contained PREVIEW CARD (always works, offline). If a
  // *frameable* `embed` URL is given in content.js it switches to a live iframe.
  function buildCommunity() {
    const ev = C.events.other || [];
    const meetup = ev.find(e => /meetup|ai austria/i.test(e.name || "")) || ev[0] || {};
    const meetupUrl = meetup.url || C.links.meetup || "";
    const channels = C.discordChannels.map(c => `<span class="dchip">${esc(c)}</span>`).join("");

    // Body: live iframe only when an explicit (frameable) embed URL is set;
    // otherwise the branded preview "stage" with a radar pin + CTA.
    const stage = meetup.embed
      ? `<div class="cmt__embed">
           <iframe data-src="${esc(meetup.embed)}" title="${esc(meetup.name || "Meetup")}" allow="clipboard-write; fullscreen" loading="lazy"></iframe>
           <button class="embed-fs" type="button" title="Fullscreen the page" aria-label="Fullscreen the page">⛶ Fullscreen</button>
         </div>`
      : `<div class="meetup-stage">
           <div class="meetup-pin"><span class="meetup-pin__dot">📍</span></div>
           <span class="meetup-badge">Keynotes · IRL</span>
           ${meetup.note ? `<p class="meetup-note">${esc(meetup.note)}</p>` : ""}
           <a class="meetup-cta" href="${esc(meetupUrl)}" target="_blank" rel="noopener">View on Meetup <span aria-hidden="true">⟶</span></a>
         </div>`;

    return slide("community", "Community & Discord", `
      <span class="kicker">Coming together to impact the world</span>
      <h2>Beyond the <span class="grad">GenAI-Codeforce</span></h2>
      <div class="community mt2">

        <section class="cmt cmt--meetup">
          <header class="cmt__head">
            <span class="aia-plate"><img src="assets/brand/ai-austria.png" alt="AI Austria"></span>
            <div class="cmt__id">
              <h3>${esc(meetup.name || "AI Austria Meetup")}</h3>
              ${meetup.cadence ? `<span class="cmt__sub">${esc(meetup.cadence)}</span>` : ""}
            </div>
            <span class="cmt__live${meetup.embed ? "" : " cmt__live--irl"}"><i></i>${meetup.embed ? "live page" : "in&nbsp;person"}</span>
          </header>
          ${stage}
          <footer class="cmt__foot">
            ${qrCard(meetupUrl, 84, 4)}
            <div>
              <div class="cmt__scan">Scan to open</div>
              ${linkmono(meetupUrl)}
            </div>
          </footer>
        </section>

        <section class="cmt cmt--discord">
          <header class="cmt__head">
            <span class="dlogo">🎮</span>
            <div class="cmt__id">
              <h3>Discord</h3>
              <span class="cmt__sub">never sleeps</span>
            </div>
          </header>
          <div class="dqr">
            ${qrCard(C.links.discord, 156, 5)}
            ${linkmono(C.links.discord)}
          </div>
          <div class="dchips">${channels}</div>
        </section>

      </div>`);
  }

  // Combined "showpiece" agenda — fuses the best of the 10 concepts: a metro
  // rail with a travelling pulse, boarding-pass split-flap titles,
  // a typed terminal subline, vinyl now-playing equalizer, rocket burst on
  // activate, arcade ★★★, holographic foil + 3D tilt cards, speedrun clock.
  // Reveal animations are CSS-gated on .slide.active; the live bits are wired in
  // initAgenda(). Per-item code/vibe/burst can be overridden in content.js.
  function buildAgenda() {
    const codes = ["POLL", "NEWS", "TOOL"], bursts = ["VOTE!", "BOOM!", "NICE!"],
          vibes = ["🎤 the mic is yours", "🍿 grab the popcorn", "🤖 robots, live"];
    const cards = C.agenda.map((a, i) => {
      const chars = [...esc(a.title)].map((ch, j) =>
        `<span style="animation-delay:${(0.9 + i * 0.18 + j * 0.03).toFixed(2)}s">${ch === " " ? "&nbsp;" : ch}</span>`).join("");
      return `
        <article class="ag-card" data-i="${i}">
          <span class="ag-foil"></span><span class="ag-wave"></span>
          <span class="ag-burst">${esc(a.burst || bursts[i] || "GO!")}</span>
          <div class="ag-top">
            <span class="ag-code">[ 0${i + 1} · ${esc(a.code || codes[i] || "ITEM")} ]</span>
            <span class="ag-status">
              <span class="ag-eq"><i></i><i></i><i></i><i></i></span>
              <span class="ag-now">NOW</span><span class="ag-q">QUEUED</span>
            </span>
          </div>
          <h3 class="ag-flap">${chars}</h3>
          <p class="ag-note">${esc(a.note || "")}</p>
          <div class="ag-bottom"><span class="ag-vibe">${esc(a.vibe || vibes[i] || "")}</span><span class="ag-stars">★ ★ ★</span></div>
        </article>`;
    }).join("");
    return slide("agenda", "Agenda", `
      <div class="agx">
        <div class="ag-head">
          <div>
            <span class="kicker">Tonight's running order</span>
            <h2 class="ag-glitch" data-text="The agenda">The <span class="grad">agenda</span></h2>
          </div>
          <span class="ag-clock"><span class="ag-rec"></span><span class="ag-clock-t">--:--:--</span></span>
        </div>
        <div class="ag-sub"></div>
        <div class="ag-board">
          <div class="ag-scan"></div>
          <div class="ag-railwrap">
            <div class="ag-rail"><span class="ag-fill"></span><span class="ag-pulse"></span></div>
          </div>
          <div class="ag-cards">${cards}</div>
        </div>
      </div>`);
  }

  /* ---- Agenda showpiece: rail layout, sequential reveal, tilt, clock -----
     No per-slide lifecycle exists in the engine, so we watch the agenda
     slide's .active class (MutationObserver) to start/replay on entry and
     stop timers on exit. Item navigation is click + auto-step only — arrow
     keys/Space stay owned by the deck's slide navigation. */
  function initAgenda() {
    const slideEl = $('.slide[data-id="agenda"]'); if (!slideEl) return;
    const railwrap = $(".ag-railwrap", slideEl), rail = $(".ag-rail", slideEl);
    const fill = $(".ag-fill", slideEl);
    const subEl = $(".ag-sub", slideEl), clockEl = $(".ag-clock-t", slideEl);
    const cards = [...slideEl.querySelectorAll(".ag-card")];
    const nodes = cards.map(() => { const n = document.createElement("span"); n.className = "ag-node"; railwrap.appendChild(n); return n; });
    let centers = [], rs = 0, re = 1, active = -1, seq = [], typeT = null, clockT = null;

    function layout() {
      const wl = railwrap.offsetLeft;
      centers = cards.map(c => c.offsetLeft + c.offsetWidth / 2 - wl);
      nodes.forEach((n, i) => { n.style.left = centers[i] + "px"; });
      rs = centers[0]; re = centers[centers.length - 1];
      rail.style.left = rs + "px"; rail.style.width = (re - rs) + "px";
      place();
    }
    function place() {
      const x = centers[active] != null ? centers[active] : rs, span = (re - rs) || 1;
      fill.style.width = active < 0 ? "0%" : ((x - rs) / span * 100) + "%";
      nodes.forEach((n, i) => n.classList.toggle("on", active >= 0 && i <= active));
    }
    function sparks(card) {
      for (let s = 0; s < 12; s++) {
        const sp = document.createElement("span"); sp.className = "ag-spark";
        const a = Math.random() * 6.283, d = 36 + Math.random() * 80;
        sp.style.setProperty("--dx", Math.cos(a) * d + "px");
        sp.style.setProperty("--dy", Math.sin(a) * d + "px");
        sp.addEventListener("animationend", () => sp.remove());
        card.appendChild(sp);
      }
    }
    function setActive(i, fire) {
      active = (i + cards.length) % cards.length;
      cards.forEach((c, k) => {
        const on = k === active; c.classList.toggle("on", on);
        if (on && fire) { c.classList.remove("fire"); void c.offsetWidth; c.classList.add("fire"); sparks(c); }
      });
      place();
    }
    function typeSub() {
      clearTimeout(typeT);
      const cmd = "$ ./run-tonight.sh --agenda", full = cmd + " — " + cards.length + " stops queued";
      let n = 0;
      (function t() {
        n++;
        subEl.innerHTML = `<b>${full.slice(0, Math.min(n, cmd.length))}</b>${n > cmd.length ? full.slice(cmd.length, n) : ""}<span class="ag-cur"></span>`;
        if (n < full.length) typeT = setTimeout(t, 34);
      })();
    }
    function clearSeq() { seq.forEach(clearTimeout); seq = []; }
    function reveal() {
      clearSeq(); active = -1;
      cards.forEach(c => c.classList.remove("on", "fire")); place();
      typeSub();
      cards.forEach((_, i) => seq.push(setTimeout(() => setActive(i, true), 950 + i * 1100)));
    }
    function startClock() {
      stopClock();
      const u = () => { const d = new Date(); clockEl.textContent = [d.getHours(), d.getMinutes(), d.getSeconds()].map(v => String(v).padStart(2, "0")).join(":"); };
      u(); clockT = setInterval(u, 1000);
    }
    function stopClock() { if (clockT) { clearInterval(clockT); clockT = null; } }

    cards.forEach(c => {
      c.addEventListener("mousemove", e => {
        const r = c.getBoundingClientRect();
        c.style.setProperty("--ry", ((e.clientX - r.left) / r.width - .5) * 9 + "deg");
        c.style.setProperty("--rx", (-((e.clientY - r.top) / r.height - .5) * 9) + "deg");
      });
      c.addEventListener("mouseleave", () => { c.style.setProperty("--rx", "0deg"); c.style.setProperty("--ry", "0deg"); });
      c.addEventListener("click", () => { clearSeq(); setActive(+c.dataset.i, true); });
    });

    const sync = () => {
      if (slideEl.classList.contains("active")) { layout(); reveal(); startClock(); }
      else { clearSeq(); clearTimeout(typeT); stopClock(); }
    };
    new MutationObserver(sync).observe(slideEl, { attributes: true, attributeFilter: ["class"] });
    window.addEventListener("resize", () => { if (slideEl.classList.contains("active")) layout(); });
    layout();
    if (slideEl.classList.contains("active")) { reveal(); startClock(); }
  }

  // Single live slide. The wall (wall.sli.do) auto-follows whichever poll is
  // ACTIVE in Slido, so we only need ONE page here — switch questions from your
  // Slido controls (phone / Present mode) and the embed updates itself live.
  function buildSlidoLive() {
    const src = C.slido.embedBase || "";
    const embed = src
      ? `<iframe data-src="${esc(src)}" title="Slido live" allow="clipboard-write; fullscreen"></iframe>`
      : `<div class="ph"><div>📊<br><b>Slido embed slot</b><br><span class="muted">Add an embed URL in content.js → slido.embedBase to show live results here. The QR on the right always works.</span></div></div>`;
    return slide("slido-live", "Slido — pulse", `
      <span class="kicker">We question, you answer · live</span>
      <h2 style="font-size:clamp(1.6rem,3.4vw,2.6rem)">Community <span class="grad">pulse</span></h2>
      <p class="muted">Scan, vote, watch the results update live.</p>
      <div class="slido mt2">
        <div class="slido__embed">${embed}</div>
        <div class="slido__side panel">
          <div class="muted" style="letter-spacing:.2em;text-transform:uppercase;font-size:.78rem">Scan to vote</div>
          ${qrCard(C.slido.joinUrl, 168, 6)}
          ${C.slido.joinCode ? `<div class="joincode" style="font-size:1.6rem">${esc(C.slido.joinCode)}</div>` : ""}
          ${linkmono(C.slido.joinUrl)}
        </div>
      </div>`);
  }

  // RETROSPECTIVE slide: the numbered cards are the news from LAST time's
  // codeforce (a look-back), not this month's upcoming stories. Styled like
  // rewinding the tape — decorative VHS layers (scanlines, viewfinder frame,
  // ghost number, timecode) are aria-hidden; motion is CSS-gated on .active.
  function buildNews() {
    const cards = (C.news.lastTime || []).map((s, i) => `
      <article class="news-card panel" style="--i:${i}">
        <span class="news-scan" aria-hidden="true"></span>
        <span class="news-frame" aria-hidden="true"></span>
        <span class="news-no" aria-hidden="true">${String(i + 1).padStart(2, "0")}</span>
        <div class="news-card__top">
          <span class="chip chip--accent tag">${esc(s.tag || "News")}</span>
          <span class="news-tc">REC 00:0${i + 1}</span>
        </div>
        <h3>${esc(s.title)}</h3>
        <p>${esc(s.blurb || "")}</p>
        ${s.url ? `<div class="nc-qr">${qrCard(s.url, 96, 4)}${linkmono(s.url)}</div>` : ""}
      </article>`).join("");
    return slide("news", "Last time", `
      <div class="news-vhs" aria-hidden="true"><span class="news-track"></span></div>
      <div class="news-head">
        <div>
          <span class="kicker">Previously on the GenAI-Codeforce</span>
          <h2 class="news-glitch" data-text="Last time's news">Last time's <span class="grad">news</span></h2>
        </div>
        <span class="news-vcr"><span class="news-rec"></span>Rewind<b>◀◀</b></span>
      </div>
      <div class="news-scrub" aria-hidden="true"><span class="news-scrub__fill"></span><span class="news-scrub__head"></span></div>
      <div class="news">${cards}</div>`);
  }

  // RETROSPECTIVE slide for last time's TOOL of the Month (sibling of buildNews):
  // a look-back at the previous codeforce's live tool demo. Renders as a platform
  // stack built from the ground up — `layers` are given foundation-first and
  // shown bottom→top via CSS, so the build-up reads from hardware up to tenants.
  function buildToolRecap() {
    const r = C.toolRecap; if (!r || !(r.layers && r.layers.length)) return "";
    const layers = r.layers.map((l, i) => `
      <article class="trecap-layer" style="--i:${i}">
        <span class="trecap-lvl">Layer ${i + 1}</span>
        <span class="trecap-ic">${esc(l.icon || "🔧")}</span>
        <div class="trecap-txt">
          <h3>${esc(l.head)}</h3>
          ${l.body ? `<p>${esc(l.body)}</p>` : ""}
        </div>
      </article>`).join("");
    const reg = r.url ? `<div class="nc-qr trecap-qr">${qrCard(r.url, 96, 4)}${linkmono(r.url)}</div>` : "";
    return slide("tool-recap", "Last time's tool", `
      <div class="news-head">
        <div>
          <span class="kicker">${esc(r.kicker || "Previously on the GenAI-Codeforce · Tool of the Month")}</span>
          <div class="dd-head">
            <h2>${hot(r.title)} <span class="grad">🏗️</span></h2>
            ${r.tag ? `<span class="chip chip--accent dd-tag">${esc(r.tag)}</span>` : ""}
          </div>
        </div>
        <span class="news-vcr"><span class="news-rec"></span>Rewind<b>◀◀</b></span>
      </div>
      ${r.blurb ? `<p class="lead mt trecap-lead">${esc(r.blurb)}${r.who ? ` <span class="trecap-who">🎙️ <i>${esc(r.who)}</i></span>` : ""}</p>` : ""}
      <div class="trecap-stack">${layers}</div>
      ${reg}`);
  }

  function buildTool() {
    const t = C.tool;
    // Rich "triple feature" layout when a line-up is provided; otherwise the
    // simple single-tool card (name + blurb + QR).
    if (t.features && t.features.length) {
      const feats = t.features.map((f, i) => `
        <article class="tof-feat panel fragment">
          <span class="tof-feat__no">0${i + 1}</span>
          <div class="tof-feat__ic">${esc(f.icon || "🛠️")}</div>
          ${f.topic ? `<div class="tof-feat__topic">${esc(f.topic)}</div>` : ""}
          <h3>${esc(f.head)}</h3>
          ${f.who ? `<div class="tof-feat__who"><span class="tof-feat__dot"></span>${esc(f.who)}</div>` : ""}
        </article>`).join("");

      const defs = t.defenses || [];
      const playbook = defs.length ? `
        <div class="tof-play mt" data-def-group>
          <div class="tof-play__lbl">🏆 The winning agent's playbook <span class="muted">— click a pillar</span></div>
          <div class="tof-defs">${defs.map((d, i) => `
            <button class="tof-def${i === 0 ? " on" : ""}" data-def="${i}" type="button">
              <span class="tof-def__ic">${esc(d.icon || "🔒")}</span>
              <span class="tof-def__name">${esc(d.name)}</span>
            </button>`).join("")}</div>
          <div class="tof-def-wrap">${defs.map((d, i) => `
            <p class="tof-def-body${i === 0 ? " on" : ""}" data-defb="${i}">${esc(d.body)}</p>`).join("")}</div>
        </div>` : "";

      const reg = t.url ? `
        <aside class="tof-reg panel">
          <div class="muted" style="letter-spacing:.18em;text-transform:uppercase;font-size:.72rem">Scan to join · free</div>
          ${qrCard(t.url, 132, 5)}
          ${linkmono(t.url)}
        </aside>` : "";

      return slide("tool", "Tool of the Month", `
        <span class="kicker">${esc(t.kicker || "Tool of the Month")}</span>
        <div class="dd-head">
          <h2>${esc(t.title)} <span class="grad">🛡️</span></h2>
          ${t.tag ? `<span class="chip chip--accent dd-tag">${esc(t.tag)}</span>` : ""}
        </div>
        ${t.blurb ? `<p class="lead mt" style="color:var(--text)">${esc(t.blurb)}</p>` : ""}
        <div class="tof-grid mt">
          <div class="tof-feats">${feats}</div>
          ${reg}
        </div>
        ${playbook}`);
    }
    // — simple single-tool fallback —
    return slide("tool", "Tool of the Month", `
      <div data-stagger>
        <span class="kicker">Tool of the Month</span>
        <h2><span class="grad">${esc(t.name)}</span></h2>
        <p class="lead mt" style="color:var(--text)">${esc(t.blurb)}</p>
        ${t.url ? `<div class="bigqr mt2">${qrCard(t.url, 130, 5)}${linkmono(t.url)}</div>` : ""}
      </div>`);
  }

  function buildDemo() {
    return slide("live-demo", "Live Demo", `
      <div data-stagger class="center" style="margin:0 auto">
        <span class="kicker" style="justify-content:center">Open Exchange</span>
        <h1>${esc(C.demo.title)} <span class="grad">🚀</span></h1>
        <p class="lead mt" style="margin:0 auto;color:var(--text)">${esc(C.demo.blurb)}</p>
        <div class="row mt2" style="justify-content:center"><span class="chip">Presenter: ${esc(C.demo.presenter)}</span></div>
        <p class="muted mt2">Hand over the screen — back to the deck when you're done (press ←).</p>
      </div>`);
  }

  function buildOutro() {
    // Same LinkedIn QR cards as the "Show a demo?" slide — the whole team here
    // (hideOnDemoCall people are still listed on the closing slide).
    const people = C.presenters.map(p => personCard(p, 96)).join("");
    return slide("next", "Next time", `
      <span class="kicker">Mark the slot <span class="kicker-ico">📌</span></span>
      <h2>See you at the <span class="grad">next GenAI-Codeforce</span></h2>
      <div class="outro-top mt">
        <div class="outro-when">
          <div class="countdown" id="countdown"></div>
          <div class="whenrow">
            <span class="chip">📅 ${esc(C.next.dateLabel)}</span>
            <span class="chip">🕔 ${esc(C.next.time)}</span>
            <span class="chip">📍 ${esc(C.next.where)}</span>
          </div>
        </div>
        <div class="panel outro-loop">
          <h3 class="muted">Stay in the loop</h3>
          <div class="row" style="align-items:center;gap:1.1rem;flex-wrap:nowrap">
            ${qrCard(C.links.discord, 92, 4)}
            <div><div class="muted">Discord</div>${linkmono(C.links.discord)}
            <div class="muted mt">Meetup</div>${linkmono(C.links.meetup)}</div>
          </div>
        </div>
      </div>
      <div class="panel outro-team mt">
        <div class="outro-team__head">
          <h3 class="muted">Reach the team</h3>
          <span class="partner" style="margin:0">Part of <b style="color:var(--text)">AI Austria</b>
            <span class="aia-plate"><img src="assets/brand/ai-austria.png" alt="AI Austria"></span></span>
        </div>
        <div class="people people--row">${people}</div>
      </div>
      ${C.meta.signoff ? `<p class="signoff mt">${hot(C.meta.signoff)}</p>` : ""}`);
  }

  /* ---- Deep dive 1: Mistral × Emmi (click-through timeline + toggle) ----- */
  function buildEmmi() {
    const e = C.spotlight.emmi;
    const nodes = e.timeline.map((t, i) => `
      <button class="tl-node${i === 0 ? " on" : ""}" data-tl="${i}" type="button">
        <span class="tl-dot"></span>
        <span class="tl-year">${esc(t.year)}</span>
        <span class="tl-head">${esc(t.head)}</span>
      </button>`).join("");
    const details = e.timeline.map((t, i) => `
      <p class="tl-detail${i === 0 ? " on" : ""}" data-tld="${i}">${esc(t.body)}</p>`).join("");
    const uses = e.uses.map(u => `<span class="chip">${esc(u)}</span>`).join("");
    return slide("emmi", "Mistral × Emmi", `
      <span class="kicker">${esc(e.kicker)}</span>
      <div class="dd-head">
        <h2>${esc(e.title)} <span class="grad">🤝</span></h2>
        <span class="chip chip--accent dd-tag">${esc(e.tag)}</span>
      </div>
      <div class="emmi-grid mt">
        <figure class="emmi-hero">
          <img src="${esc(e.hero)}" alt="Mistral AI acquires Emmi AI">
          <figcaption>${esc(e.deal)}</figcaption>
        </figure>
        <div class="panel emmi-what" data-seg-group>
          <div class="seg">
            <button class="seg-btn on" data-seg="0" type="button">🐌 Before</button>
            <button class="seg-btn" data-seg="1" type="button">⚡ Emmi</button>
          </div>
          <div class="seg-body">
            <div class="seg-pane on" data-pane="0"><h3>${esc(e.what.before.head)}</h3><p>${esc(e.what.before.body)}</p></div>
            <div class="seg-pane" data-pane="1"><h3>${esc(e.what.after.head)}</h3><p>${esc(e.what.after.body)}</p></div>
          </div>
          <div class="row chips mt">${uses}</div>
        </div>
      </div>
      <div class="tl mt" data-tl-group>
        <div class="tl-track">${nodes}</div>
        <div class="tl-detail-wrap">${details}</div>
      </div>
      <p class="dd-foot muted"><span class="dd-quotemark">“</span>${esc(e.quote.text)}<span class="dd-quotemark">”</span> — ${esc(e.quote.who)}</p>`);
  }

  /* ---- Deep dive 2: /loop (tweet + clickable loop ring + terminal) ------- */
  function buildLoop() {
    const l = C.spotlight.loop, t = l.tweet, v = l.versus;
    const ring = l.cycle.map((s, i) =>
      `<div class="lp-node lp-${i}${i === 0 ? " on" : ""}" data-i="${i}"><b>${i + 1}</b><span>${esc(s)}</span></div>`).join("");
    return slide("loop", "/loop", `
      <span class="kicker">${esc(l.kicker)}</span>
      <div class="dd-head">
        <h2>${esc(l.title)} <span class="grad">🔁</span></h2>
        <span class="chip chip--accent dd-tag">${esc(l.tag)}</span>
      </div>
      <div class="loop-grid mt">
        <div class="loop-col">
          <article class="tweet">
            <div class="tweet__top">
              <div class="tweet__av">${esc(t.avatar)}</div>
              <div class="tweet__id"><b>${esc(t.name)} <span class="vbadge">✔</span></b>
                <span>${esc(t.handle)} · ${esc(t.sub)}</span></div>
              <div class="tweet__x">𝕏</div>
            </div>
            <p class="tweet__text">${esc(t.text)}</p>
            <div class="tweet__meta">${esc(t.date)} · <b>${esc(t.views)}</b> views</div>
          </article>
          <div class="panel loop-versus" data-seg-group>
            <div class="seg">
              <button class="seg-btn on" data-seg="0" type="button">${esc(v.old.icon)} Prompting</button>
              <button class="seg-btn" data-seg="1" type="button">${esc(v.neu.icon)} Looping</button>
            </div>
            <div class="seg-body">
              <div class="seg-pane on" data-pane="0"><h3>${esc(v.old.head)}</h3><p>${esc(v.old.body)}</p></div>
              <div class="seg-pane" data-pane="1"><h3>${esc(v.neu.head)}</h3><p>${esc(v.neu.body)}</p></div>
            </div>
          </div>
        </div>
        <div class="loop-col">
          <div class="panel loop-ring-card" data-loop data-cur="0" data-iter="1">
            <div class="loop-ring">
              <div class="lp-spin"></div>
              ${ring}
              <button class="lp-go" data-loop-step type="button">▶<small>step</small></button>
            </div>
            <div class="lp-status" data-lp-status>Run #1 · start at <b>Prompt</b></div>
            <p class="muted lp-note">${esc(l.cycleNote)}</p>
          </div>
          <div class="panel term">
            <div class="term__bar"><i></i><i></i><i></i><span>claude-code</span></div>
            <pre class="term__body"><span class="term__cmd">${esc(l.example)}</span></pre>
            <p class="muted term__note">${esc(l.exampleNote)}</p>
          </div>
        </div>
      </div>
      <p class="dd-foot warn">⚠ ${esc(l.warning)} <span class="muted">${esc(l.arc)}</span></p>`);
  }

  /* ---- Deep dive 3: Agent Harness paper (stat + clickable H=⟨E,T,C,S,L,V⟩) */
  function buildHarness() {
    const h = C.spotlight.harness, s = h.stat;
    const formula = h.components.map((c, i) =>
      `<button class="hx-node${i === 0 ? " on" : ""}" data-hx="${i}" type="button">${esc(c.k)}</button>`)
      .join('<span class="hx-comma">,</span>');
    const details = h.components.map((c, i) =>
      `<div class="hx-detail${i === 0 ? " on" : ""}" data-hxd="${i}"><b>${esc(c.k)} — ${esc(c.name)}</b><p>${esc(c.body)}</p></div>`).join("");
    const finds = h.findings.map(f => `
      <button class="flip" type="button"><div class="flip__in">
        <div class="flip__face flip__front"><b>${esc(f.head)}</b><span class="flip__hint">tap to reveal →</span></div>
        <div class="flip__face flip__back"><p>${esc(f.body)}</p></div>
      </div></button>`).join("");
    const scope = h.scope.map(x => `<span class="chip">${esc(x)}</span>`).join("");
    return slide("harness", "Paper: Agent Harness", `
      <span class="kicker">${esc(h.kicker)}</span>
      <div class="dd-head">
        <h2>${esc(h.title)} <span class="grad">🔧</span></h2>
        <span class="chip chip--accent dd-tag">${esc(h.tag)}</span>
      </div>
      <div class="hx-grid mt">
        <div class="panel stat" data-stat style="--w:${s.to}%">
          <div class="stat__lbl">${esc(s.model)} on ${esc(s.bench)}</div>
          <div class="statrow"><span class="statrow__name">model alone</span>
            <div class="statbar"><span class="fill before"></span></div><b class="statval">${esc(s.from)}%</b></div>
          <div class="statrow"><span class="statrow__name">＋ better harness</span>
            <div class="statbar"><span class="fill after"></span></div><b class="statval big" data-countto="${esc(s.to)}">0%</b></div>
          <p class="muted stat__cap">${esc(s.caption)}</p>
          <button class="ghostbtn" data-stat-go type="button">▶ Reveal the jump</button>
          ${s.more ? `<div class="stat__more">
            <b class="stat__more-h">${esc(s.more.head)}</b>
            <ul class="stat__more-list">${s.more.points.map(p => `<li>${esc(p)}</li>`).join("")}</ul>
            <span class="stat__more-src muted">${esc(s.more.src)}</span>
          </div>` : ""}
        </div>
        <div class="panel hx">
          ${h.figure ? `<figure class="hx-fig zoom" data-full="${esc(h.figure)}" data-caption="${esc(h.paperTitle)}" data-explain="${esc(h.thesis)}">
            <img src="${esc(h.figure)}" alt="Agent harness architecture — H = (E, T, C, S, L, V)" loading="lazy">
            <figcaption>🔍 ${esc(h.figureCaption || "click to zoom")}</figcaption>
            ${h.figureCredit ? `<small class="hx-fig__credit">${esc(h.figureCredit)}</small>` : ""}</figure>` : ""}
          <div class="hx-formula"><span class="hx-h">H =</span> <span class="hx-br">⟨</span> ${formula} <span class="hx-br">⟩</span></div>
          <p class="muted hx-sub">The 6 parts of a harness — click a letter:</p>
          <div class="hx-details">${details}</div>
        </div>
      </div>
      <div class="hx-bottom mt">
        <div class="flips">${finds}</div>
        <div class="hx-links">
          <div class="row chips">${scope}</div>
          <div class="hx-qr">
            <div class="hx-qr-i">${qrCard(h.links.paper, 84, 4)}<div class="hx-qr-meta"><span class="muted">paper</span>${linkmono(h.links.paper)}</div></div>
            <div class="hx-qr-i">${qrCard(h.links.repo, 84, 4)}<div class="hx-qr-meta"><span class="muted">github</span>${linkmono(h.links.repo)}</div></div>
          </div>
        </div>
      </div>
      <p class="dd-foot muted">${esc(h.tie)}</p>`);
  }

  /* ---- Interactions for the three deep-dive slides ---------------------- */
  function initSpotlight() {
    const within = (el, sel) => el.closest(sel);
    document.addEventListener("click", e => {
      // 1) Emmi timeline — click a year, swap the detail
      const tlNode = e.target.closest(".tl-node");
      if (tlNode) {
        const grp = within(tlNode, "[data-tl-group]"), i = tlNode.dataset.tl;
        grp.querySelectorAll(".tl-node").forEach(n => n.classList.toggle("on", n === tlNode));
        grp.querySelectorAll(".tl-detail").forEach(d => d.classList.toggle("on", d.dataset.tld === i));
        return;
      }
      // 2) Segmented toggles (Emmi before/after, loop prompting/looping)
      const segBtn = e.target.closest(".seg-btn");
      if (segBtn) {
        const grp = within(segBtn, "[data-seg-group]"), i = segBtn.dataset.seg;
        grp.querySelectorAll(".seg-btn").forEach(b => b.classList.toggle("on", b === segBtn));
        grp.querySelectorAll(".seg-pane").forEach(p => p.classList.toggle("on", p.dataset.pane === i));
        return;
      }
      // 3) Loop ring — step the loop
      if (e.target.closest("[data-loop-step]")) {
        const box = e.target.closest("[data-loop]");
        let cur = +box.dataset.cur, iter = +box.dataset.iter;
        const status = box.querySelector("[data-lp-status]");
        if (box.classList.contains("done")) {                  // restart
          cur = 0; iter = 1; box.classList.remove("done");
          status.innerHTML = `Run #1 · start at <b>Prompt</b>`;
        } else if (cur === 3) {                                // we're on "Done?"
          if (iter >= 3) { box.classList.add("done");
            status.innerHTML = `✅ <b>tests pass</b> → loop exits`; }
          else { iter++; cur = 0;
            status.innerHTML = `✗ check failed → <b>Run #${iter}</b> from Prompt`; }
        } else {
          cur++;
          const names = ["Prompt", "Act", "Check", "Done?"];
          status.innerHTML = `Run #${iter} · <b>${names[cur]}</b>`;
        }
        box.dataset.cur = cur; box.dataset.iter = iter;
        const done = box.classList.contains("done");
        box.querySelectorAll(".lp-node").forEach(n => n.classList.toggle("on", +n.dataset.i === cur && !done));
        box.querySelector(".lp-go").classList.toggle("is-done", done);
        return;
      }
      // 4) Harness component letters
      const hxNode = e.target.closest(".hx-node");
      if (hxNode) {
        const card = within(hxNode, ".hx"), i = hxNode.dataset.hx;
        card.querySelectorAll(".hx-node").forEach(n => n.classList.toggle("on", n === hxNode));
        card.querySelectorAll(".hx-detail").forEach(d => d.classList.toggle("on", d.dataset.hxd === i));
        return;
      }
      // 5) Harness stat reveal (animate the bar + count up)
      if (e.target.closest("[data-stat-go]")) {
        const stat = e.target.closest("[data-stat]");
        if (stat.classList.contains("go")) return;
        stat.classList.add("go");
        const out = stat.querySelector("[data-countto]"), to = +out.dataset.countto;
        const t0 = performance.now(), dur = 1100;
        (function step(now) {
          const k = Math.max(0, Math.min(1, (now - t0) / dur));
          out.textContent = (to * (k * (2 - k))).toFixed(1) + "%";   // ease-out
          if (k < 1) requestAnimationFrame(step);
        })(t0);
        return;
      }
      // 6) Findings flip cards
      const flip = e.target.closest(".flip");
      if (flip) { flip.classList.toggle("flipped"); return; }
      // 7) Tool-of-the-month defense pillars — click a pillar, swap the body
      const defBtn = e.target.closest(".tof-def");
      if (defBtn) {
        const grp = within(defBtn, "[data-def-group]"), i = defBtn.dataset.def;
        grp.querySelectorAll(".tof-def").forEach(b => b.classList.toggle("on", b === defBtn));
        grp.querySelectorAll(".tof-def-body").forEach(p => p.classList.toggle("on", p.dataset.defb === i));
      }
    });
  }

  /* ---- Assemble the deck ------------------------------------------------ */
  function render() {
    const html = [
      buildCover(), buildMemes(), buildFunSites(), buildDemoCall(), buildIntro(), buildCommunity(),
      buildAgenda(), buildSlidoLive(),
      buildNews(), buildEmmi(), buildLoop(), buildHarness(), buildToolRecap(), buildTool(), buildOutro(),
    ].join("");
    $("#deck").innerHTML = html;
  }

  /* ---- Cover: count up numeric highlight words on load ------------------ */
  // Any **highlighted** word that is a number (e.g. "$965B") ticks up from
  // zero on load; non-numeric highlights (e.g. "fable-less") are left alone.
  function animateCoverNumbers() {
    const cover = $('.slide[data-id="cover"]');
    if (!cover) return;
    cover.querySelectorAll(".hot").forEach(el => {
      const m = el.textContent.trim().match(/^(\D*?)([\d.]+)(\D*)$/);
      if (!m) return;                                  // non-numeric → leave as-is
      const pre = m[1], post = m[3], target = parseFloat(m[2]);
      if (!isFinite(target)) return;
      const decimals = (m[2].split(".")[1] || "").length;
      el.style.fontVariantNumeric = "tabular-nums";
      const dur = 1500, t0 = performance.now();
      (function frame(now) {
        const k = Math.min(1, (now - t0) / dur);
        const eased = 1 - Math.pow(1 - k, 3);          // easeOutCubic
        el.textContent = pre + (target * eased).toFixed(decimals) + post;
        if (k < 1) requestAnimationFrame(frame);
        else { el.textContent = pre + target.toFixed(decimals) + post; el.classList.add("hot--landed"); }
      })(t0);
    });
  }

  /* ---- Navigation engine ------------------------------------------------ */
  let slides = [], idx = 0;

  function activate(i) {
    i = Math.max(0, Math.min(slides.length - 1, i));
    slides.forEach((s, k) => {
      s.classList.toggle("active", k === i);
      // manage Slido iframes: load only the active slide's iframe
      s.querySelectorAll("iframe[data-src]").forEach(f => {
        if (k === i && !f.src) f.src = f.getAttribute("data-src");
        if (k !== i && f.src) f.removeAttribute("src");
      });
    });
    idx = i;
    // expose the active slide's id on <body> so theme/chrome CSS can react
    // (e.g. hide the nav hint on the cover/title page).
    document.body.dataset.slide = (slides[i] && slides[i].dataset.id) || "";
    try { history.replaceState(null, "", "#" + (i + 1)); } catch (e) {}
    updateProgress();
  }

  /* ---- Subtle progress: muted "03 / 15" counter + thin bottom line ------- */
  function updateProgress() {
    const total = slides.length || 1;
    const bar = $(".progress__bar");
    if (bar) bar.style.width = ((idx + 1) / total * 100) + "%";
    const c = $("#count");
    if (c) c.textContent = String(idx + 1).padStart(2, "0") + " / " + total;
  }

  function next() { if (idx < slides.length - 1) activate(idx + 1); }
  function prev() { if (idx > 0) activate(idx - 1); }

  /* ---- Countdown -------------------------------------------------------
     Build the neon tiles ONCE, then only tick the digits so each change can
     flip/pulse (re-writing innerHTML every second would kill the animation).
     The ":" separators blink and the seconds tile is accent-coloured. */
  const CD_UNITS = [["d", "days"], ["h", "hrs"], ["m", "min"], ["s", "sec"]];
  let cdNums = null;
  function buildCountdownShell(box) {
    box.classList.add("cd-grid");
    box.innerHTML = CD_UNITS.map(([u, l], i) =>
      (i ? `<span class="cd-sep">:</span>` : "")
      + `<div class="cd" data-u="${u}"><b>00</b><span class="cd-lbl">${l}</span></div>`).join("");
    cdNums = {};
    box.querySelectorAll(".cd").forEach(c => { cdNums[c.dataset.u] = c.querySelector("b"); });
  }
  function tickCountdown() {
    const box = $("#countdown"); if (!box) return;
    const diff = new Date(C.next.dateISO).getTime() - Date.now();
    if (diff <= 0) {
      cdNums = null; box.classList.remove("cd-grid");
      box.innerHTML = `<div class="cd cd--live"><b>LIVE</b><span class="cd-lbl">see you there</span></div>`;
      return;
    }
    if (!cdNums || !box.classList.contains("cd-grid")) buildCountdownShell(box);
    const vals = {
      d: Math.floor(diff / 864e5), h: Math.floor(diff / 36e5) % 24,
      m: Math.floor(diff / 6e4) % 60, s: Math.floor(diff / 1e3) % 60,
    };
    for (const u in vals) {
      const el = cdNums[u], txt = String(vals[u]).padStart(2, "0");
      if (el.textContent === txt) continue;
      el.textContent = txt;
      const tile = el.parentElement;
      tile.classList.remove("flip"); void tile.offsetWidth; tile.classList.add("flip");
    }
  }

  /* ---- Clock ------------------------------------------------------------ */
  function tickClock() {
    const c = $("#clock"); if (c) c.textContent = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  /* ---- Theme cycler ----------------------------------------------------- */
  const THEMES = ["aia", "aialight", "neon", "synth", "plasma", "volt"];
  function setTheme(t) { document.documentElement.dataset.theme = t; try { localStorage.setItem("cf-theme", t); } catch (e) {} }
  function cycleTheme(dir = 1) {
    const cur = document.documentElement.dataset.theme || THEMES[0];
    setTheme(THEMES[(THEMES.indexOf(cur) + dir + THEMES.length) % THEMES.length]);
  }

  /* ---- Lightbox (memes) ------------------------------------------------- */
  function initLightbox() {
    const lb = $("#lightbox"), img = $("#lightbox img");
    const cap = $(".lb-cap", lb), capT = $(".lb-cap__t", lb), capB = $(".lb-cap__b", lb);
    document.addEventListener("click", e => {
      const m = e.target.closest(".meme[data-full], .zoom[data-full]");
      if (!m) return;
      img.src = m.dataset.full;
      const title = m.dataset.caption || "", body = m.dataset.explain || "";
      capT.textContent = title; capB.textContent = body;
      cap.hidden = !(title || body);
      lb.classList.add("open");
    });
    lb.addEventListener("click", () => { lb.classList.remove("open"); img.src = ""; });
  }

  /* ---- Fullscreen for a fun-site embed --------------------------------- */
  function initEmbedFs() {
    document.addEventListener("click", e => {
      const b = e.target.closest(".embed-fs"); if (!b) return;
      const f = b.parentElement.querySelector("iframe"); if (!f) return;
      const req = f.requestFullscreen || f.webkitRequestFullscreen || f.msRequestFullscreen;
      if (req) req.call(f);
    });
  }

  /* ---- Copy-to-clipboard for link buttons ------------------------------
     Works offline / off https too: tries the async Clipboard API first, then
     falls back to a hidden textarea + execCommand("copy"). */
  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
    }
    return Promise.resolve(fallbackCopy(text));
  }
  function fallbackCopy(text) {
    const ta = document.createElement("textarea");
    ta.value = text; ta.setAttribute("readonly", "");
    ta.style.cssText = "position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;pointer-events:none";
    document.body.appendChild(ta); ta.select();
    try { document.execCommand("copy"); } catch (e) {}
    document.body.removeChild(ta);
  }
  function initCopy() {
    document.addEventListener("click", e => {
      const btn = e.target.closest(".copybtn"); if (!btn) return;
      copyText(btn.dataset.copy || "");
      btn.classList.add("copied");
      clearTimeout(btn._cpT);
      btn._cpT = setTimeout(() => btn.classList.remove("copied"), 1400);
    });
  }

  /* ---- Command palette -------------------------------------------------- */
  function initCmdk() {
    const box = $("#cmdk"), input = $("#cmdk-in"), list = $("#cmdk-list");
    let sel = 0, items = [];
    const ACTIONS = [
      { label: "Switch theme", sub: "T", run: () => cycleTheme(1) },
      { label: "Toggle fullscreen", sub: "F", run: toggleFs },
    ];
    function open() {
      box.classList.add("open"); input.value = ""; render(""); input.focus();
    }
    function close() { box.classList.remove("open"); }
    function render(q) {
      q = q.toLowerCase();
      const goto = slides.map((s, i) => ({ label: s.dataset.title, sub: "Slide " + (i + 1), run: () => activate(i, true) }));
      items = ACTIONS.concat(goto).filter(it => it.label.toLowerCase().includes(q));
      sel = 0;
      list.innerHTML = items.map((it, i) =>
        `<div class="cmdk__item ${i === 0 ? "sel" : ""}" data-i="${i}"><span class="n">${i < 9 ? "" : ""}</span>${esc(it.label)}<span class="sub">${esc(it.sub)}</span></div>`).join("");
    }
    function move(d) { sel = (sel + d + items.length) % items.length; [...list.children].forEach((c, i) => c.classList.toggle("sel", i === sel)); list.children[sel] && list.children[sel].scrollIntoView({ block: "nearest" }); }
    input.addEventListener("input", () => render(input.value));
    input.addEventListener("keydown", e => {
      if (e.key === "ArrowDown") { e.preventDefault(); move(1); }
      else if (e.key === "ArrowUp") { e.preventDefault(); move(-1); }
      else if (e.key === "Enter") { e.preventDefault(); items[sel] && items[sel].run(); close(); }
      else if (e.key === "Escape") close();
    });
    list.addEventListener("click", e => { const it = e.target.closest(".cmdk__item"); if (it) { items[+it.dataset.i].run(); close(); } });
    box.addEventListener("click", e => { if (e.target === box) close(); });
    window.__cmdk = { open, close, isOpen: () => box.classList.contains("open") };
  }

  function toggleFs() {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen && document.documentElement.requestFullscreen();
    else document.exitFullscreen && document.exitFullscreen();
  }

  /* ---- Keyboard --------------------------------------------------------- */
  function initKeys() {
    document.addEventListener("keydown", e => {
      if (window.__cmdk && window.__cmdk.isOpen()) return; // palette handles its own keys
      if ($("#lightbox").classList.contains("open") && e.key === "Escape") { $("#lightbox").click(); return; }
      switch (e.key) {
        case "ArrowRight": case " ": case "PageDown": e.preventDefault(); next(); break;
        case "ArrowLeft": case "PageUp": e.preventDefault(); prev(); break;
        case "Home": e.preventDefault(); activate(0, false); break;
        case "End": e.preventDefault(); activate(slides.length - 1, true); break;
        case "t": case "T": cycleTheme(e.shiftKey ? -1 : 1); break;
        case "f": case "F": toggleFs(); break;
        case "k": case "K": case "/": e.preventDefault(); window.__cmdk.open(); break;
        case "Escape": $("#lightbox").classList.remove("open"); break;
      }
    });
    // on-screen arrows
    $("#nav-prev").addEventListener("click", prev);
    $("#nav-next").addEventListener("click", next);
  }

  /* ---- Boot ------------------------------------------------------------- */
  function boot() {
    let saved = null; try { saved = localStorage.getItem("cf-theme"); } catch (e) {}
    const qTheme = new URLSearchParams(location.search).get("theme");
    setTheme(THEMES.includes(qTheme) ? qTheme : (saved || C.meta.defaultTheme || "neon"));
    render();
    slides = [...document.querySelectorAll(".slide")];
    initLightbox(); initEmbedFs(); initCopy(); initCmdk(); initKeys(); initSpotlight(); initAgenda();
    const start = parseInt((location.hash || "").replace("#", ""), 10);
    if (start >= 1 && start <= slides.length) activate(start - 1, true);
    else activate(0, false);
    animateCoverNumbers();
    tickClock(); tickCountdown();
    setInterval(tickClock, 1000);
    setInterval(tickCountdown, 1000);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();

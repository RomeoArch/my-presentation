/* =============================================================================
   GenAI-Codeforce — MONTHLY CONTENT  ·  EMPTY TEMPLATE
   -----------------------------------------------------------------------------
   This is the ONLY file you need to touch each month.
   Edit the values below, save, refresh the browser. That's it.

   >>> This is the blank template for a NEW edition. Everything marked [LIKE THIS]
       is a placeholder waiting for you. The two RETROSPECTIVE slides
       (`news` + `toolRecap`) are already filled in with LAST time's content
       (June 2026), so the "Previously on…" look-back works out of the box.
       Recurring stuff (team, links, events, agenda, sign-off) is kept as-is.

   Quick map:
     meta      -> edition label + the big motto on the cover
     session   -> date/time of THIS session (the chip on the cover / title page)
     next      -> date/time of the NEXT codeforce (closing slide + countdown)
     links     -> discord / meetup
     presenters-> people + their LinkedIn URLs (QR codes are auto-generated)
     memes     -> the month's jokes, described in our own words (no images)
     events    -> AI Austria meetup + other community events
     agenda    -> the running order
     slido     -> embed URL + join code + the questions
     news      -> the retrospective: last time's news (the 01/02/03 cards)
     spotlight -> THIS month's three deep-dive slides (emmi / loop / harness)
     toolRecap -> the retrospective: last time's Tool of the Month
     tool      -> THIS month's Tool of the Month
     demo      -> the live-demo slot (someone else usually drives this)
   ============================================================================= */

window.CODEFORCE = {

  /* ---- Edition & motto (the cover slide) ---------------------------------- */
  meta: {
    edition: "July 2026",
    // The spicy one-liner / theme of the month shown big on the cover.
    // **bold** words get the neon glow; numbers count up on load.
    motto: "AI in July 2026: **65%** of Anthropic's code now ships from a teammate who lives in Slack. The other **35%**? Humans, picking up the **slack**. 💬🫠",
    // fx/entrance.js glitches ONE highlighted word on the cover — it vanishes
    // and reforms every few seconds. Pick a NON-numeric one (numbers count up).
    glitchWord: "slack",
    // Tonight's themes as emoji chips on the cover. Keep them SHORT (2–4 chips)
    // and pick emojis that actually match this edition's deep dives.
    topics: [
      "🌫️ Ambient AI",
      "📜 The open-weights letter",
      "⚔️ Model face-off",
      "🛡️ Hijack-proof agents",
    ],
    // Which palette loads first. Cycle live with the T key. One of:
    // "aia" (AI Austria dark) | "aialight" (AI Austria light) | "neon" | "synth" | "plasma" | "volt"
    defaultTheme: "aia",
    // Signature slogan on the closing slide. **bold** words get the neon glow.
    signoff: "Less talking, more **building**. 🛠️",
  },

  /* ---- Cover meme (the "keep up with AI news" eyes meme) ------------------
     `image` is OUR OWN picture (made by the Codeforce team), so it is fine to
     ship in the public archive — see CREDITS.md. Never swap in a picture found
     online: this deck is published on GitHub Pages, which is publication, not a
     talk. Remove `image` to fall back to the code-drawn version below
     (rows / skull / footer), which always matches the active theme. */
  coverMeme: {
    image: "assets/memes/keep_up_with_AI_news.png",
    // --- fallback (used only if `image` is removed) ---
    rows: [
      { label: "STRESS",  eyes: "👀" },
      { label: "ALCOHOL", eyes: "👀" },
      { label: "WEED",    eyes: "👁️" },
      { label: "COCAINE", eyes: "🩸" },
    ],
    skull: true,
    footer: "KEEP UP WITH AI NEWS",
  },

  /* ---- THIS session (the date shown on the cover / title page) ------------
     The cover always shows the edition you are presenting RIGHT NOW. The next
     date belongs on the closing slide only — that's `next` below. */
  session: {
    dateLabel: "29 July 2026",
    time:      "17:00 – 18:30",
  },

  /* ---- The NEXT codeforce (closing slide only — powers the countdown) -----
     This edition's session is on 29 July 2026; the follow-up is 30 Sept 2026
     (August is skipped). */
  next: {
    dateISO:   "2026-09-30T17:00:00+02:00", // ISO 8601, used for the countdown
    dateLabel: "30 September 2026",
    time:      "17:00 – 18:30",
    where:     "Virtual · Meetup",
  },

  /* ---- Links -------------------------------------------------------------- */
  links: {
    discord: "https://discord.gg/9FS68B9sQj",
    meetup:  "https://www.meetup.com/ai-austria/",
  },

  /* ---- Presenters / organizers -------------------------------------------
     Each person shows a QR with the LinkedIn mark in the centre.
       qr   -> use a ready-made QR image (drop it in assets/qrcodes/). Best
               option — it encodes the real profile exactly as you generated it.
       linkedin -> fallback: if no `qr` is given, a QR is generated from this URL.
     Optional per-person fields:
       title          -> credential shown under the name (e.g. a job title)
       hideOnDemoCall -> true keeps them off the "Show a demo?" slide while
                         still listing them on the closing "Reach the team" slide */
  presenters: [
    { name: "Philipp Besinger",   role: "Host",      qr: "assets/qrcodes/philipp.png",   linkedin: "https://www.linkedin.com/in/philipp-besinger-622218219/",   phone: "+43 680 402 16 87" },
    { name: "Sebastian Archila",  role: "Host",      qr: "assets/qrcodes/sebastian.png", linkedin: "https://www.linkedin.com/in/sebastian-archila-567565213/", phone: "+43 660 657 07 26" },
    { name: "Daniel Noszian",     role: "Security",  qr: "assets/qrcodes/Daniel.png",    linkedin: "https://www.linkedin.com/in/dnos/",    phone: "", title: "AI CyberSec Pro" },
  ],

  /* ---- Memes -------------------------------------------------------------
     This deck is archived to a PUBLIC website, so we describe the month's memes
     instead of reproducing them — we don't hold rights to the images, and
     publishing is what creates exposure (showing them live in the room is not).
     `format` = the meme template, `caption` = the punchline, `explain` = why
     it's funny, `url` = where to see the original. Do NOT add a `src:` pointing
     at a picture found online — but DO add a `url:`. Linking is not
     reproduction, so a link needs no licence; it's the safe way to show people
     the actual image. A card with no `url` simply shows no link — better than a
     "See the meme" button that lands somewhere that isn't the meme.
     For websites/links, use `funSites` below (a live embed slide) — a URL makes
     a poor meme tile. ({ type:"link", url, label } renders a QR card.) */
  memes: [
    { format: "The lion doesn't concern himself",
      url: "https://www.globalnerdy.com/wp-content/uploads/2025/05/the-lion-doesnt-concern-himself-with-RAG.jpeg",
      caption: "The lion doesn't concern himself with RAG",
      explain: "The “lion doesn't concern himself with the opinion of sheep” format, run through an AI architecture diagram: he “embeds raw dominance into vector space, queries nothing — attention is all he needs.” A double pun on the Transformer paper (“Attention Is All You Need”) and the fact that half of RAG discourse is people rebuilding a search engine they didn't need." },
    { format: "Car-ride dad joke",
      url: "https://www.reddit.com/r/ClaudeAI/comments/1unxvu4/classic/",
      caption: "“Thanks Dad.” — “No problem, Fable 5.”",
      explain: "The classic car-ride joke where the dad's answer accidentally reveals the kid's name. Here the sister is Rose because mum loves roses… and the son is named Fable 5. Peak 2026 parenting: naming your child after this month's frontier model." },
    { format: "Drake · no / yes",
      url: "",   // ← no link supplied for this one, so its card shows no button
      caption: "“Open-source should be banned because it burned my ass”",
      explain: "Drake format, aimed at the frontier labs: publicly it's all “general-purpose models to benefit humanity” — right up until an open-weight model undercuts you. Lands squarely on tonight's face-off, where Kimi K3 ships open weights on 27 July at a third of Fable 5's price and tops the blind Frontend Code Arena." },
    { format: "Stick-figure comic · benchmark",
      url: "https://www.reddit.com/r/ClaudeAI/comments/1unxvu4/classic/",
      caption: "“I got 100%. I found the answers in Hugging Face's production database.”",
      explain: "Barely a joke: on 21 July OpenAI confirmed that GPT-5.6 Sol and an unreleased model, run with reduced cyber refusals on the ExploitGym benchmark, escaped their sandbox, chained a real zero-day into Hugging Face's production infrastructure and pulled the benchmark's answer key. Hugging Face had already detected and contained it on 16 July. Benchmarketing has a new failure mode: the model doesn't game the eval, it breaches the eval's host." },
  ],
  // Small credit shown under the memes title. Set to null to hide.
  memeSource: null, // e.g. { label: "youraislopbores.me", url: "https://youraislopbores.me/" }

  /* ---- Fun AI site(s) of the month --------------------------------------
     Each entry becomes its OWN slide with a LIVE iframe embed of the site.
     Needs internet while presenting; the QR + open-link fallback always works.
     Heads-up: some sites refuse to be framed (X-Frame-Options / CSP). If the
     embed stays blank that's why — just scan the QR or open the link.
       name  -> shown big          emoji -> little accent next to the name
       blurb -> one-line pitch     url   -> what the QR encodes / link to open
       embed -> page to iframe (usually the same as url)
     >>> EMPTY: leave [] for no fun-site slide, or add an entry like:
     // { name: "[Site name]", emoji: "🎲", blurb: "[one-line pitch]",
     //   url: "https://example.com", embed: "https://example.com" }, */
  funSites: [
    {
      name:  "Super Dario: One More Week",
      emoji: "🍄",
      blurb: "Mario, but you play Dario — stomp Sam, dodge Claude-logo fire bars, survive DeepSeek shells that only ever go dormant. Your real health bar is WEEKLY USAGE.",
      url:   "https://superdario.pawb.de/",
      embed: "https://superdario.pawb.de/",
    },
  ],

  /* ---- Community events (AI Austria, etc.) -------------------------------- */
  events: {
    intro: "Coming together to impact the world.",
    facts: [
      "Virtual event — every single month",
      "Latest GenAI news & technological exchange",
      "Active participation, tool presentations & live demos",
      "Everyone welcome — from curious user to hardcore dev",
    ],
    goals: [
      "Technological exchange",
      "Casual exchange",
      "Active participation",
      "Discussing the news",
      "Showing code & demos",
      "Sharing challenges",
    ],
    goalLine: "Learning, helping, improving and creating value with Generative AI.",
    // Other community events to plug (e.g. the AI Austria Meetup). The FIRST
    // entry is featured on the "Community & Discord" slide.
    //   url   -> what the QR encodes / the "View on Meetup" link
    //   note  -> one-liner shown on the card
    //   embed -> OPTIONAL. Leave it OUT for the default preview card (always
    //            works, offline). meetup.com itself CANNOT be embedded (it sends
    //            X-Frame-Options, so the iframe stays blank). Only set `embed`
    //            to a URL that actually allows framing — e.g. a Luma event page,
    //            an embeddable Google Calendar, or your own site — and the card
    //            switches to a live iframe automatically.
    other: [
      { name: "AI Austria Meetup", cadence: "Every 1–2 months", url: "https://www.meetup.com/ai-austria/",
        note: "In-person keynotes + meeting genuinely interesting people." },
    ],
  },

  /* ---- Discord channels (shown on the Discord slide) ---------------------- */
  discordChannels: [
    "🏠 #welcome-and-rules",
    "📢 #announcements",
    "📚 #resources",
    "💬 #general",
    "🎭 #off-topic",
  ],

  /* ---- Agenda / running order --------------------------------------------- */
  agenda: [
    { title: "We question, you answer", note: "Community pulse via Slido" },
    { title: "Breaking News — GenAI",   note: "What moved this month" },
    { title: "Tool of the Month",       note: "Live: an agent built to survive prompt injection" },
  ],

  /* ---- Slido --------------------------------------------------------------
     `embedBase` is your Slido event embed URL. Per-question you can override
     with a specific `embed` (deep-link to that poll). If the embed fails or
     wifi dies, the QR + join code fallback is always shown.
     Get the embed URL: Slido → Present/Share → "Embed" → copy the src URL.
     >>> FILLED: "Codeforce July 2026" (#3821397) — three fresh questions, none
     of them reused from slido/history.json. */
  slido: {
    // Participant link (what the QR encodes — attendees open this to vote):
    joinUrl:  "https://app.sli.do/event/sGC38So4S9T3zZcsjdnivT",
    // Optional: paste the "#code" shown in your Slido admin to display it big.
    // Leave "" to hide it (the QR + link are enough to join).
    joinCode: "3821397",
    // Live embed shown inside each question slide. This is Slido PRESENT mode
    // (wall.sli.do = live results/bars, NOT a "vote now" screen) — it shows
    // whatever question you've made ACTIVE in Slido. Leave "" to show QR-only.
    // (Use app.sli.do here instead if you ever want the participant/voting view.)
    embedBase: "https://wall.sli.do/event/sGC38So4S9T3zZcsjdnivT",
    // Prep checklist only (NOT rendered as slides anymore): the questions you
    // create in Slido and activate one-by-one during the meetup. The single
    // live wall slide auto-follows whichever one is active.
    // No news inside the question text — the question asks about a habit anyone
    // has, and the news is YOUR framing when you present the results.
    questions: [
      { q: "A new model drops. How fast do you actually switch? ⚡", kind: "poll", embed: "",
        hint: "Options: Same day · Within a week · When my tool updates itself · I'm still on my favourite from last year · I don't notice",
        frame: "July shipped Sonnet 5, Kimi K3 and cheaper inference across the board — the room's answer says whether any of that reaches people." },
      { q: "What's the last thing you delegated to an AI and did not check? 😬", kind: "open", embed: "",
        hint: "e.g. “a commit message”, “my standup update”, “an email to my boss”" },
      { q: "Is there an AI in your team's group chat yet? 💬", kind: "poll", embed: "",
        hint: "Options: Yes, and it's useful · Yes, and it's noise · No, but it's coming · No, and I like it that way · I'd rather not know" },
    ],
  },

  /* ---- Last time's news — the RETROSPECTIVE slide ------------------------
     This slide is the LOOK-BACK: the numbered 01/02/03 cards are the news from
     the PREVIOUS codeforce, not this month's upcoming stories. Each card:
       tag   -> small label (per-card accent colour)   title -> the headline
       blurb -> one-line recap                          url   -> optional QR
     >>> PRE-FILLED with June 2026's three deep-dives (recap of last time). */
  news: {
    lastTime: [
      { title: "Mistral buys our neighbours", tag: "🇦🇹 Austria",
        blurb: "France's Mistral AI acquired Emmi AI — a 2-year-old JKU Linz spin-off — for a reported €330M; Linz becomes Mistral's 7th office.",
        url: "https://www.emmi.ai/news/mistral-ai-acquires-emmi-ai" },
      { title: "Stop prompting. Start looping.", tag: "🦞 Workflow",
        blurb: "Steinberger's viral take: design loops that prompt your agents instead of prompting them yourself — feedback gates make a loop trustworthy.",
        url: "" },
      { title: "The harness, not the model", tag: "📄 Paper",
        blurb: "The Agent Harness survey: agents fail on scaffolding, not the model. Same model, better harness — 6.7% → 68.3% on SWE-bench.",
        url: "https://www.preprints.org/manuscript/202604.0428" },
    ],
  },

  /* ---- Deep-dive spotlights ----------------------------------------------
     The three interactive "Breaking News" slides. Copy lives here so you can
     re-word it; the click-interactions are wired in engine.js. Each is built
     by its own slide (buildEmmi / buildLoop / buildHarness) and KEEPS its shape
     (timeline / loop-ring / formula), so just pour this month's three stories
     into the three moulds below.
     >>> EMPTY: replace every [PLACEHOLDER] with this month's stories. */
  spotlight: {

    /* 1) "Story of the month" — image + before/after toggle + timeline.
       THIS EDITION: Claude in Slack, framed as "ambient AI". */
    emmi: {
      tag: "🌫️ Ambient AI",
      kicker: "Deep Dive · Story of the month",
      title: "The AI is already in the room",
      emoji: "🌫️",                        // accent glyph next to the headline
      navTitle: "Ambient AI · Claude in Slack", // command-palette label
      // The hero is a hand-built Slack thread (engine.js → slackMock), NOT a
      // screenshot: it stays crisp on a projector, never crops, and keeps the
      // word count low. Two beats only — tagged, then unprompted.
      // (The real screenshots were removed from the public archive — we don't
      //  hold rights to them. Don't set `hero` to a third-party screenshot.)
      slack: {
        channel: "launch-atlas",
        thread: "Sprint sync · 14 replies",
        alt: "A Slack thread: Alex tags @Claude, Claude answers with three decisions, then posts again hours later without being asked",
        messages: [
          { who: "Alex", initial: "A", color: "#4A6FA5", time: "10:42",
            text: "@Claude what did we actually decide in this thread?" },
          { who: "Claude", bot: true, time: "10:42",
            bullets: [
              { k: "API contract", v: "frozen Friday" },
              { k: "Onboarding",   v: "Priya decides Wed" },
              { k: "Analytics",    v: "nobody owns it" },
            ],
            link: "Open session in Claude ↗" },
          { who: "Claude", bot: true, time: "16:05", push: true,
            text: "Analytics still has no owner — and the sprint ends tomorrow.",
            note: "nobody tagged it. Claude spoke up." },
        ],
      },
      hero: "",                           // fallback image if `slack` is removed
      heroAlt: "A Slack thread where someone tags @Claude and Claude replies with a summary",
      logo: "",                           // optional wordmark shown on a dark plate
      deal: "Claude Tag, 23 Jun 2026: one shared @Claude per channel, channel history as memory. The old single-user Claude in Slack app retires 3 Aug.",
      // Click-through timeline — the three-act arc: CHATBOT → AGENT → AMBIENT.
      // Each beat answers "who starts the work?" — that's the through-line:
      // you type → you type, it acts → nobody types.
      // `adopt` = the adoption number for that beat (rendered as a pill under
      // the detail). Read down the pills and the point makes itself: each new
      // paradigm is absorbed faster than the last.
      // Verified 25 Jul 2026 — ChatGPT 30 Nov 2022, 100M MAU in ~60 days, vs 9
      // months for TikTok (UBS); Stack Overflow Dev Survey 2023 (44% already
      // using AI tools, +26% planning); MCP published 25 Nov 2024, OpenAI,
      // Google DeepMind + Microsoft on board within a year; Bick/Blandin/Deming
      // NBER w32966 (39% of US 18–64 by Aug 2024, faster uptake than the PC or
      // the internet); Operator Jan 2025, Claude Code GA 2025; agent adoption
      // per US-exec survey 2026; Stanford AI Index 2026 (53% of the global
      // population within 3 years of ChatGPT; the PC needed ~15);
      // Claude Tag beta 23 Jun 2026 (anthropic.com/news/introducing-claude-tag).
      timeline: [
        { year: "2022", head: "Chatbot",       body: "A place you go. You paste the context into a blank box and copy the answer back out.",
          adopt: "100M users in 60 days — TikTok needed 9 months" },
        { year: "2023", head: "Copilot",       body: "It moves into the IDE and the inbox. Closer to the work, but it only finishes the sentence you already started.",
          adopt: "44% of developers already coding with AI, +26% about to" },
        { year: "2024", head: "It gets hands", body: "MCP lands in November and the industry standardises on it. The assistant can act, not just answer.",
          adopt: "39% of US adults 18–64 on genAI — uptake faster than the PC or the internet" },
        { year: "2025", head: "Agent",         body: "Work runs end-to-end: Operator, Claude Code, background runners. But a human still starts every run.",
          adopt: "79% of US execs say their company is already adopting agents" },
        { year: "Now",  head: "Ambient",       body: "Nobody starts it. @Claude lives in the channel, remembers what the team said, schedules its own work — and posts first.",
          adopt: "53% of the planet on genAI 3 years in. The PC took ~15." },
      ],
      // Before / after toggle — the paradigm shift in one flip. NB: "before"
      // deliberately covers chatbots AND agents: both wait to be summoned.
      what: {
        before: { tab: "🖥️ You go to the AI", head: "Chatbot or agent — you start it",
                  body: "A session someone opens and types into. It gets your context second-hand, and forgets you when the tab closes." },
        after:  { tab: "🌫️ The AI is already here", head: "Ambient — it starts itself",
                  body: "It lives where the team already talks. The channel is the context, the memory is shared, and it can speak first." },
      },
      uses: ["🧠 Learns your company", "👥 One per channel", "📣 Speaks up unprompted", "⏳ Works for hours or days", "🔐 Beta · Team & Enterprise"],
      quote: { text: "The most profound technologies are those that disappear. They weave themselves into the fabric of everyday life until they are indistinguishable from it.",
               who: "Mark Weiser, Xerox PARC, 1991" },
      // Punchline stat + the security callback to June's Tool of the Month.
      note: "65% of Anthropic's own product code now ships through their internal Claude Tag. The catch: an agent everyone can talk to is one everyone can try to hijack.",
      link: "https://www.anthropic.com/news/introducing-claude-tag",
    },

    /* 2) "Workflow idea of the month" — tweet card + clickable loop ring ----- */
    loop: {
      tag: "🦞 Workflow",
      kicker: "Deep Dive · How people actually work now",
      title: "[The workflow idea, as a one-liner]",
      // The viral post (recreated as a card so it works offline):
      tweet: {
        name: "[Name]", handle: "@handle", avatar: "🦞",
        sub: "[who they are]",
        date: "[Mon D, 2026]", views: "[N]M",
        text: "[The post / quote, verbatim.]",
      },
      // Old vs new mental model (the toggle):
      versus: {
        old: { icon: "🧑‍💻", head: "[Old way]", body: "[How it used to be done.]" },
        neu: { icon: "🔁", head: "[New way]",   body: "[What the new approach does differently.]" },
      },
      // The loop the animation steps through (4 short labels read best):
      cycle: ["Prompt", "Act", "Check", "Done?"],
      cycleNote: "[One line explaining what each click/step represents.]",
      example: "[A concrete command or example, shown in the terminal card.]",
      exampleNote: "[One line of context for the example above.]",
      warning: "[The cautionary one-liner shown in the footer.]",
      note: "[Optional supporting note.]",
      arc: "[A nice kicker / callback line shown muted next to the warning.]",
    },

    /* 3) "Paper of the Month" — stat bar + clickable H = ⟨...⟩ formula ------- */
    harness: {
      tag: "📄 Paper of the Month",
      kicker: "Deep Dive · Paper of the month",
      title: "[The paper's punchline in a few words]",
      paperTitle: "[Full paper title]",
      authors: "[Authors · venue]",
      thesis: "[The paper's one-sentence thesis.]",
      // An architecture/figure from the paper, shown as a click-to-zoom thumbnail.
      // Leave "" to hide the figure entirely. Drop the image in assets/news/.
      figure: "",
      figureCaption: "click to zoom",
      // The jaw-dropper stat (animated bar). `from`/`to` are percentages.
      stat: { from: 0, to: 100, model: "[Model]", bench: "[Benchmark]",
              caption: "[What single change produced the jump.]",
              // Optional supporting panel revealed with the jump. Remove `more`
              // entirely if you don't have a corroborating result.
              more: {
                head: "[…and it's not a one-off.]",
                src: "[source]",
                points: [
                  "[supporting point 1]",
                  "[supporting point 2]",
                  "[supporting point 3]",
                ],
              } },
      // The clickable components. Keep SIX for the H = ⟨ , , , , , ⟩ formula;
      // `k` is the single-letter shown in the formula, `name` + `body` reveal on click.
      components: [
        { k: "A", name: "[Component A]", body: "[What it is.]" },
        { k: "B", name: "[Component B]", body: "[What it is.]" },
        { k: "C", name: "[Component C]", body: "[What it is.]" },
        { k: "D", name: "[Component D]", body: "[What it is.]" },
        { k: "E", name: "[Component E]", body: "[What it is.]" },
        { k: "F", name: "[Component F]", body: "[What it is.]" },
      ],
      // Flip cards — the spicy findings (tap to reveal the back):
      findings: [
        { head: "[Finding 1]", body: "[The punchy detail behind it.]" },
        { head: "[Finding 2]", body: "[The punchy detail behind it.]" },
        { head: "[Finding 3]", body: "[The punchy detail behind it.]" },
      ],
      scope: ["[scope 1]", "[scope 2]", "[scope 3]"],
      tie: "[A closing line that ties this paper to the rest of tonight.]",
      links: { paper: "", repo: "" },
    },

    /* 4) "Model face-off" — a 4-way frontier scoreboard, chart-first.
       Rendered by buildFaceoff(): one card per model (which doubles as the
       colour legend) plus one small bar chart per benchmark. Keep the copy
       short — the bars are the argument.
         models[].key    ties a card to its bars; .color is its series colour
                         (validated for colour-blind separation in both light
                         and dark themes — re-check if you change one).
         charts[].lo/hi  bar scale; set lo just under the worst score so the
                         gaps are visible. bars are listed BEST FIRST (the
                         first row gets the ★ leader styling); v: null renders
                         an honest "not run" instead of a fake zero.
       Numbers re-verified 26 Jul 2026 against the live leaderboards — Artificial
       Analysis (Intelligence Index v4.1 at max effort, GDPval-AA v2 leaderboard,
       cost per task), ARC Prize, vendor cards. Coding/agentic runs use each
       vendor's own harness. Traps found in the first pass, keep them fixed:
         · Index: AA's articles round to whole numbers (61/60/59/57), the
           leaderboard carries one decimal (60.7/59.9/58.9/57.1). Never mix the
           two — 61 vs 59.9 fakes a 1.1-point lead that is really 0.8, and AA
           itself calls Opus 5 "effectively tied" with Fable 5.
         · GDPval-AA v2: Sol (max) is 1735, BELOW Fable 5's 1747 — an earlier
           1748 for Sol had the two swapped. Kimi K3 is 1686 on the leaderboard;
           the 1668 in Moonshot's launch coverage is stale.
         · ARC-AGI-3: ARC Prize publishes only Opus 5 (30.2%) and Sol (7.8%) and
           puts "Fable-class" at ~20%. Third-party aggregators list Fable 5 at
           16.6% — do not print that under an ARC Prize credit.
         · SWE-bench Pro: Fable's launch tables say 80.3%, the Opus-5 comparisons
           say 80.0%, and Mythos 5 may sit above both. Hence "~80%" plus the
           Opus 5 number, which is the only comparison this slide needs. */
    faceoff: {
      tag: "⚔️ Model face-off",
      kicker: "Deep Dive · Frontier scoreboard",
      title: "Four flagships, six weeks",
      emoji: "⚔️",
      navTitle: "Model face-off",
      intro: "**Claude Opus 5 shipped five days ago** and narrowly took the crown from Fable 5 — at half the input price. Click a model to trace it through the charts.",
      models: [
        { key: "kimi", short: "Kimi K3", name: "Kimi K3", vendor: "Moonshot AI",
          flag: "🌙", color: "#1FA3B8",
          released: "16 Jul 2026", open: true, ctx: "1.0M", pin: 3, pout: 15,
          win: "Cheapest per task · weights drop 27 Jul" },
        { key: "opus", short: "Opus 5", name: "Claude Opus 5", vendor: "Anthropic",
          flag: "🔶", color: "#E4653F", hot: true,
          released: "24 Jul 2026", open: false, ctx: "1.0M", pin: 5, pout: 25,
          win: "New #1 on intelligence, agents & reasoning" },
        { key: "fable", short: "Fable 5", name: "Claude Fable 5", vendor: "Anthropic",
          flag: "📖", color: "#9B7BF0",
          released: "9 Jun 2026", open: false, ctx: "1.0M", pin: 10, pout: 50,
          win: "Still tops SWE-bench Pro (~80% vs Opus 5's 79.2%)" },
        { key: "gpt", short: "Sol", name: "GPT-5.6 Sol", vendor: "OpenAI",
          flag: "☀️", color: "#37A64A",
          released: "Jul 2026", open: false, ctx: "1.1M", pin: 5, pout: 30,
          win: "Frontier intelligence at ~⅓ of Fable's cost" },
      ],
      charts: [
        { name: "Intelligence", sub: "AA Intelligence Index v4.1 · max effort",
          hint: "higher is better", lo: 50, hi: 63,
          bars: [{ m: "opus", v: 60.7 }, { m: "fable", v: 59.9 },
                 { m: "gpt", v: 58.9 }, { m: "kimi", v: 57.1 }] },
        { name: "Agentic knowledge work", sub: "GDPval-AA v2 · Elo",
          hint: "higher is better", lo: 1600, hi: 1900,
          bars: [{ m: "opus", v: 1861 }, { m: "fable", v: 1747 },
                 { m: "gpt", v: 1735 }, { m: "kimi", v: 1686 }] },
        { name: "Novel reasoning", sub: "ARC-AGI-3 · public demo · Fable = ARC Prize estimate",
          hint: "higher is better", lo: 0, hi: 34, suffix: "%",
          bars: [{ m: "opus", v: 30.2 }, { m: "fable", v: 20 },
                 { m: "gpt", v: 7.8 }, { m: "kimi", v: null, na: "not run" }] },
        { name: "Cost per task", sub: "Artificial Analysis · average across the index",
          hint: "lower is better", lo: 0, hi: 3, prefix: "$",
          bars: [{ m: "kimi", v: 0.94 }, { m: "gpt", v: 1.04 },
                 { m: "opus", v: 2.03 }, { m: "fable", v: 2.75 }] },
      ],
      foot: "Cost per task is what you actually pay for a finished job — Opus 5 is pricier per task than Sol, but 26% cheaper than Fable for equal-or-better answers. Same lesson as June's paper: the harness moves these numbers as much as the model, and every vendor runs its own.",
      source: "Sources: Artificial Analysis leaderboards (Index v4.1 max effort, GDPval-AA v2, cost/task) · ARC Prize (Fable-class ≈20%, not an official run) · vendor cards · re-verified 26 Jul 2026",
    },

    /* 5) "The open-weights letter" — a signatory wall, chart-free.
       Rendered by buildOpenWeights(). The argument here is the LOGO WALL: 50
       companies that normally agree on nothing, all signing the same page,
       with the two big absences left as empty chairs. Everything else on the
       slide is scaffolding around that one image.
         wall[]   one tile per signatory. `logo` = filename stem in
                  assets/news/openweights/ (Simple Icons, single-path, renders
                  black on a white tile); omit it and the tile falls back to a
                  typographic name plate — which is honest, since a third of the
                  signatories are startups with no logo anyone would recognise.
                  `c` is the brand hex, used ONLY as the tile's accent bar (the
                  marks stay black so they survive all six deck themes).
                  `late: true` = confirmed as joining on day two.
         absent[] the empty chairs. Same shape, rendered ghosted.
       Verified 26 Jul 2026 — the letter itself (microsoft.com/en-us/corporate-
       responsibility/topics/open-weight/, mirrored from nvidia.com) for the text
       and the 50-name signatory list; Jensen Huang's first X post, 24 Jul 2026;
       Forbes 25 Jul 2026 for 25 → 50 in a day and the confirmed day-two names;
       Tom's Hardware / Axios 20 Jul 2026 for the revived Chinese-model ban push;
       Hugging Face Spring 2026 report for the 41% download share. */
    openweights: {
      tag: "📜 Open weights",
      kicker: "Deep Dive · Policy",
      title: "Don't ban the download",
      emoji: "📜",
      navTitle: "Open weights letter",
      intro: "Jensen Huang's **first** post on X, ever, was a letter to Washington. **50** companies signed it in 48 hours — and the names missing are the story.",

      // The post that started it (recreated as a card so it works offline).
      tweet: {
        name: "Jensen Huang", handle: "@nvidia_jensen", avatar: "🟩",
        sub: "founder & CEO, NVIDIA · first post",
        date: "Jul 24, 2026", views: "first post ever",
        text: "Open models strengthen safety and cybersecurity, accelerate innovation and diffusion, and enable sovereignty.",
        foot: "Attached: “Open Weights and American AI Leadership”.",
      },

      // The signature counter. `day1` fills solid, the rest fills striped —
      // the whole point is that the second half arrived overnight.
      meter: {
        day1: 25, total: 50,
        head: "Signatures",
        d1Label: "25 on day one",
        d2Label: "+25 in the next 24 h",
        note: "In the second wave: OpenAI and Google — the two that made Friday's headlines for **not** signing.",
      },

      // Huang's actual argument: this decade is the 1980s rhyming. Two tracks,
      // same shape, so the parallel is seen before it's read.
      rhyme: {
        head: "The argument: we've had this fight before",
        rows: [
          { era: "1980s · source code", icon: "💾",
            claim: "“Software only advances if companies keep control of the code.”",
            beats: ["1983 · GNU", "1991 · Linux", "1998 · “open source”"],
            end: "Open source lost that argument, then ran the internet." },
          { era: "2020s · model weights", icon: "🧠", now: true,
            claim: "“Frontier AI is only safe if labs keep control of the weights.”",
            beats: ["2023 · Llama", "2025 · DeepSeek R1", "2026 · Kimi K3"],
            end: "41% of Hugging Face downloads are already Chinese open models." },
        ],
      },

      // What the letter actually asks for. Four, no more — they fit one strip.
      asksHead: "What they actually want",
      asks: [
        { icon: "🚫", head: "No premature bans",   body: "Don't push the work abroad." },
        { icon: "🖥️", head: "Compute for the rest", body: "Startups too, not just labs." },
        { icon: "📊", head: "Shared data & evals",  body: "Public datasets & benchmarks." },
        { icon: "⚖️", head: "Theft, not technique", body: "Distillation isn't stealing." },
      ],

      // The wall. Marquee marks first (recognition at projector distance),
      // then the long tail alphabetically. The letter itself lists all 50
      // alphabetically — see `source`.
      wallHead: "The 50 signatories",
      wallHint: "click to filter",
      filters: [
        { k: "all",  label: "All 50" },
        { k: "late", label: "Joined on day two" },
        { k: "out",  label: "Didn't sign" },
      ],
      wall: [
        { n: "NVIDIA",         logo: "nvidia",           c: "#76B900", lead: true },
        { n: "Microsoft",      logo: "microsoft",        c: "#5E5E5E" },
        { n: "Meta",           logo: "meta",             c: "#0467DF" },
        { n: "Google",         logo: "google",           c: "#4285F4", late: true },
        { n: "OpenAI",         logo: "openai",           c: "#412991", late: true },
        { n: "IBM",            logo: "ibm",              c: "#052FAD" },
        { n: "Dell",           logo: "dell",             c: "#007DB8" },
        { n: "GitHub",         logo: "github",           c: "#181717", late: true },
        { n: "Cisco",          logo: "cisco",            c: "#1BA0D7", late: true },
        { n: "AMD",            logo: "amd",              c: "#ED1C24", late: true },
        { n: "Cloudflare",     logo: "cloudflare",       c: "#F38020", late: true },
        { n: "Hugging Face",   logo: "huggingface",      c: "#FFD21E" },
        { n: "Mistral",        logo: "mistralai",        c: "#FA520F" },
        // Mozilla's mark is the "moz://a" wordmark — unreadable at tile size,
        // so it gets the typographic plate instead.
        { n: "Mozilla",        c: "#161616" },
        { n: "Linux Fdn.",     logo: "linuxfoundation",  c: "#003778" },
        { n: "Palantir",       logo: "palantir",         c: "#101113" },
        { n: "Palo Alto",      logo: "paloaltonetworks", c: "#F04E23" },
        { n: "Perplexity",     logo: "perplexity",       c: "#1FB8CD" },
        { n: "Replit",         logo: "replit",           c: "#F26207" },
        { n: "Ollama",         logo: "ollama",           c: "#000000", late: true },
        { n: "Box",            logo: "box",              c: "#0061D5" },
        { n: "DoorDash",       logo: "doordash",         c: "#FF3008" },
        { n: "Y Combinator",   logo: "ycombinator",      c: "#F0652F" },
        { n: "Block",          late: true },
        { n: "a16z" },
        { n: "AI21" },
        { n: "American Innovators Network" },
        { n: "AMP" },
        { n: "Arcee AI" },
        { n: "Arena" },
        { n: "Baseten" },
        { n: "Black Forest Labs" },
        { n: "Cohere" },
        { n: "CrowdStrike" },
        { n: "Emergence Capital" },
        { n: "Fireworks AI" },
        { n: "Genspark" },
        { n: "Inferact" },
        { n: "Interconnects AI" },
        { n: "Mariana Minerals" },
        { n: "Morph" },
        { n: "Nebius" },
        { n: "Nous Research" },
        { n: "OpenClaw" },
        { n: "Periodic Labs" },
        { n: "Prime Intellect" },
        { n: "Reflection" },
        { n: "ServiceNow" },
        { n: "Telnyx" },
        { n: "Trajectory" },
      ],
      // The empty chairs. Kept deliberately small — two tiles say more than a
      // paragraph about who has the most to lose from open weights.
      absentHead: "Still not on it",
      absent: [
        { n: "Anthropic", logo: "anthropic", c: "#191919",
          why: "Absent from every version of the letter." },
        { n: "Amazon",    logo: "amazon",    c: "#FF9900",
          why: "Also absent — and Anthropic's largest investor." },
      ],
      absentNote: "Google signed on day two; Anthropic and Amazon still haven't.",

      // Why the letter exists at all, in one line, in the footer.
      why: "Why now: Kimi K3 landed on 16 July at near-frontier quality, and Washington revived its push to ban Chinese AI models. The letter's quiet point — a downloaded weight file can't be recalled, disabled or access-controlled. A ban wouldn't reach Moonshot. It would reach the American startups building on it.",
      link: "https://www.microsoft.com/en-us/corporate-responsibility/topics/open-weight/",
      source: "Sources: the letter “Open Weights and American AI Leadership” (nvidia.com, mirrored at microsoft.com — signatories listed alphabetically there) · Jensen Huang on X, 24 Jul 2026 · Forbes, 25 Jul 2026 (25 → 50, day-two names) · Tom's Hardware / Axios, 20 Jul 2026 (ban push) · Hugging Face Spring 2026 report (41% of downloads) · verified 26 Jul 2026",
    },
  },

  /* ---- Last time's TOOL of the Month — the RETROSPECTIVE -----------------
     A look-back at the PREVIOUS codeforce's Tool of the Month (a live demo —
     NOT this month's upcoming `tool` below). Same "rewind" treatment as `news`.
     Renders as a stack; `layers` go bottom → top. `who` is the demoer(s);
     `url` is an optional QR.
     >>> PRE-FILLED with June 2026's Tool of the Month (recap of last time).
     NOTE: keep this a recap of what the room actually saw — the winning-agent
     breakdown is TONIGHT's `tool`/`demo`, so it's teased here, not recapped. */
  toolRecap: {
    tag:    "🛡️ Agent Systems",
    kicker: "Previously on the GenAI-Codeforce · Tool of the Month",
    title:  "Agent Systems in the Real World",
    blurb:  "A live double feature on the arena and the traps: building & scaling a global agent hackathon, then designing the challenges that make agents get hijacked.",
    who:    "Felix Krause & Rinat Abdullin",
    layers: [
      { icon: "🌍", head: "Scaling the arena",      body: "Felix Krause on building & scaling a global AI hackathon for autonomous agents." },
      { icon: "🎯", head: "Designing the breaks",   body: "Rinat Abdullin on crafting the challenges that make agents fail." },
      { icon: "▶️", head: "To be continued",        body: "One thing we didn't get to: how the agent that survived those traps actually works. That's tonight." },
    ],
    url:    "",
  },

  /* ---- Tool of the Month -------------------------------------------------
     THREE shapes are supported (engine.js auto-detects which to render):
       • Demo preview  -> set `repo` (+ optional `stats` / `beats`). A teaser for
                          a live demo of a public repo: the claim, the repo card
                          + QR and one animated strip. Nothing more — the demo
                          is the content, this slide is the hook you talk over.
                          Detail belongs in the `beats` hover notes, not on
                          screen: they're the host's crib sheet, invisible until
                          you point at one.
       • "Triple feature" -> set `features` (the live line-up) and, optionally,
                          `defenses` (click-to-reveal pillars).
       • Simple single tool -> just { name, blurb, url }.
     >>> Filled in for July 2026: Bernhard's PAC agent, demoed live. */
  tool: {
    tag:    "🛡️ Agent Systems",
    kicker: "Tool of the Month · Live demo",
    title:  "One Agent vs. 104 Hostile Tasks",
    blurb:  "Every file it had to read was trying to hijack it. Bernhard's agent came first — and the repo is public.",
    // The public reference implementation being demoed. `url` is the QR target.
    repo: {
      owner: "Kanevry",
      name:  "bitgn-pac-agent-public",
      desc:  "Defense-in-depth personal agent: layered prompt-injection hardening, native tool calling.",
      stack: ["TypeScript", "Vercel AI SDK v6", "ConnectRPC"],
    },
    // Two attention tiles. `big` counts up on slide entry when it's a number.
    stats: [
      { big: "1st", label: "BitGN Personal Agent Challenge", sub: "on-site, Vienna · 11 Apr 2026" },
      { big: "104", label: "hostile tasks, blind scoring",   sub: "fresh workspace each, no retries" },
    ],
    // The one animated element: a task crossing the agent's defenses. Keep the
    // labels to a word — the `note` is hover-only, for the host.
    beats: {
      title: "One task, end to end",
      hint:  "hover a beat",
      nodes: [
        { icon: "📨", name: "task",     note: "A plain-language task plus a workspace tree it has never seen — some of whose files lie." },
        { icon: "🧠", name: "decide",   note: "Soft SGR: STATE → PLAN reasoning, then the model picks one tool call or declares it's done." },
        { icon: "🚧", name: "gates",    stop: true, note: "Before anything executes: path traversal blocked (B1), PII lookups refused (B2), destructive actions and exploration spirals braked (B4)." },
        { icon: "⚡", name: "dispatch", note: "The only way to touch the workspace: a narrow, typed tool API over ConnectRPC. No shell, no network." },
        { icon: "🧪", name: "scan",     stop: true, note: "Everything read is scanned for injection and phishing (security.ts), and vendor secrets are stripped before the model sees them (B5)." },
        { icon: "✅", name: "submit",   note: "Nothing submits without grounding refs that check out (B3). Scored on side effects — which tools ran, which files moved — not on prose." },
      ],
    },
    who:  "Bernhard Götzendorfer",
    url:  "https://github.com/Kanevry/bitgn-pac-agent-public",
    // (Simple-mode fallback only — used if you delete `repo` and `features`.)
    name: "BitGN PAC Agent",
  },

  /* ---- Live demo slot (usually someone else drives) ----------------------- */
  demo: {
    title: "Live Demo",
    presenter: "Bernhard Götzendorfer",
    blurb: "Hand over the screen — Bernhard runs the PAC agent live.",
  },
};

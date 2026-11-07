# storiesAI — a bedtime fairy tale PWA

**storiesAI** is an installable, offline-first progressive web app that writes a fresh, personalized
bedtime story for a child: name, age, value, place, mood → one gentle tale with music, tappable
golden sound words, voice guidance for the parent, a saved library and a "Stars" credit system.

The experience is modelled on the flow and visual language of [fiabamia.com](https://www.fiabamia.com/)
— a full-bleed, scroll-driven night sky where every chapter is a scene — rebuilt by hand in vanilla
HTML/CSS/JS with its own particle engine, its own offline story weaver and the **storiesAI** brand.

---

## Run it

The deliverable is **`index.html`**: a single self-contained page. Fonts (5 × woff2), CSS, JS and
the particle sky are all inlined — no CDN, no network, no build step needed to view it.

```bash
cd chandni-pwa
python3 -m http.server 8000 --bind 0.0.0.0
# open http://localhost:8000/index.html
```

Any static host works (GitHub Pages, Netlify, Cloudflare Pages, S3, …).
**HTTPS (or localhost) is required** for the service worker and the install prompt.

### Install on a device
- **Android / Chrome / Edge:** browser menu → *Install app* (or the **INSTALL** pill in the top bar).
- **iPhone / iPad / Safari:** Share → *Add to Home Screen*.
- **Desktop:** install icon in the address bar, or browser menu → *Install storiesAI*.

Once installed, the shell, the particle sky, music and stories all work with no connection.

---

## The experience

| Chapter | What happens |
|---|---|
| **The world** | A hand-written WebGL particle world (no libraries): aurora sky with stars, Milky Way, moon and shooting stars; a hill silhouette; a forest of particle conifers; a glowing golden path; hot-air balloons; and set pieces met along the flight — a spiral vortex, a tree of light, rising lanterns, a ring of shooting stars and a castle. The camera flies down the path as you scroll, exactly like the reference. ~95k points on desktop, ~66k on phones; falls back to the 2D canvas sky if WebGL is unavailable. |
| **Cursor** | A custom two-part pointer like the reference: a cream dot that tracks instantly with a gold trailing halo that swells on anything clickable; primary buttons are magnetic and lean towards the pointer. Silently disabled on touch and for `prefers-reduced-motion`. |
| **I · Prologue** | Full-bleed starfield, giant Fraunces italic "No one has ever told it…", `LISTEN WITH SOUND`, `SCROLL TO ENTER`. Fixed wordmark, `SIGN IN`, `CREATE A STORY`, vertical `AWAKE / ASLEEP` rail. |
| **II · The journey** | "Personalized bedtime stories for children" → "A story made to measure" (five mini features) → statement scene "And a little villain." with particle pull-in. |
| **III · The music** | Four moods as audible pills (Gentle / Adventurous / Magical / Relaxing); the sky switches to a radial particle burst. |
| **IV · The sounds** | Golden words inside real sentences — tap *wind*, *bells*, *thunderstorm*; music ducks under each one. The sky becomes a particle tree. |
| **V · The voice** | Four chapter voice colours (Green / Yellow / Blue / Red) with the reading hint for each. |
| **VI · The ages** | Five age groups, community counter, twelve parent reviews on a snap track. |
| **VII · Goodnight** | Star pouches (free in this edition), "How a storiesAI story is born", FAQ accordion. |
| **VIII · The end** | Happily-ever-after CTA and footer. |

The particle sky is a single canvas (`src/stars.js`) with nine choreographed modes — starfield,
nebula drift, spiral vortex, luminous ring, radial burst, tree of light, soft wave, constellation,
gold rain — switched by scroll position. Chrome (chapter label, rail dot, scroll cue) follows the
scenes; the rail is also a chapter menu on hover.

## The app

| Area | Details |
|---|---|
| **Create a story** | 5-step wizard: hero name(s) and type (single tale / bedtime series) → age group and length → value → place → mood, story language, optional little villain, free-text extras. Live "Tonight's ingredients" summary and Stars pouch. |
| **Story engine (offline)** | Seeded, age-aware sentence banks (`soft` / `bright` / `wise`) compose 3–5 chapters (~3, 5 or 7 minutes), insert tappable sound words, assign a voice colour per chapter, write a title and three discussion questions. Different every run. No API, no cost. |
| **Generating screen** | "Weaving tonight's story…" progress; the reader opens on its own. |
| **Reader** | Colours and scenery change with the story (12 settings × 4 moods → inline SVG worlds), per-chapter voice guidance, golden sound words, read-aloud, font size, share, print, series continuation, three "let's talk about it" questions, theme resets when you leave. |
| **Library** | Saved on the device, filters (All / English / Hindi / Bengali / Series), JSON export + import, delete, Star pouch, stable invite code. |
| **Languages** | English interface; stories in **English**, **हिन्दी** or **বাংলা**. Read-aloud uses the device voices (`en-IN` / `hi-IN` / `bn-IN`). |
| **Audio** | Everything is synthesised live with the Web Audio API — four ambient mood scores and twelve sound effects. No audio files. |
| **PWA** | `manifest.webmanifest` (standalone, shortcuts, maskable icon), `sw.js` (offline shell, navigation fallback), install prompt, offline badge. |
| **Privacy** | All state is in `localStorage` (`storiesai.v1`). No accounts, no analytics, no uploads. Settings → *Clear all data*. |

---

## Optional: bring your own AI storyteller

Offline generation is the default and always works. For LLM-written prose open **Settings → Bring
your own AI** and add any OpenAI-compatible chat-completions endpoint:

| Field | Example |
|---|---|
| Endpoint | `https://api.openai.com/v1/chat/completions` or `http://localhost:11434/v1/chat/completions` (Ollama) |
| API key | `sk-…` (blank for local servers) |
| Model | `gpt-4o-mini`, `llama3.2`, … |

The prompt asks for strict JSON (`title`, `chapters[{title, voice, text}]`, `questions[]`) with
`[[sfx|word]]` sound tokens, age-appropriate language and bedtime-safe content. If the request
fails, times out (20 s), is blocked by CORS or returns unusable data, storiesAI **silently falls
back to the offline weaver** and says so in the reader.

> The endpoint must allow browser (CORS) requests. Your key is stored only in this browser and sent
> only to that endpoint; for a public deployment use a small server-side proxy instead of a secret
> key in a static page.

---

## Files

```
chandni-pwa/
├── index.html              ← THE DELIVERABLE (~500 KB, self-contained, built)
├── manifest.webmanifest    ← PWA metadata + shortcuts
├── sw.js                   ← offline service worker (cache storiesai-shell-v2)
├── icons/                  ← 192, 512, maskable, apple-touch, favicon (storiesAI spark)
├── assets/
│   ├── fonts/              ← 5 self-hosted woff2 (Fraunces ×2, Cormorant italic, Jost, Nunito)
│   ├── hero-night.jpg/png  ← legacy artwork, no longer used by the landing
│   └── mark.svg            ← gold spark mark
├── src/                    ← editable sources
│   ├── index.template.html ← 12 home scenes + create/generating/story/library views
│   ├── fonts.css           ← @font-face block, base64 placeholders filled at build time
│   ├── styles.css          ← full cinematic design system
│   ├── data.js             ← options, themes, EN/HI/BN phrase banks, FAQ, reviews
│   ├── audio.js            ← Web Audio music + SFX + speech synthesis
│   ├── engine.js           ← offline weaver + optional AI client + text renderer
│   ├── stars.js            ← window.CStars 2D fallback sky (9 modes)
│   ├── world.js            ← window.CWorld WebGL particle world + camera flight
│   ├── cursor.js           ← window.CCursor custom cursor + magnetic buttons
│   └── app.js              ← state, routing, views, scroll choreography, PWA wiring
├── build.py                ← inlines fonts + CSS + JS into index.html
├── make_assets.py          ← regenerates the icons and mark
└── tests/
    ├── smoke.js            ← headless DOM flow tests (jsdom)
    ├── screenshots.js      ← Playwright desktop + mobile visual walk
    ├── offline-check.js    ← real service-worker offline reload
    ├── reference-capture.js, ref-wheel.js  ← reference-site capture helpers
    └── shots/              ← screenshots of the built app
```

### Customize

```bash
python3 make_assets.py     # only if you change the artwork/icons
python3 build.py           # regenerates index.html (fonts + CSS + JS inlined)
```

Brand name and metadata live in `src/index.template.html`, `manifest.webmanifest`, `sw.js` and the
`--gold` / `--ink` / sky variables in `src/styles.css`. Scenes and copy: `src/index.template.html`.
Options, palettes and phrase banks: `src/data.js`. Particle choreography: `src/stars.js`.

### Tests

```bash
npm install --no-save jsdom playwright && npx playwright install chromium
python3 -m http.server 8000 --bind 0.0.0.0 &
node tests/smoke.js        # landing, EN/HI/BN generation, wizard, reader, library, AI fallback
node tests/screenshots.js  # 24 desktop + mobile screenshots, fails on any console/page error
node tests/offline-check.js
node tests/cursor-shots.js  # cursor + magnetic hover behaviour
node tests/world-check.js   # WebGL world boots + screenshots along the flight
```

---

## Motion on phones

The scroll choreography is tuned separately for touch devices, so the phone build animates at
frame rate instead of dropping the show:

- **No blur filters on touch.** The scene fades use opacity + a short lift; the desktop-only
  `blur()`/`scale()` parallax is what iOS silently drops (and it is the most expensive thing on
  the page). `will-change` is only applied to scenes that are actually near the viewport.
- **One rAF ticker** drives the scenes, the rail dot and the particle flight, so the fades follow
  a finger on every mobile browser — not only when `scroll` events happen to arrive.
- **The night sky is a fixed layer**, not a `background-attachment: fixed` on `<body>` (ignored by
  iOS Safari, a full repaint per frame on Android).
- **WebGL context loss is handled**: when a phone drops the GL context (backgrounded tab, memory
  pressure) the app falls back to the animated 2D sky instead of freezing on a black canvas.
- **`prefers-reduced-motion` is respected but no longer freezes the page.** Fades stay, movement
  and blur are removed. If the phone is set to reduce motion (accessibility setting, *remove
  animations*, or battery saver) the app offers **☰ → Motion: full** to bring the full show back,
  for just that device.
- `vh` fallbacks for every `svh`, safe-area padding for notches, and the chapter rail is kept as a
  slim progress line (it used to be hidden below 1000 px).
- **The flying world defends itself**: it retries context creation with conservative options, catches
  a renderer that throws (instead of dying silently inside a rAF loop), and if the device holds
  under ~26 fps it drops its render resolution once and then hands over to the 2D sky (~1 s later,
  not after two slow windows).

### The book of stars (prologue)

The prologue set piece is the Fiabamia gesture: the night sky **gathers itself into an open
book** in front of the camera, turns one page, then dissolves back into stars as you scroll on.

- **How it is drawn.** Particles, not an image: a vertex shader (`BOOK_V`) morphs every point from a
  hashed dust cloud into its place on a page. Each point carries `aSide, aUV, aCol, aSize, aSeed,
  aTurn`; the page uses a hinge rotation `ang = uTurn·π·aTurn`, a `sin(u·π)` bow so paper reads as
  paper, and a faint idle breath so it is never quite still.
- **What is on the pages.** A sparse paper grain, rows of handwriting dots with ragged ends and a
  first-line indent, an illuminated gold drop cap, the chapter rule, page numerals and the gold
  spine — plus real letterforms sampled from a canvas (`bookType()`), which appear as particles
  where a 2D context is available.
- **Budget.** 1 496 points on phones, 3 004 on desktop (the whole scene stays around 40–90 k
  points). The shader adds ~6 `sin` per vertex and no per-pixel work beyond the existing point
  sprite.
- **Timeline.** Gathers 0.35 → 2.05 s after boot; the page turn is driven by scroll
  (`prog / 0.055`), so a page swings while the hero is still on screen; the book starts leaving at
  6 % progress and is gone by ~9 %, back into the starfield. The hero copy arrives in order
  (kicker → display line → drawn gold rule → listen pill) as the book assembles.
- **Reduced motion** collapses all of it to a still frame, and the hero copy is not hidden if the
  animation cannot run.

### The world dial (story settings)

Every story setting owns a world, and the builder shows it to you: tapping a place in
**Create** re-dresses the night behind the form, so the place you pick is the place you see while
you pick it.

- **Sky.** The reference sky's `uTop` / `uBot` / `uHor` / `uAcc` were constants; they are now state
  that eases towards the chosen setting's palette (taken from the same `SETTINGS` array the reader
  already uses, so the builder, the cover and the reader never disagree).
- **Horizon.** The three-sine horizon profile became uniforms too — three amplitudes,
  frequencies and phases, plus a blocky term for crenellations and city roofs and a ground tint.
  `forest` gets tall spiky conifers, `castle` low towers with battlements, `city` roof blocks,
  `mountain` and `glacier` slow ridges, `sea` / `island` / `ship` a flat water line, `farm` a low
  rolling hill, `space` no ground at all. Unknown scenes fall back to `forest`.
- **Cost.** Same three `sin` per pixel as before (the old horizon was three sines), one `step`, and
  a handful of extra uniform uploads per frame. No new draw calls, no rebuilt buffers, no change
  to the point budget — the phone's 30 fps / 0.85× dpr envelope is untouched.
- **Page palette.** `--sky-top`, `--sky-bottom`, `--accent`, `--gold`, `--gold-2` and `--gold-deep`
  ease over ~600 ms in the same rAF, so the gradient, the pills and the captions turn over with the
  sky. Leaving **Create** eases everything back to the plain night.
- **Reduced motion** snaps instead of gliding. `?debug=1` now also prints the current world.

### Why the sky used to crawl on a phone

The sky is a full-screen fragment shader and it was written for a desktop GPU:

| | desktop | phone (now) |
|---|---|---|
| aurora noise | 5-octave fbm + two 3-octave fbm passes (~44 `sin` per pixel) | 2-octave fbm, one detail pass (~12) |
| render scale | up to 1.6× device pixels | 0.85× CSS pixels |
| frame rate | 60 fps | capped at 30 (a drifting sky does not need 60) |
| point ceiling | 13 px | 7 px (fill rate) |
| moon | `pow(md, 1600.0)` | `exp(-k·d²)` on the angular distance |

That last row is what painted a giant white disc over the hero on Android: GPUs whose "highp" is
really medium precision overflow `pow(x, 1600)` to Inf. The same maths also avoids the reversed
`smoothstep` edges the shooting-star streaks used, which some mobile drivers do not define.

Two more phone costs are gone: the choreography no longer reads `scrollHeight` (a forced layout)
or rebuilds the rail chapter's markup on every scroll frame, and the particle world is built one
frame after the hero paints instead of blocking the first render.

### If the sky on a phone is still a still picture

1. **Is the new build deployed?** Open ☰ — if there is no *Motion:* row, the host is serving an older
   `index.html`. Merging a commit does not redeploy Netlify by itself (Netlify → *Deploys* →
   *Trigger deploy*, or re-drop the folder). Installed apps may also need one close/reopen for the
   `storiesai-shell-v4` service worker to take over.
2. **`?debug=1`** on the URL adds a small readout of what the GPU is really doing: WebGL up or not
   (and why), frame rate, point budget, quality step, whether the 2D sky is running, the reduced
   motion flag and the viewport. A screenshot of that box identifies the cause immediately.
3. **☰ → Sky: 2D stars** swaps the WebGL flight for the much cheaper animated canvas sky on that
   device (choose *flying world* to go back; that one reloads).

---

## Honest limitations

- **Front-end only.** No server, email sign-in, payment or real invite system; Stars are free (no prices are shown anywhere), and the community
  counter and parent reviews are illustrative demo content. State lives in one browser.
- Offline stories are composed from templates: varied and coherent, but not as free-ranging as an
  LLM — that is what the optional AI hook is for.
- Read-aloud depends on the voices installed on the device; some browsers ship no Hindi or Bengali
  voice, and the interface itself is English.
- The visual language deliberately follows the reference site's layout, typography and scroll
  choreography; all code, particle engine, story engine, icons and prose are written for this
  project, and no reference assets are copied.

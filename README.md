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

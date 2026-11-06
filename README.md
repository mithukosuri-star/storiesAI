# FiabaMia — an immersive recreation

A self-contained recreation of [fiabamia.com](https://www.fiabamia.com/): a night-sky WebGL scene,
the full section flow, working generative music, and real interactive sounds. No iframes, no
external assets — it runs entirely on its own.

## Why it was rebuilt (and not framed)

The first attempt wrapped the live site in an iframe. That could never work here: the sandbox's TLS
connection to `www.fiabamia.com` is refused (`SSL_ERROR_SYSCALL`), and no browser binary is
installable (the Playwright download is blocked by the network allowlist). The site's 3D assets also
live privately inside its Next.js bundle, so an exact copy of its files is not obtainable. This is an
original recreation of the experience, not a byte-for-byte clone.

## What's real

- **WebGL night sky** (three.js) — 3,000 GPU stars with a custom twinkle shader, a mottled golden
  moon in fragment-shader noise, a pulsing halo, drifting dust motes, and pointer + scroll parallax.
- **Generative music** — four moods (gentle, adventurous, magical, relaxing), each a live Web Audio
  arpeggio with its own scale, tempo, filter, timbre and synthetic reverb tail.
- **Interactive golden words** — wind (bandpass-swept noise), bells (additive shimmer partials),
  thunder (sub-bass + filtered rumble). The music ducks automatically so effects have room.
- **Voice colors** — each of the four pitches a distinct chime through the shared master gain.
- **Section flow** — hero, made-to-measure, moods, golden words, voice colors, ages with an animated
  counter, a 28-card review marquee, star packs, how-it-works, FAQ, closer.
- **Polish** — scroll-progress bar, reveal-on-intersection with stagger, entry veil that dismisses on
  scroll or keypress, sound toggle that respects autoplay policy, `prefers-reduced-motion` support,
  and a CSS fallback if WebGL is unavailable.

Audio only starts after a deliberate gesture (entry button, sound toggle, or a tap on a sound), so
browser autoplay policies never block it.

## Run

```bash
cd app
npm install
npm run dev      # http://localhost:5173
npm run build    # production bundle in app/dist
```

The dev server binds `0.0.0.0` with permissive hosts so the sandbox live preview works directly.

## Attribution

FiabaMia's concept, copy and brand belong to FiabaMia. This is a non-commercial homage built for
demonstration; all code, shaders and audio are original.

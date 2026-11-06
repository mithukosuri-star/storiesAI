# FiabaMia — immersive stage

A faithful stage around [fiabamia.com](https://www.fiabamia.com/): the original experience runs
inside the frame **unmodified**, so every scroll-driven 3D animation, stardust particle field,
transition and sound cue is the real thing rather than a reproduction.

## Why a frame instead of a rebuild

The live site's 3D assets are private to its Next.js bundle, and the sandbox cannot reach them
(TLS is refused for `www.fiabamia.com`). Its server also sends **no `X-Frame-Options` and no
`frame-ancestors` CSP directive**, so embedding is permitted — that is what keeps the animations
byte-for-byte identical.

## What the shell adds

- **Seamless entry** — a hand-built night-sky poster (golden moon, drifting starfield) fades into
  the real scene once the frame paints, so there is no white flash.
- **Immersive mode** — native fullscreen (button or `F`) with a clean, vignette-only view.
- **Restart** — button or `R` reloads the experience back to its first scene.
- **Idle-dim HUD** — controls fade to 28% opacity when untouched, fully hidden in immersive mode.
- **Graceful fallback** — if a browser refuses embedded pages, a styled card offers to open the
  story in its own window instead of showing a blank rectangle.
- **Keyboard + a11y** — ARIA state on the controls, visible focus rings, `prefers-reduced-motion`
  respected in the shell's own animations.

## Run

```bash
cd app
npm install
npm run dev      # http://localhost:5173
npm run build    # production bundle in app/dist
```

The dev server binds to `0.0.0.0` with permissive hosts so the sandbox live preview works directly.

## Notes

- The HUD controls live outside the iframe and never modify the framed page.
- "Open" (or the fallback CTA) launches fiabamia.com in its own tab.
- Attribution: content, animation and audio belong to FiabaMia. This shell is a wrapper only.

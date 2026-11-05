import { createServer } from 'vite'
import React from 'react'
import { renderToString } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'

const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' })

const pages = [
  ['/', 'Landing'],
  ['/create', 'Create'],
  ['/library', 'Library'],
  ['/story/nope', 'StoryPage'],
]

let failed = false
for (const [route, name] of pages) {
  try {
    const mod = await vite.ssrLoadModule(`/src/pages/${name}.tsx`)
    const Comp = mod.default
    const storeMod = await vite.ssrLoadModule('/src/lib/store.tsx')
    const overlays = await vite.ssrLoadModule('/src/components/Overlays.tsx')
    const html = renderToString(
      React.createElement(
        MemoryRouter,
        { initialEntries: [route] },
        React.createElement(
          storeMod.StoreProvider,
          null,
          React.createElement(overlays.ToastProvider, null, React.createElement(Comp)),
        ),
      ),
    )
    console.log(`${route} ✓ ${html.length} bytes`)
  } catch (e) {
    failed = true
    console.error(`${route} ✗`, e.message)
    console.error(e.stack?.split('\n').slice(0, 6).join('\n'))
  }
}

// engine sanity
const { generateStory } = await vite.ssrLoadModule('/src/lib/storyEngine.ts')
for (const band of ['0–2', '5–6', '9–10']) {
  const s = generateStory({ kind: 'single', names: ['Arianna'], band, valueId: 'courage', placeId: 'forest', moodId: 'gentle', villain: true, length: 'medium' })
  console.log(`story ${band}: "${s.title}" ${s.chapters.length} ch, ${s.words} words, ${s.minutes} min, golden=${s.chapters.reduce((a, c) => a + c.goldenCount, 0)}`)
}
await vite.close()
process.exit(failed ? 1 : 0)

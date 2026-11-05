import { createServer } from 'vite'
const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' })
const { generateStory } = await vite.ssrLoadModule('/src/lib/storyEngine.ts')
for (const band of ['0–2','3–4']) {
  const s = generateStory({ kind:'single', names:['Nina'], band, valueId:'kindness', placeId:'farm', moodId:'relaxing', villain:false, length:'short' })
  console.log(`\n===== ${band} · ${s.title} · ${s.words}w =====`)
  for (const c of s.chapters) {
    console.log(`\n## ${c.title} [${c.voice}]`)
    for (const p of c.paragraphs) console.log(p.map(x=>typeof x==='string'?x:`*${x.word}*`).join(''))
  }
}
await vite.close()

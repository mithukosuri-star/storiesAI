import { createServer } from 'vite'
const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' })
const { generateStory } = await vite.ssrLoadModule('/src/lib/storyEngine.ts')
const s = generateStory({ kind: 'single', names: ['Arianna'], band: '5–6', valueId: 'courage', placeId: 'forest', moodId: 'magical', villain: true, length: 'long' })
let out = `${s.title}\n${s.dedication}\n${s.words} words · ${s.minutes} min\n\n`
for (const c of s.chapters) {
  out += `\n## ${c.title}  [${c.voice}]\n\n`
  for (const p of c.paragraphs) out += p.map((x) => (typeof x === 'string' ? x : `*${x.word}*(${x.sound})`)).join('') + '\n\n'
}
out += `\nQuestions:\n` + s.questions.map((q, i) => `${i + 1}. ${q}`).join('\n')
console.log(out)
await vite.close()

import sharp from 'sharp'
import { mkdir } from 'node:fs/promises'

const inner = (pad) => `
  <g transform="translate(${pad} ${pad}) scale(${(512 - pad * 2) / 512})">
    <defs>
      <linearGradient id="gold${pad}" x1="0.15" y1="0" x2="0.85" y2="1">
        <stop offset="0" stop-color="#f9ecc7"/><stop offset="0.45" stop-color="#e0bd80"/><stop offset="1" stop-color="#a97c3c"/>
      </linearGradient>
      <mask id="moon${pad}">
        <rect x="0" y="0" width="512" height="512" fill="#fff"/>
        <circle cx="330" cy="198" r="112" fill="#000"/>
      </mask>
    </defs>
    <circle cx="256" cy="240" r="215" fill="url(#glow)"/>
    <circle cx="256" cy="256" r="152" fill="none" stroke="#e0bd80" stroke-opacity="0.20" stroke-width="1.4"/>
    <circle cx="252" cy="262" r="120" fill="url(#gold${pad})" mask="url(#moon${pad})"/>
    <path d="M366 170l10.5 26 26 10.5-26 10.5-10.5 26-10.5-26-26-10.5 26-10.5z" fill="#f9ecc7"/>
    <circle cx="180" cy="198" r="5.5" fill="#f9ecc7" opacity="0.85"/>
    <circle cx="158" cy="330" r="4" fill="#f9ecc7" opacity="0.6"/>
    <circle cx="326" cy="366" r="3.4" fill="#f9ecc7" opacity="0.5"/>
  </g>`

const svg = (pad) => `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <radialGradient id="bg" cx="50%" cy="28%" r="85%">
      <stop offset="0" stop-color="#1d2848"/><stop offset="0.55" stop-color="#0d1326"/><stop offset="1" stop-color="#070a12"/>
    </radialGradient>
    <radialGradient id="glow" cx="50%" cy="50%" r="50%">
      <stop offset="0" stop-color="#e9c88d" stop-opacity="0.22"/><stop offset="1" stop-color="#e9c88d" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="512" height="512" fill="url(#bg)"/>
  ${inner(pad)}
</svg>`

await mkdir('public/icons', { recursive: true })
const jobs = [
  ['public/icons/icon-192.png', 192, 22],
  ['public/icons/icon-512.png', 512, 58],
  ['public/icons/maskable-512.png', 512, 96],
  ['public/icons/apple-touch-icon.png', 180, 0],
]
for (const [out, size, pad] of jobs) {
  await sharp(Buffer.from(svg(pad))).resize(size, size).png().toFile(out)
  console.log('wrote', out)
}

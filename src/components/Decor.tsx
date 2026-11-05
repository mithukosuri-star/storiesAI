import { useEffect, useRef } from 'react'

/** A quiet, real star field. Slow parallax, occasional shooting star. */
export function Starfield() {
  const ref = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let raf = 0
    let w = 0
    let h = 0
    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    type Star = { x: number; y: number; r: number; a: number; sp: number; ph: number; layer: number }
    type Shooter = { x: number; y: number; vx: number; vy: number; life: number }
    let stars: Star[] = []
    let shooters: Shooter[] = []
    let t = 0

    const build = () => {
      w = canvas.clientWidth
      h = canvas.clientHeight
      canvas.width = Math.floor(w * dpr)
      canvas.height = Math.floor(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const count = Math.min(320, Math.floor((w * h) / 5200))
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.25 + 0.25,
        a: Math.random() * 0.6 + 0.15,
        sp: Math.random() * 0.03 + 0.008,
        ph: Math.random() * Math.PI * 2,
        layer: Math.random(),
      }))
    }

    const draw = () => {
      t += 1
      ctx.clearRect(0, 0, w, h)
      const scrollY = window.scrollY
      for (const s of stars) {
        const tw = 0.55 + 0.45 * Math.sin(t * s.sp + s.ph)
        const y = (s.y - scrollY * s.layer * 0.12 + h) % h
        ctx.globalAlpha = s.a * tw
        ctx.fillStyle = s.layer > 0.86 ? '#f4e2b9' : '#dfe6f5'
        ctx.beginPath()
        ctx.arc(s.x, y, s.r, 0, Math.PI * 2)
        ctx.fill()
        if (s.r > 1.05) {
          ctx.globalAlpha = s.a * tw * 0.22
          ctx.beginPath()
          ctx.arc(s.x, y, s.r * 4.5, 0, Math.PI * 2)
          ctx.fill()
        }
      }
      ctx.globalAlpha = 1

      if (!reduce && Math.random() < 0.0026 && shooters.length < 2) {
        shooters.push({
          x: Math.random() * w * 0.8,
          y: Math.random() * h * 0.45,
          vx: 3.4 + Math.random() * 2,
          vy: 1.1 + Math.random() * 0.8,
          life: 1,
        })
      }
      shooters = shooters.filter((sh) => {
        sh.x += sh.vx
        sh.y += sh.vy
        sh.life -= 0.012
        if (sh.life <= 0) return false
        const grad = ctx.createLinearGradient(sh.x, sh.y, sh.x - sh.vx * 22, sh.y - sh.vy * 22)
        grad.addColorStop(0, `rgba(244,226,185,${sh.life * 0.85})`)
        grad.addColorStop(1, 'rgba(244,226,185,0)')
        ctx.strokeStyle = grad
        ctx.lineWidth = 1.1
        ctx.beginPath()
        ctx.moveTo(sh.x, sh.y)
        ctx.lineTo(sh.x - sh.vx * 22, sh.y - sh.vy * 22)
        ctx.stroke()
        return true
      })

      raf = requestAnimationFrame(draw)
    }

    build()
    draw()
    const onResize = () => build()
    window.addEventListener('resize', onResize)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  return <canvas ref={ref} className="stars-canvas" aria-hidden="true" />
}

/** Hills, pines and a sleeping village — pure SVG, so it scales and weighs nothing. */
export function Landscape() {
  return (
    <svg className="landscape" viewBox="0 0 1440 320" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="hillBack" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#101a30" />
          <stop offset="1" stopColor="#080d19" />
        </linearGradient>
        <linearGradient id="hillMid" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0c1425" />
          <stop offset="1" stopColor="#060a14" />
        </linearGradient>
        <linearGradient id="hillFront" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#070b15" />
          <stop offset="1" stopColor="#04070d" />
        </linearGradient>
      </defs>
      <path d="M0 208c120-44 214-18 322-46 108-28 176-70 288-62 112 8 186 60 300 66 114 6 200-36 530-18v172H0Z" fill="url(#hillBack)" opacity=".9" />
      <path d="M0 244c150-36 236 6 358-22 122-28 176-64 300-54 124 10 194 58 314 58 120 0 224-44 468-22v116H0Z" fill="url(#hillMid)" />
      <g fill="url(#hillFront)">
        <path d="M0 280c140-18 250 4 380-8 130-12 226-38 356-30 130 8 250 32 370 24 120-8 214-30 334-16v70H0Z" />
        <g>
          {[70, 108, 146, 190, 232, 274, 318, 360, 404, 448, 492, 536, 580, 624, 668, 712, 756, 800, 844, 888, 932, 976, 1020, 1064, 1108, 1152, 1196, 1240, 1284, 1328, 1372].map((x, i) => {
            const height = 26 + ((i * 13) % 34)
            return (
              <path
                key={x}
                d={`M${x} 300 l${height * 0.42} ${-height} l${height * 0.42} ${height} z`}
                opacity={i % 3 === 0 ? 0.9 : 0.65}
              />
            )
          })}
        </g>
      </g>
      {/* a lit window, far away */}
      <rect x="668" y="292" width="2.4" height="2.4" fill="#e9c88d" opacity=".8" />
      <rect x="986" y="296" width="1.8" height="1.8" fill="#e9c88d" opacity=".55" />
    </svg>
  )
}

export function MoonGlyph({ className = 'finale-moon' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 120" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="moonGold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f7e6bb" />
          <stop offset=".6" stopColor="#dcb87c" />
          <stop offset="1" stopColor="#a97c3c" />
        </linearGradient>
      </defs>
      <circle cx="60" cy="60" r="52" stroke="currentColor" strokeOpacity=".18" />
      <path d="M70.5 22a42 42 0 1 0 0 76 34 34 0 1 1 0-76Z" fill="url(#moonGold)" />
      <path d="m92 30 2.6 6.4L101 39l-6.4 2.6L92 48l-2.6-6.4L83 39l6.4-2.6L92 30Z" fill="#f7e6bb" />
      <circle cx="34" cy="44" r="1.8" fill="#f7e6bb" opacity=".8" />
      <circle cx="42" cy="84" r="1.3" fill="#f7e6bb" opacity=".55" />
    </svg>
  )
}

/** Soft moving dust motes on top of sections. */
export function Motes() {
  return (
    <div aria-hidden="true" className="motes">
      {Array.from({ length: 14 }).map((_, i) => (
        <span
          key={i}
          style={{
            left: `${(i * 37) % 100}%`,
            animationDelay: `${(i % 7) * 1.6}s`,
            animationDuration: `${16 + (i % 5) * 4}s`,
            opacity: 0.15 + (i % 4) * 0.07,
            width: `${1 + (i % 3)}px`,
            height: `${1 + (i % 3)}px`,
          }}
        />
      ))}
    </div>
  )
}

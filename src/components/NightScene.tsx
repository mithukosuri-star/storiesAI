import { useEffect, useRef, useState } from 'react'
import { Starfield } from './Decor'
import type { NightHandle } from '../three/nightScene'

/**
 * Mounts the WebGL night behind the site.
 *
 * Each mount creates its own <canvas>, because a canvas whose WebGL context has
 * been disposed can never hand out a new one — and React Strict Mode mounts
 * effects twice in development.
 * If the device cannot do WebGL, we step politely aside for the flat star field.
 */
export function NightScene() {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const [fallback, setFallback] = useState(false)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    let webgl = false
    try {
      const probe = document.createElement('canvas')
      webgl = !!(probe.getContext('webgl2') || probe.getContext('webgl'))
      probe.width = probe.height = 1
    } catch {
      webgl = false
    }
    if (!webgl) {
      setFallback(true)
      return
    }

    const canvas = document.createElement('canvas')
    canvas.className = 'night-canvas'
    canvas.setAttribute('aria-hidden', 'true')
    host.appendChild(canvas)

    let handle: NightHandle | null = null
    let cancelled = false
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    import('../three/nightScene')
      .then((mod) => mod.mountNightScene(canvas, { reduce }))
      .then((h) => {
        if (cancelled) {
          h.dispose()
          canvas.remove()
          return
        }
        handle = h
        host.classList.add('is-ready')
        // the CSS moon dissolves and hands the night over to WebGL
        document.documentElement.classList.add('has-3d')
      })
      .catch(() => {
        canvas.remove()
        if (!cancelled) setFallback(true)
      })

    return () => {
      cancelled = true
      handle?.dispose()
      canvas.remove()
      host.classList.remove('is-ready')
      document.documentElement.classList.remove('has-3d')
    }
  }, [])

  if (fallback) return <Starfield />

  return <div ref={hostRef} className="night-host" aria-hidden="true" />
}

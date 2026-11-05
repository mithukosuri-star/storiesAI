import { useEffect, useState } from 'react'

type Node = { el: HTMLElement; index: number; name: string }

/**
 * The little "Awake → Asleep" scale. It tells you how far into the night
 * you have scrolled, and counts the chapters backwards, like a bedtime.
 */
export function SleepRail() {
  const [progress, setProgress] = useState(0)
  const [nodes, setNodes] = useState<Node[]>([])
  const [active, setActive] = useState(0)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>('[data-chapter]'))
    setNodes(els.map((el, index) => ({ el, index, name: el.dataset.chapterName || '' })))
  }, [])

  useEffect(() => {
    let raf = 0
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const doc = document.documentElement
        const max = doc.scrollHeight - window.innerHeight
        const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0
        setProgress(p)
        setVisible(window.scrollY > window.innerHeight * 0.35)
        let current = 0
        nodes.forEach((n, i) => {
          if (n.el.getBoundingClientRect().top <= window.innerHeight * 0.42) current = i
        })
        setActive(current)
      })
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [nodes])

  const total = Math.max(nodes.length, 1)
  const number = String(total - active).padStart(2, '0')
  const name = nodes[active]?.name ?? ''

  return (
    <aside className={`rail${visible ? ' is-visible' : ''}`} aria-hidden="true">
      <span className={`rail-label${progress < 0.35 ? ' is-now' : ''}`}>Awake</span>
      <span className="rail-chapter">{name}</span>
      <div className="rail-track">
        <div className="rail-progress" style={{ height: `${progress * 100}%` }} />
        <div className="rail-dot" style={{ top: `${progress * 100}%` }}>
          <span className="rail-here">
            {number} · you are here
          </span>
        </div>
      </div>
      <span className={`rail-label${progress > 0.82 ? ' is-now' : ''}`}>Asleep</span>
    </aside>
  )
}

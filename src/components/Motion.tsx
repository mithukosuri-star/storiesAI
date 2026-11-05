import { useEffect, useRef, type ElementType, type ReactNode } from 'react'

type Props = {
  children: ReactNode
  as?: ElementType
  delay?: number
  className?: string
  once?: boolean
  style?: React.CSSProperties
}

export function Reveal({ children, as: Tag = 'div', delay = 0, className = '', style }: Props) {
  const ref = useRef<HTMLElement | null>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (typeof IntersectionObserver === 'undefined') {
      el.classList.add('is-in')
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in')
            io.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.12, rootMargin: '0px 0px -6% 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return (
    <Tag ref={ref as never} data-reveal="" className={className} style={{ ...style, ['--d' as string]: `${delay}ms` }}>
      {children}
    </Tag>
  )
}

/** Reveals words one after another inside a heading. */
export function SplitWords({ text, className = '', startDelay = 0 }: { text: string; className?: string; startDelay?: number }) {
  return (
    <span className={className}>
      {text.split(' ').map((word, i) => (
        <span key={i} style={{ display: 'inline-block', whiteSpace: 'nowrap' }}>
          <span
            className="ch"
            style={{ ['--i' as string]: i + startDelay, display: 'inline-block' }}
          >
            {word}
          </span>
          {i < text.split(' ').length - 1 ? '\u00A0' : ''}
        </span>
      ))}
    </span>
  )
}

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Icon, BrandMark } from './Icons'
import { useStore } from '../lib/store'
import { audio } from '../lib/audio'
import { MoonGlyph } from './Decor'

/* ------------------------------- toasts ------------------------------- */
const ToastCtx = createContext<{ show: (msg: string) => void }>({ show: () => {} })
export const useToast = () => useContext(ToastCtx)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [msg, setMsg] = useState<string | null>(null)
  const timer = useRef<number | null>(null)
  const show = useCallback((m: string) => {
    setMsg(m)
    if (timer.current) window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setMsg(null), 3200)
  }, [])
  const value = useMemo(() => ({ show }), [show])
  return (
    <ToastCtx.Provider value={value}>
      {children}
      {msg && (
        <div className="toast" role="status">
          {msg}
        </div>
      )}
    </ToastCtx.Provider>
  )
}

/* ------------------------------ sign in ------------------------------- */
export function SignInModal({ open, onClose, reason }: { open: boolean; onClose: () => void; reason?: string }) {
  const { signIn } = useStore()
  const { show } = useToast()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setError('')
      window.setTimeout(() => inputRef.current?.focus(), 120)
      audio.play('magic')
      document.body.classList.add('no-scroll')
    } else {
      document.body.classList.remove('no-scroll')
    }
    return () => document.body.classList.remove('no-scroll')
  }, [open])

  if (!open) return null

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const value = email.trim()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
      setError('That email looks a little sleepy. Try again?')
      return
    }
    signIn(value)
    onClose()
    show('Welcome. Three Stars are waiting in your library.')
  }

  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="signin-title">
        <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
          <Icon name="close" width={16} height={16} />
        </button>
        <span className="eyebrow">No password</span>
        <h2 id="signin-title" style={{ marginTop: '0.9rem' }}>
          {reason ?? 'Keep your stories'}
        </h2>
        <p className="dim" style={{ fontSize: '0.88rem', marginBottom: '0.4rem' }}>
          Just your email: your stories, your Stars and your chapters series stay in your library, on this device.
        </p>
        <form className="auth-form" onSubmit={submit}>
          <label className="field">
            <span className="sr-only">Email</span>
            <input
              ref={inputRef}
              className="input"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="you@somewhere.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setError('')
              }}
            />
          </label>
          {error && <p style={{ color: 'var(--voice-red)', fontSize: '0.76rem' }}>{error}</p>}
          <button className="btn btn--gold btn--block" type="submit">
            Enter the story
            <Icon name="arrowRight" width={14} height={14} />
          </button>
          <p className="auth-note">
            You get <strong>3 free Stars</strong> when you sign up — one Star for every story you create.
          </p>
        </form>
      </div>
    </div>
  )
}

/* ------------------------------ cookies ------------------------------- */
export function CookieBanner() {
  const { cookies, setCookies, ready } = useStore()
  if (!ready || cookies) return null
  return (
    <div className="cookie" role="dialog" aria-label="Cookies">
      <div>
        <h4>A quick word about cookies</h4>
        <p>
          We use technical cookies, needed for the site to work, and — only if you accept — anonymous statistics to
          understand how the app is used. You can change your mind at any time from “Cookie preferences” in the footer.
        </p>
      </div>
      <div className="cookie-actions">
        <button className="btn btn--sm btn--ghost" onClick={() => setCookies('rejected')}>
          Reject
        </button>
        <button className="btn btn--sm btn--gold" onClick={() => { setCookies('accepted'); audio.play('magic') }}>
          Accept
        </button>
      </div>
    </div>
  )
}

/* ------------------------------ install ------------------------------- */
type BipEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> }

export function InstallPrompt() {
  const { installDismissed, dismissInstall, ready, cookies } = useStore()
  const { show } = useToast()
  const [deferred, setDeferred] = useState<BipEvent | null>(null)
  const [showBar, setShowBar] = useState(false)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches || (navigator as unknown as { standalone?: boolean }).standalone === true
    if (standalone) return
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent)
    setIsIOS(ios)
    const onPrompt = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BipEvent)
    }
    const onAsk = () => setShowBar(true)
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('fiabamia:install', onAsk)
    const t = window.setTimeout(() => setShowBar(true), 9000)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('fiabamia:install', onAsk)
      window.clearTimeout(t)
    }
  }, [])

  if (!ready || installDismissed || !showBar || !cookies) return null

  const install = async () => {
    if (deferred) {
      await deferred.prompt()
      const choice = await deferred.userChoice
      if (choice.outcome === 'accepted') {
        setShowBar(false)
        show('FiabaMia is on your home screen. Goodnight.')
      }
      setDeferred(null)
    } else if (isIOS) {
      show('Tap Share, then “Add to Home Screen”.')
    } else {
      show('Open the browser menu, then “Install app”.')
    }
  }

  return (
    <div className="install-bar">
      <img src="/icons/icon-192.png" alt="" width={42} height={42} />
      <div style={{ flex: 1 }}>
        <div className="t">Take the night with you</div>
        <div className="s">Install FiabaMia — it works offline.</div>
        <button className="btn btn--sm btn--gold" style={{ marginTop: '0.55rem' }} onClick={install}>
          <Icon name="install" width={13} height={13} />
          Install
        </button>
      </div>
      <button className="x" onClick={dismissInstall} aria-label="Not now">
        <Icon name="close" width={14} height={14} />
      </button>
    </div>
  )
}

/* --------------------------- writing overlay -------------------------- */
export function WritingOverlay({ onDone, hero }: { onDone: () => void; hero: string }) {
  const lines = useMemo(
    () => [
      'Opening the door',
      `Looking for ${hero || 'your hero'}`,
      'Choosing the value of the night',
      'Waking the little villain',
      'Painting the sky in the right colour',
      'Lighting the music',
      'Hiding the golden words',
    ],
    [hero],
  )
  const [step, setStep] = useState(0)
  const done = useRef(false)

  useEffect(() => {
    const interval = window.setInterval(() => setStep((s) => Math.min(s + 1, lines.length)), 620)
    return () => window.clearInterval(interval)
  }, [lines.length])

  useEffect(() => {
    if (step >= lines.length && !done.current) {
      done.current = true
      audio.play('magic')
      const t = window.setTimeout(onDone, 800)
      return () => window.clearTimeout(t)
    }
  }, [step, lines.length, onDone])

  return (
    <div className="writing" role="status" aria-live="polite">
      <div className="writing-inner">
        <MoonGlyph className="writing-moon" />
        <h3>{step < lines.length ? 'The story is being written…' : 'It’s ready.'}</h3>
        <div className="writing-lines">
          {lines.map((l, i) => (
            <div key={l} className={`writing-line${i < step ? ' is-done' : ''}${i === step ? ' is-now' : ''}`}>
              {l}
            </div>
          ))}
        </div>
        <div className="progress">
          <i style={{ width: `${(step / lines.length) * 100}%` }} />
        </div>
      </div>
    </div>
  )
}

/* ------------------------------- brand -------------------------------- */
export function BrandBar() {
  return (
    <div className="brandbar">
      <BrandMark className="brand-mark" />
      Fiaba<em>Mia</em>
    </div>
  )
}

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { Story } from './storyEngine'
import { audio } from './audio'

type User = { email: string; name: string; joinedAt: number; invite: string }
type CookieChoice = 'accepted' | 'rejected' | null

type State = {
  user: User | null
  stars: number
  stories: Story[]
  soundOn: boolean
  cookies: CookieChoice
  installDismissed: boolean
  onboarded: boolean
}

const KEY = 'fiabamia.v1'

const initial: State = {
  user: null,
  stars: 0,
  stories: [],
  soundOn: false,
  cookies: null,
  installDismissed: false,
  onboarded: false,
}

function load(): State {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return initial
    const parsed = JSON.parse(raw)
    return { ...initial, ...parsed }
  } catch {
    return initial
  }
}

function makeInvite(email: string) {
  const base = (email.split('@')[0] || 'fiaba').replace(/[^a-z0-9]/gi, '').slice(0, 5).toUpperCase() || 'FIABA'
  return `${base}${Math.floor(10 + Math.random() * 89)}`
}

type Ctx = State & {
  ready: boolean
  signIn: (email: string) => void
  signOut: () => void
  spendStar: () => boolean
  grantStars: (n: number) => void
  saveStory: (story: Story) => void
  removeStory: (id: string) => void
  hasStory: (story: Story) => boolean
  toggleSound: () => void
  setCookies: (choice: Exclude<CookieChoice, null>) => void
  dismissInstall: () => void
  finishOnboarding: () => void
  resetAll: () => void
}

const StoreContext = createContext<Ctx | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(initial)
  const [ready, setReady] = useState(false)
  const first = useRef(true)

  useEffect(() => {
    setState(load())
    setReady(true)
  }, [])

  useEffect(() => {
    if (!ready) return
    try {
      localStorage.setItem(KEY, JSON.stringify(state))
    } catch {
      /* storage full or blocked — the session still works in memory */
    }
  }, [state, ready])

  useEffect(() => {
    if (!ready) return
    if (state.soundOn) {
      audio.setEnabled(true)
    } else {
      audio.setEnabled(false)
    }
  }, [state.soundOn, ready])

  const signIn = useCallback((email: string) => {
    setState((s) => {
      if (s.user) return { ...s, user: { ...s.user, email } }
      const name = (email.split('@')[0] || '').split(/[._-]/)[0].replace(/^\w/, (c) => c.toUpperCase())
      return {
        ...s,
        user: { email, name: name || 'Storyteller', joinedAt: Date.now(), invite: makeInvite(email) },
        stars: s.stars || 3,
        onboarded: true,
      }
    })
  }, [])

  const signOut = useCallback(() => setState((s) => ({ ...s, user: null })), [])

  const spendStar = useCallback(() => {
    let ok = false
    setState((s) => {
      if (!s.user || s.stars <= 0) return s
      ok = true
      return { ...s, stars: s.stars - 1 }
    })
    return ok
  }, [])

  const grantStars = useCallback((n: number) => setState((s) => ({ ...s, stars: s.stars + n })), [])

  const saveStory = useCallback((story: Story) => {
    setState((s) => {
      if (s.stories.some((x) => x.id === story.id)) return s
      return { ...s, stories: [story, ...s.stories] }
    })
  }, [])

  const removeStory = useCallback((id: string) => {
    setState((s) => ({ ...s, stories: s.stories.filter((x) => x.id !== id) }))
  }, [])

  const hasStory = useCallback((story: Story) => state.stories.some((x) => x.id === story.id), [state.stories])

  const toggleSound = useCallback(() => setState((s) => ({ ...s, soundOn: !s.soundOn })), [])
  const setCookies = useCallback((choice: 'accepted' | 'rejected') => setState((s) => ({ ...s, cookies: choice })), [])
  const dismissInstall = useCallback(() => setState((s) => ({ ...s, installDismissed: true })), [])
  const finishOnboarding = useCallback(() => setState((s) => ({ ...s, onboarded: true })), [])
  const resetAll = useCallback(() => {
    localStorage.removeItem(KEY)
    setState(initial)
  }, [])

  const value = useMemo<Ctx>(
    () => ({
      ...state,
      ready,
      signIn,
      signOut,
      spendStar,
      grantStars,
      saveStory,
      removeStory,
      hasStory,
      toggleSound,
      setCookies,
      dismissInstall,
      finishOnboarding,
      resetAll,
    }),
    [state, ready, signIn, signOut, spendStar, grantStars, saveStory, removeStory, hasStory, toggleSound, setCookies, dismissInstall, finishOnboarding, resetAll],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used inside StoreProvider')
  return ctx
}

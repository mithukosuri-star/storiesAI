import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { BrandMark, Icon } from './Icons'
import { useStore } from '../lib/store'
import { audio } from '../lib/audio'

export function SoundToggle({ compact = false, mood }: { compact?: boolean; mood?: string }) {
  const { soundOn, toggleSound } = useStore()

  const onClick = () => {
    const next = !soundOn
    toggleSound()
    if (next) {
      audio.setEnabled(true)
      audio.startMood((mood as never) ?? 'gentle')
      audio.play('magic')
    } else {
      audio.setEnabled(false)
    }
  }

  return (
    <button
      type="button"
      className={`sound-btn${soundOn ? ' is-on' : ''}`}
      onClick={onClick}
      aria-pressed={soundOn}
      title={soundOn ? 'Sound on — tap to mute' : 'Listen with sound'}
    >
      <span className="bars" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
      {!compact && <span>{soundOn ? 'Sound on' : 'Sound off'}</span>}
    </button>
  )
}

export function Header({ variant = 'landing' }: { variant?: 'landing' | 'app' }) {
  const { user, stars, signOut } = useStore()
  const [solid, setSolid] = useState(variant === 'app')
  const location = useLocation()

  useEffect(() => {
    if (variant === 'app') {
      setSolid(true)
      return
    }
    const onScroll = () => setSolid(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [variant])

  return (
    <header className={`topbar${solid ? ' is-solid' : ''}`}>
      <div className="topbar-inner container">
        <Link to="/" className="brand" aria-label="FiabaMia, home">
          <BrandMark className="brand-mark" />
          <span>
            Fiaba<em>Mia</em>
          </span>
        </Link>

        <nav className="nav" aria-label="Main">
          {variant === 'landing' ? (
            <>
              <a href="#prologue" className="nav-link hide-sm">
                The story
              </a>
              <a href="#stars" className="nav-link hide-sm">
                Stars
              </a>
            </>
          ) : (
            <>
              <NavLink to="/" className="nav-link hide-sm" end>
                The story
              </NavLink>
              <NavLink to="/create" className="nav-link">
                Create
              </NavLink>
              <NavLink to="/library" className="nav-link">
                Library
              </NavLink>
            </>
          )}

          <SoundToggle compact={variant === 'app'} />

          {user ? (
            <div className="row" style={{ gap: '0.5rem' }}>
              <span className="star-pill" title="Your Stars">
                <Icon name="star" className="star" />
                {stars}
              </span>
              <button
                type="button"
                className="nav-link hide-sm"
                onClick={() => signOut()}
                title={`Signed in as ${user.email}`}
              >
                {user.name}
              </button>
            </div>
          ) : (
            <Link to={location.pathname === '/' ? '/create' : '/create'} className="btn btn--gold btn--sm">
              {variant === 'app' ? 'Create' : 'Create your story'}
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}

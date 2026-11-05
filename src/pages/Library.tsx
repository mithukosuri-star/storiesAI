import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Header } from '../components/Header'
import { Icon } from '../components/Icons'
import { SignInModal, useToast } from '../components/Overlays'
import { Loading } from '../components/Loading'
import { useStore } from '../lib/store'
import { audio } from '../lib/audio'
import { moods } from '../lib/content'

const tints: Record<string, string> = {
  gentle: 'rgba(143, 180, 122, 0.28)',
  adventurous: 'rgba(221, 129, 104, 0.28)',
  magical: 'rgba(134, 169, 216, 0.3)',
  relaxing: 'rgba(230, 197, 105, 0.26)',
}

export default function Library() {
  const { user, stars, stories, removeStory, grantStars, soundOn, toggleSound, cookies, setCookies, resetAll, signOut, ready } = useStore()
  const { show } = useToast()
  const navigate = useNavigate()
  const [authOpen, setAuthOpen] = useState(false)

  useEffect(() => {
    document.title = 'My library — FiabaMia'
  }, [])

  const copyInvite = async () => {
    if (!user) return
    try {
      await navigator.clipboard.writeText(user.invite)
      show('Invite code copied. One friend, one more Star.')
    } catch {
      show(`Your invite code is ${user.invite}`)
    }
  }

  return (
    <div className="app-bg">
      <Header variant="app" />
      <main className="app-main container">
        {!ready ? (
          <Loading label="Opening the library…" />
        ) : (
        <>
        <div className="lib-head">
          <div className="app-head">
            <span className="eyebrow">My library</span>
            <h1 className="app-title" style={{ marginTop: '1.2rem' }}>
              Your nights, <em>collected</em>
            </h1>
            <p>Every story stays here, ready to be read again — with its music, its colours and its questions.</p>
          </div>

          {user && (
            <div className="balance">
              <div>
                <div className="n">
                  {stars}
                  <Icon name="star" className="star" width={18} height={18} />
                </div>
                <div className="l">Stars in your sky</div>
              </div>
              <button
                className="btn btn--sm btn--ghost"
                onClick={() => {
                  grantStars(3)
                  audio.play('magic')
                  show('A friend accepted. 3 Stars added to your sky.')
                }}
              >
                Invite a friend
              </button>
            </div>
          )}
        </div>

        {!user ? (
          <div className="empty">
            <h3>A library with no light on</h3>
            <p>
              Sign in with nothing but your email and your stories will be kept here, together with your Stars. No
              password, ever.
            </p>
            <div className="row" style={{ justifyContent: 'center' }}>
              <button className="btn btn--gold" onClick={() => setAuthOpen(true)}>
                Sign in and get 3 Stars
                <Icon name="arrowRight" width={14} height={14} />
              </button>
              <Link to="/create" className="btn btn--ghost">
                Try the form first
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="invite">
              <Icon name="mail" width={15} height={15} style={{ color: 'var(--gold)' }} />
              <span>Your invite code</span>
              <code>{user.invite}</code>
              <button className="btn btn--sm btn--ghost" onClick={copyInvite}>
                <Icon name="copy" width={12} height={12} />
                Copy
              </button>
              <span style={{ marginLeft: 'auto' }}>Each friend who joins gives you a Star.</span>
            </div>

            {stories.length === 0 ? (
              <div className="empty">
                <h3>The first story is missing</h3>
                <p>This library is quiet for now. Choose a name, an age and a value — the rest takes thirty seconds.</p>
                <Link to="/create" className="btn btn--gold">
                  <Icon name="sparkle" width={14} height={14} />
                  Create your first story
                </Link>
              </div>
            ) : (
              <div className="lib-grid">
                {stories.map((s) => {
                  const mood = moods.find((m) => m.id === s.input.moodId)
                  return (
                    <div
                      key={s.id}
                      className="story-card"
                      style={{ ['--sc' as string]: tints[s.input.moodId] ?? tints.gentle }}
                      role="button"
                      tabIndex={0}
                      onClick={() => navigate(`/story/${s.id}`)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') navigate(`/story/${s.id}`)
                      }}
                    >
                      <div className="s-eyebrow">
                        {mood?.label ?? 'Story'} · {s.input.band} years
                      </div>
                      <div className="s-title">{s.title}</div>
                      <div className="s-meta">
                        {s.chapterCount} chapters · ≈{s.minutes} min ·{' '}
                        {new Date(s.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      </div>
                      <div className="s-meta" style={{ opacity: 0.8 }}>
                        {s.input.names.join(' & ')}
                      </div>
                      <div className="s-foot">
                        <span className="s-open">
                          Read
                          <Icon name="arrowRight" width={12} height={12} />
                        </span>
                        <button
                          className="s-del"
                          aria-label="Remove story"
                          onClick={(e) => {
                            e.stopPropagation()
                            removeStory(s.id)
                            show('Story removed from the library.')
                          }}
                        >
                          <Icon name="trash" width={14} height={14} />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            <div className="settings">
              <div className="side-label" style={{ marginBottom: '0.6rem' }}>
                The app
              </div>
              <div className="setting-row">
                <div>
                  <div className="t">Sound</div>
                  <div className="s">Music and golden sounds are generated on this device.</div>
                </div>
                <button
                  className="switch"
                  role="switch"
                  aria-checked={soundOn}
                  aria-label="Sound"
                  onClick={() => {
                    toggleSound()
                    if (!soundOn) {
                      audio.setEnabled(true)
                      audio.startMood('gentle')
                    } else {
                      audio.setEnabled(false)
                    }
                  }}
                />
              </div>
              <div className="setting-row">
                <div>
                  <div className="t">Statistics cookies</div>
                  <div className="s">{cookies === 'accepted' ? 'Accepted — thank you.' : 'Not accepted.'}</div>
                </div>
                <button className="btn btn--sm btn--ghost" onClick={() => { setCookies(cookies === 'accepted' ? 'rejected' : 'accepted'); show('Preference saved.') }}>
                  {cookies === 'accepted' ? 'Withdraw' : 'Accept'}
                </button>
              </div>
              <div className="setting-row">
                <div>
                  <div className="t">Account</div>
                  <div className="s">{user.email}</div>
                </div>
                <button className="btn btn--sm btn--ghost" onClick={() => { signOut(); show('Signed out. Your stories stay on this device.') }}>
                  Sign out
                </button>
              </div>
              <div className="setting-row">
                <div>
                  <div className="t">Start over</div>
                  <div className="s">Deletes this device’s library and Stars. No way back.</div>
                </div>
                <button
                  className="danger"
                  onClick={() => {
                    if (confirm('Delete your library, your Stars and your session on this device?')) {
                      resetAll()
                      show('Everything is new again.')
                    }
                  }}
                >
                  Delete everything
                </button>
              </div>
            </div>
          </>
        )}

        <div style={{ marginTop: '2.4rem' }}>
          <Link to="/" className="btn btn--sm btn--ghost">
            <Icon name="arrowLeft" width={13} height={13} />
            Back to the story
          </Link>
        </div>
        </>
        )}
      </main>

      <SignInModal open={authOpen} onClose={() => setAuthOpen(false)} reason="Sign in to keep your nights" />
    </div>
  )
}

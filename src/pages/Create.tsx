import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Header } from '../components/Header'
import { Icon } from '../components/Icons'
import { SignInModal, WritingOverlay, useToast } from '../components/Overlays'
import { ageBands, moods, places, values } from '../lib/content'
import { generateStory, type Band, type Length, type StoryInput } from '../lib/storyEngine'
import { audio } from '../lib/audio'
import { useStore } from '../lib/store'

const lengthOptions: { id: Length; label: string; blurb: string }[] = [
  { id: 'short', label: 'Short', blurb: 'about 3 min' },
  { id: 'medium', label: 'Medium', blurb: 'about 5 min' },
  { id: 'long', label: 'Long', blurb: 'about 7 min' },
]

export default function Create() {
  const { user, stars, spendStar, saveStory, soundOn, toggleSound } = useStore()
  const { show } = useToast()
  const navigate = useNavigate()
  const location = useLocation()

  const [kind, setKind] = useState<'single' | 'series'>('single')
  const [names, setNames] = useState('')
  const [band, setBand] = useState<Band>('5–6')
  const [valueId, setValueId] = useState('courage')
  const [placeId, setPlaceId] = useState('forest')
  const [moodId, setMoodId] = useState('gentle')
  const [villain, setVillain] = useState(true)
  const [length, setLength] = useState<Length>('medium')
  const [more, setMore] = useState(false)
  const [characters, setCharacters] = useState('')
  const [extras, setExtras] = useState('')
  const [note, setNote] = useState('')
  const [authOpen, setAuthOpen] = useState(false)
  const [writing, setWriting] = useState(false)
  const [pending, setPending] = useState(false)
  const startedRef = useRef(false)

  useEffect(() => {
    document.title = 'Create your fairy tale — FiabaMia'
  }, [])

  useEffect(() => {
    const pre = (location.state ?? {}) as Partial<StoryInput> & { valueId?: string }
    if (pre && Object.keys(pre).length) {
      if (pre.valueId) setValueId(pre.valueId)
      if (pre.placeId) setPlaceId(pre.placeId)
      if (pre.moodId) setMoodId(pre.moodId)
      if (pre.names?.length) setNames(pre.names.join(' and '))
    }
  }, [location.state])

  // once the visitor signs in, continue with the creation they asked for
  useEffect(() => {
    if (pending && user) {
      setPending(false)
      start()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending, user])

  const place = places.find((p) => p.id === placeId)!
  const value = values.find((v) => v.id === valueId)!
  const mood = moods.find((m) => m.id === moodId)!
  const heroNames = names
    .split(/\s*(?:,| and |&|\+| e )\s*/i)
    .map((n) => n.trim())
    .filter(Boolean)

  const titleGuess = `${heroNames[0] || 'Your hero'} and the ${place.label.replace(/^(the |a )/i, '')}`

  const start = () => {
    if (startedRef.current) return
    if (!heroNames.length) {
      show('First things first: whose story is it?')
      document.querySelector<HTMLInputElement>('.name-input')?.focus()
      return
    }
    if (!user) {
      setAuthOpen(true)
      setPending(true)
      return
    }
    if (stars <= 0) {
      show('You are out of Stars — claim a free pack in your library.')
      return
    }
    startedRef.current = true
    spendStar()
    audio.play('page')
    setWriting(true)
  }

  const finish = () => {
    const input: StoryInput = {
      kind,
      names: heroNames,
      band,
      valueId,
      placeId,
      moodId,
      villain,
      length,
      characters: characters.trim() || undefined,
      extras: extras.trim() || undefined,
      note: note.trim() || undefined,
      seriesId: kind === 'series' ? `sr-${Date.now().toString(36)}` : undefined,
      episode: 1,
    }
    const story = generateStory(input)
    saveStory(story)
    audio.play('magic')
    navigate(`/story/${story.id}`)
  }

  const previewMood = (id: string) => {
    setMoodId(id)
    if (!soundOn) toggleSound()
    audio.setEnabled(true)
    audio.startMood(id as never, 0.8)
  }

  const summary = useMemo(
    () => [
      { k: 'Hero', v: heroNames.length ? heroNames.join(' & ') : '—' },
      { k: 'Age', v: `${band} years` },
      { k: 'Value', v: value.label },
      { k: 'Place', v: place.label },
      { k: 'Mood', v: mood.label },
      { k: 'Length', v: `${length} · ${lengthOptions.find((l) => l.id === length)?.blurb}` },
      { k: 'Little villain', v: villain ? 'yes' : 'no' },
    ],
    [heroNames, band, value.label, place.label, mood.label, length, villain],
  )

  return (
    <div className="app-bg">
      <Header variant="app" />
      <main className="app-main container">
        <div className="app-head">
          <span className="eyebrow">New story</span>
          <h1 className="app-title" style={{ marginTop: '1.2rem' }}>
            Who is <em>this story</em> for?
          </h1>
          <p>
            Six small choices and one Star. In about thirty seconds the story is written, with music, sounds and a
            colour for every chapter.
          </p>
        </div>

        <div className="form-wrap">
          <div>
            {/* kind */}
            <div className="form-block">
              <div className="form-block-head">
                <span className="idx">I</span>
                <h2 className="form-block-title">A single story, or a <em>series</em>?</h2>
              </div>
              <div className="kind-grid">
                <button className={`kind${kind === 'single' ? ' is-on' : ''}`} onClick={() => setKind('single')}>
                  <Icon name="single" />
                  <span>
                    <span className="k-t">A single story</span>
                    <span className="k-s">A complete tale, ready in a few seconds.</span>
                  </span>
                </button>
                <button className={`kind${kind === 'series' ? ' is-on' : ''}`} onClick={() => setKind('series')}>
                  <Icon name="series" />
                  <span>
                    <span className="k-t">A bedtime series</span>
                    <span className="k-s">Your child as the hero, chapter after chapter.</span>
                  </span>
                </button>
              </div>
            </div>

            {/* name */}
            <div className="form-block">
              <div className="form-block-head">
                <span className="idx">II</span>
                <h2 className="form-block-title">What is their <em>name</em>?</h2>
              </div>
              <input
                className="name-input"
                value={names}
                onChange={(e) => setNames(e.target.value)}
                placeholder="Arianna"
                autoComplete="off"
                aria-label="Child's name"
              />
              <p className="hint">More names together? Separate them with «and» or a comma: they will all be heroes.</p>
            </div>

            {/* age */}
            <div className="form-block">
              <div className="form-block-head">
                <span className="idx">III</span>
                <h2 className="form-block-title">How old <em>are they</em>?</h2>
              </div>
              <div className="chip-grid age-chips">
                {ageBands.map((b) => (
                  <button key={b} className={`chip${band === b ? ' is-active' : ''}`} onClick={() => setBand(b as Band)}>
                    {b} years
                  </button>
                ))}
              </div>
            </div>

            {/* value */}
            <div className="form-block">
              <div className="form-block-head">
                <span className="idx">IV</span>
                <h2 className="form-block-title">Which value should the story <em>carry</em>?</h2>
              </div>
              <div className="opt-grid">
                {values.map((v) => (
                  <button key={v.id} className={`opt${valueId === v.id ? ' is-on' : ''}`} onClick={() => setValueId(v.id)}>
                    <Icon name={v.icon} />
                    <span>{v.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* mood */}
            <div className="form-block">
              <div className="form-block-head">
                <span className="idx">V</span>
                <h2 className="form-block-title">Which atmosphere do you <em>want</em>?</h2>
              </div>
              <p className="hint" style={{ marginTop: '-0.6rem', marginBottom: '1rem' }}>
                The background music follows the atmosphere: tap one to hear it.
              </p>
              <div className="opt-grid">
                {moods.map((m) => (
                  <button key={m.id} className={`opt${moodId === m.id ? ' is-on' : ''}`} onClick={() => previewMood(m.id)}>
                    <Icon name={m.icon} />
                    <span>
                      {m.label}
                      <br />
                      <span style={{ color: 'var(--muted)', fontSize: '0.7rem' }}>{m.blurb}</span>
                    </span>
                  </button>
                ))}
              </div>

              <div className="toggle-row" style={{ marginTop: '0.8rem' }}>
                <div>
                  <div style={{ fontFamily: 'var(--serif)', fontSize: '1.2rem' }}>A little villain?</div>
                  <div className="hint" style={{ marginTop: '0.2rem' }}>
                    {villain
                      ? 'Someone small and grumpy, who makes amends in the end.'
                      : 'The story will be all adventure and wonder.'}
                  </div>
                </div>
                <button
                  className="switch"
                  role="switch"
                  aria-checked={villain}
                  aria-label="Add a little villain"
                  onClick={() => setVillain(!villain)}
                />
              </div>
            </div>

            {/* place */}
            <div className="form-block">
              <div className="form-block-head">
                <span className="idx">VI</span>
                <h2 className="form-block-title">Where does it <em>happen</em>?</h2>
              </div>
              <div className="opt-grid">
                {places.map((p) => (
                  <button key={p.id} className={`opt${placeId === p.id ? ' is-on' : ''}`} onClick={() => setPlaceId(p.id)}>
                    <Icon name={p.icon} />
                    <span>{p.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* length */}
            <div className="form-block">
              <div className="form-block-head">
                <span className="idx">VII</span>
                <h2 className="form-block-title">How <em>long</em>?</h2>
              </div>
              <div className="length-row">
                {lengthOptions.map((l) => (
                  <button key={l.id} className={`length${length === l.id ? ' is-on' : ''}`} onClick={() => setLength(l.id)}>
                    <div className="l-t">{l.label}</div>
                    <div className="l-s">{l.blurb}</div>
                  </button>
                ))}
              </div>

              <button className={`more-toggle${more ? ' is-open' : ''}`} onClick={() => setMore(!more)}>
                <Icon name="plus" />
                Personalise a little more
              </button>
              <div className={`more-panel${more ? ' is-open' : ''}`}>
                <label className="field">
                  <span className="field-label" style={{ fontSize: '1.05rem' }}>
                    Special characters <span className="optional">optional</span>
                  </span>
                  <input
                    className="input"
                    value={characters}
                    onChange={(e) => setCharacters(e.target.value)}
                    placeholder="a turtle named Tita, the neighbour's cat"
                  />
                  <p className="hint">Separate with commas.</p>
                </label>
                <label className="field">
                  <span className="field-label" style={{ fontSize: '1.05rem' }}>
                    Anything to bring along? <span className="optional">optional</span>
                  </span>
                  <input
                    className="input"
                    value={extras}
                    onChange={(e) => setExtras(e.target.value)}
                    placeholder="a blue blanket, a biscuit for the road"
                  />
                </label>
                <label className="field">
                  <span className="field-label" style={{ fontSize: '1.05rem' }}>
                    A note for the story <span className="optional">optional</span>
                  </span>
                  <textarea
                    className="textarea"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="They are learning to swim, and they love the moon."
                  />
                </label>
              </div>
            </div>

            <div className="row" style={{ marginTop: '1.4rem' }}>
              <button className="btn btn--gold" onClick={start}>
                <Icon name="sparkle" width={14} height={14} />
                Create the fairy tale
              </button>
              <span className="small muted">
                {user ? `${stars} ${stars === 1 ? 'Star' : 'Stars'} in your sky · 1 per story` : 'You only need your email · 3 Stars as a gift'}
              </span>
            </div>
          </div>

          {/* summary */}
          <aside className="summary">
            <div className="summary-head">
              <span>Your story, so far</span>
              <span>{kind === 'series' ? 'Series · 1' : 'Single'}</span>
            </div>
            <div className="summary-title">
              {heroNames.length ? titleGuess : 'A story waiting for a name'}
            </div>
            <div className="summary-lines">
              {summary.map((s) => (
                <div className="summary-line" key={s.k}>
                  <span>{s.k}</span>
                  <b>{s.v}</b>
                </div>
              ))}
            </div>
            <div className="cost">
              <span>Cost of the night</span>
              <span className="n">
                1 <Icon name="star" className="star" width={13} height={13} />
              </span>
            </div>
            <button className="btn btn--gold btn--block" onClick={start}>
              Create the fairy tale
              <Icon name="arrowRight" width={14} height={14} />
            </button>
            <p className="summary-note">
              {user ? (
                <>Signed in as {user.email}</>
              ) : (
                <>You only need your email · 3 Stars as a gift</>
              )}
            </p>
          </aside>
        </div>

        <div style={{ marginTop: '3rem' }}>
          <Link to="/library" className="btn btn--sm btn--ghost">
            <Icon name="arrowLeft" width={13} height={13} />
            My library
          </Link>
        </div>
      </main>

      <SignInModal
        open={authOpen}
        reason="One small step before the story"
        onClose={() => setAuthOpen(false)}
      />

      {writing && <WritingOverlay hero={heroNames[0] || 'your hero'} onDone={finish} />}
    </div>
  )
}

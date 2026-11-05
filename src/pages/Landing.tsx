import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Header, SoundToggle } from '../components/Header'
import { SleepRail } from '../components/SleepRail'
import { Starfield, Landscape, MoonGlyph, Motes } from '../components/Decor'
import { Reveal } from '../components/Motion'
import { Pieces } from '../components/GoldenLine'
import { Icon, BrandMark } from '../components/Icons'
import { CookieBanner, InstallPrompt, SignInModal, useToast } from '../components/Overlays'
import {
  ageGroups,
  faqs,
  goldenWords,
  howItWorks,
  moods,
  places,
  prologueChips,
  starPacks,
  testimonials,
  values,
  voiceColors,
} from '../lib/content'
import { audio, speak, stopSpeaking } from '../lib/audio'
import { useStore } from '../lib/store'

/* ------------------------------------------------------------------ */
/* hero                                                                */
/* ------------------------------------------------------------------ */
function Hero() {
  const { soundOn, toggleSound } = useStore()
  const line = 'No one has ever told it…'
  let counter = 0

  const enableSound = () => {
    const next = !soundOn
    toggleSound()
    if (next) {
      audio.setEnabled(true)
      audio.startMood('gentle')
      audio.play('magic')
    } else {
      audio.setEnabled(false)
    }
  }

  return (
    <section className="hero grain" data-chapter data-chapter-name="Prologue">
      <div className="hero-glow" />
      <div className="moon-wrap">
        <span className="moon-halo" />
        <div className="moon" />
      </div>

      <div className="hero-inner container">
        <div className="hero-kicker">
          <span className="line" />
          FiabaMia · a bedtime fairy tale
        </div>

        <h1 className="hero-title" aria-label={line}>
          {line.split('').map((ch, i) => {
            if (ch === ' ') return <span key={i} className="space" />
            const idx = counter++
            return (
              <span className="ch" style={{ ['--i' as string]: idx }} key={i} aria-hidden="true">
                {ch}
              </span>
            )
          })}
        </h1>

        <p className="hero-sub">
          A fairy tale never read before, written tonight for the one you love.
        </p>

        <div className="hero-actions">
          <button type="button" className={`btn ${soundOn ? '' : 'btn--gold'}`} onClick={enableSound}>
            <Icon name={soundOn ? 'volume' : 'play'} width={13} height={13} />
            {soundOn ? 'Sound on' : 'Listen with sound'}
          </button>
          <Link to="/create" className="btn btn--ghost">
            Create your first story
            <Icon name="arrowRight" width={14} height={14} />
          </Link>
        </div>
      </div>

      <div className="hero-foot container">
        <div className="hero-scroll">
          <span className="num">07</span>
          <span className="scroll-line" />
          <span>Scroll to enter</span>
        </div>
        <p className="hero-choose">Close your eyes… we’re about to step into the fairy tale.</p>
      </div>

      <Motes />
      <Landscape />
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* prologue / intro                                                    */
/* ------------------------------------------------------------------ */
function Intro() {
  return (
    <section className="section intro" id="prologue">
      <div className="container">
        <Reveal className="intro-grid">
          <div>
            <span className="eyebrow">Prologue</span>
            <h2 className="intro-title" style={{ marginTop: '1.6rem' }}>
              Personalized bedtime stories for children — <em>a fairy tale never read before.</em>
            </h2>
          </div>
          <div>
            <p className="intro-note">
              Written tonight for the one you love. In about thirty seconds you get an original story, with music,
              interactive sounds and a voice to guide you chapter by chapter.
            </p>
            <div className="row" style={{ marginTop: '1.8rem' }}>
              <Link to="/create" className="btn btn--gold">
                Create your story for free
                <Icon name="arrowRight" width={14} height={14} />
              </Link>
              <a href="#made" className="btn btn--ghost">
                See how it works
              </a>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* made to measure                                                     */
/* ------------------------------------------------------------------ */
const previews: Record<string, { title: string; before: string; hl: string; after: string }> = {
  name: {
    title: 'Arianna and the Lantern of Lost Steps',
    before: 'The forest began exactly where the garden fence forgot to end, and the first thing it did was hold its breath. ',
    hl: 'Arianna',
    after: ' took one small step forward, which is the only size courage ever comes in.',
  },
  age: {
    title: 'Tailored to seven years, not to four',
    before: 'The spoon stood up, politely, and asked if anyone had seen the sugar. ',
    hl: 'Silly magic',
    after: ' and inventions, with sentences long enough to be funny and short enough to be read aloud.',
  },
  value: {
    title: 'A value, carried by the story',
    before: '“I have brought you something,” said Arianna, “but it is not what you think.” ',
    hl: 'Courage',
    after: ' is never explained — it is simply what the hero does, one wobbly step at a time.',
  },
  place: {
    title: 'A place that sets the tone',
    before: 'It smelled of rain that had not fallen yet, and a green light that came from the leaves instead of the sky. ',
    hl: 'The enchanted forest',
    after: ' chooses the music, the pace and how dark the dark is allowed to get.',
  },
  villain: {
    title: 'And a little villain, if you like',
    before: '“Go away,” said Grugno, in the voice of somebody who wanted very much for nobody to go away. ',
    hl: 'A badger the size of a boot',
    after: ', who had never once been invited to a birthday — and who makes amends in the end.',
  },
}

function MadeToMeasure() {
  const [active, setActive] = useState('name')
  const navigate = useNavigate()
  const p = previews[active]

  return (
    <section className="section" id="made" data-chapter data-chapter-name="Made to measure">
      <div className="container">
        <Reveal className="section-head">
          <span className="eyebrow">The recipe</span>
          <h2 className="h2" style={{ marginTop: '1.4rem' }}>
            A story made <em className="italic gold">to measure</em>: name, age, value, place and a little villain
          </h2>
        </Reveal>

        <div className="measure">
          <Reveal>
            <div className="measure-list">
              {prologueChips.map((chip, i) => (
                <button
                  key={chip.field}
                  type="button"
                  className={`measure-item${active === chip.field ? ' is-active' : ''}`}
                  onMouseEnter={() => setActive(chip.field)}
                  onFocus={() => setActive(chip.field)}
                  onClick={() => setActive(chip.field)}
                >
                  <span className="measure-idx">{String(i + 1).padStart(2, '0')}</span>
                  <span className="measure-label">{chip.label}</span>
                  <span className="measure-detail">{chip.detail}</span>
                </button>
              ))}
            </div>
            <div className="row" style={{ marginTop: '2rem' }}>
              <button className="btn btn--gold" onClick={() => navigate('/create')}>
                Try it now
                <Icon name="arrowRight" width={14} height={14} />
              </button>
              <span className="small muted">3 free Stars · no password</span>
            </div>
          </Reveal>

          <Reveal delay={140} className="preview-page">
            <div>
              <div className="preview-eyebrow">
                <span>Preview · page one</span>
                <span>★</span>
              </div>
              <h3 className="preview-hero">{p.title}</h3>
              <p className="preview-text">
                {p.before}
                <span className="hl">{p.hl}</span>
                {p.after}
              </p>
            </div>
            <div className="preview-foot">
              <span>Music · {active === 'place' ? 'magical' : 'gentle'}</span>
              <span>3–7 min</span>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* music                                                               */
/* ------------------------------------------------------------------ */
function MusicSection() {
  const { soundOn, toggleSound } = useStore()
  const [playing, setPlaying] = useState<string | null>(null)
  const { show } = useToast()

  const toggle = (id: string) => {
    if (playing === id) {
      audio.stopMood()
      setPlaying(null)
      return
    }
    if (!soundOn) {
      toggleSound()
      audio.setEnabled(true)
    }
    audio.startMood(id as never)
    setPlaying(id)
    show(`Music: ${id}. Tap again to stop.`)
  }

  return (
    <section className="section section--tight">
      <div className="container">
        <Reveal className="section-head">
          <span className="eyebrow">Sound</span>
          <h2 className="h2" style={{ marginTop: '1.4rem' }}>
            Every story has <em className="italic gold">its own music</em>
          </h2>
          <p className="lede" style={{ marginTop: '1.2rem' }}>
            Generated on your device to follow the mood. Tap one to listen — the golden words will make room for
            themselves.
          </p>
        </Reveal>

        <div className="moods">
          {moods.map((m, i) => (
            <Reveal key={m.id} delay={i * 90}>
              <button
                type="button"
                className={`mood-card${playing === m.id ? ' is-playing' : ''}`}
                onClick={() => toggle(m.id)}
                aria-pressed={playing === m.id}
              >
                <span className="mood-state">playing</span>
                <Icon name={m.icon} className="mood-icon" />
                <div>
                  <div className="mood-name">{m.label}</div>
                  <div className="mood-blurb">{m.blurb}</div>
                </div>
                <div className="mood-wave" aria-hidden="true">
                  {Array.from({ length: 26 }).map((_, k) => (
                    <i key={k} style={{ ['--n' as string]: k, height: `${12 + ((k * 37) % 70)}%` }} />
                  ))}
                </div>
              </button>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* golden words                                                        */
/* ------------------------------------------------------------------ */
function GoldenSection() {
  const { show } = useToast()
  const [last, setLast] = useState<string | null>(null)

  return (
    <section className="section section--tight">
      <div className="container">
        <Reveal className="section-head">
          <span className="eyebrow">Interactive</span>
          <h2 className="h2" style={{ marginTop: '1.4rem' }}>
            Words that <em className="italic gold">come to life</em>
          </h2>
        </Reveal>
        <Reveal>
          <div className="golden-hint">
            <span className="dot" />
            Tap the golden words and listen
            {last && <span style={{ color: 'var(--gold)', letterSpacing: '0.12em' }}>· {last}</span>}
          </div>
        </Reveal>
        <div className="golden-list">
          {goldenWords.map((line, i) => (
            <Reveal key={i} delay={i * 120}>
              <p className="golden-line">
                <Pieces
                  pieces={[
                    line.before,
                    { word: line.word, sound: line.sound },
                    line.after,
                  ]}
                  onPlay={(label) => {
                    setLast(label)
                    show(`You heard ${label}`)
                  }}
                />
              </p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* voice colours                                                       */
/* ------------------------------------------------------------------ */
function VoiceSection() {
  const [on, setOn] = useState<string | null>(null)
  const { show } = useToast()

  const play = (id: string, sample: string, rate: number, pitch: number) => {
    if (on === id) {
      stopSpeaking()
      setOn(null)
      return
    }
    const ok = speak(sample, { rate, pitch })
    if (!ok) {
      show('This browser cannot read aloud, but every chapter still shows its colour.')
      return
    }
    setOn(id)
    window.setTimeout(() => setOn((cur) => (cur === id ? null : cur)), 6000)
  }

  return (
    <section className="section" data-chapter data-chapter-name="Voice colours">
      <div className="container">
        <Reveal className="section-head">
          <span className="eyebrow">Read aloud</span>
          <h2 className="h2" style={{ marginTop: '1.4rem' }}>
            Become a storyteller. <em className="italic gold">No acting lessons needed.</em>
          </h2>
          <p className="lede" style={{ marginTop: '1.2rem' }}>
            Every chapter has a colour that tells you which voice to read it in. Tap one and hear the rhythm and mood to
            give your reading.
          </p>
        </Reveal>

        <div className="voices">
          {voiceColors.map((v, i) => (
            <Reveal key={v.id} delay={i * 80}>
              <button
                type="button"
                className={`voice-card${on === v.id ? ' is-on' : ''}`}
                style={{ ['--vc' as string]: `var(--voice-${v.id})` }}
                onClick={() => play(v.id, v.sample, v.rate, v.pitch)}
              >
                <span className="voice-dot" />
                <span className="voice-name">{v.label}</span>
                <span className="voice-hint">{v.hint}</span>
                <span className="voice-sample">{v.sample}</span>
                <span className="voice-play">
                  <Icon name={on === v.id ? 'pause' : 'play'} />
                  {on === v.id ? 'Reading…' : 'Hear it'}
                </span>
              </button>
            </Reveal>
          ))}
        </div>
        <Reveal>
          <p className="small muted" style={{ marginTop: '1.2rem', letterSpacing: '0.08em' }}>
            The reading demo uses your device’s own voice. In the app, every chapter carries its colour and its hint.
          </p>
        </Reveal>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* ages                                                                */
/* ------------------------------------------------------------------ */
function AgesSection() {
  const [open, setOpen] = useState('5-7')
  return (
    <section className="section section--tight" data-chapter data-chapter-name="Ages">
      <div className="container">
        <Reveal className="section-head">
          <span className="eyebrow">From 0 to 10</span>
          <h2 className="h2" style={{ marginTop: '1.4rem' }}>
            Every age has <em className="italic gold">its own story</em>
          </h2>
          <p className="lede" style={{ marginTop: '1.2rem' }}>
            In five age groups, each one speaks its own language. Tap one.
          </p>
        </Reveal>

        <div className="ages">
          {ageGroups.map((a, i) => (
            <Reveal key={a.id} delay={i * 90}>
              <button
                type="button"
                className={`age-card${open === a.id ? ' is-open' : ''}`}
                onClick={() => setOpen(open === a.id ? '' : a.id)}
                aria-expanded={open === a.id}
              >
                <span className="age-toggle">
                  <Icon name="plus" width={14} height={14} />
                </span>
                <span className="age-num">{a.label.replace(' years', '')}</span>
                <div className="age-blurb">{a.blurb}</div>
                <div className="age-sample">{a.sample}</div>
                <p className="age-words">{a.words}</p>
              </button>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* testimonials                                                        */
/* ------------------------------------------------------------------ */
function Testimonials() {
  const half = Math.ceil(testimonials.length / 2)
  const rowA = [...testimonials.slice(0, half), ...testimonials.slice(0, half)]
  const rowB = [...testimonials.slice(half), ...testimonials.slice(half)]

  const Card = ({ t }: { t: (typeof testimonials)[number] }) => (
    <figure className="quote-card">
      <div className="stars-row" aria-label="five stars">
        {Array.from({ length: 5 }).map((_, i) => (
          <Icon key={i} name="star" className="star" width={9} height={9} />
        ))}
      </div>
      <blockquote className="quote-text">“{t.quote}”</blockquote>
      <figcaption className="quote-by">
        <span className="quote-avatar">{t.name.charAt(0)}</span>
        <span>
          <span className="quote-name">{t.name}</span>
          <br />
          <span className="quote-role">{t.role}</span>
        </span>
      </figcaption>
    </figure>
  )

  return (
    <section className="section">
      <div className="container">
        <Reveal className="section-head section-head--center">
          <span className="eyebrow" style={{ justifyContent: 'center' }}>
            A community of parents
          </span>
          <h2 className="h2" style={{ marginTop: '1.4rem' }}>
            What <em className="italic gold">parents</em> say
          </h2>
        </Reveal>
        <Reveal className="stat-band">
          <span className="big">over 1,750 stories created</span>
          <span className="dim">·</span>
          <span className="small muted" style={{ letterSpacing: '0.2em', textTransform: 'uppercase' }}>
            and a lot of yawning
          </span>
        </Reveal>
      </div>

      <div className="marquee">
        <div className="marquee-track">
          {rowA.map((t, i) => (
            <Card key={`a${i}`} t={t} />
          ))}
        </div>
      </div>
      <div className="marquee marquee--rev">
        <div className="marquee-track">
          {rowB.map((t, i) => (
            <Card key={`b${i}`} t={t} />
          ))}
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* stars                                                               */
/* ------------------------------------------------------------------ */
function StarsSection({ onNeedAuth }: { onNeedAuth: () => void }) {
  const { user, stars, grantStars } = useStore()
  const { show } = useToast()

  const claim = (n: number) => {
    if (!user) {
      show('Sign in first — Stars need somewhere to live.')
      onNeedAuth()
      return
    }
    grantStars(n)
    audio.play('magic')
    show(`${n} Stars in your sky. They are a gift, for now.`)
  }

  return (
    <section className="section" id="stars">
      <div className="container">
        <Reveal className="section-head section-head--center">
          <span className="eyebrow" style={{ justifyContent: 'center' }}>
            Star packs
          </span>
          <h2 className="h2" style={{ marginTop: '1.4rem' }}>
            Every story costs <em className="italic gold">one Star.</em> And today, Stars are free.
          </h2>
          <p className="lede" style={{ marginTop: '1.2rem', maxWidth: '40ch', marginInline: 'auto' }}>
            It’s the perfect time to try FiabaMia.
          </p>
        </Reveal>

        <div className="packs">
          {starPacks.map((p, i) => (
            <Reveal key={p.name} delay={i * 100} className={`pack${p.popular ? ' is-popular' : ''}`}>
              {p.popular && <span className="pack-badge">Most popular</span>}
              <div className="pack-name">{p.name}</div>
              <div className="pack-stars">
                {p.stars}
                <small>stars</small>
                <Icon name="star" className="star" width={20} height={20} style={{ marginLeft: '0.35rem', opacity: 0.8 }} />
              </div>
              <div className="pack-price">
                <s>Future price {p.future}</s>
                <b>Free for now</b>
              </div>
              <p className="pack-blurb">{p.blurb}</p>
              <button className={`btn ${p.popular ? 'btn--gold' : 'btn--ghost'} btn--block`} onClick={() => claim(p.stars)}>
                {user ? `Add ${p.stars} Stars` : 'Sign in to claim'}
              </button>
              <p className="summary-note">Nothing to pay: right now, Stars are a gift</p>
            </Reveal>
          ))}
        </div>

        {user && (
          <p className="small" style={{ marginTop: '1.6rem', color: 'var(--muted)' }}>
            Your sky: <span className="gold">{stars} Stars</span> · invite a friend from your library to earn more.
          </p>
        )}

        <Reveal className="row" style={{ marginTop: '2.4rem', justifyContent: 'center' }}>
          <Link to="/create" className="btn btn--gold">
            Create your story for free
            <Icon name="arrowRight" width={14} height={14} />
          </Link>
        </Reveal>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* how it works                                                        */
/* ------------------------------------------------------------------ */
function HowSection() {
  return (
    <section className="section section--tight">
      <div className="container">
        <Reveal className="section-head">
          <span className="eyebrow">How it works</span>
          <h2 className="h2" style={{ marginTop: '1.4rem' }}>
            How a FiabaMia story <em className="italic gold">is born</em>
          </h2>
          <p className="lede" style={{ marginTop: '1.2rem', maxWidth: '52ch' }}>
            FiabaMia writes personalized bedtime stories for children aged 0 to 10: original stories, ready in about 30
            seconds, to read aloud together.
          </p>
        </Reveal>
        <div className="how-grid">
          {howItWorks.map((h, i) => (
            <Reveal key={h.title} delay={(i % 2) * 80} className="how-item">
              <div className="how-num">{String(i + 1).padStart(2, '0')}</div>
              <h3 className="how-title">{h.title}</h3>
              <p className="how-body">{h.body}</p>
            </Reveal>
          ))}
        </div>

        <Reveal className="row" style={{ marginTop: '2.4rem', alignItems: 'flex-start', gap: '2rem' }}>
          <div style={{ flex: '1 1 320px' }}>
            <h3 className="h3" style={{ marginBottom: '0.6rem' }}>
              Nine values to carry into the night
            </h3>
            <div className="row" style={{ gap: '0.5rem' }}>
              {values.map((v) => (
                <span className="chip" key={v.id}>
                  <Icon name={v.icon} width={13} height={13} style={{ color: 'var(--gold)' }} />
                  {v.label}
                </span>
              ))}
            </div>
          </div>
          <div style={{ flex: '1 1 300px' }}>
            <h3 className="h3" style={{ marginBottom: '0.6rem' }}>
              Twelve places to get lost in
            </h3>
            <div className="row" style={{ gap: '0.5rem' }}>
              {places.map((p) => (
                <span className="chip" key={p.id}>
                  <Icon name={p.icon} width={13} height={13} style={{ color: 'var(--gold)' }} />
                  {p.label}
                </span>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* faq                                                                 */
/* ------------------------------------------------------------------ */
function FaqSection() {
  const [open, setOpen] = useState(0)
  return (
    <section className="section">
      <div className="container">
        <Reveal className="section-head">
          <span className="eyebrow">Frequently asked questions</span>
          <h2 className="h2" style={{ marginTop: '1.4rem' }}>
            Everything you <em className="italic gold">want to know</em>
          </h2>
        </Reveal>
        <div className="faq">
          {faqs.map((f, i) => (
            <div key={f.q} className={`faq-item${open === i ? ' is-open' : ''}`}>
              <button className="faq-q" onClick={() => setOpen(open === i ? -1 : i)} aria-expanded={open === i}>
                {f.q}
                <span className="faq-sign" aria-hidden="true" />
              </button>
              <div className="faq-a">
                <p className="faq-a-inner">{f.a}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* finale + footer                                                     */
/* ------------------------------------------------------------------ */
function Finale() {
  return (
    <section className="finale">
      <div className="finale-glow" />
      <div className="container" style={{ position: 'relative' }}>
        <Reveal>
          <MoonGlyph />
          <span className="eyebrow" style={{ justifyContent: 'center' }}>
            Happily ever after
          </span>
          <h2 className="display" style={{ marginTop: '1.6rem' }}>
            This very night, <em>their first story</em> awaits you
          </h2>
          <p className="lede">The bedtime ritual becomes shared magic. Ready in 30 seconds, remembered forever.</p>
          <div className="finale-actions">
            <Link to="/create" className="btn btn--gold">
              Create your first story
              <Icon name="arrowRight" width={14} height={14} />
            </Link>
            <Link to="/library" className="btn btn--ghost">
              Open the library
            </Link>
          </div>
          <p className="finale-foot">Free, nothing to pay · Invite a friend and get more Stars</p>
        </Reveal>
      </div>
    </section>
  )
}

function Footer() {
  const { setCookies, cookies } = useStore()
  const { show } = useToast()
  const [policy, setPolicy] = useState(false)

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-col" style={{ maxWidth: '300px' }}>
            <Link to="/" className="brand" style={{ marginBottom: '0.6rem' }}>
              <BrandMark className="brand-mark" />
              <span>
                Fiaba<em>Mia</em>
              </span>
            </Link>
            <p className="small muted" style={{ lineHeight: 1.7 }}>
              Personalized bedtime stories for children aged 0 to 10. Written tonight, read aloud, forgotten never.
            </p>
            <p className="small muted" style={{ marginTop: '0.6rem' }}>
              an installable bedtime app
            </p>
          </div>

          <div className="footer-col">
            <span className="footer-head">The app</span>
            <Link to="/create" className="footer-link">
              Create a story
            </Link>
            <Link to="/library" className="footer-link">
              My library
            </Link>
            <a href="#prologue" className="footer-link">
              The story
            </a>
            <a href="#stars" className="footer-link">
              Star packs
            </a>
          </div>

          <div className="footer-col">
            <span className="footer-head">Small print</span>
            <button
              type="button"
              className="footer-link"
              onClick={() => {
                setCookies('rejected')
                localStorage.removeItem('fiabamia.cookies')
                show('Cookie preferences reset — the banner will ask again.')
              }}
            >
              Cookie preferences
            </button>
            <button type="button" className="footer-link" onClick={() => setPolicy(true)}>
              Cookie policy
            </button>
            <button type="button" className="footer-link" onClick={() => show('Written with care, for bedtime. © FiabaMia.')}>
              About this build
            </button>
            <button
              type="button"
              className="footer-link"
              onClick={() => {
                window.dispatchEvent(new Event('fiabamia:install'))
                show('Look for the Install button — or your browser menu.')
              }}
            >
              Install the app
            </button>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} FiabaMia · a bedtime fairy tale</span>
          <span>
            {cookies === 'accepted' ? 'Statistics cookies: accepted' : 'Statistics cookies: not accepted'} · made with
            stars
          </span>
        </div>
      </div>

      {policy && (
        <div className="modal-backdrop" onClick={() => setPolicy(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <button className="modal-close" onClick={() => setPolicy(false)} aria-label="Close">
              <Icon name="close" width={16} height={16} />
            </button>
            <span className="eyebrow">Cookie policy</span>
            <h2 style={{ marginTop: '0.8rem' }}>The short version</h2>
            <p className="dim" style={{ fontSize: '0.86rem', lineHeight: 1.7, marginTop: '0.6rem' }}>
              FiabaMia stores what it needs to work — your session, your Stars, your library and your sound preference —
              in your own browser’s local storage. Nothing leaves this device. If you accept statistics, an anonymous
              counter helps us understand which chapters get read to the end. You can withdraw it whenever you like
              from the footer.
            </p>
            <div className="row" style={{ marginTop: '1.4rem' }}>
              <button className="btn btn--gold btn--sm" onClick={() => { setCookies('accepted'); setPolicy(false) }}>
                Accept
              </button>
              <button className="btn btn--ghost btn--sm" onClick={() => { setCookies('rejected'); setPolicy(false) }}>
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </footer>
  )
}

/* ------------------------------------------------------------------ */
/* page                                                                */
/* ------------------------------------------------------------------ */
export default function Landing() {
  const veilRef = useRef<HTMLDivElement>(null)
  const [signInOpen, setSignInOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement
      const p = window.scrollY / Math.max(1, doc.scrollHeight - window.innerHeight)
      if (veilRef.current) veilRef.current.classList.toggle('is-deep', p > 0.93)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="site">
      <Starfield />
      <div className="dream-veil" ref={veilRef} />
      <Header />
      <SleepRail />

      <Hero />
      <Intro />
      <MadeToMeasure />
      <div data-chapter data-chapter-name="Sounds">
        <MusicSection />
        <GoldenSection />
      </div>
      <VoiceSection />
      <AgesSection />
      <div data-chapter data-chapter-name="Parents">
        <Testimonials />
        <StarsSection onNeedAuth={() => setSignInOpen(true)} />
      </div>
      <div data-chapter data-chapter-name="Goodnight">
        <HowSection />
        <FaqSection />
        <Finale />
      </div>
      <Footer />

      <CookieBanner />
      <InstallPrompt />
      <SignInModal open={signInOpen} onClose={() => setSignInOpen(false)} reason="Stars need somewhere to live" />
    </div>
  )
}

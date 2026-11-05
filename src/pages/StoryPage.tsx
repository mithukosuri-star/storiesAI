import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Header } from '../components/Header'
import { Icon } from '../components/Icons'
import { Pieces } from '../components/GoldenLine'
import { MoonGlyph } from '../components/Decor'
import { Loading } from '../components/Loading'
import { useToast, WritingOverlay } from '../components/Overlays'
import { useStore } from '../lib/store'
import { audio, speak, stopSpeaking } from '../lib/audio'
import { generateStory, voiceMeta, type Story } from '../lib/storyEngine'
import { moods, places, values } from '../lib/content'

const tints: Record<string, string> = {
  gentle: 'rgba(143, 180, 122, 0.16)',
  adventurous: 'rgba(221, 129, 104, 0.16)',
  magical: 'rgba(134, 169, 216, 0.18)',
  relaxing: 'rgba(230, 197, 105, 0.14)',
}

const sizes = ['1.1rem', '1.22rem', '1.38rem']

export default function StoryPage() {
  const { id } = useParams()
  const { stories, soundOn, toggleSound, removeStory, saveStory, spendStar, stars, ready } = useStore()
  const { show } = useToast()
  const navigate = useNavigate()
  const story = useMemo(() => stories.find((s) => s.id === id), [stories, id])

  const [sizeIdx, setSizeIdx] = useState(1)
  const [speaking, setSpeaking] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [activeChapter, setActiveChapter] = useState(0)
  const [writingNext, setWritingNext] = useState(false)
  const chapterRefs = useRef<(HTMLElement | null)[]>([])

  const mood = story ? moods.find((m) => m.id === story.input.moodId) : undefined
  const place = story ? places.find((p) => p.id === story.input.placeId) : undefined
  const value = story ? values.find((v) => v.id === story.input.valueId) : undefined

  useEffect(() => {
    document.title = story ? `${story.title} — FiabaMia` : 'Story — FiabaMia'
  }, [story])

  useEffect(() => {
    if (!story) return
    if (soundOn) audio.startMood(story.input.moodId as never, 0.9)
    return () => {
      stopSpeaking()
    }
  }, [story, soundOn])

  useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement
      const max = doc.scrollHeight - window.innerHeight
      setProgress(max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0)
      let cur = 0
      chapterRefs.current.forEach((el, i) => {
        if (el && el.getBoundingClientRect().top <= window.innerHeight * 0.4) cur = i
      })
      setActiveChapter(cur)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [story])

  if (!ready) {
    return (
      <div className="app-bg">
        <Header variant="app" />
        <main className="app-main container">
          <Loading />
        </main>
      </div>
    )
  }

  if (!story) {
    return (
      <div className="app-bg">
        <Header variant="app" />
        <main className="app-main container">
          <div className="empty">
            <h3>This page has gone to sleep</h3>
            <p>The story you are looking for is not in this library — maybe it was read on another device.</p>
            <div className="row" style={{ justifyContent: 'center' }}>
              <Link to="/create" className="btn btn--gold">
                Create a story
              </Link>
              <Link to="/library" className="btn btn--ghost">
                My library
              </Link>
            </div>
          </div>
        </main>
      </div>
    )
  }

  const readChapter = (chapterIndex: number) => {
    const chapter = story.chapters[chapterIndex]
    const key = chapter.id
    if (speaking === key) {
      stopSpeaking()
      setSpeaking(null)
      return
    }
    const text = chapter.paragraphs
      .map((p) => p.map((piece) => (typeof piece === 'string' ? piece : piece.word)).join(''))
      .join(' ')
    const meta = voiceMeta[chapter.voice]
    const ok = speak(text, { rate: meta.rate, pitch: meta.pitch })
    if (!ok) {
      show('Your browser cannot read aloud — but the chapter still shows its colour.')
      return
    }
    audio.duck(0.2, 2000)
    setSpeaking(key)
    window.setTimeout(() => {
      setSpeaking((cur) => (cur === key ? null : cur))
    }, Math.min(90000, Math.max(8000, text.length * 55)))
  }

  const toggleMusic = () => {
    toggleSound()
    if (!soundOn) {
      audio.setEnabled(true)
      audio.startMood(story.input.moodId as never, 0.9)
    } else {
      audio.setEnabled(false)
    }
  }

  return (
    <div className="reader-bg">
      <Header variant="app" />

      <div className="cover">
        <div
          className="cover-glow"
          style={{ background: `radial-gradient(50% 55% at 50% 40%, ${tints[story.input.moodId] ?? tints.gentle}, transparent 70%)` }}
        />
        <div className="container" style={{ position: 'relative' }}>
          <div className="cover-eyebrow">
            {story.input.kind === 'series' && (
              <>
                <span>Bedtime series · chapter {story.episode ?? 1}</span>
                <span>·</span>
              </>
            )}
            <span>{mood?.label ?? 'A bedtime story'}</span>
            <span>·</span>
            <span>{place?.label ?? 'Somewhere'}</span>
            <span>·</span>
            <span>{story.input.band} years</span>
          </div>
          <h1 className="cover-title">{story.title}</h1>
          <p className="cover-dedication">{story.dedication}</p>
          <div className="cover-meta">
            <div>
              Value<b>{value?.label ?? '—'}</b>
            </div>
            <div>
              Chapters<b>{story.chapterCount}</b>
            </div>
            <div>
              Reading time<b>≈ {story.minutes} min</b>
            </div>
            <div>
              Words<b>{story.words}</b>
            </div>
          </div>
        </div>
      </div>

      <div className="reader-bar">
        <div className="container reader-bar-inner">
          <div className="row" style={{ gap: '0.5rem' }}>
            <Link to="/library" className="icon-btn" aria-label="Back to library">
              <Icon name="arrowLeft" />
            </Link>
            <span className="mono-label" style={{ letterSpacing: '0.18em' }}>
              {story.chapters[activeChapter]?.title ?? 'The end'}
            </span>
          </div>
          <div className="reader-actions">
            <button
              className={`icon-btn${soundOn ? ' is-on' : ''}`}
              onClick={toggleMusic}
              aria-pressed={soundOn}
              aria-label={soundOn ? 'Mute music' : 'Play music'}
              title={soundOn ? 'Music on' : 'Music off'}
            >
              <Icon name={soundOn ? 'volume' : 'mute'} />
            </button>
            <button
              className="icon-btn"
              onClick={() => {
                setSizeIdx((i) => {
                  const next = (i + 1) % sizes.length
                  show(['Smaller text', 'Comfortable text', 'Larger text'][next])
                  return next
                })
              }}
              aria-label="Change text size"
              title="Text size"
            >
              <Icon name="textSize" />
            </button>
            <button
              className="icon-btn"
              onClick={() => {
                const text = document.querySelector('.prose')?.textContent ?? ''
                if (navigator.clipboard) {
                  void navigator.clipboard.writeText(`${story.title}\n\n${text}`)
                  show('The first chapter is on your clipboard.')
                }
              }}
              aria-label="Copy the first chapter"
              title="Copy"
            >
              <Icon name="copy" />
            </button>
            <Link to="/create" className="icon-btn" aria-label="Write another story" title="Another story">
              <Icon name="plus" />
            </Link>
          </div>
        </div>
        <div className="reader-progress" style={{ width: `${progress * 100}%` }} />
      </div>

      <div className="container reader-shell">
        <aside className="reader-side">
          <div className="side-label">Chapters</div>
          {story.chapters.map((c, i) => (
            <button
              key={c.id}
              className={`side-chapter${activeChapter === i ? ' is-now' : ''}`}
              onClick={() => chapterRefs.current[i]?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            >
              <span className="bar" style={{ background: `var(--voice-${c.voice})` }} />
              <span className="n">{String(i + 1).padStart(2, '0')}</span>
              <span>{c.title}</span>
            </button>
          ))}
          <div className="side-label" style={{ marginTop: '2rem' }}>
            Voice colours
          </div>
          {(['green', 'yellow', 'blue', 'red'] as const).map((v) => (
            <div key={v} className="side-chapter" style={{ cursor: 'default' }}>
              <span className="bar" style={{ background: `var(--voice-${v})` }} />
              <span style={{ textTransform: 'capitalize' }}>{v}</span>
              <span style={{ fontSize: '0.64rem', color: 'var(--muted-2)', marginLeft: 'auto' }}>{voiceMeta[v].hint.split(' · ')[0]}</span>
            </div>
          ))}
        </aside>

        <div>
          <div style={{ ['--reading-size' as string]: sizes[sizeIdx] }}>
            {story.chapters.map((chapter, ci) => {
              const meta = voiceMeta[chapter.voice]
              return (
                <section
                  key={chapter.id}
                  className="chapter"
                  ref={(el) => {
                    chapterRefs.current[ci] = el
                  }}
                >
                  <div className="chapter-head">
                    <span className="chapter-num">{String(ci + 1).padStart(2, '0')}</span>
                    <span className="voice-tag" style={{ ['--vc' as string]: `var(--voice-${chapter.voice})` }}>
                      <span className="dot" />
                      {meta.label} · {meta.hint}
                    </span>
                    <button
                      className="icon-btn"
                      onClick={() => readChapter(ci)}
                      aria-label="Read this chapter aloud"
                      title="Read aloud"
                      style={{ marginLeft: 'auto' }}
                    >
                      <Icon name={speaking === chapter.id ? 'pause' : 'play'} />
                    </button>
                  </div>
                  <h2 className="chapter-title">{chapter.title}</h2>
                  <div className="prose">
                    {chapter.paragraphs.map((p, pi) => (
                      <p key={pi}>
                        <Pieces
                          pieces={p}
                          onPlay={(label) => {
                            if (soundOn) show(`You heard ${label}`)
                          }}
                        />
                      </p>
                    ))}
                  </div>
                </section>
              )
            })}
          </div>

          <section className="talk">
            <span className="eyebrow">Let’s talk about it</span>
            <h2 style={{ marginTop: '1rem' }}>Three questions before the light goes off</h2>
            <p className="dim" style={{ fontSize: '0.9rem', marginBottom: '1.2rem', maxWidth: '46ch' }}>
              Ask them out loud, in no hurry. There are no right answers — only the ones you find together.
            </p>
            {story.questions.map((q, i) => (
              <div className="talk-q" key={i}>
                <span className="n">{i + 1}</span>
                <p>{q}</p>
              </div>
            ))}
          </section>

          <div className="reader-end">
            {story.input.kind === 'series' && (
              <button
                className="btn btn--gold"
                onClick={() => {
                  if (stars <= 0) {
                    show('You need one Star for the next chapter — claim a free pack in your library.')
                    return
                  }
                  setWritingNext(true)
                }}
              >
                <Icon name="sparkle" width={14} height={14} />
                Write chapter {(story.episode ?? 1) + 1}
              </button>
            )}
            <Link to="/create" className={story.input.kind === 'series' ? 'btn btn--ghost' : 'btn btn--gold'}>
              <Icon name="sparkle" width={14} height={14} />
              Write another
            </Link>
            <Link to="/library" className="btn btn--ghost">
              Back to the library
            </Link>
            <button
              className="btn btn--ghost btn--sm"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              Read it again
            </button>
            <button
              className="danger"
              style={{ marginLeft: 'auto' }}
              onClick={() => {
                removeStory(story.id)
                show('Story removed from the library.')
              }}
            >
              Remove
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', justifyContent: 'center', paddingBottom: '2rem', opacity: 0.6 }}>
            <MoonGlyph className="brand-mark" />
            <span className="mono-label">Goodnight</span>
          </div>
        </div>
      </div>

      {writingNext && (
        <WritingOverlay
          hero={story.input.names[0] ?? 'your hero'}
          onDone={() => {
            spendStar()
            const episode = (story.episode ?? 1) + 1
            const next: Story = generateStory(
              {
                ...story.input,
                episode,
                seriesId: story.input.seriesId ?? story.id,
              },
              `episode-${episode}`,
            )
            next.seriesTitle = story.seriesTitle ?? story.title
            next.title = `${story.seriesTitle ?? story.title} · chapter ${episode}`
            saveStory(next)
            setWritingNext(false)
            navigate(`/story/${next.id}`)
          }}
        />
      )}
    </div>
  )
}

export function storyTint(story: Story) {
  return tints[story.input.moodId] ?? tints.gentle
}

import { useState, type ReactNode } from 'react'
import { audio, type SfxId } from '../lib/audio'
import type { Piece } from '../lib/storyEngine'

const labels: Record<string, string> = {
  wind: 'the wind',
  bells: 'little bells',
  thunder: 'distant thunder',
  water: 'water',
  owl: 'an owl',
  crickets: 'crickets',
  magic: 'something magical',
  fire: 'a small fire',
  page: 'a page turning',
}

export function Pieces({ pieces, onPlay }: { pieces: Piece[]; onPlay?: (label: string) => void }) {
  const [hit, setHit] = useState<number | null>(null)

  return (
    <>
      {pieces.map((piece, i) => {
        if (typeof piece === 'string') return <span key={i}>{piece}</span>
        return (
          <button
            key={i}
            type="button"
            className={`gword${hit === i ? ' is-hit' : ''}`}
            onClick={(e) => {
              e.stopPropagation()
              audio.play(piece.sound)
              audio.duck()
              setHit(i)
              window.setTimeout(() => setHit(null), 780)
              onPlay?.(labels[piece.sound] ?? piece.sound)
            }}
            aria-label={`Play the sound of ${piece.word}`}
          >
            {piece.word}
          </button>
        )
      })}
    </>
  )
}

export function GoldenWord({
  word,
  sound,
  children,
  onPlay,
}: {
  word: string
  sound: SfxId
  children?: ReactNode
  onPlay?: (label: string) => void
}) {
  const [hit, setHit] = useState(false)
  return (
    <button
      type="button"
      className={`gword${hit ? ' is-hit' : ''}`}
      onClick={() => {
        audio.play(sound)
        audio.duck()
        setHit(true)
        window.setTimeout(() => setHit(false), 800)
        onPlay?.(labels[sound] ?? sound)
      }}
      aria-label={`Play the sound of ${word}`}
    >
      {children ?? word}
    </button>
  )
}

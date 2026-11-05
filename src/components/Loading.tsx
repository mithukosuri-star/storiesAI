import { MoonGlyph } from './Decor'

export function Loading({ label = 'Lighting the candles…' }: { label?: string }) {
  return (
    <div style={{ minHeight: '60dvh', display: 'grid', placeItems: 'center', textAlign: 'center', padding: '2rem' }}>
      <div>
        <MoonGlyph className="brand-mark" />
        <p className="mono-label" style={{ marginTop: '1rem' }}>
          {label}
        </p>
      </div>
    </div>
  )
}

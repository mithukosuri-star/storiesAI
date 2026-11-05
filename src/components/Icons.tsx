import type { SVGProps } from 'react'

type IconName =
  | 'courage' | 'sharing' | 'patience' | 'selfesteem' | 'kindness' | 'fear' | 'truth' | 'trust' | 'friendship'
  | 'gentle' | 'adventurous' | 'magical' | 'relaxing'
  | 'forest' | 'castle' | 'island' | 'space' | 'city' | 'mountain' | 'seabed' | 'glacier' | 'school' | 'playground' | 'ship' | 'farm'
  | 'play' | 'pause' | 'volume' | 'mute' | 'plus' | 'arrowRight' | 'arrowLeft' | 'check' | 'trash' | 'close'
  | 'install' | 'sparkle' | 'textSize' | 'bookmark' | 'mail' | 'copy' | 'moon' | 'book' | 'series' | 'single'
  | 'lock' | 'download' | 'star'

const paths: Record<IconName, JSX.Element> = {
  courage: (
    <path d="M12 3c2.6 3.2 4.6 5.4 4.6 8.4A4.6 4.6 0 0 1 12 16a4.6 4.6 0 0 1-4.6-4.6C7.4 8.4 9.4 6.2 12 3Zm0 13.5V21" />
  ),
  sharing: (
    <>
      <path d="M4 8h10l-2-2m2 2-2 2M20 16H10l2 2m-2-2 2-2" />
      <circle cx="12" cy="12" r="9" opacity=".35" />
    </>
  ),
  patience: (
    <>
      <path d="M7 3h10M7 21h10M8 3c0 4 8 5 8 9s-8 5-8 9M16 3c0 4-8 5-8 9s8 5 8 9" />
    </>
  ),
  selfesteem: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m12 7 1.5 3.4L17 11l-3.5.6L12 15l-1.5-3.4L7 11l3.5-.6L12 7Z" />
    </>
  ),
  kindness: <path d="M12 20s-7-4.3-7-9a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 4.7-7 9-7 9Z" />,
  fear: (
    <>
      <path d="M8 10h8l2 10H6l2-10Z" />
      <path d="M12 6c1-1.4 2.2-2 3-2M12 6c-1-1.4-2.2-2-3-2M12 3v3" />
      <path d="M12 13v4" />
    </>
  ),
  truth: (
    <>
      <path d="M2.5 12S6 6.5 12 6.5 21.5 12 21.5 12 18 17.5 12 17.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="2.6" />
    </>
  ),
  trust: (
    <>
      <path d="M3 12h5l2 2h4l2-2h5" />
      <path d="M8 12V8a1.6 1.6 0 0 1 3.2 0v2M16 12V8a1.6 1.6 0 0 0-3.2 0" />
      <path d="M3 12v4a3 3 0 0 0 3 3h12a3 3 0 0 0 3-3v-4" />
    </>
  ),
  friendship: (
    <>
      <circle cx="9" cy="9" r="3" />
      <circle cx="16" cy="10" r="2.4" />
      <path d="M3.5 20a5.5 5.5 0 0 1 11 0M14 20a4.6 4.6 0 0 1 6.5-4.2" />
    </>
  ),
  gentle: <path d="M16.5 3.8a8.4 8.4 0 1 0 3.7 13.5 7 7 0 0 1-3.7-13.5Z" />,
  adventurous: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m15.5 8.5-2 5-5 2 2-5 5-2Z" />
    </>
  ),
  magical: (
    <>
      <path d="m9 3 1.6 4.4L15 9l-4.4 1.6L9 15l-1.6-4.4L3 9l4.4-1.6L9 3Z" />
      <path d="m17.5 14 1 2.5 2.5 1-2.5 1-1 2.5-1-2.5L14 17.5l2.5-1 1-2.5Z" />
    </>
  ),
  relaxing: <path d="M3 8.5c2-2 4-2 6 0s4 2 6 0 4-2 6 0M3 13c2-2 4-2 6 0s4 2 6 0 4-2 6 0M3 17.5c2-2 4-2 6 0s4 2 6 0 4-2 6 0" />,
  forest: (
    <>
      <path d="m8 3 4 7H9.5l4 6H2.5l4-6H4l4-7Z" />
      <path d="M8 16v4M17 8l3 5h-2l3 4h-7l3-4h-2l3-5Z" />
    </>
  ),
  castle: (
    <>
      <path d="M4 21V9l2 1.5V7l2.5 1.5V7L11 8.5V21" />
      <path d="M14 21V10l3-2 3 2v11" />
      <path d="M11 21v-4h3v4M2.5 21h19" />
    </>
  ),
  island: (
    <>
      <path d="M4 18c2.4-2 5-2 8 0s5 2 8 0" />
      <path d="M9 16c0-4 1.5-6 4-9" />
      <path d="M13 7c2-1.6 4-1.6 6 0-2.4 0-4 .8-6 0Z" />
      <path d="M13 7c-1.6-1.8-3.4-2.2-5.4-1.2 1.8.6 3.2 1.4 5.4 1.2Z" />
    </>
  ),
  space: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M4 6c3 2 12 8 16 12" opacity=".7" />
      <circle cx="18.5" cy="6" r="1" />
      <circle cx="20" cy="18" r=".9" />
    </>
  ),
  city: (
    <>
      <path d="M3 21V10l4-2v13M7 21V6l4 2v13M11 21V11l5-2v12M16 21V8l5 2v11" />
      <path d="M2.5 21h19" />
    </>
  ),
  mountain: (
    <>
      <path d="m3 19 6-11 3.4 6 2-3.4L21 19H3Z" />
      <path d="M6.5 13.6 8 11l2 3.6" />
    </>
  ),
  seabed: (
    <>
      <path d="M3 12c4-5 10-5 14 0-4 5-10 5-14 0Z" />
      <path d="M17 12h3M6 8.5C7 6 9 5 11 5" />
      <circle cx="8" cy="11" r=".8" />
    </>
  ),
  glacier: (
    <>
      <path d="m2 19 5.5-11 3 5 2-3 4.5 9H2Z" />
      <path d="m12 5 .8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8.8-2Z" />
    </>
  ),
  school: (
    <>
      <path d="M12 6.5C10 4.8 7 4.5 4 5.5v13c3-1 6-.7 8 1 2-1.7 5-2 8-1v-13c-3-1-6-.7-8 1Z" />
      <path d="M12 6.5v13" />
    </>
  ),
  playground: (
    <>
      <path d="M4 21 8 4m12 17-4-17M8 4h1m6 0H9" />
      <path d="M6 12h12M9 12v6h6v-6" />
    </>
  ),
  ship: (
    <>
      <path d="M3 16h18l-2 4H5l-2-4Z" />
      <path d="M12 3v13M12 5c3 .6 5 2.4 6 5.6-2-1-4-1.2-6-.6M12 5c-2.6.6-4.4 2.4-5.4 5.6 1.8-1 3.6-1.2 5.4-.6" />
    </>
  ),
  farm: (
    <>
      <path d="M3 21V11l7-5 7 5v10" />
      <path d="M17 21V13h4v8M2.5 21h19" />
      <path d="M9 21v-5h4v5" />
    </>
  ),
  play: <path d="M8 5.5v13l11-6.5-11-6.5Z" />,
  pause: <path d="M9 5v14M15 5v14" />,
  volume: (
    <>
      <path d="M4 9.5h3L12 5v14l-5-4.5H4v-5Z" />
      <path d="M16 8.5a5 5 0 0 1 0 7M19 6a9 9 0 0 1 0 12" />
    </>
  ),
  mute: (
    <>
      <path d="M4 9.5h3L12 5v14l-5-4.5H4v-5Z" />
      <path d="m16 9.5 5 5M21 9.5l-5 5" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  arrowRight: <path d="M4 12h15m-6-6 6 6-6 6" />,
  arrowLeft: <path d="M20 12H5m6 6-6-6 6-6" />,
  check: <path d="m5 12.5 4.5 4.5L19 7" />,
  trash: <path d="M4 7h16M9 7V4.5h6V7M6.5 7l1 13h9l1-13M10 11v6M14 11v6" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  install: (
    <>
      <path d="M12 3v11m0 0 4-4m-4 4-4-4" />
      <path d="M4 15v3.5A2.5 2.5 0 0 0 6.5 21h11a2.5 2.5 0 0 0 2.5-2.5V15" />
    </>
  ),
  sparkle: <path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3ZM18.5 16l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2Z" />,
  textSize: <path d="M3 19 8.5 5l5.5 14M5 15h7M15 19l3-8 3 8m-5-3h4" />,
  bookmark: <path d="M6 3h12v18l-6-4.5L6 21V3Z" />,
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="1.5" />
      <path d="m3.5 6.5 8.5 7 8.5-7" />
    </>
  ),
  copy: (
    <>
      <rect x="9" y="9" width="11" height="11" rx="1.5" />
      <path d="M15 6.5V5.5A1.5 1.5 0 0 0 13.5 4H5.5A1.5 1.5 0 0 0 4 5.5v8A1.5 1.5 0 0 0 5.5 15h1" />
    </>
  ),
  moon: <path d="M16.5 3.8a8.4 8.4 0 1 0 3.7 13.5 7 7 0 0 1-3.7-13.5Z" />,
  book: (
    <>
      <path d="M4 5.5A2 2 0 0 1 6 3.5h5.5v17H6a2 2 0 0 0-2 2v-17Z" />
      <path d="M20 5.5a2 2 0 0 0-2-2h-5.5v17H18a2 2 0 0 1 2 2v-17Z" />
    </>
  ),
  series: (
    <>
      <rect x="3" y="4" width="7" height="16" rx="1" />
      <rect x="12" y="4" width="7" height="16" rx="1" />
      <path d="M6.5 8h0M15.5 8h0" />
    </>
  ),
  single: (
    <>
      <path d="M6 3h9l4 4v14H6V3Z" />
      <path d="M15 3v4h4M9.5 12h6M9.5 16h4" />
    </>
  ),
  lock: (
    <>
      <rect x="4.5" y="10" width="15" height="10.5" rx="2" />
      <path d="M8 10V7.5a4 4 0 0 1 8 0V10" />
    </>
  ),
  download: <path d="M12 3v12m0 0 4.5-4.5M12 15l-4.5-4.5M4 20h16" />,
  star: <path d="m12 2.8 2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.6l-5.8 3.1 1.1-6.5L2.6 9.6l6.5-.9L12 2.8Z" />,
}

export function Icon({ name, ...props }: { name: IconName | string } & SVGProps<SVGSVGElement>) {
  const node = paths[name as IconName] ?? paths.sparkle
  return (
    <svg
      viewBox="0 0 24 24"
      fill={name === 'star' ? 'currentColor' : 'none'}
      stroke={name === 'star' ? 'none' : 'currentColor'}
      strokeWidth={1.15}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {node}
    </svg>
  )
}

export function BrandMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M15.4 2.6a9.6 9.6 0 1 0 5.9 14.7 7.9 7.9 0 0 1-5.9-14.7Z" fill="currentColor" opacity=".92" />
      <path d="m19.4 5.2.9 2.2 2.2.9-2.2.9-.9 2.2-.9-2.2-2.2-.9 2.2-.9.9-2.2Z" fill="currentColor" />
    </svg>
  )
}

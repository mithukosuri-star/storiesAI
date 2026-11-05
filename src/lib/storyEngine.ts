/**
 * FiabaMia story engine.
 *
 * It composes an original bedtime story from the choices made in the form:
 * hero name(s), age band, value, place, mood, length and an optional little villain.
 * Everything runs on the device — no network, no key, no waiting — so a story
 * can still be written at 21:40 with the wi-fi off.
 */
import type { SfxId } from './audio'

export type VoiceId = 'green' | 'yellow' | 'blue' | 'red'
export type Length = 'short' | 'medium' | 'long'
export type Band = '0–2' | '3–4' | '5–6' | '7–8' | '9–10'

export type Piece = string | { word: string; sound: SfxId }
export type Chapter = {
  id: string
  title: string
  voice: VoiceId
  hint: string
  paragraphs: Piece[][]
  goldenCount: number
}
export type StoryInput = {
  kind: 'single' | 'series'
  names: string[]
  band: Band
  valueId: string
  placeId: string
  moodId: string
  villain: boolean
  length: Length
  extras?: string
  characters?: string
  note?: string
  seriesId?: string
  episode?: number
}
export type Story = {
  id: string
  title: string
  dedication: string
  input: StoryInput
  chapterCount: number
  minutes: number
  words: number
  chapters: Chapter[]
  questions: string[]
  createdAt: number
  episode?: number
  seriesId?: string
  seriesTitle?: string
}

const hints: Record<VoiceId, string> = {
  green: 'calm · slow · gentle',
  yellow: 'cheerful · lively · smiling',
  blue: 'clear · steady · guiding',
  red: 'quick · punchy · energetic',
}

const sounds: SfxId[] = ['wind', 'bells', 'thunder', 'water', 'owl', 'crickets', 'fire', 'magic', 'page']

/* ------------------------------------------------------------------ */
/* deterministic randomness                                            */
/* ------------------------------------------------------------------ */
function hash(str: string) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}
function rng(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/* ------------------------------------------------------------------ */
/* worlds                                                              */
/* ------------------------------------------------------------------ */
type Lex = {
  name: string
  entry: string
  smell: string
  light: string
  smallThing: string
  guide: string
  guideDesc: string
  object: string
  problem: string
  sound: SfxId
  secondSound: SfxId
  golden: { wind?: string; bells?: string; water?: string; owl?: string; crickets?: string; fire?: string; thunder?: string; magic?: string; page?: string }
}

const world: Record<string, Lex> = {
  forest: {
    name: 'the Enchanted Forest',
    entry: 'The forest began exactly where the garden fence forgot to end, and the first thing it did was hold its breath.',
    smell: 'the smell of rain that had not fallen yet',
    light: 'a green light that came from the leaves instead of the sky',
    smallThing: 'a pine cone that was still warm',
    guide: 'Nocciola',
    guideDesc: 'a fox with silver whiskers and a lantern for a tail',
    object: 'the Lantern of Lost Steps',
    problem: 'someone had folded the paths together so that every walk ended where it started',
    sound: 'wind',
    secondSound: 'owl',
    golden: { wind: 'rustle', owl: 'owl', crickets: 'crickets', water: 'stream' },
  },
  castle: {
    name: 'the Wandering Castle',
    entry: 'The castle arrived the way castles do, quietly, one tower at a time, and it parked itself politely behind the hill.',
    smell: 'the smell of old stone and older soup',
    light: 'candlelight that leaned out of the windows to look at you',
    smallThing: 'a brass key that hummed when it was held',
    guide: 'Sir Poff',
    guideDesc: 'a suit of armour with nothing inside but a very polite cough',
    object: 'the Compass That Points Home',
    problem: 'the castle had forgotten which hill it belonged to and had been walking all night',
    sound: 'bells',
    secondSound: 'wind',
    golden: { bells: 'bells', wind: 'breeze', fire: 'torch', thunder: 'storm' },
  },
  island: {
    name: 'the Mysterious Island',
    entry: 'The island was not on any map, which is precisely why the sea kept it, the way you keep a secret in your pocket.',
    smell: 'the smell of salt, warm sand and someone’s forgotten picnic',
    light: 'a lighthouse beam that swept the water like a slow brush',
    smallThing: 'a shell that whispered numbers',
    guide: 'Tita',
    guideDesc: 'a turtle who had been everywhere and remembered none of it',
    object: 'the Bottle of Small Tides',
    problem: 'the sea had stopped coming back, and the island was getting lonely',
    sound: 'water',
    secondSound: 'wind',
    golden: { water: 'waves', wind: 'sea wind', crickets: 'night insects', thunder: 'far storm' },
  },
  space: {
    name: 'Infinite Space',
    entry: 'Space begins just past the roof, if you climb out carefully and do not wake the antenna.',
    smell: 'the smell of cold metal and birthday candles',
    light: 'a comet crossing slowly, dragging its bright hair',
    smallThing: 'a star that fit in one hand and purred',
    guide: 'Pia',
    guideDesc: 'a comet who was slightly lost and pretending not to be',
    object: 'the Pocket of Night',
    problem: 'the stars had begun to switch off one by one, because nobody was saying goodnight to them',
    sound: 'magic',
    secondSound: 'wind',
    golden: { magic: 'chime', wind: 'solar wind', thunder: 'distant boom', bells: 'star bells' },
  },
  city: {
    name: 'the Magic City',
    entry: 'The city woke up at night, like all cities do, but this one also put on its slippers first.',
    smell: 'the smell of rain on warm pavement and someone baking late',
    light: 'a thousand windows, each one a small yellow promise',
    smallThing: 'a tram ticket to a street that does not exist',
    guide: 'Ottavio',
    guideDesc: 'a lamplighter with a ladder and no hurry at all',
    object: 'the Map of Streets That Appear',
    problem: 'the city had lost its quietest street, the one where the tired people go to sit down',
    sound: 'water',
    secondSound: 'crickets',
    golden: { water: 'fountain', crickets: 'crickets', bells: 'bicycle bell', thunder: 'thunder' },
  },
  mountain: {
    name: 'the Ancient Mountain',
    entry: 'The mountain was there before the word for mountain, and it had opinions.',
    smell: 'the smell of snow and pine resin',
    light: 'blue light that made everything look like a memory',
    smallThing: 'a stone that was warmer than it should be',
    guide: 'Bruno',
    guideDesc: 'a goat with a beard like a small cloud and excellent manners',
    object: 'the Bell That Calls the Dawn',
    problem: 'the dawn had overslept for six days, and the valley was beginning to worry',
    sound: 'wind',
    secondSound: 'bells',
    golden: { wind: 'mountain wind', bells: 'bell', thunder: 'echoing thunder', water: 'meltwater' },
  },
  seabed: {
    name: 'the Secret Seabed',
    entry: 'Under the last wave there is a door with no handle, and behind it the sea keeps its gentlest things.',
    smell: 'the smell of salt and cold rock',
    light: 'a blue light with small golden fish inside it',
    smallThing: 'a pearl that was still humming',
    guide: 'Luna',
    guideDesc: 'a whale who spoke only in long, patient sentences',
    object: 'the Coral Bell',
    problem: 'the coral had gone quiet, and the little fish had nowhere to put their songs',
    sound: 'water',
    secondSound: 'bells',
    golden: { water: 'bubbles', bells: 'coral bells', magic: 'shimmer', wind: 'current' },
  },
  glacier: {
    name: 'the Shining Glacier',
    entry: 'The glacier hums, very low, the way a giant hums when it is trying not to frighten anybody.',
    smell: 'the smell of cold that smells of nothing at all',
    light: 'light that had been sleeping inside the ice for a hundred winters',
    smallThing: 'an icicle shaped exactly like a spoon',
    guide: 'Fiocco',
    guideDesc: 'a snow hare who wore the wind as a scarf',
    object: 'the Warm Stone',
    problem: 'the ice was melting a little faster each night, and nobody had asked it how it felt',
    sound: 'wind',
    secondSound: 'water',
    golden: { wind: 'icy wind', water: 'dripping', bells: 'ice chime', thunder: 'cracking ice' },
  },
  school: {
    name: 'the Extraordinary School',
    entry: 'The school looked ordinary from the street, which was the first clue that it was not.',
    smell: 'the smell of chalk, orange peel and secrets',
    light: 'desk lamps that switched on when someone had a good idea',
    smallThing: 'a pencil that only wrote the truth',
    guide: 'Professor Ombra',
    guideDesc: 'a blackboard eraser with a bow tie and very strong opinions',
    object: 'the Key to the Room That Is Not on the Plan',
    problem: 'the school had a room nobody could enter, and it had begun to knock politely from the inside',
    sound: 'page',
    secondSound: 'bells',
    golden: { page: 'page turning', bells: 'school bell', crickets: 'courtyard insects', wind: 'open window' },
  },
  playground: {
    name: 'the Magic Playground',
    entry: 'The playground was empty, except for the swings, which were swinging by themselves, politely, waiting for someone.',
    smell: 'the smell of cut grass and bubble gum',
    light: 'a streetlamp that made everything look like a birthday',
    smallThing: 'a marble that showed the future for one second',
    guide: 'Ruggero',
    guideDesc: 'a football with a very good attitude',
    object: 'the Whistle of Fair Turns',
    problem: 'the playground had forgotten how to share the slide, and everyone had stopped playing',
    sound: 'wind',
    secondSound: 'crickets',
    golden: { wind: 'swing whoosh', crickets: 'crickets', bells: 'bell', water: 'puddle splash' },
  },
  ship: {
    name: 'the Winged Sailing Ship',
    entry: 'It was a ship, but it had wings, and the wings were doing their best to look like sails.',
    smell: 'the smell of tar, oranges and wind',
    light: 'a lantern at the prow, swinging like a slow clock',
    smallThing: 'a rope that tied itself into useful knots',
    guide: 'Capitano Bibi',
    guideDesc: 'a seagull with a captain’s hat and no sense of direction',
    object: 'the Compass of Almost Anywhere',
    problem: 'the wind had run away, and the ship had been sitting still for four whole nights',
    sound: 'wind',
    secondSound: 'water',
    golden: { wind: 'wind in sails', water: 'waves', bells: 'ship bell', thunder: 'storm' },
  },
  farm: {
    name: 'the Cheerful Farm',
    entry: 'The farm woke at five, but the interesting part started at seven, when the eggs began to tell jokes.',
    smell: 'the smell of hay, milk and warm bread',
    light: 'a sunrise that had clearly been practising',
    smallThing: 'a feather that pointed north',
    guide: 'Nonna Rosa',
    guideDesc: 'a hen with a shawl and a plan',
    object: 'the Horn of Gentle Mornings',
    problem: 'the rooster had lost his voice, and the whole farm had overslept into the afternoon',
    sound: 'crickets',
    secondSound: 'bells',
    golden: { crickets: 'crickets', bells: 'cowbell', wind: 'straw rustle', water: 'trough water' },
  },
}

/* ------------------------------------------------------------------ */
/* values                                                              */
/* ------------------------------------------------------------------ */
type ValueLex = {
  label: string
  action: string
  whisper: string
  moral: string
  questions: (hero: string, other: string) => string[]
}

const valuesLex: Record<string, ValueLex> = {
  courage: {
    label: 'courage',
    action: 'took one small step forward, which is the only size courage ever comes in',
    whisper: 'Courage is not the absence of the wobble. It is the wobble, going forward anyway.',
    moral: 'And that is how courage works: it never arrives before you need it, only at the exact moment you take the first step.',
    questions: (h) => [
      `What was the scariest moment for ${h} in the story, and what made it less scary?`,
      `Can you remember a time you were brave even though your tummy felt wobbly?`,
      `Who could you help tomorrow with a little bit of your courage?`,
    ],
  },
  sharing: {
    label: 'sharing',
    action: 'opened both hands, which is what sharing looks like before it becomes a word',
    whisper: 'What is shared does not get smaller. It gets warmer.',
    moral: 'And that is the strange arithmetic of sharing: the more you give away, the fuller your pockets become.',
    questions: (h) => [
      `What did ${h} share, and how did it change the night?`,
      `Is there something you find hard to share? What makes it hard?`,
      `What is the best thing anyone has ever shared with you?`,
    ],
  },
  patience: {
    label: 'patience',
    action: 'sat down, folded their hands, and let the waiting be part of the story',
    whisper: 'Some things only happen to people who are still there when they happen.',
    moral: 'And that is what patience is: not doing nothing, but trusting the thing that is quietly growing in the dark.',
    questions: (h) => [
      `What had to wait in the story, and why was the waiting worth it?`,
      `What is something you are waiting for right now?`,
      `How can waiting feel nicer — what could you do while you wait?`,
    ],
  },
  selfesteem: {
    label: 'self-belief',
    action: 'stopped apologising for being exactly the right size',
    whisper: 'You do not have to be bigger to be enough.',
    moral: 'And that is the secret nobody tells you: the light was never borrowed. It was yours the whole time.',
    questions: (h) => [
      `What did ${h} discover about themselves in the story?`,
      `What is something you are really good at that nobody taught you?`,
      `When does your light feel brightest?`,
    ],
  },
  kindness: {
    label: 'kindness',
    action: 'said one small kind thing, which is a whole door opening',
    whisper: 'Gentle words are the cheapest magic there is, and the strongest.',
    moral: 'And that is how kindness travels: quietly, hand to hand, until the whole dark room is warm.',
    questions: (h) => [
      `Which kind act in the story surprised you the most?`,
      `What kind thing could you do tomorrow without being asked?`,
      `How does your body feel when someone is kind to you?`,
    ],
  },
  fear: {
    label: 'chasing away fear',
    action: 'looked directly at the dark until the dark got a little shy',
    whisper: 'The dark is only a colour. It cannot hold anything that you cannot name.',
    moral: 'And that is the thing about fear: it is very big until you say its name out loud, and then it is mostly just a shape.',
    questions: (h) => [
      `What was ${h} afraid of, and what helped?`,
      `What helps you when you feel scared at night?`,
      `If your fear were an animal, what would it look like — and what would it want?`,
    ],
  },
  truth: {
    label: 'telling the truth',
    action: 'told the truth even though a small lie would have been so much easier',
    whisper: 'The truth is heavier to lift but lighter to carry.',
    moral: 'And that is why the truth is worth the trouble: a lie has to be carried all night, and the truth can be put down.',
    questions: (h) => [
      `Why was it hard for ${h} to tell the truth?`,
      `Have you ever been glad you told the truth, even late?`,
      `What makes it easier to be honest with someone?`,
    ],
  },
  trust: {
    label: 'trust',
    action: 'held out a hand and let somebody else hold it',
    whisper: 'Trust is a bridge you build by walking on it.',
    moral: 'And that is how trust is made: not all at once, but one held hand at a time.',
    questions: (h) => [
      `Who did ${h} decide to trust, and how did they earn it?`,
      `Who do you trust with your secrets? Why them?`,
      `What makes it hard to trust someone new?`,
    ],
  },
  friendship: {
    label: 'friendship',
    action: 'made room on the bench, which is the oldest magic in the world',
    whisper: 'A friend is someone who lets you be a little bit unfinished.',
    moral: 'And that is what friends are for: to sit with you in the dark until the dark stops being the point.',
    questions: (h) => [
      `How did ${h} and their friend help each other?`,
      `What makes someone a good friend, in your opinion?`,
      `Is there a friend you would like to say thank you to?`,
    ],
  },
}

/* ------------------------------------------------------------------ */
/* villains                                                            */
/* ------------------------------------------------------------------ */
type Villain = { name: string; what: string; stole: string; thing: string; reason: string; gift: string }

const villains: Villain[] = [
  { name: 'Grugno', what: 'a badger the size of a boot with a very loud sigh', stole: 'the fireflies’ light, one jar at a time', thing: 'fireflies', reason: 'he had never once been invited to a birthday', gift: 'a jar with the lid left open' },
  { name: 'Sibilla', what: 'a moth with one crooked wing and excellent manners', stole: 'the last page of every story', thing: 'last pages', reason: 'she was afraid of goodbyes', gift: 'a bookmark made of moonlight' },
  { name: 'Mastro Ombrello', what: 'an umbrella who had been left open once too often', stole: 'the rain, and kept it in his pockets', thing: 'rain', reason: 'nobody had ever asked him to come inside', gift: 'a small shower for the flowers' },
  { name: 'Tic', what: 'a clockwork mouse who ran eleven minutes fast', stole: 'the quiet hour between dinner and sleep', thing: 'quiet hour', reason: 'he was terrified of stopping', gift: 'one whole unhurried minute' },
  { name: 'La Contessa Polvere', what: 'a dust bunny with a crown and a grudge', stole: 'the corners where small things are kept', thing: 'corners', reason: 'she had been swept away one time too many', gift: 'a soft grey corner, just for her' },
  { name: 'Borborygmus', what: 'a thundercloud with a stomach ache', stole: 'the lullabies, to keep his thunder company', thing: 'lullabies', reason: 'nobody had ever sung to him', gift: 'a very small, very polite thunderclap' },
  { name: 'Nina Notturna', what: 'a shadow who had forgotten whose shadow she was', stole: 'the edges of things, so she would not feel so thin', thing: 'edges', reason: 'she wanted to be seen, just once', gift: 'a lantern that casts no fear' },
]

/* ------------------------------------------------------------------ */
/* sentence banks                                                      */
/* ------------------------------------------------------------------ */
const openers = (n: string, place: Lex) => [
  `Once, on a night that was not quite a Tuesday, ${n} could not sleep.`,
  `This is the story of ${n}, and of a night that decided to be different.`,
  `Nobody knows exactly how it began. Most likely, ${n} was simply the last one awake.`,
]
const closingYoung = (n: string) => [
  `And then ${n} closed their eyes, and the night did the rest.`,
  `Goodnight, ${n}. The story keeps the light on for you.`,
  `And if you listen very carefully, you can still hear the night breathing, slowly, like a friend.`,
]

/* ------------------------------------------------------------------ */
/* builder                                                             */
/* ------------------------------------------------------------------ */
function P(...parts: Piece[]): Piece[] {
  return parts
}
/**
 * Golden words are written inline as ⟦word¦sound⟧ so the prose stays readable
 * in the source; the marker is turned into a tappable segment when the
 * chapter is assembled.
 */
function g(word: string, sound: SfxId): string {
  return `⟦${word}¦${sound}⟧`
}

const GOLDEN = /⟦([^¦]+)¦([a-z]+)⟧/g

function toPieces(parts: Piece[]): Piece[] {
  const out: Piece[] = []
  for (const part of parts) {
    if (typeof part !== 'string') {
      out.push(part)
      continue
    }
    let last = 0
    let match: RegExpExecArray | null
    GOLDEN.lastIndex = 0
    while ((match = GOLDEN.exec(part))) {
      if (match.index > last) out.push(part.slice(last, match.index))
      out.push({ word: match[1], sound: match[2] as SfxId })
      last = match.index + match[0].length
    }
    if (last < part.length) out.push(part.slice(last))
  }
  return out.filter((piece) => typeof piece !== 'string' || piece.length > 0)
}

function parseExtras(raw?: string) {
  if (!raw) return []
  return raw
    .split(/[,;\n]+/)
    .map((s) => s.trim())
    .filter(Boolean)
}

export function generateStory(input: StoryInput, seedSalt = ''): Story {
  const rand = rng(hash(JSON.stringify(input) + seedSalt + Date.now().toString().slice(0, -4)))
  const pick = <T,>(arr: T[]): T => arr[Math.floor(rand() * arr.length)]
  const place = world[input.placeId] ?? world.forest
  const val = valuesLex[input.valueId] ?? valuesLex.courage
  const names = input.names.filter(Boolean)
  const hero = names[0] || 'Little One'
  const siblings = names.slice(1)
  const heroGroup = names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}` : hero
  const young = input.band === '0–2' || input.band === '3–4'
  const older = input.band === '9–10'
  const villain = input.villain ? pick(villains) : null
  const extras = parseExtras(input.extras)
  const companions = parseExtras(input.characters)
  const guide = companions[0] || place.guide
  const guideDesc = companions.length ? `a friend of yours, who had promised to help` : place.guideDesc

  const cap = (t: string) => t.replace(/^./, (c) => c.toUpperCase())
  const stripThe = (t: string) => t.replace(/^the /i, '')
  const titleBank = [
    `The Night ${place.name} Learned ${cap(val.label)}`,
    `${heroGroup} and the ${stripThe(place.object)}`,
    `A Very Small ${cap(val.label)}`,
    `The ${stripThe(place.name)} at the End of the Garden`,
    `${heroGroup} and the Night That Would Not Sleep`,
  ]
  const title = pick(titleBank)
  const seriesTitle = input.kind === 'series' ? `${heroGroup} and ${place.name.replace(/^the /, 'the ')}` : undefined

  const ch: Chapter[] = []
  const add = (title: string, voice: VoiceId, paragraphs: Piece[][]) => {
    const parsed = paragraphs.map(toPieces)
    let golden = 0
    parsed.forEach((p) => p.forEach((piece) => typeof piece !== 'string' && golden++))
    ch.push({
      id: `ch-${ch.length + 1}`,
      title,
      voice,
      hint: hints[voice],
      paragraphs: parsed,
      goldenCount: golden,
    })
  }

  /* --- Chapter 1: the door --------------------------------------- */
  const c1: Piece[][] = []
  c1.push(P(pick(openers(hero, place))))
  c1.push(
    young
      ? P(`Outside the window the night went hush. Hush, ${g('hush', 'wind')}. Hush, little ${g('leaves', 'wind')}.`)
      : older
        ? P(
            `Outside, the house had gone quiet in that particular way houses do when they are pretending to be furniture. ${hero} lay very still and listened to it, and it was exactly then that the ${g('wind', place.sound)} began.`,
          )
        : P(
            `Outside, the night was doing its usual night things — ${g('rustling', place.sound)}, a dog two streets away, the fridge humming to itself — and then it did something unusual.`,
          ),
  )
  c1.push(
    P(
      `Where the moonlight touched the floor, a door appeared. Not a big door. A door the size of a dinner plate, with a brass handle that was warm to the touch.`,
    ),
  )
  if (siblings.length) {
    c1.push(
      P(
        `${siblings.join(' and ')} were already awake, of course, sitting on the end of the bed with the particular patience of people who had been waiting to be invited.`,
      ),
    )
  }
  if (young) {
    c1.push(P(`“${hero},” whispered the door. “Tap tap. Come in.”`))
  } else {
    c1.push(
      P(
        `“${hero},” said a voice from the other side, clear as a spoon on a glass. “I am sorry to bother you at this hour. We have a small emergency, and it has your name on it.”`,
      ),
    )
  }
  c1.push(P(`And because ${heroGroup} ${young ? (names.length > 1 ? 'were curious' : 'was curious') : 'had never once been able to resist a small door'}, ${young ? 'in they went' : 'through it they went, without stopping to put on slippers'}.`))
  c1.push(
    P(
      `${place.entry} It smelled of ${place.smell.replace(/^the smell of /, '')}, and there was ${place.light}.`,
    ),
  )
  add('The door at the edge of sleep', 'green', c1)

  /* --- Chapter 2: the guide -------------------------------------- */
  const c2: Piece[][] = []
  c2.push(P(`At first there was only the dark, and the dark was not unkind. Then something cleared its throat.`))
  c2.push(
    P(
      `It was ${guide} — ${guideDesc}. “You came,” said ${guide}.`,
      ` “Everybody comes eventually. Nobody comes on time.”`,
    ),
  )
  if (companions.length > 1) {
    c2.push(P(`${companions.slice(1).join(' and ')} were there too, and pretended, rather badly, that they had not been worried.`))
  }
  c2.push(
    P(
      `“There is something wrong in ${place.name},” said ${guide}. “${place.problem.replace(/^the/, 'The').replace(/^someone/, 'Someone')}.”`,
    ),
  )
  if (older) {
    c2.push(
      P(
        `${hero} wanted to ask why it had to be them, of all people, on this of all nights. But something in the way the dark was listening made the question feel smaller than the answer.`,
      ),
    )
  } else if (young) {
    c2.push(P(`“Oh!” said ${hero}. And then, very bravely: “We can help.”`))
  } else {
    c2.push(P(`“Why me?” asked ${hero}. “Because you were awake,” said ${guide}, which is honestly how most adventures begin.`))
  }
  c2.push(P(`So off they went, ${young ? 'step, step, step' : 'with the particular crunch of feet on a story'}, toward the middle of ${place.name}, carrying nothing but ${place.smallThing} and a little too much hope.`))
  add('A name in the dark', 'blue', c2)

  /* --- Chapter 3: the villain ------------------------------------ */
  if (villain) {
    const c3: Piece[][] = []
    c3.push(
      P(
        `That is when they heard it: a small, offended ${g('sigh', 'wind')}, then a second one, then a whole orchestra of sighs.`,
      ),
    )
    c3.push(P(`It was ${villain.name} — ${villain.what}. And it was ${villain.name} who had taken ${villain.stole}.`))
    c3.push(
      P(
        `“Go away,” said ${villain.name}, in the voice of somebody who wanted very much for nobody to go away. “I am extremely busy being a problem.”`,
      ),
    )
    if (older) {
      c3.push(
        P(
          `${hero} looked at ${villain.name} the way you look at a dog that has bitten you and is now embarrassed about it. There was something underneath the grumpiness. Something like a bruise.`,
        ),
      )
    } else {
      c3.push(P(`But ${hero} did not run. ${hero} did something much more surprising. ${hero} sat down.`))
    }
    c3.push(
      P(`Something in the way ${hero} listened made ${villain.name} forget, for a moment, how to be a problem.`),
      P(`“Tell me,” said ${hero}. And ${villain.name} did, in a great rush, ${villain.reason ? `because ${villain.reason}.` : 'because nobody had ever asked.'}`),
    )
    add(`${villain.name}, who made a great deal of noise`, 'red', c3)
  }

  /* --- Chapter 4: the quest -------------------------------------- */
  const c4: Piece[][] = []
  c4.push(
    P(
      `To put things right, they needed ${place.object}, which ${older ? 'was not so much a thing as an agreement between two very old promises' : 'was small, stubborn and lighter than it looked'}.`,
    ),
  )
  c4.push(
    P(
      young
        ? `They went ${g('tap, tap, tap', 'wind')} along the path. They went ${g('splash, splash', place.secondSound)} through the puddle.`
        : `The way there was not straight, because stories never are. It went past ${g('whispering', 'wind')} things and ${g('ringing', 'bells')} things and one thing that ${hero} decided not to look at twice.`,
    ),
  )
  if (extras.length) {
    c4.push(P(`They carried ${extras.join(', ')}, which turned out to be exactly the right things to carry.`))
  }
  c4.push(
    P(
      `${hero} ${val.action}, and ${place.object} answered — quietly at first, then all at once, in a sound like ${g('a held breath letting go', 'magic')}.`,
    ),
  )
  if (older) {
    c4.push(
      P(
        `It would be nice to say this was the easy part. It was not. But ${hero} had learned by then that the hard parts are usually the ones you remember kindly afterwards.`,
      ),
    )
  } else {
    c4.push(P(`And the whole of ${place.name} sat up to watch.`))
  }
  if (input.length === 'long') {
    c4.push(
      P(
        `${guide} whispered the words that had been kept for exactly this moment: “${val.whisper}” And ${hero} understood, in the way you understand things at night, that it had been true all along.`,
      ),
      P(
        `Behind them, the ${g('leaves', place.sound)} were applauding very quietly, the way leaves do when they do not want to make a fuss.`,
      ),
    )
  }
  add(`The ${stripThe(place.object)}`, 'blue', c4)

  /* --- Chapter 5: repair ----------------------------------------- */
  const c5: Piece[][] = []
  if (villain) {
    c5.push(P(`Back they went, to the small offended sigh in the dark.`))
    c5.push(
      P(
        `“I have brought you something,” said ${hero}, “but it is not what you think.” And it was not ${villain.name}’s ${villain.thing} — and it was not an apology, exactly. It was ${villain.gift}.`,
      ),
    )
    c5.push(
      P(
        `At first ${villain.name} did not move. Then a small, terrible wobble went through the grumpiness, and behind it there was something wet and shiny that had probably been there the whole time.`,
      ),
    )
    c5.push(P(`“Oh,” said ${villain.name}, very quietly. “Oh, that is different.”`))
    c5.push(P(`And because ${heroGroup} ${names.length > 1 ? 'were' : 'was'} kind, and kindness is mostly a decision, ${names.length > 1 ? 'they' : hero} stayed until the sky began to think about morning.`))
  } else {
    c5.push(
      P(
        `And when ${hero} finally found the heart of it — a small, warm, stubborn thing — it turned out to be nothing more frightening than somebody’s forgotten promise, waiting to be picked up again.`,
      ),
    )
    c5.push(P(`“Oh,” said ${hero}. “That is all it was.” And that is usually all it is.`))
  }
  c5.push(P(`${val.whisper}`))
  add('What had been forgotten', 'green', c5)

  /* --- Chapter 6: home ------------------------------------------- */
  if (input.length !== 'short') {
    const c6: Piece[][] = []
    c6.push(P(`The way home was shorter, as it always is. ${young ? 'Hop, hop, hop.' : 'The door was waiting, and it had left the handle warm.'}`))
    c6.push(P(`On the other side, the bedroom was exactly as it had been, which felt almost rude.`))
    if (villain) {
      c6.push(P(`On the windowsill, where the moonlight was, sat ${villain.name} — very small, very quiet, and very much forgiven.`))
    }
    c6.push(P(`${val.moral}`))
    if (input.length === 'long') {
      c6.push(
        P(
          `${hero} lay back down in the exact warm shape they had left in the bed, and discovered that the pillow had been keeping the story safe all along.`,
        ),
        P(`Somewhere in the house a door closed, very softly, as if the night had finished its work for tonight.`),
      )
    }
    c6.push(P(`“Next time,” said ${guide} from somewhere near the floor, “bring a coat.”`))
    c6.push(P(pick(closingYoung(hero))))
    add('Goodnight', 'yellow', c6)
  } else {
    c5.push(P(pick(closingYoung(hero))))
  }

  const words = ch.reduce(
    (total, chapter) =>
      total +
      chapter.paragraphs.reduce(
        (sum, para) =>
          sum + para.map((p) => (typeof p === 'string' ? p.split(/\s+/).length : 1)).reduce((a, b) => a + b, 0),
        0,
      ),
    0,
  )

  return {
    id: `st-${Date.now().toString(36)}-${Math.floor(rand() * 1e4).toString(36)}`,
    title,
    dedication: `For ${heroGroup}${input.band ? `, who is ${input.band.replace('–', ' to ')} and knows how to listen` : ''}.`,
    input,
    chapterCount: ch.length,
    minutes: Math.max(3, Math.round(words / 150)),
    words,
    chapters: ch,
    questions: val.questions(hero, villain?.name ?? guide),
    createdAt: Date.now(),
    seriesTitle,
    seriesId: input.seriesId,
    episode: input.episode ?? 1,
  }
}

/* ------------------------------------------------------------------ */
/* rendering helpers                                                   */
/* ------------------------------------------------------------------ */
export function parseGolden(word: string): Piece {
  return { word, sound: 'magic' }
}

export const voiceMeta: Record<VoiceId, { label: string; color: string; hint: string; rate: number; pitch: number }> = {
  green: { label: 'Green', color: 'var(--voice-green)', hint: hints.green, rate: 0.78, pitch: 0.92 },
  yellow: { label: 'Yellow', color: 'var(--voice-yellow)', hint: hints.yellow, rate: 1.08, pitch: 1.22 },
  blue: { label: 'Blue', color: 'var(--voice-blue)', hint: hints.blue, rate: 0.94, pitch: 1 },
  red: { label: 'Red', color: 'var(--voice-red)', hint: hints.red, rate: 1.24, pitch: 1.1 },
}

export function plainText(story: Story) {
  return story.chapters
    .map(
      (c) =>
        `${c.title}\n\n` +
        c.paragraphs
          .map((p) => p.map((piece) => (typeof piece === 'string' ? piece : piece.word)).join(''))
          .join('\n\n'),
    )
    .join('\n\n')
}

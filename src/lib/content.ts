export type IconKey =
  | 'courage' | 'sharing' | 'patience' | 'selfesteem' | 'kindness' | 'fear' | 'truth' | 'trust' | 'friendship'
  | 'gentle' | 'adventurous' | 'magical' | 'relaxing'
  | 'forest' | 'castle' | 'island' | 'space' | 'city' | 'mountain' | 'seabed' | 'glacier' | 'school' | 'playground' | 'ship' | 'farm'

export type Value = { id: string; label: string; short: string; blurb: string; icon: IconKey }
export const values: Value[] = [
  { id: 'courage', label: 'Courage', short: 'the courage to try', blurb: 'A small heart that learns it can be brave', icon: 'courage' },
  { id: 'sharing', label: 'Sharing', short: 'the joy of sharing', blurb: 'What is divided grows twice as large', icon: 'sharing' },
  { id: 'patience', label: 'Patience', short: 'the art of waiting', blurb: 'Good things ripen slowly, like apples', icon: 'patience' },
  { id: 'selfesteem', label: 'Self-esteem', short: 'believing in yourself', blurb: 'The star inside that never stops shining', icon: 'selfesteem' },
  { id: 'kindness', label: 'Kindness', short: 'kindness', blurb: 'Gentle words open every door', icon: 'kindness' },
  { id: 'fear', label: 'Overcoming fear', short: 'chasing away fear', blurb: 'The dark is only a colour, after all', icon: 'fear' },
  { id: 'truth', label: 'Telling the truth', short: 'the truth', blurb: 'A little truth weighs less than a big lie', icon: 'truth' },
  { id: 'trust', label: 'Trusting others', short: 'trust', blurb: 'A hand held is a bridge already built', icon: 'trust' },
  { id: 'friendship', label: 'Friendship', short: 'friendship', blurb: 'Two shadows make one bigger light', icon: 'friendship' },
]

export type Place = { id: string; label: string; icon: IconKey; tone: string }
export const places: Place[] = [
  { id: 'forest', label: 'Enchanted forest', icon: 'forest', tone: 'moss and fireflies' },
  { id: 'castle', label: 'Wandering castle', icon: 'castle', tone: 'towers that move at night' },
  { id: 'island', label: 'Mysterious island', icon: 'island', tone: 'salt, shells, secrets' },
  { id: 'space', label: 'Infinite space', icon: 'space', tone: 'comets and quiet stars' },
  { id: 'city', label: 'Magic city', icon: 'city', tone: 'lanterns and rooftops' },
  { id: 'mountain', label: 'Ancient mountain', icon: 'mountain', tone: 'snow and old echoes' },
  { id: 'seabed', label: 'Secret seabed', icon: 'seabed', tone: 'coral bells and blue light' },
  { id: 'glacier', label: 'Shining glacier', icon: 'glacier', tone: 'ice that hums' },
  { id: 'school', label: 'Extraordinary school', icon: 'school', tone: 'desks that dream' },
  { id: 'playground', label: 'Magic playground', icon: 'playground', tone: 'swings and laughter' },
  { id: 'ship', label: 'Winged sailing ship', icon: 'ship', tone: 'wind in the sails' },
  { id: 'farm', label: 'Cheerful farm', icon: 'farm', tone: 'hay, milk, morning' },
]

export type Mood = { id: string; label: string; blurb: string; icon: IconKey; notes: number[] }
export const moods: Mood[] = [
  { id: 'gentle', label: 'Gentle', blurb: 'Soft melody', icon: 'gentle', notes: [0, 4, 7, 11, 14] },
  { id: 'adventurous', label: 'Adventurous', blurb: 'Epic rhythms', icon: 'adventurous', notes: [0, 3, 7, 10, 12] },
  { id: 'magical', label: 'Magical', blurb: 'Fairy-tale sounds', icon: 'magical', notes: [0, 5, 9, 12, 16] },
  { id: 'relaxing', label: 'Relaxing', blurb: 'Hushed notes', icon: 'relaxing', notes: [0, 2, 7, 9, 14] },
]

export type VoiceColor = { id: 'green' | 'yellow' | 'blue' | 'red'; label: string; hint: string; sample: string; rate: number; pitch: number }
export const voiceColors: VoiceColor[] = [
  { id: 'green', label: 'Green', hint: 'calm · slow · gentle', sample: 'The forest was breathing, and every leaf was listening.', rate: 0.72, pitch: 0.9 },
  { id: 'yellow', label: 'Yellow', hint: 'cheerful · lively · smiling', sample: '“A dragon? In my soup?” laughed the little girl, and the soup laughed too.', rate: 1.06, pitch: 1.25 },
  { id: 'blue', label: 'Blue', hint: 'clear · steady · guiding', sample: 'Follow the river. Where it bends, you will find the door.', rate: 0.9, pitch: 1 },
  { id: 'red', label: 'Red', hint: 'quick · punchy · energetic', sample: 'Run! Over the bridge, past the bell, into the wheat, and don’t look back!', rate: 1.22, pitch: 1.1 },
]

export type AgeGroup = { id: string; label: string; blurb: string; sample: string; words: string }
export const ageGroups: AgeGroup[] = [
  { id: '0-4', label: '0–4 years', blurb: 'rhythm · sounds · cuddles', words: 'Very short sentences, a lulling rhythm and sound words: nothing but reassurance.', sample: 'Nina goes tap-tap-tap. The moon says: “Hush.” The stars say: “Sleep.”' },
  { id: '5-7', label: '5–7 years', blurb: 'silly magic · inventions', words: 'Silly magic, inventions and objects that come to life.', sample: 'The spoon stood up, politely, and asked if anyone had seen the sugar.' },
  { id: '8-10', label: '8–10 years', blurb: 'dilemmas · real metaphors', words: 'Real metaphors, ethical dilemmas and inner growth.', sample: 'Being brave, Leo decided, was mostly a matter of choosing what to do with the fear.' },
]
export const ageBands = ['0–2', '3–4', '5–6', '7–8', '9–10']

export type Testimonial = { quote: string; name: string; role: string }
export const testimonials: Testimonial[] = [
  { quote: 'I tried it to get my kids to sleep earlier. Result: they don’t sleep anymore. Every night they beg “one more!” until my own eyelids give in.', name: 'Martina', role: 'Luca’s mom, age 6' },
  { quote: 'Sofia got up, grabbed her teddy and started acting out the story all by herself. I had to read it three more times so she’d get the ending.', name: 'Davide', role: 'Sofia’s dad, age 4' },
  { quote: 'I didn’t expect to get emotional while reading. But I did. Matteo looked at me wide-eyed: “Mom, are you crying?”', name: 'Giulia', role: 'Matteo’s mom, age 8' },
  { quote: 'Emma used to hate bedtime. Now at 8:30 she’s waiting on the bed with my phone in her hand. I don’t know whether to laugh or cry.', name: 'Francesco', role: 'Emma’s dad, age 5' },
  { quote: 'Two kids who usually bicker, sitting together for the story. The catch: they both want the hero to have their name. I read it twice.', name: 'Laura', role: 'Riccardo and Alessia’s mom' },
  { quote: 'Tommaso thinks I make up the stories myself. I won’t let him down. The secret is it takes 30 seconds, and they come out better than my improvised ones.', name: 'Marco', role: 'Tommaso’s dad, age 7' },
  { quote: 'Giorgia just waits for the golden words so she can tap the thunderstorm. Every time she pretends to be scared, then laughs and asks me to do it again.', name: 'Chiara', role: 'Giorgia’s mom, age 3' },
  { quote: 'I thought at nine he was done with fairy tales. Instead he waits for the next chapter of his series like an episode of his favourite cartoon.', name: 'Andrea', role: 'Leonardo’s dad, age 9' },
  { quote: 'The questions at the end have become our moment. Yesterday Nicolò explained to me why the dragon deserved a second chance. Better than I could, honestly.', name: 'Elena', role: 'Nicolò’s mom, age 5' },
  { quote: 'I read like a notary. With the voice colours I found out I can do the mysterious whisper. Bianca says I’ve improved. I’ll take it as a compliment.', name: 'Simone', role: 'Bianca’s dad, age 6' },
  { quote: 'On Thursdays Viola sleeps over. I used to have to make things up, and my stories always ended with a nap. Mine. Now I come prepared.', name: 'Roberto', role: 'Viola’s grandpa, age 7' },
  { quote: 'Diego was afraid of the dark. We asked for a story about courage with a firefly friend. Since then the firefly sleeps with him, at least in his head.', name: 'Serena', role: 'Diego’s mom, age 4' },
]

export const faqs = [
  {
    q: 'What is FiabaMia?',
    a: 'FiabaMia is a web app that creates personalized bedtime stories for children aged 0 to 10: choose the name, age, educational value, setting and mood, and in about 30 seconds you get an original story to read together, with background music, interactive sounds and voice guidance for the parent.',
  },
  {
    q: 'How much does FiabaMia cost?',
    a: 'When you sign up you get 3 free Stars, and each story you create uses 1 Star. You can earn more Stars by inviting other parents with your invite code, or with the Star packs — free while the app is in its first nights.',
  },
  {
    q: 'What ages are the stories for?',
    a: 'For children from 0 to 10, in five age groups (0–2, 3–4, 5–6, 7–8, 9–10). It is not just the hero that changes: language, sentence length, the kind of conflict and the depth of the moral all adapt to the chosen age.',
  },
  {
    q: 'Are the stories safe for children?',
    a: 'Yes. The stories are made for bedtime: no violence, nothing scary or inappropriate. Every story passes on an educational value you choose, such as courage, kindness or patience, and ends with a gentle resolution.',
  },
  {
    q: 'What are interactive sounds and voice colours?',
    a: 'Some words in the story, like “rustle” or “owl”, are circled as if in pencil: when your child taps them, they hear the real sound. Voice colours, on the other hand, suggest to the parent how to shape tone and rhythm chapter by chapter.',
  },
  {
    q: 'Do I need an account to create a story?',
    a: 'Yes, you need a free account: just your email, no password. In this build the sign-in is instant and stays on your device, and your stories are saved in your personal library.',
  },
  {
    q: 'Does it work without a connection?',
    a: 'FiabaMia is an installable app. Once you add it to your home screen, the app shell, your library and every story you have already read stay available offline. Music and sounds are generated on your device, so they work in the dark too.',
  },
]

export const starPacks = [
  { name: 'Pouch of Stars', stars: 10, future: '4,90 €', blurb: 'Ten bedtime stories: a handful of magical evenings to get started.', popular: false },
  { name: 'Chest of Stars', stars: 30, future: '9,90 €', blurb: 'A month of stories, one every night: the bedtime ritual never stops.', popular: true },
  { name: 'Sky of Stars', stars: 100, future: '19,90 €', blurb: 'A whole sky of stories: months of tales, for brothers and sisters too.', popular: false },
]

export const howItWorks = [
  {
    title: 'A story made to measure',
    body: 'Choose the hero’s name — even more than one, for brothers and sisters — their age, the value you want to pass on, the setting, the tone and the length: short, medium or long, from about 3 to 7 minutes of reading. If you like, add a little villain who makes amends in the end.',
  },
  {
    title: 'Music and interactive sounds',
    body: 'Every story has background music chosen to match its mood: gentle, adventurous, magical or relaxing. Some words in the text turn golden: tap them to hear the sound — the rustle of the wind, a distant thunderstorm, little bells — and the music softens to make room for it.',
  },
  {
    title: 'Voice guidance',
    body: 'Each chapter has a colour that suggests how to read it: green for a calm, slow voice, yellow for a cheerful, lively one, blue for a clear, steady one, red for a quick voice full of energy. Even someone who has never read aloud becomes a storyteller.',
  },
  {
    title: 'Five age groups, from 0 to 10',
    body: 'It is not just the hero that changes: so do the language, the length of the sentences, the kind of conflict and the depth of the moral. Ages 0–2 for a lulling rhythm, 3–4 for magic and surprises, 5–6 for inventions, 7–8 for fairness, 9–10 for real dilemmas.',
  },
  {
    title: 'Let’s talk about it',
    body: 'After reading, below the story you will find three questions to ask your child out loud, tied to the value and the characters of the story: a prompt to talk it over together before turning off the light.',
  },
  {
    title: 'Safe, and made for bedtime',
    body: 'No violence, nothing scary or inappropriate, and every story ends with a gentle resolution. You will find everything in your personal library, together with the chapter series.',
  },
]

export const prologueChips = [
  { label: 'Their name.', detail: 'Your child becomes the hero of the story', field: 'name' },
  { label: 'Their age.', detail: 'To tailor language and complexity', field: 'age' },
  { label: 'A value.', detail: 'Courage, kindness, patience… whatever you want to teach', field: 'value' },
  { label: 'A place.', detail: 'Setting and emotional tone', field: 'place' },
  { label: 'And a little villain.', detail: 'If you like, one who turns good in the end', field: 'villain' },
]

export const goldenWords = [
  {
    before: 'Arianna heard the ',
    word: 'wind',
    after: ' rustling through the leaves, gently lifting them.',
    sound: 'wind' as const,
  },
  {
    before: 'Among the coral branches, little golden ',
    word: 'bells',
    after: ' were singing.',
    sound: 'bells' as const,
  },
  {
    before: 'Far away, beyond the hills, a ',
    word: 'thunderstorm',
    after: ' was rumbling.',
    sound: 'thunder' as const,
  },
]

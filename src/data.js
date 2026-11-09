/* storiesAI — content, options and story phrase banks. All data is local: no network needed. */
window.CDATA = (function () {
  const AGES = [
    { id: '0-2',  label: '0–2 years', hint: 'rhythm · sounds · cuddles', bank: 'soft',   sentences: 2, words: 'six to nine' },
    { id: '3-4',  label: '3–4 years', hint: 'rhyme · circles · tiny surprises', bank: 'soft',   sentences: 3, words: 'eight to twelve' },
    { id: '5-6',  label: '5–6 years', hint: 'silly magic · inventions', bank: 'bright', sentences: 4, words: 'ten to fifteen' },
    { id: '7-8',  label: '7–8 years', hint: 'brave choices · fair rules', bank: 'wise',   sentences: 4, words: 'twelve to eighteen' },
    { id: '9-10', label: '9–10 years', hint: 'real metaphors · dilemmas', bank: 'wise',   sentences: 5, words: 'fourteen to twenty' }
  ];

  const VALUES = [
    { id: 'courage',   icon: 'star', label: 'Courage',          hi: 'साहस',    bn: 'সাহস',    blurb: 'A small brave step in the dark.', lesson: 'being brave does not mean not being scared', questions: ['What was the bravest moment in the story?', 'When have you felt a little scared and still tried?', 'Who would you like to be brave for?'] },
    { id: 'kindness',  icon: 'feather', label: 'Kindness',         hi: 'दयालुता',  bn: 'দয়া',    blurb: 'A gentle hand offered first.',     lesson: 'kindness is a small thing that grows',     questions: ['Who was kind in this story, and how?', 'What is one kind thing you could do tomorrow?', 'How do you think the little villain felt afterwards?'] },
    { id: 'patience',  icon: 'wave', label: 'Patience',         hi: 'धैर्य',    bn: 'ধৈর্য',    blurb: 'Good things that take their time.', lesson: 'waiting can be part of the wonder',       questions: ['What had to grow slowly in the story?', 'What is hard for you to wait for?', 'What can we do while we wait?'] },
    { id: 'sharing',   icon: 'star', label: 'Sharing',          hi: 'बाँटना',   bn: 'ভাগ করা',  blurb: 'Half a moonbeam is still enough.', lesson: 'what we share becomes bigger',           questions: ['What did the friends share?', 'What is your favourite thing to share?', 'How did sharing change the ending?'] },
    { id: 'confidence',icon: 'star', label: 'Self-belief',      hi: 'आत्मविश्वास', bn: 'আত্মবিশ্বাস', blurb: 'A quiet voice that says "I can".', lesson: 'you already have what you need',   questions: ['What did {name} think they could not do?', 'What are you proud of learning lately?', 'What would you try if you felt sure of yourself?'] },
    { id: 'honesty',   icon: 'feather', label: 'Telling the truth',hi: 'सच्चाई',  bn: 'সত্য',     blurb: 'A true word that opens doors.',   lesson: 'the truth is lighter to carry',          questions: ['Was there a moment when a truth was needed?', 'Why is telling the truth sometimes hard?', 'Who helps you feel safe enough to be honest?'] },
    { id: 'friendship',icon: 'swing', label: 'Friendship',       hi: 'दोस्ती',   bn: 'বন্ধুত্ব',  blurb: 'Two pairs of feet, one path.',    lesson: 'friends make the road shorter',           questions: ['How did the friends help each other?', 'What makes someone a good friend to you?', 'Who would you bring into this story?'] },
    { id: 'calm',      icon: 'moon', label: 'Facing the dark',  hi: 'डर पर काबू', bn: 'ভয় কাটানো', blurb: 'The night has soft edges.', lesson: 'the dark is only light resting',        questions: ['What looked scary at first?', 'What turned out to be gentle instead?', 'What helps you feel cosy at night?'] },
    { id: 'curiosity', icon: 'sea', label: 'Curiosity',        hi: 'जिज्ञासा', bn: 'কৌতূহল',  blurb: 'One more question before sleep.',  lesson: 'wondering is its own kind of adventure',  questions: ['What question did the story ask?', 'What would you like to find out?', 'Where should we explore tomorrow night?'] },
    { id: 'gratitude', icon: 'star', label: 'Gratitude',        hi: 'कृतज्ञता', bn: 'কৃতজ্ঞতা', blurb: 'Counting the small warm things.',  lesson: 'noticing a gift makes it grow',          questions: ['What was the smallest gift in the story?', 'What are three good things about today?', 'Who would you like to thank?'] }
  ];

  /* Each setting carries its own palette + scenery, so the reader changes colour with the story. */
  const SETTINGS = [
    { id: 'forest',  emoji: '🌲', label: 'Cozy Forest', scene: 'forest',   sky: ['#0b1f1c','#173b32'], accent: '#9fd8a6', place: 'the whispering forest', detail: 'trees that kept the moonlight in their pockets', friend: 'a moss-green hedgehog', thing: 'a lantern made of a hollow acorn' },
    { id: 'castle',  emoji: '🏰', label: 'Cloud Castle', scene: 'castle',   sky: ['#161332','#3a2a5c'], accent: '#d9b8ff', place: 'a castle that walked on quiet feet', detail: 'towers that changed their minds every evening', friend: 'a tiny knight made of biscuit', thing: 'a key that hummed when someone was kind' },
    { id: 'island',  emoji: '🏝️', label: 'Mysterious Island', scene: 'island',  sky: ['#08273a','#1d5866'], accent: '#8fe0d8', place: 'an island drawn in faint pencil', detail: 'shells that remembered every tide', friend: 'a crab with a map on its back', thing: 'a bottle holding one unused wish' },
    { id: 'space',   emoji: '🪐', label: 'Outer Space',    scene: 'space',    sky: ['#0a0a26','#2b1a5e'], accent: '#a9b6ff', place: 'the soft edge of the sky', detail: 'stars that liked to be counted', friend: 'a drowsy comet', thing: 'a jar of leftover moonlight' },
    { id: 'city',    emoji: '🌆', label: 'Magical City',      scene: 'city',     sky: ['#151a35','#3c3358'], accent: '#f2c48d', place: 'a city where the lamps said good evening', detail: 'trams that ran on lullabies', friend: 'a baker who sold warm clouds', thing: 'a doorbell that only rang for friends' },
    { id: 'mountain',emoji: '⛰️', label: 'Ancient Mountain',  scene: 'mountain', sky: ['#101a2b','#37506a'], accent: '#b7d3e8', place: 'the old mountain above the clouds', detail: 'stones that told very slow jokes', friend: 'a yak with a woollen scarf', thing: 'a bell no wind could ring' },
    { id: 'sea',     emoji: '🐚', label: 'Coral Reef',        scene: 'sea',      sky: ['#04202f','#0b4a5c'], accent: '#7fe3d4', place: 'the coral reef where the tide keeps secrets', detail: 'coral that chimed when the water moved', friend: 'a shy silver fish', thing: 'a pearl with a small song inside' },
    { id: 'glacier', emoji: '❄️', label: 'Shining Glacier',    scene: 'mountain',sky: ['#0f2236','#4a7792'], accent: '#c8e9ff', place: 'a glacier lit from within', detail: 'snowflakes that each had a different name', friend: 'a white fox with warm paws', thing: 'a scarf knitted from sunrise' },
    { id: 'school',  emoji: '🎒', label: 'Extraordinary School', scene: 'city', sky: ['#1c1830','#4a3a5e'], accent: '#ffcf9c', place: 'a school that opened only at night', detail: 'blackboards that erased themselves with a yawn', friend: 'an owl who taught arithmetic', thing: 'a pencil that drew what you were thinking' },
    { id: 'park',    emoji: '🛝', label: 'Magic Playground',  scene: 'forest',   sky: ['#122236','#2b4a5c'], accent: '#ffd894', place: 'a playground after everyone had gone home', detail: 'a slide that ended somewhere new each time', friend: 'a swing that hummed in tune', thing: 'a ball that always rolled back to you' },
    { id: 'ship',    emoji: '⛵', label: 'Winged Ship',       scene: 'island',  sky: ['#101c3a','#3a5680'], accent: '#c4d8ff', place: 'a ship with sails made of bedtime clouds', detail: 'a deck that rocked like a cradle', friend: 'a gull who knew all the lullabies', thing: 'a compass pointing towards home' },
    { id: 'treehouse', emoji: '🌳', label: 'Secret Treehouse', scene: 'forest', sky: ['#10241c','#2c4a33'], accent: '#c8e6a0', place: 'a treehouse above the sleeping garden', detail: 'stairs that grew a new step every night', friend: 'a moth who read by starlight', thing: 'a jar of captured summer' },
    { id: 'farm',    emoji: '🌾', label: 'Cheerful Farm',     scene: 'farm',     sky: ['#1d2233','#5a4a3c'], accent: '#f6d28c', place: 'a farm where the hay smelled of biscuits', detail: 'a barn roof that collected falling stars', friend: 'a hen who counted sheep', thing: 'a little wooden cart with one loose wheel' }
  ];

  /* Built-in story scenery, friends and objects translated separately from UI labels. */
  const SETTING_NARRATIVES = {
    hi: {
      forest: { place: 'फुसफुसाते जंगल', detail: 'ऐसे पेड़ जो चाँदनी को अपनी जेबों में रखते थे', friend: 'काई-सा हरा नन्हा साही', thing: 'खोखले बलूत से बना एक दीपक' },
      castle: { place: 'शांत कदमों से चलने वाले किले', detail: 'ऐसी मीनारें जो हर शाम अपना मन बदल लेती थीं', friend: 'बिस्कुट से बना एक नन्हा शूरवीर', thing: 'दयालुता पर गुनगुनाने वाली एक चाबी' },
      island: { place: 'हल्की पेंसिल से बने रहस्यमय द्वीप', detail: 'ऐसी सीपियाँ जो हर ज्वार को याद रखती थीं', friend: 'पीठ पर नक्शा लिए एक केकड़ा', thing: 'एक बोतल में रखी अधूरी इच्छा' },
      space: { place: 'आकाश के मुलायम किनारे', detail: 'ऐसे तारे जिन्हें गिनती पसंद थी', friend: 'ऊँघता हुआ एक धूमकेतु', thing: 'बची हुई चाँदनी की एक शीशी' },
      city: { place: 'दीपकों के शुभ संध्या कहने वाले जादुई शहर', detail: 'लोरी की धुन पर चलने वाली ट्रामें', friend: 'गरम बादल बेचने वाला एक रोटीवाला', thing: 'दोस्तों के लिए ही बजने वाली एक घंटी' },
      mountain: { place: 'बादलों के ऊपर वाले पुराने पहाड़', detail: 'ऐसे पत्थर जो बहुत धीरे-धीरे चुटकुले सुनाते थे', friend: 'ऊन का दुपट्टा पहने एक याक', thing: 'एक घंटी जिसे हवा भी नहीं बजा सकती थी' },
      sea: { place: 'ज्वार के रहस्य सँभालने वाली मूंगे की चट्टान', detail: 'पानी हिलने पर छनकने वाले मूंगे', friend: 'एक शर्मीली चाँदी-सी मछली', thing: 'एक मोती जिसके भीतर छोटा-सा गीत था' },
      glacier: { place: 'भीतर से जगमगाते हिमनद', detail: 'ऐसे हिमकण जिनमें हर एक का अलग नाम था', friend: 'गरम पंजों वाली एक सफेद लोमड़ी', thing: 'सूर्योदय की किरणों से बुना एक मफलर' },
      school: { place: 'केवल रात में खुलने वाले अनोखे विद्यालय', detail: 'ऐसे श्यामपट जो जम्हाई लेकर खुद को मिटा देते थे', friend: 'अंकगणित सिखाने वाला एक उल्लू', thing: 'एक पेंसिल जो तुम्हारे विचार बना देती थी' },
      park: { place: 'सबके जाने के बाद जादू से भरने वाले खेल के मैदान', detail: 'एक फिसलपट्टी जो हर बार नई जगह पहुँचाती थी', friend: 'सुर में गुनगुनाता एक झूला', thing: 'एक गेंद जो हमेशा तुम्हारे पास लौट आती थी' },
      ship: { place: 'सोने के बादलों की पालों वाले जहाज़', detail: 'जहाज़ का फर्श पालने की तरह झूलता था', friend: 'सभी लोरियाँ जानने वाला एक समुद्री पक्षी', thing: 'घर की दिशा बताने वाला एक यंत्र' },
      treehouse: { place: 'सोते हुए बगीचे के ऊपर बने गुप्त पेड़घर', detail: 'ऐसी सीढ़ियाँ जिन पर हर रात एक नया पायदान उग आता था', friend: 'तारों की रोशनी में पढ़ने वाला एक पतंगा', thing: 'गर्मियों की यादें सँभालने वाली एक शीशी' },
      farm: { place: 'घास में बिस्कुट की महक वाले खुशहाल खेत', detail: 'खलिहान की छत जो टूटते तारों को जमा करती थी', friend: 'भेड़ें गिनने वाली एक मुर्गी', thing: 'एक छोटी लकड़ी की गाड़ी जिसका एक पहिया ढीला था' }
    },
    bn: {
      forest: { place: 'ফিসফিসে বন', detail: 'এমন গাছ, যারা চাঁদের আলো পকেটে জমিয়ে রাখত', friend: 'শ্যাওলা-সবুজ এক ছোট্ট সজারু', thing: 'ফাঁপা ওক-ফল দিয়ে বানানো এক ছোট্ট প্রদীপ' },
      castle: { place: 'নীরব পায়ে হেঁটে বেড়াত এমন এক দুর্গ', detail: 'সন্ধ্যা হলেই মত বদলাত এমন মিনার', friend: 'বিস্কুট দিয়ে বানানো এক ছোট্ট বীর', thing: 'দয়ার ছোঁয়ায় গুনগুন করত এমন এক চাবি' },
      island: { place: 'হালকা পেনসিলে আঁকা এক রহস্যময় দ্বীপ', detail: 'প্রতিটি জোয়ারের কথা মনে রাখত এমন ঝিনুক', friend: 'পিঠে মানচিত্র আঁকা এক কাঁকড়া', thing: 'বোতলে রাখা একটি অপূর্ণ ইচ্ছে' },
      space: { place: 'আকাশের নরম কিনারা', detail: 'গুনে ফেলতে ভালোবাসত এমন তারা', friend: 'একটি ঘুমঘুম ধূমকেতু', thing: 'বেঁচে যাওয়া চাঁদের আলোভরা এক শিশি' },
      city: { place: 'আলো যেখানে শুভসন্ধ্যা বলত এমন এক জাদুর শহর', detail: 'ঘুমপাড়ানি গানের সুরে চলত এমন ট্রাম', friend: 'গরম মেঘ বিক্রি করত এমন এক রুটিওয়ালা', thing: 'শুধু বন্ধুদের জন্য বাজত এমন এক ঘণ্টি' },
      mountain: { place: 'মেঘের ওপরে প্রাচীন পাহাড়', detail: 'ধীরে ধীরে মজার কথা বলত এমন পাথর', friend: 'উলের মাফলার পরা এক ইয়াক', thing: 'হাওয়াও বাজাতে পারত না এমন এক ঘণ্টা' },
      sea: { place: 'প্রবালপ্রাচীর, যেখানে জোয়ার তার গোপন কথা রাখে', detail: 'জল নড়লেই টুংটাং করত এমন প্রবাল', friend: 'একটি লাজুক রুপোলি মাছ', thing: 'ভেতরে ছোট্ট গান রাখা এক মুক্তো' },
      glacier: { place: 'ভেতর থেকে আলো ছড়ানো এক হিমবাহ', detail: 'প্রতিটির আলাদা নাম ছিল এমন তুষারকণা', friend: 'উষ্ণ থাবার এক সাদা শিয়াল', thing: 'সূর্যোদয়ের আলো দিয়ে বোনা এক মাফলার' },
      school: { place: 'শুধু রাতে খুলত এমন এক আশ্চর্য বিদ্যালয়', detail: 'হাই তুলে নিজে নিজে মুছে যেত এমন কালো ফলক', friend: 'অঙ্ক শেখাত এমন এক পেঁচা', thing: 'তোমার ভাবনা এঁকে দিত এমন একটি পেন্সিল' },
      park: { place: 'সবাই চলে গেলে জাদু জাগত এমন এক খেলার মাঠ', detail: 'প্রতিবার নতুন জায়গায় পৌঁছে দিত এমন এক পিছলবার পথ', friend: 'সুর তুলে গুনগুন করত এমন এক দোলনা', thing: 'সবসময় তোমার কাছে ফিরে আসত এমন এক বল' },
      ship: { place: 'ঘুমপাড়ানি মেঘের পাল-ওয়ালা এক জাহাজ', detail: 'জাহাজের মেঝে দোলনার মতো দুলত', friend: 'সব ঘুমপাড়ানি গান জানা এক সামুদ্রিক পাখি', thing: 'বাড়ির দিক দেখাত এমন এক দিক-নির্দেশক যন্ত্র' },
      treehouse: { place: 'ঘুমন্ত বাগানের ওপরে এক গোপন গাছবাড়ি', detail: 'প্রতি রাতে নতুন একটি ধাপ গজিয়ে উঠত এমন সিঁড়ি', friend: 'তারার আলোয় পড়ত এমন এক নিশাচর প্রজাপতি', thing: 'গ্রীষ্মের স্মৃতি ধরে রাখা এক শিশি' },
      farm: { place: 'আনন্দময় এক খামার, যেখানে শুকনো ঘাসে বিস্কুটের গন্ধ ছিল', detail: 'খামারঘরের ছাদ ঝরে-পড়া তারা জমিয়ে রাখত', friend: 'ভেড়া গুনত এমন এক মুরগি', thing: 'একটি ছোট কাঠের গাড়ি, যার একটি চাকা ঢিলা ছিল' }
    }
  };

  /* ---------- environment profiles ----------------------------------------
     Picking a place changes more than the sky tint: the horizon geometry and
     the movement of the particle field change with it. `ground` overrides the
     scene's horizon (three sine harmonics + a blocky tooth term), `motion`
     drives the WebGL vertex shader, and the 2D fallback reads the same numbers
     so a device without WebGL still gets the same weather.

       drift   0..1  slow multi-directional, gravity-free float (space)
       rise    units/s upward current (reef); wrapped inside `band`
       sway    horizontal sine displacement in world units (reef current)
       cluster 0..1  noise-thresholded horizontal puffs (cloud castle)
       heightCap     soft ceiling above `floor` (forest canopy)
       flight        camera Z-speed multiplier (cloud castle soars)
       firefly 0..1  per-vertex abs(sin(uTime * aSeed)) blink (forest)
       nebula  0..1  morphs the moon into a 3-octave FBM gas cloud (space)
  ------------------------------------------------------------------------- */
  const ENVIRONMENTS = {
    cosmic: {
      id: 'cosmic', label: 'Cosmic Drift', scene: 'space',
      ground: { a: [0.000, 0.000, 0.000], f: [1.7, 3.1, 5.3], p: [0.0, 0.0, 0.0],
                base: -2.000, teeth: [0.0, 0.0], ground: [0.014, 0.012, 0.040] },
      motion: { drift: 1.00, rise: 0.00, sway: 0.00, cluster: 0.00, heightCap: 0.0,
                flight: 0.86, firefly: 0.00, nebula: 1.00, band: 24.0, floor: -2.0 }
    },
    reef: {
      id: 'reef', label: 'Bioluminescent Undersea', scene: 'sea',
      ground: { a: [0.000, 0.000, 0.000], f: [1.0, 1.0, 1.0], p: [0.0, 0.0, 0.0],
                base: -0.058, teeth: [0.0, 0.0], ground: [0.008, 0.046, 0.074] },
      motion: { drift: 0.18, rise: 0.32, sway: 0.55, cluster: 0.00, heightCap: 0.0,
                flight: 0.90, firefly: 0.00, nebula: 0.00, band: 20.0, floor: -2.4 }
    },
    mist: {
      id: 'mist', label: 'Mist Flight', scene: 'castle',
      ground: { a: [0.030, 0.026, 0.012], f: [2.3, 5.1, 9.7], p: [0.6, 2.2, 3.4],
                base: -0.030, teeth: [1.0, 6.0], ground: [0.020, 0.017, 0.040] },
      motion: { drift: 0.24, rise: 0.00, sway: 0.08, cluster: 0.72, heightCap: 0.0,
                flight: 1.18, firefly: 0.00, nebula: 0.00, band: 24.0, floor: -2.0 }
    },
    firefly: {
      id: 'firefly', label: 'Firefly Canopy', scene: 'forest',
      ground: { a: [0.082, 0.056, 0.032], f: [13.0, 37.0, 79.0], p: [0.0, 1.7, 4.1],
                base: -0.042, teeth: [0.85, 28.0], ground: [0.010, 0.030, 0.018] },
      motion: { drift: 0.12, rise: 0.00, sway: 0.04, cluster: 0.00, heightCap: 7.0,
                flight: 0.92, firefly: 0.90, nebula: 0.00, band: 24.0, floor: -2.5 }
    },
    default: {
      id: 'default', label: 'Night Flight', scene: '',
      ground: null,
      motion: { drift: 0.00, rise: 0.00, sway: 0.00, cluster: 0.00, heightCap: 0.0,
                flight: 1.00, firefly: 0.00, nebula: 0.00, band: 24.0, floor: -2.0 }
    }
  };

  /* Which place wears which profile. Scenes without an explicit profile use
     the plain night flight, so every existing story keeps its own horizon. */
  const ENV_BY_SCENE = { space: 'cosmic', sea: 'reef', castle: 'mist', forest: 'firefly' };
  const ENV_FOR_SETTING = {
    space: 'cosmic', sea: 'reef', island: 'reef', ship: 'reef',
    castle: 'mist', forest: 'firefly', park: 'firefly', treehouse: 'firefly'
  };
  SETTINGS.forEach(function (s) { s.env = ENV_FOR_SETTING[s.id] || ENV_BY_SCENE[s.scene] || 'default'; });

  const MOODS = [
    { id: 'gentle',      label: 'Gentle',      hint: 'soft melody',   glow: '#f0cf9a', chords: [261.63, 329.63, 392.00, 493.88], wave: 'sine',     pace: 5.2 },
    { id: 'adventurous', label: 'Adventurous', hint: 'epic rhythms',  glow: '#f5a97f', chords: [293.66, 349.23, 440.00, 587.33], wave: 'triangle', pace: 3.1 },
    { id: 'magical',     label: 'Magical',     hint: 'fairy-tale sounds', glow: '#c7a9ff', chords: [277.18, 415.30, 554.37, 659.25], wave: 'sine',  pace: 4.0 },
    { id: 'relaxing',    label: 'Relaxing',    hint: 'hushed notes',  glow: '#9fd6cf', chords: [220.00, 261.63, 329.63, 392.00], wave: 'sine',     pace: 7.0 }
  ];

  const LENGTHS = [
    { id: 'short',  label: 'Short',  minutes: 'about 3 min', chapters: 3 },
    { id: 'medium', label: 'Medium', minutes: 'about 5 min', chapters: 4 },
    { id: 'long',   label: 'Long',   minutes: 'about 7 min', chapters: 5 }
  ];

  const LANGUAGES = [
    { id: 'en', label: 'English', native: 'English', tts: 'en-IN', flag: '' },
    { id: 'hi', label: 'Hindi',   native: 'हिन्दी',  tts: 'hi-IN', flag: '' },
    { id: 'bn', label: 'Bengali', native: 'বাংলা',   tts: 'bn-IN', flag: '' }
  ];

  const VOICES = {
    green:  { label: 'Green',  hint: 'calm · slow · gentle',     css: '#8ed0a3', icon: '✨', short: 'Read this softly',
              line: 'Read this one slowly, like pouring warm milk.' },
    yellow: { label: 'Yellow', hint: 'cheerful · lively · smiling', css: '#f0cf8b', icon: '🌤', short: 'Read this with a smile',
              line: 'Let a smile sneak into your voice here.' },
    blue:   { label: 'Blue',   hint: 'clear · steady · guiding',  css: '#9ec4ee', icon: '⭐', short: 'Steady and clear',
              line: 'Steady and clear, like pointing out a star.' },
    red:    { label: 'Red',    hint: 'quick · punchy · energetic',css: '#ee9b8e', icon: '🚀', short: 'Read this with high energy!',
              line: 'A little quicker now — this is the exciting bit.' }
  };

  const SFX = {
    wind:     { label: 'the rustle of leaves', emoji: '🍃' },
    bells:    { label: 'little golden bells',  emoji: '🔔' },
    thunder:  { label: 'a faraway thunderstorm', emoji: '⛈️' },
    owl:      { label: 'an owl saying goodnight', emoji: '🦉' },
    waves:    { label: 'soft waves',           emoji: '🌊' },
    steps:    { label: 'tiny footsteps',       emoji: '👣' },
    whisper:  { label: 'a kind whisper',       emoji: '🤫' },
    rain:     { label: 'gentle rain',          emoji: '🌧️' },
    twinkle:  { label: 'a star twinkling',     emoji: '✨' },
    drum:     { label: 'a soft little drum',   emoji: '🥁' },
    creak:    { label: 'a sleepy door',        emoji: '🚪' },
    bird:     { label: 'a morning bird',       emoji: '🐦' }
  };

  const SOUND_POOLS = {
    forest:  ['wind','owl','twinkle','steps','whisper'],
    castle:  ['creak','bells','drum','steps','whisper'],
    island:  ['waves','bird','wind','twinkle','steps'],
    space:   ['twinkle','whisper','bells','wind','drum'],
    city:    ['bells','steps','rain','creak','bird'],
    mountain:['wind','thunder','owl','steps','twinkle'],
    sea:     ['waves','bells','whisper','twinkle','rain'],
    farm:    ['bird','drum','steps','wind','bells']
  };

  /* ---------- English phrase banks ----------
     Tokens: [[sfxkey|visible words]] become tappable golden words.
     Variables: {name} {place} {detail} {friend} {thing} {value} {villain} {lesson} {chapter} */
  const BANKS = {
    soft: {
      open: [
        'Once upon a hush, {name} pulled the blanket up to their chin.',
        'The lamp went small. The room went soft. And {name} was ready.',
        'Tonight, the moon leaned close to hear about {name}.'
      ],
      scene: [
        'A little path of light led all the way to {place}, where {detail}.',
        'Step by step, {name} came to {place}. Everything there was quiet, and {detail}.',
        'The night opened like a picture book: {place}, with {detail}.'
      ],
      wonder: [
        'Listen — the leaves went [[wind|rustle, rustle]].',
        'Something small went [[twinkle|twinkle]] above the roof.',
        'A bell said [[bells|ting]] and then said it again.',
        '[[owl|Whoo]] said a sleepy owl. [[owl|Whoo]] said the night.'
      ],
      meet: [
        'There was {friend}, holding {thing}. "Come with me," it whispered.',
        '{friend} was waiting, and {friend} had brought {thing}.',
        'A small friend appeared: {friend}, with {thing} tucked under one arm.'
      ],
      trouble: [
        'But the little light had gone out, and the path could not be seen.',
        'Oh dear. {thing} had rolled away into the quiet.',
        'A small problem sat in the middle of the path, waiting to be noticed.',
        'Someone had forgotten how to say goodnight.'
      ],
      value: [
        '{name} took one small breath, and one small step. That was {value}.',
        'It was not loud. It was not grand. It was simply {value}, done gently.',
        '{name} shared the warmest corner of the blanket. That is {value}.',
        'Slowly, slowly, {name} tried again. {value} grows that way.'
      ],
      solve: [
        'And the light came back, soft as a yawn.',
        'The path remembered where it was going. [[bells|Ting]] went the little bell.',
        '{friend} clapped two tiny hands, and everything was all right.',
        'Even {villain} smiled, and the whole wood breathed out.'
      ],
      home: [
        'Back along the path of light, home was still there, warm and waiting.',
        'The way home was short. The stars walked {name} to the door.',
        'One by one, the night tucked itself in.'
      ],
      sleep: [
        'The pillow was cool. The blanket was kind. Goodnight, {name}.',
        '[[whisper|Hush]], said the room. Goodnight, {name}, goodnight.',
        'Close your eyes. The story will wait right here until tomorrow.'
      ]
    },
    bright: {
      open: [
        'At exactly half past bedtime, {name} discovered that the window had grown a staircase made of moonlight.',
        'Tonight {name} had one question too many to sleep, so the night answered with a door.',
        'There are nights when a sock disappears. On this night, {name} found where socks go.'
      ],
      scene: [
        'The staircase landed in {place}, where {detail}. Honestly, it was a bit odd.',
        '{place} was having a very busy evening: {detail}.',
        'Past three clouds and a yawning star, {name} arrived at {place}, where {detail}.'
      ],
      wonder: [
        '[[bells|Ting-ting-ting]] went the bells, entirely out of tune but very pleased.',
        'The air went [[wind|whoosh]] and smelled faintly of warm biscuits.',
        'A [[creak|creeeeak]] came from somewhere behind a very innocent-looking door.',
        '[[twinkle|Ping!]] A star fell into a pocket and pretended it belonged there.'
      ],
      meet: [
        '{friend} was trying to fix {thing} with a spoon. "Need a hand?" asked {name}.',
        'Out popped {friend}, carrying {thing} and wearing a hat far too big.',
        'A small voice said, "At last!" It was {friend}, and {friend} had {thing}.'
      ],
      trouble: [
        'Then the whole place hiccupped. {thing} spun round twice and stopped, upside down.',
        'There was a problem: the path had been folded up and put away for the night.',
        '{villain} had borrowed the last of the moonlight and forgotten to give it back.',
        'A sign said CLOSED. Underneath, in smaller letters, it said UNLESS SOMEONE IS KIND.'
      ],
      value: [
        'Instead of grumbling, {name} asked a question first. That turned out to be {value}.',
        '"We can do it together," said {name}. {value}, it seems, works faster in pairs.',
        '{name} nearly gave up, then tried a completely silly idea. That is {value} with a hat on.',
        'It took three tries and one deep breath. {lesson} — and {name} understood it.'
      ],
      solve: [
        'Everything unfolded at once, including {villain}, who apologised and handed back the moonlight.',
        '"Well," said {friend}, "that was the best sort of muddle." [[drum|Bum-ti-tum]] went a small drum.',
        'The sign turned itself around. It now said OPEN, PLEASE COME IN.',
        '[[bells|Ting]]! The lost thing was found, and the found thing was shared.'
      ],
      home: [
        'The staircase folded itself neatly back into the window.',
        '{name} came home with one pocket full of stars and one shoe slightly damp.',
        'The journey back took exactly as long as one long yawn.'
      ],
      sleep: [
        'Tomorrow the door might be somewhere else entirely. But now: goodnight, {name}.',
        'The blanket settled. The room went [[whisper|shhh]]. Sleep won, quietly.',
        'Close your eyes — the adventure is only pretending to be finished.'
      ]
    },
    wise: {
      open: [
        'On the night {name} could not sleep, the quiet in the room began to feel like a question with no answer.',
        'It is often the ordinary nights that open. This one opened at half past nine, without a sound.',
        '{name} had been carrying a small worry all day, and at bedtime it finally asked to be heard.'
      ],
      scene: [
        'Beyond the window lay {place}, where {detail}. Nothing there was in a hurry.',
        'The dark had a shape after all: {place}. There, {detail}, and the air held the smell of rain.',
        '{name} stepped into {place} — a place that seemed to have been waiting, where {detail}.'
      ],
      wonder: [
        'Far off, [[thunder|thunder]] moved like someone turning a page.',
        '[[wind|The wind]] went through the grass with the patience of someone who has all night.',
        'A single [[bells|bell]] sounded, and the silence afterwards was larger than the sound.',
        '[[owl|An owl]] asked its one question and did not wait for an answer.'
      ],
      meet: [
        '{friend} sat beside {thing}, as though guarding a secret it was quite willing to share.',
        'Someone was already there: {friend}. "I thought you might come," was all it said.',
        '{name} found {friend} studying {thing} with a seriousness that made them both smile.'
      ],
      trouble: [
        'The difficulty was not a monster. It was a choice, and both sides of it were reasonable.',
        '{villain} had taken the light — not out of meanness, but because the dark had felt too large.',
        'The path divided in two. One way was easy; the other asked something of {name}.',
        'There was a rule here that nobody had written down, and it was the wrong one.'
      ],
      value: [
        '{name} stayed with the uncomfortable choice instead of hurrying past it. That is what {value} looks like when no one is watching.',
        'It would have been simpler to look away. Instead {name} asked {villain} why. {lesson}, and the question mattered more than the answer.',
        'Bravery here was quiet: {name} said the true thing, then waited while it landed.',
        'They shared the small remaining light, and discovered it did not diminish. {value} is often arithmetic of that kind.'
      ],
      solve: [
        'Nothing exploded. Nothing was won. The path simply became possible again.',
        '{villain} returned the light and, after a long pause, said thank you. It was enough.',
        'The unwritten rule was rewritten — this time by everyone, together.',
        '[[bells|One bell]], then another. Not a celebration, exactly. More like an agreement.'
      ],
      home: [
        'The way back was shorter, though {name} was fairly sure it was the same distance.',
        'The window was still open; the room was still the room. Only the worry had changed size.',
        'Home received {name} without asking any questions at all.'
      ],
      sleep: [
        'Some stories end with a door left ajar. This one ends with a blanket, and with {name} finally, easily asleep.',
        'The stars went on with their slow work. Goodnight, {name}. There is more tomorrow.',
        'Rest now. You have already done the bravest part: you stayed until the end.'
      ]
    }
  };

  /* ---------- Hindi & Bengali banks ---------- simple, gentle, gender-neutral phrasing ---------- */
  const BANKS_HI = {
    open: ['आज रात {name} ने आँखें खोलीं और चाँद मुस्कुराया।', 'कंबल गरम था, कमरा शांत था — अब {name} के सोने का समय था।', 'एक छोटी सी कहानी आज रात {name} के पास आई।'],
    scene: ['रोशनी की एक पगडंडी {place} तक गई। वहाँ {detail}।', '{name} के कदम धीरे-धीरे {place} की ओर बढ़े। चारों ओर बहुत शांति थी।', 'खिड़की के पार {place} का एक सुंदर नज़ारा था। वहाँ {detail}।'],
    wonder: ['[[wind|सरसर]] की आवाज़ आई, जैसे पत्ते बातें कर रहे हों।', 'एक छोटी सी [[bells|घंटी]] बजी — टिंग, टिंग।', 'ऊपर एक तारा [[twinkle|टिमटिमाया]]।', 'दूर से [[owl|उल्लू]] ने शुभ रात्रि कही।'],
    meet: ['वहाँ {friend} मिला, और उसके पास {thing} था।', '"चलो साथ चलें," {friend} ने धीरे से कहा।', '{friend} इंतज़ार कर रहा था, हाथ में {thing} लिए।'],
    trouble: ['तब पता चला कि छोटी सी रोशनी कहीं चली गई है।', 'रास्ते के बीच एक छोटी सी उलझन बैठी थी।', '{villain} ने चाँदनी छुपा ली थी — डर के मारे, बुराई से नहीं।'],
    value: ['{name} ने एक गहरी साँस ली और एक छोटा कदम आगे बढ़ाया। यही {value} है।', '{name} ने पहले सुना, फिर मदद की। {value} ऐसे ही बढ़ता है।', 'साथ मिलकर काम किया गया, और बोझ हल्का हो गया। यह {value} था।'],
    solve: ['रोशनी वापस आई, बिल्कुल धीरे-धीरे।', '[[bells|टिंग]]! सब कुछ अपनी जगह लौट आया।', '{villain} ने मुस्कुराकर चाँदनी वापस दे दी और शुक्रिया कहा।'],
    home: ['उसी रोशनी की पगडंडी {name} को घर तक ले आई।', 'तारे दरवाज़े तक साथ आए।', 'कमरा वैसा ही था — गरम और अपना।'],
    sleep: ['तकिया ठंडा था, कंबल कोमल था। शुभ रात्रि, {name}।', '[[whisper|श्श्श]], कमरे ने कहा। अब सो जाओ।', 'आँखें बंद करो। कहानी कल भी यहीं मिलेगी।'],
    questions: ['कहानी में सबसे अच्छा पल कौन सा था?', '{name} ने क्या सीखा?', 'कल तुम किसके साथ अच्छा बर्ताव करोगे?']
  };

  const BANKS_BN = {
    open: ['আজ রাতে {name} চোখ খুলল আর চাঁদ হাসল।', 'কম্বল গরম, ঘর নীরব, আর {name} প্রস্তুত।', 'একটি ছোট্ট গল্প আজ রাতে {name} এর কাছে এল।'],
    scene: ['আলোর একটা ছোট্ট পথ {place} পর্যন্ত গেল। সেখানে {detail}।', '{name} একটু এগিয়ে যেতেই সামনে দেখা দিল {place}। চারদিকে ছিল খুব শান্ত পরিবেশ।', 'জানালার ওপারে ছিল {place}, আর সেখানে {detail}।'],
    wonder: ['[[wind|সর সর]] শব্দ এল, যেন পাতারা ফিসফিস করছে।', 'একটি ছোট্ট [[bells|ঘণ্টা]] বাজল — টিং, টিং।', 'একটি তারা [[twinkle|মিটমিটে]] করে জ্বলল।', 'দূর থেকে [[owl|পেঁচা]] শুভরাত্রি বলল।'],
    meet: ['সেখানে {friend} এল, হাতে ছিল {thing}।', '"চলো একসঙ্গে যাই," {friend} আস্তে বলল।', '{friend} অপেক্ষা করছিল, কাছে {thing} নিয়ে।'],
    trouble: ['তখন দেখা গেল ছোট্ট আলোটা কোথাও চলে গেছে।', 'পথের মাঝখানে একটু জটিলতা বসে ছিল।', '{villain} চাঁদের আলো লুকিয়ে রেখেছিল — ভয় পেয়ে, খারাপ মনে নয়।'],
    value: ['{name} একটা দীর্ঘ শ্বাস নিল আর এক পা এগোল। এটাই {value}।', '{name} আগে শুনল, তারপর সাহায্য করল। {value} এভাবেই বাড়ে।', 'সবাই মিলে কাজ করল, আর ভার হালকা হল। এটাই ছিল {value}।'],
    solve: ['আলো আবার ফিরে এল, খুব আস্তে করে।', '[[bells|টিং]]! সবকিছু নিজের জায়গায় ফিরে গেল।', '{villain} হেসে চাঁদের আলো ফেরত দিল আর ধন্যবাদ বলল।'],
    home: ['সেই আলোর পথ ধরেই {name} বাড়ি ফিরল।', 'তারারা দরজা পর্যন্ত সঙ্গে এল।', 'ঘর আগের মতোই ছিল — উষ্ণ আর আপন।'],
    sleep: ['বালিশ ঠান্ডা, কম্বল নরম। শুভরাত্রি, {name}।', '[[whisper|শ্শ্শ]], ঘর বলল। এখন ঘুমোও।', 'চোখ বোজো। গল্পটা কালও এখানেই থাকবে।'],
    questions: ['গল্পের সবচেয়ে ভালো মুহূর্ত কোনটি?', '{name} কী শিখল?', 'কাল তুমি কার সঙ্গে ভালো ব্যবহার করবে?']
  };

  const VALUE_TRANSLATIONS = { en: null };
  VALUES.forEach(function (v) { VALUE_TRANSLATIONS[v.id] = { en: v.label.toLowerCase(), hi: v.hi, bn: v.bn }; });

  const REVIEWS = [
    { stars: 5, text: 'I asked for one story to get bedtime started. Now it is three stories, one glass of water and a very long goodnight. I have never been so happily outnumbered.', name: 'Ananya', note: 'mother of Riya, 6' },
    { stars: 5, text: 'My son heard his own name in the first line and sat up straight. He has asked every night since whether the hedgehog is back.', name: 'Rohit', note: 'father of Kabir, 4' },
    { stars: 5, text: 'The little voice colours are a clever trick: I now do a mysterious whisper, and my daughter says I am finally reading it properly.', name: 'Meera', note: 'mother of Tara, 8' },
    { stars: 5, text: 'We made it in Hindi for my mother to read aloud. She finished with tears in her eyes and immediately asked for another one.', name: 'Sneha', note: 'mother of Ishaan, 5' },
    { stars: 5, text: 'Two children, two heroes, zero arguments. I did not know a bedtime app could negotiate peace.', name: 'Arjun', note: 'father of Mira and Neil' },
    { stars: 5, text: 'The golden sound words are the favourite part in our house. The tiny thunder has been tapped roughly four hundred times.', name: 'Priya', note: 'mother of Ayaan, 3' }
  ];

  const FAQ = [
    { q: 'What is storiesAI?', a: 'A small installable web app that writes a fresh bedtime story around your child — name, age, a value, a place and a mood. It works completely offline on your device: no account, no server and no data leaves your phone.' },
    { q: 'How much does it cost?', a: 'This is a self-contained edition, so Stars are a gift. You start with 3, each story uses 1, and the Star pouches are free. There is no payment, no card and no subscription.' },
    { q: 'Can it really write without the internet?', a: 'Yes. Stories are woven locally from a large, age-aware bank of sentences, so every combination produces a different tale. If you prefer AI-written prose, open Settings and add your own compatible endpoint and key — when that fails, storiesAI quietly falls back to offline mode.' },
    { q: 'Which languages are the stories in?', a: 'The interface is in English. Stories can be written in English, हिन्दी or বাংলা. Read-aloud uses your device voices, so Hindi and Bengali speech depends on the voices installed on your phone or computer.' },
    { q: 'Are the stories safe for bedtime?', a: 'Every story is gentle: no scares, no violence, no sad endings. Even the optional little villain makes amends before the last page. Each tale ends with three quiet questions to talk about before the light goes off.' },
    { q: 'Where are my stories saved?', a: 'In your browser local storage, right on this device. You can export them as a JSON backup from Settings and import them again later. Install the app from your browser menu to keep it on your home screen.' }
  ];

  return {
    AGES: AGES, VALUES: VALUES, SETTINGS: SETTINGS, SETTING_NARRATIVES: SETTING_NARRATIVES, MOODS: MOODS, LENGTHS: LENGTHS,
    LANGUAGES: LANGUAGES, VOICES: VOICES, SFX: SFX, SOUND_POOLS: SOUND_POOLS,
    BANKS: BANKS, BANKS_HI: BANKS_HI, BANKS_BN: BANKS_BN,
    ENVIRONMENTS: ENVIRONMENTS, ENV_BY_SCENE: ENV_BY_SCENE, ENV_FOR_SETTING: ENV_FOR_SETTING,
    VALUE_TRANSLATIONS: VALUE_TRANSLATIONS, REVIEWS: REVIEWS, FAQ: FAQ
  };
})();

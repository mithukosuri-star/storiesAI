/* storiesAI — local story weaving engine + optional bring-your-own AI endpoint. */
window.CEngine = (function () {
  var D = window.CDATA;

  /* deterministic-ish PRNG so the same inputs still give a fresh tale each night */
  function rng(seed) {
    var s = seed >>> 0;
    return function () {
      s += 0x6D2B79F5;
      var t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function hash(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function pick(r, arr) { return arr[Math.floor(r() * arr.length) % arr.length]; }

  function namesOf(cfg) {
    var raw = (cfg.names || 'a little dreamer').trim();
    var parts = raw.split(/\s*(?:,|\band\b|\bor\b|&|;|\+|\/)\s*/i).map(function (s) { return s.trim(); }).filter(Boolean);
    if (!parts.length) parts = ['a little dreamer'];
    return { list: parts, text: parts.length > 1 ? parts.slice(0, -1).join(', ') + ' and ' + parts[parts.length - 1] : parts[0] };
  }

  var VILLAINS = [
    'a grumpy little cloud', 'a pocket-sized dragon', 'a moth who borrowed things',
    'a sleepy troll with cold feet', 'a fox who never said sorry', 'a small shadow with big ideas'
  ];
  var TITLE_NOUNS = {
    forest: ['Lantern', 'Whispering Tree', 'Moss Path'], castle: ['Humming Key', 'Walking Tower', 'Little Knight'],
    island: ['Pencil Map', 'Shell Wish', 'Quiet Tide'], space: ['Jar of Moonlight', 'Drowsy Comet', 'Counting Star'],
    city: ['Good-evening Lamp', 'Cloud Tram', 'Tiny Bakery'], mountain: ['Slow Bell', 'Warm Scarf', 'Old Stone'],
    sea: ['Singing Pearl', 'Coral Bell', 'Silver Fish'], glacier: ['Named Snowflake', 'White Fox', 'Sunrise Scarf'],
    school: ['Night Blackboard', 'Thinking Pencil', 'Arithmetic Owl'], park: ['Humming Swing', 'New Slide', 'Rolling Ball'],
    ship: ['Cloud Sail', 'Home Compass', 'Lullaby Gull'], farm: ['Loose Wheel', 'Star Barn', 'Counting Hen']
  };
  var TITLE_ADJ = ['Quiet', 'Small', 'Golden', 'Sleepy', 'Hidden', 'Last', 'Gentle', 'Moonlit', 'Secret', 'Warm'];

  var RECIPES = {
    short: [
      ['open', 'scene', 'wonder', 'wonder'],
      ['meet', 'trouble', 'value', 'solve'],
      ['home', 'wonder', 'sleep', 'sleep']
    ],
    medium: [
      ['open', 'scene', 'wonder', 'wonder'],
      ['meet', 'trouble', 'wonder', 'value'],
      ['value', 'solve', 'wonder', 'solve'],
      ['home', 'scene', 'sleep', 'sleep']
    ],
    long: [
      ['open', 'scene', 'wonder', 'wonder', 'scene'],
      ['meet', 'trouble', 'wonder', 'value', 'wonder'],
      ['value', 'solve', 'wonder', 'solve', 'value'],
      ['scene', 'wonder', 'value', 'solve', 'wonder'],
      ['home', 'scene', 'wonder', 'sleep', 'sleep']
    ]
  };

  var CH_TITLES = [
    ['The path of light', 'A door made of evening', 'Where the quiet begins'],
    ['A small muddle', 'Someone to ask', 'The unexpected guest'],
    ['The quiet choice', 'One small step', 'What mattered most'],
    ['Everything in its place', 'The long way home', 'Softly, softly'],
    ['Goodnight, little star', 'The blanket and the moon', 'Until tomorrow night']
  ];

  var VOICE_MAPS = {
    gentle:      ['green', 'blue', 'green', 'yellow', 'green'],
    adventurous: ['blue', 'red', 'yellow', 'red', 'green'],
    magical:     ['yellow', 'blue', 'red', 'yellow', 'green'],
    relaxing:    ['green', 'green', 'blue', 'green', 'green']
  };

  function bankFor(cfg) {
    if (cfg.language === 'hi') return D.BANKS_HI;
    if (cfg.language === 'bn') return D.BANKS_BN;
    var age = D.AGES.filter(function (a) { return a.id === cfg.age; })[0] || D.AGES[2];
    return D.BANKS[age.bank];
  }

  function withCustoms(cfg) {
    /* a place or a lesson typed by the parent overrides the preset wording, but
       keeps the preset's scenery, friends and objects so the prose still works */
    var setting = D.SETTINGS.filter(function (s) { return s.id === cfg.setting; })[0] || D.SETTINGS[0];
    var value = D.VALUES.filter(function (v) { return v.id === cfg.value; })[0] || D.VALUES[0];
    var cp = String(cfg.customPlace || '').trim();
    var cv = String(cfg.customValue || '').trim();
    if (cp) {
      setting = { id: setting.id, label: cp, place: cp, detail: setting.detail, friend: setting.friend,
        thing: setting.thing, scene: setting.scene, emoji: setting.emoji, sky: setting.sky, accent: setting.accent };
    }
    if (cv) {
      var low = cv.toLowerCase();
      value = { id: 'custom', label: cv, hi: cv, bn: cv, lesson: 'a small lesson about ' + low,
        questions: ['Where did ' + low + ' show up in the story?', 'When did you practise ' + low + ' today?', 'Who would you like to share it with?'] };
    }
    return { setting: setting, value: value };
  }

  function vars(cfg, r) {
    var picked = withCustoms(cfg);
    var setting = picked.setting, value = picked.value;
    var trans = D.VALUE_TRANSLATIONS[value.id] || { en: value.label.toLowerCase(), hi: value.hi, bn: value.bn };
    var lang = cfg.language || 'en';
    var names = namesOf(cfg);
    var villain = cfg.villain ? (cfg.villainText || pick(r, VILLAINS)) : '';
    return {
      name: names.text,
      place: cfg.language === 'hi' ? 'उस शांत जगह' : cfg.language === 'bn' ? 'সেই শান্ত জায়গা' : setting.place,
      detail: setting.detail,
      friend: setting.friend,
      thing: setting.thing,
      value: (trans[lang] || trans.en),
      lesson: value.lesson,
      villain: villain || (cfg.language === 'hi' ? 'एक छोटी सी उलझन' : cfg.language === 'bn' ? 'একটু ছোট্ট গোলমাল' : 'a little mix-up'),
      chapter: cfg.chapterNumber || 1
    };
  }

  function fill(tpl, v) {
    return tpl.replace(/\{(\w+)\}/g, function (m, key) { return Object.prototype.hasOwnProperty.call(v, key) ? v[key] : m; });
  }

  function weaveOffline(cfg) {
    var seed = hash(JSON.stringify(cfg) + '|' + Date.now() + '|' + Math.random());
    var r = rng(seed);
    var bank = bankFor(cfg);
    var v = vars(cfg, r);
    var setting = D.SETTINGS.filter(function (s) { return s.id === cfg.setting; })[0] || D.SETTINGS[0];
    var value = D.VALUES.filter(function (x) { return x.id === cfg.value; })[0] || D.VALUES[0];
    var length = D.LENGTHS.filter(function (l) { return l.id === cfg.length; })[0] || D.LENGTHS[1];
    var recipe = RECIPES[length.id];
    var used = {};
    var lastLine = '';

    function line(beat) {
      var pool = (bank[beat] || []).slice();
      if (!cfg.villain) pool = pool.filter(function (t) { return t.indexOf('{villain}') === -1; });
      if (!pool.length) pool = bank[beat] || ['…'];
      if (!used[beat]) used[beat] = pool.slice().sort(function () { return r() - 0.5; });
      if (!used[beat].length) used[beat] = pool.slice().sort(function () { return r() - 0.5; });
      var out = fill(used[beat].shift(), v);
      if (out === lastLine && pool.length > 1) out = fill(pick(r, pool), v);
      lastLine = out;
      return out;
    }

    var voiceMap = VOICE_MAPS[cfg.mood] || VOICE_MAPS.gentle;
    var chapters = recipe.map(function (beats, i) {
      var text = beats.map(line).join(' ');
      var titles = CH_TITLES[i] || CH_TITLES[CH_TITLES.length - 1];
      return {
        title: (cfg.type === 'series' ? 'Chapter ' + (cfg.chapterNumber || 1) + '. ' : '') + pick(r, titles),
        text: text,
        voice: voiceMap[i % voiceMap.length]
      };
    });

    var nouns = TITLE_NOUNS[setting.id] || TITLE_NOUNS.forest;
    var names = namesOf(cfg);
    var titlePatterns = [
      function () { return names.text + ' and the ' + pick(r, TITLE_ADJ) + ' ' + pick(r, nouns); },
      function () { return 'The Night ' + names.text + ' Found the ' + pick(r, nouns); },
      function () { return 'A ' + pick(r, TITLE_ADJ) + ' ' + pick(r, nouns) + ' for ' + names.text; },
      function () { return names.text + ' and the ' + setting.label.replace(/^(Enchanted|Wandering|Mysterious|Infinite|Magical|Ancient|Secret|Shining|Extraordinary|Magic|Winged|Cheerful)\s/, '') + ' at Bedtime'; }
    ];
    var title;
    if (cfg.language === 'hi') title = names.text + ' और ' + pick(r, ['चाँदनी की कहानी', 'छोटी सी रोशनी', 'सोने वाला तारा']);
    else if (cfg.language === 'bn') title = names.text + ' আর ' + pick(r, ['চাঁদনীর গল্প', 'ছোট্ট আলো', 'ঘুমন্ত তারা']);
    else title = pick(r, titlePatterns)();

    var questions;
    if (cfg.language === 'hi') questions = D.BANKS_HI.questions.slice();
    else if (cfg.language === 'bn') questions = D.BANKS_BN.questions.slice();
    else questions = value.questions.slice();
    questions = questions.map(function (q) { return fill(q, v); });

    var soundWords = [];
    chapters.forEach(function (c) {
      var re = /\[\[(\w+)\|([^\]]+)\]\]/g, m;
      while ((m = re.exec(c.text)) !== null) soundWords.push({ key: m[1], word: m[2] });
    });

    return {
      id: 'story-' + Date.now().toString(36) + '-' + Math.floor(r() * 1e6).toString(36),
      createdAt: new Date().toISOString(),
      title: title,
      cfg: JSON.parse(JSON.stringify(cfg)),
      chapters: chapters,
      questions: questions,
      soundWords: soundWords,
      source: 'offline',
      engineVersion: 1
    };
  }

  /* ---- optional AI: OpenAI-compatible chat completions endpoint ---- */
  function aiPrompt(cfg) {
    var age = D.AGES.filter(function (a) { return a.id === cfg.age; })[0] || D.AGES[2];
    var picked = withCustoms(cfg);
    var setting = picked.setting, value = picked.value;
    var langName = { en: 'English', hi: 'Hindi (Devanagari script)', bn: 'Bengali (Bengali script)' }[cfg.language || 'en'];
    var length = D.LENGTHS.filter(function (l) { return l.id === cfg.length; })[0] || D.LENGTHS[1];
    return [
      'You are a gentle bedtime storyteller. Write ONE original, soothing bedtime story and return ONLY valid JSON, with no markdown fences.',
      'JSON shape: {"title": string, "chapters": [{"title": string, "voice": "green|yellow|blue|red", "text": string}], "questions": [string, string, string]}.',
      'Rules:',
      '- Language of ALL story text: ' + langName + '.',
      '- Hero(es): ' + (cfg.names || 'a child') + '. Age group: ' + age.label + ' — use ' + age.words + ' words per sentence and this register: ' + age.hint + '.',
      '- Value to convey gently: ' + value.label + ' (' + value.lesson + ').',
      '- Setting: ' + setting.label + ' — ' + setting.place + ', where ' + setting.detail + '.',
      '- Mood: ' + (cfg.mood || 'gentle') + '. Length: ' + length.chapters + ' chapters, about ' + length.minutes + ' of reading aloud, roughly 110 words per chapter.',
      '- ' + (cfg.villain ? 'Include a harmless little villain who makes amends before the end.' : 'No villain at all: only adventure and wonder.'),
      cfg.extras ? '- Also weave in, naturally: ' + cfg.extras + '.' : '',
      '- Bedtime safe: no violence, no fear, no sadness, no moralising. Warm, concrete, sensory, slowly winding down; the final chapter must end with sleep.',
      '- In each chapter mark 1-2 sound words with the token [[key|visible word]], where key is one of: wind, bells, thunder, owl, waves, steps, whisper, rain, twinkle, drum, creak, bird. Example: the leaves went [[wind|rustle]].',
      '- Voice colours mean: green calm/slow, yellow cheerful, blue clear/steady, red quick/energetic. Choose one per chapter.',
      '- End with three short, open questions a parent can ask the child aloud.',
      '- Every tale must be different. Do not reuse phrasing from other stories.'
    ].filter(Boolean).join('\n');
  }

  function normaliseAI(raw, cfg) {
    var data = raw;
    if (typeof raw === 'string') {
      var cleaned = raw.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
      var a = cleaned.indexOf('{'), b = cleaned.lastIndexOf('}');
      if (a !== -1 && b > a) cleaned = cleaned.slice(a, b + 1);
      data = JSON.parse(cleaned);
    }
    if (!data) throw new Error('Empty AI response');
    var chapters = data.chapters;
    if (!Array.isArray(chapters) || !chapters.length) {
      var text = String(data.text || data.story || '');
      var paras = text.split(/\n\s*\n/).filter(Boolean);
      var per = Math.max(1, Math.ceil(paras.length / (cfg.length === 'long' ? 5 : cfg.length === 'short' ? 3 : 4)));
      chapters = [];
      for (var i = 0; i < paras.length; i += per) {
        chapters.push({ title: 'Part ' + (chapters.length + 1), text: paras.slice(i, i + per).join(' '), voice: 'green' });
      }
    }
    chapters = chapters.map(function (c, i) {
      var txt = typeof c === 'string' ? c : (c.text || c.content || '');
      return {
        title: c.title || 'Chapter ' + (i + 1),
        text: String(txt).trim(),
        voice: ['green', 'yellow', 'blue', 'red'].indexOf(c.voice) >= 0 ? c.voice : (VOICE_MAPS[cfg.mood] || VOICE_MAPS.gentle)[i % 5]
      };
    }).filter(function (c) { return c.text.length > 20; });
    if (!chapters.length) throw new Error('AI returned no usable chapters');
    var questions = Array.isArray(data.questions) ? data.questions.map(String) : [
      'What was your favourite moment?', 'How did the hero feel at the end?', 'Where should we go tomorrow night?'
    ];
    var soundWords = [], re = /\[\[(\w+)\|([^\]]+)\]\]/g, m;
    chapters.forEach(function (c) { re.lastIndex = 0; while ((m = re.exec(c.text)) !== null) soundWords.push({ key: m[1], word: m[2] }); });
    return {
      id: 'story-' + Date.now().toString(36) + '-ai',
      createdAt: new Date().toISOString(),
      title: String(data.title || 'A story for ' + (cfg.names || 'you')),
      cfg: JSON.parse(JSON.stringify(cfg)),
      chapters: chapters, questions: questions.slice(0, 3), soundWords: soundWords,
      source: 'ai', engineVersion: 1
    };
  }

  function generateAI(cfg, ai) {
    var controller = new AbortController();
    var timer = setTimeout(function () { controller.abort(); }, 20000);
    var headers = { 'Content-Type': 'application/json' };
    if (ai.key) headers['Authorization'] = 'Bearer ' + ai.key;
    var body = {
      model: ai.model || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You write warm, original, bedtime-safe stories for children. You always reply with valid JSON only.' },
        { role: 'user', content: aiPrompt(cfg) }
      ],
      temperature: 0.95
    };
    return fetch(ai.endpoint, { method: 'POST', headers: headers, body: JSON.stringify(body), signal: controller.signal, mode: 'cors' })
      .then(function (res) {
        clearTimeout(timer);
        if (!res.ok) throw new Error('Endpoint returned ' + res.status);
        return res.json();
      })
      .then(function (data) {
        var content = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
        if (!content) content = data.output || data.text || data.response;
        if (!content) throw new Error('Unexpected response shape');
        return normaliseAI(content, cfg);
      })
      .catch(function (err) {
        clearTimeout(timer);
        throw new Error('AI unavailable (' + err.message + ') — using the offline storyteller instead.');
      });
  }

  function generate(cfg, ai) {
    if (ai && ai.enabled && ai.endpoint) {
      return generateAI(cfg, ai).catch(function (e) {
        var story = weaveOffline(cfg);
        story.fallbackNotice = e.message;
        return story;
      });
    }
    return Promise.resolve(weaveOffline(cfg));
  }

  /* wind sways, weather and bells glow: the class is chosen here because the
     markup for a golden word is generated, never hand written */
  var WORD_CLASS = { wind: 'word-wind', thunder: 'word-magic', waves: 'word-magic', bells: 'word-magic', twinkle: 'word-magic' };
  function renderText(raw) {
    return String(raw)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/\[\[(\w+)\|([^\]]+)\]\]/g, function (m, key, word) {
        if (!D.SFX[key]) return word;
        var cls = WORD_CLASS[key] ? ' ' + WORD_CLASS[key] : '';
        return '<button type="button" class="sound-word' + cls + '" data-sfx="' + key + '" title="Tap to hear ' + D.SFX[key].label + '" aria-label="Hear ' + D.SFX[key].label + '"><span class="sw-dot">✦</span>' + word + '</button>';
      });
  }

  function plainText(raw) {
    return String(raw).replace(/\[\[(\w+)\|([^\]]+)\]\]/g, function (m, k, w) { return w; });
  }

  return { generate: generate, renderText: renderText, plainText: plainText, namesOf: namesOf, aiPrompt: aiPrompt };
})();

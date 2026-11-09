/* storiesAI — local story weaving engine + optional bring-your-own AI endpoint. */
window.CEngine = (function () {
  var D = window.CDATA;
  var MAX_NAME_LENGTH = 160;
  var MAX_CHAPTER_TEXT_LENGTH = 20000;
  var MAX_CHAPTER_COUNT = 20;
  var MAX_AI_RESPONSE_LENGTH = 500000;
  function isValidNames(value) {
    return value == null || (typeof value === 'string' && value.length <= MAX_NAME_LENGTH);
  }
  function isValidChapterText(value) {
    return typeof value === 'string' && value.length <= MAX_CHAPTER_TEXT_LENGTH;
  }
  function areValidChapters(chapters) {
    if (!Array.isArray(chapters) || !chapters.length || chapters.length > MAX_CHAPTER_COUNT) return false;
    for (var i = 0; i < chapters.length; i++) {
      var chapter = chapters[i];
      if (!chapter || typeof chapter !== 'object' || Array.isArray(chapter) || !isValidChapterText(chapter.text)) return false;
    }
    return true;
  }
  function limitChapterText(raw) {
    var text;
    try { text = String(raw == null ? '' : raw); } catch (e) { text = ''; }
    return text.length > MAX_CHAPTER_TEXT_LENGTH ? text.slice(0, MAX_CHAPTER_TEXT_LENGTH) : text;
  }

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
    var input = cfg && cfg.names;
    var raw = (typeof input === 'string' && input ? input : 'a little dreamer').slice(0, MAX_NAME_LENGTH);
    var parts = raw.split(/,|\band\b|\bor\b|&|;|\+|\//i).map(function (s) { return s.trim(); }).filter(Boolean);
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
      c.text = limitChapterText(c.text);
      scanSoundTokens(c.text, function (token) { soundWords.push({ key: token.key, word: token.word }); });
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
      if (raw.length > MAX_AI_RESPONSE_LENGTH) throw new Error('AI response exceeds the size limit');
      var cleaned = raw.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
      var a = cleaned.indexOf('{'), b = cleaned.lastIndexOf('}');
      if (a !== -1 && b > a) cleaned = cleaned.slice(a, b + 1);
      data = JSON.parse(cleaned);
    }
    if (!data) throw new Error('Empty AI response');
    var chapters = data.chapters;
    if (!Array.isArray(chapters) || !chapters.length) {
      var text = String(data.text || data.story || '');
      if (text.length > MAX_CHAPTER_TEXT_LENGTH * MAX_CHAPTER_COUNT) throw new Error('AI story exceeds the text limit');
      var paras = text.split(/\n\s*\n/).filter(Boolean);
      var per = Math.max(1, Math.ceil(paras.length / (cfg.length === 'long' ? 5 : cfg.length === 'short' ? 3 : 4)));
      chapters = [];
      for (var i = 0; i < paras.length; i += per) {
        chapters.push({ title: 'Part ' + (chapters.length + 1), text: paras.slice(i, i + per).join(' '), voice: 'green' });
      }
    }
    if (chapters.length > MAX_CHAPTER_COUNT) throw new Error('AI returned too many chapters');
    chapters = chapters.map(function (c, i) {
      var txt = typeof c === 'string' ? c : (c && (c.text || c.content) || '');
      txt = String(txt);
      if (!isValidChapterText(txt)) throw new Error('AI chapter exceeds the ' + MAX_CHAPTER_TEXT_LENGTH + ' character limit');
      return {
        title: (c && c.title) || 'Chapter ' + (i + 1),
        text: txt.trim(),
        voice: c && ['green', 'yellow', 'blue', 'red'].indexOf(c.voice) >= 0 ? c.voice : (VOICE_MAPS[cfg.mood] || VOICE_MAPS.gentle)[i % 5]
      };
    }).filter(function (c) { return c.text.length > 20; });
    if (!chapters.length) throw new Error('AI returned no usable chapters');
    var questions = Array.isArray(data.questions) ? data.questions.map(String) : [
      'What was your favourite moment?', 'How did the hero feel at the end?', 'Where should we go tomorrow night?'
    ];
    var soundWords = [];
    chapters.forEach(function (c) {
      scanSoundTokens(c.text, function (token) { soundWords.push({ key: token.key, word: token.word }); });
    });
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
    if (!cfg || typeof cfg !== 'object') return Promise.reject(new Error('Story settings are invalid'));
    if (!isValidNames(cfg.names)) return Promise.reject(new Error('Hero names must be ' + MAX_NAME_LENGTH + ' characters or fewer'));
    if (ai && ai.enabled && ai.endpoint) {
      return generateAI(cfg, ai).catch(function (e) {
        var story = weaveOffline(cfg);
        story.fallbackNotice = e.message;
        return story;
      });
    }
    return Promise.resolve(weaveOffline(cfg));
  }

  /* A backwards close-bracket index makes every candidate's end check O(1).
     Malformed openers then advance by one character, so later openers are found
     without rescanning their suffixes. */
  function isSoundKeyChar(code) {
    return (code >= 48 && code <= 57) || (code >= 65 && code <= 90) ||
      (code >= 97 && code <= 122) || code === 95;
  }
  function scanSoundTokens(text, onToken) {
    var length = text.length, nextClose = new Array(length + 1), nearest = length;
    for (var p = length; p >= 0; p--) {
      if (p < length && text.charAt(p) === ']') nearest = p;
      nextClose[p] = nearest;
    }

    var i = 0;
    while (i + 1 < length) {
      if (text.charAt(i) !== '[' || text.charAt(i + 1) !== '[') { i++; continue; }
      var start = i, keyStart = i + 2, cursor = keyStart;
      while (cursor < length && isSoundKeyChar(text.charCodeAt(cursor))) cursor++;
      if (cursor === keyStart || text.charAt(cursor) !== '|') { i = start + 1; continue; }

      var wordStart = cursor + 1, close = nextClose[wordStart];
      if (close > wordStart && close + 1 < length && text.charAt(close + 1) === ']') {
        onToken({ start: start, end: close + 2, key: text.slice(keyStart, cursor), word: text.slice(wordStart, close) });
        i = close + 2;
      } else {
        i = start + 1;
      }
    }
  }

  function escapeText(raw) {
    return String(raw).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /* wind sways, weather and bells glow: the class is chosen here because the
     markup for a golden word is generated, never hand written */
  var WORD_CLASS = { wind: 'word-wind', thunder: 'word-magic', waves: 'word-magic', bells: 'word-magic', twinkle: 'word-magic' };
  function renderText(raw) {
    var text = limitChapterText(raw), out = [], copiedThrough = 0;
    scanSoundTokens(text, function (token) {
      out.push(escapeText(text.slice(copiedThrough, token.start)));
      var word = escapeText(token.word), sfx = Object.prototype.hasOwnProperty.call(D.SFX, token.key) ? D.SFX[token.key] : null;
      if (!sfx) out.push(word);
      else {
        var cls = Object.prototype.hasOwnProperty.call(WORD_CLASS, token.key) ? ' ' + WORD_CLASS[token.key] : '';
        out.push('<button type="button" class="sound-word' + cls + '" data-sfx="' + token.key + '" title="Tap to hear ' + sfx.label + '" aria-label="Hear ' + sfx.label + '"><span class="sw-dot">✦</span>' + word + '</button>');
      }
      copiedThrough = token.end;
    });
    out.push(escapeText(text.slice(copiedThrough)));
    return out.join('');
  }

  function plainText(raw) {
    var text = limitChapterText(raw), out = [], copiedThrough = 0;
    scanSoundTokens(text, function (token) {
      out.push(text.slice(copiedThrough, token.start), token.word);
      copiedThrough = token.end;
    });
    out.push(text.slice(copiedThrough));
    return out.join('');
  }

  return {
    generate: generate, renderText: renderText, plainText: plainText, namesOf: namesOf, aiPrompt: aiPrompt,
    limitChapterText: limitChapterText,
    MAX_NAME_LENGTH: MAX_NAME_LENGTH, isValidNames: isValidNames,
    MAX_CHAPTER_TEXT_LENGTH: MAX_CHAPTER_TEXT_LENGTH, MAX_CHAPTER_COUNT: MAX_CHAPTER_COUNT,
    isValidChapterText: isValidChapterText, areValidChapters: areValidChapters
  };
})();

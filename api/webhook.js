const sessions = {};

const GEMINI_KEY = process.env.GEMINI_KEY;
const TAVILY_KEY = process.env.TAVILY_KEY;

const MODEL_FAST = 'gemini-3.5-flash-lite';
const MODEL_SMART = 'gemini-3.5-flash-lite';

const DEFAULT_CITY = 'Санкт-Петербург';

// ---------- таблица городов: координаты и таймзона без обращения к сети ----------
const CITY_TABLE = [
  { n: 'Москва', lat: 55.7558, lon: 37.6173, tz: 'Europe/Moscow', alt: ['мск'] },
  { n: 'Санкт-Петербург', lat: 59.9343, lon: 30.3351, tz: 'Europe/Moscow', alt: ['спб', 'питер', 'петербург', 'ленинград'] },
  { n: 'Новосибирск', lat: 55.0084, lon: 82.9357, tz: 'Asia/Novosibirsk', alt: ['нск'] },
  { n: 'Екатеринбург', lat: 56.8389, lon: 60.6057, tz: 'Asia/Yekaterinburg', alt: ['екб'] },
  { n: 'Казань', lat: 55.7963, lon: 49.1088, tz: 'Europe/Moscow', alt: ['кзн'] },
  { n: 'Нижний Новгород', lat: 56.3269, lon: 44.0059, tz: 'Europe/Moscow', alt: ['нн'] },
  { n: 'Челябинск', lat: 55.1644, lon: 61.4368, tz: 'Asia/Yekaterinburg', alt: [] },
  { n: 'Самара', lat: 53.1959, lon: 50.1002, tz: 'Europe/Samara', alt: [] },
  { n: 'Омск', lat: 54.9885, lon: 73.3242, tz: 'Asia/Omsk', alt: [] },
  { n: 'Ростов-на-Дону', lat: 47.2357, lon: 39.7015, tz: 'Europe/Moscow', alt: ['ростов'] },
  { n: 'Уфа', lat: 54.7388, lon: 55.9721, tz: 'Asia/Yekaterinburg', alt: [] },
  { n: 'Красноярск', lat: 56.0153, lon: 92.8932, tz: 'Asia/Krasnoyarsk', alt: [] },
  { n: 'Воронеж', lat: 51.672, lon: 39.1843, tz: 'Europe/Moscow', alt: [] },
  { n: 'Пермь', lat: 58.0105, lon: 56.2502, tz: 'Asia/Yekaterinburg', alt: [] },
  { n: 'Волгоград', lat: 48.708, lon: 44.5133, tz: 'Europe/Volgograd', alt: [] },
  { n: 'Краснодар', lat: 45.0355, lon: 38.9753, tz: 'Europe/Moscow', alt: [] },
  { n: 'Саратов', lat: 51.5336, lon: 46.0343, tz: 'Europe/Saratov', alt: [] },
  { n: 'Тюмень', lat: 57.1522, lon: 65.5272, tz: 'Asia/Yekaterinburg', alt: [] },
  { n: 'Тольятти', lat: 53.5303, lon: 49.3461, tz: 'Europe/Samara', alt: [] },
  { n: 'Ижевск', lat: 56.8527, lon: 53.2115, tz: 'Europe/Samara', alt: [] },
  { n: 'Барнаул', lat: 53.3606, lon: 83.7636, tz: 'Asia/Barnaul', alt: [] },
  { n: 'Иркутск', lat: 52.287, lon: 104.305, tz: 'Asia/Irkutsk', alt: [] },
  { n: 'Хабаровск', lat: 48.4827, lon: 135.0838, tz: 'Asia/Vladivostok', alt: [] },
  { n: 'Владивосток', lat: 43.1156, lon: 131.8855, tz: 'Asia/Vladivostok', alt: ['влад'] },
  { n: 'Ярославль', lat: 57.6261, lon: 39.8845, tz: 'Europe/Moscow', alt: [] },
  { n: 'Томск', lat: 56.4846, lon: 84.9476, tz: 'Asia/Tomsk', alt: [] },
  { n: 'Оренбург', lat: 51.7727, lon: 55.0988, tz: 'Asia/Yekaterinburg', alt: [] },
  { n: 'Кемерово', lat: 55.3547, lon: 86.0873, tz: 'Asia/Novokuznetsk', alt: [] },
  { n: 'Сочи', lat: 43.5855, lon: 39.7231, tz: 'Europe/Moscow', alt: [] },
  { n: 'Калининград', lat: 54.7104, lon: 20.4522, tz: 'Europe/Kaliningrad', alt: [] },
  { n: 'Мурманск', lat: 68.9585, lon: 33.0827, tz: 'Europe/Moscow', alt: [] },
  { n: 'Минск', lat: 53.9006, lon: 27.559, tz: 'Europe/Minsk', alt: [] },
  { n: 'Астана', lat: 51.1694, lon: 71.4491, tz: 'Asia/Almaty', alt: [] },
  { n: 'Лондон', lat: 51.5074, lon: -0.1278, tz: 'Europe/London', alt: [] },
  { n: 'Париж', lat: 48.8566, lon: 2.3522, tz: 'Europe/Paris', alt: [] },
  { n: 'Берлин', lat: 52.52, lon: 13.405, tz: 'Europe/Berlin', alt: [] },
  { n: 'Нью-Йорк', lat: 40.7128, lon: -74.006, tz: 'America/New_York', alt: [] },
  { n: 'Токио', lat: 35.6762, lon: 139.6503, tz: 'Asia/Tokyo', alt: [] },
  { n: 'Пекин', lat: 39.9042, lon: 116.4074, tz: 'Asia/Shanghai', alt: [] },
  { n: 'Дубай', lat: 25.2048, lon: 55.2708, tz: 'Asia/Dubai', alt: [] }
];

function norm(s) {
  return (s || '')
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[^a-zа-я0-9 -]/g, ' ')
    .replace(/-/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function stem(w) {
  if (w.length <= 2) return w;
  return w.replace(/(ами|ями|ое|ые|ие|ом|ем|ой|ей|ах|ях|ов|ев|ий|ый|ая|яя|ую|юю|ья|а|о|у|е|ы|и|я|ю|й|ь)$/, '');
}

function stemPhrase(s) {
  return norm(s).split(' ').map(stem).join(' ');
}

const CITY_INDEX = {};
for (const c of CITY_TABLE) {
  CITY_INDEX[stemPhrase(c.n)] = c;
  for (const a of c.alt) CITY_INDEX[stemPhrase(a)] = c;
}

// ---------- кэши ----------
const GEO_CACHE = {};
const WEATHER_CACHE = {};
const RATE_CACHE = {};
const WEATHER_TTL = 10 * 60 * 1000;
const RATE_TTL = 30 * 60 * 1000;

function fresh(entry, ttl) {
  return entry && Date.now() - entry.ts < ttl;
}

// ---------- определение города ----------
async function geoLookup(name) {
  const key = norm(name);
  if (GEO_CACHE[key]) return GEO_CACHE[key];
  try {
    const res = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=1&language=ru`
    );
    const data = await res.json();
    if (data.results && data.results.length) {
      const r = data.results[0];
      const loc = { n: r.name, lat: r.latitude, lon: r.longitude, tz: r.timezone };
      GEO_CACHE[key] = loc;
      return loc;
    }
  } catch (e) {
    console.error('GEO ERROR:', e.message);
  }
  return null;
}

async function resolveCity(rawName) {
  const key = stemPhrase(rawName || '');
  if (CITY_INDEX[key]) return CITY_INDEX[key];
  return await geoLookup(rawName);
}

function cityFromTokens(tokens) {
  for (let i = 0; i < tokens.length; i++) {
    for (let len = 3; len >= 1; len--) {
      if (i + len > tokens.length) continue;
      const key = tokens.slice(i, i + len).map(stem).join(' ');
      if (CITY_INDEX[key]) return CITY_INDEX[key];
    }
  }
  return null;
}

// ---------- данные ----------
async function weatherByLoc(loc) {
  const key = loc.n;
  if (fresh(WEATHER_CACHE[key], WEATHER_TTL)) return WEATHER_CACHE[key].data;

  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lon}&current=temperature_2m,apparent_temperature,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto&forecast_days=1`
    );
    const d = await res.json();
    const data = {
      city: loc.n,
      temp: d.current.temperature_2m,
      feels_like: d.current.apparent_temperature,
      wind: d.current.wind_speed_10m,
      max_today: d.daily.temperature_2m_max[0],
      min_today: d.daily.temperature_2m_min[0],
      rain_chance: d.daily.precipitation_probability_max[0]
    };
    WEATHER_CACHE[key] = { data, ts: Date.now() };
    return data;
  } catch (e) {
    console.error('WEATHER ERROR:', e.message);
    return { error: 'Не удалось получить погоду' };
  }
}

async function getWeather({ city }) {
  const loc = await resolveCity(city);
  if (!loc) return { error: 'Город не найден' };
  return await weatherByLoc(loc);
}

function timeByLoc(loc) {
  const now = new Date().toLocaleString('ru-RU', {
    timeZone: loc.tz,
    hour: '2-digit',
    minute: '2-digit',
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });
  return { city: loc.n, current_time: now };
}

async function getTime({ city }) {
  const loc = await resolveCity(city);
  if (!loc || !loc.tz) return { error: 'Город не найден' };
  return timeByLoc(loc);
}

async function getRate({ code }) {
  const cur = (code || '').toUpperCase();
  if (fresh(RATE_CACHE[cur], RATE_TTL)) return RATE_CACHE[cur].data;

  const CRYPTO = { BTC: 'bitcoin', ETH: 'ethereum', TON: 'the-open-network', SOL: 'solana', DOGE: 'dogecoin' };

  try {
    if (CRYPTO[cur]) {
      const res = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${CRYPTO[cur]}&vs_currencies=usd,rub`
      );
      const d = await res.json();
      const p = d[CRYPTO[cur]];
      if (!p) return { error: 'Курс не найден' };
      const data = { currency: cur, usd: p.usd, rub: p.rub };
      RATE_CACHE[cur] = { data, ts: Date.now() };
      return data;
    }

    const res = await fetch('https://www.cbr-xml-daily.ru/daily_json.js');
    const d = await res.json();
    const v = d.Valute[cur];
    if (!v) return { error: 'Валюта не найдена' };
    const data = {
      currency: cur,
      rub: (v.Value / v.Nominal).toFixed(2),
      source: 'ЦБ РФ',
      date: d.Date.slice(0, 10)
    };
    RATE_CACHE[cur] = { data, ts: Date.now() };
    return data;
  } catch (e) {
    console.error('RATE ERROR:', e.message);
    return { error: 'Не удалось получить курс' };
  }
}

async function webSearch({ query }) {
  try {
    const res = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: TAVILY_KEY,
        query,
        max_results: 3,
        search_depth: 'basic',
        include_answer: true
      })
    });
    const data = await res.json();
    console.log('SEARCH:', query, '→', data.results ? data.results.length : 0);

    if (data.answer) {
      return { summary: data.answer.slice(0, 800) };
    }
    if (!data.results || !data.results.length) return { error: 'Ничего не найдено' };
    return {
      results: data.results.map((r) => ({
        title: r.title,
        content: (r.content || '').slice(0, 500)
      }))
    };
  } catch (e) {
    console.error('SEARCH ERROR:', e.message);
    return { error: 'Поиск недоступен' };
  }
}

const TOOL_IMPL = {
  get_weather: getWeather,
  get_time: getTime,
  get_rate: getRate,
  web_search: webSearch
};

// ---------- шаблоны ответов ----------
function sign(n) {
  const r = Math.round(n);
  if (r > 0) return 'плюс ' + r;
  if (r < 0) return 'минус ' + Math.abs(r);
  return 'ноль';
}

function fmtWeather(d) {
  let s = `В городе ${d.city} сейчас ${sign(d.temp)}, ощущается как ${sign(d.feels_like)}. `;
  s += `Ветер ${Math.round(d.wind)} километров в час, днём от ${sign(d.min_today)} до ${sign(d.max_today)}.`;
  if (d.rain_chance >= 40) s += ` Вероятность осадков ${d.rain_chance} процентов, лучше взять зонт.`;
  return s;
}

function fmtTime(d) {
  return `В городе ${d.city} сейчас ${d.current_time}.`;
}

function fmtRate(d) {
  if (d.usd) {
    return `${d.currency} стоит около ${Math.round(d.usd)} долларов, это примерно ${Math.round(d.rub)} рублей.`;
  }
  return `Курс ${d.currency} — ${d.rub} рублей по данным ЦБ на ${d.date}.`;
}

const FAST_FMT = {
  get_weather: fmtWeather,
  get_time: fmtTime,
  get_rate: fmtRate
};

// ---------- ПРЕ-РОУТЕР: ответ вообще без вызова модели ----------
const TIME_RE = /(скольк( сейчас)? времен|котор( сейчас)? час|скольк на час|как сегодн числ|как сегодн ден|как ден недел|как( сегодн)? дат|как сейчас времен)/;
const TIME_BLOCK_RE = /(нужн|надо|займ|потреб|уйдет|остал|прошл|чтоб|через|назад|заня)/;

const WEATHER_RE = /(погод|скольк градус|как температур|тепл л|холодн л|дожд|зонт|снег)/;
const WEATHER_BLOCK_RE = /(почем|объясн|сравн|завтр|послезавтр|вчер|недел|выходн|через|был|мес|прогноз на)/;

const RATE_RE = /(курс|скольк сто|почем доллар|почем евр|почем биткоин)/;
const RATE_BLOCK_RE = /(вчер|был|будет|прогноз|почем упа|почем рос|через|прошл|динамик)/;

const CURRENCY_MAP = [
  [/доллар|бакс|usd/, 'USD'],
  [/евр|eur/, 'EUR'],
  [/юан|cny/, 'CNY'],
  [/биткоин|битк|btc/, 'BTC'],
  [/эфир|эфириум|eth/, 'ETH'],
  [/тонкоин|toncoin/, 'TON'],
  [/солан|sol/, 'SOL'],
  [/догикоин|doge/, 'DOGE'],
  [/фунт|gbp/, 'GBP'],
  [/иен|йен|jpy/, 'JPY'],
  [/тенге|kzt/, 'KZT'],
  [/лир|try/, 'TRY'],
  [/франк|chf/, 'CHF'],
  [/дирхам|aed/, 'AED']
];

async function preRoute(rawText, nluTokens) {
  const plain = norm(rawText);
  if (!plain || plain.length > 80) return null;

  const tokens = (nluTokens && nluTokens.length ? nluTokens.map(norm) : plain.split(' ')).filter(Boolean);
  const stemmed = tokens.map(stem).join(' ');

  // время
  if (TIME_RE.test(stemmed) && !TIME_BLOCK_RE.test(stemmed)) {
    const loc = cityFromTokens(tokens) || CITY_INDEX[stemPhrase(DEFAULT_CITY)];
    console.log('PRE: time', loc.n);
    return fmtTime(timeByLoc(loc));
  }

  // погода
  if (WEATHER_RE.test(stemmed) && !WEATHER_BLOCK_RE.test(stemmed)) {
    const loc = cityFromTokens(tokens) || CITY_INDEX[stemPhrase(DEFAULT_CITY)];
    const d = await weatherByLoc(loc);
    if (!d.error) {
      console.log('PRE: weather', loc.n);
      return fmtWeather(d);
    }
  }

  // курсы
  if (RATE_RE.test(stemmed) && !RATE_BLOCK_RE.test(stemmed)) {
    let code = null;
    for (const [re, c] of CURRENCY_MAP) {
      if (re.test(stemmed)) {
        code = c;
        break;
      }
    }
    if (code) {
      const d = await getRate({ code });
      if (!d.error) {
        console.log('PRE: rate', code);
        return fmtRate(d);
      }
    }
  }

  return null;
}

// ---------- модель ----------
const HARD_RE = /посчитай|сколько будет|сколько .{0,20}(можно|получится|выйдет)|почему|объясни|сравни|стоит ли|что выгоднее|в чём разница|в чем разница|как работает|придумай|расскажи про|что думаешь|как считаешь|убеди/i;

function pickMode(text) {
  const hard = HARD_RE.test(text) || text.length > 70;
  return hard
    ? { model: MODEL_SMART, tokens: 400 }
    : { model: MODEL_FAST, tokens: 300 };
}

const SYSTEM_PROMPT =
  'Ты голосовой ассистент в умной колонке. Тебя слушают, а не читают. ' +
  'Говори живо и по-человечески, 1-3 предложения. Начинай сразу с сути: никаких "Конечно", "Отличный вопрос", "Давайте разберёмся". ' +
  'Можно лёгкая ирония и своё мнение. Без списков, markdown, эмодзи и скобок — в речи это звучит мусором. Без мата и 18+ тем. ' +
  'ВАЖНО: никогда не называй цифры (курсы, цены, статистику) по памяти — только из результатов инструментов. ' +
  'Для курсов валют и криптовалют вызывай get_rate. Для новостей, цен, событий и свежих фактов вызывай web_search. ' +
  'Названия технологий пиши так, как их произносят разработчики: Flask — флэск, Django — джанго, SQL — эс-ку-эль, FastAPI — фаст эй пи ай. Не переводи названия на русский. ' +
  'При вычислениях с дробями посчитай по шагам про себя и проверь порядок величины обратным умножением, вслух скажи только результат. ' +
  'Если инструмент вернул ошибку — честно скажи, что не смог узнать, но не выдумывай данные.';

const TOOLS = [
  {
    functionDeclarations: [
      {
        name: 'get_weather',
        description: 'Актуальная погода в городе.',
        parameters: {
          type: 'OBJECT',
          properties: {
            city: {
              type: 'STRING',
              description: 'Город в именительном падеже, например "Москва". Всегда приводи к именительному падежу.'
            }
          },
          required: ['city']
        }
      },
      {
        name: 'get_time',
        description: 'Текущее время и дата в городе.',
        parameters: {
          type: 'OBJECT',
          properties: {
            city: {
              type: 'STRING',
              description: 'Город в именительном падеже. Если не указан — "Санкт-Петербург".'
            }
          },
          required: ['city']
        }
      },
      {
        name: 'get_rate',
        description: 'Точный курс валюты или криптовалюты. Используй ВСЕГДА для вопросов про доллар, евро, биткоин и любые курсы.',
        parameters: {
          type: 'OBJECT',
          properties: {
            code: {
              type: 'STRING',
              description: 'Код валюты: USD, EUR, CNY, BTC, ETH и т.д.'
            }
          },
          required: ['code']
        }
      },
      {
        name: 'web_search',
        description: 'Поиск в интернете: новости, события, цены товаров, факты о компаниях, спорт, всё что могло измениться.',
        parameters: {
          type: 'OBJECT',
          properties: {
            query: {
              type: 'STRING',
              description: 'Конкретный поисковый запрос. Формулируй точно, не общими словами.'
            }
          },
          required: ['query']
        }
      }
    ]
  }
];

async function callGemini(contents, mode) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${mode.model}:generateContent?key=${GEMINI_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        tools: TOOLS,
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        generationConfig: { maxOutputTokens: mode.tokens, temperature: 0.9 }
      })
    }
  );
  const data = await res.json();
  console.log('GEMINI:', mode.model, JSON.stringify(data).slice(0, 400));

  if (data.error) throw new Error('API error: ' + JSON.stringify(data.error).slice(0, 200));
  if (!data.candidates || !data.candidates.length) {
    throw new Error('Нет candidates');
  }
  return data.candidates[0].content;
}

function textFrom(content) {
  return (content.parts || []).map((p) => p.text || '').join(' ').trim();
}

async function askAI(contents, mode) {
  let history = [...contents];

  for (let round = 0; round < 2; round++) {
    const content = await callGemini(history, mode);
    history.push(content);

    const calls = (content.parts || []).filter((p) => p.functionCall);
    if (!calls.length) return { answer: textFrom(content), history };

    const responses = await Promise.all(
      calls.map(async (p) => {
        const { name, args } = p.functionCall;
        const fn = TOOL_IMPL[name];
        console.log('TOOL:', name, JSON.stringify(args));
        let result;
        try {
          result = fn ? await fn(args || {}) : { error: 'Неизвестный инструмент' };
        } catch (e) {
          console.error('TOOL ERROR:', e.message);
          result = { error: 'Ошибка выполнения' };
        }
        return { name, result, functionResponse: { name, response: result } };
      })
    );

    if (round === 0 && responses.length === 1) {
      const r = responses[0];
      const fmt = FAST_FMT[r.name];
      if (fmt && !r.result.error) {
        console.log('FAST PATH:', r.name);
        history.push({ role: 'user', parts: [{ functionResponse: r.functionResponse }] });
        return { answer: fmt(r.result), history };
      }
    }

    history.push({
      role: 'user',
      parts: responses.map((r) => ({ functionResponse: r.functionResponse }))
    });
  }

  const final = await callGemini(history, mode);
  return { answer: textFrom(final) || 'Не смог разобраться.', history };
}

// ---------- прогрев кэшей пингером ----------
async function warmup() {
  try {
    await Promise.all([
      weatherByLoc(CITY_INDEX[stemPhrase(DEFAULT_CITY)]),
      weatherByLoc(CITY_INDEX[stemPhrase('Москва')]),
      getRate({ code: 'USD' })
    ]);
    console.log('WARMUP done');
  } catch (e) {
    console.error('WARMUP ERROR:', e.message);
  }
}

module.exports = async function handler(req, res) {
  if (req.method === 'GET') {
    warmup();
    return res.status(200).send('ok');
  }
  if (req.method !== 'POST') return res.status(405).send('Method not allowed');

  const body = req.body;
  const sessionId = body.session.session_id;
  const userText = body.request.command || '';
  const nluTokens = (body.request.nlu && body.request.nlu.tokens) || [];
  const isNew = body.session.new;

  if (isNew || !sessions[sessionId]) sessions[sessionId] = [];

  if (isNew) {
    return res.status(200).json(respond('Привет! Спроси меня что-нибудь.', body));
  }

  if (sessions[sessionId].length > 10) {
    sessions[sessionId] = sessions[sessionId].slice(-10);
  }

  sessions[sessionId].push({ role: 'user', parts: [{ text: userText }] });

  // пре-роутер: если попали в шаблон — модель не трогаем вообще
  try {
    const quick = await preRoute(userText, nluTokens);
    if (quick) {
      sessions[sessionId].push({ role: 'model', parts: [{ text: quick }] });
      return res.status(200).json(respond(quick, body));
    }
  } catch (e) {
    console.error('PRE ERROR:', e.message);
  }

  const mode = pickMode(userText);
  console.log('MODE:', mode.model, mode.tokens, '|', userText.slice(0, 60));

  let answer;
  try {
    const result = await askAI(sessions[sessionId], mode);
    answer = result.answer || 'Не понял вопрос, попробуй ещё раз.';
    sessions[sessionId] = result.history;
  } catch (e) {
    console.error('AI ERROR:', e.message);
    answer = 'Извини, что-то пошло не так, попробуй ещё раз.';
  }

  if (answer.length > 1000) answer = answer.slice(0, 1000);

  return res.status(200).json(respond(answer, body));
};

function respond(text, body) {
  const tts = text.replace(/\. /g, '. sil <[300]> ');
  return {
    response: { text, tts, end_session: false },
    session: body.session,
    version: body.version
  };
}
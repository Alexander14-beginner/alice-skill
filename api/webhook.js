const sessions = {};
const ctxStore = {};

const AITUNNEL_KEY = process.env.AITUNNEL_KEY;
const TAVILY_KEY = process.env.TAVILY_KEY;

const AITUNNEL_URL = 'https://api.aitunnel.ru/v1/chat/completions';
const MODEL_FAST = 'claude-haiku-4-5';
const MODEL_SMART = 'claude-haiku-4-5';

const DEFAULT_CITY = 'Санкт-Петербург';
const ANSWER_TIMEOUT = 4500;

const GREETINGS = [
  'Привет! Спроси меня что-нибудь.',
  'На связи. Что интересует?',
  'Привет! Слушаю тебя.',
  'Здесь. Спрашивай.',
  'Привет! О чём поговорим?'
];

// ---------- таблица городов: координаты и таймзона без обращения к сети ----------
const CITY_TABLE = [
  { n: 'Москва', lat: 55.7558, lon: 37.6173, tz: 'Europe/Moscow', pr: 'в Москве', alt: ['мск'] },
  { n: 'Санкт-Петербург', lat: 59.9343, lon: 30.3351, tz: 'Europe/Moscow', pr: 'в Санкт-Петербурге', alt: ['спб', 'питер', 'петербург', 'ленинград'] },
  { n: 'Новосибирск', lat: 55.0084, lon: 82.9357, tz: 'Asia/Novosibirsk', pr: 'в Новосибирске', alt: ['нск'] },
  { n: 'Екатеринбург', lat: 56.8389, lon: 60.6057, tz: 'Asia/Yekaterinburg', pr: 'в Екатеринбурге', alt: ['екб'] },
  { n: 'Казань', lat: 55.7963, lon: 49.1088, tz: 'Europe/Moscow', pr: 'в Казани', alt: ['кзн'] },
  { n: 'Нижний Новгород', lat: 56.3269, lon: 44.0059, tz: 'Europe/Moscow', pr: 'в Нижнем Новгороде', alt: ['нн'] },
  { n: 'Челябинск', lat: 55.1644, lon: 61.4368, tz: 'Asia/Yekaterinburg', pr: 'в Челябинске', alt: [] },
  { n: 'Самара', lat: 53.1959, lon: 50.1002, tz: 'Europe/Samara', pr: 'в Самаре', alt: [] },
  { n: 'Омск', lat: 54.9885, lon: 73.3242, tz: 'Asia/Omsk', pr: 'в Омске', alt: [] },
  { n: 'Ростов-на-Дону', lat: 47.2357, lon: 39.7015, tz: 'Europe/Moscow', pr: 'в Ростове-на-Дону', alt: ['ростов'] },
  { n: 'Уфа', lat: 54.7388, lon: 55.9721, tz: 'Asia/Yekaterinburg', pr: 'в Уфе', alt: [] },
  { n: 'Красноярск', lat: 56.0153, lon: 92.8932, tz: 'Asia/Krasnoyarsk', pr: 'в Красноярске', alt: [] },
  { n: 'Воронеж', lat: 51.672, lon: 39.1843, tz: 'Europe/Moscow', pr: 'в Воронеже', alt: [] },
  { n: 'Пермь', lat: 58.0105, lon: 56.2502, tz: 'Asia/Yekaterinburg', pr: 'в Перми', alt: [] },
  { n: 'Волгоград', lat: 48.708, lon: 44.5133, tz: 'Europe/Volgograd', pr: 'в Волгограде', alt: [] },
  { n: 'Краснодар', lat: 45.0355, lon: 38.9753, tz: 'Europe/Moscow', pr: 'в Краснодаре', alt: [] },
  { n: 'Саратов', lat: 51.5336, lon: 46.0343, tz: 'Europe/Saratov', pr: 'в Саратове', alt: [] },
  { n: 'Тюмень', lat: 57.1522, lon: 65.5272, tz: 'Asia/Yekaterinburg', pr: 'в Тюмени', alt: [] },
  { n: 'Тольятти', lat: 53.5303, lon: 49.3461, tz: 'Europe/Samara', pr: 'в Тольятти', alt: [] },
  { n: 'Ижевск', lat: 56.8527, lon: 53.2115, tz: 'Europe/Samara', pr: 'в Ижевске', alt: [] },
  { n: 'Барнаул', lat: 53.3606, lon: 83.7636, tz: 'Asia/Barnaul', pr: 'в Барнауле', alt: [] },
  { n: 'Иркутск', lat: 52.287, lon: 104.305, tz: 'Asia/Irkutsk', pr: 'в Иркутске', alt: [] },
  { n: 'Хабаровск', lat: 48.4827, lon: 135.0838, tz: 'Asia/Vladivostok', pr: 'в Хабаровске', alt: [] },
  { n: 'Владивосток', lat: 43.1156, lon: 131.8855, tz: 'Asia/Vladivostok', pr: 'во Владивостоке', alt: ['влад'] },
  { n: 'Ярославль', lat: 57.6261, lon: 39.8845, tz: 'Europe/Moscow', pr: 'в Ярославле', alt: [] },
  { n: 'Томск', lat: 56.4846, lon: 84.9476, tz: 'Asia/Tomsk', pr: 'в Томске', alt: [] },
  { n: 'Оренбург', lat: 51.7727, lon: 55.0988, tz: 'Asia/Yekaterinburg', pr: 'в Оренбурге', alt: [] },
  { n: 'Кемерово', lat: 55.3547, lon: 86.0873, tz: 'Asia/Novokuznetsk', pr: 'в Кемерове', alt: [] },
  { n: 'Сочи', lat: 43.5855, lon: 39.7231, tz: 'Europe/Moscow', pr: 'в Сочи', alt: [] },
  { n: 'Калининград', lat: 54.7104, lon: 20.4522, tz: 'Europe/Kaliningrad', pr: 'в Калининграде', alt: [] },
  { n: 'Мурманск', lat: 68.9585, lon: 33.0827, tz: 'Europe/Moscow', pr: 'в Мурманске', alt: [] },
  { n: 'Минск', lat: 53.9006, lon: 27.559, tz: 'Europe/Minsk', pr: 'в Минске', alt: [] },
  { n: 'Астана', lat: 51.1694, lon: 71.4491, tz: 'Asia/Almaty', pr: 'в Астане', alt: [] },
  { n: 'Лондон', lat: 51.5074, lon: -0.1278, tz: 'Europe/London', pr: 'в Лондоне', alt: [] },
  { n: 'Париж', lat: 48.8566, lon: 2.3522, tz: 'Europe/Paris', pr: 'в Париже', alt: [] },
  { n: 'Берлин', lat: 52.52, lon: 13.405, tz: 'Europe/Berlin', pr: 'в Берлине', alt: [] },
  { n: 'Нью-Йорк', lat: 40.7128, lon: -74.006, tz: 'America/New_York', pr: 'в Нью-Йорке', alt: [] },
  { n: 'Токио', lat: 35.6762, lon: 139.6503, tz: 'Asia/Tokyo', pr: 'в Токио', alt: [] },
  { n: 'Пекин', lat: 39.9042, lon: 116.4074, tz: 'Asia/Shanghai', pr: 'в Пекине', alt: [] },
  { n: 'Дубай', lat: 25.2048, lon: 55.2708, tz: 'Asia/Dubai', pr: 'в Дубае', alt: [] }
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

const HOME = CITY_INDEX[stemPhrase(DEFAULT_CITY)];

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
      const loc = {
        n: r.name,
        lat: r.latitude,
        lon: r.longitude,
        tz: r.timezone,
        pr: 'в городе ' + r.name
      };

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

      const key = tokens
        .slice(i, i + len)
        .map(stem)
        .join(' ');

      if (CITY_INDEX[key]) return CITY_INDEX[key];
    }
  }

  return null;
}

// ---------- погода словами ----------
const WMO = {
  0: 'ясно',
  1: 'малооблачно',
  2: 'переменная облачность',
  3: 'пасмурно',
  45: 'туман',
  48: 'туман с изморозью',
  51: 'морось',
  53: 'морось',
  55: 'сильная морось',
  56: 'ледяная морось',
  57: 'ледяная морось',
  61: 'небольшой дождь',
  63: 'дождь',
  65: 'сильный дождь',
  66: 'ледяной дождь',
  67: 'ледяной дождь',
  71: 'небольшой снег',
  73: 'снег',
  75: 'сильный снегопад',
  77: 'снежная крупа',
  80: 'кратковременный дождь',
  81: 'ливень',
  82: 'сильный ливень',
  85: 'снегопад',
  86: 'сильный снегопад',
  95: 'гроза',
  96: 'гроза с градом',
  99: 'гроза с градом'
};

function describe(code) {
  return WMO[code] || 'облачно';
}

// ---------- данные ----------
async function weatherByLoc(loc) {
  const key = loc.n;

  if (fresh(WEATHER_CACHE[key], WEATHER_TTL)) {
    return WEATHER_CACHE[key].data;
  }

  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lon}` +
        `&current=temperature_2m,apparent_temperature,wind_speed_10m,weather_code` +
        `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max` +
        `&timezone=auto&forecast_days=2`
    );

    const d = await res.json();

    const data = {
      city: loc.n,
      pr: loc.pr,
      code: d.current.weather_code,
      temp: d.current.temperature_2m,
      feels_like: d.current.apparent_temperature,
      wind: d.current.wind_speed_10m,
      max_today: d.daily.temperature_2m_max[0],
      min_today: d.daily.temperature_2m_min[0],
      rain_chance: d.daily.precipitation_probability_max[0],
      tomorrow: {
        code: d.daily.weather_code[1],
        max: d.daily.temperature_2m_max[1],
        min: d.daily.temperature_2m_min[1],
        rain_chance: d.daily.precipitation_probability_max[1]
      }
    };

    WEATHER_CACHE[key] = {
      data,
      ts: Date.now()
    };

    return data;
  } catch (e) {
    console.error('WEATHER ERROR:', e.message);
    return {
      error: 'Не удалось получить погоду'
    };
  }
}

async function getWeather({ city }) {
  const loc = await resolveCity(city);

  if (!loc) {
    return {
      error: 'Город не найден'
    };
  }

  return await weatherByLoc(loc);
}

function timeByLoc(loc) {
  const parts = new Intl.DateTimeFormat('ru-RU', {
    timeZone: loc.tz,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  }).formatToParts(new Date());

  const get = (type) => {
    return (parts.find((part) => part.type === type) || {}).value || '';
  };

  const hour = parseInt(get('hour'), 10);
  const minute = parseInt(get('minute'), 10);
  const date = `${get('weekday')}, ${get('day')} ${get('month')}`;

  return {
    city: loc.n,
    pr: loc.pr,
    hour,
    minute,
    date,
    current_time: `${get('hour')}:${get('minute')}, ${date}`
  };
}

async function getTime({ city }) {
  const loc = await resolveCity(city);

  if (!loc || !loc.tz) {
    return {
      error: 'Город не найден'
    };
  }

  return timeByLoc(loc);
}

async function getRate({ code }) {
  const cur = (code || '').toUpperCase();

  if (fresh(RATE_CACHE[cur], RATE_TTL)) {
    return RATE_CACHE[cur].data;
  }

  const CRYPTO = {
    BTC: 'bitcoin',
    ETH: 'ethereum',
    TON: 'the-open-network',
    SOL: 'solana',
    DOGE: 'dogecoin'
  };

  try {
    if (CRYPTO[cur]) {
      const res = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${CRYPTO[cur]}&vs_currencies=usd,rub`
      );

      const d = await res.json();
      const p = d[CRYPTO[cur]];

      if (!p) {
        return {
          error: 'Курс не найден'
        };
      }

      const data = {
        currency: cur,
        usd: p.usd,
        rub: p.rub
      };

      RATE_CACHE[cur] = {
        data,
        ts: Date.now()
      };

      return data;
    }

    const res = await fetch('https://www.cbr-xml-daily.ru/daily_json.js');
    const d = await res.json();
    const v = d.Valute[cur];

    if (!v) {
      return {
        error: 'Валюта не найдена'
      };
    }

    const data = {
      currency: cur,
      rub: (v.Value / v.Nominal).toFixed(2),
      source: 'ЦБ РФ',
      date: d.Date.slice(0, 10)
    };

    RATE_CACHE[cur] = {
      data,
      ts: Date.now()
    };

    return data;
  } catch (e) {
    console.error('RATE ERROR:', e.message);

    return {
      error: 'Не удалось получить курс'
    };
  }
}

async function webSearch({ query }) {
  if (!TAVILY_KEY) {
    return {
      error: 'Не задан TAVILY_KEY'
    };
  }

  try {
    const res = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        api_key: TAVILY_KEY,
        query,
        max_results: 3,
        search_depth: 'basic',
        include_answer: true
      })
    });

    const data = await res.json();

    console.log(
      'SEARCH:',
      query,
      '→',
      data.results ? data.results.length : 0
    );

    if (data.answer) {
      return {
        summary: data.answer.slice(0, 800)
      };
    }

    if (!data.results || !data.results.length) {
      return {
        error: 'Ничего не найдено'
      };
    }

    return {
      results: data.results.map((result) => ({
        title: result.title,
        content: (result.content || '').slice(0, 500)
      }))
    };
  } catch (e) {
    console.error('SEARCH ERROR:', e.message);

    return {
      error: 'Поиск недоступен'
    };
  }
}

const TOOL_IMPL = {
  get_weather: getWeather,
  get_time: getTime,
  get_rate: getRate,
  web_search: webSearch
};

// ---------- шаблоны ответов ----------
function plural(n, one, few, many) {
  const n10 = n % 10;
  const n100 = n % 100;

  if (n10 === 1 && n100 !== 11) return one;

  if (
    n10 >= 2 &&
    n10 <= 4 &&
    (n100 < 12 || n100 > 14)
  ) {
    return few;
  }

  return many;
}

function cap(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function sign(n) {
  const rounded = Math.round(n);

  if (rounded > 0) return 'плюс ' + rounded;
  if (rounded < 0) return 'минус ' + Math.abs(rounded);

  return 'ноль';
}

// префикс города: свой город не называем, чужой — называем
function where(data) {
  if (!data.city || data.city === DEFAULT_CITY) return '';

  return (data.pr || 'в городе ' + data.city) + ' ';
}

function precipWord(maxTemp) {
  return maxTemp <= 0 ? 'снег' : 'дождь';
}

function fmtWeather(data) {
  let text =
    `${where(data)}сейчас ${describe(data.code)}, ` +
    `${sign(data.temp)}`;

  if (Math.abs(data.temp - data.feels_like) >= 3) {
    text += `, ощущается как ${sign(data.feels_like)}`;
  }

  text += `. Днём до ${sign(data.max_today)}.`;

  if (data.rain_chance > 70) {
    text += ` Скорее всего будет ${precipWord(data.max_today)}.`;
  }

  if (data.wind >= 30) {
    text += ' И сильный ветер.';
  }

  return cap(text);
}

function fmtWeatherTomorrow(data) {
  const tomorrow = data.tomorrow;

  let text =
    `${where(data)}завтра ${describe(tomorrow.code)}, ` +
    `от ${sign(tomorrow.min)} до ${sign(tomorrow.max)}.`;

  if (tomorrow.rain_chance > 70) {
    text += ` Скорее всего будет ${precipWord(tomorrow.max)}.`;
  }

  return cap(text);
}

function fmtTime(data) {
  const hours =
    `${data.hour} ` +
    plural(data.hour, 'час', 'часа', 'часов');

  if (data.minute === 0) {
    return cap(
      `${where(data)}сейчас ровно ${hours}.`
    );
  }

  const minutes =
    `${data.minute} ` +
    plural(data.minute, 'минута', 'минуты', 'минут');

  return cap(
    `${where(data)}сейчас ${hours} ${minutes}.`
  );
}

function fmtDate(data) {
  return cap(
    `${where(data)}сегодня ${data.date}.`
  );
}

function fmtRate(data) {
  if (data.usd) {
    return (
      `${data.currency} стоит около ${Math.round(data.usd)} долларов, ` +
      `это примерно ${Math.round(data.rub)} рублей.`
    );
  }

  return (
    `Курс ${data.currency} — ${data.rub} рублей ` +
    `по данным ЦБ на ${data.date}.`
  );
}

const FAST_FMT = {
  get_weather: fmtWeather,
  get_time: fmtTime,
  get_rate: fmtRate
};

// ---------- ПРЕ-РОУТЕР: ответ вообще без вызова модели ----------
const REPEAT_RE =
  /(повтор|ещ раз|что ты сказа|не расслыш|не понял что ты)/;

const TIME_RE =
  /(скольк( сейчас)? времен|котор( сейчас)? час|скольк на час|как сейчас времен|точн время)/;

const DATE_RE =
  /(как сегодн числ|как сегодн ден|как ден недел|как( сегодн)? дат|как числ сегодн)/;

const TIME_BLOCK_RE =
  /(нужн|надо|займ|потреб|уйдет|остал|прошл|чтоб|через|назад|заня)/;

const WEATHER_RE =
  /(погод|скольк градус|как температур|тепл л|холодн л|дожд|зонт|снег|пасмурн|солнечн)/;

const WEATHER_BLOCK_RE =
  /(почем|объясн|сравн|послезавтр|вчер|недел|выходн|через|был|мес|прогноз на)/;

const TOMORROW_RE = /(^| )завтр/;

const RATE_RE =
  /(курс|скольк сто|почем доллар|почем евр|почем биткоин)/;

const RATE_BLOCK_RE =
  /(вчер|был|будет|прогноз|почем упа|почем рос|через|прошл|динамик)/;

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

function currencyFrom(stemmed) {
  for (const [regex, currency] of CURRENCY_MAP) {
    if (regex.test(stemmed)) return currency;
  }

  return null;
}

async function preRoute(rawText, nluTokens, ctx) {
  const plain = norm(rawText);

  if (!plain || plain.length > 80) {
    return null;
  }

  const tokens = (
    nluTokens && nluTokens.length
      ? nluTokens.map(norm)
      : plain.split(' ')
  ).filter(Boolean);

  const stemmed = tokens.map(stem).join(' ');
  const cityHere = cityFromTokens(tokens);

  // «повтори»
  if (REPEAT_RE.test(stemmed) && ctx.last) {
    console.log('PRE: repeat');

    return {
      answer: ctx.last,
      intent: ctx.intent,
      city: ctx.city
    };
  }

  // время
  if (
    TIME_RE.test(stemmed) &&
    !TIME_BLOCK_RE.test(stemmed)
  ) {
    const loc = cityHere || HOME;

    console.log('PRE: time', loc.n);

    return {
      answer: fmtTime(timeByLoc(loc)),
      intent: 'time',
      city: loc.n
    };
  }

  // дата и день недели
  if (
    DATE_RE.test(stemmed) &&
    !TIME_BLOCK_RE.test(stemmed)
  ) {
    const loc = cityHere || HOME;

    console.log('PRE: date', loc.n);

    return {
      answer: fmtDate(timeByLoc(loc)),
      intent: 'date',
      city: loc.n
    };
  }

  // погода: сегодня и завтра
  if (
    WEATHER_RE.test(stemmed) &&
    !WEATHER_BLOCK_RE.test(stemmed)
  ) {
    const previousCity =
      ctx.city
        ? CITY_INDEX[stemPhrase(ctx.city)]
        : null;

    const loc =
      cityHere ||
      previousCity ||
      HOME;

    const data = await weatherByLoc(loc);

    if (!data.error) {
      const tomorrow =
        TOMORROW_RE.test(stemmed);

      console.log(
        'PRE: weather',
        loc.n,
        tomorrow ? 'завтра' : 'сегодня'
      );

      return {
        answer:
          tomorrow
            ? fmtWeatherTomorrow(data)
            : fmtWeather(data),
        intent:
          tomorrow
            ? 'weather_tomorrow'
            : 'weather',
        city: loc.n
      };
    }
  }

  // курсы
  if (
    RATE_RE.test(stemmed) &&
    !RATE_BLOCK_RE.test(stemmed)
  ) {
    const code = currencyFrom(stemmed);

    if (code) {
      const data = await getRate({ code });

      if (!data.error) {
        console.log('PRE: rate', code);

        return {
          answer: fmtRate(data),
          intent: 'rate',
          city: ctx.city
        };
      }
    }
  }

  // «А в Москве?» после прошлого вопроса
  if (
    cityHere &&
    tokens.length <= 3 &&
    ctx.intent
  ) {
    if (
      ctx.intent === 'time' ||
      ctx.intent === 'date'
    ) {
      console.log(
        'PRE: follow-up',
        ctx.intent,
        cityHere.n
      );

      const time = timeByLoc(cityHere);

      return {
        answer:
          ctx.intent === 'time'
            ? fmtTime(time)
            : fmtDate(time),
        intent: ctx.intent,
        city: cityHere.n
      };
    }

    if (
      ctx.intent === 'weather' ||
      ctx.intent === 'weather_tomorrow'
    ) {
      const data =
        await weatherByLoc(cityHere);

      if (!data.error) {
        console.log(
          'PRE: follow-up',
          ctx.intent,
          cityHere.n
        );

        return {
          answer:
            ctx.intent === 'weather_tomorrow'
              ? fmtWeatherTomorrow(data)
              : fmtWeather(data),
          intent: ctx.intent,
          city: cityHere.n
        };
      }
    }
  }

  return null;
}

// ---------- модель ----------
const HARD_RE =
  /посчитай|сколько будет|сколько .{0,20}(можно|получится|выйдет)|почему|объясни|сравни|стоит ли|что выгоднее|в чём разница|в чем разница|как работает|придумай|расскажи про|что думаешь|как считаешь|убеди/i;

function pickMode(text) {
  const hard =
    HARD_RE.test(text) ||
    text.length > 70;

  return hard
    ? {
        model: MODEL_SMART,
        tokens: 400
      }
    : {
        model: MODEL_FAST,
        tokens: 300
      };
}

const SYSTEM_PROMPT =
  'Ты голосовой ассистент в умной колонке. Тебя слушают, а не читают. ' +
  'Говори живо и по-человечески, 1-3 предложения. Начинай сразу с сути: никаких "Конечно", "Отличный вопрос", "Давайте разберёмся". ' +
  'Можно лёгкая ирония и своё мнение. Без списков, markdown, эмодзи и скобок — в речи это звучит мусором. Без мата и 18+ тем. ' +
  'ВАЖНО: никогда не называй цифры, курсы, цены или статистику по памяти — только из результатов инструментов. ' +
  'Для курсов валют и криптовалют вызывай get_rate. Для новостей, цен, событий и свежих фактов вызывай web_search. ' +
  'Для погоды вызывай get_weather, если запрос не был обработан локально. Для времени и даты вызывай get_time. ' +
  'Названия технологий пиши так, как их произносят разработчики: Flask — флэск, Django — джанго, SQL — эс-ку-эль, FastAPI — фаст эй пи ай. Не переводи названия технологий на русский. ' +
  'При вычислениях с дробями посчитай по шагам про себя и проверь порядок величины обратным умножением, вслух скажи только результат. ' +
  'Если инструмент вернул ошибку — честно скажи, что не смог узнать, но не выдумывай данные.';

const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'get_weather',
      description:
        'Получает актуальную погоду в указанном городе.',
      parameters: {
        type: 'object',
        properties: {
          city: {
            type: 'string',
            description:
              'Город в именительном падеже, например Москва. Всегда приводи название города к именительному падежу.'
          }
        },
        required: ['city'],
        additionalProperties: false
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_time',
      description:
        'Получает текущее местное время и дату в указанном городе.',
      parameters: {
        type: 'object',
        properties: {
          city: {
            type: 'string',
            description:
              'Город в именительном падеже. Если пользователь не указал город, передай Санкт-Петербург.'
          }
        },
        required: ['city'],
        additionalProperties: false
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_rate',
      description:
        'Получает точный актуальный курс валюты или криптовалюты. Используй всегда для вопросов про доллар, евро, биткоин и любые курсы.',
      parameters: {
        type: 'object',
        properties: {
          code: {
            type: 'string',
            description:
              'Международный код валюты или криптовалюты: USD, EUR, CNY, BTC, ETH и так далее.'
          }
        },
        required: ['code'],
        additionalProperties: false
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'web_search',
      description:
        'Ищет актуальную информацию в интернете: новости, события, цены товаров, спорт и факты, которые могли измениться.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description:
              'Точный конкретный поисковый запрос на русском языке.'
          }
        },
        required: ['query'],
        additionalProperties: false
      }
    }
  }
];

function safeJsonParse(value) {
  if (!value) return {};

  if (typeof value === 'object') {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch (e) {
    console.error(
      'TOOL ARGS JSON ERROR:',
      String(value).slice(0, 200)
    );

    return {};
  }
}

function compactHistory(
  messages,
  maxMessages = 18
) {
  if (messages.length <= maxMessages) {
    return messages;
  }

  const trimmed =
    messages.slice(-maxMessages);

  while (
    trimmed.length &&
    trimmed[0].role !== 'user'
  ) {
    trimmed.shift();
  }

  return trimmed;
}

async function callAITunnel(
  messages,
  mode
) {
  if (!AITUNNEL_KEY) {
    throw new Error(
      'Не задан AITUNNEL_KEY'
    );
  }

  const started = Date.now();

  const response = await fetch(
    AITUNNEL_URL,
    {
      method: 'POST',
      headers: {
        'Content-Type':
          'application/json',
        Authorization:
          `Bearer ${AITUNNEL_KEY}`
      },
      body: JSON.stringify({
        model: mode.model,
        messages: [
          {
            role: 'system',
            content: SYSTEM_PROMPT
          },
          ...messages
        ],
        tools: TOOLS,
        tool_choice: 'auto',
        max_tokens: mode.tokens,
        temperature: 0.7
      })
    }
  );

  const raw = await response.text();

  let data;

  try {
    data = JSON.parse(raw);
  } catch (e) {
    throw new Error(
      'AITUNNEL вернул не JSON: ' +
      raw.slice(0, 200)
    );
  }

  console.log(
    'AITUNNEL:',
    mode.model,
    response.status,
    `${Date.now() - started}ms`,
    JSON.stringify(data).slice(0, 400)
  );

  if (!response.ok || data.error) {
    throw new Error(
      'AITUNNEL API error: ' +
      JSON.stringify(
        data.error || data
      ).slice(0, 250)
    );
  }

  const message =
    data.choices &&
    data.choices[0] &&
    data.choices[0].message;

  if (!message) {
    throw new Error(
      'AITUNNEL не вернул choices[0].message'
    );
  }

  return message;
}

function textFrom(message) {
  if (!message) return '';

  if (
    typeof message.content === 'string'
  ) {
    return message.content.trim();
  }

  if (
    Array.isArray(message.content)
  ) {
    return message.content
      .map((part) => {
        if (
          part &&
          typeof part.text === 'string'
        ) {
          return part.text;
        }

        return '';
      })
      .join(' ')
      .trim();
  }

  return '';
}

async function askAI(messages, mode) {
  let history =
    compactHistory([...messages]);

  for (
    let round = 0;
    round < 2;
    round++
  ) {
    const message =
      await callAITunnel(
        history,
        mode
      );

    const calls =
      Array.isArray(message.tool_calls)
        ? message.tool_calls
        : [];

    if (!calls.length) {
      const answer =
        textFrom(message);

      history.push({
        role: 'assistant',
        content: answer
      });

      return {
        answer,
        history:
          compactHistory(history)
      };
    }

    history.push({
      role: 'assistant',
      content:
        textFrom(message) || null,
      tool_calls: calls
    });

    const responses =
      await Promise.all(
        calls.map(async (call) => {
          const name =
            call.function &&
            call.function.name;

          const args =
            safeJsonParse(
              call.function &&
              call.function.arguments
            );

          const fn =
            TOOL_IMPL[name];

          console.log(
            'TOOL:',
            name,
            JSON.stringify(args)
          );

          let result;

          try {
            result = fn
              ? await fn(args)
              : {
                  error:
                    'Неизвестный инструмент'
                };
          } catch (e) {
            console.error(
              'TOOL ERROR:',
              e.message
            );

            result = {
              error:
                'Ошибка выполнения'
            };
          }

          return {
            call,
            name,
            result
          };
        })
      );

    for (const item of responses) {
      history.push({
        role: 'tool',
        tool_call_id: item.call.id,
        content:
          JSON.stringify(item.result)
      });
    }

    if (
      round === 0 &&
      responses.length === 1
    ) {
      const result = responses[0];
      const formatter =
        FAST_FMT[result.name];

      if (
        formatter &&
        !result.result.error
      ) {
        const answer =
          formatter(result.result);

        console.log(
          'FAST PATH:',
          result.name
        );

        history.push({
          role: 'assistant',
          content: answer
        });

        return {
          answer,
          history:
            compactHistory(history)
        };
      }
    }
  }

  const finalMessage =
    await callAITunnel(
      history,
      mode
    );

  const answer =
    textFrom(finalMessage) ||
    'Не смог разобраться.';

  history.push({
    role: 'assistant',
    content: answer
  });

  return {
    answer,
    history:
      compactHistory(history)
  };
}

// ---------- прогрев кэшей пингером ----------
async function warmup() {
  try {
    await Promise.all([
      weatherByLoc(HOME),
      weatherByLoc(
        CITY_INDEX[
          stemPhrase('Москва')
        ]
      ),
      getRate({
        code: 'USD'
      })
    ]);

    console.log('WARMUP done');
  } catch (e) {
    console.error(
      'WARMUP ERROR:',
      e.message
    );
  }
}

module.exports =
  async function handler(req, res) {
    if (req.method === 'GET') {
      await warmup();

      return res
        .status(200)
        .send('ok');
    }

    if (req.method !== 'POST') {
      return res
        .status(405)
        .send('Method not allowed');
    }

    const body = req.body || {};
    const session = body.session || {};
    const request = body.request || {};

    const sessionId =
      session.session_id ||
      'unknown-session';

    const userText =
      request.command || '';

    const nluTokens =
      request.nlu &&
      request.nlu.tokens
        ? request.nlu.tokens
        : [];

    const isNew =
      Boolean(session.new);

    if (
      isNew ||
      !sessions[sessionId]
    ) {
      sessions[sessionId] = [];
    }

    if (
      isNew ||
      !ctxStore[sessionId]
    ) {
      ctxStore[sessionId] = {};
    }

    if (isNew) {
      const hello =
        GREETINGS[
          Math.floor(
            Math.random() *
            GREETINGS.length
          )
        ];

      return res
        .status(200)
        .json(
          respond(hello, body)
        );
    }

    sessions[sessionId] =
      compactHistory(
        sessions[sessionId],
        18
      );

    sessions[sessionId].push({
      role: 'user',
      content: userText
    });

    const ctx =
      ctxStore[sessionId];

    // пре-роутер
    try {
      const quick =
        await preRoute(
          userText,
          nluTokens,
          ctx
        );

      if (quick) {
        ctx.intent = quick.intent;
        ctx.city = quick.city;
        ctx.last = quick.answer;

        sessions[sessionId].push({
          role: 'assistant',
          content: quick.answer
        });

        return res
          .status(200)
          .json(
            respond(
              quick.answer,
              body
            )
          );
      }
    } catch (e) {
      console.error(
        'PRE ERROR:',
        e.message
      );
    }

    const mode =
      pickMode(userText);

    console.log(
      'MODE:',
      mode.model,
      mode.tokens,
      '|',
      userText.slice(0, 60)
    );

    let answer;

    try {
      const result =
        await Promise.race([
          askAI(
            sessions[sessionId],
            mode
          ),
          new Promise((resolve) => {
            setTimeout(
              () => resolve(null),
              ANSWER_TIMEOUT
            );
          })
        ]);

      if (result) {
        answer =
          result.answer ||
          'Не понял вопрос, попробуй ещё раз.';

        sessions[sessionId] =
          result.history;
      } else {
        console.error(
          'TIMEOUT после',
          ANSWER_TIMEOUT,
          'мс'
        );

        answer =
          'Что-то я задумался. Спроси ещё раз.';
      }
    } catch (e) {
      console.error(
        'AI ERROR:',
        e.message
      );

      answer =
        'Извини, что-то пошло не так, попробуй ещё раз.';
    }

    if (answer.length > 1000) {
      answer =
        answer.slice(0, 1000);
    }

    ctx.intent = null;
    ctx.city = null;
    ctx.last = answer;

    return res
      .status(200)
      .json(
        respond(answer, body)
      );
  };

function respond(text, body) {
  const safeText =
    String(text || '')
      .trim() ||
    'Не смог ответить.';

  const tts =
    safeText.replace(
      /\. /g,
      '. sil <[300]> '
    );

  return {
    response: {
      text: safeText,
      tts,
      end_session: false
    },
    session: body.session,
    version: body.version
  };
}
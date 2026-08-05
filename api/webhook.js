const sessions = {};
const ctxStore = {};

const GEMINI_KEY = process.env.GEMINI_KEY;
const AITUNNEL_KEY = process.env.AITUNNEL_KEY;
const TAVILY_KEY = process.env.TAVILY_KEY;

const GEMINI_MODEL = 'gemini-3.5-flash-lite';
const HAIKU_MODEL = 'claude-haiku-4.5';
const AITUNNEL_URL = 'https://api.aitunnel.ru/v1/chat/completions';

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
  { n: 'Кемерово', lat: 55.3547, lon: 86.0873, tz: 'Asia/Novokuznetsk', pr: 'в Кемерово', alt: [] },
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

  return w.replace(
    /(ами|ями|ое|ые|ие|ом|ем|ой|ей|ах|ях|ов|ев|ий|ый|ая|яя|ую|юю|ья|а|о|у|е|ы|и|я|ю|й|ь)$/,
    ''
  );
}

function stemPhrase(s) {
  return norm(s)
    .split(' ')
    .map(stem)
    .join(' ');
}

const CITY_INDEX = {};

for (const city of CITY_TABLE) {
  CITY_INDEX[stemPhrase(city.n)] = city;

  for (const alias of city.alt) {
    CITY_INDEX[stemPhrase(alias)] = city;
  }
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

  if (GEO_CACHE[key]) {
    return GEO_CACHE[key];
  }

  try {
    const response = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=1&language=ru`
    );

    const data = await response.json();

    if (data.results && data.results.length) {
      const result = data.results[0];

      const location = {
        n: result.name,
        lat: result.latitude,
        lon: result.longitude,
        tz: result.timezone,
        pr: 'в городе ' + result.name
      };

      GEO_CACHE[key] = location;
      return location;
    }
  } catch (error) {
    console.error('GEO ERROR:', error.message);
  }

  return null;
}

async function resolveCity(rawName) {
  const key = stemPhrase(rawName || '');

  if (CITY_INDEX[key]) {
    return CITY_INDEX[key];
  }

  return await geoLookup(rawName);
}

function cityFromTokens(tokens) {
  for (let index = 0; index < tokens.length; index++) {
    for (let length = 3; length >= 1; length--) {
      if (index + length > tokens.length) {
        continue;
      }

      const key = tokens
        .slice(index, index + length)
        .map(stem)
        .join(' ');

      if (CITY_INDEX[key]) {
        return CITY_INDEX[key];
      }
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

// ---------- погода ----------
async function weatherByLoc(location) {
  const key = location.n;

  if (fresh(WEATHER_CACHE[key], WEATHER_TTL)) {
    return WEATHER_CACHE[key].data;
  }

  try {
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${location.lat}&longitude=${location.lon}` +
        '&current=temperature_2m,apparent_temperature,wind_speed_10m,weather_code' +
        '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max' +
        '&timezone=auto&forecast_days=2'
    );

    const raw = await response.json();

    if (!raw.current || !raw.daily) {
      throw new Error('Open-Meteo вернул неполные данные');
    }

    const data = {
      city: location.n,
      pr: location.pr,
      code: raw.current.weather_code,
      temp: raw.current.temperature_2m,
      feels_like: raw.current.apparent_temperature,
      wind: raw.current.wind_speed_10m,
      max_today: raw.daily.temperature_2m_max[0],
      min_today: raw.daily.temperature_2m_min[0],
      rain_chance: raw.daily.precipitation_probability_max[0],
      tomorrow: {
        code: raw.daily.weather_code[1],
        max: raw.daily.temperature_2m_max[1],
        min: raw.daily.temperature_2m_min[1],
        rain_chance: raw.daily.precipitation_probability_max[1]
      }
    };

    WEATHER_CACHE[key] = {
      data,
      ts: Date.now()
    };

    return data;
  } catch (error) {
    console.error('WEATHER ERROR:', error.message);

    return {
      error: 'Не удалось получить погоду'
    };
  }
}

async function getWeather({ city }) {
  const location = await resolveCity(city);

  if (!location) {
    return {
      error: 'Город не найден'
    };
  }

  return await weatherByLoc(location);
}

// ---------- время ----------
function timeByLoc(location) {
  const parts = new Intl.DateTimeFormat('ru-RU', {
    timeZone: location.tz,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  }).formatToParts(new Date());

  const get = (type) => {
    return (
      parts.find((part) => part.type === type) || {}
    ).value || '';
  };

  const hour = parseInt(get('hour'), 10);
  const minute = parseInt(get('minute'), 10);
  const date = `${get('weekday')}, ${get('day')} ${get('month')}`;

  return {
    city: location.n,
    pr: location.pr,
    hour,
    minute,
    date,
    current_time: `${get('hour')}:${get('minute')}, ${date}`
  };
}

async function getTime({ city }) {
  const location = await resolveCity(city);

  if (!location || !location.tz) {
    return {
      error: 'Город не найден'
    };
  }

  return timeByLoc(location);
}

// ---------- курсы ----------
async function getRate({ code }) {
  const currency = (code || '').toUpperCase();

  if (fresh(RATE_CACHE[currency], RATE_TTL)) {
    return RATE_CACHE[currency].data;
  }

  const CRYPTO = {
    BTC: 'bitcoin',
    ETH: 'ethereum',
    TON: 'the-open-network',
    SOL: 'solana',
    DOGE: 'dogecoin'
  };

  try {
    if (CRYPTO[currency]) {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${CRYPTO[currency]}&vs_currencies=usd,rub`
      );

      const raw = await response.json();
      const price = raw[CRYPTO[currency]];

      if (!price) {
        return {
          error: 'Курс не найден'
        };
      }

      const data = {
        currency,
        usd: price.usd,
        rub: price.rub
      };

      RATE_CACHE[currency] = {
        data,
        ts: Date.now()
      };

      return data;
    }

    const response = await fetch(
      'https://www.cbr-xml-daily.ru/daily_json.js'
    );

    const raw = await response.json();
    const rate = raw.Valute && raw.Valute[currency];

    if (!rate) {
      return {
        error: 'Валюта не найдена'
      };
    }

    const data = {
      currency,
      rub: (rate.Value / rate.Nominal).toFixed(2),
      source: 'ЦБ РФ',
      date: raw.Date.slice(0, 10)
    };

    RATE_CACHE[currency] = {
      data,
      ts: Date.now()
    };

    return data;
  } catch (error) {
    console.error('RATE ERROR:', error.message);

    return {
      error: 'Не удалось получить курс'
    };
  }
}

// ---------- поиск ----------
async function webSearch({ query }) {
  if (!TAVILY_KEY) {
    return {
      error: 'Не задан TAVILY_KEY'
    };
  }

  try {
    const response = await fetch(
      'https://api.tavily.com/search',
      {
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
      }
    );

    const data = await response.json();

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
  } catch (error) {
    console.error('SEARCH ERROR:', error.message);

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
function plural(number, one, few, many) {
  const lastDigit = number % 10;
  const lastTwoDigits = number % 100;

  if (lastDigit === 1 && lastTwoDigits !== 11) {
    return one;
  }

  if (
    lastDigit >= 2 &&
    lastDigit <= 4 &&
    (lastTwoDigits < 12 || lastTwoDigits > 14)
  ) {
    return few;
  }

  return many;
}

function cap(text) {
  if (!text) {
    return text;
  }

  return text.charAt(0).toUpperCase() + text.slice(1);
}

function sign(number) {
  const rounded = Math.round(number);

  if (rounded > 0) {
    return 'плюс ' + rounded;
  }

  if (rounded < 0) {
    return 'минус ' + Math.abs(rounded);
  }

  return 'ноль';
}

function where(data) {
  if (!data.city || data.city === DEFAULT_CITY) {
    return '';
  }

  return (data.pr || 'в городе ' + data.city) + ' ';
}

function precipWord(maxTemperature) {
  return maxTemperature <= 0 ? 'снег' : 'дождь';
}

function fmtWeather(data) {
  let text =
    `${where(data)}сейчас ${describe(data.code)}, ` +
    `${sign(data.temp)}`;

  if (
    Math.abs(data.temp - data.feels_like) >= 3
  ) {
    text +=
      `, ощущается как ${sign(data.feels_like)}`;
  }

  text +=
    `. Днём до ${sign(data.max_today)}.`;

  if (data.rain_chance > 70) {
    text +=
      ` Скорее всего будет ${precipWord(data.max_today)}.`;
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
    text +=
      ` Скорее всего будет ${precipWord(tomorrow.max)}.`;
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
    plural(
      data.minute,
      'минута',
      'минуты',
      'минут'
    );

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
      `${data.currency} стоит около ` +
      `${Math.round(data.usd)} долларов, ` +
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

// ---------- пре-роутер ----------
const REPEAT_RE =
  /(повтор|ещ раз|что ты сказа|не расслыш|не понял что ты)/;

const TIME_RE =
  /(^| )(врем|скольк( сейчас)? времен|котор( сейчас)? час|скольк на час|как сейчас времен|точн время)($| )/;

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
    if (regex.test(stemmed)) {
      return currency;
    }
  }

  return null;
}

async function preRoute(
  rawText,
  nluTokens,
  context
) {
  const plain = norm(rawText);

  if (!plain || plain.length > 80) {
    return null;
  }

  const tokens = (
    nluTokens && nluTokens.length
      ? nluTokens.map(norm)
      : plain.split(' ')
  ).filter(Boolean);

  const stemmed = tokens
    .map(stem)
    .join(' ');

  const cityHere = cityFromTokens(tokens);

  if (
    REPEAT_RE.test(stemmed) &&
    context.last
  ) {
    console.log('PRE: repeat');

    return {
      answer: context.last,
      intent: context.intent,
      city: context.city
    };
  }

  if (
    TIME_RE.test(stemmed) &&
    !TIME_BLOCK_RE.test(stemmed)
  ) {
    const location = cityHere || HOME;

    console.log(
      'PRE: time',
      location.n
    );

    return {
      answer: fmtTime(timeByLoc(location)),
      intent: 'time',
      city: location.n
    };
  }

  if (
    DATE_RE.test(stemmed) &&
    !TIME_BLOCK_RE.test(stemmed)
  ) {
    const location = cityHere || HOME;

    console.log(
      'PRE: date',
      location.n
    );

    return {
      answer: fmtDate(timeByLoc(location)),
      intent: 'date',
      city: location.n
    };
  }

  if (
    WEATHER_RE.test(stemmed) &&
    !WEATHER_BLOCK_RE.test(stemmed)
  ) {
    const contextCity =
      context.city
        ? CITY_INDEX[stemPhrase(context.city)]
        : null;

    const location =
      cityHere ||
      contextCity ||
      HOME;

    const data =
      await weatherByLoc(location);

    if (!data.error) {
      const tomorrow =
        TOMORROW_RE.test(stemmed);

      console.log(
        'PRE: weather',
        location.n,
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
        city: location.n
      };
    }
  }

  if (
    RATE_RE.test(stemmed) &&
    !RATE_BLOCK_RE.test(stemmed)
  ) {
    const code = currencyFrom(stemmed);

    if (code) {
      const data = await getRate({ code });

      if (!data.error) {
        console.log(
          'PRE: rate',
          code
        );

        return {
          answer: fmtRate(data),
          intent: 'rate',
          city: context.city
        };
      }
    }
  }

  if (
    cityHere &&
    tokens.length <= 3 &&
    context.intent
  ) {
    if (
      context.intent === 'time' ||
      context.intent === 'date'
    ) {
      const time = timeByLoc(cityHere);

      console.log(
        'PRE: follow-up',
        context.intent,
        cityHere.n
      );

      return {
        answer:
          context.intent === 'time'
            ? fmtTime(time)
            : fmtDate(time),
        intent: context.intent,
        city: cityHere.n
      };
    }

    if (
      context.intent === 'weather' ||
      context.intent === 'weather_tomorrow'
    ) {
      const data =
        await weatherByLoc(cityHere);

      if (!data.error) {
        console.log(
          'PRE: follow-up',
          context.intent,
          cityHere.n
        );

        return {
          answer:
            context.intent === 'weather_tomorrow'
              ? fmtWeatherTomorrow(data)
              : fmtWeather(data),
          intent: context.intent,
          city: cityHere.n
        };
      }
    }
  }

  return null;
}

// ---------- выбор модели ----------
function wantsHaiku(text) {
  const words = norm(text)
    .split(' ')
    .filter(Boolean);

  return words.includes('продумай');
}

function pickMode(text) {
  if (wantsHaiku(text)) {
    return {
      provider: 'haiku',
      model: HAIKU_MODEL,
      tokens: 400
    };
  }

  return {
    provider: 'gemini',
    model: GEMINI_MODEL,
    tokens: 300
  };
}

const SYSTEM_PROMPT =
  'Ты голосовой ассистент в умной колонке. Тебя слушают, а не читают. ' +
  'Говори живо и по-человечески, 1-3 предложения. Начинай сразу с сути: никаких "Конечно", "Отличный вопрос", "Давайте разберёмся". ' +
  'Можно лёгкая ирония и своё мнение. Без списков, markdown, эмодзи и скобок — в речи это звучит мусором. Без мата и 18+ тем. ' +
  'ВАЖНО: никогда не называй цифры, курсы, цены и статистику по памяти — только из результатов инструментов. ' +
  'Для погоды вызывай get_weather. Для времени и даты вызывай get_time. ' +
  'Для курсов валют и криптовалют вызывай get_rate. Для новостей, цен, событий и свежих фактов вызывай web_search. ' +
  'Названия технологий пиши так, как их произносят разработчики: Flask — флэск, Django — джанго, SQL — эс-ку-эль, FastAPI — фаст эй пи ай. Не переводи названия на русский. ' +
  'При вычислениях с дробями посчитай по шагам про себя и проверь порядок величины обратным умножением, вслух скажи только результат. ' +
  'Если инструмент вернул ошибку — честно скажи, что не смог узнать, но не выдумывай данные.';

// ---------- инструменты Gemini ----------
const GEMINI_TOOLS = [
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
              description:
                'Город в именительном падеже, например "Москва". Всегда приводи к именительному падежу.'
            }
          },
          required: ['city']
        }
      },
      {
        name: 'get_time',
        description:
          'Текущее время и дата в городе.',
        parameters: {
          type: 'OBJECT',
          properties: {
            city: {
              type: 'STRING',
              description:
                'Город в именительном падеже. Если не указан — "Санкт-Петербург".'
            }
          },
          required: ['city']
        }
      },
      {
        name: 'get_rate',
        description:
          'Точный курс валюты или криптовалюты. Используй всегда для вопросов про доллар, евро, биткоин и любые курсы.',
        parameters: {
          type: 'OBJECT',
          properties: {
            code: {
              type: 'STRING',
              description:
                'Код валюты: USD, EUR, CNY, BTC, ETH и так далее.'
            }
          },
          required: ['code']
        }
      },
      {
        name: 'web_search',
        description:
          'Поиск в интернете: новости, события, цены товаров, факты о компаниях, спорт, всё что могло измениться.',
        parameters: {
          type: 'OBJECT',
          properties: {
            query: {
              type: 'STRING',
              description:
                'Конкретный поисковый запрос. Формулируй точно, не общими словами.'
            }
          },
          required: ['query']
        }
      }
    ]
  }
];

// ---------- инструменты Claude через AITUNNEL ----------
const OPENAI_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'get_weather',
      description:
        'Актуальная погода в городе.',
      parameters: {
        type: 'object',
        properties: {
          city: {
            type: 'string',
            description:
              'Город в именительном падеже, например Москва.'
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
        'Текущее время и дата в городе.',
      parameters: {
        type: 'object',
        properties: {
          city: {
            type: 'string',
            description:
              'Город в именительном падеже. Если не указан — Санкт-Петербург.'
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
        'Точный курс валюты или криптовалюты. Используй всегда для вопросов про любые курсы.',
      parameters: {
        type: 'object',
        properties: {
          code: {
            type: 'string',
            description:
              'Код валюты: USD, EUR, CNY, BTC, ETH и так далее.'
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
        'Поиск в интернете: новости, события, цены товаров, компании, спорт и всё, что могло измениться.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description:
              'Конкретный поисковый запрос.'
          }
        },
        required: ['query'],
        additionalProperties: false
      }
    }
  }
];

function trimSession(history) {
  if (history.length <= 10) {
    return history;
  }

  return history.slice(-10);
}

function toGeminiContents(history) {
  return history.map((message) => ({
    role:
      message.role === 'assistant'
        ? 'model'
        : 'user',
    parts: [
      {
        text: message.content
      }
    ]
  }));
}

async function runTool(name, args) {
  const implementation =
    TOOL_IMPL[name];

  console.log(
    'TOOL:',
    name,
    JSON.stringify(args || {})
  );

  try {
    return implementation
      ? await implementation(args || {})
      : {
          error:
            'Неизвестный инструмент'
        };
  } catch (error) {
    console.error(
      'TOOL ERROR:',
      error.message
    );

    return {
      error:
        'Ошибка выполнения'
    };
  }
}

// ---------- Gemini 3.5 Flash-Lite ----------
async function callGemini(
  contents,
  mode
) {
  if (!GEMINI_KEY) {
    throw new Error(
      'Не задан GEMINI_KEY'
    );
  }

  const started = Date.now();

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${mode.model}:generateContent?key=${GEMINI_KEY}`,
    {
      method: 'POST',
      headers: {
        'Content-Type':
          'application/json'
      },
      body: JSON.stringify({
        contents,
        tools: GEMINI_TOOLS,
        systemInstruction: {
          parts: [
            {
              text: SYSTEM_PROMPT
            }
          ]
        },
        generationConfig: {
          maxOutputTokens:
            mode.tokens,
          temperature: 0.9
        }
      })
    }
  );

  const rawText =
    await response.text();

  let data;

  try {
    data = JSON.parse(rawText);
  } catch (error) {
    throw new Error(
      'Gemini вернул не JSON: ' +
      rawText.slice(0, 200)
    );
  }

  console.log(
    'GEMINI:',
    mode.model,
    response.status,
    `${Date.now() - started}ms`,
    JSON.stringify(data).slice(0, 400)
  );

  if (
    !response.ok ||
    data.error
  ) {
    throw new Error(
      'Gemini API error: ' +
      JSON.stringify(
        data.error || data
      ).slice(0, 250)
    );
  }

  if (
    !data.candidates ||
    !data.candidates.length
  ) {
    throw new Error(
      'Gemini не вернул candidates'
    );
  }

  return data.candidates[0].content;
}

function textFromGemini(content) {
  return (content.parts || [])
    .map((part) => part.text || '')
    .join(' ')
    .trim();
}

async function askGemini(
  messages,
  mode
) {
  const history =
    toGeminiContents(messages);

  for (
    let round = 0;
    round < 2;
    round++
  ) {
    const content =
      await callGemini(
        history,
        mode
      );

    history.push(content);

    const calls =
      (content.parts || [])
        .filter(
          (part) =>
            part.functionCall
        );

    if (!calls.length) {
      return textFromGemini(content);
    }

    const responses =
      await Promise.all(
        calls.map(async (part) => {
          const {
            name,
            args
          } = part.functionCall;

          const result =
            await runTool(
              name,
              args
            );

          return {
            name,
            result,
            functionResponse: {
              name,
              response: result
            }
          };
        })
      );

    if (
      round === 0 &&
      responses.length === 1
    ) {
      const item = responses[0];
      const formatter =
        FAST_FMT[item.name];

      if (
        formatter &&
        !item.result.error
      ) {
        console.log(
          'FAST PATH: GEMINI',
          item.name
        );

        return formatter(
          item.result
        );
      }
    }

    history.push({
      role: 'user',
      parts: responses.map(
        (item) => ({
          functionResponse:
            item.functionResponse
        })
      )
    });
  }

  const final =
    await callGemini(
      history,
      mode
    );

  return (
    textFromGemini(final) ||
    'Не смог разобраться.'
  );
}

// ---------- Claude Haiku 4.5 через AITUNNEL ----------
function safeJsonParse(value) {
  if (!value) {
    return {};
  }

  if (typeof value === 'object') {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch (error) {
    console.error(
      'TOOL ARGS JSON ERROR:',
      String(value).slice(0, 200)
    );

    return {};
  }
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
        tools: OPENAI_TOOLS,
        tool_choice: 'auto',
        max_tokens: mode.tokens,
        temperature: 0.7
      })
    }
  );

  const rawText =
    await response.text();

  let data;

  try {
    data = JSON.parse(rawText);
  } catch (error) {
    throw new Error(
      'AITUNNEL вернул не JSON: ' +
      rawText.slice(0, 200)
    );
  }

  console.log(
    'AITUNNEL:',
    mode.model,
    response.status,
    `${Date.now() - started}ms`,
    JSON.stringify(data).slice(0, 400)
  );

  if (
    !response.ok ||
    data.error
  ) {
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

function textFromOpenAI(message) {
  if (!message) {
    return '';
  }

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
          typeof part === 'string'
        ) {
          return part;
        }

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

async function askHaiku(
  messages,
  mode
) {
  const history =
    messages.map((message) => ({
      role: message.role,
      content: message.content
    }));

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
      Array.isArray(
        message.tool_calls
      )
        ? message.tool_calls
        : [];

    if (!calls.length) {
      return textFromOpenAI(message);
    }

    history.push({
      role: 'assistant',
      content:
        textFromOpenAI(message) ||
        null,
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

          const result =
            await runTool(
              name,
              args
            );

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
        tool_call_id:
          item.call.id,
        content:
          JSON.stringify(
            item.result
          )
      });
    }

    if (
      round === 0 &&
      responses.length === 1
    ) {
      const item = responses[0];
      const formatter =
        FAST_FMT[item.name];

      if (
        formatter &&
        !item.result.error
      ) {
        console.log(
          'FAST PATH: HAIKU',
          item.name
        );

        return formatter(
          item.result
        );
      }
    }
  }

  const final =
    await callAITunnel(
      history,
      mode
    );

  return (
    textFromOpenAI(final) ||
    'Не смог разобраться.'
  );
}

async function askSelected(
  messages,
  mode
) {
  if (mode.provider === 'haiku') {
    try {
      return await askHaiku(
        messages,
        mode
      );
    } catch (error) {
      console.error(
        'HAIKU ERROR:',
        error.message
      );

      console.log(
        'FALLBACK: HAIKU → GEMINI'
      );

      return await askGemini(
        messages,
        {
          provider: 'gemini',
          model: GEMINI_MODEL,
          tokens: 300
        }
      );
    }
  }

  return await askGemini(
    messages,
    mode
  );
}

// ---------- прогрев кэшей ----------
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
  } catch (error) {
    console.error(
      'WARMUP ERROR:',
      error.message
    );
  }
}

// ---------- обработчик Алисы ----------
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
      Array.isArray(request.nlu.tokens)
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
      const greeting =
        GREETINGS[
          Math.floor(
            Math.random() *
            GREETINGS.length
          )
        ];

      return res
        .status(200)
        .json(
          respond(greeting, body)
        );
    }

    sessions[sessionId] =
      trimSession(
        sessions[sessionId]
      );

    sessions[sessionId].push({
      role: 'user',
      content: userText
    });

    const context =
      ctxStore[sessionId];

    const mode =
      pickMode(userText);

    // Слово «продумай» всегда направляет запрос в Haiku.
    // Остальные запросы сначала проверяются локально.
    if (
      mode.provider !== 'haiku'
    ) {
      try {
        const quick =
          await preRoute(
            userText,
            nluTokens,
            context
          );

        if (quick) {
          context.intent =
            quick.intent;

          context.city =
            quick.city;

          context.last =
            quick.answer;

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
      } catch (error) {
        console.error(
          'PRE ERROR:',
          error.message
        );
      }
    }

    console.log(
      'ROUTE:',
      mode.provider.toUpperCase(),
      mode.model,
      mode.tokens,
      '|',
      userText.slice(0, 80)
    );

    let answer;

    try {
      const result =
        await Promise.race([
          askSelected(
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
          result ||
          'Не понял вопрос, попробуй ещё раз.';
      } else {
        console.error(
          'TIMEOUT после',
          ANSWER_TIMEOUT,
          'мс'
        );

        answer =
          'Что-то я задумался. Спроси ещё раз.';
      }
    } catch (error) {
      console.error(
        'AI ERROR:',
        error.message
      );

      answer =
        'Извини, что-то пошло не так, попробуй ещё раз.';
    }

    if (answer.length > 1000) {
      answer =
        answer.slice(0, 1000);
    }

    sessions[sessionId].push({
      role: 'assistant',
      content: answer
    });

    sessions[sessionId] =
      trimSession(
        sessions[sessionId]
      );

    context.intent = null;
    context.city = null;
    context.last = answer;

    return res
      .status(200)
      .json(
        respond(answer, body)
      );
  };

function respond(text, body) {
  const safeText =
    String(text || '').trim() ||
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
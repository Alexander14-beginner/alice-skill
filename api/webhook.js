const sessions = {};
const ctxStore = {};

const GEMINI_KEY = process.env.GEMINI_KEY;
const TAVILY_KEY = process.env.TAVILY_KEY;
const ORS_KEY = process.env.ORS_KEY;
const HOME_ADDRESS = process.env.HOME_ADDRESS;

const MODEL_FAST = 'gemini-3.5-flash-lite';
const MODEL_SMART = 'gemini-3.5-flash-lite';

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
  {
    n: 'Санкт-Петербург',
    lat: 59.9343,
    lon: 30.3351,
    tz: 'Europe/Moscow',
    pr: 'в Санкт-Петербурге',
    alt: ['спб', 'питер', 'петербург', 'ленинград']
  },
  {
    n: 'Новосибирск',
    lat: 55.0084,
    lon: 82.9357,
    tz: 'Asia/Novosibirsk',
    pr: 'в Новосибирске',
    alt: ['нск']
  },
  {
    n: 'Екатеринбург',
    lat: 56.8389,
    lon: 60.6057,
    tz: 'Asia/Yekaterinburg',
    pr: 'в Екатеринбурге',
    alt: ['екб']
  },
  { n: 'Казань', lat: 55.7963, lon: 49.1088, tz: 'Europe/Moscow', pr: 'в Казани', alt: ['кзн'] },
  {
    n: 'Нижний Новгород',
    lat: 56.3269,
    lon: 44.0059,
    tz: 'Europe/Moscow',
    pr: 'в Нижнем Новгороде',
    alt: ['нн']
  },
  {
    n: 'Челябинск',
    lat: 55.1644,
    lon: 61.4368,
    tz: 'Asia/Yekaterinburg',
    pr: 'в Челябинске',
    alt: []
  },
  { n: 'Самара', lat: 53.1959, lon: 50.1002, tz: 'Europe/Samara', pr: 'в Самаре', alt: [] },
  { n: 'Омск', lat: 54.9885, lon: 73.3242, tz: 'Asia/Omsk', pr: 'в Омске', alt: [] },
  {
    n: 'Ростов-на-Дону',
    lat: 47.2357,
    lon: 39.7015,
    tz: 'Europe/Moscow',
    pr: 'в Ростове-на-Дону',
    alt: ['ростов']
  },
  {
    n: 'Уфа',
    lat: 54.7388,
    lon: 55.9721,
    tz: 'Asia/Yekaterinburg',
    pr: 'в Уфе',
    alt: []
  },
  {
    n: 'Красноярск',
    lat: 56.0153,
    lon: 92.8932,
    tz: 'Asia/Krasnoyarsk',
    pr: 'в Красноярске',
    alt: []
  },
  { n: 'Воронеж', lat: 51.672, lon: 39.1843, tz: 'Europe/Moscow', pr: 'в Воронеже', alt: [] },
  {
    n: 'Пермь',
    lat: 58.0105,
    lon: 56.2502,
    tz: 'Asia/Yekaterinburg',
    pr: 'в Перми',
    alt: []
  },
  {
    n: 'Волгоград',
    lat: 48.708,
    lon: 44.5133,
    tz: 'Europe/Volgograd',
    pr: 'в Волгограде',
    alt: []
  },
  {
    n: 'Краснодар',
    lat: 45.0355,
    lon: 38.9753,
    tz: 'Europe/Moscow',
    pr: 'в Краснодаре',
    alt: []
  },
  {
    n: 'Саратов',
    lat: 51.5336,
    lon: 46.0343,
    tz: 'Europe/Saratov',
    pr: 'в Саратове',
    alt: []
  },
  {
    n: 'Тюмень',
    lat: 57.1522,
    lon: 65.5272,
    tz: 'Asia/Yekaterinburg',
    pr: 'в Тюмени',
    alt: []
  },
  {
    n: 'Тольятти',
    lat: 53.5303,
    lon: 49.3461,
    tz: 'Europe/Samara',
    pr: 'в Тольятти',
    alt: []
  },
  {
    n: 'Ижевск',
    lat: 56.8527,
    lon: 53.2115,
    tz: 'Europe/Samara',
    pr: 'в Ижевске',
    alt: []
  },
  {
    n: 'Барнаул',
    lat: 53.3606,
    lon: 83.7636,
    tz: 'Asia/Barnaul',
    pr: 'в Барнауле',
    alt: []
  },
  {
    n: 'Иркутск',
    lat: 52.287,
    lon: 104.305,
    tz: 'Asia/Irkutsk',
    pr: 'в Иркутске',
    alt: []
  },
  {
    n: 'Хабаровск',
    lat: 48.4827,
    lon: 135.0838,
    tz: 'Asia/Vladivostok',
    pr: 'в Хабаровске',
    alt: []
  },
  {
    n: 'Владивосток',
    lat: 43.1156,
    lon: 131.8855,
    tz: 'Asia/Vladivostok',
    pr: 'во Владивостоке',
    alt: ['влад']
  },
  {
    n: 'Ярославль',
    lat: 57.6261,
    lon: 39.8845,
    tz: 'Europe/Moscow',
    pr: 'в Ярославле',
    alt: []
  },
  {
    n: 'Томск',
    lat: 56.4846,
    lon: 84.9476,
    tz: 'Asia/Tomsk',
    pr: 'в Томске',
    alt: []
  },
  {
    n: 'Оренбург',
    lat: 51.7727,
    lon: 55.0988,
    tz: 'Asia/Yekaterinburg',
    pr: 'в Оренбурге',
    alt: []
  },
  {
    n: 'Кемерово',
    lat: 55.3547,
    lon: 86.0873,
    tz: 'Asia/Novokuznetsk',
    pr: 'в Кемерово',
    alt: []
  },
  { n: 'Сочи', lat: 43.5855, lon: 39.7231, tz: 'Europe/Moscow', pr: 'в Сочи', alt: [] },
  {
    n: 'Калининград',
    lat: 54.7104,
    lon: 20.4522,
    tz: 'Europe/Kaliningrad',
    pr: 'в Калининграде',
    alt: []
  },
  {
    n: 'Мурманск',
    lat: 68.9585,
    lon: 33.0827,
    tz: 'Europe/Moscow',
    pr: 'в Мурманске',
    alt: []
  },
  { n: 'Минск', lat: 53.9006, lon: 27.559, tz: 'Europe/Minsk', pr: 'в Минске', alt: [] },
  { n: 'Астана', lat: 51.1694, lon: 71.4491, tz: 'Asia/Almaty', pr: 'в Астане', alt: [] },
  { n: 'Лондон', lat: 51.5074, lon: -0.1278, tz: 'Europe/London', pr: 'в Лондоне', alt: [] },
  { n: 'Париж', lat: 48.8566, lon: 2.3522, tz: 'Europe/Paris', pr: 'в Париже', alt: [] },
  { n: 'Берлин', lat: 52.52, lon: 13.405, tz: 'Europe/Berlin', pr: 'в Берлине', alt: [] },
  {
    n: 'Нью-Йорк',
    lat: 40.7128,
    lon: -74.006,
    tz: 'America/New_York',
    pr: 'в Нью-Йорке',
    alt: []
  },
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
  return norm(s).split(' ').map(stem).join(' ');
}

const CITY_INDEX = {};

for (const c of CITY_TABLE) {
  CITY_INDEX[stemPhrase(c.n)] = c;

  for (const a of c.alt) {
    CITY_INDEX[stemPhrase(a)] = c;
  }
}

const HOME = CITY_INDEX[stemPhrase(DEFAULT_CITY)];

// ---------- кэши ----------
const GEO_CACHE = {};
const WEATHER_CACHE = {};
const RATE_CACHE = {};
const ORS_GEO_CACHE = {};
const ROUTE_CACHE = {};

const WEATHER_TTL = 10 * 60 * 1000;
const RATE_TTL = 30 * 60 * 1000;
const ORS_GEO_TTL = 7 * 24 * 60 * 60 * 1000;
const ROUTE_TTL = 24 * 60 * 60 * 1000;

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

  if (CITY_INDEX[key]) {
    return CITY_INDEX[key];
  }

  return await geoLookup(rawName);
}

function cityFromTokens(tokens) {
  for (let i = 0; i < tokens.length; i++) {
    for (let len = 3; len >= 1; len--) {
      if (i + len > tokens.length) {
        continue;
      }

      const key = tokens
        .slice(i, i + len)
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
async function weatherByLoc(loc) {
  const key = loc.n;

  if (fresh(WEATHER_CACHE[key], WEATHER_TTL)) {
    return WEATHER_CACHE[key].data;
  }

  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lon}` +
        '&current=temperature_2m,apparent_temperature,wind_speed_10m,weather_code' +
        '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max' +
        '&timezone=auto&forecast_days=2'
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

// ---------- время ----------
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

// ---------- курсы ----------
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

// ---------- маршруты OpenRouteService ----------
const ORS_BASE = 'https://api.heigit.org';
const ORS_TIMEOUT = 2200;

const ORS_ATTRIBUTION =
  '\n\n© openrouteservice.org by HeiGIT | Map data © OpenStreetMap contributors';

let HOME_POINT = null;

const DESTINATION_ALIASES = {
  [stemPhrase('Пулково')]:
    'Аэропорт Пулково, Санкт-Петербург, Россия',

  [stemPhrase('Эрмитаж')]:
    'Государственный Эрмитаж, Дворцовая площадь, Санкт-Петербург, Россия',

  [stemPhrase('Московский вокзал')]:
    'Московский вокзал, Санкт-Петербург, Россия',

  [stemPhrase('Ладожский вокзал')]:
    'Ладожский вокзал, Санкт-Петербург, Россия',

  [stemPhrase('Финляндский вокзал')]:
    'Финляндский вокзал, Санкт-Петербург, Россия',

  [stemPhrase('Лахта Центр')]:
    'Лахта Центр, Санкт-Петербург, Россия'
};

async function fetchWithTimeout(
  url,
  options = {},
  timeoutMs = ORS_TIMEOUT
) {
  const controller = new AbortController();

  const timer = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal
    });
  } finally {
    clearTimeout(timer);
  }
}

function destinationForSearch(destination) {
  const key = stemPhrase(destination);

  return DESTINATION_ALIASES[key] || destination;
}

async function orsGeocode(text, useFocus = true) {
  if (!ORS_KEY) {
    throw new Error('Не задан ORS_KEY');
  }

  const searchText = destinationForSearch(text);
  const cacheKey = `${useFocus ? 'focus' : 'home'}:${norm(searchText)}`;

  if (fresh(ORS_GEO_CACHE[cacheKey], ORS_GEO_TTL)) {
    return ORS_GEO_CACHE[cacheKey].data;
  }

  const params = new URLSearchParams({
    text: searchText,
    size: '1',
    lang: 'ru'
  });

  if (useFocus) {
    params.set('focus.point.lon', String(HOME.lon));
    params.set('focus.point.lat', String(HOME.lat));
  }

  const res = await fetchWithTimeout(
    `${ORS_BASE}/pelias/v1/search?${params.toString()}`,
    {
      headers: {
        Authorization: ORS_KEY,
        Accept: 'application/geo+json'
      }
    }
  );

  const data = await res.json();

  if (!res.ok) {
    throw new Error(
      `ORS GEO ${res.status}: ${JSON.stringify(data).slice(0, 160)}`
    );
  }

  const feature = data.features && data.features[0];

  const coordinates =
    feature &&
    feature.geometry &&
    feature.geometry.coordinates;

  if (!coordinates || coordinates.length < 2) {
    return null;
  }

  const point = {
    lon: coordinates[0],
    lat: coordinates[1],
    label:
      (feature.properties &&
        (feature.properties.label || feature.properties.name)) ||
      searchText
  };

  ORS_GEO_CACHE[cacheKey] = {
    data: point,
    ts: Date.now()
  };

  return point;
}

async function getHomePoint() {
  if (HOME_POINT) {
    return HOME_POINT;
  }

  if (!HOME_ADDRESS) {
    throw new Error('Не задан HOME_ADDRESS');
  }

  HOME_POINT = await orsGeocode(HOME_ADDRESS, false);

  if (!HOME_POINT) {
    throw new Error('Домашний адрес не найден');
  }

  console.log('ORS HOME: координаты получены');

  return HOME_POINT;
}

async function orsRoute(start, end, profile) {
  const cacheKey = [
    profile,
    start.lon.toFixed(5),
    start.lat.toFixed(5),
    end.lon.toFixed(5),
    end.lat.toFixed(5)
  ].join(':');

  if (fresh(ROUTE_CACHE[cacheKey], ROUTE_TTL)) {
    return ROUTE_CACHE[cacheKey].data;
  }

  const res = await fetchWithTimeout(
    `${ORS_BASE}/openrouteservice/v2/directions/${profile}/json`,
    {
      method: 'POST',
      headers: {
        Authorization: ORS_KEY,
        Accept: 'application/json',
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: JSON.stringify({
        coordinates: [
          [start.lon, start.lat],
          [end.lon, end.lat]
        ],
        instructions: false
      })
    }
  );

  const data = await res.json();

  if (!res.ok) {
    throw new Error(
      `ORS ROUTE ${profile} ${res.status}: ${JSON.stringify(data).slice(0, 180)}`
    );
  }

  const summary =
    data.routes &&
    data.routes[0] &&
    data.routes[0].summary;

  if (!summary) {
    return null;
  }

  const result = {
    duration: summary.duration,
    distance: summary.distance
  };

  ROUTE_CACHE[cacheKey] = {
    data: result,
    ts: Date.now()
  };

  return result;
}

async function getRoute({
  destination,
  mode = 'both'
}) {
  const place = (destination || '').trim();

  if (!place) {
    return {
      error: 'Не указано место назначения'
    };
  }

  if (!ORS_KEY || !HOME_ADDRESS) {
    return {
      error: 'Маршруты ещё не настроены'
    };
  }

  try {
    const [home, target] = await Promise.all([
      getHomePoint(),
      orsGeocode(place, true)
    ]);

    if (!target) {
      return {
        error: 'Не удалось найти это место'
      };
    }

    console.log(
      'ORS DESTINATION:',
      place,
      '→',
      target.label
    );

    let car = null;
    let walk = null;

    if (mode === 'car') {
      car = await orsRoute(
        home,
        target,
        'driving-car'
      );
    } else if (mode === 'walk') {
      walk = await orsRoute(
        home,
        target,
        'foot-walking'
      );
    } else {
      [car, walk] = await Promise.all([
        orsRoute(
          home,
          target,
          'driving-car'
        ).catch((e) => {
          console.error(
            'ORS CAR ERROR:',
            e.message
          );

          return null;
        }),

        orsRoute(
          home,
          target,
          'foot-walking'
        ).catch((e) => {
          console.error(
            'ORS WALK ERROR:',
            e.message
          );

          return null;
        })
      ]);
    }

    if (!car && !walk) {
      return {
        error: 'Не удалось построить маршрут'
      };
    }

    return {
      destination: place,
      resolved: target.label,
      mode,
      car,
      walk
    };
  } catch (e) {
    console.error('ORS ERROR:', e.message);

    return {
      error: 'Не удалось построить маршрут'
    };
  }
}

// ---------- поиск в интернете ----------
async function webSearch({ query }) {
  try {
    const res = await fetch(
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

// ---------- инструменты ----------
const TOOL_IMPL = {
  get_weather: getWeather,
  get_time: getTime,
  get_rate: getRate,
  get_route: getRoute,
  web_search: webSearch
};

// ---------- шаблоны ответов ----------
function plural(n, one, few, many) {
  const n10 = n % 10;
  const n100 = n % 100;

  if (n10 === 1 && n100 !== 11) {
    return one;
  }

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

  if (rounded > 0) {
    return 'плюс ' + rounded;
  }

  if (rounded < 0) {
    return 'минус ' + Math.abs(rounded);
  }

  return 'ноль';
}

function where(d) {
  if (!d.city || d.city === DEFAULT_CITY) {
    return '';
  }

  return (d.pr || 'в городе ' + d.city) + ' ';
}

function precipWord(maxTemp) {
  return maxTemp <= 0 ? 'снег' : 'дождь';
}

function fmtWeather(d) {
  let text =
    `${where(d)}сейчас ${describe(d.code)}, ${sign(d.temp)}`;

  if (
    Math.abs(d.temp - d.feels_like) >= 3
  ) {
    text +=
      `, ощущается как ${sign(d.feels_like)}`;
  }

  text +=
    `. Днём до ${sign(d.max_today)}.`;

  if (d.rain_chance > 70) {
    text +=
      ` Скорее всего будет ${precipWord(d.max_today)}.`;
  }

  if (d.wind >= 30) {
    text += ' И сильный ветер.';
  }

  return cap(text);
}

function fmtWeatherTomorrow(d) {
  const tomorrow = d.tomorrow;

  let text =
    `${where(d)}завтра ${describe(tomorrow.code)}, ` +
    `от ${sign(tomorrow.min)} до ${sign(tomorrow.max)}.`;

  if (tomorrow.rain_chance > 70) {
    text +=
      ` Скорее всего будет ${precipWord(tomorrow.max)}.`;
  }

  return cap(text);
}

function fmtTime(d) {
  const hours =
    `${d.hour} ${plural(d.hour, 'час', 'часа', 'часов')}`;

  if (d.minute === 0) {
    return cap(
      `${where(d)}сейчас ровно ${hours}.`
    );
  }

  const minutes =
    `${d.minute} ${plural(d.minute, 'минута', 'минуты', 'минут')}`;

  return cap(
    `${where(d)}сейчас ${hours} ${minutes}.`
  );
}

function fmtDate(d) {
  return cap(
    `${where(d)}сегодня ${d.date}.`
  );
}

function fmtRate(d) {
  if (d.usd) {
    return (
      `${d.currency} стоит около ${Math.round(d.usd)} долларов, ` +
      `это примерно ${Math.round(d.rub)} рублей.`
    );
  }

  return (
    `Курс ${d.currency} — ${d.rub} рублей ` +
    `по данным ЦБ на ${d.date}.`
  );
}

function fmtDuration(seconds) {
  const totalMinutes = Math.max(
    1,
    Math.round(seconds / 60)
  );

  const hours = Math.floor(
    totalMinutes / 60
  );

  const minutes = totalMinutes % 60;

  if (!hours) {
    return (
      `${totalMinutes} ` +
      plural(
        totalMinutes,
        'минута',
        'минуты',
        'минут'
      )
    );
  }

  const hoursText =
    `${hours} ${plural(hours, 'час', 'часа', 'часов')}`;

  if (!minutes) {
    return hoursText;
  }

  const minutesText =
    `${minutes} ${plural(minutes, 'минута', 'минуты', 'минут')}`;

  return `${hoursText} ${minutesText}`;
}

function fmtDistance(meters) {
  if (meters < 1000) {
    const rounded = Math.max(
      50,
      Math.round(meters / 50) * 50
    );

    return (
      `${rounded} ` +
      plural(
        rounded,
        'метр',
        'метра',
        'метров'
      )
    );
  }

  const km = Math.max(
    1,
    Math.round(meters / 1000)
  );

  return (
    `${km} ` +
    plural(
      km,
      'километр',
      'километра',
      'километров'
    )
  );
}

function fmtRoute(d) {
  const place = cap(
    d.destination || 'места назначения'
  );

  if (d.car && !d.walk) {
    return (
      `До ${place} на машине примерно ${fmtDuration(d.car.duration)}, ` +
      `расстояние ${fmtDistance(d.car.distance)}. ` +
      `Время указано без учёта пробок.` +
      ORS_ATTRIBUTION
    );
  }

  if (d.walk && !d.car) {
    return (
      `До ${place} пешком примерно ${fmtDuration(d.walk.duration)}, ` +
      `расстояние ${fmtDistance(d.walk.distance)}.` +
      ORS_ATTRIBUTION
    );
  }

  if (d.car && d.walk) {
    return (
      `До ${place} на машине примерно ${fmtDuration(d.car.duration)}, ` +
      `без учёта пробок. ` +
      `Пешком — примерно ${fmtDuration(d.walk.duration)}.` +
      ORS_ATTRIBUTION
    );
  }

  return 'Не удалось построить маршрут.';
}

const FAST_FMT = {
  get_weather: fmtWeather,
  get_time: fmtTime,
  get_rate: fmtRate,
  get_route: fmtRoute
};

// ---------- пре-роутер ----------
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

const TOMORROW_RE =
  /(^| )завтр/;

const RATE_RE =
  /(курс|скольк сто|почем доллар|почем евр|почем биткоин)/;

const RATE_BLOCK_RE =
  /(вчер|был|будет|прогноз|почем упа|почем рос|через|прошл|динамик)/;

const ROUTE_RE =
  /(маршрут|как .*?(добрат|доехат|дойт)|скольк .*?(ехат|идт|добират|дорог)|что быстр|на машин.* до|пешк.* до)/;

const ROUTE_FOLLOWUP_RE =
  /^(а )?(есл )?(пешк|на машин|на авт|автомобил|что быстр|сравн)$/;

function routeModeFrom(plain) {
  const wantsWalk =
    /(пешком|идти|дойти|пройти|ходьб)/.test(plain);

  const wantsCar =
    /(на машин|на авто|автомобил|ехать|доехать)/.test(plain);

  if (wantsWalk && !wantsCar) {
    return 'walk';
  }

  if (wantsCar && !wantsWalk) {
    return 'car';
  }

  return 'both';
}

function extractRouteDestination(rawText) {
  const plain = norm(rawText);

  let destination = '';

  const afterTo =
    plain.match(/(?:^| )до (.+)$/);

  if (afterTo) {
    destination = afterTo[1];
  }

  if (!destination) {
    const afterVerb = plain.match(
      /(?:добраться|доехать|дойти|ехать|идти)\s+(?:в|к|на)\s+(.+)$/
    );

    if (afterVerb) {
      destination = afterVerb[1];
    }
  }

  if (!destination) {
    const afterRoute = plain.match(
      /маршрут(?: до)?\s+(.+)$/
    );

    if (afterRoute) {
      destination = afterRoute[1];
    }
  }

  destination = destination
    .replace(
      /\s+(?:на машине|на авто|на автомобиле|автомобилем|пешком).*$/,
      ''
    )
    .replace(
      /\s+(?:машина|автомобиль)\s+или\s+пешком.*$/,
      ''
    )
    .replace(
      /\s+(?:пешком)\s+или\s+(?:на машине|на авто).*$/,
      ''
    )
    .replace(
      /\s+(?:от дома|из дома|по времени|сейчас)$/,
      ''
    )
    .trim();

  return destination;
}

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
  for (const [regexp, currency] of CURRENCY_MAP) {
    if (regexp.test(stemmed)) {
      return currency;
    }
  }

  return null;
}

async function preRoute(
  rawText,
  nluTokens,
  ctx
) {
  const plain = norm(rawText);

  if (!plain || plain.length > 140) {
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

  const cityHere =
    cityFromTokens(tokens);

  // Повтори
  if (
    REPEAT_RE.test(stemmed) &&
    ctx.last
  ) {
    console.log('PRE: repeat');

    return {
      answer: ctx.last,
      intent: ctx.intent,
      city: ctx.city,
      destination: ctx.destination
    };
  }

  // Маршрут от сохранённого домашнего адреса
  if (ROUTE_RE.test(stemmed)) {
    const destination =
      extractRouteDestination(rawText);

    if (destination) {
      const routeMode =
        routeModeFrom(plain);

      const route = await getRoute({
        destination,
        mode: routeMode
      });

      console.log(
        'PRE: route',
        routeMode,
        destination
      );

      return {
        answer: route.error
          ? 'Не удалось построить маршрут. Попробуй назвать место точнее.'
          : fmtRoute(route),
        intent: `route_${routeMode}`,
        city: null,
        destination
      };
    }
  }

  // Уточнение после маршрута
  if (
    ctx.destination &&
    ctx.intent &&
    ctx.intent.startsWith('route_') &&
    ROUTE_FOLLOWUP_RE.test(stemmed)
  ) {
    const routeMode =
      routeModeFrom(plain);

    const route = await getRoute({
      destination: ctx.destination,
      mode: routeMode
    });

    console.log(
      'PRE: route follow-up',
      routeMode,
      ctx.destination
    );

    return {
      answer: route.error
        ? 'Не удалось построить маршрут.'
        : fmtRoute(route),
      intent: `route_${routeMode}`,
      city: null,
      destination: ctx.destination
    };
  }

  // Время
  if (
    TIME_RE.test(stemmed) &&
    !TIME_BLOCK_RE.test(stemmed)
  ) {
    const loc = cityHere || HOME;

    console.log(
      'PRE: time',
      loc.n
    );

    return {
      answer: fmtTime(timeByLoc(loc)),
      intent: 'time',
      city: loc.n
    };
  }

  // Дата
  if (
    DATE_RE.test(stemmed) &&
    !TIME_BLOCK_RE.test(stemmed)
  ) {
    const loc = cityHere || HOME;

    console.log(
      'PRE: date',
      loc.n
    );

    return {
      answer: fmtDate(timeByLoc(loc)),
      intent: 'date',
      city: loc.n
    };
  }

  // Погода
  if (
    WEATHER_RE.test(stemmed) &&
    !WEATHER_BLOCK_RE.test(stemmed)
  ) {
    const loc =
      cityHere ||
      (
        ctx.city
          ? CITY_INDEX[stemPhrase(ctx.city)]
          : null
      ) ||
      HOME;

    const weather =
      await weatherByLoc(loc);

    if (!weather.error) {
      const tomorrow =
        TOMORROW_RE.test(stemmed);

      console.log(
        'PRE: weather',
        loc.n,
        tomorrow ? 'завтра' : 'сегодня'
      );

      return {
        answer: tomorrow
          ? fmtWeatherTomorrow(weather)
          : fmtWeather(weather),
        intent: tomorrow
          ? 'weather_tomorrow'
          : 'weather',
        city: loc.n
      };
    }
  }

  // Курсы
  if (
    RATE_RE.test(stemmed) &&
    !RATE_BLOCK_RE.test(stemmed)
  ) {
    const code =
      currencyFrom(stemmed);

    if (code) {
      const rate = await getRate({
        code
      });

      if (!rate.error) {
        console.log(
          'PRE: rate',
          code
        );

        return {
          answer: fmtRate(rate),
          intent: 'rate',
          city: ctx.city
        };
      }
    }
  }

  // Уточнение города
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

      const time =
        timeByLoc(cityHere);

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
      const weather =
        await weatherByLoc(cityHere);

      if (!weather.error) {
        console.log(
          'PRE: follow-up',
          ctx.intent,
          cityHere.n
        );

        return {
          answer:
            ctx.intent === 'weather_tomorrow'
              ? fmtWeatherTomorrow(weather)
              : fmtWeather(weather),
          intent: ctx.intent,
          city: cityHere.n
        };
      }
    }
  }

  return null;
}

// ---------- Gemini ----------
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
  'ВАЖНО: никогда не называй цифры, курсы, цены и статистику по памяти — только из результатов инструментов. ' +
  'Для курсов валют и криптовалют вызывай get_rate. ' +
  'Для маршрутов до мест вызывай get_route: начало всегда от сохранённого домашнего адреса. ' +
  'Для новостей, цен, событий и свежих фактов вызывай web_search. ' +
  'Названия технологий пиши так, как их произносят разработчики: Flask — флэск, Django — джанго, SQL — эс-ку-эль, FastAPI — фаст эй пи ай. Не переводи названия на русский. ' +
  'При вычислениях с дробями посчитай по шагам про себя и проверь порядок величины обратным умножением, вслух скажи только результат. ' +
  'Если инструмент вернул ошибку — честно скажи, что не смог узнать, но не выдумывай данные.';

const TOOLS = [
  {
    functionDeclarations: [
      {
        name: 'get_weather',
        description:
          'Актуальная погода в городе.',
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
        name: 'get_route',
        description:
          'Маршрут от сохранённого домашнего адреса до указанного места. Поддерживает машину и пеший маршрут.',
        parameters: {
          type: 'OBJECT',
          properties: {
            destination: {
              type: 'STRING',
              description:
                'Место назначения или адрес, например "Пулково" или "Московский вокзал".'
            },
            mode: {
              type: 'STRING',
              description:
                'Режим: car — машина, walk — пешком, both — сравнить оба. Если режим неясен, используй both.'
            }
          },
          required: ['destination']
        }
      },
      {
        name: 'web_search',
        description:
          'Поиск в интернете: новости, события, цены товаров, факты о компаниях, спорт и всё, что могло измениться.',
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

async function callGemini(
  contents,
  mode
) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${mode.model}:generateContent?key=${GEMINI_KEY}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents,
        tools: TOOLS,
        systemInstruction: {
          parts: [
            {
              text: SYSTEM_PROMPT
            }
          ]
        },
        generationConfig: {
          maxOutputTokens: mode.tokens,
          temperature: 0.9
        }
      })
    }
  );

  const data = await res.json();

  console.log(
    'GEMINI:',
    mode.model,
    JSON.stringify(data).slice(0, 400)
  );

  if (data.error) {
    throw new Error(
      'API error: ' +
        JSON.stringify(data.error).slice(0, 200)
    );
  }

  if (
    !data.candidates ||
    !data.candidates.length
  ) {
    throw new Error('Нет candidates');
  }

  return data.candidates[0].content;
}

function textFrom(content) {
  return (content.parts || [])
    .map((part) => part.text || '')
    .join(' ')
    .trim();
}

async function askAI(
  contents,
  mode
) {
  let history = [...contents];

  for (
    let round = 0;
    round < 2;
    round++
  ) {
    const content =
      await callGemini(history, mode);

    history.push(content);

    const calls = (
      content.parts || []
    ).filter((part) => part.functionCall);

    if (!calls.length) {
      return {
        answer: textFrom(content),
        history
      };
    }

    const responses =
      await Promise.all(
        calls.map(async (part) => {
          const {
            name,
            args
          } = part.functionCall;

          const fn = TOOL_IMPL[name];

          console.log(
            'TOOL:',
            name,
            JSON.stringify(args)
          );

          let result;

          try {
            result = fn
              ? await fn(args || {})
              : {
                  error: 'Неизвестный инструмент'
                };
          } catch (e) {
            console.error(
              'TOOL ERROR:',
              e.message
            );

            result = {
              error: 'Ошибка выполнения'
            };
          }

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
      const response = responses[0];
      const formatter =
        FAST_FMT[response.name];

      if (
        formatter &&
        !response.result.error
      ) {
        console.log(
          'FAST PATH:',
          response.name
        );

        history.push({
          role: 'user',
          parts: [
            {
              functionResponse:
                response.functionResponse
            }
          ]
        });

        return {
          answer: formatter(response.result),
          history
        };
      }
    }

    history.push({
      role: 'user',
      parts: responses.map((response) => ({
        functionResponse:
          response.functionResponse
      }))
    });
  }

  const final =
    await callGemini(history, mode);

  return {
    answer:
      textFrom(final) ||
      'Не смог разобраться.',
    history
  };
}

// ---------- прогрев ----------
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
      }),

      ORS_KEY && HOME_ADDRESS
        ? getHomePoint()
        : Promise.resolve(null)
    ]);

    console.log('WARMUP done');
  } catch (e) {
    console.error(
      'WARMUP ERROR:',
      e.message
    );
  }
}

// ---------- обработчик Алисы ----------
module.exports = async function handler(
  req,
  res
) {
  if (req.method === 'GET') {
    warmup();

    return res
      .status(200)
      .send('ok');
  }

  if (req.method !== 'POST') {
    return res
      .status(405)
      .send('Method not allowed');
  }

  const body = req.body;

  const sessionId =
    body.session.session_id;

  const userText =
    body.request.command || '';

  const nluTokens =
    (
      body.request.nlu &&
      body.request.nlu.tokens
    ) ||
    [];

  const isNew =
    body.session.new;

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

  if (
    sessions[sessionId].length > 10
  ) {
    sessions[sessionId] =
      sessions[sessionId].slice(-10);
  }

  sessions[sessionId].push({
    role: 'user',
    parts: [
      {
        text: userText
      }
    ]
  });

  const ctx =
    ctxStore[sessionId];

  // Пре-роутер
  try {
    const quick =
      await preRoute(
        userText,
        nluTokens,
        ctx
      );

    if (quick) {
      ctx.intent =
        quick.intent;

      ctx.city =
        quick.city;

      ctx.destination =
        quick.destination || null;

      ctx.last =
        quick.answer;

      sessions[sessionId].push({
        role: 'model',
        parts: [
          {
            text: quick.answer
          }
        ]
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
  ctx.destination = null;
  ctx.last = answer;

  return res
    .status(200)
    .json(
      respond(answer, body)
    );
};

function respond(text, body) {
  const spokenText =
    text.replace(
      ORS_ATTRIBUTION,
      ''
    );

  const tts =
    spokenText.replace(
      /\. /g,
      '. sil <[300]> '
    );

  return {
    response: {
      text,
      tts,
      end_session: false
    },
    session: body.session,
    version: body.version
  };
}
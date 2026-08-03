const sessions = {};

const AITUNNEL_KEY = process.env.AITUNNEL_KEY;
const TAVILY_KEY = process.env.TAVILY_KEY;

// словарь сокращений и разговорных названий
const CITY_ALIASES = {
  'мск': 'Москва',
  'москва': 'Москва',
  'спб': 'Санкт-Петербург',
  'питер': 'Санкт-Петербург',
  'петербург': 'Санкт-Петербург',
  'нск': 'Новосибирск',
  'екб': 'Екатеринбург',
  'нн': 'Нижний Новгород',
  'кзн': 'Казань',
  'ростов': 'Ростов-на-Дону',
  'сочи': 'Сочи',
  'тюмень': 'Тюмень',
  'краснодар': 'Краснодар',
  'самара': 'Самара',
  'уфа': 'Уфа',
  'пермь': 'Пермь',
  'омск': 'Омск',
  'челябинск': 'Челябинск',
  'волгоград': 'Волгоград',
  'воронеж': 'Воронеж',
  'владивосток': 'Владивосток',
  'калининград': 'Калининград',
  'минск': 'Минск',
  'киев': 'Киев',
  'алматы': 'Алматы',
  'астана': 'Астана',
  'ташкент': 'Ташкент',
  'тбилиси': 'Тбилиси',
  'ереван': 'Ереван',
  'баку': 'Баку',
  'дубай': 'Дубай',
  'нью-йорк': 'Нью-Йорк',
  'лондон': 'Лондон',
  'париж': 'Париж',
  'берлин': 'Берлин',
  'токио': 'Токио',
  'пекин': 'Пекин'
};

const DEFAULT_CITY = 'Санкт-Петербург';

// служебные слова, которые точно не город
const STOP_WORDS = new Set([
  'какая', 'какой', 'сейчас', 'сегодня', 'завтра', 'вчера', 'погода', 'погоду',
  'погоде', 'время', 'часов', 'час', 'который', 'сколько', 'там', 'тут', 'здесь',
  'это', 'мне', 'меня', 'тебе', 'нас', 'вас', 'them', 'днем', 'днём', 'ночью',
  'утром', 'вечером', 'будет', 'было', 'температура', 'градусов', 'интернете',
  'сети', 'новости', 'новостях'
]);

async function askAI(history) {
  const res = await fetch('https://api.aitunnel.ru/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${AITUNNEL_KEY}`
    },
    body: JSON.stringify({
      model: 'openai/gpt-5.6-luna',
      max_tokens: 300,
      messages: history
    })
  });
  const data = await res.json();
  console.log('AITUNNEL RESPONSE:', JSON.stringify(data));
  return data.choices[0].message.content;
}

async function findCity(rawName) {
  const lower = rawName.toLowerCase().trim();

  // сначала проверяем словарь
  if (CITY_ALIASES[lower]) {
    return await geoLookup(CITY_ALIASES[lower]);
  }

  // потом пробуем варианты с падежами
  const base1 = rawName.slice(0, -1);
  const base2 = rawName.slice(0, -2);

  const candidates = [
    rawName,
    base1 + 'а',
    base1 + 'я',
    base1,
    base2 + 'а',
    base2 + 'я',
    base2 + 'ь',
    base2
  ];

  for (const candidate of candidates) {
    if (!candidate || candidate.length < 3) continue;
    const result = await geoLookup(candidate);
    if (result) return result;
  }
  return null;
}

async function geoLookup(name) {
  try {
    const geoRes = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=1&language=ru`
    );
    const geoData = await geoRes.json();
    console.log('GEO TRY:', name, geoData.results ? 'FOUND' : 'not found');
    if (geoData.results && geoData.results.length) {
      return geoData.results[0];
    }
  } catch (e) {
    console.error('GEO ERROR:', e.message);
  }
  return null;
}

function extractCity(text) {
  const cleaned = text.toLowerCase().replace(/[.,!?;:]/g, '');
  const words = cleaned.split(/\s+/);

  // 1. ищем прямое совпадение со словарём в любом месте фразы
  for (const word of words) {
    if (CITY_ALIASES[word]) return CITY_ALIASES[word];
  }

  // 2. ищем конструкцию "в [город]"
  const prepMatch = cleaned.match(/\bв\s+([а-яё][а-яё\-]{2,})/);
  if (prepMatch && !STOP_WORDS.has(prepMatch[1])) {
    return prepMatch[1];
  }

  // 3. берём последнее "значимое" слово (не служебное, не короткое)
  for (let i = words.length - 1; i >= 0; i--) {
    const w = words[i];
    if (w.length >= 3 && !STOP_WORDS.has(w) && /^[а-яё\-]+$/.test(w)) {
      return w;
    }
  }

  return DEFAULT_CITY;
}

async function getWeather(city) {
  try {
    const location = await findCity(city);
    if (!location) return null;

    const { latitude, longitude, name, timezone } = location;

    const weatherRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m,relative_humidity_2m&daily=temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=1`
    );
    const weatherData = await weatherRes.json();

    return {
      city: name,
      temp: weatherData.current.temperature_2m,
      feels: weatherData.current.apparent_temperature,
      wind: weatherData.current.wind_speed_10m,
      humidity: weatherData.current.relative_humidity_2m,
      max: weatherData.daily ? weatherData.daily.temperature_2m_max[0] : null,
      min: weatherData.daily ? weatherData.daily.temperature_2m_min[0] : null,
      timezone
    };
  } catch (e) {
    console.error('WEATHER ERROR:', e.message);
    return null;
  }
}

async function getTime(city) {
  try {
    const location = await findCity(city);
    if (!location || !location.timezone) return null;

    const now = new Date().toLocaleString('ru-RU', {
      timeZone: location.timezone,
      hour: '2-digit',
      minute: '2-digit',
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });

    return { city: location.name, datetime: now };
  } catch (e) {
    console.error('TIME ERROR:', e.message);
    return null;
  }
}

async function webSearch(query) {
  try {
    const res = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: TAVILY_KEY,
        query,
        max_results: 3,
        search_depth: 'basic'
      })
    });
    const data = await res.json();
    console.log('SEARCH RESULT COUNT:', data.results ? data.results.length : 0);
    if (!data.results || !data.results.length) return null;
    return data.results.map((r) => `${r.title}: ${r.content}`).join('\n');
  } catch (e) {
    console.error('SEARCH ERROR:', e.message);
    return null;
  }
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method not allowed');
  }

  const body = req.body;
  const sessionId = body.session.session_id;
  const userText = body.request.command || '';
  const isNew = body.session.new;

  if (isNew || !sessions[sessionId]) {
    sessions[sessionId] = [
      {
        role: 'system',
        content:
          'Ты голосовой помощник. Отвечай кратко (до 200 символов), разговорным стилем, без мата и без обсуждения 18+ тем. Если тебе передали актуальные данные — используй именно их и никогда не говори, что у тебя нет доступа к информации.'
      }
    ];
  }

  if (isNew) {
    return res.status(200).json(respond('Привет! Спроси меня что-нибудь.', body));
  }

  let messageToSend = userText;

  const isWeather = /погод|температур|градус|дожд|снег|ветер|солнечно|облачно|тепло ли|холодно ли/i.test(userText);
  const isTime = /который час|сколько времени|время сейчас|какое время|сколько сейчас времени|какой сегодня день|какое сегодня число/i.test(userText);
  const isSearch = /новост|что нового|найди|поищи|погугли|актуальн|курс|стоимость|цена|кто такой|что такое|когда вышл|последн/i.test(userText);

  if (isWeather) {
    const city = extractCity(userText);
    const weather = await getWeather(city);
    if (weather) {
      messageToSend = `Вопрос пользователя: "${userText}"

АКТУАЛЬНЫЕ ДАННЫЕ О ПОГОДЕ (используй именно их):
Город: ${weather.city}
Сейчас: ${weather.temp}°C (ощущается как ${weather.feels}°C)
Ветер: ${weather.wind} м/с, влажность ${weather.humidity}%
Днём максимум: ${weather.max}°C, минимум: ${weather.min}°C`;
    }
  } else if (isTime) {
    const city = extractCity(userText);
    const time = await getTime(city);
    if (time) {
      messageToSend = `Вопрос пользователя: "${userText}"

АКТУАЛЬНОЕ ВРЕМЯ (используй именно его): в городе ${time.city} сейчас ${time.datetime}.`;
    }
  } else if (isSearch) {
    const searchResults = await webSearch(userText);
    if (searchResults) {
      messageToSend = `Вопрос пользователя: "${userText}"

РЕЗУЛЬТАТЫ ПОИСКА В ИНТЕРНЕТЕ (используй их для ответа):
${searchResults}`;
    }
  }

  sessions[sessionId].push({ role: 'user', content: messageToSend });

  let answer;
  try {
    answer = await askAI(sessions[sessionId]);
  } catch (e) {
    console.error('AI ERROR:', e.message);
    answer = 'Извини, что-то пошло не так, попробуй ещё раз.';
  }

  sessions[sessionId].push({ role: 'assistant', content: answer });

  return res.status(200).json(respond(answer, body));
};

function respond(text, body) {
  return {
    response: { text, end_session: false },
    session: body.session,
    version: body.version
  };
}
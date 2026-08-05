const sessions = {};

const GEMINI_KEY = process.env.GEMINI_KEY;
const TAVILY_KEY = process.env.TAVILY_KEY;

const MODEL_FAST = 'gemini-3.5-flash-lite';
const MODEL_SMART = 'gemini-3.5-flash';

const CITY_ALIASES = {
  'мск': 'Москва', 'москва': 'Москва',
  'спб': 'Санкт-Петербург', 'питер': 'Санкт-Петербург', 'петербург': 'Санкт-Петербург',
  'нск': 'Новосибирск', 'екб': 'Екатеринбург', 'нн': 'Нижний Новгород',
  'кзн': 'Казань', 'ростов': 'Ростов-на-Дону', 'влад': 'Владивосток'
};

// вопросы, требующие рассуждения → умная модель и больше токенов
const HARD_RE = /посчитай|сколько будет|сколько .{0,20}(можно|получится|выйдет)|почему|объясни|сравни|стоит ли|что выгоднее|в чём разница|в чем разница|как работает|придумай|расскажи про|что думаешь|как считаешь|убеди/i;

function pickMode(text) {
  const hard = HARD_RE.test(text) || text.length > 70;
  return hard
    ? { model: MODEL_SMART, tokens: 600 }
    : { model: MODEL_FAST, tokens: 300 };
}

const SYSTEM_PROMPT =
  'Ты голосовой ассистент в умной колонке. Тебя слушают, а не читают. ' +
  'Говори живо и по-человечески, 1-3 предложения. Начинай сразу с сути: никаких "Конечно", "Отличный вопрос", "Давайте разберёмся". ' +
  'Можно лёгкая ирония и своё мнение. Без списков, markdown, эмодзи и скобок — в речи это звучит мусором. Без мата и 18+ тем. ' +
  'ВАЖНО: никогда не называй цифры (курсы, цены, статистику) по памяти — только из результатов инструментов. ' +
  'Для курсов валют и криптовалют вызывай get_rate. Для новостей, цен, событий и свежих фактов вызывай web_search. ' +
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

async function geoLookup(name) {
  try {
    const res = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=1&language=ru`
    );
    const data = await res.json();
    if (data.results && data.results.length) return data.results[0];
  } catch (e) {
    console.error('GEO ERROR:', e.message);
  }
  return null;
}

async function findCity(rawName) {
  const lower = (rawName || '').toLowerCase().trim();
  const resolved = CITY_ALIASES[lower] || rawName;
  return await geoLookup(resolved);
}

async function getWeather({ city }) {
  const loc = await findCity(city);
  if (!loc) return { error: 'Город не найден' };

  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${loc.latitude}&longitude=${loc.longitude}&current=temperature_2m,apparent_temperature,wind_speed_10m,weather_code&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto&forecast_days=1`
    );
    const d = await res.json();
    return {
      city: loc.name,
      temp: d.current.temperature_2m,
      feels_like: d.current.apparent_temperature,
      wind: d.current.wind_speed_10m,
      max_today: d.daily.temperature_2m_max[0],
      min_today: d.daily.temperature_2m_min[0],
      rain_chance: d.daily.precipitation_probability_max[0]
    };
  } catch (e) {
    console.error('WEATHER ERROR:', e.message);
    return { error: 'Не удалось получить погоду' };
  }
}

async function getTime({ city }) {
  const loc = await findCity(city);
  if (!loc || !loc.timezone) return { error: 'Город не найден' };

  const now = new Date().toLocaleString('ru-RU', {
    timeZone: loc.timezone,
    hour: '2-digit',
    minute: '2-digit',
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });

  return { city: loc.name, current_time: now };
}

async function getRate({ code }) {
  const cur = (code || '').toUpperCase();
  const CRYPTO = { BTC: 'bitcoin', ETH: 'ethereum', TON: 'the-open-network', SOL: 'solana', DOGE: 'dogecoin' };

  try {
    if (CRYPTO[cur]) {
      const res = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${CRYPTO[cur]}&vs_currencies=usd,rub`
      );
      const d = await res.json();
      const p = d[CRYPTO[cur]];
      if (!p) return { error: 'Курс не найден' };
      return { currency: cur, usd: p.usd, rub: p.rub };
    }

    const res = await fetch(`https://www.cbr-xml-daily.ru/daily_json.js`);
    const d = await res.json();
    const v = d.Valute[cur];
    if (!v) return { error: 'Валюта не найдена' };
    return {
      currency: cur,
      rub: (v.Value / v.Nominal).toFixed(2),
      source: 'ЦБ РФ',
      date: d.Date.slice(0, 10)
    };
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
        max_results: 4,
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
        content: (r.content || '').slice(0, 600)
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
        return { functionResponse: { name, response: result } };
      })
    );

    history.push({ role: 'user', parts: responses });
  }

  const final = await callGemini(history, mode);
  return { answer: textFrom(final) || 'Не смог разобраться.', history };
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method not allowed');

  const body = req.body;
  const sessionId = body.session.session_id;
  const userText = body.request.command || '';
  const isNew = body.session.new;

  if (isNew || !sessions[sessionId]) sessions[sessionId] = [];

  if (isNew) {
    return res.status(200).json(respond('Привет! Спроси меня что-нибудь.', body));
  }

  if (sessions[sessionId].length > 10) {
    sessions[sessionId] = sessions[sessionId].slice(-10);
  }

  sessions[sessionId].push({ role: 'user', parts: [{ text: userText }] });

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
const sessions = {};

const GEMINI_KEY = process.env.GEMINI_KEY;
const MODEL = 'gemini-3.5-flash-lite';

const CITY_ALIASES = {
    'мск': 'Москва', 'москва': 'Москва',
    'спб': 'Санкт-Петербург', 'питер': 'Санкт-Петербург', 'петербург': 'Санкт-Петербург',
    'нск': 'Новосибирск', 'екб': 'Екатеринбург', 'нн': 'Нижний Новгород',
    'кзн': 'Казань', 'ростов': 'Ростов-на-Дону'
};

const SYSTEM_PROMPT =
    'Ты голосовой помощник в умной колонке. Отвечай ОЧЕНЬ кратко — 1-2 предложения, до 200 символов. Разговорный стиль, без мата и 18+ тем. У тебя есть инструменты для погоды и времени, а также поиск Google для актуальной информации. Никогда не говори, что у тебя нет доступа к данным — вызывай инструменты или ищи.';

// ---------- инструменты ----------
const TOOLS = [
    {
        functionDeclarations: [
            {
                name: 'get_weather',
                description: 'Актуальная погода в городе: температура, ветер, макс/мин за день.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        city: {
                            type: 'STRING',
                            description: 'Город в именительном падеже, например "Москва". Если не указан — "Санкт-Петербург".'
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
            }
        ]
    },
    { googleSearch: {} }
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
            `https://api.open-meteo.com/v1/forecast?latitude=${loc.latitude}&longitude=${loc.longitude}&current=temperature_2m,apparent_temperature,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=1`
        );
        const d = await res.json();
        return {
            city: loc.name,
            temp: d.current.temperature_2m,
            feels_like: d.current.apparent_temperature,
            wind: d.current.wind_speed_10m,
            max_today: d.daily.temperature_2m_max[0],
            min_today: d.daily.temperature_2m_min[0]
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

const TOOL_IMPL = {
    get_weather: getWeather,
    get_time: getTime
};

// ---------- вызов Gemini ----------
async function callGemini(contents) {
    const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_KEY}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents,
                tools: TOOLS,
                systemInstruction: {
                    parts: [{ text: SYSTEM_PROMPT }]
                },
                generationConfig: {
                    maxOutputTokens: 250,
                    temperature: 0.7
                }
            })
        }
    );
    const data = await res.json();
    console.log('GEMINI RESPONSE:', JSON.stringify(data).slice(0, 600));

    if (!data.candidates || !data.candidates.length) {
        throw new Error('Пустой ответ от модели');
    }
    return data.candidates[0].content;
}

async function askAI(contents) {
    let history = [...contents];

    for (let round = 0; round < 2; round++) {
        const content = await callGemini(history);
        history.push(content);

        const calls = (content.parts || []).filter((p) => p.functionCall);

        if (!calls.length) {
            const text = (content.parts || [])
                .map((p) => p.text || '')
                .join(' ')
                .trim();
            return { answer: text, history };
        }

        const responses = await Promise.all(
            calls.map(async (p) => {
                const { name, args } = p.functionCall;
                const fn = TOOL_IMPL[name];
                console.log('TOOL CALL:', name, JSON.stringify(args));
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

    const final = await callGemini(history);
    const text = (final.parts || []).map((p) => p.text || '').join(' ').trim();
    return { answer: text || 'Не смог разобраться.', history };
}

// ---------- обработчик Алисы ----------
module.exports = async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).send('Method not allowed');
    }

    const body = req.body;
    const sessionId = body.session.session_id;
    const userText = body.request.command || '';
    const isNew = body.session.new;

    if (isNew || !sessions[sessionId]) {
        sessions[sessionId] = [];
    }

    if (isNew) {
        return res.status(200).json(respond('Привет! Спроси меня что-нибудь.', body));
    }

    // держим только последние 10 сообщений
    if (sessions[sessionId].length > 10) {
        sessions[sessionId] = sessions[sessionId].slice(-10);
    }

    sessions[sessionId].push({ role: 'user', parts: [{ text: userText }] });

    let answer;
    try {
        const result = await askAI(sessions[sessionId]);
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
    return {
        response: { text, end_session: false },
        session: body.session,
        version: body.version
    };
}
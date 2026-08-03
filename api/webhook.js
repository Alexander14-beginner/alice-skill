const sessions = {};

const AITUNNEL_KEY = process.env.AITUNNEL_KEY;
const TAVILY_KEY = process.env.TAVILY_KEY;

const CITY_ALIASES = {
    'мск': 'Москва', 'москва': 'Москва',
    'спб': 'Санкт-Петербург', 'питер': 'Санкт-Петербург', 'петербург': 'Санкт-Петербург',
    'нск': 'Новосибирск', 'екб': 'Екатеринбург', 'нн': 'Нижний Новгород',
    'кзн': 'Казань', 'ростов': 'Ростов-на-Дону'
};

const TOOLS = [
    {
        type: 'function',
        function: {
            name: 'get_weather',
            description: 'Актуальная погода в городе. Для вопросов про погоду, температуру, дождь, ветер.',
            parameters: {
                type: 'object',
                properties: {
                    city: {
                        type: 'string',
                        description: 'Город в именительном падеже, например "Москва". Если не указан — "Санкт-Петербург".'
                    }
                },
                required: ['city']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'get_time',
            description: 'Текущее время и дата в городе.',
            parameters: {
                type: 'object',
                properties: {
                    city: {
                        type: 'string',
                        description: 'Город в именительном падеже. Если не указан — "Санкт-Петербург".'
                    }
                },
                required: ['city']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'web_search',
            description: 'Поиск актуальной информации в интернете: новости, курсы, цены, свежие события.',
            parameters: {
                type: 'object',
                properties: {
                    query: { type: 'string', description: 'Короткий поисковый запрос' }
                },
                required: ['query']
            }
        }
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

async function webSearch({ query }) {
    try {
        const res = await fetch('https://api.tavily.com/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                api_key: TAVILY_KEY,
                query,
                max_results: 2,
                search_depth: 'basic'
            })
        });
        const data = await res.json();
        if (!data.results || !data.results.length) return { error: 'Ничего не найдено' };
        return {
            results: data.results.map((r) => ({ title: r.title, content: r.content.slice(0, 400) }))
        };
    } catch (e) {
        console.error('SEARCH ERROR:', e.message);
        return { error: 'Поиск недоступен' };
    }
}

const TOOL_IMPL = {
    get_weather: getWeather,
    get_time: getTime,
    web_search: webSearch
};

async function callModel(messages) {
    const res = await fetch('https://api.aitunnel.ru/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${AITUNNEL_KEY}`
        },
        body: JSON.stringify({
            model: 'openai/gpt-5.6-luna',
            max_tokens: 250,
            messages,
            tools: TOOLS
        })
    });
    const data = await res.json();
    console.log('MODEL RESPONSE:', JSON.stringify(data).slice(0, 500));
    return data.choices[0].message;
}

async function askAI(history) {
    let messages = [...history];

    for (let round = 0; round < 2; round++) {
        const msg = await callModel(messages);
        messages.push(msg);

        if (!msg.tool_calls || !msg.tool_calls.length) {
            return { answer: msg.content, messages };
        }

        // все инструменты вызываем параллельно
        const results = await Promise.all(
            msg.tool_calls.map(async (call) => {
                const fn = TOOL_IMPL[call.function.name];
                try {
                    const args = JSON.parse(call.function.arguments || '{}');
                    console.log('TOOL CALL:', call.function.name, JSON.stringify(args));
                    const result = fn ? await fn(args) : { error: 'Неизвестный инструмент' };
                    return { id: call.id, result };
                } catch (e) {
                    console.error('TOOL ERROR:', e.message);
                    return { id: call.id, result: { error: 'Ошибка выполнения' } };
                }
            })
        );

        for (const r of results) {
            messages.push({
                role: 'tool',
                tool_call_id: r.id,
                content: JSON.stringify(r.result)
            });
        }
    }

    const final = await callModel(messages);
    return { answer: final.content || 'Не смог разобраться.', messages };
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
                    'Ты голосовой помощник в умной колонке. Отвечай ОЧЕНЬ кратко — 1-2 предложения, до 200 символов. Разговорный стиль, без мата и 18+ тем. Есть инструменты для погоды, времени и поиска — вызывай их когда нужны актуальные данные. Никогда не говори что у тебя нет доступа к информации.'
            }
        ];
    }

    if (isNew) {
        return res.status(200).json(respond('Привет! Спроси меня что-нибудь.', body));
    }

    // не даём истории разрастаться — держим системный промпт + последние 10 сообщений
    if (sessions[sessionId].length > 11) {
        sessions[sessionId] = [
            sessions[sessionId][0],
            ...sessions[sessionId].slice(-10)
        ];
    }

    sessions[sessionId].push({ role: 'user', content: userText });

    let answer;
    try {
        const result = await askAI(sessions[sessionId]);
        answer = result.answer || 'Не понял вопрос, попробуй ещё раз.';
        sessions[sessionId] = result.messages;
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
const sessions = {};

const AITUNNEL_KEY = process.env.AITUNNEL_KEY;
const TAVILY_KEY = process.env.TAVILY_KEY;

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
    const base1 = rawName.slice(0, -1);
    const base2 = rawName.slice(0, -2);

    const candidates = [
        rawName,
        base1 + 'а',
        base1 + 'я',
        base1,
        base2 + 'а',
        base2 + 'я',
        base2
    ];

    for (const candidate of candidates) {
        if (!candidate || candidate.length < 3) continue;
        const geoRes = await fetch(
            `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(candidate)}&count=1&language=ru`
        );
        const geoData = await geoRes.json();
        console.log('GEO TRY:', candidate, JSON.stringify(geoData.results ? geoData.results[0] : null));
        if (geoData.results && geoData.results.length) {
            return geoData.results[0];
        }
    }
    return null;
}

async function getWeather(city) {
    try {
        const location = await findCity(city);
        if (!location) return null;

        const { latitude, longitude, name, timezone } = location;

        const weatherRes = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code,wind_speed_10m`
        );
        const weatherData = await weatherRes.json();

        return {
            city: name,
            temp: weatherData.current.temperature_2m,
            wind: weatherData.current.wind_speed_10m,
            timezone
        };
    } catch (e) {
        console.error('WEATHER ERROR:', e.message);
        return null;
    }
}

async function getTime(city) {
    try {
        const weather = await getWeather(city);
        if (!weather || !weather.timezone) return null;

        const timeRes = await fetch(`https://worldtimeapi.org/api/timezone/${weather.timezone}`);
        const timeData = await timeRes.json();
        return { city: weather.city, datetime: timeData.datetime };
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
                max_results: 3
            })
        });
        const data = await res.json();
        if (!data.results || !data.results.length) return null;
        return data.results.map((r) => `${r.title}: ${r.content}`).join('\n');
    } catch (e) {
        console.error('SEARCH ERROR:', e.message);
        return null;
    }
}

function extractCity(text) {
    const match = text.match(/в\s+([а-яё\-]+)/i);
    return match ? match[1] : 'Санкт-Петербург';
}

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).send('Method not allowed');
    }

    const body = req.body;
    const sessionId = body.session.session_id;
    const userText = body.request.command;
    const isNew = body.session.new;

    if (isNew || !sessions[sessionId]) {
        sessions[sessionId] = [
            {
                role: 'system',
                content:
                    'Ты голосовой помощник. Отвечай кратко (до 200 символов), разговорным стилем, без мата и без обсуждения 18+ тем.'
            }
        ];
    }

    if (isNew) {
        return res.status(200).json(respond('Привет! Спроси меня что-нибудь.', body));
    }

    let messageToSend = userText;

    if (/погод/i.test(userText)) {
        const city = extractCity(userText);
        const weather = await getWeather(city);
        if (weather) {
            messageToSend = `Вопрос пользователя: "${userText}"\n\nАКТУАЛЬНЫЕ ДАННЫЕ О ПОГОДЕ (используй именно их, не говори что у тебя нет доступа к погоде): город ${weather.city}, температура ${weather.temp}°C, ветер ${weather.wind} м/с.`;
        }
    } else if (/который час|сколько времени|время сейчас/i.test(userText)) {
        const city = extractCity(userText);
        const time = await getTime(city);
        if (time) {
            messageToSend = `Вопрос пользователя: "${userText}"\n\nАКТУАЛЬНЫЕ ДАННЫЕ О ВРЕМЕНИ (используй именно их): в городе ${time.city} сейчас ${time.datetime}.`;
        }
    } else if (
        /последние новости|что нового|найди в интернете|поищи|актуальн/i.test(userText)
    ) {
        const searchResults = await webSearch(userText);
        if (searchResults) {
            messageToSend = `Вопрос пользователя: "${userText}"\n\nРЕЗУЛЬТАТЫ ПОИСКА В ИНТЕРНЕТЕ (используй их для ответа):\n${searchResults}`;
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
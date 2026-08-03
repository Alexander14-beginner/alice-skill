const sessions = {};

const AITUNNEL_KEY = process.env.AITUNNEL_KEY;

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
        content: 'Ты голосовой помощник. Отвечай кратко (до 200 символов), разговорным стилем, без мата и без обсуждения 18+ тем.'
      }
    ];
  }

  if (isNew) {
    return res.status(200).json(respond('Привет! Спроси меня что-нибудь.', body));
  }

  sessions[sessionId].push({ role: 'user', content: userText });

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
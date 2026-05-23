// api/ai.js — Secure AI proxy for NairaDocs
// Supports Claude (Anthropic), Groq, and OpenAI
// Set provider via AI_PROVIDER env var: 'claude' | 'groq' | 'openai'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // CORS
  const origin = req.headers.origin || '';
  const allowed = ['https://nairadocs.ng','https://www.nairadocs.ng','https://nairadocs.vercel.app','http://localhost:3000'];
  if (allowed.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { prompt, maxTokens = 500, model } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Missing prompt' });

    // Determine provider
    const provider = model || process.env.AI_PROVIDER || 'claude';
    let text = '';

    // ── CLAUDE (Anthropic) ──────────────────────────────────────────────
    if (provider === 'claude') {
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: maxTokens,
          messages: [{ role: 'user', content: prompt }],
        }),
      });
      if (!r.ok) throw new Error(`Anthropic error: ${r.status}`);
      const d = await r.json();
      text = d.content?.[0]?.text || '';
    }

    // ── GROQ ────────────────────────────────────────────────────────────
    else if (provider === 'groq') {
      const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'llama3-8b-8192',
          max_tokens: maxTokens,
          messages: [{ role: 'user', content: prompt }],
        }),
      });
      if (!r.ok) throw new Error(`Groq error: ${r.status}`);
      const d = await r.json();
      text = d.choices?.[0]?.message?.content || '';
    }

    // ── OPENAI (GPT) ────────────────────────────────────────────────────
    else if (provider === 'openai') {
      const r = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          max_tokens: maxTokens,
          messages: [{ role: 'user', content: prompt }],
        }),
      });
      if (!r.ok) throw new Error(`OpenAI error: ${r.status}`);
      const d = await r.json();
      text = d.choices?.[0]?.message?.content || '';
    }

    else {
      return res.status(400).json({ error: 'Unknown provider: ' + provider });
    }

    return res.status(200).json({ text });

  } catch (err) {
    console.error('AI error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}

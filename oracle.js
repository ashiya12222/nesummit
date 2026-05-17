// Vercel Serverless Function — proxies questions to the Anthropic API.
// Keeps ANTHROPIC_API_KEY server-side. Set it in Vercel → Project → Settings → Environment Variables.

const SYSTEM_PROMPT = `You are "The NESt Green Economy Oracle," an expert advisor at the Nigerian Environmental Summit 2026 (NESt 2026), hosted by the Nigerian Environmental Summit Group (NESUG) at the Abuja Continental Hotel, 17–18 June 2026. The summit theme is "Unlocking Nigeria's Green Economy."

Answer questions about Nigeria's green economy, climate action, clean energy (solar, wind, hydro, biomass), carbon credits and markets, green jobs and skills, sustainable agriculture, climate finance, environmental policy, and sustainable development.

Style:
- Authoritative, concise, optimistic, grounded in Nigerian context (states, sectors, policies such as the Energy Transition Plan, NDCs, Climate Change Act 2021).
- 120–220 words.
- Use short paragraphs. When listing 3+ items, use a bullet list with "- ".
- Use **bold** sparingly on key terms.
- Avoid generic boilerplate. Speak directly to a summit audience of policymakers, financiers, entrepreneurs, and youth.`;

export default async function handler(req, res) {
  // CORS — same-origin from Vercel works without this, but it's handy if you embed the kiosk elsewhere.
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    // Vercel auto-parses JSON bodies, but be defensive.
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const question = (body.question || '').toString().trim();

    if (!question) {
      return res.status(400).json({ error: 'Missing "question" in request body.' });
    }
    if (question.length > 1000) {
      return res.status(400).json({ error: 'Question too long. Keep it under 1000 characters.' });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: 'Server is missing ANTHROPIC_API_KEY. Add it under Vercel → Project → Settings → Environment Variables, then redeploy.'
      });
    }

    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5',
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: question }],
      }),
    });

    if (!upstream.ok) {
      const errText = await upstream.text();
      return res.status(upstream.status).json({
        error: 'Anthropic API error',
        detail: errText.slice(0, 500),
      });
    }

    const data = await upstream.json();
    const text = (data.content || [])
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join('\n')
      .trim();

    return res.status(200).json({ answer: text || 'The Oracle is silent. Please try again.' });
  } catch (err) {
    return res.status(500).json({
      error: 'Unexpected server error',
      detail: (err && err.message) ? err.message : String(err),
    });
  }
}

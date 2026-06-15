export const config = { maxDuration: 60 };

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { mensagens } = req.body;

  if (!mensagens || !Array.isArray(mensagens)) {
    return res.status(400).json({ error: 'Dados inválidos' });
  }

  try {
    // Converter formato para OpenAI
    const msg = mensagens[0];
    const conteudo = Array.isArray(msg.content) ? msg.content : [{ type: 'text', text: msg.content }];

    const partes = conteudo.map(bloco => {
      if (bloco.type === 'text') return { type: 'text', text: bloco.text };
      if (bloco.type === 'image') return {
        type: 'image_url',
        image_url: { url: `data:${bloco.source.media_type};base64,${bloco.source.data}` }
      };
      return null;
    }).filter(Boolean);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        max_tokens: 4000,
        messages: [{ role: 'user', content: partes }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data?.error?.message || 'Erro na API' });
    }

    const texto = data.choices?.[0]?.message?.content?.trim() || '';

    // Retornar no formato que o front-end espera
    return res.status(200).json({
      content: [{ type: 'text', text: texto }]
    });

  } catch (e) {
    return res.status(500).json({ error: e.message || 'Erro interno' });
  }
}

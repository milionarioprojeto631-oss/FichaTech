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
    // Converter formato Anthropic para Gemini
    const partes = [];
    const msg = mensagens[0];
    const conteudo = Array.isArray(msg.content) ? msg.content : [{ type: 'text', text: msg.content }];

    for (const bloco of conteudo) {
      if (bloco.type === 'text') {
        partes.push({ text: bloco.text });
      } else if (bloco.type === 'image') {
        partes.push({
          inline_data: {
            mime_type: bloco.source.media_type,
            data: bloco.source.data
          }
        });
      }
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: partes }],
          tools: [{ google_search: {} }],
          generationConfig: { maxOutputTokens: 4000 }
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data?.error?.message || 'Erro na API' });
    }

    // Extrair texto da resposta do Gemini
    const texto = data.candidates?.[0]?.content?.parts
      ?.filter(p => p.text)
      ?.map(p => p.text)
      ?.join('\n')
      ?.trim() || '';

    // Retornar no formato que o front-end já espera
    return res.status(200).json({
      content: [{ type: 'text', text: texto }]
    });

  } catch (e) {
    return res.status(500).json({ error: e.message || 'Erro interno' });
  }
}

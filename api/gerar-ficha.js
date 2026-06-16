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
    const msg = mensagens[0];
    const conteudo = Array.isArray(msg.content) ? msg.content : [{ type: 'text', text: msg.content }];

    // Extrair só o texto para o modelo de busca (não suporta imagem)
    const textoPrompt = conteudo
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('\n');

    const temImagem = conteudo.some(b => b.type === 'image');

    let texto = '';

    if (temImagem) {
      // Com imagem: usa gpt-4o sem busca
      const partes = conteudo.map(bloco => {
        if (bloco.type === 'text') return { type: 'text', text: bloco.text };
        if (bloco.type === 'image') return {
          type: 'image_url',
          image_url: { url: `data:${bloco.source.media_type};base64,${bloco.source.data}` }
        };
        return null;
      }).filter(Boolean);

      const r = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          max_tokens: 4000,
          messages: [
            {
              role: 'system',
              content: 'Você é um especialista em e-commerce brasileiro. Sempre responda com o JSON solicitado, nunca recuse gerar a ficha técnica.'
            },
            { role: 'user', content: partes }
          ]
        })
      });
      const d = await r.json();
      if (!r.ok) return res.status(r.status).json({ error: d?.error?.message || 'Erro na API' });
      texto = d.choices?.[0]?.message?.content?.trim() || '';

    } else {
      // Sem imagem: usa gpt-4o-search-preview com busca web
      const r = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-search-preview',
          max_tokens: 4000,
          web_search_options: {},
          messages: [
            {
              role: 'system',
              content: 'Você é um especialista em e-commerce brasileiro. Pesquise o produto na web e sempre responda com o JSON solicitado.'
            },
            { role: 'user', content: textoPrompt }
          ]
        })
      });
      const d = await r.json();
      if (!r.ok) return res.status(r.status).json({ error: d?.error?.message || 'Erro na API' });
      texto = d.choices?.[0]?.message?.content?.trim() || '';
    }

    return res.status(200).json({
      content: [{ type: 'text', text: texto }]
    });

  } catch (e) {
    return res.status(500).json({ error: e.message || 'Erro interno' });
  }
}

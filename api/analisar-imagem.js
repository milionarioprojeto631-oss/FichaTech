export const config = { maxDuration: 30 };

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { base64, mime } = req.body;

  if (!base64 || !mime) {
    return res.status(400).json({ error: 'Imagem não fornecida' });
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                inline_data: { mime_type: mime, data: base64 }
              },
              {
                text: `Analise esta imagem de produto e extraia as seguintes informações (responda em português, de forma direta, sem introduções):

Produto: [nome completo do produto visível na embalagem ou pelo visual]
Marca: [marca do produto, se visível]
Categoria: [categoria geral do produto]
Características visíveis: [características, tamanho, cor, material, voltagem ou outros detalhes visíveis na imagem/embalagem]
Código/referência: [se houver código, número de referência ou modelo visível]

Se alguma informação não for visível, omita a linha. Seja preciso e objetivo.`
              }
            ]
          }],
          generationConfig: { maxOutputTokens: 500 }
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data?.error?.message || 'Erro na API' });
    }

    const texto = data.candidates?.[0]?.content?.parts
      ?.filter(p => p.text)
      ?.map(p => p.text)
      ?.join('\n')
      ?.trim() || '';

    return res.status(200).json({ texto });

  } catch (e) {
    return res.status(500).json({ error: e.message || 'Erro interno' });
  }
}

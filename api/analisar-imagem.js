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
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        max_tokens: 500,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: `data:${mime};base64,${base64}` }
            },
            {
              type: 'text',
              text: `Analise esta imagem de produto e extraia as seguintes informações (responda em português, de forma direta, sem introduções):

Produto: [nome completo do produto visível na embalagem ou pelo visual]
Marca: [marca do produto, se visível]
Categoria: [categoria geral do produto]
Características visíveis: [características, tamanho, cor, material, voltagem ou outros detalhes visíveis na imagem/embalagem]
Código/referência: [se houver código, número de referência ou modelo visível]

Se alguma informação não for visível, omita a linha. Seja preciso e objetivo.`
            }
          ]
        }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data?.error?.message || 'Erro na API' });
    }

    const texto = data.choices?.[0]?.message?.content?.trim() || '';

    return res.status(200).json({ texto });

  } catch (e) {
    return res.status(500).json({ error: e.message || 'Erro interno' });
  }
}

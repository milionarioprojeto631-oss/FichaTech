export default async function handler(req, res) {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Não autenticado' });

  const headers = {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${token}`
  };

  // GET — listar fichas em ordem alfabética
  if (req.method === 'GET') {
    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/fichas?select=*&order=nome_produto.asc`,
        { headers }
      );
      const data = await response.json();
      if (!response.ok) return res.status(response.status).json({ error: data?.message || 'Erro ao buscar fichas' });
      return res.status(200).json(data);
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // POST — salvar ficha
  if (req.method === 'POST') {
    const { nome_produto, marca, ean, formato, conteudo_ml, conteudo_shopee } = req.body;

    if (!nome_produto) return res.status(400).json({ error: 'Nome do produto obrigatório' });

    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/fichas`, {
        method: 'POST',
        headers: { ...headers, 'Prefer': 'return=representation' },
        body: JSON.stringify({ nome_produto, marca, ean, formato, conteudo_ml, conteudo_shopee })
      });
      const data = await response.json();
      if (!response.ok) return res.status(response.status).json({ error: data?.message || 'Erro ao salvar' });
      return res.status(201).json(data[0]);
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // DELETE — apagar ficha
  if (req.method === 'DELETE') {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'ID obrigatório' });

    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/fichas?id=eq.${id}`, {
        method: 'DELETE',
        headers
      });
      if (!response.ok) {
        const data = await response.json();
        return res.status(response.status).json({ error: data?.message || 'Erro ao apagar' });
      }
      return res.status(200).json({ ok: true });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(405).json({ error: 'Método não permitido' });
}

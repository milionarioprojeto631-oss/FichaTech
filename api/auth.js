export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });

  const { action, email, password } = req.body;
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return res.status(500).json({ error: 'Supabase não configurado' });
  }

  const endpoint = action === 'login'
    ? `${SUPABASE_URL}/auth/v1/token?grant_type=password`
    : `${SUPABASE_URL}/auth/v1/signup`;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      const msg = data?.error_description || data?.msg || 'Erro de autenticação';
      return res.status(400).json({ error: msg });
    }

    return res.status(200).json({
      token: data.access_token,
      user: { email: data.user?.email, id: data.user?.id }
    });

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

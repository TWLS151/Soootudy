export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { password } = req.body || {};
  const sitePassword = process.env.SITE_PASSWORD;

  if (!sitePassword) {
    return res.status(500).json({ error: 'SITE_PASSWORD not configured' });
  }

  if (password === sitePassword) {
    return res.status(200).json({ ok: true });
  }

  return res.status(401).json({ ok: false });
}

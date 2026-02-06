export default async function handler(req: any, res: any) {
  const token = process.env.GITHUB_TOKEN;
  const { per_page = '100', since } = req.query;

  const url = new URL('https://api.github.com/repos/TWLS151/Soootudy/commits');
  url.searchParams.set('per_page', String(per_page));
  if (since) url.searchParams.set('since', String(since));

  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'Sootudy-Web',
  };
  if (token) {
    headers.Authorization = `token ${token}`;
  }

  try {
    const response = await fetch(url.toString(), { headers });
    const data = await response.json();

    res.setHeader('Cache-Control', 's-maxage=300');
    res.status(response.status).json(data);
  } catch {
    res.status(500).json({ error: 'Failed to fetch commits' });
  }
}

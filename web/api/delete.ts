import { createClient } from '@supabase/supabase-js';

const OWNER = 'TWLS151';
const REPO = 'Soootudy';

export default async function handler(req: any, res: any) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // --- Auth ---
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: '인증이 필요합니다.' });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const githubPat = process.env.GITHUB_PAT;

  if (!supabaseUrl || !supabaseServiceKey || !githubPat) {
    return res.status(500).json({ error: '서버 설정 오류' });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(authHeader.slice(7));

  if (authError || !user) {
    return res.status(401).json({ error: '인증에 실패했습니다.' });
  }

  const githubUsername =
    user.user_metadata?.user_name || user.user_metadata?.preferred_username;
  if (!githubUsername) {
    return res.status(401).json({ error: 'GitHub 사용자명을 찾을 수 없습니다.' });
  }

  // --- Fetch members.json ---
  const membersRes = await fetch(
    `https://api.github.com/repos/${OWNER}/${REPO}/contents/members.json`,
    {
      headers: {
        Authorization: `token ${githubPat}`,
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'Sootudy-Web',
      },
    },
  );

  if (!membersRes.ok) {
    return res.status(500).json({ error: '멤버 정보를 가져올 수 없습니다.' });
  }

  const membersData = await membersRes.json();
  const membersContent = Buffer.from(membersData.content, 'base64').toString(
    'utf-8',
  );
  const members: Record<string, { name: string; github: string }> =
    JSON.parse(membersContent);

  // Find memberId by GitHub username
  let memberId: string | null = null;
  for (const [id, member] of Object.entries(members)) {
    if (member.github.toLowerCase() === githubUsername.toLowerCase()) {
      memberId = id;
      break;
    }
  }

  if (!memberId) {
    return res.status(403).json({ error: '팀원만 삭제할 수 있습니다.' });
  }

  // --- Validate input ---
  const { path } = req.body || {};

  if (!path || typeof path !== 'string') {
    return res.status(400).json({ error: '삭제할 파일 경로가 필요합니다.' });
  }

  // 본인 파일만 삭제 가능
  if (!path.startsWith(`${memberId}/`)) {
    return res.status(403).json({ error: '본인의 코드만 삭제할 수 있습니다.' });
  }

  // --- Get file sha ---
  const fileRes = await fetch(
    `https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}`,
    {
      headers: {
        Authorization: `token ${githubPat}`,
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'Sootudy-Web',
      },
    },
  );

  if (!fileRes.ok) {
    return res.status(404).json({ error: '파일을 찾을 수 없습니다.' });
  }

  const fileData = await fileRes.json();

  // --- Delete from GitHub ---
  const author = {
    name: members[memberId].github,
    email: `${members[memberId].github}@users.noreply.github.com`,
  };

  const deleteRes = await fetch(
    `https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `token ${githubPat}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'User-Agent': 'Sootudy-Web',
      },
      body: JSON.stringify({
        message: `Delete ${path.split('/').pop()} by ${members[memberId].name}`,
        sha: fileData.sha,
        author,
        committer: author,
      }),
    },
  );

  if (!deleteRes.ok) {
    const errData = await deleteRes.json().catch(() => ({}));
    return res.status(500).json({
      error: `GitHub API 오류: ${deleteRes.status}`,
      details: errData.message,
    });
  }

  return res.status(200).json({ success: true });
}

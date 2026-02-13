import { createClient } from '@supabase/supabase-js';

const OWNER = 'TWLS151';
const REPO = 'Soootudy';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

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

  // Fetch members.json
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
  const membersContent = Buffer.from(membersData.content, 'base64').toString('utf-8');
  const members: Record<string, { name: string; github: string; admin?: boolean; virtual?: boolean }> =
    JSON.parse(membersContent);

  // Admin check
  const githubUsername =
    user.user_metadata?.user_name || user.user_metadata?.preferred_username;
  let currentMemberId: string | null = null;
  for (const [id, member] of Object.entries(members)) {
    if (member.github.toLowerCase() === githubUsername?.toLowerCase()) {
      currentMemberId = id;
      break;
    }
  }

  if (!currentMemberId || !members[currentMemberId]?.admin) {
    return res.status(403).json({ error: '관리자만 실행할 수 있습니다.' });
  }

  // Build Korean name → memberId map
  const nameToId = new Map<string, string>();
  for (const [id, member] of Object.entries(members)) {
    if (!member.virtual) {
      nameToId.set(member.name, id);
    }
  }

  // --- Step 1: 이전 backfill 데이터만 삭제 (실제 제출 기록은 보존) ---
  // 이전 backfill은 2026-02-12 01:04:21 UTC 에 일괄 삽입됨.
  // 해당 시점 ±1분 이내의 레코드를 backfill 데이터로 간주하여 삭제.
  const { error: deleteError, count: deletedCount } = await supabase
    .from('submissions')
    .delete()
    .gte('created_at', '2026-02-12T01:04:00+00:00')
    .lte('created_at', '2026-02-12T01:05:00+00:00');

  if (deleteError) {
    return res.status(500).json({
      error: '이전 backfill 데이터 삭제 실패',
      details: deleteError.message,
    });
  }

  // --- Step 2: Git 커밋에서 새 제출(Add) 기록만 수집 ---
  const submissions: { member_id: string; date: string }[] = [];
  let page = 1;
  const perPage = 100;

  while (true) {
    const commitsRes = await fetch(
      `https://api.github.com/repos/${OWNER}/${REPO}/commits?per_page=${perPage}&page=${page}`,
      {
        headers: {
          Authorization: `token ${githubPat}`,
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'Sootudy-Web',
        },
      },
    );

    if (!commitsRes.ok) break;

    const commits = await commitsRes.json();
    if (!Array.isArray(commits) || commits.length === 0) break;

    for (const commit of commits) {
      const message = commit.commit?.message || '';

      // Skip non-submission commits
      if (message.includes('참고 솔루션')) continue;

      // "Add" 커밋만 매칭 (Update/수정은 제출 기록에 포함하지 않음)
      const match = message.match(/^Add .+ by (.+)$/m);
      if (!match) continue;

      const name = match[1].trim();
      const memberId = nameToId.get(name);
      if (!memberId) continue;

      // Get commit date in KST
      const commitDate = commit.commit?.committer?.date || commit.commit?.author?.date;
      if (!commitDate) continue;

      const kstMs = new Date(commitDate).getTime() + 9 * 60 * 60 * 1000;
      const dateStr = new Date(kstMs).toISOString().split('T')[0];

      submissions.push({ member_id: memberId, date: dateStr });
    }

    if (commits.length < perPage) break;
    page++;
  }

  // Deduplicate (same member + same date)
  const seen = new Set<string>();
  const uniqueSubmissions = submissions.filter((s) => {
    const key = `${s.member_id}:${s.date}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // --- Step 3: Upsert (실제 제출 기록과 충돌 시 무시) ---
  let insertedCount = 0;
  if (uniqueSubmissions.length > 0) {
    for (let i = 0; i < uniqueSubmissions.length; i += 500) {
      const batch = uniqueSubmissions.slice(i, i + 500);
      const { error: upsertError } = await supabase
        .from('submissions')
        .upsert(batch, { onConflict: 'member_id,date', ignoreDuplicates: true });

      if (upsertError) {
        return res.status(500).json({
          error: '데이터 저장 실패',
          details: upsertError.message,
        });
      }
      insertedCount += batch.length;
    }
  }

  return res.status(200).json({
    success: true,
    deleted: deletedCount ?? 0,
    inserted: insertedCount,
    unique: uniqueSubmissions.length,
    pages: page,
  });
}

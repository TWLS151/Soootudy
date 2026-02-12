import { createClient } from '@supabase/supabase-js';

const OWNER = 'TWLS151';
const REPO = 'Soootudy';

function getCurrentWeek(): string {
  const now = new Date();
  // KST (UTC+9)
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const year = kst.getUTCFullYear() % 100;
  const month = kst.getUTCMonth() + 1;
  const date = kst.getUTCDate();
  const weekNum = Math.ceil(date / 7);

  const yy = String(year).padStart(2, '0');
  const mm = String(month).padStart(2, '0');
  return `${yy}-${mm}-w${weekNum}`;
}

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
  const members: Record<string, { name: string; github: string; admin?: boolean; virtual?: boolean }> =
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
    return res.status(403).json({ error: '팀원만 코드를 제출할 수 있습니다.' });
  }

  // --- Check for targetMember (admin-only reference solution upload) ---
  const { source, problemNumber, code, week: customWeek, editPath, targetMember } = req.body || {};

  let effectiveMemberId = memberId;

  if (targetMember === '_ref') {
    if (!members[memberId]?.admin) {
      return res.status(403).json({ error: '관리자만 참고 솔루션을 업로드할 수 있습니다.' });
    }
    effectiveMemberId = '_ref';
  }

  // --- Validate input ---

  if (!source || !problemNumber || !code) {
    return res
      .status(400)
      .json({ error: '출처, 문제번호, 코드를 모두 입력해주세요.' });
  }
  if (!['swea', 'boj', 'etc'].includes(source)) {
    return res
      .status(400)
      .json({ error: '출처는 "swea", "boj", "etc"만 가능합니다.' });
  }
  if (source === 'etc') {
    // 기타: 한글(자모+완성형), 영문, 숫자, 하이픈, 띄어쓰기 허용
    if (!/^[가-힣ㄱ-ㅎㅏ-ㅣa-zA-Z0-9- ]+$/.test(String(problemNumber))) {
      return res.status(400).json({ error: '문제 이름은 한글, 영문, 숫자, 하이픈, 띄어쓰기만 사용 가능합니다.' });
    }
  } else {
    if (!/^\d+$/.test(String(problemNumber))) {
      return res.status(400).json({ error: '문제번호는 숫자만 입력 가능합니다.' });
    }
  }
  if (typeof code !== 'string' || code.trim().length === 0) {
    return res.status(400).json({ error: '코드를 입력해주세요.' });
  }

  const week = customWeek || getCurrentWeek();
  // 띄어쓰기 → 언더스코어 변환 (파일명 안전)
  const safeProblemNumber = source === 'etc' ? String(problemNumber).trim().replace(/ +/g, '_') : String(problemNumber);
  const name = `${source}-${safeProblemNumber}`;

  const author = {
    name: members[memberId].github,
    email: `${members[memberId].github}@users.noreply.github.com`,
  };

  // --- EDIT MODE: Update a specific versioned file ---
  if (editPath && typeof editPath === 'string') {
    const isRefEdit = editPath.startsWith('_ref/');
    if (isRefEdit) {
      if (!members[memberId]?.admin) {
        return res.status(403).json({ error: '관리자만 참고 솔루션을 수정할 수 있습니다.' });
      }
    } else if (!editPath.startsWith(`${memberId}/`)) {
      return res.status(403).json({ error: '본인의 코드만 수정할 수 있습니다.' });
    }

    const encodedEditPath = editPath.split('/').map(encodeURIComponent).join('/');
    const checkRes = await fetch(
      `https://api.github.com/repos/${OWNER}/${REPO}/contents/${encodedEditPath}`,
      {
        headers: {
          Authorization: `token ${githubPat}`,
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'Sootudy-Web',
        },
      },
    );

    if (!checkRes.ok) {
      return res.status(404).json({ error: '수정할 파일을 찾을 수 없습니다.' });
    }

    const existing = await checkRes.json();
    const content = Buffer.from(code, 'utf-8').toString('base64');
    const pathParts = editPath.split('/');
    const editFileName = pathParts[2]?.replace(/\.py$/, '') || name;
    const commitMessage = isRefEdit
      ? `Update ${editFileName} (참고 솔루션) by ${members[memberId].name}`
      : `Update ${editFileName} by ${members[memberId].name}`;

    const putRes = await fetch(
      `https://api.github.com/repos/${OWNER}/${REPO}/contents/${encodedEditPath}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `token ${githubPat}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
          'User-Agent': 'Sootudy-Web',
        },
        body: JSON.stringify({
          message: commitMessage,
          content,
          sha: existing.sha,
          author,
          committer: author,
        }),
      },
    );

    if (!putRes.ok) {
      const errData = await putRes.json().catch(() => ({}));
      return res.status(500).json({
        error: `GitHub API 오류: ${putRes.status}`,
        details: errData.message,
      });
    }

    const responseWeek = pathParts[1];
    const responseName = pathParts[2].replace(/\.py$/, '');

    return res.status(201).json({
      success: true,
      path: editPath,
      memberId,
      week: responseWeek,
      name: responseName,
    });
  }

  // --- NEW SUBMISSION: Auto-detect version ---
  const dirPath = `${effectiveMemberId}/${week}`;
  const dirRes = await fetch(
    `https://api.github.com/repos/${OWNER}/${REPO}/contents/${dirPath}`,
    {
      headers: {
        Authorization: `token ${githubPat}`,
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'Sootudy-Web',
      },
    },
  );

  let nextVersion = 1;

  if (dirRes.ok) {
    const dirFiles: Array<{ name: string }> = await dirRes.json();
    const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const versionPattern = new RegExp(`^${escapedName}-v(\\d+)\\.py$`);
    const legacyName = `${name}.py`;

    let maxVersion = 0;
    let hasLegacy = false;

    for (const file of dirFiles) {
      const match = file.name.match(versionPattern);
      if (match) {
        const v = parseInt(match[1], 10);
        if (v > maxVersion) maxVersion = v;
      }
      if (file.name === legacyName) {
        hasLegacy = true;
      }
    }

    if (hasLegacy) {
      nextVersion = Math.max(maxVersion + 1, 2);
    } else if (maxVersion > 0) {
      nextVersion = maxVersion + 1;
    }
  }

  const versionedName = `${name}-v${nextVersion}`;
  const filePath = `${effectiveMemberId}/${week}/${versionedName}.py`;

  // --- Push to GitHub ---
  const content = Buffer.from(code, 'utf-8').toString('base64');
  const isRefSubmission = effectiveMemberId === '_ref';
  const commitMessage = isRefSubmission
    ? `Add ${versionedName} (참고 솔루션) by ${members[memberId].name}`
    : `Add ${versionedName} by ${members[memberId].name}`;

  const encodedFilePath = filePath.split('/').map(encodeURIComponent).join('/');
  const putRes = await fetch(
    `https://api.github.com/repos/${OWNER}/${REPO}/contents/${encodedFilePath}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `token ${githubPat}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'User-Agent': 'Sootudy-Web',
      },
      body: JSON.stringify({
        message: commitMessage,
        content,
        author,
        committer: author,
      }),
    },
  );

  if (!putRes.ok) {
    const errData = await putRes.json().catch(() => ({}));
    return res.status(500).json({
      error: `GitHub API 오류: ${putRes.status}`,
      details: errData.message,
    });
  }

  // 제출 기록 저장 (연속 제출 계산용, 실패해도 무시)
  if (effectiveMemberId !== '_ref') {
    const kstNow = new Date(Date.now() + 9 * 60 * 60 * 1000);
    const todayKST = kstNow.toISOString().split('T')[0];
    await supabase
      .from('submissions')
      .upsert({ member_id: effectiveMemberId, date: todayKST }, { onConflict: 'member_id,date' })
      .then(() => {});
  }

  return res.status(201).json({
    success: true,
    path: filePath,
    memberId: effectiveMemberId,
    week,
    name: versionedName,
  });
}

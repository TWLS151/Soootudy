import type { Members, Problem, GitHubTreeResponse, GitHubTreeItem, Activities } from '../types';

const REPO_OWNER = 'TWLS151';
const REPO_NAME = 'Sootudy';
const API_BASE = 'https://api.github.com';
const CACHE_KEY_TREE = 'sootudy_tree';
const CACHE_KEY_MEMBERS = 'sootudy_members';
const CACHE_KEY_ACTIVITY = 'sootudy_activity';
const CACHE_TTL = 5 * 60 * 1000; // 5분

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

function getCache<T>(key: string): T | null {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const entry: CacheEntry<T> = JSON.parse(raw);
    if (Date.now() - entry.timestamp > CACHE_TTL) {
      sessionStorage.removeItem(key);
      return null;
    }
    return entry.data;
  } catch {
    return null;
  }
}

function setCache<T>(key: string, data: T): void {
  try {
    const entry: CacheEntry<T> = { data, timestamp: Date.now() };
    sessionStorage.setItem(key, JSON.stringify(entry));
  } catch {
    // sessionStorage full or unavailable
  }
}

// GitHub API가 실패할 경우 (아직 push 안 된 경우 등) 사용할 mock 데이터
const MOCK_MEMBERS: Members = {
  jsc: { name: '장수철', github: 'Apple7575' },
  bsw: { name: '백승우', github: 'bsw1206' },
  lhw: { name: '이현우', github: 'balbi-hw' },
  hyw: { name: '한영욱', github: '10wook' },
  ogy: { name: '오규연', github: '59raphyy-cloud' },
  kgm: { name: '김광민', github: 'GwangMinKim26' },
  lcj: { name: '이창준', github: 'Junch-Lee' },
  ljy: { name: '임지영', github: 'limji02' },
  jhj: { name: '조희주', github: 'heemesama' },
  pse: { name: '박세은', github: 'pse3048-ui' },
};

const MOCK_TREE: GitHubTreeItem[] = [
  { path: 'jsc/26-01-w4/1984.py', mode: '100644', type: 'blob', sha: '', url: '' },
  { path: 'jsc/26-01-w4/swea-1284.py', mode: '100644', type: 'blob', sha: '', url: '' },
  { path: 'jsc/26-01-w4/swea-4869.py', mode: '100644', type: 'blob', sha: '', url: '' },
  { path: 'jsc/26-01-w4/swea-4869.md', mode: '100644', type: 'blob', sha: '', url: '' },
  { path: 'jsc/26-01-w4/swea-5186.py', mode: '100644', type: 'blob', sha: '', url: '' },
  { path: 'jsc/26-01-w4/swea-5186.md', mode: '100644', type: 'blob', sha: '', url: '' },
  { path: 'jsc/26-01-w4/ws-04-04.py', mode: '100644', type: 'blob', sha: '', url: '' },
  { path: 'jsc/26-01-w4/ws-04-04.md', mode: '100644', type: 'blob', sha: '', url: '' },
  { path: 'jsc/26-01-w5/boj-2346.py', mode: '100644', type: 'blob', sha: '', url: '' },
  { path: 'jsc/26-01-w5/boj-2346.md', mode: '100644', type: 'blob', sha: '', url: '' },
  { path: 'jsc/26-01-w5/boj-1966.md', mode: '100644', type: 'blob', sha: '', url: '' },
  { path: 'jsc/26-01-w5/swea-1208.py', mode: '100644', type: 'blob', sha: '', url: '' },
  { path: 'jsc/26-01-w5/swea-1926.py', mode: '100644', type: 'blob', sha: '', url: '' },
  { path: 'jsc/26-01-w5/swea-23003.py', mode: '100644', type: 'blob', sha: '', url: '' },
  { path: 'jsc/26-02-w1/swea-2005.py', mode: '100644', type: 'blob', sha: '', url: '' },
  { path: 'jsc/26-02-w1/swea-9490.py', mode: '100644', type: 'blob', sha: '', url: '' },
  { path: 'bsw/26-02-w1/swea-1974.py', mode: '100644', type: 'blob', sha: '', url: '' },
  { path: 'lhw/26-02-w1/이현우.py', mode: '100644', type: 'blob', sha: '', url: '' },
];

export async function fetchRepoTree(): Promise<GitHubTreeItem[]> {
  const cached = getCache<GitHubTreeItem[]>(CACHE_KEY_TREE);
  if (cached) return cached;

  try {
    const res = await fetch(`${API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/git/trees/main?recursive=1`);
    if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
    const data: GitHubTreeResponse = await res.json();
    setCache(CACHE_KEY_TREE, data.tree);
    return data.tree;
  } catch {
    // API 실패 시 mock 데이터 사용
    console.warn('GitHub API 실패, mock 데이터를 사용합니다.');
    return MOCK_TREE;
  }
}

export async function fetchMembers(): Promise<Members> {
  const cached = getCache<Members>(CACHE_KEY_MEMBERS);
  if (cached) return cached;

  try {
    const res = await fetch(`${API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/contents/members.json`);
    if (!res.ok) throw new Error(`Failed to fetch members.json: ${res.status}`);
    const data = await res.json();
    const binary = atob(data.content);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    const content = new TextDecoder('utf-8').decode(bytes);
    const members: Members = JSON.parse(content);
    setCache(CACHE_KEY_MEMBERS, members);
    return members;
  } catch {
    // API 실패 시 mock 데이터 사용
    console.warn('members.json 로드 실패, mock 데이터를 사용합니다.');
    return MOCK_MEMBERS;
  }
}

export async function fetchFileContent(path: string): Promise<string> {
  const cacheKey = `sootudy_file_${path}`;
  const cached = getCache<string>(cacheKey);
  if (cached) return cached;

  const res = await fetch(`${API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/contents/${encodeURIComponent(path)}`, {
    headers: { Accept: 'application/vnd.github.v3.raw' },
  });
  if (!res.ok) throw new Error(`Failed to fetch file: ${res.status}`);
  const content = await res.text();
  setCache(cacheKey, content);
  return content;
}

export function parseSource(filename: string): 'swea' | 'boj' | 'etc' {
  const lower = filename.toLowerCase();
  if (lower.startsWith('swea-') || lower.startsWith('swea_')) return 'swea';
  if (lower.startsWith('boj-') || lower.startsWith('boj_')) return 'boj';
  return 'etc';
}

export function parseSourceFromCode(code: string): 'swea' | 'boj' | 'etc' | null {
  const match = code.match(/^#\s*@source:\s*(\w+)/m);
  if (!match) return null;
  const source = match[1].toLowerCase();
  if (source === 'swea') return 'swea';
  if (source === 'boj') return 'boj';
  return 'etc';
}

const WEEK_PATTERN = /^\d{2}-\d{2}-w\d+$/;

export function parseProblemsFromTree(tree: GitHubTreeItem[], members: Members): Problem[] {
  const memberIds = new Set(Object.keys(members));
  const problems: Problem[] = [];
  const mdFiles = new Set<string>();

  // 먼저 .md 파일 경로 수집
  for (const item of tree) {
    if (item.type === 'blob' && item.path.endsWith('.md')) {
      mdFiles.add(item.path.replace(/\.md$/, ''));
    }
  }

  for (const item of tree) {
    if (item.type !== 'blob') continue;
    if (!item.path.endsWith('.py')) continue;

    const parts = item.path.split('/');
    if (parts.length !== 3) continue;

    const [memberId, week, filename] = parts;
    if (!memberIds.has(memberId)) continue;
    if (!WEEK_PATTERN.test(week)) continue;

    const name = filename.replace(/\.py$/, '');
    const basePath = item.path.replace(/\.py$/, '');
    const hasNote = mdFiles.has(basePath);

    problems.push({
      id: `${memberId}/${week}/${name}`,
      member: memberId,
      week,
      name,
      source: parseSource(filename),
      path: item.path,
      hasNote,
      notePath: hasNote ? `${basePath}.md` : undefined,
    });
  }

  return problems.sort((a, b) => {
    const weekCmp = b.week.localeCompare(a.week);
    if (weekCmp !== 0) return weekCmp;
    return a.name.localeCompare(b.name);
  });
}

export function sortedMemberEntries(members: Members): [string, Members[string]][] {
  return Object.entries(members).sort((a, b) => a[1].name.localeCompare(b[1].name, 'ko'));
}

export function extractWeeks(problems: Problem[]): string[] {
  const weeks = new Set(problems.map((p) => p.week));
  return Array.from(weeks).sort((a, b) => b.localeCompare(a));
}

// --- 커밋 활동 & 스트릭 ---

function toKSTDateStr(isoDate: string): string {
  const utc = new Date(isoDate);
  const kst = new Date(utc.getTime() + 9 * 60 * 60 * 1000);
  const y = kst.getFullYear();
  const m = String(kst.getMonth() + 1).padStart(2, '0');
  const d = String(kst.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function toDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

function getPreviousWeekday(date: Date): Date {
  const prev = new Date(date);
  prev.setDate(prev.getDate() - 1);
  while (isWeekend(prev)) {
    prev.setDate(prev.getDate() - 1);
  }
  return prev;
}

export function calculateStreak(dates: string[]): number {
  if (dates.length === 0) return 0;
  const dateSet = new Set(dates);

  // KST 기준 오늘
  const now = new Date();
  const kstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  let current = new Date(kstNow);
  current.setHours(0, 0, 0, 0);

  // 주말이면 직전 평일로 이동
  while (isWeekend(current)) {
    current = getPreviousWeekday(current);
  }

  // 오늘(또는 직전 평일)에 활동이 없으면 전날 평일 확인
  if (!dateSet.has(toDateStr(current))) {
    current = getPreviousWeekday(current);
    if (!dateSet.has(toDateStr(current))) {
      return 0;
    }
  }

  let streak = 0;
  while (dateSet.has(toDateStr(current))) {
    streak++;
    current = getPreviousWeekday(current);
  }

  return streak;
}

export async function fetchCommitActivity(members: Members): Promise<Activities> {
  const cached = getCache<Activities>(CACHE_KEY_ACTIVITY);
  if (cached) return cached;

  const since = new Date();
  since.setDate(since.getDate() - 84); // ~12주

  let commits: any[] = [];
  try {
    let res: Response;
    if (import.meta.env.DEV) {
      // 개발 환경: 직접 GitHub API 호출
      res = await fetch(
        `${API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/commits?per_page=100&since=${since.toISOString()}`
      );
    } else {
      // 프로덕션: Vercel serverless function 사용
      res = await fetch(`/api/commits?per_page=100&since=${since.toISOString()}`);
    }
    if (res.ok) {
      commits = await res.json();
    }
  } catch {
    console.warn('커밋 데이터 로드 실패');
  }

  // GitHub username → member ID 매핑
  const githubToMember: Record<string, string> = {};
  for (const [id, member] of Object.entries(members)) {
    githubToMember[member.github.toLowerCase()] = id;
  }

  // 멤버별 커밋 날짜 그룹핑 (KST 기준)
  const memberDates: Record<string, Set<string>> = {};
  for (const commit of commits) {
    const login = commit.author?.login?.toLowerCase();
    if (!login) continue;
    const memberId = githubToMember[login];
    if (!memberId) continue;

    const date = toKSTDateStr(commit.commit.author.date);
    if (!memberDates[memberId]) memberDates[memberId] = new Set();
    memberDates[memberId].add(date);
  }

  // 스트릭 계산 및 결과 구성
  const activities: Activities = {};
  for (const id of Object.keys(members)) {
    const dates = memberDates[id] ? Array.from(memberDates[id]).sort() : [];
    activities[id] = {
      dates,
      streak: calculateStreak(dates),
    };
  }

  setCache(CACHE_KEY_ACTIVITY, activities);
  return activities;
}

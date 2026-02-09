import type { Members, GitHubTreeResponse, GitHubTreeItem } from '../types';
import { getCache, setCache } from './cache';

// Re-export for backward compatibility
export { parseSource, parseSourceFromCode, parseProblemsFromTree, sortedMemberEntries, extractWeeks, getProblemUrl } from './parser';
export { calculateStreak, fetchCommitActivity } from './activity';

const REPO_OWNER = 'TWLS151';
const REPO_NAME = 'Soootudy';
const API_BASE = 'https://api.github.com';
const CACHE_KEY_TREE = 'sootudy_tree';
const CACHE_KEY_MEMBERS = 'sootudy_members';

const MOCK_MEMBERS: Members = {
  jsc: { name: '장수철', github: 'Apple7575' },
  bsw: { name: '백승우', github: 'bsw1206' },
  lhw: { name: '이현우', github: 'balbi-hw' },
  hyw: { name: '한영욱', github: '10wook' },
  oky: { name: '오규연', github: '59raphyy-cloud' },
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
    console.warn('members.json 로드 실패, mock 데이터를 사용합니다.');
    return MOCK_MEMBERS;
  }
}

export async function fetchFileContent(path: string): Promise<string> {
  const cacheKey = `sootudy_file_${path}`;
  const cached = getCache<string>(cacheKey);
  if (cached) return cached;

  const encodedPath = path.split('/').map(encodeURIComponent).join('/');
  const res = await fetch(`${API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/contents/${encodedPath}`, {
    headers: { Accept: 'application/vnd.github.v3.raw' },
  });
  if (!res.ok) throw new Error(`Failed to fetch file: ${res.status}`);
  const content = await res.text();
  setCache(cacheKey, content);
  return content;
}

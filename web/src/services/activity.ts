import type { Members, Activities } from '../types';
import { getCache, setCache } from './cache';

const REPO_OWNER = 'TWLS151';
const REPO_NAME = 'Sootudy';
const API_BASE = 'https://api.github.com';
const CACHE_KEY_ACTIVITY = 'sootudy_activity';

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

  // 2026-02-05 이후의 날짜만 필터링
  const startDate = new Date('2026-02-05T00:00:00+09:00');
  const filteredDates = dates.filter(date => {
    const d = new Date(date + 'T00:00:00+09:00');
    return d >= startDate;
  });

  if (filteredDates.length === 0) return 0;
  const dateSet = new Set(filteredDates);

  const now = new Date();
  const kstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  let current = new Date(kstNow);
  current.setHours(0, 0, 0, 0);

  while (isWeekend(current)) {
    current = getPreviousWeekday(current);
  }

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

    // startDate 이전으로는 가지 않음
    if (current < startDate) break;
  }

  return streak;
}

export async function fetchCommitActivity(members: Members): Promise<Activities> {
  const cached = getCache<Activities>(CACHE_KEY_ACTIVITY);
  if (cached) return cached;

  const since = new Date();
  since.setDate(since.getDate() - 84);

  let commits: any[] = [];
  try {
    let res: Response;
    if (import.meta.env.DEV) {
      res = await fetch(
        `${API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/commits?per_page=100&since=${since.toISOString()}`
      );
    } else {
      res = await fetch(`/api/commits?per_page=100&since=${since.toISOString()}`);
    }
    if (res.ok) {
      commits = await res.json();
    }
  } catch {
    console.warn('커밋 데이터 로드 실패');
  }

  const githubToMember: Record<string, string> = {};
  for (const [id, member] of Object.entries(members)) {
    githubToMember[member.github.toLowerCase()] = id;
  }

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

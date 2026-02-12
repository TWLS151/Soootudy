import type { Members, Activities } from '../types';
import { supabase } from '../lib/supabase';
import { getKSTToday } from '../lib/date';

const START_DATE = '2026-02-05';

function isWeekend(dateStr: string): boolean {
  const d = new Date(dateStr + 'T00:00:00Z');
  const day = d.getUTCDay();
  return day === 0 || day === 6;
}

function getPreviousWeekday(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00Z');
  do {
    d.setUTCDate(d.getUTCDate() - 1);
  } while (d.getUTCDay() === 0 || d.getUTCDay() === 6);
  return d.toISOString().split('T')[0];
}

/**
 * 연속 제출 수 계산.
 * 오늘부터 역순으로 평일만 확인하며, 연속으로 제출한 일수를 반환.
 */
export function calculateStreak(dates: string[]): number {
  if (dates.length === 0) return 0;

  const filtered = dates.filter(d => d >= START_DATE);
  if (filtered.length === 0) return 0;

  const dateSet = new Set(filtered);
  let current = getKSTToday();

  // 주말이면 이전 평일로 이동
  while (isWeekend(current)) {
    current = getPreviousWeekday(current);
  }

  // 오늘 제출 안 했으면 이전 평일 확인
  if (!dateSet.has(current)) {
    current = getPreviousWeekday(current);
    if (!dateSet.has(current)) {
      return 0;
    }
  }

  // 역순으로 연속 제출 확인
  let streak = 0;
  while (dateSet.has(current)) {
    streak++;
    current = getPreviousWeekday(current);
    if (current < START_DATE) break;
  }

  return streak;
}

/**
 * Supabase submissions 테이블에서 제출 기록을 조회하여 활동 데이터 계산.
 */
export async function fetchSubmissionActivity(members: Members): Promise<Activities> {
  const { data, error } = await supabase
    .from('submissions')
    .select('member_id, date')
    .gte('date', START_DATE)
    .order('date', { ascending: true });

  if (error || !data) {
    console.warn('제출 기록 로드 실패:', error);
    return {};
  }

  // 멤버별 날짜 그룹핑
  const memberDates: Record<string, string[]> = {};
  for (const row of data) {
    if (!memberDates[row.member_id]) memberDates[row.member_id] = [];
    memberDates[row.member_id].push(row.date);
  }

  const activities: Activities = {};
  for (const id of Object.keys(members)) {
    if (members[id].virtual) continue;
    const dates = memberDates[id] || [];
    activities[id] = {
      dates,
      streak: calculateStreak(dates),
    };
  }

  return activities;
}

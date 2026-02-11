import type { Members, Problem } from '../types';

export const REF_MEMBER_ID = '_ref';

/** 가상(참고 솔루션) 멤버인지 확인 */
export function isVirtualMember(memberId: string, members: Members): boolean {
  return members[memberId]?.virtual === true;
}

/**
 * 현재 유저가 해당 baseName(예: "swea-1234")의 문제를 제출했는지 확인.
 * 참고 솔루션 잠금 해제 조건으로 사용.
 */
export function hasUserSolvedBaseName(
  baseName: string,
  problems: Problem[],
  memberId: string | null,
): boolean {
  if (!memberId) return false;
  return problems.some(
    (p) => p.member === memberId && p.baseName === baseName,
  );
}

/** 실제 멤버만 필터 (사이드바, 통계 등에서 가상 멤버 제외) */
export function getRealMembers(members: Members): Members {
  const result: Members = {};
  for (const [id, member] of Object.entries(members)) {
    if (!member.virtual) {
      result[id] = member;
    }
  }
  return result;
}

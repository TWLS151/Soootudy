import type { ReactNode } from 'react';
import type { Members } from '../types';
import { getRealMembers } from './reference';

/**
 * 댓글 내용에서 @이름 멘션을 파싱하여 하이라이트된 ReactNode로 렌더링
 */
export function renderMentionContent(
  content: string,
  members: Members,
): ReactNode {
  const realMembers = getRealMembers(members);
  const names = Object.values(realMembers).map(m => m.name);

  if (names.length === 0) return content;

  // Sort by length descending to match longer names first
  names.sort((a, b) => b.length - a.length);

  const escaped = names.map(n => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const pattern = new RegExp(`(@(?:${escaped.join('|')}))`, 'g');

  const parts: ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = pattern.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push(content.slice(lastIndex, match.index));
    }
    parts.push(
      <span
        key={match.index}
        className="text-indigo-600 dark:text-indigo-400 font-medium"
      >
        {match[1]}
      </span>
    );
    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex));
  }

  return parts.length > 0 ? <>{parts}</> : content;
}

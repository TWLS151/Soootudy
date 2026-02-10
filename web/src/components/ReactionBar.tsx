import { useState, useRef, useEffect, useMemo } from 'react';
import { SmilePlus } from 'lucide-react';
import type { Reaction } from '../types';

const EMOJI_OPTIONS = ['👍', '❤️', '🎉', '👀', '🚀', '😄'];

interface ReactionBarProps {
  commentId: string;
  reactions: Reaction[];
  currentUserId: string | null;
  onToggle: (emoji: string) => void;
}

export default function ReactionBar({ commentId, reactions, currentUserId, onToggle }: ReactionBarProps) {
  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  // 이모지별 그룹핑
  const grouped = useMemo(() => {
    const map = new Map<string, { count: number; hasReacted: boolean }>();
    for (const r of reactions) {
      if (r.comment_id !== commentId) continue;
      const existing = map.get(r.emoji);
      if (existing) {
        existing.count++;
        if (r.user_id === currentUserId) existing.hasReacted = true;
      } else {
        map.set(r.emoji, { count: 1, hasReacted: r.user_id === currentUserId });
      }
    }
    return map;
  }, [reactions, commentId, currentUserId]);

  // 피커 외부 클릭 시 닫기
  useEffect(() => {
    if (!showPicker) return;
    function handleClick(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowPicker(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showPicker]);

  const hasAnyReactions = grouped.size > 0;

  return (
    <div className="flex items-center gap-1 flex-wrap mt-0.5" onClick={(e) => e.stopPropagation()}>
      {/* 기존 리액션 버블 */}
      {Array.from(grouped.entries())
        .sort((a, b) => EMOJI_OPTIONS.indexOf(a[0]) - EMOJI_OPTIONS.indexOf(b[0]))
        .map(([emoji, { count, hasReacted }]) => (
          <button
            key={emoji}
            onClick={() => onToggle(emoji)}
            className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs border transition-all hover:scale-105 ${
              hasReacted
                ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-700'
                : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
            }`}
          >
            <span>{emoji}</span>
            <span className={`text-[10px] font-medium ${hasReacted ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}>
              {count}
            </span>
          </button>
        ))}

      {/* + 버튼 → 이모지 피커 */}
      {currentUserId && (
        <div className="relative" ref={pickerRef}>
          <button
            onClick={() => setShowPicker(!showPicker)}
            className={`inline-flex items-center justify-center w-6 h-6 rounded-full border transition-colors ${
              hasAnyReactions
                ? 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                : 'border-transparent hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title="리액션 추가"
          >
            <SmilePlus className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
          </button>

          {showPicker && (
            <div className="absolute bottom-full left-0 mb-1 z-50 flex gap-0.5 p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg">
              {EMOJI_OPTIONS.map((emoji) => {
                const existing = grouped.get(emoji);
                return (
                  <button
                    key={emoji}
                    onClick={() => {
                      onToggle(emoji);
                      setShowPicker(false);
                    }}
                    className={`w-8 h-8 flex items-center justify-center rounded-md text-base hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ${
                      existing?.hasReacted ? 'bg-indigo-50 dark:bg-indigo-950/40' : ''
                    }`}
                  >
                    {emoji}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

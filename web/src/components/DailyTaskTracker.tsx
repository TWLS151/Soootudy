import { CheckCircle2, Circle, Code2, MessageSquare } from 'lucide-react';
import type { DailyProblem, Problem } from '../types';

interface DailyTaskTrackerProps {
  dailyProblems: DailyProblem[];
  problems: Problem[];
  currentMemberId: string | null;
  commentCount: number;
  requiredComments: number;
  requiredSubmissions: number;
  loading: boolean;
}

export default function DailyTaskTracker({
  dailyProblems,
  problems,
  currentMemberId,
  commentCount,
  requiredComments,
  requiredSubmissions,
  loading,
}: DailyTaskTrackerProps) {
  if (loading || !currentMemberId) return null;

  const submittedProblems = dailyProblems.map((dp) => {
    const problemName = `${dp.source}-${dp.problem_number}`;
    const submitted = problems.some(
      (p) => p.member === currentMemberId && (p.baseName || p.name) === problemName
    );
    return { ...dp, submitted };
  });

  const submittedCount = submittedProblems.filter((p) => p.submitted).length;
  const submissionsOk = dailyProblems.length === 0 || submittedCount >= Math.min(requiredSubmissions, dailyProblems.length);
  const commentsComplete = commentCount >= requiredComments;
  const allComplete = submissionsOk && commentsComplete;

  return (
    <div
      className={`rounded-xl px-4 py-3 border transition-colors ${
        allComplete
          ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800'
          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700'
      }`}
    >
      <div className="flex items-center gap-4 flex-wrap">
        {/* 라벨 */}
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide shrink-0">
          {allComplete ? '✓ 오늘 할 일 완료' : '오늘의 할 일'}
        </span>
        {!allComplete && (
          <span className="text-[11px] text-slate-400 dark:text-slate-500 shrink-0">
            오늘 자정까지
          </span>
        )}

        <div className="flex items-center gap-3 flex-wrap flex-1">
          {/* 코드 제출 */}
          <div className="flex items-center gap-1.5">
            {submissionsOk ? (
              <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
            ) : (
              <Circle className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0" />
            )}
            <Code2 className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
            <span
              className={`text-sm ${
                submissionsOk
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-slate-700 dark:text-slate-300'
              }`}
            >
              코드 제출
            </span>
            <span
              className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                submissionsOk
                  ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
              }`}
            >
              {submittedCount}/{Math.min(requiredSubmissions, dailyProblems.length)}
            </span>
          </div>

          <span className="text-slate-200 dark:text-slate-700 select-none">|</span>

          {/* 댓글 */}
          <div className="flex items-center gap-1.5">
            {commentsComplete ? (
              <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
            ) : (
              <Circle className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0" />
            )}
            <MessageSquare className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
            <span
              className={`text-sm ${
                commentsComplete
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-slate-700 dark:text-slate-300'
              }`}
            >
              댓글
            </span>
            <span
              className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                commentsComplete
                  ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400'
                  : 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-400'
              }`}
            >
              {commentCount}/{requiredComments}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

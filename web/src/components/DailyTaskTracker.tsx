import { CheckCircle2, Circle } from 'lucide-react';
import type { DailyProblem, Problem } from '../types';

interface DailyTaskTrackerProps {
  dailyProblems: DailyProblem[];
  problems: Problem[];
  currentMemberId: string | null;
  commentCount: number;
  requiredComments: number;
  loading: boolean;
}

export default function DailyTaskTracker({
  dailyProblems,
  problems,
  currentMemberId,
  commentCount,
  requiredComments,
  loading,
}: DailyTaskTrackerProps) {
  if (loading || !currentMemberId) return null;

  // 각 daily problem별 제출 여부 확인
  const submittedProblems = dailyProblems.map((dp) => {
    const problemName = `${dp.source}-${dp.problem_number}`;
    const submitted = problems.some(
      (p) => p.member === currentMemberId && (p.baseName || p.name) === problemName
    );
    return { ...dp, submitted };
  });

  const allSubmitted = dailyProblems.length > 0 && submittedProblems.every((p) => p.submitted);
  const commentsComplete = commentCount >= requiredComments;
  const allComplete = allSubmitted && commentsComplete;

  return (
    <div
      className={`rounded-xl p-4 border transition-colors ${
        allComplete
          ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800'
          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700'
      }`}
    >
      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
        {allComplete && <CheckCircle2 className="w-4 h-4 text-green-500" />}
        오늘의 할 일
      </h3>

      <div className="space-y-2.5">
        {/* 코드 올리기 */}
        {dailyProblems.length > 0 && (
          <div className="flex items-start gap-2">
            {allSubmitted ? (
              <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
            ) : (
              <Circle className="w-4 h-4 text-slate-300 dark:text-slate-600 mt-0.5 shrink-0" />
            )}
            <div>
              <p
                className={`text-sm ${
                  allSubmitted
                    ? 'text-green-700 dark:text-green-400 line-through'
                    : 'text-slate-700 dark:text-slate-300'
                }`}
              >
                오늘의 문제 코드 올리기
              </p>
              <div className="flex flex-wrap gap-1 mt-1">
                {submittedProblems.map((sp) => (
                  <span
                    key={sp.id}
                    className={`text-xs px-1.5 py-0.5 rounded ${
                      sp.submitted
                        ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {sp.source.toUpperCase()} {sp.problem_number}
                    {sp.submitted ? ' \u2713' : ''}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 댓글 달기 */}
        <div className="flex items-center gap-2">
          {commentsComplete ? (
            <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
          ) : (
            <Circle className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0" />
          )}
          <p
            className={`text-sm ${
              commentsComplete
                ? 'text-green-700 dark:text-green-400 line-through'
                : 'text-slate-700 dark:text-slate-300'
            }`}
          >
            다른 사람 코드에 댓글 달기
          </p>
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
  );
}

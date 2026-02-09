import { useState, useEffect, useMemo } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { Shield, Plus, Trash2, Calendar, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import SourceBadge from '../components/SourceBadge';
import { supabase } from '../lib/supabase';
import { getKSTToday } from '../lib/date';
import type { Members, Problem, DailyProblem } from '../types';
import type { User } from '@supabase/supabase-js';

interface Context {
  members: Members;
  problems: Problem[];
  user: User;
}

type Source = 'swea' | 'boj' | 'etc';

export default function AdminPage() {
  const { members, user } = useOutletContext<Context>();
  const navigate = useNavigate();

  // Admin check
  const githubUsername = user?.user_metadata?.user_name || user?.user_metadata?.preferred_username;
  const currentMemberId = useMemo(() => {
    for (const [id, member] of Object.entries(members)) {
      if (member.github.toLowerCase() === githubUsername?.toLowerCase()) return id;
    }
    return null;
  }, [members, githubUsername]);

  const isAdmin = currentMemberId ? members[currentMemberId]?.admin === true : false;

  useEffect(() => {
    if (Object.keys(members).length > 0 && !isAdmin) {
      navigate('/', { replace: true });
    }
  }, [isAdmin, members, navigate]);

  // State
  const [allProblems, setAllProblems] = useState<DailyProblem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Add form
  const [showForm, setShowForm] = useState(false);
  const [formDate, setFormDate] = useState(() => getKSTToday());
  const [formSource, setFormSource] = useState<Source>('swea');
  const [formNumber, setFormNumber] = useState('');
  const [formTitle, setFormTitle] = useState('');

  // Calendar navigation
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  useEffect(() => {
    if (isAdmin) loadAllProblems();
  }, [isAdmin]);

  async function loadAllProblems() {
    try {
      const { data, error } = await supabase
        .from('daily_problem')
        .select('*')
        .order('date', { ascending: true })
        .order('created_at', { ascending: true });

      if (error) throw error;
      setAllProblems(data || []);
    } catch (error) {
      console.error('Failed to load problems:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!formNumber.trim() || !formTitle.trim() || submitting) return;

    setSubmitting(true);
    try {
      const { error } = await supabase.from('daily_problem').insert({
        date: formDate,
        source: formSource,
        problem_number: formNumber.trim(),
        problem_title: formTitle.trim(),
        created_by: user.id,
      });

      if (error) throw error;
      setFormNumber('');
      setFormTitle('');
      setShowForm(false);
      await loadAllProblems();
    } catch (error) {
      console.error('Failed to add problem:', error);
      alert('문제 추가에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (deleteId === id) {
      // Confirm delete
      try {
        const { error } = await supabase.from('daily_problem').delete().eq('id', id);
        if (error) throw error;
        setAllProblems((prev) => prev.filter((p) => p.id !== id));
      } catch (error) {
        console.error('Failed to delete problem:', error);
        alert('삭제에 실패했습니다.');
      }
      setDeleteId(null);
    } else {
      setDeleteId(id);
      // Auto-cancel after 3s
      setTimeout(() => setDeleteId((prev) => (prev === id ? null : prev)), 3000);
    }
  }

  // Group problems by date
  const today = getKSTToday();

  const problemsByDate = useMemo(() => {
    const map = new Map<string, DailyProblem[]>();
    for (const p of allProblems) {
      const existing = map.get(p.date);
      if (existing) existing.push(p);
      else map.set(p.date, [p]);
    }
    return map;
  }, [allProblems]);

  const futureProblems = useMemo(
    () => allProblems.filter((p) => p.date > today),
    [allProblems, today]
  );

  const todayProblems = useMemo(
    () => allProblems.filter((p) => p.date === today),
    [allProblems, today]
  );

  const pastProblems = useMemo(
    () => allProblems.filter((p) => p.date < today).reverse(),
    [allProblems, today]
  );

  // Calendar helpers
  const calendarDays = useMemo(() => {
    const { year, month } = calendarMonth;
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: (number | null)[] = [];

    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  }, [calendarMonth]);

  const monthLabel = new Date(calendarMonth.year, calendarMonth.month).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
  });

  function prevMonth() {
    setCalendarMonth((prev) => {
      const d = new Date(prev.year, prev.month - 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  }

  function nextMonth() {
    setCalendarMonth((prev) => {
      const d = new Date(prev.year, prev.month + 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  }

  if (!isAdmin) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="w-24 h-24">
          <DotLottieReact src="/cat.lottie" loop autoplay />
        </div>
        <p className="text-sm text-slate-400 dark:text-slate-500 mt-2 animate-pulse">불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 헤더 */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
          <Shield className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">관리자</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">오늘의 문제 관리 및 예약</p>
        </div>
      </div>

      {/* 캘린더 뷰 */}
      <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-slate-500 dark:text-slate-400" />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">문제 캘린더</h2>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300 w-28 text-center">{monthLabel}</span>
            <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 mb-1">
          {['일', '월', '화', '수', '목', '금', '토'].map((d) => (
            <div key={d} className="text-center text-xs font-medium text-slate-400 dark:text-slate-500 py-2">
              {d}
            </div>
          ))}
        </div>

        {/* 날짜 그리드 */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, i) => {
            if (day === null) return <div key={`empty-${i}`} />;

            const dateStr = `${calendarMonth.year}-${String(calendarMonth.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayProblems = problemsByDate.get(dateStr) || [];
            const isToday = dateStr === today;
            const isFuture = dateStr > today;

            return (
              <button
                key={day}
                onClick={() => {
                  setFormDate(dateStr);
                  setShowForm(true);
                }}
                className={`relative p-1.5 rounded-lg text-sm min-h-[3.5rem] flex flex-col items-center transition-colors ${
                  isToday
                    ? 'bg-indigo-50 dark:bg-indigo-950/40 ring-1 ring-indigo-300 dark:ring-indigo-700'
                    : isFuture
                      ? 'hover:bg-blue-50 dark:hover:bg-blue-950/20'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <span
                  className={`text-xs ${
                    isToday
                      ? 'font-bold text-indigo-600 dark:text-indigo-400'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {day}
                </span>
                {dayProblems.length > 0 && (
                  <div className="flex gap-0.5 mt-1 flex-wrap justify-center">
                    {dayProblems.slice(0, 3).map((p) => (
                      <span
                        key={p.id}
                        className={`w-1.5 h-1.5 rounded-full ${
                          p.source === 'swea'
                            ? 'bg-blue-500'
                            : p.source === 'boj'
                              ? 'bg-green-500'
                              : 'bg-slate-400'
                        }`}
                        title={p.problem_title}
                      />
                    ))}
                    {dayProblems.length > 3 && (
                      <span className="text-[8px] text-slate-400">+{dayProblems.length - 3}</span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* 문제 추가 폼 */}
      {showForm && (
        <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
            문제 추가 — {new Date(formDate + 'T00:00:00').toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              weekday: 'short',
            })}
          </h2>
          <form onSubmit={handleAdd} className="space-y-4">
            {/* 날짜 */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">날짜</label>
              <input
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm"
              />
            </div>

            {/* 출처 */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">출처</label>
              <div className="flex gap-2">
                {(['swea', 'boj', 'etc'] as Source[]).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      setFormSource(s);
                      setFormNumber('');
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      formSource === s
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {s === 'swea' ? 'SWEA' : s === 'boj' ? 'BOJ' : '기타'}
                  </button>
                ))}
              </div>
            </div>

            {/* 문제번호/이름 */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                {formSource === 'etc' ? '문제 이름' : '문제 번호'}
              </label>
              <input
                type="text"
                value={formNumber}
                onChange={(e) => {
                  if (formSource === 'etc') {
                    setFormNumber(e.target.value.replace(/[^가-힣ㄱ-ㅎㅏ-ㅣa-zA-Z0-9- ]/g, ''));
                  } else {
                    setFormNumber(e.target.value.replace(/\D/g, ''));
                  }
                }}
                placeholder={formSource === 'etc' ? '이분탐색연습' : '6001'}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm"
              />
            </div>

            {/* 문제 제목 */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">문제 제목</label>
              <input
                type="text"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="예) 그래프 탐색, 이분 탐색 연습"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={submitting || !formNumber.trim() || !formTitle.trim()}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                {submitting ? '추가 중...' : '추가'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-lg text-sm font-medium transition-colors"
              >
                취소
              </button>
            </div>
          </form>
        </section>
      )}

      {/* 추가 버튼 (폼 닫혀있을 때) */}
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-indigo-400 dark:hover:border-indigo-600 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span className="text-sm font-medium">문제 추가</span>
        </button>
      )}

      {/* 예약된 문제 (미래) */}
      {futureProblems.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-blue-500" />
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">예약된 문제</h2>
            <span className="text-xs text-slate-400 dark:text-slate-500">{futureProblems.length}개</span>
          </div>
          <div className="space-y-2">
            {futureProblems.map((problem) => (
              <ProblemRow
                key={problem.id}
                problem={problem}
                deleteId={deleteId}
                onDelete={handleDelete}
                variant="future"
              />
            ))}
          </div>
        </section>
      )}

      {/* 오늘의 문제 */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-indigo-500" />
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">오늘의 문제</h2>
          <span className="text-xs text-slate-400 dark:text-slate-500">{todayProblems.length}개</span>
        </div>
        {todayProblems.length === 0 ? (
          <p className="text-sm text-slate-400 dark:text-slate-500 py-4 text-center">
            오늘 등록된 문제가 없습니다.
          </p>
        ) : (
          <div className="space-y-2">
            {todayProblems.map((problem) => (
              <ProblemRow
                key={problem.id}
                problem={problem}
                deleteId={deleteId}
                onDelete={handleDelete}
                variant="today"
              />
            ))}
          </div>
        )}
      </section>

      {/* 지난 문제 */}
      {pastProblems.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">지난 문제</h2>
            <span className="text-xs text-slate-400 dark:text-slate-500">{pastProblems.length}개</span>
          </div>
          <div className="space-y-2">
            {pastProblems.map((problem) => (
              <ProblemRow
                key={problem.id}
                problem={problem}
                deleteId={deleteId}
                onDelete={handleDelete}
                variant="past"
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function ProblemRow({
  problem,
  deleteId,
  onDelete,
  variant,
}: {
  problem: DailyProblem;
  deleteId: string | null;
  onDelete: (id: string) => void;
  variant: 'future' | 'today' | 'past';
}) {
  const dateLabel = new Date(problem.date + 'T00:00:00').toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric',
    weekday: 'short',
  });

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-lg border ${
        variant === 'today'
          ? 'bg-indigo-50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-800'
          : variant === 'future'
            ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800'
            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
      }`}
    >
      <span className="text-xs text-slate-500 dark:text-slate-400 w-16 shrink-0">{dateLabel}</span>
      <SourceBadge source={problem.source} />
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate block">
          {problem.problem_title}
        </span>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {problem.source.toUpperCase()} {problem.problem_number}
        </span>
      </div>
      <button
        onClick={() => onDelete(problem.id)}
        className={`p-1.5 rounded-lg transition-colors shrink-0 ${
          deleteId === problem.id
            ? 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400'
            : 'hover:bg-red-50 dark:hover:bg-red-950/30 text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400'
        }`}
        title={deleteId === problem.id ? '한번 더 클릭하면 삭제됩니다' : '삭제'}
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

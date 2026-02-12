import { useState, useEffect, useMemo } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { Shield, Plus, Trash2, Calendar, Sparkles, ChevronLeft, ChevronRight, Settings, Users, CheckCircle2, MessageSquare, Code2, BookOpen } from 'lucide-react';
import Editor from '@monaco-editor/react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import SourceBadge from '../components/SourceBadge';
import { supabase } from '../lib/supabase';
import { getKSTToday } from '../lib/date';
import { useStudyConfig } from '../hooks/useStudyConfig';
import { useAllMembersProgress } from '../hooks/useAllMembersProgress';
import { getRealMembers } from '../lib/reference';
import type { Members, Problem, DailyProblem } from '../types';
import type { User } from '@supabase/supabase-js';

interface Context {
  members: Members;
  problems: Problem[];
  user: User;
  dark: boolean;
}

type Source = 'swea' | 'boj' | 'etc';

export default function AdminPage() {
  const { members, problems, user, dark } = useOutletContext<Context>();
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

  // Study config
  const { config, updateConfig } = useStudyConfig();
  const [commentCount, setCommentCount] = useState(3);
  const [submissionCount, setSubmissionCount] = useState(1);
  const [configSaving, setConfigSaving] = useState(false);

  // 현황 날짜 선택
  const [statusDate, setStatusDate] = useState(() => getKSTToday());

  // 전체 팀원 댓글 현황
  const { progressMap, loading: progressLoading } = useAllMembersProgress(members, statusDate);

  useEffect(() => {
    if (config) {
      setCommentCount(config.required_comments);
      setSubmissionCount(config.required_submissions ?? 1);
    }
  }, [config]);

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
  const [formUrl, setFormUrl] = useState('');

  // Reference solution form
  const [showRefForm, setShowRefForm] = useState(false);
  const [refSource, setRefSource] = useState<Source>('swea');
  const [refNumber, setRefNumber] = useState('');
  const [refCode, setRefCode] = useState('');
  const [refSubmitting, setRefSubmitting] = useState(false);
  const [refError, setRefError] = useState<string | null>(null);
  const [refSuccess, setRefSuccess] = useState(false);

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
      const insertData: Record<string, unknown> = {
        date: formDate,
        source: formSource,
        problem_number: formNumber.trim(),
        problem_title: formTitle.trim(),
        created_by: user.id,
      };
      if (formUrl.trim()) {
        insertData.problem_url = formUrl.trim();
      }

      const { error } = await supabase.from('daily_problem').insert(insertData);

      if (error) throw error;
      setFormNumber('');
      setFormTitle('');
      setFormUrl('');
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

  async function handleRefSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!refNumber.trim() || !refCode.trim() || refSubmitting) return;

    setRefSubmitting(true);
    setRefError(null);
    setRefSuccess(false);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('로그인이 필요합니다.');

      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          source: refSource,
          problemNumber: refNumber.trim(),
          code: refCode,
          targetMember: '_ref',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '업로드에 실패했습니다.');

      setRefSuccess(true);
      setRefCode('');
      setRefNumber('');
      // 캐시 삭제
      try {
        sessionStorage.removeItem('sootudy_tree');
      } catch { /* ignore */ }
    } catch (err) {
      setRefError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setRefSubmitting(false);
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

  // 현황 섹션에 표시할 문제 (선택된 날짜 기준)
  const statusProblems = useMemo(
    () => allProblems.filter((p) => p.date === statusDate),
    [allProblems, statusDate]
  );

  const isStatusToday = statusDate === today;

  const statusDateLabel = new Date(statusDate + 'T00:00:00').toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  });

  // 가장 이른 날짜 (이전 버튼 비활성화용)
  const earliestDate = useMemo(() => {
    if (allProblems.length === 0) return null;
    return allProblems[0].date;
  }, [allProblems]);

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

      {/* 스터디 설정 */}
      <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Settings className="w-5 h-5 text-slate-500 dark:text-slate-400" />
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">스터디 설정</h2>
        </div>

        <div className="space-y-4">
          {/* 일일 필수 댓글 수 */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                일일 필수 댓글 수
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                각 팀원이 하루에 작성해야 하는 최소 댓글 수
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCommentCount(Math.max(1, commentCount - 1))}
                className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold text-lg transition-colors"
              >
                -
              </button>
              <span className="w-8 text-center text-lg font-bold text-indigo-600 dark:text-indigo-400">
                {commentCount}
              </span>
              <button
                onClick={() => setCommentCount(commentCount + 1)}
                className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold text-lg transition-colors"
              >
                +
              </button>
              {config && commentCount !== config.required_comments && (
                <button
                  onClick={async () => {
                    setConfigSaving(true);
                    try {
                      await updateConfig({ required_comments: commentCount });
                    } catch {
                      alert('설정 저장에 실패했습니다.');
                    } finally {
                      setConfigSaving(false);
                    }
                  }}
                  disabled={configSaving}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  {configSaving ? '저장 중...' : '저장'}
                </button>
              )}
            </div>
          </div>

          {/* 일일 필수 제출 수 */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                일일 필수 제출 수
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                각 팀원이 하루에 제출해야 하는 최소 코드 개수
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSubmissionCount(Math.max(1, submissionCount - 1))}
                className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold text-lg transition-colors"
              >
                -
              </button>
              <span className="w-8 text-center text-lg font-bold text-indigo-600 dark:text-indigo-400">
                {submissionCount}
              </span>
              <button
                onClick={() => setSubmissionCount(submissionCount + 1)}
                className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold text-lg transition-colors"
              >
                +
              </button>
              {config && submissionCount !== (config.required_submissions ?? 1) && (
                <button
                  onClick={async () => {
                    setConfigSaving(true);
                    try {
                      await updateConfig({ required_submissions: submissionCount });
                    } catch {
                      alert('설정 저장에 실패했습니다.');
                    } finally {
                      setConfigSaving(false);
                    }
                  }}
                  disabled={configSaving}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  {configSaving ? '저장 중...' : '저장'}
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 일일 현황 */}
      <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-slate-500 dark:text-slate-400" />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {isStatusToday ? '오늘의 현황' : '일일 현황'}
            </h2>
            {!progressLoading && (() => {
              const requiredComments = config?.required_comments ?? 3;
              const requiredSubmissions = config?.required_submissions ?? 1;
              const incomplete = Object.entries(getRealMembers(members)).filter(([id]) => {
                const memberComments = progressMap.get(id) ?? 0;
                const commentsOk = memberComments >= requiredComments;
                const submittedCount = statusProblems.filter((dp) => {
                  const problemNumber = dp.source === 'etc' ? dp.problem_number.replace(/ /g, '_') : dp.problem_number;
                  const problemName = `${dp.source}-${problemNumber}`;
                  return problems.some((p) => p.member === id && (p.baseName || p.name) === problemName);
                }).length;
                const submissionsOk = statusProblems.length === 0 || submittedCount >= Math.min(requiredSubmissions, statusProblems.length);
                return !commentsOk || !submissionsOk;
              });
              return incomplete.length > 0 ? (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400">
                  미완료 {incomplete.length}명
                </span>
              ) : (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400">
                  모두 완료
                </span>
              );
            })()}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const d = new Date(statusDate + 'T12:00:00');
                d.setDate(d.getDate() - 1);
                const prev = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                setStatusDate(prev);
              }}
              disabled={!earliestDate || statusDate <= earliestDate}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setStatusDate(today)}
              className={`text-sm font-medium px-2 py-1 rounded-lg transition-colors ${
                isStatusToday
                  ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {statusDateLabel}
            </button>
            <button
              onClick={() => {
                const d = new Date(statusDate + 'T12:00:00');
                d.setDate(d.getDate() + 1);
                const next = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                if (next <= today) setStatusDate(next);
              }}
              disabled={isStatusToday}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {progressLoading ? (
          <div className="flex justify-center py-4">
            <div className="w-12 h-12">
              <DotLottieReact src="/cat.lottie" loop autoplay />
            </div>
          </div>
        ) : statusProblems.length === 0 && (config?.required_comments ?? 3) === 0 ? (
          <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-4">
            {isStatusToday ? '오늘 등록된 과제가 없습니다.' : '해당 날짜에 등록된 과제가 없습니다.'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="text-left py-2 px-2 text-xs font-medium text-slate-500 dark:text-slate-400">팀원</th>
                  <th className="text-center py-2 px-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                    <div className="flex items-center justify-center gap-1">
                      <Code2 className="w-3.5 h-3.5" />
                      코드 제출
                    </div>
                  </th>
                  <th className="text-center py-2 px-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                    <div className="flex items-center justify-center gap-1">
                      <MessageSquare className="w-3.5 h-3.5" />
                      댓글
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(getRealMembers(members)).map(([id, member]) => {
                  const memberComments = progressMap.get(id) ?? 0;
                  const requiredComments = config?.required_comments ?? 3;
                  const requiredSubmissions = config?.required_submissions ?? 1;
                  const commentsOk = memberComments >= requiredComments;

                  const submittedCount = statusProblems.filter((dp) => {
                    // etc 문제의 경우 공백을 언더스코어로 치환하여 매칭
                    const problemNumber = dp.source === 'etc' ? dp.problem_number.replace(/ /g, '_') : dp.problem_number;
                    const problemName = `${dp.source}-${problemNumber}`;
                    return problems.some((p) => p.member === id && (p.baseName || p.name) === problemName);
                  }).length;
                  const submissionsOk = statusProblems.length === 0 || submittedCount >= Math.min(requiredSubmissions, statusProblems.length);
                  const allComplete = submissionsOk && commentsOk;

                  return (
                    <tr
                      key={id}
                      className={`border-b last:border-b-0 border-slate-100 dark:border-slate-800 ${
                        allComplete ? 'bg-green-50/50 dark:bg-green-950/10' : ''
                      }`}
                    >
                      <td className="py-2 px-2">
                        <div className="flex items-center gap-2">
                          <img
                            src={`https://github.com/${member.github}.png?size=24`}
                            alt={member.name}
                            className="w-5 h-5 rounded-full"
                          />
                          <span className="font-medium text-slate-700 dark:text-slate-300 text-xs">
                            {member.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-2 px-2 text-center">
                        {statusProblems.length === 0 ? (
                          <span className="text-xs text-slate-400">-</span>
                        ) : submissionsOk ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500 mx-auto" />
                        ) : (
                          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                            {submittedCount}/{Math.min(requiredSubmissions, statusProblems.length)}
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-2 text-center">
                        {commentsOk ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500 mx-auto" />
                        ) : (
                          <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                            {memberComments}/{requiredComments}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

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

            {/* 문제 URL (선택) */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                문제 URL <span className="text-slate-400 font-normal">(선택)</span>
              </label>
              <input
                type="url"
                value={formUrl}
                onChange={(e) => setFormUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm"
              />
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                SWEA/BOJ는 자동 생성됩니다. 기타 문제는 여기에 직접 입력하세요.
              </p>
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

      {/* 참고 솔루션 업로드 */}
      <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-purple-500 dark:text-purple-400" />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">참고 솔루션</h2>
          </div>
          {!showRefForm && (
            <button
              onClick={() => { setShowRefForm(true); setRefSuccess(false); setRefError(null); }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              업로드
            </button>
          )}
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          AI 풀이, 모범 답안 등 참고 솔루션을 업로드합니다. 팀원이 해당 문제를 먼저 제출해야 열람할 수 있습니다.
        </p>

        {refSuccess && (
          <div className="mb-4 p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 text-sm text-green-700 dark:text-green-300">
            참고 솔루션이 업로드되었습니다!
          </div>
        )}
        {refError && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-300">
            {refError}
          </div>
        )}

        {showRefForm && (
          <form onSubmit={handleRefSubmit} className="space-y-4">
            {/* 출처 */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">출처</label>
              <div className="flex gap-2">
                {(['swea', 'boj', 'etc'] as Source[]).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => { setRefSource(s); setRefNumber(''); }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      refSource === s
                        ? 'bg-purple-600 text-white'
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
                {refSource === 'etc' ? '문제 이름' : '문제 번호'}
              </label>
              <input
                type="text"
                value={refNumber}
                onChange={(e) => {
                  if (refSource === 'etc') {
                    setRefNumber(e.target.value.replace(/[^가-힣ㄱ-ㅎㅏ-ㅣa-zA-Z0-9- ]/g, ''));
                  } else {
                    setRefNumber(e.target.value.replace(/\D/g, ''));
                  }
                }}
                placeholder={refSource === 'etc' ? '이분탐색연습' : '6001'}
                className="w-full max-w-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm"
              />
            </div>

            {/* 코드 에디터 */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">코드</label>
              <div className="rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                <Editor
                  height="300px"
                  language="python"
                  theme={dark ? 'vs-dark' : 'light'}
                  value={refCode}
                  onChange={(v) => setRefCode(v || '')}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    lineNumbers: 'on',
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    tabSize: 4,
                    wordWrap: 'on',
                  }}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={refSubmitting || !refNumber.trim() || !refCode.trim()}
                className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                {refSubmitting ? '업로드 중...' : '참고 솔루션 업로드'}
              </button>
              <button
                type="button"
                onClick={() => setShowRefForm(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-lg text-sm font-medium transition-colors"
              >
                취소
              </button>
            </div>
          </form>
        )}
      </section>

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

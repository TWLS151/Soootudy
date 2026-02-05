import { useState, useMemo, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { Upload, AlertCircle, CheckCircle, FileCode } from 'lucide-react';
import Editor from '@monaco-editor/react';
import { supabase } from '../lib/supabase';
import type { Members, Problem, Activities } from '../types';

interface Context {
  members: Members;
  problems: Problem[];
  dark: boolean;
  activities: Activities;
  weeks: string[];
}

function getCurrentWeek(): string {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const year = kst.getUTCFullYear() % 100;
  const month = kst.getUTCMonth() + 1;
  const date = kst.getUTCDate();
  const weekNum = Math.ceil(date / 7);

  const yy = String(year).padStart(2, '0');
  const mm = String(month).padStart(2, '0');
  return `${yy}-${mm}-w${weekNum}`;
}

export default function SubmitPage() {
  const { members, dark } = useOutletContext<Context>();
  const navigate = useNavigate();

  const [source, setSource] = useState<'swea' | 'boj'>('swea');
  const [problemNumber, setProblemNumber] = useState('');
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [memberId, setMemberId] = useState<string | null>(null);
  const [memberName, setMemberName] = useState<string>('');

  const currentWeek = useMemo(() => getCurrentWeek(), []);

  // 현재 로그인한 유저의 memberId 찾기
  useEffect(() => {
    async function resolveMember() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const githubUsername =
        user.user_metadata?.user_name || user.user_metadata?.preferred_username;
      if (!githubUsername) return;

      for (const [id, member] of Object.entries(members)) {
        if (member.github.toLowerCase() === githubUsername.toLowerCase()) {
          setMemberId(id);
          setMemberName(member.name);
          break;
        }
      }
    }

    if (Object.keys(members).length > 0) {
      resolveMember();
    }
  }, [members]);

  const filePath = useMemo(() => {
    if (!memberId || !problemNumber) return null;
    return `${memberId}/${currentWeek}/${source}-${problemNumber}.py`;
  }, [memberId, currentWeek, source, problemNumber]);

  const canSubmit = code.trim().length > 0 && problemNumber.length > 0 && !submitting;

  async function handleSubmit(overwrite = false) {
    setError(null);
    setSubmitting(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        setError('로그인이 필요합니다.');
        return;
      }

      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ source, problemNumber, code, overwrite }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409) {
          const confirmOverwrite = window.confirm(
            '이미 같은 파일이 존재합니다. 덮어쓰시겠습니까?',
          );
          if (confirmOverwrite) {
            await handleSubmit(true);
            return;
          }
          setSubmitting(false);
          return;
        }
        throw new Error(data.error || '제출에 실패했습니다.');
      }

      // 캐시 삭제
      try {
        sessionStorage.removeItem('sootudy_tree');
        sessionStorage.removeItem('sootudy_activity');
      } catch {
        // sessionStorage 사용 불가 시 무시
      }

      setSuccess(true);

      // 문제 페이지로 이동
      setTimeout(() => {
        navigate(`/problem/${data.memberId}/${data.week}/${data.name}`);
      }, 1500);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
          <Upload className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            코드 제출
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            코드를 붙여넣으면 GitHub에 자동으로 업로드됩니다
          </p>
        </div>
      </div>

      {/* 성공 메시지 */}
      {success && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
          <p className="text-sm text-green-700 dark:text-green-300">
            코드가 성공적으로 제출되었습니다! 문제 페이지로 이동합니다...
          </p>
        </div>
      )}

      {/* 에러 메시지 */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* 폼 */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6 space-y-5">
        {/* 유저 정보 + 주차 */}
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-sm">
            <span className="text-slate-500 dark:text-slate-400">제출자</span>
            <span className="font-medium text-slate-900 dark:text-white">
              {memberName || '확인 중...'}
            </span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-sm">
            <span className="text-slate-500 dark:text-slate-400">주차</span>
            <span className="font-medium text-slate-900 dark:text-white">
              {currentWeek}
            </span>
          </div>
        </div>

        {/* 출처 선택 */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            출처
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setSource('swea')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                source === 'swea'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              SWEA
            </button>
            <button
              type="button"
              onClick={() => setSource('boj')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                source === 'boj'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              BOJ
            </button>
          </div>
        </div>

        {/* 문제번호 */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            문제번호
          </label>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={problemNumber}
            onChange={(e) => setProblemNumber(e.target.value.replace(/\D/g, ''))}
            placeholder="예: 6001"
            className="w-full max-w-xs px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        {/* 파일 경로 미리보기 */}
        {filePath && (
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <FileCode className="w-4 h-4" />
            <span>
              파일 경로:{' '}
              <code className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded text-xs font-mono text-slate-700 dark:text-slate-300">
                {filePath}
              </code>
            </span>
          </div>
        )}

        {/* Monaco Editor */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            코드
          </label>
          <div className="rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
            <Editor
              height="500px"
              language="python"
              theme={dark ? 'vs-dark' : 'light'}
              value={code}
              onChange={(value) => setCode(value || '')}
              loading={
                <div className="flex items-center justify-center h-[500px] bg-slate-50 dark:bg-slate-800">
                  <div className="w-8 h-8 border-4 border-indigo-200 dark:border-indigo-800 border-t-indigo-600 dark:border-t-indigo-400 rounded-full animate-spin" />
                </div>
              }
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

        {/* 제출 버튼 */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => handleSubmit()}
            disabled={!canSubmit}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
          >
            <Upload className="w-5 h-5" />
            {submitting ? '제출 중...' : '제출하기'}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-6 py-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 font-medium rounded-lg transition-colors"
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
}

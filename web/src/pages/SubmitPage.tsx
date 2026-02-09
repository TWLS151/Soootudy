import { useState, useMemo, useEffect, useRef } from 'react';
import { useOutletContext, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Upload, Pencil, AlertCircle, FileCode, ExternalLink } from 'lucide-react';
import Editor from '@monaco-editor/react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import confetti from 'canvas-confetti';
import { supabase } from '../lib/supabase';
import { fetchFileContent } from '../services/github';
import { parseVersionFromName } from '../services/parser';
import type { Members, Problem, Activities } from '../types';

const SUCCESS_MESSAGES = [
  '코드가 날아갔습니다!',
  'GitHub가 감동받았습니다!',
  '수고했어 오늘도!',
  '멋진 코드네요!',
  '제출 완료! 오늘도 한 문제 클리어!',
  'Git push 성공! 커밋 로그가 빛나고 있어요',
  '알고리즘 마스터에 한 걸음 더!',
];

interface Context {
  members: Members;
  problems: Problem[];
  dark: boolean;
  activities: Activities;
  weeks: string[];
  addProblem: (problem: Problem) => void;
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
  const { members, dark, addProblem } = useOutletContext<Context>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // 편집 모드: /submit?edit=memberId/week/name
  const editParam = searchParams.get('edit');
  const isEditMode = !!editParam;

  // 프리셋 모드: /submit?source=swea&number=6001
  const presetSource = searchParams.get('source') as 'swea' | 'boj' | 'etc' | null;
  const presetNumber = searchParams.get('number');

  const editParts = useMemo(() => {
    if (!editParam) return null;
    const parts = editParam.split('/');
    if (parts.length !== 3) return null;
    const [eMemberId, eWeek, eName] = parts;
    // swea-1234, boj-5678, etc-이름 등 매칭
    const match = eName.match(/^(swea|boj|etc)-(.+?)(-v\d+)?$/);
    if (!match) return null;
    return { memberId: eMemberId, week: eWeek, source: match[1] as 'swea' | 'boj' | 'etc', problemNumber: match[2], fullName: eName };
  }, [editParam]);

  const [source, setSource] = useState<'swea' | 'boj' | 'etc'>(editParts?.source || presetSource || 'swea');
  const [problemNumber, setProblemNumber] = useState(editParts?.problemNumber || presetNumber || '');
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{ memberId: string; week: string; name: string } | null>(null);
  const [successMessage] = useState(() => SUCCESS_MESSAGES[Math.floor(Math.random() * SUCCESS_MESSAGES.length)]);
  const [memberId, setMemberId] = useState<string | null>(null);
  const [memberName, setMemberName] = useState<string>('');
  const [loadingCode, setLoadingCode] = useState(isEditMode);
  const confettiFired = useRef(false);

  const editWeek = editParts?.week;
  const currentWeek = useMemo(() => getCurrentWeek(), []);
  const displayWeek = editWeek || currentWeek;

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

  // 편집 모드: 기존 코드 불러오기
  useEffect(() => {
    if (!isEditMode || !editParts) return;

    async function loadExistingCode() {
      try {
        const path = `${editParts!.memberId}/${editParts!.week}/${editParts!.fullName}.py`;
        const content = await fetchFileContent(path);
        setCode(content);
      } catch {
        setError('기존 코드를 불러올 수 없습니다.');
      } finally {
        setLoadingCode(false);
      }
    }

    loadExistingCode();
  }, [isEditMode, editParts]);

  const filePath = useMemo(() => {
    if (!memberId || !problemNumber) return null;
    if (isEditMode && editParts) {
      return `${editParts.memberId}/${editParts.week}/${editParts.fullName}.py`;
    }
    const displayNumber = source === 'etc' ? problemNumber.replace(/ /g, '_') : problemNumber;
    return `${memberId}/${displayWeek}/${source}-${displayNumber}-v?.py`;
  }, [memberId, displayWeek, source, problemNumber, isEditMode, editParts]);


  const canSubmit = code.trim().length > 0 && problemNumber.length > 0 && !submitting && !loadingCode;

  // 성공 시 컨페티 발사
  useEffect(() => {
    if (successData && !confettiFired.current) {
      confettiFired.current = true;
      const duration = 2000;
      const end = Date.now() + duration;
      const frame = () => {
        confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0 } });
        confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1 } });
        if (Date.now() < end) requestAnimationFrame(frame);
      };
      frame();
    }
  }, [successData]);

  async function handleSubmit() {
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

      const body: Record<string, unknown> = {
        source,
        problemNumber,
        code,
      };

      if (isEditMode && editParts) {
        body.editPath = `${editParts.memberId}/${editParts.week}/${editParts.fullName}.py`;
        body.week = editParts.week;
      }

      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || '제출에 실패했습니다.');
      }

      // 캐시 삭제
      try {
        sessionStorage.removeItem('sootudy_tree');
        sessionStorage.removeItem('sootudy_activity');
      } catch {
        // sessionStorage 사용 불가 시 무시
      }

      // 낙관적 업데이트: problems 배열에 즉시 추가
      const { baseName, version } = parseVersionFromName(data.name);
      addProblem({
        id: `${data.memberId}/${data.week}/${data.name}`,
        member: data.memberId,
        week: data.week,
        name: data.name,
        source,
        path: data.path,
        hasNote: false,
        version,
        baseName,
      });

      setSuccessData({ memberId: data.memberId, week: data.week, name: data.name });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  // 성공 화면
  if (successData) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-6">
        <div className="w-48 h-48">
          <DotLottieReact src="/fox.lottie" loop autoplay />
        </div>
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {successMessage}
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            GitHub에 코드가 성공적으로 올라갔어요
          </p>
        </div>
        <Link
          to={`/problem/${successData.memberId}/${successData.week}/${successData.name}`}
          className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          내 코드 보러가기
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
          {isEditMode ? (
            <Pencil className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          ) : (
            <Upload className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          )}
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            {isEditMode ? '코드 수정' : '코드 제출'}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {isEditMode
              ? '코드를 수정하면 GitHub에 자동으로 반영됩니다'
              : '코드를 붙여넣으면 GitHub에 자동으로 업로드됩니다'}
          </p>
        </div>
      </div>

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
              onClick={() => { if (source === 'etc') setProblemNumber(''); setSource('swea'); }}
              disabled={submitting}
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
              onClick={() => { if (source === 'etc') setProblemNumber(''); setSource('boj'); }}
              disabled={submitting}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                source === 'boj'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              BOJ
            </button>
            <button
              type="button"
              onClick={() => { setSource('etc'); setProblemNumber(''); }}
              disabled={submitting}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                source === 'etc'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              기타
            </button>
          </div>
        </div>

        {/* 문제번호 / 문제이름 */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            {source === 'etc' ? '문제 이름' : '문제번호'}
          </label>
          <input
            type="text"
            inputMode={source === 'etc' ? 'text' : 'numeric'}
            pattern={source === 'etc' ? undefined : '[0-9]*'}
            value={problemNumber}
            onChange={(e) => {
              if (source === 'etc') {
                // 파일명에 안전한 문자만 허용: 한글(자모+완성형), 영문, 숫자, 하이픈, 띄어쓰기
                setProblemNumber(e.target.value.replace(/[^가-힣ㄱ-ㅎㅏ-ㅣa-zA-Z0-9- ]/g, ''));
              } else {
                setProblemNumber(e.target.value.replace(/\D/g, ''));
              }
            }}
            placeholder={source === 'etc' ? '예: 이분 탐색 연습' : '예: 6001'}
            disabled={submitting}
            className="w-full max-w-xs px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50"
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

        {/* Monaco Editor + 제출 중 오버레이 */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            코드
          </label>
          <div className="relative rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
            <Editor
              height="300px"
              language="python"
              theme={dark ? 'vs-dark' : 'light'}
              value={code}
              onChange={(value) => setCode(value || '')}
              loading={
                <div className="flex items-center justify-center h-[300px] bg-slate-50 dark:bg-slate-800">
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
                readOnly: submitting,
              }}
            />

            {/* 제출 중 오버레이 */}
            {submitting && (
              <div className="absolute inset-0 bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm flex flex-col items-center justify-center gap-3 z-10">
                <div className="w-56 h-56">
                  <DotLottieReact src="/pochita.lottie" loop autoplay />
                </div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 animate-pulse">
                  GitHub에 업로드 중...
                </p>
              </div>
            )}
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
            {isEditMode ? <Pencil className="w-5 h-5" /> : <Upload className="w-5 h-5" />}
            {submitting ? (isEditMode ? '수정 중...' : '제출 중...') : (isEditMode ? '수정하기' : '제출하기')}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            disabled={submitting}
            className="px-6 py-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
}

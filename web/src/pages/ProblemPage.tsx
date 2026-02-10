import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useParams, useOutletContext, Link, useNavigate } from 'react-router-dom';
import CodeViewer from '../components/CodeViewer';
import MarkdownViewer from '../components/MarkdownViewer';
import SourceBadge from '../components/SourceBadge';
import InlineCommentCard from '../components/InlineCommentCard';
import CodeCommentPanel from '../components/CodeCommentPanel';
import { useCodeComments } from '../hooks/useCodeComments';
import { ExternalLink, Users, Pencil, Trash2, MoreVertical, GitCompare, X, ChevronDown, MessageSquare, Circle, Copy } from 'lucide-react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { fetchFileContent, parseSourceFromCode, getProblemUrl } from '../services/github';
import { supabase } from '../lib/supabase';
import type { Members, Problem } from '../types';

interface Context {
  members: Members;
  problems: Problem[];
  dark: boolean;
}

export default function ProblemPage() {
  const { memberId, week, problemName } = useParams<{ memberId: string; week: string; problemName: string }>();
  const { members, problems, dark } = useOutletContext<Context>();
  const navigate = useNavigate();

  const [code, setCode] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'code' | 'note'>('code');
  const [resolvedSource, setResolvedSource] = useState<string | null>(null);
  const [currentMemberId, setCurrentMemberId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // 확장/비교 모드
  const [expanded, setExpanded] = useState(false);
  const [compareWith, setCompareWith] = useState<Problem | null>(null);
  const [compareCode, setCompareCode] = useState<string | null>(null);
  const [compareLoading, setCompareLoading] = useState(false);

  // 다른 풀이에서 멤버별 선택된 버전
  const [selectedVersions, setSelectedVersions] = useState<Record<string, string>>({});
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 댓글 시스템 상태
  const [showDots, setShowDots] = useState(true);
  const [showPanel, setShowPanel] = useState(false);
  const [activeCommentLine, setActiveCommentLine] = useState<number | null>(null);
  const [activeCommentColumn, setActiveCommentColumn] = useState<number>(0);
  const activeCommentColumnRef = useRef<number>(0);
  const hasAutoOpenedPanel = useRef(false);
  const [showCopyTip, setShowCopyTip] = useState(() => {
    return localStorage.getItem('copyTipDismissed') !== 'true';
  });

  const problem = problems.find(
    (p) => p.member === memberId && p.week === week && p.name === problemName
  );

  const member = memberId ? members[memberId] : undefined;
  const isOwner = currentMemberId === memberId;

  // 댓글 데이터
  const commentData = useCodeComments(problem?.id || '', members);

  // 첫 댓글이 달리면 패널 자동 열림 (딱 한 번만)
  useEffect(() => {
    if (commentData.comments.length > 0 && !hasAutoOpenedPanel.current) {
      setShowPanel(true);
      hasAutoOpenedPanel.current = true;
    }
  }, [commentData.comments.length]);

  // 현재 로그인한 유저의 memberId 찾기
  useEffect(() => {
    async function resolveMember() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const githubUsername = user.user_metadata?.user_name
        || user.user_metadata?.preferred_username
        || user.user_metadata?.login
        || user.user_metadata?.nickname;
      if (!githubUsername) return;
      for (const [id, m] of Object.entries(members)) {
        if (m.github.toLowerCase() === githubUsername.toLowerCase()) {
          setCurrentMemberId(id);
          break;
        }
      }
    }
    if (Object.keys(members).length > 0) resolveMember();
  }, [members]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 비교 모드에서 다른 코드 로드
  useEffect(() => {
    if (!compareWith) {
      setCompareCode(null);
      return;
    }

    let cancelled = false;
    setCompareLoading(true);

    async function loadCompareCode() {
      try {
        const content = await fetchFileContent(compareWith!.path);
        if (!cancelled) setCompareCode(content);
      } catch {
        if (!cancelled) setCompareCode(null);
      } finally {
        if (!cancelled) setCompareLoading(false);
      }
    }

    loadCompareCode();
    return () => { cancelled = true; };
  }, [compareWith]);

  async function handleDelete() {
    if (!problem || !window.confirm('정말 이 코드를 삭제하시겠습니까?')) return;

    setDeleting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch('/api/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ path: problem.path }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      try {
        sessionStorage.removeItem('sootudy_tree');
        sessionStorage.removeItem('sootudy_activity');
      } catch { /* ignore */ }

      navigate(`/member/${memberId}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : '삭제에 실패했습니다.');
    } finally {
      setDeleting(false);
    }
  }

  // 이전/다음 문제
  const memberProblems = problems.filter((p) => p.member === memberId);
  const currentIdx = memberProblems.findIndex((p) => p.id === problem?.id);
  const prevProblem = currentIdx > 0 ? memberProblems[currentIdx - 1] : null;
  const nextProblem = currentIdx < memberProblems.length - 1 ? memberProblems[currentIdx + 1] : null;

  useEffect(() => {
    if (!problem) return;
    let cancelled = false;
    setLoading(true);
    setCode(null);
    setNote(null);
    setResolvedSource(null);
    setCompareWith(null);
    setExpanded(false);
    setActiveCommentLine(null);

    async function load() {
      try {
        const codeContent = await fetchFileContent(problem!.path);
        if (cancelled) return;
        setCode(codeContent);

        const metaSource = parseSourceFromCode(codeContent);
        if (metaSource) setResolvedSource(metaSource);

        if (problem!.hasNote && problem!.notePath) {
          const noteContent = await fetchFileContent(problem!.notePath);
          if (!cancelled) setNote(noteContent);
        }
      } catch {
        // 파일 로드 실패 시 무시
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [problem]);

  // 라인 클릭 핸들러 — 같은 줄+같은 칼럼이면 토글, 다른 칼럼이면 위치만 갱신
  const handleLineClick = useCallback((lineNumber: number, columnNumber: number) => {
    setActiveCommentLine((prev) => {
      if (prev === lineNumber && activeCommentColumnRef.current === columnNumber) {
        return null; // 같은 위치 → 닫기
      }
      return lineNumber;
    });
    activeCommentColumnRef.current = columnNumber;
    setActiveCommentColumn(columnNumber);
  }, []);

  // 코드 복사
  const handleCopyCode = useCallback(() => {
    if (!code) return;
    navigator.clipboard.writeText(code);
  }, [code]);

  // 코드+댓글 복사 (익명화)
  const handleCopyWithComments = useCallback(() => {
    if (!code) return;
    const allComments = commentData.comments;
    if (allComments.length === 0) {
      navigator.clipboard.writeText(code);
      return;
    }

    // 작성자 익명화: github_username → 리뷰어 A, B, C...
    const authorMap = new Map<string, string>();
    const LABELS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const sorted = [...allComments].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    for (const c of sorted) {
      if (!authorMap.has(c.github_username)) {
        const idx = authorMap.size;
        authorMap.set(c.github_username, `리뷰어 ${idx < LABELS.length ? LABELS[idx] : String(idx + 1)}`);
      }
    }

    // 댓글을 줄 번호별로 그룹핑 (최상위만)
    const topComments = allComments
      .filter((c) => !c.parent_id && c.line_number != null)
      .sort((a, b) => (a.line_number ?? 0) - (b.line_number ?? 0) || new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    const lines: string[] = [];
    lines.push(code);
    lines.push('');
    lines.push('─'.repeat(40));
    lines.push('댓글');
    lines.push('─'.repeat(40));

    for (const comment of topComments) {
      const label = authorMap.get(comment.github_username) ?? '익명';
      lines.push(`[${comment.line_number}번째 줄] ${label}: ${comment.content}`);

      // 답글
      const replies = allComments
        .filter((c) => c.parent_id === comment.id)
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      for (const reply of replies) {
        const replyLabel = authorMap.get(reply.github_username) ?? '익명';
        lines.push(`  ↳ ${replyLabel}: ${reply.content}`);
      }
    }

    navigator.clipboard.writeText(lines.join('\n'));
  }, [code, commentData.comments]);

  // 호버 프리뷰 — 마커에 마우스 올리면 댓글만 표시 (답글 UI 없음)
  const renderHoverPreview = useCallback(
    (lineNumber: number): React.ReactNode | null => {
      const lineComments = commentData.commentsByLine.get(lineNumber) || [];
      if (lineComments.length === 0) return null;

      return (
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-lg p-2.5 space-y-2">
          {lineComments.map((comment) => {
            const authorColor = commentData.authorColorMap.get(comment.github_username);
            const displayName = (() => {
              for (const m of Object.values(members)) {
                if (m.github.toLowerCase() === comment.github_username.toLowerCase()) return m.name;
              }
              return comment.github_username;
            })();
            const replies = commentData.comments.filter((c) => c.parent_id === comment.id);

            return (
              <div key={comment.id}>
                <div className="flex gap-1.5">
                  <img
                    src={comment.github_avatar || `https://github.com/${comment.github_username}.png?size=24`}
                    alt=""
                    className="w-5 h-5 rounded-full shrink-0 mt-0.5"
                  />
                  <div className="min-w-0">
                    <span className="font-semibold text-xs" style={{ color: authorColor?.dot }}>
                      {displayName}
                    </span>
                    <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap break-words">
                      {comment.content}
                    </p>
                  </div>
                </div>
                {replies.length > 0 && (
                  <div className="mt-1 ml-6 space-y-1 pl-1.5 border-l-2 border-slate-200 dark:border-slate-600">
                    {replies.map((reply) => {
                      const replyColor = commentData.authorColorMap.get(reply.github_username);
                      const replyName = (() => {
                        for (const m of Object.values(members)) {
                          if (m.github.toLowerCase() === reply.github_username.toLowerCase()) return m.name;
                        }
                        return reply.github_username;
                      })();
                      return (
                        <div key={reply.id} className="flex gap-1.5">
                          <img
                            src={reply.github_avatar || `https://github.com/${reply.github_username}.png?size=20`}
                            alt=""
                            className="w-4 h-4 rounded-full shrink-0 mt-0.5"
                          />
                          <div className="min-w-0">
                            <span className="font-medium text-[10px]" style={{ color: replyColor?.dot }}>
                              {replyName}
                            </span>
                            <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap break-words">
                              {reply.content}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      );
    },
    [commentData.commentsByLine, commentData.authorColorMap, commentData.comments, members]
  );

  // 인라인 카드 렌더 — 점 근처 클릭이면 답글, 아니면 새 댓글
  const renderInlineCard = useCallback(
    (lineNumber: number) => {
      const lineComments = commentData.commentsByLine.get(lineNumber) || [];
      // 클릭한 칼럼이 기존 댓글 점 근처(±2글자)인지 판단
      const nearbyComment = lineComments.find((c) => {
        const commentCol = c.column_number ?? 0;
        return Math.abs(commentCol - activeCommentColumn) <= 2;
      });
      return (
        <InlineCommentCard
          key={`${lineNumber}-${activeCommentColumn}`}
          lineNumber={lineNumber}
          comments={lineComments}
          allComments={commentData.comments}
          user={commentData.user}
          members={members}
          authorColorMap={commentData.authorColorMap}
          initialReplyTo={nearbyComment?.id ?? null}
          onSubmit={async (content, parentId) => {
            await commentData.addComment(content, lineNumber, parentId, activeCommentColumnRef.current ?? undefined);
          }}
          onClose={() => setActiveCommentLine(null)}
          dark={dark}
        />
      );
    },
    [commentData, dark, members, activeCommentColumn]
  );

  if (!problem || !member) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="w-28 h-28">
          <DotLottieReact src="/cat.lottie" loop autoplay />
        </div>
        <p className="text-slate-500 dark:text-slate-400 mt-2">문제를 찾을 수 없습니다.</p>
      </div>
    );
  }

  const displaySource = (resolvedSource || problem.source) as 'swea' | 'boj' | 'etc';
  const problemUrl = getProblemUrl(problem.name, displaySource);

  // 같은 문제를 푼 다른 팀원들 + 같은 멤버의 다른 버전
  const otherSolutions = useMemo(() => {
    const currentBaseName = problem.baseName || problem.name;
    return problems.filter((p) => {
      const pBaseName = p.baseName || p.name;
      if (pBaseName !== currentBaseName) return false;
      if (p.id === problem.id) return false;
      return true;
    });
  }, [problems, problem.baseName, problem.name, problem.id]);

  // 멤버별로 그룹핑
  const groupedSolutions = useMemo(() => {
    const groups: Record<string, Problem[]> = {};
    for (const sol of otherSolutions) {
      if (!groups[sol.member]) {
        groups[sol.member] = [];
      }
      groups[sol.member].push(sol);
    }
    for (const mId of Object.keys(groups)) {
      groups[mId].sort((a, b) => {
        const vA = a.version ?? 0;
        const vB = b.version ?? 0;
        return vA - vB;
      });
    }
    return groups;
  }, [otherSolutions]);

  function getSelectedProblem(mId: string): Problem | undefined {
    const versions = groupedSolutions[mId];
    if (!versions || versions.length === 0) return undefined;
    const selectedId = selectedVersions[mId];
    if (selectedId) {
      const found = versions.find((p) => p.id === selectedId);
      if (found) return found;
    }
    return versions[versions.length - 1];
  }

  const compareMember = compareWith ? members[compareWith.member] : null;
  const isWideMode = expanded || compareWith;

  return (
    <div className={isWideMode ? '-mx-6 px-6' : ''}>
      <div className="space-y-6">
        {/* 메타 정보 */}
        <div>
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <SourceBadge source={displaySource} />
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">{problem.name}</h1>
            {problemUrl && (
              <a
                href={problemUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                문제 보기 <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
            <Link to={`/member/${memberId}`} className="hover:text-indigo-600 dark:hover:text-indigo-400">
              {member.name}
            </Link>
            <span>·</span>
            <Link to={`/weekly/${week}`} className="hover:text-indigo-600 dark:hover:text-indigo-400">
              {week}
            </Link>

            {/* 댓글 토글 버튼들 */}
            <span className="hidden md:inline">·</span>
            <div className="hidden md:flex items-center gap-1">
              <button
                onClick={() => setShowDots(!showDots)}
                className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-colors ${
                  showDots
                    ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title={showDots ? '댓글 마커 숨기기' : '댓글 마커 보기'}
              >
                <Circle className="w-3 h-3" fill={showDots ? 'currentColor' : 'none'} />
                <span>마커</span>
              </button>
              <button
                onClick={() => setShowPanel(!showPanel)}
                className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-colors ${
                  showPanel
                    ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title={showPanel ? '댓글 목록 닫기' : '댓글 목록 열기'}
              >
                <MessageSquare className="w-3 h-3" />
                <span>댓글 목록</span>
              </button>
            </div>

            {isOwner && (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  aria-label="더보기"
                >
                  <MoreVertical className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                </button>

                {menuOpen && (
                  <div className="absolute right-0 top-8 z-10 w-32 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg py-1">
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        navigate(`/submit?edit=${memberId}/${week}/${problemName}`);
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      수정
                    </button>
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        handleDelete();
                      }}
                      disabled={deleting}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      {deleting ? '삭제 중...' : '삭제'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 모바일 댓글 토글 */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={() => setShowDots(!showDots)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              showDots
                ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
            }`}
          >
            <Circle className="w-3 h-3" fill={showDots ? 'currentColor' : 'none'} />
            마커
          </button>
          <button
            onClick={() => setShowPanel(!showPanel)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              showPanel
                ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
            }`}
          >
            <MessageSquare className="w-3 h-3" />
            댓글 목록
          </button>
        </div>

        {/* 비교 모드 */}
        {compareWith && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <GitCompare className="w-4 h-4" />
                <span>코드 비교 중</span>
              </div>
              <button
                onClick={() => setCompareWith(null)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
                비교 종료
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-12 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                    <div className="w-20 h-20">
                      <DotLottieReact src="/cat.lottie" loop autoplay />
                    </div>
                  </div>
                ) : code ? (
                  <CodeViewer code={code} dark={dark} title={member.name} />
                ) : (
                  <p className="text-slate-500 dark:text-slate-400 text-sm">코드를 불러올 수 없습니다.</p>
                )}
              </div>
              <div>
                {compareLoading ? (
                  <div className="flex flex-col items-center justify-center py-12 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                    <div className="w-20 h-20">
                      <DotLottieReact src="/cat.lottie" loop autoplay />
                    </div>
                  </div>
                ) : compareCode ? (
                  <CodeViewer
                    code={compareCode}
                    dark={dark}
                    title={compareMember ? `${compareMember.name}${compareWith.version ? ` (v${compareWith.version})` : ''}` : compareWith.name}
                  />
                ) : (
                  <p className="text-slate-500 dark:text-slate-400 text-sm">코드를 불러올 수 없습니다.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 일반/확장 모드 */}
        {!compareWith && (
          <div className={`flex flex-col ${expanded || !showPanel ? '' : 'md:flex-row'} gap-6`}>
            {/* 코드 섹션 */}
            <div className={`flex-1 ${expanded || !showPanel ? '' : 'md:w-[60%]'} space-y-6`}>
              {/* 탭 */}
              {problem.hasNote && (
                <div className="flex gap-1 border-b border-slate-200 dark:border-slate-700">
                  <button
                    onClick={() => setActiveTab('code')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === 'code'
                        ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                        : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                  >
                    코드
                  </button>
                  <button
                    onClick={() => setActiveTab('note')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === 'note'
                        ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                        : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                  >
                    노트
                  </button>
                </div>
              )}

              {/* 복사 기능 안내 (1회) */}
              {showCopyTip && !loading && activeTab === 'code' && code && (
                <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 text-sm">
                  <Copy className="w-4 h-4 text-indigo-500 shrink-0" />
                  <p className="flex-1 text-indigo-700 dark:text-indigo-300">
                    코드 상단에 <strong>복사</strong> / <strong>코드+댓글</strong> 버튼이 추가되었습니다!
                  </p>
                  <button
                    onClick={() => {
                      setShowCopyTip(false);
                      localStorage.setItem('copyTipDismissed', 'true');
                    }}
                    className="p-0.5 rounded hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-400 dark:text-indigo-500 transition-colors shrink-0"
                    aria-label="닫기"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* 콘텐츠 */}
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-24 h-24">
                    <DotLottieReact src="/cat.lottie" loop autoplay />
                  </div>
                  <p className="text-sm text-slate-400 dark:text-slate-500 mt-2 animate-pulse">코드를 불러오는 중...</p>
                </div>
              ) : activeTab === 'code' && code ? (
                <CodeViewer
                  code={code}
                  dark={dark}
                  expanded={expanded}
                  onToggleExpand={() => setExpanded(!expanded)}
                  onCopyCode={handleCopyCode}
                  onCopyWithComments={commentData.comments.length > 0 ? handleCopyWithComments : undefined}
                  onLineClick={handleLineClick}
                  commentDots={commentData.dots}
                  showDots={showDots}
                  activeCommentLine={activeCommentLine}
                  activeCommentColumn={activeCommentColumn}
                  renderInlineCard={renderInlineCard}
                  renderHoverPreview={commentData.comments.length > 0 ? renderHoverPreview : undefined}
                />
              ) : activeTab === 'note' && note ? (
                <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                  <MarkdownViewer content={note} dark={dark} />
                </div>
              ) : (
                <p className="text-slate-500 dark:text-slate-400 text-sm">콘텐츠를 불러올 수 없습니다.</p>
              )}

              {/* 다른 풀이 */}
              {otherSolutions.length > 0 && (
                <div className="space-y-3">
                  <h2 className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                    <Users className="w-4 h-4" />
                    다른 풀이 ({Object.keys(groupedSolutions).length}명)
                  </h2>
                  <div className="flex flex-wrap gap-2" ref={dropdownRef}>
                    {Object.entries(groupedSolutions).map(([mId, versions]) => {
                      const solMember = members[mId];
                      if (!solMember) return null;
                      const selectedProblem = getSelectedProblem(mId);
                      if (!selectedProblem) return null;
                      const hasMultipleVersions = versions.length > 1;
                      const isSameMember = mId === memberId;

                      const getVersionLabel = (p: Problem) => {
                        if (p.version === undefined) return '원본';
                        return `v${p.version}`;
                      };

                      return (
                        <div key={mId} className="flex items-center">
                          <div className="relative flex items-center">
                            <Link
                              to={`/problem/${mId}/${selectedProblem.week}/${selectedProblem.name}`}
                              className="flex items-center gap-2 px-3 py-2 rounded-l-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors"
                            >
                              <img
                                src={`https://github.com/${solMember.github}.png?size=24`}
                                alt={solMember.name}
                                className="w-5 h-5 rounded-full"
                              />
                              <span className="text-sm text-slate-700 dark:text-slate-300">
                                {isSameMember ? getVersionLabel(selectedProblem) : solMember.name}
                              </span>
                            </Link>

                            {hasMultipleVersions && (
                              <>
                                <button
                                  onClick={() => setOpenDropdown(openDropdown === mId ? null : mId)}
                                  className="flex items-center gap-1 px-2 py-2 bg-white dark:bg-slate-800 border-y border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors"
                                  title="버전 선택"
                                >
                                  <span className="text-xs">{getVersionLabel(selectedProblem)}</span>
                                  <ChevronDown className="w-3 h-3" />
                                </button>

                                {openDropdown === mId && (
                                  <div className="absolute left-0 top-full mt-1 z-20 min-w-[100px] rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg py-1">
                                    {versions.map((v) => (
                                      <button
                                        key={v.id}
                                        onClick={() => {
                                          setSelectedVersions((prev) => ({ ...prev, [mId]: v.id }));
                                          setOpenDropdown(null);
                                        }}
                                        className={`w-full text-left px-3 py-1.5 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ${
                                          v.id === selectedProblem.id
                                            ? 'text-indigo-600 dark:text-indigo-400 font-medium'
                                            : 'text-slate-700 dark:text-slate-300'
                                        }`}
                                      >
                                        {getVersionLabel(v)}
                                        <span className="text-xs text-slate-400 dark:text-slate-500 ml-2">{v.week}</span>
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </>
                            )}

                            {!hasMultipleVersions && (
                              <span className="px-2 py-2 text-xs text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-800 border-y border-slate-200 dark:border-slate-700">
                                {selectedProblem.week}
                              </span>
                            )}
                          </div>

                          <button
                            onClick={() => setCompareWith(selectedProblem)}
                            className="px-2 py-2 rounded-r-lg bg-slate-100 dark:bg-slate-700 border border-l-0 border-slate-200 dark:border-slate-700 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                            title="비교하기"
                          >
                            <GitCompare className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* 댓글 패널 */}
            {showPanel && (
              <div className={expanded ? 'w-full' : 'md:w-[40%]'}>
                <CodeCommentPanel
                  comments={commentData.comments}
                  loading={commentData.loading}
                  user={commentData.user}
                  members={members}
                  authorColorMap={commentData.authorColorMap}
                  getReplies={commentData.getReplies}
                  onUpdateComment={commentData.updateComment}
                  onDeleteComment={commentData.deleteComment}
                  onAddReply={(content, lineNumber, parentId) =>
                    commentData.addComment(content, lineNumber, parentId)
                  }
                  onLineSelect={(lineNumber) => {
                    setActiveCommentLine(lineNumber);
                    // 해당 줄로 스크롤
                    const el = document.querySelector(`[data-line-number="${lineNumber}"]`);
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }}
                />
              </div>
            )}
          </div>
        )}

        {/* 이전/다음 */}
        <div className="flex justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
          {prevProblem ? (
            <Link
              to={`/problem/${prevProblem.member}/${prevProblem.week}/${prevProblem.name}`}
              className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              ← {prevProblem.name}
            </Link>
          ) : <span />}
          {nextProblem ? (
            <Link
              to={`/problem/${nextProblem.member}/${nextProblem.week}/${nextProblem.name}`}
              className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              {nextProblem.name} →
            </Link>
          ) : <span />}
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useOutletContext, Link, useNavigate } from 'react-router-dom';
import CodeViewer from '../components/CodeViewer';
import MarkdownViewer from '../components/MarkdownViewer';
import SourceBadge from '../components/SourceBadge';
import Comments from '../components/Comments';
import { ExternalLink, Users, Pencil, Trash2, MoreVertical, GitCompare, X, ChevronDown } from 'lucide-react';
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

  const problem = problems.find(
    (p) => p.member === memberId && p.week === week && p.name === problemName
  );

  const member = memberId ? members[memberId] : undefined;
  const isOwner = currentMemberId === memberId;

  // 현재 로그인한 유저의 memberId 찾기
  useEffect(() => {
    async function resolveMember() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('[ProblemPage] No user logged in');
        return;
      }
      console.log('[ProblemPage] user_metadata:', user.user_metadata);
      // GitHub OAuth에서 username은 user_name, preferred_username, 또는 login으로 올 수 있음
      const githubUsername = user.user_metadata?.user_name
        || user.user_metadata?.preferred_username
        || user.user_metadata?.login
        || user.user_metadata?.nickname;
      console.log('[ProblemPage] Resolved GitHub username:', githubUsername);
      if (!githubUsername) {
        console.log('[ProblemPage] No GitHub username found in metadata');
        return;
      }
      for (const [id, m] of Object.entries(members)) {
        console.log(`[ProblemPage] Comparing: "${m.github.toLowerCase()}" vs "${githubUsername.toLowerCase()}"`);
        if (m.github.toLowerCase() === githubUsername.toLowerCase()) {
          console.log('[ProblemPage] Match found! Setting currentMemberId:', id);
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
    // 문제 바뀌면 비교 모드 해제
    setCompareWith(null);
    setExpanded(false);

    async function load() {
      try {
        const codeContent = await fetchFileContent(problem!.path);
        if (cancelled) return;
        setCode(codeContent);

        // 메타데이터에서 출처 파싱
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
    // 각 그룹 내에서 버전순 정렬 (원본 → v1 → v2 ...)
    for (const memberId of Object.keys(groups)) {
      groups[memberId].sort((a, b) => {
        const vA = a.version ?? 0;
        const vB = b.version ?? 0;
        return vA - vB;
      });
    }
    return groups;
  }, [otherSolutions]);

  // 멤버별 선택된 버전 가져오기 (기본값: 최신 버전)
  function getSelectedProblem(mId: string): Problem | undefined {
    const versions = groupedSolutions[mId];
    if (!versions || versions.length === 0) return undefined;
    const selectedId = selectedVersions[mId];
    if (selectedId) {
      const found = versions.find((p) => p.id === selectedId);
      if (found) return found;
    }
    // 기본값: 최신 버전 (마지막)
    return versions[versions.length - 1];
  }

  const compareMember = compareWith ? members[compareWith.member] : null;

  // 확장/비교 모드일 때 전체 너비 사용
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

        {/* 비교 모드 */}
        {compareWith && (
          <div className="space-y-4">
            {/* 비교 모드 헤더 */}
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

            {/* 두 코드 나란히 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* 내 코드 */}
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

              {/* 비교 대상 코드 */}
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
          <div className={`flex flex-col ${expanded ? '' : 'md:flex-row'} gap-6`}>
            {/* 코드 섹션 */}
            <div className={`flex-1 ${expanded ? '' : 'md:w-[60%]'} space-y-6`}>
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

              {/* 콘텐츠 */}
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-24 h-24">
                    <DotLottieReact src="/cat.lottie" loop autoplay />
                  </div>
                  <p className="text-sm text-slate-400 dark:text-slate-500 mt-2 animate-pulse">코드를 불러오는 중...</p>
                </div>
              ) : activeTab === 'code' && code ? (
                <CodeViewer code={code} dark={dark} expanded={expanded} onToggleExpand={() => setExpanded(!expanded)} />
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

                      // 버전 표시 텍스트
                      const getVersionLabel = (p: Problem) => {
                        if (p.version === undefined) return '원본';
                        return `v${p.version}`;
                      };

                      return (
                        <div key={mId} className="flex items-center">
                          {/* 이름 + 버전 드롭다운 */}
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

                            {/* 버전 드롭다운 (여러 버전일 때만) */}
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

                            {/* 주차 표시 (버전이 1개일 때만) */}
                            {!hasMultipleVersions && (
                              <span className="px-2 py-2 text-xs text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-800 border-y border-slate-200 dark:border-slate-700">
                                {selectedProblem.week}
                              </span>
                            )}
                          </div>

                          {/* 비교 버튼 */}
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

            {/* 댓글 섹션 */}
            <div className={expanded ? 'w-full' : 'md:w-[40%]'}>
              <Comments problemId={problem.id} />
            </div>
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

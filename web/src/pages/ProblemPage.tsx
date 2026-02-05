import { useState, useEffect, useMemo } from 'react';
import { useParams, useOutletContext, Link } from 'react-router-dom';
import CodeViewer from '../components/CodeViewer';
import MarkdownViewer from '../components/MarkdownViewer';
import SourceBadge from '../components/SourceBadge';
import Comments from '../components/Comments';
import { ExternalLink, Users } from 'lucide-react';
import { fetchFileContent, parseSourceFromCode, getProblemUrl } from '../services/github';
import type { Members, Problem } from '../types';

interface Context {
  members: Members;
  problems: Problem[];
  dark: boolean;
}

export default function ProblemPage() {
  const { memberId, week, problemName } = useParams<{ memberId: string; week: string; problemName: string }>();
  const { members, problems, dark } = useOutletContext<Context>();

  const [code, setCode] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'code' | 'note'>('code');
  const [resolvedSource, setResolvedSource] = useState<string | null>(null);

  const problem = problems.find(
    (p) => p.member === memberId && p.week === week && p.name === problemName
  );

  const member = memberId ? members[memberId] : undefined;

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
    return <p className="text-slate-500 dark:text-slate-400">문제를 찾을 수 없습니다.</p>;
  }

  const displaySource = (resolvedSource || problem.source) as 'swea' | 'boj' | 'etc';
  const problemUrl = getProblemUrl(problem.name, displaySource);

  // 같은 문제를 푼 다른 팀원들
  const otherSolutions = useMemo(
    () => problems.filter((p) => p.name === problem.name && p.member !== memberId),
    [problems, problem.name, memberId]
  );

  return (
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
        </div>
      </div>

      {/* 메인 콘텐츠: 코드 + 댓글 (모바일: 위아래, 태블릿 이상: 좌우) */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* 코드 섹션 (60%) */}
        <div className="flex-1 md:w-[60%] space-y-6">
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
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-4 border-indigo-200 dark:border-indigo-800 border-t-indigo-600 dark:border-t-indigo-400 rounded-full animate-spin" />
            </div>
          ) : activeTab === 'code' && code ? (
            <CodeViewer code={code} dark={dark} />
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
                다른 풀이 ({otherSolutions.length})
              </h2>
              <div className="flex flex-wrap gap-2">
                {otherSolutions.map((sol) => {
                  const solMember = members[sol.member];
                  if (!solMember) return null;
                  return (
                    <Link
                      key={sol.id}
                      to={`/problem/${sol.member}/${sol.week}/${sol.name}`}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors"
                    >
                      <img
                        src={`https://github.com/${solMember.github}.png?size=24`}
                        alt={solMember.name}
                        className="w-5 h-5 rounded-full"
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-300">{solMember.name}</span>
                      <span className="text-xs text-slate-400 dark:text-slate-500">{sol.week}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 댓글 섹션 (40%) */}
        <div className="md:w-[40%]">
          <Comments problemId={problem.id} dark={dark} />
        </div>
      </div>

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
  );
}

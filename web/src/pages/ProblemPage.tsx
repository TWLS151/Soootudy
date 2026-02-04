import { useState, useEffect } from 'react';
import { useParams, useOutletContext, Link } from 'react-router-dom';
import CodeViewer from '../components/CodeViewer';
import MarkdownViewer from '../components/MarkdownViewer';
import { fetchFileContent, parseSourceFromCode } from '../services/github';
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

  const displaySource = resolvedSource || problem.source;

  return (
    <div className="space-y-6">
      {/* 메타 정보 */}
      <div>
        <div className="flex items-center gap-3 mb-2 flex-wrap">
          <span className={`text-xs px-2 py-0.5 rounded font-medium ${
            displaySource === 'swea' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' :
            displaySource === 'boj' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
            'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
          }`}>
            {displaySource.toUpperCase()}
          </span>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">{problem.name}</h1>
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

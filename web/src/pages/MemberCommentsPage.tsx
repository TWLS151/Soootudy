import { useState, useEffect, useMemo } from 'react';
import { useParams, useOutletContext, Link } from 'react-router-dom';
import { MessageSquare, ArrowLeft, ExternalLink } from 'lucide-react';
import SourceBadge from '../components/SourceBadge';
import { supabase } from '../lib/supabase';
import type { Members, Problem, Comment } from '../types';

interface Context {
  members: Members;
  problems: Problem[];
  dark: boolean;
}

interface CommentWithProblem extends Comment {
  problem: Problem;
}

export default function MemberCommentsPage() {
  const { id } = useParams<{ id: string }>();
  const { members, problems } = useOutletContext<Context>();

  const [comments, setComments] = useState<CommentWithProblem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [weekFilter, setWeekFilter] = useState<string | null>(null);

  const member = id ? members[id] : undefined;

  useEffect(() => {
    if (!id) return;
    loadComments();
  }, [id]);

  async function loadComments() {
    try {
      // 해당 멤버의 문제 ID 목록
      const memberProblems = problems.filter((p) => p.member === id);
      const problemIds = memberProblems.map((p) => p.id);

      if (problemIds.length === 0) {
        setComments([]);
        setLoading(false);
        return;
      }

      // 해당 문제들에 달린 댓글 조회
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .in('problem_id', problemIds)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // 댓글에 문제 정보 추가
      const commentsWithProblems: CommentWithProblem[] = (data || [])
        .map((comment) => {
          const problem = problems.find((p) => p.id === comment.problem_id);
          if (!problem) return null;
          return { ...comment, problem };
        })
        .filter((c): c is CommentWithProblem => c !== null);

      setComments(commentsWithProblems);
    } catch (error) {
      console.error('Failed to load comments:', error);
    } finally {
      setLoading(false);
    }
  }

  // 주차 목록 추출
  const weeks = useMemo(() => {
    const weekSet = new Set(comments.map((c) => c.problem.week));
    return Array.from(weekSet).sort((a, b) => b.localeCompare(a));
  }, [comments]);

  // 필터링 및 정렬
  const filteredComments = useMemo(() => {
    let filtered = comments;

    // 주간 필터
    if (weekFilter) {
      filtered = filtered.filter((c) => c.problem.week === weekFilter);
    }

    // 정렬
    const sorted = [...filtered].sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

    return sorted;
  }, [comments, weekFilter, sortOrder]);

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '방금 전';
    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    if (days < 7) return `${days}일 전`;
    return date.toLocaleDateString('ko-KR');
  }

  if (!member) {
    return <p className="text-slate-500 dark:text-slate-400">팀원을 찾을 수 없습니다.</p>;
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <Link
          to={`/member/${id}`}
          className="inline-flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400 hover:underline mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          {member.name} 페이지로 돌아가기
        </Link>
        <div className="flex items-center gap-3">
          <MessageSquare className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {member.name}님의 성장일기
          </h1>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          총 {comments.length}개의 댓글
        </p>
      </div>

      {/* 필터 및 정렬 */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        {/* 주간 필터 */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setWeekFilter(null)}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              weekFilter === null
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            전체
          </button>
          {weeks.map((week) => (
            <button
              key={week}
              onClick={() => setWeekFilter(week)}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                weekFilter === week
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {week}
            </button>
          ))}
        </div>

        {/* 정렬 */}
        <div className="flex gap-2">
          <button
            onClick={() => setSortOrder('newest')}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              sortOrder === 'newest'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            최신순
          </button>
          <button
            onClick={() => setSortOrder('oldest')}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              sortOrder === 'oldest'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            오래된순
          </button>
        </div>
      </div>

      {/* 댓글 목록 */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-indigo-200 dark:border-indigo-800 border-t-indigo-600 dark:border-t-indigo-400 rounded-full animate-spin" />
        </div>
      ) : filteredComments.length === 0 ? (
        <div className="text-center py-16">
          <MessageSquare className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-slate-500 dark:text-slate-400">
            {weekFilter ? '선택한 주차에 댓글이 없습니다.' : '아직 댓글이 없습니다.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredComments.map((comment) => (
            <div
              key={comment.id}
              className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700"
            >
              {/* 문제 정보 */}
              <Link
                to={`/problem/${comment.problem.member}/${comment.problem.week}/${comment.problem.name}`}
                className="flex items-center gap-3 mb-3 pb-3 border-b border-slate-100 dark:border-slate-700 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors group"
              >
                <SourceBadge source={comment.problem.source} />
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                    {comment.problem.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {comment.problem.week}
                  </p>
                </div>
                <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400" />
              </Link>

              {/* 댓글 작성자 및 시간 */}
              <div className="flex items-center gap-2 mb-2">
                <img
                  src={comment.github_avatar || `https://github.com/${comment.github_username}.png?size=32`}
                  alt={comment.github_username}
                  className="w-6 h-6 rounded-full"
                />
                <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  {comment.github_username}
                </span>
                <span className="text-xs text-slate-400 dark:text-slate-500">
                  {formatDate(comment.created_at)}
                  {comment.created_at !== comment.updated_at && ' (수정됨)'}
                </span>
              </div>

              {/* 댓글 내용 */}
              <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap break-words">
                {comment.content}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

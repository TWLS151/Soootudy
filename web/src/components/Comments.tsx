import { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, Edit2, Trash2, MoreVertical } from 'lucide-react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { supabase } from '../lib/supabase';
import type { Comment } from '../types';

interface CommentsProps {
  problemId: string;
}

export default function Comments({ problemId }: CommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState<{ id: string; github_username: string; avatar_url: string } | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // 현재 사용자 정보 가져오기
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUser({
          id: user.id,
          github_username: user.user_metadata.user_name || user.user_metadata.preferred_username || 'Unknown',
          avatar_url: user.user_metadata.avatar_url || '',
        });
      }
    });
  }, []);

  // 댓글 불러오기
  useEffect(() => {
    loadComments();

    // 실시간 구독
    const subscription = supabase
      .channel(`comments:${problemId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
          filter: `problem_id=eq.${problemId}`,
        },
        () => {
          loadComments();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [problemId]);

  // 외부 클릭 감지
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function loadComments() {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('problem_id', problemId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error('Failed to load comments:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    setSubmitting(true);
    try {
      const { error } = await supabase.from('comments').insert({
        problem_id: problemId,
        user_id: user.id,
        github_username: user.github_username,
        github_avatar: user.avatar_url,
        content: newComment.trim(),
      });

      if (error) throw error;
      setNewComment('');
      // 즉시 댓글 목록 업데이트
      await loadComments();
    } catch (error) {
      console.error('Failed to post comment:', error);
      alert('댓글 작성에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdate(commentId: string) {
    if (!editContent.trim()) return;

    try {
      const { error } = await supabase
        .from('comments')
        .update({ content: editContent.trim() })
        .eq('id', commentId);

      if (error) throw error;
      setEditingId(null);
      setEditContent('');
      // 즉시 댓글 목록 업데이트
      await loadComments();
    } catch (error) {
      console.error('Failed to update comment:', error);
      alert('댓글 수정에 실패했습니다.');
    }
  }

  async function handleDelete(commentId: string) {
    setOpenMenuId(null);
    if (!confirm('댓글을 삭제하시겠습니까?')) return;

    try {
      const { error } = await supabase.from('comments').delete().eq('id', commentId);

      if (error) throw error;
      // 즉시 댓글 목록 업데이트
      await loadComments();
    } catch (error) {
      console.error('Failed to delete comment:', error);
      alert('댓글 삭제에 실패했습니다.');
    }
  }

  function startEdit(comment: Comment) {
    setEditingId(comment.id);
    setEditContent(comment.content);
    setOpenMenuId(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditContent('');
  }

  function toggleMenu(commentId: string) {
    setOpenMenuId(openMenuId === commentId ? null : commentId);
  }

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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-6">
        <div className="w-16 h-16">
          <DotLottieReact src="/cat.lottie" loop autoplay />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full md:max-h-[calc(100vh-12rem)]">
      {/* 헤더 (sticky) */}
      <div className="sticky top-0 bg-slate-50 dark:bg-slate-950 pb-4 mb-2 z-20 -mx-2 px-2">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
          <MessageSquare className="w-5 h-5" />
          댓글 {comments.length > 0 && `(${comments.length})`}
        </h2>
      </div>

      {/* 스크롤 가능한 콘텐츠 영역 */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-2 pt-2">
        {/* 댓글 작성 폼 */}
        {user && (
          <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex gap-3">
            <img
              src={user.avatar_url}
              alt={user.github_username}
              className="w-8 h-8 rounded-full flex-shrink-0"
            />
            <div className="flex-1 space-y-2">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="댓글을 작성하세요..."
                rows={3}
                className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!newComment.trim() || submitting}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  <Send className="w-4 h-4" />
                  {submitting ? '작성 중...' : '댓글 작성'}
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* 댓글 목록 */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <div className="flex flex-col items-center py-6">
            <div className="w-20 h-20">
              <DotLottieReact src="/cat.lottie" loop autoplay />
            </div>
            <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">첫 댓글을 작성해보세요!</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className="flex gap-3 p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700"
            >
              <img
                src={comment.github_avatar || `https://github.com/${comment.github_username}.png?size=40`}
                alt={comment.github_username}
                className="w-8 h-8 rounded-full flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                {editingId === comment.id ? (
                  <div className="space-y-2">
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdate(comment.id)}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg transition-colors"
                      >
                        저장
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 text-xs font-medium rounded-lg transition-colors"
                      >
                        취소
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* 헤더: 사용자명 + 시간 + 액션 버튼 */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-900 dark:text-slate-100 text-sm">
                          {comment.github_username}
                        </span>
                        <span className="text-xs text-slate-400 dark:text-slate-500">
                          {formatDate(comment.created_at)}
                          {comment.created_at !== comment.updated_at && ' (수정됨)'}
                        </span>
                      </div>

                      {/* 더보기 메뉴 */}
                      {user && user.id === comment.user_id && (
                        <div className="relative" ref={openMenuId === comment.id ? menuRef : null}>
                          <button
                            onClick={() => toggleMenu(comment.id)}
                            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                            aria-label="더보기"
                          >
                            <MoreVertical className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                          </button>

                          {/* 드롭다운 메뉴 */}
                          {openMenuId === comment.id && (
                            <div className="absolute right-0 top-8 z-10 w-32 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg py-1">
                              <button
                                onClick={() => startEdit(comment)}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                                수정
                              </button>
                              <button
                                onClick={() => handleDelete(comment.id)}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                삭제
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* 댓글 내용 */}
                    <p className="text-slate-700 dark:text-slate-300 text-sm whitespace-pre-wrap break-words">
                      {comment.content}
                    </p>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
    </div>
  );
}

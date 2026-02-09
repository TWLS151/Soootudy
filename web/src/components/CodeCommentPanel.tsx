import { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, Edit2, Trash2, MoreVertical, X } from 'lucide-react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import type { Comment } from '../types';
import type { AuthorColor, CodeCommentUser } from '../hooks/useCodeComments';

interface CodeCommentPanelProps {
  comments: Comment[];
  loading: boolean;
  user: CodeCommentUser | null;
  authorColorMap: Map<string, AuthorColor>;
  getReplies: (parentId: string) => Comment[];
  onUpdateComment: (id: string, content: string) => Promise<void>;
  onDeleteComment: (id: string) => Promise<void>;
  onAddReply: (content: string, lineNumber: number, parentId: string) => Promise<void>;
  onLineSelect?: (lineNumber: number) => void;
  onClose?: () => void;
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

export default function CodeCommentPanel({
  comments,
  loading,
  user,
  authorColorMap,
  getReplies,
  onUpdateComment,
  onDeleteComment,
  onAddReply,
  onLineSelect,
  onClose,
}: CodeCommentPanelProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [replySubmitting, setReplySubmitting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Top-level comments only (no parent_id), sorted by created_at
  const topLevelComments = comments
    .filter((c) => !c.parent_id && c.line_number != null)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  async function handleUpdate(commentId: string) {
    if (!editContent.trim()) return;
    try {
      await onUpdateComment(commentId, editContent.trim());
      setEditingId(null);
      setEditContent('');
    } catch {
      alert('댓글 수정에 실패했습니다.');
    }
  }

  async function handleDelete(commentId: string) {
    setOpenMenuId(null);
    if (!confirm('댓글을 삭제하시겠습니까?')) return;
    try {
      await onDeleteComment(commentId);
    } catch {
      alert('댓글 삭제에 실패했습니다.');
    }
  }

  async function handleReply(parentComment: Comment) {
    if (!replyContent.trim() || !parentComment.line_number) return;
    setReplySubmitting(true);
    try {
      await onAddReply(replyContent.trim(), parentComment.line_number, parentComment.id);
      setReplyContent('');
      setReplyToId(null);
    } catch {
      alert('답글 작성에 실패했습니다.');
    } finally {
      setReplySubmitting(false);
    }
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
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-200 dark:border-slate-700">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
          <MessageSquare className="w-5 h-5" />
          댓글 {topLevelComments.length > 0 && `(${topLevelComments.length})`}
        </h2>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
          >
            <X className="w-4 h-4 text-slate-500" />
          </button>
        )}
      </div>

      {/* Comment list */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {topLevelComments.length === 0 ? (
          <div className="flex flex-col items-center py-6">
            <div className="w-20 h-20">
              <DotLottieReact src="/cat.lottie" loop autoplay />
            </div>
            <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">
              코드 줄을 클릭하여 댓글을 작성하세요
            </p>
          </div>
        ) : (
          topLevelComments.map((comment) => {
            const authorColor = authorColorMap.get(comment.github_username);
            const replies = getReplies(comment.id);

            return (
              <div
                key={comment.id}
                className={`rounded-lg border p-3 ${
                  authorColor?.bgClass || 'bg-slate-50 dark:bg-slate-800/50'
                } ${authorColor?.borderClass || 'border-slate-200 dark:border-slate-700'}`}
              >
                {/* Line number badge */}
                {comment.line_number != null && (
                  <button
                    onClick={() => onLineSelect?.(comment.line_number!)}
                    className="text-xs font-mono px-1.5 py-0.5 rounded bg-slate-200/80 dark:bg-slate-700/80 text-slate-600 dark:text-slate-400 hover:bg-indigo-100 dark:hover:bg-indigo-900 hover:text-indigo-600 dark:hover:text-indigo-400 mb-2 inline-block transition-colors"
                  >
                    Line {comment.line_number}
                  </button>
                )}

                {/* Comment body */}
                <div className="flex gap-2">
                  <img
                    src={
                      comment.github_avatar ||
                      `https://github.com/${comment.github_username}.png?size=32`
                    }
                    alt={comment.github_username}
                    className="w-6 h-6 rounded-full flex-shrink-0 mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    {editingId === comment.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          rows={2}
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleUpdate(comment.id)}
                            className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg"
                          >
                            저장
                          </button>
                          <button
                            onClick={() => {
                              setEditingId(null);
                              setEditContent('');
                            }}
                            className="px-3 py-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium rounded-lg"
                          >
                            취소
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span
                              className="font-semibold text-sm"
                              style={{ color: authorColor?.dot }}
                            >
                              {comment.github_username}
                            </span>
                            <span className="text-xs text-slate-400 dark:text-slate-500">
                              {formatDate(comment.created_at)}
                              {comment.created_at !== comment.updated_at && ' (수정됨)'}
                            </span>
                          </div>

                          {user && user.id === comment.user_id && (
                            <div
                              className="relative"
                              ref={openMenuId === comment.id ? menuRef : null}
                            >
                              <button
                                onClick={() =>
                                  setOpenMenuId(
                                    openMenuId === comment.id ? null : comment.id
                                  )
                                }
                                className="p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-600"
                              >
                                <MoreVertical className="w-3.5 h-3.5 text-slate-400" />
                              </button>
                              {openMenuId === comment.id && (
                                <div className="absolute right-0 top-6 z-10 w-28 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg py-1">
                                  <button
                                    onClick={() => {
                                      setEditingId(comment.id);
                                      setEditContent(comment.content);
                                      setOpenMenuId(null);
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                                  >
                                    <Edit2 className="w-3 h-3" /> 수정
                                  </button>
                                  <button
                                    onClick={() => handleDelete(comment.id)}
                                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-red-600 dark:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                                  >
                                    <Trash2 className="w-3 h-3" /> 삭제
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        <p className="text-slate-700 dark:text-slate-300 text-sm whitespace-pre-wrap break-words mt-1">
                          {comment.content}
                        </p>

                        {/* Reply button */}
                        <button
                          onClick={() =>
                            setReplyToId(replyToId === comment.id ? null : comment.id)
                          }
                          className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline mt-1"
                        >
                          답글 {replies.length > 0 && `(${replies.length})`}
                        </button>
                      </>
                    )}

                    {/* Replies */}
                    {replies.length > 0 && (
                      <div className="mt-2 space-y-2 pl-2 border-l-2 border-slate-200 dark:border-slate-600">
                        {replies.map((reply) => {
                          const replyColor = authorColorMap.get(reply.github_username);
                          return (
                            <div key={reply.id} className="flex gap-2">
                              <img
                                src={
                                  reply.github_avatar ||
                                  `https://github.com/${reply.github_username}.png?size=24`
                                }
                                alt=""
                                className="w-5 h-5 rounded-full flex-shrink-0 mt-0.5"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span
                                    className="font-medium text-xs"
                                    style={{ color: replyColor?.dot }}
                                  >
                                    {reply.github_username}
                                  </span>
                                  <span className="text-[10px] text-slate-400 dark:text-slate-500">
                                    {formatDate(reply.created_at)}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap break-words">
                                  {reply.content}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Reply input */}
                    {replyToId === comment.id && user && (
                      <div className="mt-2 flex gap-2 items-end">
                        <img
                          src={user.avatar_url}
                          alt=""
                          className="w-5 h-5 rounded-full flex-shrink-0"
                        />
                        <textarea
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
                          placeholder="답글..."
                          rows={1}
                          className="flex-1 px-2 py-1.5 rounded-md border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleReply(comment);
                            }
                          }}
                        />
                        <button
                          onClick={() => handleReply(comment)}
                          disabled={!replyContent.trim() || replySubmitting}
                          className="p-1.5 rounded-md bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white flex-shrink-0"
                        >
                          <Send className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

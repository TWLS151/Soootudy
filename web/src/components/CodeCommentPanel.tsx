import { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, Edit2, Trash2, MoreVertical } from 'lucide-react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import ReactionBar from './ReactionBar';
import MentionTextarea from './MentionTextarea';
import { renderMentionContent } from '../lib/mention';
import type { Comment, Members, Reaction } from '../types';
import type { AuthorColor, CodeCommentUser } from '../hooks/useCodeComments';

interface CodeCommentPanelProps {
  comments: Comment[];
  loading: boolean;
  user: CodeCommentUser | null;
  members: Members;
  authorColorMap: Map<string, AuthorColor>;
  getReplies: (parentId: string) => Comment[];
  onUpdateComment: (id: string, content: string) => Promise<void>;
  onDeleteComment: (id: string) => Promise<void>;
  onAddReply: (content: string, lineNumber: number, parentId: string) => Promise<void>;
  onLineSelect?: (lineNumber: number) => void;
  reactions?: Reaction[];
  onToggleReaction?: (commentId: string, emoji: string) => void;
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

function resolveDisplayName(githubUsername: string, members: Members): string {
  for (const m of Object.values(members)) {
    if (m.github.toLowerCase() === githubUsername.toLowerCase()) {
      return m.name;
    }
  }
  return githubUsername;
}

export default function CodeCommentPanel({
  comments,
  loading,
  user,
  members,
  authorColorMap,
  getReplies,
  onUpdateComment,
  onDeleteComment,
  onAddReply,
  onLineSelect,
  reactions = [],
  onToggleReaction,
}: CodeCommentPanelProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [replySubmitting, setReplySubmitting] = useState(false);
  const replySubmittingRef = useRef(false);
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
    if (!replyContent.trim() || !parentComment.line_number || replySubmittingRef.current) return;
    replySubmittingRef.current = true;
    setReplySubmitting(true);
    try {
      await onAddReply(replyContent.trim(), parentComment.line_number, parentComment.id);
      setReplyContent('');
      setReplyToId(null);
    } catch {
      alert('답글 작성에 실패했습니다.');
    } finally {
      replySubmittingRef.current = false;
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
      <div className="pb-2 mb-1.5 border-b border-slate-200 dark:border-slate-700">
        <h2 className="flex items-center gap-1.5 text-sm font-semibold text-slate-900 dark:text-slate-100">
          <MessageSquare className="w-4 h-4" />
          댓글 {topLevelComments.length > 0 && `(${topLevelComments.length})`}
        </h2>
      </div>

      {/* Comment list */}
      <div className="flex-1 overflow-y-auto space-y-1.5 pr-1" onClick={() => setReplyToId(null)}>
        {topLevelComments.length === 0 ? (
          <div className="flex flex-col items-center py-6">
            <div className="w-16 h-16">
              <DotLottieReact src="/cat.lottie" loop autoplay />
            </div>
            <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">
              코드 줄을 클릭하여 댓글을 작성하세요
            </p>
          </div>
        ) : (
          topLevelComments.map((comment) => {
            const authorColor = authorColorMap.get(comment.github_username);
            const replies = getReplies(comment.id);
            const isReplying = replyToId === comment.id;

            return (
              <div
                key={comment.id}
                className={`rounded-md border px-2 py-1.5 cursor-pointer transition-colors ${
                  authorColor?.bgClass || 'bg-slate-50 dark:bg-slate-800/50'
                } ${authorColor?.borderClass || 'border-slate-200 dark:border-slate-700'}`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (editingId) return;
                  setReplyToId(isReplying ? null : comment.id);
                }}
              >
                {/* Line badge + menu inline */}
                <div className="flex items-center justify-between mb-0.5">
                  {comment.line_number != null && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onLineSelect?.(comment.line_number!);
                      }}
                      className="text-[10px] font-mono px-1 py-0.5 rounded bg-slate-200/80 dark:bg-slate-700/80 text-slate-500 dark:text-slate-400 hover:bg-indigo-100 dark:hover:bg-indigo-900 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                    >
                      Line{comment.line_number}
                    </button>
                  )}

                  {user && user.id === comment.user_id && (
                    <div
                      className="relative"
                      ref={openMenuId === comment.id ? menuRef : null}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() =>
                          setOpenMenuId(
                            openMenuId === comment.id ? null : comment.id
                          )
                        }
                        className="p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-600"
                      >
                        <MoreVertical className="w-3 h-3 text-slate-400" />
                      </button>
                      {openMenuId === comment.id && (
                        <div className="absolute right-0 top-5 z-10 w-24 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg py-0.5">
                          <button
                            onClick={() => {
                              setEditingId(comment.id);
                              setEditContent(comment.content);
                              setOpenMenuId(null);
                            }}
                            className="w-full flex items-center gap-1.5 px-2.5 py-1 text-[11px] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                          >
                            <Edit2 className="w-2.5 h-2.5" /> 수정
                          </button>
                          <button
                            onClick={() => handleDelete(comment.id)}
                            className="w-full flex items-center gap-1.5 px-2.5 py-1 text-[11px] text-red-600 dark:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                          >
                            <Trash2 className="w-2.5 h-2.5" /> 삭제
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Comment body */}
                <div className="flex gap-1.5">
                  <img
                    src={
                      comment.github_avatar ||
                      `https://github.com/${comment.github_username}.png?size=24`
                    }
                    alt=""
                    className="w-5 h-5 rounded-full flex-shrink-0 mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    {editingId === comment.id ? (
                      <div className="space-y-1.5" onClick={(e) => e.stopPropagation()}>
                        <MentionTextarea
                          value={editContent}
                          onChange={setEditContent}
                          members={members}
                          rows={2}
                          className="w-full px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                        />
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => handleUpdate(comment.id)}
                            className="px-2 py-0.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-medium rounded-md"
                          >
                            저장
                          </button>
                          <button
                            onClick={() => {
                              setEditingId(null);
                              setEditContent('');
                            }}
                            className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-medium rounded-md"
                          >
                            취소
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-1">
                          <span
                            className="font-semibold text-xs"
                            style={{ color: authorColor?.dot }}
                          >
                            {resolveDisplayName(comment.github_username, members)}
                          </span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500">
                            {formatDate(comment.created_at)}
                            {comment.created_at !== comment.updated_at && ' (수정됨)'}
                          </span>
                        </div>

                        <p className="text-slate-700 dark:text-slate-300 text-sm whitespace-pre-wrap break-words">
                          {renderMentionContent(comment.content, members)}
                        </p>
                        {onToggleReaction && (
                          <ReactionBar
                            commentId={comment.id}
                            reactions={reactions}
                            currentUserId={user?.id ?? null}
                            onToggle={(emoji) => onToggleReaction(comment.id, emoji)}
                            resolveDisplayName={(u) => resolveDisplayName(u, members)}
                          />
                        )}
                      </>
                    )}

                    {/* Replies + inline reply input */}
                    {(replies.length > 0 || isReplying) && (
                      <div className="mt-1 space-y-1 pl-1.5 border-l-2 border-slate-200 dark:border-slate-600">
                        {replies.map((reply) => {
                          const replyColor = authorColorMap.get(reply.github_username);
                          return (
                            <div key={reply.id} className="flex gap-1.5">
                              <img
                                src={
                                  reply.github_avatar ||
                                  `https://github.com/${reply.github_username}.png?size=20`
                                }
                                alt=""
                                className="w-4 h-4 rounded-full flex-shrink-0 mt-0.5"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1">
                                    <span
                                      className="font-medium text-[10px]"
                                      style={{ color: replyColor?.dot }}
                                    >
                                      {resolveDisplayName(reply.github_username, members)}
                                    </span>
                                    <span className="text-[10px] text-slate-400 dark:text-slate-500">
                                      {formatDate(reply.created_at)}
                                      {reply.created_at !== reply.updated_at && ' (수정됨)'}
                                    </span>
                                  </div>
                                  {user && user.id === reply.user_id && (
                                    <div
                                      className="relative"
                                      ref={openMenuId === reply.id ? menuRef : null}
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <button
                                        onClick={() =>
                                          setOpenMenuId(
                                            openMenuId === reply.id ? null : reply.id
                                          )
                                        }
                                        className="p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-600"
                                      >
                                        <MoreVertical className="w-2.5 h-2.5 text-slate-400" />
                                      </button>
                                      {openMenuId === reply.id && (
                                        <div className="absolute right-0 top-5 z-10 w-24 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg py-0.5">
                                          <button
                                            onClick={() => {
                                              setEditingId(reply.id);
                                              setEditContent(reply.content);
                                              setOpenMenuId(null);
                                            }}
                                            className="w-full flex items-center gap-1.5 px-2.5 py-1 text-[11px] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                                          >
                                            <Edit2 className="w-2.5 h-2.5" /> 수정
                                          </button>
                                          <button
                                            onClick={() => handleDelete(reply.id)}
                                            className="w-full flex items-center gap-1.5 px-2.5 py-1 text-[11px] text-red-600 dark:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                                          >
                                            <Trash2 className="w-2.5 h-2.5" /> 삭제
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                                {editingId === reply.id ? (
                                  <div className="space-y-1.5" onClick={(e) => e.stopPropagation()}>
                                    <MentionTextarea
                                      value={editContent}
                                      onChange={setEditContent}
                                      members={members}
                                      rows={2}
                                      className="w-full px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                                    />
                                    <div className="flex gap-1.5">
                                      <button
                                        onClick={() => handleUpdate(reply.id)}
                                        className="px-2 py-0.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-medium rounded-md"
                                      >
                                        저장
                                      </button>
                                      <button
                                        onClick={() => {
                                          setEditingId(null);
                                          setEditContent('');
                                        }}
                                        className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-medium rounded-md"
                                      >
                                        취소
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap break-words">
                                      {renderMentionContent(reply.content, members)}
                                    </p>
                                    {onToggleReaction && (
                                      <ReactionBar
                                        commentId={reply.id}
                                        reactions={reactions}
                                        currentUserId={user?.id ?? null}
                                        onToggle={(emoji) => onToggleReaction(reply.id, emoji)}
                                        resolveDisplayName={(u) => resolveDisplayName(u, members)}
                                      />
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        })}
                        {/* Reply input — inline within reply thread */}
                        {isReplying && user && (
                          <div
                            className="flex gap-1.5 items-start mt-1.5"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <img
                              src={user.avatar_url}
                              alt=""
                              className="w-4 h-4 rounded-full flex-shrink-0 mt-0.5"
                            />
                            <div className="flex-1 min-w-0">
                              <MentionTextarea
                                value={replyContent}
                                onChange={setReplyContent}
                                members={members}
                                placeholder="답글..."
                                rows={1}
                                autoFocus
                                className="w-full px-0 py-0.5 bg-transparent text-slate-900 dark:text-slate-100 text-xs focus:outline-none resize-none overflow-hidden placeholder:text-slate-400 dark:placeholder:text-slate-500"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleReply(comment);
                                  }
                                  if (e.key === 'Escape') {
                                    setReplyToId(null);
                                  }
                                }}
                              />
                              {replyContent.trim() && (
                                <div className="flex justify-end">
                                  <button
                                    onClick={() => handleReply(comment)}
                                    disabled={replySubmitting}
                                    className="p-1 rounded-md bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white"
                                  >
                                    <Send className="w-3 h-3" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
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

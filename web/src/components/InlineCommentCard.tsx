import { useState, useRef, useEffect } from 'react';
import { Send, X, MoreVertical, Edit2, Trash2 } from 'lucide-react';
import ReactionBar from './ReactionBar';
import MentionTextarea from './MentionTextarea';
import { renderMentionContent } from '../lib/mention';
import type { Comment, Members, Reaction } from '../types';
import type { AuthorColor, CodeCommentUser } from '../hooks/useCodeComments';

interface InlineCommentCardProps {
  lineNumber: number;
  comments: Comment[];
  allComments: Comment[];
  user: CodeCommentUser | null;
  members: Members;
  authorColorMap: Map<string, AuthorColor>;
  initialReplyTo?: string | null;
  onSubmit: (content: string, parentId?: string) => Promise<void>;
  onClose: () => void;
  onDeleteComment?: (id: string) => Promise<void>;
  onUpdateComment?: (id: string, content: string) => Promise<void>;
  dark: boolean;
  reactions?: Reaction[];
  onToggleReaction?: (commentId: string, emoji: string) => void;
  inputOnly?: boolean;
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

export default function InlineCommentCard({
  lineNumber,
  comments,
  allComments,
  user,
  members,
  authorColorMap,
  initialReplyTo,
  onSubmit,
  onClose,
  onDeleteComment,
  onUpdateComment,
  dark: _dark,
  reactions = [],
  onToggleReaction,
  inputOnly = false,
}: InlineCommentCardProps) {
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  // 점 근처 클릭이면 답글 모드, 아니면 새 댓글 모드
  const [replyTo, setReplyTo] = useState<string | null>(initialReplyTo ?? null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const submittingRef = useRef(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Auto-focus input
  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(timer);
  }, [lineNumber]);

  // Click outside to close menu
  useEffect(() => {
    function handleMenuClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    }
    document.addEventListener('mousedown', handleMenuClickOutside);
    return () => document.removeEventListener('mousedown', handleMenuClickOutside);
  }, []);

  // Click outside to close (ignore clicks on code lines)
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Element;
      if (target.closest('[data-code-container]')) return;
      if (cardRef.current?.contains(target)) return;
      onClose();
    }
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 10);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  async function handleSubmit() {
    if (!content.trim() || submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    try {
      await onSubmit(content.trim(), replyTo || undefined);
      setContent('');
      setReplyTo(null);
    } catch {
      alert('댓글 작성에 실패했습니다.');
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  async function handleDeleteReply(replyId: string) {
    setOpenMenuId(null);
    if (!onDeleteComment) return;
    if (!confirm('답글을 삭제하시겠습니까?')) return;
    try {
      await onDeleteComment(replyId);
    } catch {
      alert('답글 삭제에 실패했습니다.');
    }
  }

  async function handleUpdateReply(replyId: string) {
    if (!editContent.trim() || !onUpdateComment) return;
    try {
      await onUpdateComment(replyId, editContent.trim());
      setEditingId(null);
      setEditContent('');
    } catch {
      alert('답글 수정에 실패했습니다.');
    }
  }

  // Get replies for a parent comment
  function getReplies(parentId: string): Comment[] {
    return allComments
      .filter((c) => c.parent_id === parentId)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }

  const firstCommentColor =
    !inputOnly && comments.length > 0 ? authorColorMap.get(comments[0].github_username) : null;

  // 인라인 입력 영역 렌더 (답글 모드일 때 댓글 아래에, 아닐 때 하단에)
  const renderInput = (isReply: boolean) => {
    if (!user) return null;
    return (
      <div className={`flex gap-1.5 items-start ${isReply ? 'mt-1.5' : ''}`}>
        <img src={user.avatar_url} alt="" className="w-4 h-4 rounded-full shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <MentionTextarea
            textareaRef={inputRef}
            value={content}
            onChange={setContent}
            members={members}
            placeholder={isReply ? '답글...' : '댓글을 입력하세요...'}
            rows={isReply ? 1 : 2}
            className={`w-full px-0 py-0.5 bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none resize-none overflow-hidden placeholder:text-slate-400 dark:placeholder:text-slate-500 ${isReply ? 'text-xs' : 'text-sm'}`}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
              if (e.key === 'Escape') {
                if (replyTo) setReplyTo(null);
                else onClose();
              }
            }}
          />
          {content.trim() && (
            <div className="flex justify-end">
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="p-1 rounded-md bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white"
              >
                <Send className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div
      ref={cardRef}
      className={`relative rounded-lg shadow-xl border overflow-hidden ${
        firstCommentColor
          ? `${firstCommentColor.bgClass} ${firstCommentColor.borderClass}`
          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
      }`}
      style={{ backdropFilter: 'blur(8px)' }}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-2 right-2 p-0.5 rounded hover:bg-slate-200/60 dark:hover:bg-slate-700/60 z-10"
      >
        <X className="w-3.5 h-3.5 text-slate-400" />
      </button>

      <div className="p-3 space-y-2.5 max-h-72 overflow-y-auto" onClick={() => setReplyTo(null)}>
        {/* Existing comments */}
        {!inputOnly && comments.map((comment) => {
          const replies = getReplies(comment.id);
          const color = authorColorMap.get(comment.github_username);
          const isReplyTarget = replyTo === comment.id;
          return (
            <div
                key={comment.id}
                className="cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  setReplyTo(comment.id);
                  setTimeout(() => inputRef.current?.focus(), 50);
                }}
              >
              <div className="flex gap-2">
                <img
                  src={
                    comment.github_avatar ||
                    `https://github.com/${comment.github_username}.png?size=24`
                  }
                  alt=""
                  className="w-5 h-5 rounded-full mt-0.5 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="text-xs font-semibold"
                      style={{ color: color?.dot }}
                    >
                      {resolveDisplayName(comment.github_username, members)}
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">
                      {formatDate(comment.created_at)}
                    </span>
                  </div>
                  <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap break-words mt-0.5">
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
                </div>
              </div>
              {/* Replies + inline reply input */}
              {(replies.length > 0 || isReplyTarget) && (
                <div className="mt-1.5 ml-7 space-y-1.5 pl-2 border-l-2 border-slate-200 dark:border-slate-600">
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
                          className="w-4 h-4 rounded-full mt-0.5 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1">
                              <span
                                className="text-[11px] font-semibold"
                                style={{ color: replyColor?.dot }}
                              >
                                {resolveDisplayName(reply.github_username, members)}
                              </span>
                              <span className="text-[10px] text-slate-400 dark:text-slate-500">
                                {formatDate(reply.created_at)}
                                {reply.created_at !== reply.updated_at && ' (수정됨)'}
                              </span>
                            </div>
                            {user && user.id === reply.user_id && onDeleteComment && (
                              <div
                                className="relative"
                                ref={openMenuId === reply.id ? menuRef : null}
                              >
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenMenuId(
                                      openMenuId === reply.id ? null : reply.id
                                    );
                                  }}
                                  className="p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-600"
                                >
                                  <MoreVertical className="w-3 h-3 text-slate-400" />
                                </button>
                                {openMenuId === reply.id && (
                                  <div className="absolute right-0 top-5 z-10 w-24 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg py-0.5">
                                    {onUpdateComment && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setEditingId(reply.id);
                                          setEditContent(reply.content);
                                          setOpenMenuId(null);
                                        }}
                                        className="w-full flex items-center gap-1.5 px-2.5 py-1 text-[11px] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                                      >
                                        <Edit2 className="w-2.5 h-2.5" /> 수정
                                      </button>
                                    )}
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteReply(reply.id);
                                      }}
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
                            <div className="space-y-1.5 mt-1" onClick={(e) => e.stopPropagation()}>
                              <MentionTextarea
                                value={editContent}
                                onChange={setEditContent}
                                members={members}
                                rows={2}
                                className="w-full px-2 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                              />
                              <div className="flex gap-1.5">
                                <button
                                  onClick={() => handleUpdateReply(reply.id)}
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
                              <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap break-words mt-0.5">
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
                  {/* 답글 입력 — 댓글 클릭 시 해당 답글 스레드 안에 표시 */}
                  {isReplyTarget && renderInput(true)}
                </div>
              )}
            </div>
          );
        })}

        {/* 새 댓글 입력 — 답글 모드가 아닐 때 or inputOnly일 때 하단에 표시 */}
        {!replyTo && renderInput(false)}
      </div>
    </div>
  );
}

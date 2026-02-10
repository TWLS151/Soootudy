import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { createCommentNotification } from '../services/notifications';
import type { Comment, Members, Reaction } from '../types';

const AUTHOR_COLORS = [
  { dot: '#3b82f6', bgClass: 'bg-blue-50 dark:bg-blue-950/30', borderClass: 'border-blue-200 dark:border-blue-800', bgLight: '#eff6ff', bgDark: 'rgba(23,37,84,0.3)', borderLight: '#bfdbfe', borderDark: '#1e40af' },
  { dot: '#10b981', bgClass: 'bg-emerald-50 dark:bg-emerald-950/30', borderClass: 'border-emerald-200 dark:border-emerald-800', bgLight: '#ecfdf5', bgDark: 'rgba(2,44,34,0.3)', borderLight: '#a7f3d0', borderDark: '#065f46' },
  { dot: '#f59e0b', bgClass: 'bg-amber-50 dark:bg-amber-950/30', borderClass: 'border-amber-200 dark:border-amber-800', bgLight: '#fffbeb', bgDark: 'rgba(69,26,3,0.3)', borderLight: '#fde68a', borderDark: '#92400e' },
  { dot: '#ec4899', bgClass: 'bg-pink-50 dark:bg-pink-950/30', borderClass: 'border-pink-200 dark:border-pink-800', bgLight: '#fdf2f8', bgDark: 'rgba(80,7,36,0.3)', borderLight: '#fbcfe8', borderDark: '#9d174d' },
  { dot: '#6366f1', bgClass: 'bg-indigo-50 dark:bg-indigo-950/30', borderClass: 'border-indigo-200 dark:border-indigo-800', bgLight: '#eef2ff', bgDark: 'rgba(30,27,75,0.3)', borderLight: '#c7d2fe', borderDark: '#3730a3' },
  { dot: '#14b8a6', bgClass: 'bg-teal-50 dark:bg-teal-950/30', borderClass: 'border-teal-200 dark:border-teal-800', bgLight: '#f0fdfa', bgDark: 'rgba(4,47,46,0.3)', borderLight: '#99f6e4', borderDark: '#115e59' },
];

export type AuthorColor = (typeof AUTHOR_COLORS)[0];

export interface CommentDot {
  line: number;
  column: number; // character column position
  color: string;
  offsetIndex: number; // offset for overlapping dots at same position
  bgLight: string;
  bgDark: string;
  borderLight: string;
  borderDark: string;
}

export interface CodeCommentUser {
  id: string;
  github_username: string;
  avatar_url: string;
}

export function useCodeComments(problemId: string, members?: Members) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<CodeCommentUser | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      if (u) {
        setUser({
          id: u.id,
          github_username: u.user_metadata.user_name || u.user_metadata.preferred_username || 'Unknown',
          avatar_url: u.user_metadata.avatar_url || '',
        });
      }
    });
  }, []);

  const loadComments = useCallback(async () => {
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
  }, [problemId]);

  const loadReactions = useCallback(async () => {
    try {
      // Load reactions for all comments in this problem
      // We need comment IDs, but they're loaded async. Instead, join via comment_id.
      // Since we can't filter by problem_id directly, load after comments are available.
      if (comments.length === 0) {
        setReactions([]);
        return;
      }
      const commentIds = comments.map((c) => c.id);
      const { data, error } = await supabase
        .from('comment_reactions')
        .select('*')
        .in('comment_id', commentIds);

      if (error) throw error;
      setReactions(data || []);
    } catch (error) {
      console.error('Failed to load reactions:', error);
    }
  }, [comments]);

  useEffect(() => {
    loadComments();

    const subscription = supabase
      .channel(`code-comments:${problemId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
          filter: `problem_id=eq.${problemId}`,
        },
        () => loadComments()
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [problemId, loadComments]);

  // Load reactions when comments change
  useEffect(() => {
    loadReactions();
  }, [loadReactions]);

  // Realtime subscription for reactions
  useEffect(() => {
    const subscription = supabase
      .channel(`code-reactions:${problemId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comment_reactions',
        },
        () => loadReactions()
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [problemId, loadReactions]);

  // Author color: first commenter on the problem gets color 0, second gets color 1, etc.
  const authorColorMap = useMemo(() => {
    const map = new Map<string, AuthorColor>();
    const seen: string[] = [];
    const sorted = [...comments].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    for (const comment of sorted) {
      if (!seen.includes(comment.github_username)) {
        seen.push(comment.github_username);
        map.set(
          comment.github_username,
          AUTHOR_COLORS[(seen.length - 1) % AUTHOR_COLORS.length]
        );
      }
    }

    return map;
  }, [comments]);

  // Top-level comments grouped by line
  const commentsByLine = useMemo(() => {
    const map = new Map<number, Comment[]>();
    for (const comment of comments) {
      if (comment.line_number != null && !comment.parent_id) {
        const line = comment.line_number;
        if (!map.has(line)) map.set(line, []);
        map.get(line)!.push(comment);
      }
    }
    return map;
  }, [comments]);

  // Dots: one per unique (line, column, author) — positioned at click column
  const dots = useMemo<CommentDot[]>(() => {
    const result: CommentDot[] = [];
    const seenKeys = new Set<string>();
    const positionOffsets = new Map<string, number>();

    for (const [line, lineComments] of commentsByLine) {
      for (const comment of lineComments) {
        const column = comment.column_number ?? 0;
        const author = comment.github_username;
        const uniqueKey = `${line}:${column}:${author}`;

        if (seenKeys.has(uniqueKey)) continue;
        seenKeys.add(uniqueKey);

        const posKey = `${line}:${column}`;
        const offsetIndex = positionOffsets.get(posKey) || 0;
        positionOffsets.set(posKey, offsetIndex + 1);

        const color = authorColorMap.get(author);
        result.push({
          line, column, color: color?.dot || '#6366f1', offsetIndex,
          bgLight: color?.bgLight || '#eef2ff',
          bgDark: color?.bgDark || 'rgba(30,27,75,0.3)',
          borderLight: color?.borderLight || '#c7d2fe',
          borderDark: color?.borderDark || '#3730a3',
        });
      }
    }
    return result;
  }, [commentsByLine, authorColorMap]);

  // Get replies for a specific parent comment
  const getReplies = useCallback(
    (parentId: string): Comment[] => {
      return comments
        .filter((c) => c.parent_id === parentId)
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    },
    [comments]
  );

  const addComment = useCallback(
    async (content: string, lineNumber: number, parentId?: string, columnNumber?: number) => {
      if (!content.trim() || !user) return;

      const insertData: Record<string, unknown> = {
        problem_id: problemId,
        user_id: user.id,
        github_username: user.github_username,
        github_avatar: user.avatar_url,
        content: content.trim(),
        line_number: lineNumber,
      };

      if (columnNumber != null) {
        insertData.column_number = columnNumber;
      }

      if (parentId) {
        insertData.parent_id = parentId;
      }

      const { error } = await supabase.from('comments').insert(insertData);
      if (error) throw error;

      // 알림 생성 (fire-and-forget)
      if (members) {
        createCommentNotification({
          problemId,
          actorGithubUsername: user.github_username,
          actorAvatar: user.avatar_url,
          commentContent: content.trim(),
          members,
        }).catch((err) => console.error('Failed to create notification:', err));
      }

      await loadComments();
    },
    [user, problemId, loadComments, members]
  );

  const updateComment = useCallback(
    async (id: string, content: string) => {
      if (!content.trim()) return;
      const { error } = await supabase
        .from('comments')
        .update({ content: content.trim() })
        .eq('id', id);
      if (error) throw error;
      await loadComments();
    },
    [loadComments]
  );

  const deleteComment = useCallback(
    async (id: string) => {
      const { error } = await supabase.from('comments').delete().eq('id', id);
      if (error) throw error;
      await loadComments();
    },
    [loadComments]
  );

  const toggleReaction = useCallback(
    async (commentId: string, emoji: string) => {
      if (!user) return;

      const existing = reactions.find(
        (r) => r.comment_id === commentId && r.user_id === user.id && r.emoji === emoji
      );

      if (existing) {
        // Remove reaction
        const { error } = await supabase
          .from('comment_reactions')
          .delete()
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        // Add reaction
        const { error } = await supabase
          .from('comment_reactions')
          .insert({
            comment_id: commentId,
            user_id: user.id,
            github_username: user.github_username,
            emoji,
          });
        if (error) throw error;
      }

      await loadReactions();
    },
    [user, reactions, loadReactions]
  );

  return {
    comments,
    reactions,
    loading,
    user,
    authorColorMap,
    commentsByLine,
    dots,
    getReplies,
    addComment,
    updateComment,
    deleteComment,
    toggleReaction,
  };
}

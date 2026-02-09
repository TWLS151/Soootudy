import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Comment } from '../types';

const AUTHOR_COLORS = [
  { dot: '#3b82f6', bgClass: 'bg-blue-50 dark:bg-blue-950/30', borderClass: 'border-blue-200 dark:border-blue-800' },
  { dot: '#10b981', bgClass: 'bg-emerald-50 dark:bg-emerald-950/30', borderClass: 'border-emerald-200 dark:border-emerald-800' },
  { dot: '#f59e0b', bgClass: 'bg-amber-50 dark:bg-amber-950/30', borderClass: 'border-amber-200 dark:border-amber-800' },
  { dot: '#ec4899', bgClass: 'bg-pink-50 dark:bg-pink-950/30', borderClass: 'border-pink-200 dark:border-pink-800' },
  { dot: '#6366f1', bgClass: 'bg-indigo-50 dark:bg-indigo-950/30', borderClass: 'border-indigo-200 dark:border-indigo-800' },
  { dot: '#14b8a6', bgClass: 'bg-teal-50 dark:bg-teal-950/30', borderClass: 'border-teal-200 dark:border-teal-800' },
];

export type AuthorColor = (typeof AUTHOR_COLORS)[0];

export interface CommentDot {
  line: number;
  column: number; // character column position
  color: string;
  offsetIndex: number; // offset for overlapping dots at same position
}

export interface CodeCommentUser {
  id: string;
  github_username: string;
  avatar_url: string;
}

export function useCodeComments(problemId: string) {
  const [comments, setComments] = useState<Comment[]>([]);
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
        result.push({ line, column, color: color?.dot || '#6366f1', offsetIndex });
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
      await loadComments();
    },
    [user, problemId, loadComments]
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

  return {
    comments,
    loading,
    user,
    authorColorMap,
    commentsByLine,
    dots,
    getReplies,
    addComment,
    updateComment,
    deleteComment,
  };
}

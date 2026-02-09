import { supabase } from '../lib/supabase';
import type { Members } from '../types';

/**
 * 다른 사람의 코드에 댓글을 달면 해당 코드 소유자에게 알림 생성.
 * 자기 코드에 댓글을 달면 알림을 생성하지 않음.
 */
export async function createCommentNotification({
  problemId,
  actorGithubUsername,
  actorAvatar,
  commentContent,
  members,
}: {
  problemId: string;
  actorGithubUsername: string;
  actorAvatar: string | null;
  commentContent: string;
  members: Members;
}) {
  // problemId: "jsc/26-02-w1/swea-2005"
  const parts = problemId.split('/');
  if (parts.length !== 3) return;

  const [problemMember, problemWeek, problemName] = parts;

  // 소유자 확인
  const ownerMember = members[problemMember];
  if (!ownerMember) return;

  // 자기 코드면 알림 안 보냄
  if (ownerMember.github.toLowerCase() === actorGithubUsername.toLowerCase()) return;

  // user_profiles에서 소유자의 user_id 조회
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('user_id')
    .eq('github_username', ownerMember.github)
    .limit(1)
    .single();

  if (!profile) return;

  // 알림 생성
  await supabase.from('notifications').insert({
    user_id: profile.user_id,
    type: 'comment',
    actor_github_username: actorGithubUsername,
    actor_avatar: actorAvatar,
    problem_id: problemId,
    problem_member: problemMember,
    problem_week: problemWeek,
    problem_name: problemName,
    comment_preview:
      commentContent.length > 80 ? commentContent.slice(0, 80) + '...' : commentContent,
  });
}

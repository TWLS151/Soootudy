export interface Member {
  name: string;
  github: string;
  admin?: boolean;
  virtual?: boolean;
}

export interface Members {
  [id: string]: Member;
}

export interface Problem {
  id: string;
  member: string;
  week: string;
  name: string;
  source: 'swea' | 'boj' | 'etc';
  path: string;
  hasNote: boolean;
  notePath?: string;
  difficulty?: string; // e.g., "D1", "D2" for SWEA, "골드", "실버" for BOJ, "미정" as default
  version?: number;
  baseName?: string;
}

export interface FileContent {
  code: string;
  note: string | null;
}

export interface GitHubTreeItem {
  path: string;
  mode: string;
  type: string;
  sha: string;
  size?: number;
  url: string;
}

export interface GitHubTreeResponse {
  sha: string;
  url: string;
  tree: GitHubTreeItem[];
  truncated: boolean;
}

export interface MemberActivity {
  dates: string[]; // YYYY-MM-DD format, sorted
  streak: number;
}

export interface Activities {
  [memberId: string]: MemberActivity;
}

export interface AppData {
  members: Members;
  problems: Problem[];
  weeks: string[];
  activities: Activities;
  loading: boolean;
  error: string | null;
}

export interface Comment {
  id: string;
  problem_id: string;
  user_id: string;
  github_username: string;
  github_avatar: string | null;
  content: string;
  created_at: string;
  updated_at: string;
  line_number?: number | null;
  column_number?: number | null;
  parent_id?: string | null;
}

export type ExamType = 'IM' | 'A';

export interface DailyProblem {
  id: string;
  date: string | null;
  source: 'swea' | 'boj' | 'etc';
  problem_number: string;
  problem_title: string;
  problem_url: string | null;
  exam_type: ExamType | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface StudyConfig {
  id: string;
  required_comments: number;
  required_submissions: number;
  updated_at: string;
  updated_by: string | null;
}

export interface Reaction {
  id: string;
  comment_id: string;
  user_id: string;
  github_username: string;
  emoji: string;
  created_at: string;
}

export interface MemberCharacter {
  id: string;
  member_id: string;
  selected_character: string;
  unlocked_characters: string[];
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'comment';
  actor_github_username: string;
  actor_avatar: string | null;
  problem_id: string;
  problem_member: string;
  problem_week: string;
  problem_name: string;
  comment_preview: string | null;
  is_read: boolean;
  created_at: string;
}

export interface CodeBookmark {
  id: string;
  user_id: string;
  problem_id: string;
  memo: string | null;
  created_at: string;
}

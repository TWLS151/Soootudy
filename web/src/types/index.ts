export interface Member {
  name: string;
  github: string;
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

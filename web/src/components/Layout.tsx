import { useState } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { FlaskConical, Upload, PanelLeftClose, PanelLeft } from 'lucide-react';
import Sidebar from './Sidebar';
import SearchBar from './SearchBar';
import ThemeToggle from './ThemeToggle';
import UserMenu from './UserMenu';
import type { User } from '@supabase/supabase-js';
import type { Members, Problem, Activities } from '../types';

interface LayoutProps {
  members: Members;
  problems: Problem[];
  weeks: string[];
  activities: Activities;
  dark: boolean;
  toggleTheme: () => void;
  addProblem: (problem: Problem) => void;
  user: User;
  onLogout: () => void;
}

export default function Layout({ members, problems, weeks, activities, dark, toggleTheme, addProblem, user, onLogout }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* 헤더 */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 z-50 flex items-center px-4 gap-4">
        {/* 햄버거 메뉴 (모바일) */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="lg:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <svg className="w-5 h-5 text-slate-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* 사이드바 토글 (데스크톱) */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="hidden lg:flex p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400"
          title={sidebarCollapsed ? '사이드바 열기' : '사이드바 닫기'}
        >
          {sidebarCollapsed ? <PanelLeft className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
        </button>

        {/* 로고 */}
        <div className="flex items-center gap-2 shrink-0">
          <Link to="/" className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
            Soootudy
          </Link>
          <span
            className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300 cursor-help"
            title="베타 버전 (2026.02.05 - 02.12)"
          >
            BETA
          </span>
        </div>

        {/* 검색바 */}
        <div className="flex-1 flex justify-center">
          <SearchBar problems={problems} members={members} />
        </div>

        {/* 다크모드 토글 */}
        <ThemeToggle dark={dark} toggle={toggleTheme} />

        {/* 제출 */}
        <Link
          to="/submit"
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
        >
          <Upload className="w-5 h-5" />
          <span className="text-sm font-medium hidden sm:inline">제출</span>
        </Link>

        {/* 실험실 */}
        <Link
          to="/lab"
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
        >
          <FlaskConical className="w-5 h-5" />
          <span className="text-sm font-medium hidden sm:inline">실험실</span>
        </Link>

        {/* 프로필 메뉴 */}
        <UserMenu user={user} members={members} onLogout={onLogout} />
      </header>

      {/* 사이드바 */}
      <Sidebar
        members={members}
        weeks={weeks}
        open={sidebarOpen}
        collapsed={sidebarCollapsed}
        onClose={() => setSidebarOpen(false)}
        onNavigate={() => { setSidebarOpen(false); setSidebarCollapsed(true); }}
      />

      {/* 메인 콘텐츠 */}
      <main className="pt-16">
        <div className="p-6 max-w-5xl mx-auto">
          <Outlet context={{ members, problems, weeks, activities, dark, addProblem, user }} />
        </div>
      </main>
    </div>
  );
}

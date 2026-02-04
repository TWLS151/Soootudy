import { useState } from 'react';
import { Link, Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import SearchBar from './SearchBar';
import ThemeToggle from './ThemeToggle';
import type { Members, Problem, Activities } from '../types';

interface LayoutProps {
  members: Members;
  problems: Problem[];
  weeks: string[];
  activities: Activities;
  dark: boolean;
  toggleTheme: () => void;
}

export default function Layout({ members, problems, weeks, activities, dark, toggleTheme }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

        {/* 로고 */}
        <Link to="/" className="text-lg font-bold text-indigo-600 dark:text-indigo-400 shrink-0">
          Sootudy
        </Link>

        {/* 검색바 */}
        <div className="flex-1 flex justify-center">
          <SearchBar problems={problems} members={members} />
        </div>

        {/* 다크모드 토글 */}
        <ThemeToggle dark={dark} toggle={toggleTheme} />
      </header>

      {/* 사이드바 */}
      <Sidebar
        members={members}
        weeks={weeks}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* 메인 콘텐츠 */}
      <main className="pt-16 lg:pl-64">
        <div className="p-6 max-w-5xl mx-auto">
          <Outlet context={{ members, problems, weeks, activities, dark }} />
        </div>
      </main>
    </div>
  );
}

import { useState, useRef, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { LogOut, User, Shield, ChevronDown } from 'lucide-react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import type { Members } from '../types';

interface UserMenuProps {
  user: SupabaseUser;
  members: Members;
  onLogout: () => void;
}

export default function UserMenu({ user, members, onLogout }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const githubUsername = user.user_metadata?.user_name || user.user_metadata?.preferred_username;
  const avatarUrl = user.user_metadata?.avatar_url || `https://github.com/${githubUsername}.png?size=32`;

  const { memberId, memberName, isAdmin } = useMemo(() => {
    for (const [id, member] of Object.entries(members)) {
      if (member.github.toLowerCase() === githubUsername?.toLowerCase()) {
        return { memberId: id, memberName: member.name, isAdmin: member.admin === true };
      }
    }
    return { memberId: null, memberName: githubUsername, isAdmin: false };
  }, [members, githubUsername]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      >
        <img
          src={avatarUrl}
          alt={memberName || ''}
          className="w-7 h-7 rounded-full"
        />
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden z-50">
          {/* 프로필 정보 */}
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <img
                src={avatarUrl}
                alt={memberName || ''}
                className="w-9 h-9 rounded-full"
              />
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                  {memberName}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  @{githubUsername}
                </p>
              </div>
            </div>
          </div>

          {/* 메뉴 항목 */}
          <div className="py-1">
            {memberId && (
              <Link
                to={`/member/${memberId}`}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                <User className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                내 페이지
              </Link>
            )}

            {isAdmin && (
              <Link
                to="/admin"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                <Shield className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                관리자
              </Link>
            )}

            <button
              onClick={() => {
                setOpen(false);
                onLogout();
              }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              로그아웃
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

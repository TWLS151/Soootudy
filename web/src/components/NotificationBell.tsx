import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Check } from 'lucide-react';
import type { Notification as AppNotification, Members } from '../types';

interface NotificationBellProps {
  notifications: AppNotification[];
  unreadCount: number;
  members: Members;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
}

function resolveDisplayName(githubUsername: string, members: Members): string {
  for (const m of Object.values(members)) {
    if (m.github.toLowerCase() === githubUsername.toLowerCase()) {
      return m.name;
    }
  }
  return githubUsername;
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

export default function NotificationBell({
  notifications,
  unreadCount,
  members,
  onMarkAsRead,
  onMarkAllAsRead,
}: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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
        className="relative p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      >
        <Bell className="w-5 h-5 text-slate-500 dark:text-slate-400" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden z-50">
          {/* 헤더 */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700">
            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              알림
            </span>
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllAsRead}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                <Check className="w-3 h-3" />
                모두 읽음
              </button>
            )}
          </div>

          {/* 알림 목록 */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm text-slate-400 dark:text-slate-500">알림이 없습니다</p>
              </div>
            ) : (
              notifications.slice(0, 20).map((notif) => (
                <Link
                  key={notif.id}
                  to={`/problem/${notif.problem_member}/${notif.problem_week}/${notif.problem_name}`}
                  onClick={() => {
                    if (!notif.is_read) onMarkAsRead(notif.id);
                    setOpen(false);
                  }}
                  className={`block px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors border-b border-slate-50 dark:border-slate-700/50 ${
                    !notif.is_read ? 'bg-indigo-50/50 dark:bg-indigo-950/20' : ''
                  }`}
                >
                  <div className="flex gap-3">
                    <img
                      src={
                        notif.actor_avatar ||
                        `https://github.com/${notif.actor_github_username}.png?size=32`
                      }
                      alt=""
                      className="w-8 h-8 rounded-full shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-700 dark:text-slate-300">
                        <span className="font-medium text-slate-900 dark:text-slate-100">
                          {resolveDisplayName(notif.actor_github_username, members)}
                        </span>
                        님이 내 코드에 댓글을 남겼습니다
                      </p>
                      {notif.comment_preview && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          &ldquo;{notif.comment_preview}&rdquo;
                        </p>
                      )}
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                        {notif.problem_name} · {formatDate(notif.created_at)}
                      </p>
                    </div>
                    {!notif.is_read && (
                      <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0 mt-2" />
                    )}
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

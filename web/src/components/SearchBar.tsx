import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Problem, Members } from '../types';

interface SearchBarProps {
  problems: Problem[];
  members: Members;
}

export default function SearchBar({ problems, members }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const results = query.trim()
    ? problems.filter((p) => p.name.toLowerCase().includes(query.toLowerCase())).slice(0, 8)
    : [];

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} className="relative w-full max-w-md">
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="문제 검색..."
        className="w-full px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
      />
      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
          {results.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                navigate(`/problem/${p.member}/${p.week}/${p.name}`);
                setQuery('');
                setOpen(false);
              }}
              className="w-full text-left px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 text-sm flex items-center gap-2"
            >
              <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                p.source === 'swea' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' :
                p.source === 'boj' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
              }`}>
                {p.source.toUpperCase()}
              </span>
              <span className="text-slate-900 dark:text-slate-100">{p.name}</span>
              <span className="text-slate-400 text-xs ml-auto">{members[p.member]?.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

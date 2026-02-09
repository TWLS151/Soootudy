import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import SourceBadge from './SourceBadge';
import type { Problem, Members } from '../types';

interface SearchBarProps {
  problems: Problem[];
  members: Members;
}

export default function SearchBar({ problems, members }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const results = query.trim()
    ? problems.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()) || (p.baseName || '').toLowerCase().includes(query.toLowerCase())).slice(0, 8)
    : [];

  const selectResult = useCallback((p: Problem) => {
    navigate(`/problem/${p.member}/${p.week}/${p.name}`);
    setQuery('');
    setOpen(false);
    setSelectedIdx(-1);
  }, [navigate]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open || results.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIdx((prev) => (prev < results.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIdx((prev) => (prev > 0 ? prev - 1 : results.length - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIdx >= 0 && selectedIdx < results.length) {
          selectResult(results[selectedIdx]);
        }
        break;
      case 'Escape':
        setOpen(false);
        setSelectedIdx(-1);
        inputRef.current?.blur();
        break;
    }
  };

  useEffect(() => {
    setSelectedIdx(-1);
  }, [query]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSelectedIdx(-1);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} className="relative w-full max-w-md">
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder="문제 검색..."
        className="w-full px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
      />
      {open && query.trim() && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
          {results.length > 0 ? (
            results.map((p, i) => (
              <button
                key={p.id}
                onClick={() => selectResult(p)}
                onMouseEnter={() => setSelectedIdx(i)}
                className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 ${
                  i === selectedIdx
                    ? 'bg-indigo-50 dark:bg-indigo-950'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <SourceBadge source={p.source} />
                <span className="text-slate-900 dark:text-slate-100">{p.name}</span>
                <span className="text-slate-400 text-xs ml-auto">{members[p.member]?.name}</span>
              </button>
            ))
          ) : (
            <div className="flex flex-col items-center py-4">
              <div className="w-16 h-16">
                <DotLottieReact src="/cat.lottie" loop autoplay />
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">검색 결과가 없습니다</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

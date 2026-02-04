interface FilterChipsProps {
  active: string | null;
  onChange: (source: string | null) => void;
}

const SOURCES = [
  { key: null, label: '전체' },
  { key: 'swea', label: 'SWEA', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' },
  { key: 'boj', label: 'BOJ', color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' },
  { key: 'etc', label: '기타', color: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400' },
] as const;

export default function FilterChips({ active, onChange }: FilterChipsProps) {
  return (
    <div className="flex gap-2 flex-wrap">
      {SOURCES.map((s) => {
        const isActive = active === s.key;
        return (
          <button
            key={s.key ?? 'all'}
            onClick={() => onChange(s.key)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              isActive
                ? 'bg-indigo-600 text-white'
                : s.key === null
                ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                : `${s.color} hover:opacity-80`
            }`}
          >
            {s.label}
          </button>
        );
      })}
    </div>
  );
}

interface SourceBadgeProps {
  source: 'swea' | 'boj' | 'etc';
}

const STYLES: Record<string, string> = {
  swea: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  boj: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  etc: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400',
};

const LABELS: Record<string, string> = {
  swea: 'SWEA',
  boj: 'BOJ',
  etc: '기타',
};

export default function SourceBadge({ source }: SourceBadgeProps) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded font-medium ${STYLES[source]}`}>
      {LABELS[source] || source.toUpperCase()}
    </span>
  );
}

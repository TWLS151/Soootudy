import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight, oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Maximize2, Minimize2 } from 'lucide-react';

interface CodeViewerProps {
  code: string;
  language?: string;
  dark?: boolean;
  showHeader?: boolean;
  title?: string;
  expanded?: boolean;
  onToggleExpand?: () => void;
}

export default function CodeViewer({ code, language = 'python', dark = false, showHeader = true, title, expanded, onToggleExpand }: CodeViewerProps) {
  return (
    <div className="rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
      {showHeader && (
        <div className="flex items-center justify-between px-3 py-2 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
          {title ? (
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{title}</span>
          ) : (
            <span className="text-xs text-slate-500 dark:text-slate-400">Python</span>
          )}
          {onToggleExpand && (
            <button
              onClick={onToggleExpand}
              className="flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
            >
              {expanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              {expanded ? '축소' : '확장'}
            </button>
          )}
        </div>
      )}
      <div className="min-h-[400px]">
        <SyntaxHighlighter
          language={language}
          style={dark ? oneDark : oneLight}
          showLineNumbers
          customStyle={{
            margin: 0,
            borderRadius: 0,
            fontSize: '0.875rem',
            minHeight: '400px',
          }}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}

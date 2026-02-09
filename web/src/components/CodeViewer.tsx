import { useRef, useEffect, useState, useMemo } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight, oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Maximize2, Minimize2 } from 'lucide-react';
import type { CommentDot } from '../hooks/useCodeComments';

interface CodeViewerProps {
  code: string;
  language?: string;
  dark?: boolean;
  showHeader?: boolean;
  title?: string;
  expanded?: boolean;
  onToggleExpand?: () => void;
  // Comment integration
  onLineClick?: (lineNumber: number) => void;
  commentDots?: CommentDot[];
  showDots?: boolean;
  activeCommentLine?: number | null;
  renderInlineCard?: (lineNumber: number) => React.ReactNode;
}

const DOT_PADDING = 20;

export default function CodeViewer({
  code,
  language = 'python',
  dark = false,
  showHeader = true,
  title,
  expanded,
  onToggleExpand,
  onLineClick,
  commentDots,
  showDots,
  activeCommentLine,
  renderInlineCard,
}: CodeViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [cardPosition, setCardPosition] = useState<{ top: number } | null>(null);

  // Group dots by line for lineProps lookup
  const dotsByLine = useMemo(() => {
    const map = new Map<number, CommentDot[]>();
    if (!commentDots) return map;
    for (const dot of commentDots) {
      if (!map.has(dot.line)) map.set(dot.line, []);
      map.get(dot.line)!.push(dot);
    }
    return map;
  }, [commentDots]);

  // Calculate inline card position when active line changes
  useEffect(() => {
    if (activeCommentLine == null || !containerRef.current) {
      setCardPosition(null);
      return;
    }
    const timer = setTimeout(() => {
      const lineEl = containerRef.current?.querySelector(
        `[data-line-number="${activeCommentLine}"]`
      );
      if (!lineEl || !containerRef.current) {
        setCardPosition(null);
        return;
      }
      const containerRect = containerRef.current.getBoundingClientRect();
      const lineRect = lineEl.getBoundingClientRect();
      setCardPosition({ top: lineRect.bottom - containerRect.top + 4 });
    }, 20);
    return () => clearTimeout(timer);
  }, [activeCommentLine, commentDots]);

  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-700" data-code-container>
      {showHeader && (
        <div className="flex items-center justify-between px-3 py-2 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 rounded-t-lg">
          {title ? (
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {title}
            </span>
          ) : (
            <span className="text-xs text-slate-500 dark:text-slate-400">Python</span>
          )}
          {onToggleExpand && (
            <button
              onClick={onToggleExpand}
              className="flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
            >
              {expanded ? (
                <Minimize2 className="w-3.5 h-3.5" />
              ) : (
                <Maximize2 className="w-3.5 h-3.5" />
              )}
              {expanded ? '축소' : '확장'}
            </button>
          )}
        </div>
      )}
      <div className="relative" ref={containerRef}>
        <SyntaxHighlighter
          language={language}
          style={dark ? oneDark : oneLight}
          showLineNumbers
          wrapLines
          lineProps={(lineNumber: number) => {
            const lineDots = showDots ? (dotsByLine.get(lineNumber) || []) : [];
            const hasDots = lineDots.length > 0;

            // Render dots as CSS radial-gradient backgrounds
            // Each dot = 2 layers: colored circle on top, ring underneath
            const ringColor = dark ? '#1e293b' : '#ffffff';
            const dotBgs = hasDots
              ? lineDots.flatMap((dot) => [
                  `radial-gradient(circle at ${12 + dot.authorIndex * 16}px ${DOT_PADDING / 2}px, ${dot.color} 5px, transparent 5px)`,
                  `radial-gradient(circle at ${12 + dot.authorIndex * 16}px ${DOT_PADDING / 2}px, ${ringColor} 7px, transparent 7px)`,
                ])
              : [];

            return {
              'data-line-number': lineNumber,
              style: {
                display: 'block',
                cursor: onLineClick ? 'pointer' : undefined,
                paddingTop: hasDots ? DOT_PADDING : undefined,
                backgroundColor:
                  activeCommentLine === lineNumber
                    ? dark
                      ? 'rgba(99,102,241,0.15)'
                      : 'rgba(99,102,241,0.08)'
                    : undefined,
                backgroundImage: dotBgs.length > 0 ? dotBgs.join(', ') : undefined,
                backgroundRepeat: dotBgs.length > 0 ? 'no-repeat' : undefined,
              },
              className: onLineClick ? 'code-line-clickable' : '',
              onClick: onLineClick ? () => onLineClick(lineNumber) : undefined,
            };
          }}
          customStyle={{
            margin: 0,
            borderRadius: showHeader ? '0 0 0.5rem 0.5rem' : '0.5rem',
            fontSize: '0.875rem',
            minHeight: '400px',
          }}
        >
          {code}
        </SyntaxHighlighter>

        {/* Inline comment card */}
        {activeCommentLine != null &&
          renderInlineCard &&
          cardPosition && (
            <div
              className="absolute z-30"
              style={{
                top: cardPosition.top,
                left: 48,
                right: 16,
                maxWidth: 400,
              }}
            >
              {renderInlineCard(activeCommentLine)}
            </div>
          )}
      </div>
    </div>
  );
}

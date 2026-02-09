import { useRef, useEffect, useState, useCallback } from 'react';
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
  const [linePositions, setLinePositions] = useState<
    Map<number, { top: number; height: number }>
  >(new Map());

  const measureLines = useCallback(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const lineEls = container.querySelectorAll('span[data-line-number]');
    if (lineEls.length === 0) return;

    const positions = new Map<number, { top: number; height: number }>();
    const containerRect = container.getBoundingClientRect();

    lineEls.forEach((el) => {
      const lineNum = parseInt(el.getAttribute('data-line-number') || '0');
      if (lineNum > 0) {
        const rect = el.getBoundingClientRect();
        positions.set(lineNum, {
          top: rect.top - containerRect.top,
          height: rect.height,
        });
      }
    });

    setLinePositions(positions);
  }, []);

  useEffect(() => {
    const timer = setTimeout(measureLines, 100);
    return () => clearTimeout(timer);
  }, [code, measureLines]);

  useEffect(() => {
    window.addEventListener('resize', measureLines);
    return () => window.removeEventListener('resize', measureLines);
  }, [measureLines]);

  // Build a Set of lines that have dots for quick lookup
  const dotLines = new Set(commentDots?.map((d) => d.line) || []);

  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-700 relative" ref={containerRef} data-code-container>
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
      <div className="relative">
        <SyntaxHighlighter
          language={language}
          style={dark ? oneDark : oneLight}
          showLineNumbers
          wrapLines
          lineProps={(lineNumber: number) => ({
            'data-line-number': lineNumber,
            style: {
              display: 'block',
              cursor: onLineClick ? 'pointer' : undefined,
              backgroundColor:
                activeCommentLine === lineNumber
                  ? dark
                    ? 'rgba(99,102,241,0.15)'
                    : 'rgba(99,102,241,0.08)'
                  : undefined,
              borderLeft:
                showDots && dotLines.has(lineNumber)
                  ? `3px solid ${commentDots?.find((d) => d.line === lineNumber)?.color || '#6366f1'}`
                  : '3px solid transparent',
            },
            className: onLineClick ? 'code-line-clickable' : '',
            onClick: onLineClick ? () => onLineClick(lineNumber) : undefined,
          })}
          customStyle={{
            margin: 0,
            borderRadius: showHeader ? '0 0 0.5rem 0.5rem' : '0.5rem',
            fontSize: '0.875rem',
            minHeight: '400px',
          }}
        >
          {code}
        </SyntaxHighlighter>

        {/* Dot overlay */}
        {showDots &&
          commentDots &&
          commentDots.length > 0 &&
          commentDots.map((dot) => {
            const pos = linePositions.get(dot.line);
            if (!pos) return null;
            return (
              <div
                key={`dot-${dot.line}`}
                className="absolute z-10 cursor-pointer transition-transform hover:scale-150"
                style={{
                  top: pos.top + pos.height / 2 - 5,
                  left: 6,
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  backgroundColor: dot.color,
                  boxShadow: `0 0 0 2px ${dark ? '#1e293b' : '#ffffff'}`,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onLineClick?.(dot.line);
                }}
              />
            );
          })}
      </div>

      {/* Inline comment card */}
      {activeCommentLine != null &&
        renderInlineCard &&
        linePositions.has(activeCommentLine) && (
          <div
            className="absolute z-30"
            style={{
              top:
                (linePositions.get(activeCommentLine)?.top || 0) +
                (linePositions.get(activeCommentLine)?.height || 0) +
                4 +
                (showHeader ? 40 : 0),
              left: 48,
              right: 16,
              maxWidth: 400,
            }}
          >
            {renderInlineCard(activeCommentLine)}
          </div>
        )}
    </div>
  );
}

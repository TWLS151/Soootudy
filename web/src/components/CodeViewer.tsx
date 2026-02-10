import { useRef, useEffect, useState, useMemo } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight, oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Maximize2, Minimize2, Copy, ClipboardCheck, MessageSquareCode } from 'lucide-react';
import type { CommentDot } from '../hooks/useCodeComments';

interface CodeViewerProps {
  code: string;
  language?: string;
  dark?: boolean;
  showHeader?: boolean;
  title?: string;
  expanded?: boolean;
  onToggleExpand?: () => void;
  onCopyCode?: () => void;
  onCopyWithComments?: () => void;
  // Comment integration
  onLineClick?: (lineNumber: number, columnNumber: number, clickedOnDot: boolean) => void;
  commentDots?: CommentDot[];
  showDots?: boolean;
  activeCommentLine?: number | null;
  activeCommentColumn?: number;
  renderInlineCard?: (lineNumber: number) => React.ReactNode;
  renderHoverPreview?: (lineNumber: number, hoveredColumn?: number) => React.ReactNode | null;
  previewDot?: { line: number; column: number } | null;
  // Keyboard navigation
  keyboardMode?: 'none' | 'comment-nav' | 'member-nav';
  onHeaderClick?: () => void;
  commentCount?: number;
  currentCommentIndex?: number;
}

const DOT_PADDING = 20;
const DOT_HIT_RADIUS = 15;

export default function CodeViewer({
  code,
  language = 'python',
  dark = false,
  showHeader = true,
  title,
  expanded,
  onToggleExpand,
  onCopyCode,
  onCopyWithComments,
  onLineClick,
  commentDots,
  showDots,
  activeCommentLine,
  activeCommentColumn,
  renderInlineCard,
  renderHoverPreview,
  previewDot,
  keyboardMode = 'member-nav',
  onHeaderClick,
  commentCount = 0,
  currentCommentIndex,
}: CodeViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [cardPosition, setCardPosition] = useState<{ top: number; left: number; arrowLeft: number } | null>(null);
  const [charWidth, setCharWidth] = useState(8.4);
  const [lineNumWidth, setLineNumWidth] = useState(48);
  const [codeCopied, setCodeCopied] = useState(false);
  const [commentsCopied, setCommentsCopied] = useState(false);
  const [hoveredLine, setHoveredLine] = useState<number | null>(null);
  const [hoveredColumn, setHoveredColumn] = useState<number | undefined>(undefined);
  const [hoverPosition, setHoverPosition] = useState<{ top: number; left: number; arrowLeft: number } | null>(null);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [overflowPositions, setOverflowPositions] = useState<Array<{
    dot: CommentDot;
    top: number;
    right: number;
  }>>([]);

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

  // Measure character width and line number width after render
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const id = requestAnimationFrame(() => {
      // Measure monospace char width from <code> element
      const codeEl = container.querySelector('code');
      if (codeEl) {
        const span = document.createElement('span');
        const cs = getComputedStyle(codeEl);
        span.style.fontFamily = cs.fontFamily;
        span.style.fontSize = cs.fontSize;
        span.style.visibility = 'hidden';
        span.style.position = 'absolute';
        span.style.whiteSpace = 'pre';
        span.textContent = 'X';
        document.body.appendChild(span);
        const w = span.getBoundingClientRect().width;
        document.body.removeChild(span);
        if (w > 0) setCharWidth(w);
      }

      // Measure line number element width
      const lineNumEl = container.querySelector(
        '.react-syntax-highlighter-line-number'
      );
      if (lineNumEl) {
        const w = (lineNumEl as HTMLElement).getBoundingClientRect().width;
        if (w > 0) setLineNumWidth(w);
      }
    });

    return () => cancelAnimationFrame(id);
  }, [code]);

  // Auto-show preview when previewDot changes (keyboard navigation)
  useEffect(() => {
    if (!previewDot || !renderHoverPreview || !containerRef.current) {
      return;
    }

    const container = containerRef.current;
    const lineEl = container.querySelector(`[data-line-number="${previewDot.line}"]`);
    if (!lineEl) return;

    const containerRect = container.getBoundingClientRect();
    const lineRect = lineEl.getBoundingClientRect();
    const hoverTop = lineRect.bottom - containerRect.top + 8;
    const dotVisualX = lineNumWidth + previewDot.column * charWidth;
    const maxW = 340;
    const cardLeft = Math.max(16, Math.min(dotVisualX - 20, containerRect.width - maxW - 16));
    const arrowLeft = Math.max(10, Math.min(dotVisualX - cardLeft, maxW - 10));

    setHoveredLine(previewDot.line);
    // 키보드 네비게이션 시(activeCommentLine과 다를 때)는 hoveredColumn을 undefined로 설정하여 모든 댓글 표시
    setHoveredColumn(activeCommentLine === previewDot.line ? previewDot.column : undefined);
    setHoverPosition({ top: hoverTop, left: cardLeft, arrowLeft });
  }, [previewDot, renderHoverPreview, lineNumWidth, charWidth, activeCommentLine]);

  // Measure container width for overflow dot detection
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver((entries) => {
      setContainerWidth(entries[0].contentRect.width);
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Overflow dots: dots positioned beyond visible container width
  const overflowDotsByLine = useMemo(() => {
    const map = new Map<number, CommentDot[]>();
    if (!commentDots || !showDots || containerWidth <= 0) return map;
    for (const dot of commentDots) {
      const dotX = lineNumWidth + dot.column * charWidth + dot.offsetIndex * 12;
      if (dotX > containerWidth - 16) {
        if (!map.has(dot.line)) map.set(dot.line, []);
        map.get(dot.line)!.push(dot);
      }
    }
    return map;
  }, [commentDots, showDots, containerWidth, lineNumWidth, charWidth]);

  // Measure overflow dot overlay positions
  useEffect(() => {
    if (overflowDotsByLine.size === 0 || !containerRef.current) {
      setOverflowPositions([]);
      return;
    }
    const id = requestAnimationFrame(() => {
      const container = containerRef.current;
      if (!container) return;
      const containerRect = container.getBoundingClientRect();
      const positions: Array<{ dot: CommentDot; top: number; right: number }> = [];

      for (const [line, dots] of overflowDotsByLine) {
        const lineEl = container.querySelector(`[data-line-number="${line}"]`);
        if (!lineEl) continue;
        const lineRect = lineEl.getBoundingClientRect();
        dots.forEach((dot, idx) => {
          positions.push({
            dot,
            top: lineRect.top - containerRect.top + DOT_PADDING / 2 - 5,
            right: 20 + idx * 14,
          });
        });
      }

      setOverflowPositions(positions);
    });

    return () => cancelAnimationFrame(id);
  }, [overflowDotsByLine, commentDots, containerWidth]);

  // Find nearest dot for arrow color (click card)
  const activeArrowDot = useMemo(() => {
    if (activeCommentLine == null || previewDot) return null;
    const lineDots = dotsByLine.get(activeCommentLine) || [];
    let nearest: CommentDot | null = null;
    let minDist = Infinity;
    for (const dot of lineDots) {
      const dist = Math.abs(dot.column - (activeCommentColumn ?? 0));
      if (dist < minDist) { minDist = dist; nearest = dot; }
    }
    return nearest;
  }, [activeCommentLine, activeCommentColumn, dotsByLine, previewDot]);

  // Find nearest dot for arrow color (hover preview)
  const hoverArrowDot = useMemo(() => {
    if (hoveredLine == null) return null;
    const lineDots = dotsByLine.get(hoveredLine) || [];
    let nearest: CommentDot | null = null;
    let minDist = Infinity;
    for (const dot of lineDots) {
      const dist = Math.abs(dot.column - (hoveredColumn ?? 0));
      if (dist < minDist) { minDist = dist; nearest = dot; }
    }
    return nearest;
  }, [hoveredLine, hoveredColumn, dotsByLine]);

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
      const top = lineRect.bottom - containerRect.top + 8;

      // Position card: if previewDot exists (new comment on empty area), use clicked column;
      // otherwise snap to nearest existing dot
      const lineDots = dotsByLine.get(activeCommentLine) || [];
      let dotX = lineNumWidth + (activeCommentColumn ?? 0) * charWidth;
      if (!previewDot && lineDots.length > 0) {
        let minDist = Infinity;
        for (const dot of lineDots) {
          const dist = Math.abs(dot.column - (activeCommentColumn ?? 0));
          if (dist < minDist) {
            minDist = dist;
            dotX = lineNumWidth + dot.column * charWidth + dot.offsetIndex * 12;
          }
        }
      }

      const containerWidth = containerRect.width;

      // Clamp dotX for overflow dots (positioned beyond visible width)
      if (containerWidth > 0 && dotX > containerWidth - 16) {
        dotX = containerWidth - 24;
      }

      const maxCardWidth = 380;
      const cardLeft = Math.max(16, Math.min(dotX - 20, containerWidth - maxCardWidth - 16));
      const arrowLeft = Math.max(10, Math.min(dotX - cardLeft, maxCardWidth - 10));

      setCardPosition({ top, left: cardLeft, arrowLeft });
    }, 20);
    return () => clearTimeout(timer);
  }, [activeCommentLine, activeCommentColumn, commentDots, dotsByLine, lineNumWidth, charWidth, previewDot]);

  return (
    <div
      className={`rounded-lg border transition-all ${
        keyboardMode === 'comment-nav'
          ? 'border-indigo-500 dark:border-indigo-400 ring-2 ring-indigo-200 dark:ring-indigo-800'
          : 'border-slate-200 dark:border-slate-700'
      }`}
      data-code-container
    >
      {showHeader && (
        <div
          onClick={(e) => {
            // 버튼이 아닌 영역 클릭 시에만 댓글 네비게이션 모드 활성화
            if (onHeaderClick && commentCount > 0 && !title) {
              const target = e.target as HTMLElement;
              // 버튼이나 버튼 내부 요소가 아닐 때만 실행
              if (!target.closest('button')) {
                onHeaderClick();
              }
            }
          }}
          className={`flex items-center justify-between px-3 py-2 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 rounded-t-lg transition-colors ${
            !title && onHeaderClick && commentCount > 0 ? 'cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700' : ''
          }`}
        >
          {title ? (
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {title}
            </span>
          ) : (
            <div className={`flex items-center gap-2 text-xs transition-colors ${
              keyboardMode === 'comment-nav'
                ? 'text-indigo-600 dark:text-indigo-400 font-medium'
                : 'text-slate-500 dark:text-slate-400'
            }`}>
              <span>Python</span>
              {keyboardMode === 'comment-nav' && commentCount > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400">
                  ↑↓ {currentCommentIndex !== undefined ? `${currentCommentIndex + 1}/${commentCount}` : `${commentCount}개`}
                </span>
              )}
            </div>
          )}
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            {onCopyCode && (
              <button
                onClick={() => {
                  onCopyCode();
                  setCodeCopied(true);
                  setTimeout(() => setCodeCopied(false), 2000);
                }}
                className="flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                title="코드 복사"
              >
                {codeCopied ? (
                  <ClipboardCheck className="w-3.5 h-3.5 text-green-500" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                {codeCopied ? '복사됨' : '복사'}
              </button>
            )}
            {onCopyWithComments && (
              <button
                onClick={() => {
                  onCopyWithComments();
                  setCommentsCopied(true);
                  setTimeout(() => setCommentsCopied(false), 2000);
                }}
                className="flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                title="코드 + 댓글 복사"
              >
                {commentsCopied ? (
                  <ClipboardCheck className="w-3.5 h-3.5 text-green-500" />
                ) : (
                  <MessageSquareCode className="w-3.5 h-3.5" />
                )}
                {commentsCopied ? '복사됨' : '코드+댓글'}
              </button>
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
            // Preview dot은 새 댓글 작성 시에만 표시 (activeCommentLine과 일치할 때)
            const hasPreviewDot = previewDot && previewDot.line === lineNumber && activeCommentLine === lineNumber;
            const hasDots = lineDots.length > 0 || hasPreviewDot;

            // Render dots as CSS radial-gradient at character column positions
            const ringColor = dark ? '#1e293b' : '#ffffff';
            const dotBgs = lineDots.length > 0
              ? lineDots.flatMap((dot) => {
                  const dotX = lineNumWidth + dot.column * charWidth + dot.offsetIndex * 12;
                  return [
                    `radial-gradient(circle at ${dotX}px ${DOT_PADDING / 2}px, ${dot.color} 5px, transparent 5px)`,
                    `radial-gradient(circle at ${dotX}px ${DOT_PADDING / 2}px, ${ringColor} 7px, transparent 7px)`,
                  ];
                })
              : [];

            // Add preview dot (pulsing, semi-transparent)
            if (hasPreviewDot && previewDot) {
              const pvX = lineNumWidth + previewDot.column * charWidth;
              dotBgs.push(
                `radial-gradient(circle at ${pvX}px ${DOT_PADDING / 2}px, rgba(99,102,241,0.5) 5px, transparent 5px)`,
                `radial-gradient(circle at ${pvX}px ${DOT_PADDING / 2}px, ${ringColor} 7px, transparent 7px)`,
              );
            }

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
              onClick: onLineClick
                ? (e: React.MouseEvent) => {
                    const lineEl = e.currentTarget as HTMLElement;
                    const lineRect = lineEl.getBoundingClientRect();
                    const codeStartX = lineRect.left + lineNumWidth;
                    const xOffset = e.clientX - codeStartX;
                    const column = Math.max(0, Math.round(xOffset / charWidth));

                    // Detect if click was near an existing dot
                    const mouseX = e.clientX - lineRect.left;
                    const mouseY = e.clientY - lineRect.top;
                    let clickedOnDot = false;
                    for (const dot of lineDots) {
                      const dotX = lineNumWidth + dot.column * charWidth + dot.offsetIndex * 12;
                      const dotY = DOT_PADDING / 2;
                      const dx = mouseX - dotX;
                      const dy = mouseY - dotY;
                      if (Math.sqrt(dx * dx + dy * dy) < DOT_HIT_RADIUS) {
                        clickedOnDot = true;
                        break;
                      }
                    }

                    onLineClick(lineNumber, column, clickedOnDot);
                  }
                : undefined,
              onMouseMove: hasDots && renderHoverPreview
                ? (e: React.MouseEvent) => {
                    const lineEl = e.currentTarget as HTMLElement;
                    const lineRect = lineEl.getBoundingClientRect();
                    const mouseX = e.clientX - lineRect.left;
                    const mouseY = e.clientY - lineRect.top;

                    // Check if mouse is near any dot
                    let foundDotX: number | null = null;
                    let foundDotColumn: number | undefined = undefined;
                    for (const dot of lineDots) {
                      const dotX = lineNumWidth + dot.column * charWidth + dot.offsetIndex * 12;
                      const dotY = DOT_PADDING / 2;
                      const dx = mouseX - dotX;
                      const dy = mouseY - dotY;
                      if (Math.sqrt(dx * dx + dy * dy) < DOT_HIT_RADIUS) {
                        foundDotX = dotX;
                        foundDotColumn = dot.column;
                        break;
                      }
                    }

                    if (foundDotX !== null) {
                      // Mouse is near a dot — show preview immediately
                      if (hoverTimerRef.current) {
                        clearTimeout(hoverTimerRef.current);
                        hoverTimerRef.current = null;
                      }
                      if (!containerRef.current) return;
                      const cRect = containerRef.current.getBoundingClientRect();
                      const lRect = lineEl.getBoundingClientRect();
                      const top = lRect.bottom - cRect.top + 8;
                      const containerWidth = cRect.width;
                      const maxW = 340;
                      const cardLeft = Math.max(16, Math.min(foundDotX - 20, containerWidth - maxW - 16));
                      const arrowLeft = Math.max(10, Math.min(foundDotX - cardLeft, maxW - 10));
                      setHoveredLine(lineNumber);
                      setHoveredColumn(foundDotColumn);
                      setHoverPosition({ top, left: cardLeft, arrowLeft });
                    } else {
                      // Mouse is not near any dot — clear hover
                      if (hoverTimerRef.current) {
                        clearTimeout(hoverTimerRef.current);
                        hoverTimerRef.current = null;
                      }
                      setHoveredLine(null);
                      setHoveredColumn(undefined);
                      setHoverPosition(null);
                    }
                  }
                : undefined,
              onMouseLeave: hasDots && renderHoverPreview
                ? () => {
                    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
                    hoverTimerRef.current = null;
                    setHoveredLine(null);
                    setHoverPosition(null);
                  }
                : undefined,
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

        {/* Inline comment card — speech bubble near the dot */}
        {activeCommentLine != null &&
          renderInlineCard &&
          cardPosition && (
            <div
              className="absolute z-30"
              style={{
                top: cardPosition.top,
                left: cardPosition.left,
                maxWidth: 380,
              }}
            >
              {/* Speech bubble arrow pointing up to the dot */}
              <div
                className="absolute w-[10px] h-[10px] rotate-45"
                style={{
                  top: -4,
                  left: cardPosition.arrowLeft - 5,
                  backgroundColor: activeArrowDot
                    ? (dark ? activeArrowDot.bgDark : activeArrowDot.bgLight)
                    : (dark ? 'rgb(30,41,59)' : 'white'),
                  borderLeft: `1px solid ${activeArrowDot ? (dark ? activeArrowDot.borderDark : activeArrowDot.borderLight) : (dark ? '#334155' : '#e2e8f0')}`,
                  borderTop: `1px solid ${activeArrowDot ? (dark ? activeArrowDot.borderDark : activeArrowDot.borderLight) : (dark ? '#334155' : '#e2e8f0')}`,
                  zIndex: 1,
                }}
              />
              <div className="relative" style={{ zIndex: 2 }}>
                {renderInlineCard(activeCommentLine)}
              </div>
            </div>
          )}

        {/* Hover preview — speech bubble near the dot */}
        {hoveredLine != null &&
          activeCommentLine !== hoveredLine &&
          renderHoverPreview &&
          hoverPosition && (
            <div
              className="absolute z-20 pointer-events-none"
              style={{
                top: hoverPosition.top,
                left: hoverPosition.left,
                maxWidth: 340,
              }}
            >
              {/* Speech bubble arrow pointing up to the dot */}
              <div
                className="absolute w-[10px] h-[10px] rotate-45"
                style={{
                  top: -4,
                  left: hoverPosition.arrowLeft - 5,
                  backgroundColor: hoverArrowDot
                    ? (dark ? hoverArrowDot.bgDark : hoverArrowDot.bgLight)
                    : (dark ? 'rgb(30,41,59)' : 'white'),
                  borderLeft: `1px solid ${hoverArrowDot ? (dark ? hoverArrowDot.borderDark : hoverArrowDot.borderLight) : (dark ? '#334155' : '#e2e8f0')}`,
                  borderTop: `1px solid ${hoverArrowDot ? (dark ? hoverArrowDot.borderDark : hoverArrowDot.borderLight) : (dark ? '#334155' : '#e2e8f0')}`,
                  zIndex: 1,
                }}
              />
              <div className="relative" style={{ zIndex: 2 }}>
                {renderHoverPreview(hoveredLine, hoveredColumn)}
              </div>
            </div>
          )}

        {/* Overflow dot indicators — dots beyond visible width */}
        {overflowPositions.map(({ dot, top, right }) => (
          <div
            key={`overflow-${dot.line}-${dot.column}-${dot.offsetIndex}`}
            className="absolute z-10 cursor-pointer"
            style={{
              top,
              right,
              width: 10,
              height: 10,
              borderRadius: '50%',
              backgroundColor: dot.color,
              boxShadow: `0 0 0 2px ${dark ? '#1e293b' : '#ffffff'}`,
            }}
            onClick={(e) => {
              e.stopPropagation();
              onLineClick?.(dot.line, dot.column, true);
            }}
            onMouseEnter={() => {
              if (!renderHoverPreview || !containerRef.current) return;
              if (hoverTimerRef.current) {
                clearTimeout(hoverTimerRef.current);
                hoverTimerRef.current = null;
              }
              const container = containerRef.current;
              const cRect = container.getBoundingClientRect();
              const lineEl = container.querySelector(`[data-line-number="${dot.line}"]`);
              if (!lineEl) return;
              const lRect = lineEl.getBoundingClientRect();
              const hoverTop = lRect.bottom - cRect.top + 8;
              const dotVisualX = cRect.width - right;
              const maxW = 340;
              const cardLeft = Math.max(16, Math.min(dotVisualX - 20, cRect.width - maxW - 16));
              const arrowLeft = Math.max(10, Math.min(dotVisualX - cardLeft, maxW - 10));
              setHoveredLine(dot.line);
              setHoveredColumn(dot.column);
              setHoverPosition({ top: hoverTop, left: cardLeft, arrowLeft });
            }}
            onMouseLeave={() => {
              if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
              hoverTimerRef.current = null;
              setHoveredLine(null);
              setHoveredColumn(undefined);
              setHoverPosition(null);
            }}
          />
        ))}
      </div>
    </div>
  );
}

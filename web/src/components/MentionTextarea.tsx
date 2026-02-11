import { useState, useRef, useEffect, useCallback, type KeyboardEvent, type ChangeEvent } from 'react';
import { createPortal } from 'react-dom';
import { getRealMembers } from '../lib/reference';
import type { Members } from '../types';

interface MentionTextareaProps {
  value: string;
  onChange: (value: string) => void;
  members: Members;
  placeholder?: string;
  rows?: number;
  autoFocus?: boolean;
  className?: string;
  onKeyDown?: (e: KeyboardEvent<HTMLTextAreaElement>) => void;
  textareaRef?: React.RefObject<HTMLTextAreaElement | null>;
}

export default function MentionTextarea({
  value,
  onChange,
  members,
  placeholder,
  rows = 1,
  autoFocus,
  className,
  onKeyDown,
  textareaRef,
}: MentionTextareaProps) {
  const internalRef = useRef<HTMLTextAreaElement>(null);
  const taRef = textareaRef || internalRef;
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mentionStart, setMentionStart] = useState(-1);
  const [dropdownPos, setDropdownPos] = useState({ bottom: 0, left: 0, width: 0 });

  const realMembers = Object.entries(getRealMembers(members));

  const filtered = mentionQuery !== null
    ? realMembers.filter(([, m]) =>
        m.name.toLowerCase().includes(mentionQuery.toLowerCase())
      )
    : [];

  // Position dropdown above textarea
  useEffect(() => {
    if (mentionQuery !== null && filtered.length > 0 && taRef.current) {
      const rect = taRef.current.getBoundingClientRect();
      setDropdownPos({
        bottom: window.innerHeight - rect.top + 4,
        left: rect.left,
        width: Math.min(Math.max(rect.width, 192), 256),
      });
    }
  }, [mentionQuery, filtered.length, taRef]);

  // Scroll selected item into view
  useEffect(() => {
    if (dropdownRef.current && selectedIndex >= 0) {
      const items = dropdownRef.current.querySelectorAll('button');
      items[selectedIndex]?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    onChange(newValue);

    // Auto-resize
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';

    // Detect @mention
    const cursorPos = el.selectionStart;
    const before = newValue.slice(0, cursorPos);
    const match = before.match(/@([^\s@]*)$/);

    if (match) {
      setMentionQuery(match[1]);
      setMentionStart(cursorPos - match[1].length - 1);
      setSelectedIndex(0);
    } else {
      setMentionQuery(null);
      setMentionStart(-1);
    }
  };

  const insertMention = useCallback((name: string) => {
    if (mentionStart < 0) return;
    const before = value.slice(0, mentionStart);
    const cursor = taRef.current?.selectionStart ?? value.length;
    const after = value.slice(cursor);
    const newValue = `${before}@${name} ${after}`;
    onChange(newValue);
    setMentionQuery(null);
    setMentionStart(-1);

    requestAnimationFrame(() => {
      const pos = before.length + name.length + 2; // @name + space
      taRef.current?.setSelectionRange(pos, pos);
      taRef.current?.focus();
    });
  }, [mentionStart, value, onChange, taRef]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (mentionQuery !== null && filtered.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(i => Math.min(i + 1, filtered.length - 1));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(i => Math.max(i - 1, 0));
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        insertMention(filtered[selectedIndex][1].name);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setMentionQuery(null);
        setMentionStart(-1);
        return;
      }
    }
    onKeyDown?.(e);
  };

  const showDropdown = mentionQuery !== null && filtered.length > 0;

  return (
    <>
      <textarea
        ref={taRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={() => setTimeout(() => setMentionQuery(null), 200)}
        placeholder={placeholder}
        rows={rows}
        autoFocus={autoFocus}
        className={className}
      />
      {showDropdown && createPortal(
        <div
          ref={dropdownRef}
          className="fixed max-h-32 overflow-y-auto rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg z-[9999] py-1"
          style={{
            bottom: dropdownPos.bottom,
            left: dropdownPos.left,
            width: dropdownPos.width,
          }}
        >
          {filtered.map(([id, member], index) => (
            <button
              key={id}
              onMouseDown={(e) => {
                e.preventDefault();
                insertMention(member.name);
              }}
              className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left transition-colors ${
                index === selectedIndex
                  ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              <img
                src={`https://github.com/${member.github}.png?size=20`}
                alt=""
                className="w-4 h-4 rounded-full"
              />
              <span className="font-medium">{member.name}</span>
            </button>
          ))}
        </div>,
        document.body
      )}
    </>
  );
}

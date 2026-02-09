import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight, oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface MarkdownViewerProps {
  content: string;
  dark?: boolean;
}

export default function MarkdownViewer({ content, dark = false }: MarkdownViewerProps) {
  return (
    <div className={`prose max-w-none ${dark ? 'prose-invert' : 'prose-slate'}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const codeString = String(children).replace(/\n$/, '');
            if (match) {
              return (
                <SyntaxHighlighter
                  language={match[1]}
                  style={dark ? oneDark : oneLight}
                  showLineNumbers
                  customStyle={{ borderRadius: '0.5rem', fontSize: '0.875rem' }}
                >
                  {codeString}
                </SyntaxHighlighter>
              );
            }
            return (
              <code className={`${className ?? ''} bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-sm`} {...props}>
                {children}
              </code>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight, oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface CodeViewerProps {
  code: string;
  language?: string;
  dark?: boolean;
}

export default function CodeViewer({ code, language = 'python', dark = false }: CodeViewerProps) {
  return (
    <div className="rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 min-h-[500px]">
      <SyntaxHighlighter
        language={language}
        style={dark ? oneDark : oneLight}
        showLineNumbers
        customStyle={{
          margin: 0,
          borderRadius: 0,
          fontSize: '0.875rem',
        }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}

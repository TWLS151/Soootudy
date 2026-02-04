import { useState } from 'react';
import { Lock } from 'lucide-react';

interface LoginGateProps {
  error: string;
  loading: boolean;
  onSubmit: (password: string) => void;
  dark: boolean;
}

export default function LoginGate({ error, loading, onSubmit, dark }: LoginGateProps) {
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.trim()) onSubmit(password);
  };

  return (
    <div className={`min-h-screen flex items-center justify-center ${dark ? 'dark bg-slate-950' : 'bg-slate-50'}`}>
      <form onSubmit={handleSubmit} className="w-full max-w-sm px-6">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-indigo-100 dark:bg-indigo-950 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Lock className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Sootudy</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">팀원 전용 페이지입니다</p>
        </div>

        <div className="space-y-3">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="비밀번호를 입력하세요"
            autoFocus
            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />

          {error && (
            <p className="text-sm text-red-500 text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !password.trim()}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium rounded-xl transition-colors"
          >
            {loading ? '확인 중...' : '입장'}
          </button>
        </div>
      </form>
    </div>
  );
}

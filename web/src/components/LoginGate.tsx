import { Github } from 'lucide-react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

interface LoginGateProps {
  error: string;
  loading: boolean;
  onLoginWithGitHub: () => void;
  dark: boolean;
}

export default function LoginGate({ error, loading, onLoginWithGitHub, dark }: LoginGateProps) {
  return (
    <div className={`min-h-screen flex items-center justify-center ${dark ? 'dark bg-slate-950' : 'bg-slate-50'}`}>
      <div className="w-full max-w-sm px-6">
        <div className="text-center mb-8">
          <div className="w-32 h-32 mx-auto mb-2">
            <DotLottieReact src="/bear.lottie" loop autoplay />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Soootudy</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">팀원 전용 코드 리뷰 플랫폼</p>
        </div>

        <div className="space-y-3">
          {error && (
            <p className="text-sm text-red-500 text-center bg-red-50 dark:bg-red-950/30 rounded-lg p-3">
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={onLoginWithGitHub}
            disabled={loading}
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-600 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <Github className="w-5 h-5" />
            {loading ? '로그인 중...' : 'GitHub으로 로그인'}
          </button>

          <p className="text-xs text-slate-400 dark:text-slate-500 text-center mt-4">
            팀원만 접근 가능합니다
          </p>
        </div>
      </div>
    </div>
  );
}

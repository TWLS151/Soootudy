import { Link } from 'react-router-dom';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { Home } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="w-32 h-32">
        <DotLottieReact src="/cat.lottie" loop autoplay />
      </div>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-4">
        404
      </h1>
      <p className="text-slate-500 dark:text-slate-400 mt-1">
        페이지를 찾을 수 없습니다.
      </p>
      <Link
        to="/"
        className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
      >
        <Home className="w-4 h-4" />
        홈으로 돌아가기
      </Link>
    </div>
  );
}

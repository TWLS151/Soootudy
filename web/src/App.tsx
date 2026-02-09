import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { useTheme } from './hooks/useTheme';
import { useGitHub } from './hooks/useGitHub';
import { useAuth } from './hooks/useAuth';
import Layout from './components/Layout';
import LoginGate from './components/LoginGate';
import HomePage from './pages/HomePage';
import MemberPage from './pages/MemberPage';
import MemberCommentsPage from './pages/MemberCommentsPage';
import ProblemPage from './pages/ProblemPage';
import WeeklyPage from './pages/WeeklyPage';
import LabPage from './pages/LabPage';
import SubmitPage from './pages/SubmitPage';
import DailyHistoryPage from './pages/DailyHistoryPage';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  const { dark, toggle } = useTheme();
  const auth = useAuth();
  const { members, problems, weeks, activities, loading, error } = useGitHub();

  // 팀원 확인 로직
  useEffect(() => {
    if (auth.user && Object.keys(members).length > 0) {
      const githubUsername = auth.user.user_metadata?.user_name || auth.user.user_metadata?.preferred_username;

      // members 목록에서 해당 사용자 찾기
      const isMember = Object.values(members).some(
        (member) => member.github.toLowerCase() === githubUsername?.toLowerCase()
      );

      if (!isMember) {
        // 팀원이 아니면 로그아웃
        auth.logout();
        alert('팀원만 접근할 수 있습니다.');
      }
    }
  }, [auth.user, members, auth.logout]);

  if (!auth.authed) {
    return <LoginGate error={auth.error} loading={auth.loading} onLoginWithGitHub={auth.loginWithGitHub} dark={dark} />;
  }

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${dark ? 'dark bg-slate-950' : 'bg-slate-50'}`}>
        <div className="text-center">
          <div className="w-28 h-28 mx-auto mb-2">
            <DotLottieReact src="/cat.lottie" loop autoplay />
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm animate-pulse">데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${dark ? 'dark bg-slate-950' : 'bg-slate-50'}`}>
        <div className="text-center">
          <div className="w-28 h-28 mx-auto mb-2">
            <DotLottieReact src="/cat.lottie" loop autoplay />
          </div>
          <p className="text-red-500 mb-2">데이터를 불러올 수 없습니다.</p>
          <p className="text-slate-400 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          element={
            <Layout
              members={members}
              problems={problems}
              weeks={weeks}
              activities={activities}
              dark={dark}
              toggleTheme={toggle}
            />
          }
        >
          <Route index element={<HomePage />} />
          <Route path="member/:id" element={<MemberPage />} />
          <Route path="member/:id/comments" element={<MemberCommentsPage />} />
          <Route path="problem/:memberId/:week/:problemName" element={<ProblemPage />} />
          <Route path="weekly/:week" element={<WeeklyPage />} />
          <Route path="lab" element={<LabPage />} />
          <Route path="submit" element={<SubmitPage />} />
          <Route path="daily-history" element={<DailyHistoryPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

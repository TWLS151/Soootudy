import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useTheme } from './hooks/useTheme';
import { useGitHub } from './hooks/useGitHub';
import { useAuth } from './hooks/useAuth';
import Layout from './components/Layout';
import LoginGate from './components/LoginGate';
import HomePage from './pages/HomePage';
import MemberPage from './pages/MemberPage';
import ProblemPage from './pages/ProblemPage';
import WeeklyPage from './pages/WeeklyPage';

export default function App() {
  const { dark, toggle } = useTheme();
  const auth = useAuth();
  const { members, problems, weeks, activities, loading, error } = useGitHub();

  if (!auth.authed) {
    return <LoginGate error={auth.error} loading={auth.loading} onSubmit={auth.login} dark={dark} />;
  }

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${dark ? 'dark bg-slate-950' : 'bg-slate-50'}`}>
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-indigo-200 dark:border-indigo-800 border-t-indigo-600 dark:border-t-indigo-400 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500 dark:text-slate-400 text-sm">데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${dark ? 'dark bg-slate-950' : 'bg-slate-50'}`}>
        <div className="text-center">
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
          <Route path="problem/:memberId/:week/:problemName" element={<ProblemPage />} />
          <Route path="weekly/:week" element={<WeeklyPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

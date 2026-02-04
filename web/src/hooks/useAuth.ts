import { useState, useCallback } from 'react';

const AUTH_KEY = 'sootudy_auth';

export function useAuth() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem(AUTH_KEY) === '1');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const login = useCallback(async (password: string) => {
    setError('');
    setLoading(true);

    try {
      if (import.meta.env.DEV) {
        // 개발 환경: VITE_SITE_PASSWORD 또는 무조건 통과
        const devPw = import.meta.env.VITE_SITE_PASSWORD;
        if (!devPw || password === devPw) {
          sessionStorage.setItem(AUTH_KEY, '1');
          setAuthed(true);
          return;
        }
        setError('비밀번호가 틀렸습니다.');
        return;
      }

      // 프로덕션: serverless function 호출
      const res = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        sessionStorage.setItem(AUTH_KEY, '1');
        setAuthed(true);
      } else {
        setError('비밀번호가 틀렸습니다.');
      }
    } catch {
      setError('인증 서버에 연결할 수 없습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem(AUTH_KEY);
    setAuthed(false);
  }, []);

  return { authed, error, loading, login, logout };
}

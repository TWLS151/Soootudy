import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // 초기 세션 확인
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // 인증 상태 변경 감지
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);

      // user_profiles upsert (알림용 github_username → user_id 매핑)
      if (session?.user) {
        const u = session.user;
        const ghUsername = u.user_metadata?.user_name || u.user_metadata?.preferred_username;
        if (ghUsername) {
          supabase
            .from('user_profiles')
            .upsert({ user_id: u.id, github_username: ghUsername }, { onConflict: 'user_id' })
            .then(({ error: upsertError }) => {
              if (upsertError) console.error('Failed to upsert user_profiles:', upsertError);
            });
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loginWithGitHub = useCallback(async () => {
    setError('');
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: window.location.origin,
        },
      });

      if (error) {
        setError(error.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '로그인 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setError('');
    await supabase.auth.signOut();
  }, []);

  return {
    user,
    authed: !!user,
    loading,
    error,
    loginWithGitHub,
    logout,
  };
}

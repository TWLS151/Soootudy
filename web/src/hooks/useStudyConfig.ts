import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { StudyConfig } from '../types';

export function useStudyConfig() {
  const [config, setConfig] = useState<StudyConfig | null>(null);
  const [loading, setLoading] = useState(true);

  const loadConfig = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('study_config')
        .select('*')
        .limit(1)
        .single();

      if (error) throw error;
      setConfig(data);
    } catch (error) {
      console.error('Failed to load study config:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConfig();

    const subscription = supabase
      .channel('study_config_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'study_config',
        },
        () => loadConfig()
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [loadConfig]);

  const updateConfig = useCallback(
    async (updates: Partial<Pick<StudyConfig, 'required_comments' | 'required_submissions'>>) => {
      if (!config) return;
      const { error } = await supabase
        .from('study_config')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', config.id);

      if (error) throw error;
      await loadConfig();
    },
    [config, loadConfig]
  );

  return { config, loading, updateConfig };
}

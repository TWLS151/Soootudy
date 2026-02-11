import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { computeUnlockable } from '../lib/characters';
import type { Problem, Activities, MemberCharacter } from '../types';

export function useCharacters(memberId: string | null) {
  const [record, setRecord] = useState<MemberCharacter | null>(null);
  const [loading, setLoading] = useState(true);

  const selectedCharacter = record?.selected_character ?? 'cat';
  const unlockedCharacters = record?.unlocked_characters ?? ['cat'];

  // Supabase에서 캐릭터 레코드 조회 (없으면 생성)
  useEffect(() => {
    if (!memberId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        const { data, error } = await supabase
          .from('member_characters')
          .select('*')
          .eq('member_id', memberId)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          if (!cancelled) setRecord(data);
        } else {
          // 레코드 없으면 기본값으로 생성
          const { data: inserted, error: insertErr } = await supabase
            .from('member_characters')
            .insert({
              member_id: memberId,
              selected_character: 'cat',
              unlocked_characters: ['cat'],
            })
            .select()
            .single();

          if (insertErr) throw insertErr;
          if (!cancelled) setRecord(inserted);
        }
      } catch (err) {
        console.error('Failed to load character data:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [memberId]);

  // 캐릭터 선택 변경
  const selectCharacter = useCallback(
    async (characterId: string) => {
      if (!memberId || !record) return;
      if (!unlockedCharacters.includes(characterId)) return;

      const { error } = await supabase
        .from('member_characters')
        .update({
          selected_character: characterId,
          updated_at: new Date().toISOString(),
        })
        .eq('member_id', memberId);

      if (error) {
        console.error('Failed to select character:', error);
        return;
      }

      setRecord((prev) => prev ? { ...prev, selected_character: characterId } : prev);
    },
    [memberId, record, unlockedCharacters]
  );

  // 해금 체크: 새로 해금된 캐릭터 ID 배열 반환
  const checkAndUnlock = useCallback(
    async (problems: Problem[], activities: Activities): Promise<string[]> => {
      if (!memberId || !record) return [];

      try {
        // 역대 오늘의 문제 로드
        const { data: allDaily, error: dailyErr } = await supabase
          .from('daily_problem')
          .select('source, problem_number');

        if (dailyErr) throw dailyErr;

        const dailyNames = new Set(
          (allDaily || []).map((dp: { source: string; problem_number: string }) => `${dp.source}-${dp.problem_number}`)
        );

        // 멤버의 고유 일일 문제 제출 수 (baseName 기준 중복 제거)
        const memberDailySet = new Set(
          problems
            .filter((p) => p.member === memberId)
            .map((p) => p.baseName || p.name)
            .filter((name) => dailyNames.has(name))
        );
        const dailyCount = memberDailySet.size;

        // 연속 제출
        const streak = activities[memberId]?.streak ?? 0;

        // 해금 가능한 캐릭터 계산
        const shouldBeUnlocked = computeUnlockable(dailyCount, streak);

        // 새로 해금된 캐릭터 찾기
        const newUnlocks = shouldBeUnlocked.filter(
          (id) => !record.unlocked_characters.includes(id)
        );

        if (newUnlocks.length > 0) {
          const merged = [...new Set([...record.unlocked_characters, ...newUnlocks])];

          const { error: updateErr } = await supabase
            .from('member_characters')
            .update({
              unlocked_characters: merged,
              updated_at: new Date().toISOString(),
            })
            .eq('member_id', memberId);

          if (updateErr) throw updateErr;

          setRecord((prev) => prev ? { ...prev, unlocked_characters: merged } : prev);
        }

        return newUnlocks;
      } catch (err) {
        console.error('Failed to check unlocks:', err);
        return [];
      }
    },
    [memberId, record]
  );

  return {
    selectedCharacter,
    unlockedCharacters,
    loading,
    selectCharacter,
    checkAndUnlock,
  };
}

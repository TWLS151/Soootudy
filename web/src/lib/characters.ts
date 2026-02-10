export interface CharacterDef {
  id: string;
  name: string;
  lottie: string;
  condition: 'default' | 'daily_1' | 'daily_15' | 'streak_7';
  description: string;
}

export const CHARACTERS: CharacterDef[] = [
  { id: 'cat', name: '고양이', lottie: '/cat.lottie', condition: 'default', description: '기본 캐릭터' },
  { id: 'fox', name: '여우', lottie: '/fox.lottie', condition: 'daily_1', description: '오늘의 문제 1회 제출' },
  { id: 'pigeon', name: '비둘기', lottie: '/pigeon.lottie', condition: 'daily_15', description: '오늘의 문제 15회 제출' },
  { id: 'pochita', name: '포치타', lottie: '/pochita.lottie', condition: 'streak_7', description: '7일 연속 출석' },
];

export function getCharacter(id: string): CharacterDef {
  return CHARACTERS.find((c) => c.id === id) || CHARACTERS[0];
}

export function computeUnlockable(dailySubmissionCount: number, streak: number): string[] {
  const unlocked = ['cat'];
  if (dailySubmissionCount >= 1) unlocked.push('fox');
  if (dailySubmissionCount >= 15) unlocked.push('pigeon');
  if (streak >= 7) unlocked.push('pochita');
  return unlocked;
}

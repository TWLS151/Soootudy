/** KST (UTC+9) 기준 오늘 날짜를 YYYY-MM-DD 형식으로 반환 */
export function getKSTToday(): string {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().split('T')[0];
}

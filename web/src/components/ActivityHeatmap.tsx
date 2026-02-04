interface ActivityHeatmapProps {
  dates: string[]; // YYYY-MM-DD format
}

function toDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];
const WEEKS_TO_SHOW = 12;

export default function ActivityHeatmap({ dates }: ActivityHeatmapProps) {
  const dateSet = new Set(dates);

  // Build grid: 12 weeks, each week has 7 days (Sun-Sat)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Find the start of the grid (12 weeks ago, aligned to Sunday)
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - (WEEKS_TO_SHOW * 7 - 1) - startDate.getDay());

  const weeks: { date: Date; dateStr: string; count: number }[][] = [];
  let current = new Date(startDate);

  for (let w = 0; w < WEEKS_TO_SHOW + 1; w++) {
    const week: { date: Date; dateStr: string; count: number }[] = [];
    for (let d = 0; d < 7; d++) {
      const dateStr = toDateStr(current);
      const isFuture = current > today;
      week.push({
        date: new Date(current),
        dateStr,
        count: isFuture ? -1 : (dateSet.has(dateStr) ? 1 : 0),
      });
      current.setDate(current.getDate() + 1);
    }
    weeks.push(week);
  }

  // Trim incomplete last week if it extends beyond today
  const lastWeek = weeks[weeks.length - 1];
  if (lastWeek.every((d) => d.count === -1)) {
    weeks.pop();
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
      <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">활동 기록</h3>
      <div className="flex gap-0.5 overflow-x-auto">
        {/* Day labels */}
        <div className="flex flex-col gap-0.5 mr-1 shrink-0">
          {DAY_LABELS.map((label, i) => (
            <div
              key={i}
              className="w-6 h-3 text-[10px] text-slate-400 dark:text-slate-500 flex items-center justify-end pr-1"
            >
              {i % 2 === 1 ? label : ''}
            </div>
          ))}
        </div>
        {/* Weeks grid */}
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-0.5">
            {week.map((day, di) => (
              <div
                key={di}
                title={day.count >= 0 ? `${day.dateStr}${day.count > 0 ? ' - 활동' : ''}` : ''}
                className={`w-3 h-3 rounded-sm ${
                  day.count === -1
                    ? 'bg-transparent'
                    : day.count > 0
                      ? 'bg-indigo-500 dark:bg-indigo-400'
                      : 'bg-slate-100 dark:bg-slate-700'
                }`}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-1 mt-2 text-[10px] text-slate-400 dark:text-slate-500 justify-end">
        <span>없음</span>
        <div className="w-3 h-3 rounded-sm bg-slate-100 dark:bg-slate-700" />
        <div className="w-3 h-3 rounded-sm bg-indigo-500 dark:bg-indigo-400" />
        <span>활동</span>
      </div>
    </div>
  );
}

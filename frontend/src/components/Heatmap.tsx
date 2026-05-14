import type { TimelineStats, HourlyStats } from "../services/analytics";

interface HeatmapProps {
  data: TimelineStats[];
  title?: string;
}

export function Heatmap({ data, title = "Activity Heatmap" }: HeatmapProps) {
  if (data.length === 0) {
    return <div className="text-ink/60">No data available</div>;
  }

  // Group by week and day
  const weeks: Map<number, Map<number, TimelineStats | null>> = new Map();

  data.forEach((day) => {
    const date = new Date(day.date);
    const year = date.getFullYear();
    const weekNumber = Math.floor((date.getDate() + new Date(year, date.getMonth(), 1).getDay()) / 7);
    const dayOfWeek = date.getDay();

    if (!weeks.has(weekNumber)) {
      weeks.set(weekNumber, new Map());
    }

    weeks.get(weekNumber)!.set(dayOfWeek, day);
  });

  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const maxMessages = Math.max(...data.map((d) => d.messageCount), 1);

  const getIntensity = (count: number) => {
    const ratio = count / maxMessages;
    if (ratio === 0) return "bg-slate-100";
    if (ratio < 0.25) return "bg-accent/20";
    if (ratio < 0.5) return "bg-accent/40";
    if (ratio < 0.75) return "bg-accent/60";
    return "bg-accent";
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-lg font-semibold mb-6">{title}</h2>
      <div className="overflow-x-auto">
        <div className="inline-block">
          {/* Day labels */}
          <div className="flex gap-1 mb-2">
            <div className="w-12"></div>
            {Array.from(weeks.keys()).map((week) => (
              <div key={week} className="text-xs text-ink/60 font-semibold text-center w-12">
                W{week + 1}
              </div>
            ))}
          </div>

          {/* Heatmap grid */}
          {dayLabels.map((label, dayIdx) => (
            <div key={dayIdx} className="flex gap-1 items-center mb-1">
              <div className="text-xs text-ink/60 font-semibold w-12">{label}</div>
              {Array.from(weeks.entries()).map(([weekNum, dayMap]) => {
                const dayData = dayMap.get(dayIdx);
                return (
                  <div
                    key={`${weekNum}-${dayIdx}`}
                    className={`w-12 h-12 rounded border border-slate-200 flex items-center justify-center text-xs font-semibold ${getIntensity(
                      dayData?.messageCount || 0
                    )} hover:ring-2 hover:ring-accent cursor-pointer transition`}
                    title={dayData ? `${dayData.date}: ${dayData.messageCount} messages` : "No data"}
                  >
                    {dayData && dayData.messageCount > 0 ? dayData.messageCount : ""}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 flex gap-2 items-center text-xs text-ink/60">
        <span>Less</span>
        <div className="w-3 h-3 rounded bg-slate-100"></div>
        <div className="w-3 h-3 rounded bg-accent/20"></div>
        <div className="w-3 h-3 rounded bg-accent/40"></div>
        <div className="w-3 h-3 rounded bg-accent/60"></div>
        <div className="w-3 h-3 rounded bg-accent"></div>
        <span>More</span>
      </div>
    </div>
  );
}

// Hourly Heatmap
interface HourlyHeatmapProps {
  hourlyData: HourlyStats[];
  timeline: { date: string }[];
}

export function HourlyHeatmap({ hourlyData, timeline }: HourlyHeatmapProps) {
  const maxMessages = Math.max(...hourlyData.map((h) => h.messageCount), 1);

  const getIntensity = (count: number) => {
    const ratio = count / maxMessages;
    if (ratio === 0) return "bg-slate-100";
    if (ratio < 0.25) return "bg-orange-200";
    if (ratio < 0.5) return "bg-orange-400";
    if (ratio < 0.75) return "bg-orange-500";
    return "bg-orange-600";
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
      <h2 className="text-base sm:text-lg font-semibold mb-4">24-Hour Activity Pattern</h2>
      <div className="grid grid-cols-12 sm:grid-cols-[repeat(24,minmax(0,1fr))] gap-x-1.5 gap-y-4 sm:gap-x-2">
        {hourlyData.map((hour) => (
          <div key={hour.hour} className="flex min-w-0 flex-col items-center justify-end">
            <div
              className={`w-full max-w-8 rounded border border-slate-200 flex items-end justify-center text-[10px] sm:text-xs font-bold text-white hover:ring-2 hover:ring-accent cursor-pointer transition ${getIntensity(
                hour.messageCount
              )}`}
              style={{
                height: `${Math.max((hour.messageCount / maxMessages) * 80, 10)}px`,
              }}
              title={`${hour.hour}:00 - ${hour.messageCount} messages`}
            >
              {hour.messageCount > 0 && hour.messageCount > maxMessages * 0.5 ? hour.messageCount : ""}
            </div>
            <span className="mt-1 text-[10px] sm:text-xs text-ink/60 tabular-nums">{hour.hour}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

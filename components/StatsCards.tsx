"use client";

import type { WorkoutStats, TrendMetric } from "@/lib/types";

interface StatsCardsProps {
  stats: WorkoutStats;
  weeklyAvg: { perWeek: number; perMonth: number; perYear: number };
  selectedMetrics: TrendMetric[];
  onToggleMetric: (metric: TrendMetric) => void;
}

interface StatCardConfig {
  key: string;
  metric: TrendMetric | null;
  label: string;
  format: (
    v: number,
    weeklyAvg?: { perWeek: number; perMonth: number; perYear: number },
  ) => string;
  subtext?: (weeklyAvg: {
    perWeek: number;
    perMonth: number;
    perYear: number;
  }) => string;
  color: string;
}

const statCards: StatCardConfig[] = [
  {
    key: "totalWorkouts",
    metric: "workouts",
    label: "Total Workouts",
    format: (v: number) => v.toString(),
    subtext: (avg) => `${avg.perWeek}/week avg`,
    color: "var(--chart-orange)",
  },
  {
    key: "totalTreadmillMiles",
    metric: "treadmill",
    label: "Treadmill Miles",
    format: (v: number) => v.toFixed(1),
    color: "var(--chart-orange)",
  },
  {
    key: "totalRowerMeters",
    metric: "rower",
    label: "Rower Meters",
    format: (v: number) => v.toLocaleString(),
    color: "var(--chart-blue)",
  },
  {
    key: "avgSplatPoints",
    metric: "splats",
    label: "Avg Splats",
    format: (v: number) => v.toString(),
    color: "var(--chart-purple)",
  },
  {
    key: "avgCalories",
    metric: "calories",
    label: "Avg Calories",
    format: (v: number) => v.toString(),
    color: "var(--chart-red)",
  },
  {
    key: "currentStreak",
    metric: null,
    label: "Current Streak",
    format: (v: number) => `${v} days`,
    color: "var(--chart-green)",
  },
];

export default function StatsCards({
  stats,
  weeklyAvg,
  selectedMetrics,
  onToggleMetric,
}: StatsCardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {statCards.map(({ key, metric, label, format, subtext, color }) => {
        const isSelected = metric ? selectedMetrics.includes(metric) : false;
        const isClickable = metric !== null;

        return (
          <div
            key={key}
            onClick={() => metric && onToggleMetric(metric)}
            className={`rounded-lg p-4 transition-all duration-150 ${
              isClickable ? "cursor-pointer" : ""
            }`}
            style={{
              background: "var(--surface)",
              border: isSelected
                ? `2px solid ${color}`
                : "1px solid var(--border)",
              boxShadow: isSelected ? `0 0 0 3px ${color}15` : "none",
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <span
                className="text-xs font-medium uppercase tracking-wide"
                style={{ color: "var(--text-muted)" }}
              >
                {label}
              </span>
              {isSelected && (
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ background: color }}
                />
              )}
            </div>
            <div
              className="text-2xl font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              {format(stats[key as keyof WorkoutStats] as number, weeklyAvg)}
            </div>
            {subtext && (
              <div
                className="text-xs mt-1"
                style={{ color: "var(--text-muted)" }}
              >
                {subtext(weeklyAvg)}
              </div>
            )}
            {isClickable && (
              <div
                className="text-xs mt-2"
                style={{ color: isSelected ? color : "var(--text-muted)" }}
              >
                {isSelected ? "Showing in chart" : "Click to show"}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

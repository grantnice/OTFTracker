import { format, parseISO, differenceInDays, subDays } from "date-fns";
import type { Workout, WorkoutStats, ChartDataPoint } from "./types";

export function formatDate(dateString: string): string {
  return format(parseISO(dateString), "MMM d, yyyy");
}

export function formatShortDate(dateString: string): string {
  return format(parseISO(dateString), "MMM d");
}

export function calculateStats(workouts: Workout[]): WorkoutStats {
  if (workouts.length === 0) {
    return {
      totalWorkouts: 0,
      totalTreadmillMiles: 0,
      totalRowerMeters: 0,
      avgSplatPoints: 0,
      avgCalories: 0,
      maxTreadmillDistance: 0,
      maxRowerDistance: 0,
      maxSplatPoints: 0,
      currentStreak: 0,
    };
  }

  const totalTreadmill = workouts.reduce(
    (sum, w) => sum + (w.treadmill_distance || 0),
    0,
  );
  const totalRower = workouts.reduce(
    (sum, w) => sum + (w.rower_distance || 0),
    0,
  );
  const totalSplats = workouts.reduce(
    (sum, w) => sum + (w.splat_points || 0),
    0,
  );
  const totalCalories = workouts.reduce((sum, w) => sum + (w.calories || 0), 0);

  const maxTreadmill = Math.max(
    ...workouts.map((w) => w.treadmill_distance || 0),
  );
  const maxRower = Math.max(...workouts.map((w) => w.rower_distance || 0));
  const maxSplats = Math.max(...workouts.map((w) => w.splat_points || 0));

  // Calculate current streak
  const sortedDates = workouts
    .map((w) => parseISO(w.workout_date))
    .sort((a, b) => b.getTime() - a.getTime());

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < sortedDates.length; i++) {
    const workoutDate = sortedDates[i];
    workoutDate.setHours(0, 0, 0, 0);

    const expectedDate = subDays(today, streak);
    const daysDiff = differenceInDays(expectedDate, workoutDate);

    if (daysDiff <= 1) {
      streak++;
    } else {
      break;
    }
  }

  return {
    totalWorkouts: workouts.length,
    totalTreadmillMiles: Math.round(totalTreadmill * 10) / 10,
    totalRowerMeters: Math.round(totalRower),
    avgSplatPoints: Math.round(totalSplats / workouts.length),
    avgCalories: Math.round(totalCalories / workouts.length),
    maxTreadmillDistance: maxTreadmill,
    maxRowerDistance: maxRower,
    maxSplatPoints: maxSplats,
    currentStreak: streak,
  };
}

export function prepareChartData(workouts: Workout[]): ChartDataPoint[] {
  const sorted = workouts.sort(
    (a, b) =>
      new Date(a.workout_date).getTime() - new Date(b.workout_date).getTime(),
  );

  let cumulativeTreadmill = 0;
  let cumulativeRower = 0;
  let cumulativeSplats = 0;
  let cumulativeCalories = 0;
  let cumulativeWorkouts = 0;

  return sorted.map((w) => {
    cumulativeTreadmill += w.treadmill_distance || 0;
    cumulativeRower += (w.rower_distance || 0) / 100;
    cumulativeSplats += w.splat_points || 0;
    cumulativeCalories += w.calories || 0;
    cumulativeWorkouts += 1;

    return {
      date: formatShortDate(w.workout_date),
      fullDate: w.workout_date,
      treadmill: w.treadmill_distance || 0,
      rower: (w.rower_distance || 0) / 100, // Convert to hundreds for better scale
      splats: w.splat_points || 0,
      calories: w.calories || 0,
      workoutCount: 1,
      cumulativeTreadmill: Math.round(cumulativeTreadmill * 10) / 10,
      cumulativeRower: Math.round(cumulativeRower * 10) / 10,
      cumulativeSplats,
      cumulativeCalories,
      cumulativeWorkouts,
    };
  });
}

export function calculateWeeklyAverage(workouts: Workout[]): {
  perWeek: number;
  perMonth: number;
  perYear: number;
} {
  if (workouts.length === 0) {
    return { perWeek: 0, perMonth: 0, perYear: 0 };
  }

  const sorted = workouts.sort(
    (a, b) =>
      new Date(a.workout_date).getTime() - new Date(b.workout_date).getTime(),
  );

  const firstDate = parseISO(sorted[0].workout_date);
  const lastDate = parseISO(sorted[sorted.length - 1].workout_date);
  const totalDays = Math.max(differenceInDays(lastDate, firstDate), 1);

  const totalWeeks = totalDays / 7;
  const totalMonths = totalDays / 30.44; // Average days in a month
  const totalYears = totalDays / 365.25;

  return {
    perWeek: Math.round((workouts.length / totalWeeks) * 10) / 10,
    perMonth: Math.round((workouts.length / totalMonths) * 10) / 10,
    perYear: Math.round(workouts.length / Math.max(totalYears, 1)),
  };
}

export function getHeatmapData(workouts: Workout[]): Map<string, number> {
  const heatmap = new Map<string, number>();

  workouts.forEach((w) => {
    const dateKey = format(parseISO(w.workout_date), "yyyy-MM-dd");
    heatmap.set(dateKey, (heatmap.get(dateKey) || 0) + 1);
  });

  return heatmap;
}

export interface WeekdayData {
  day: string;
  shortDay: string;
  count: number;
  percentage: number;
}

export function getWeekdayFrequency(workouts: Workout[]): WeekdayData[] {
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const shortDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const counts = new Array(7).fill(0);

  workouts.forEach((w) => {
    const date = parseISO(w.workout_date);
    counts[date.getDay()]++;
  });

  const total = workouts.length || 1;

  return days.map((day, i) => ({
    day,
    shortDay: shortDays[i],
    count: counts[i],
    percentage: Math.round((counts[i] / total) * 100),
  }));
}

export interface AnnualStats {
  year: number;
  workouts: number;
  treadmill: number;
  rower: number;
  splats: number;
  calories: number;
}

export function getAnnualStats(workouts: Workout[]): AnnualStats[] {
  const yearMap = new Map<number, AnnualStats>();

  workouts.forEach((w) => {
    const year = parseISO(w.workout_date).getFullYear();

    if (!yearMap.has(year)) {
      yearMap.set(year, {
        year,
        workouts: 0,
        treadmill: 0,
        rower: 0,
        splats: 0,
        calories: 0,
      });
    }

    const stats = yearMap.get(year)!;
    stats.workouts++;
    stats.treadmill += w.treadmill_distance || 0;
    stats.rower += w.rower_distance || 0;
    stats.splats += w.splat_points || 0;
    stats.calories += w.calories || 0;
  });

  return Array.from(yearMap.values()).sort((a, b) => b.year - a.year);
}

export interface MonthlyWeeklyAvg {
  month: string; // "Jan 2024"
  fullMonth: string; // "2024-01"
  year: number;
  monthNum: number;
  workoutsPerWeek: number;
  totalWorkouts: number;
  weeksInMonth: number;
}

export function getMonthlyWeeklyAverage(
  workouts: Workout[],
): MonthlyWeeklyAvg[] {
  if (workouts.length === 0) return [];

  // Group workouts by month
  const monthMap = new Map<
    string,
    { workouts: number; year: number; monthNum: number }
  >();

  workouts.forEach((w) => {
    const date = parseISO(w.workout_date);
    const key = format(date, "yyyy-MM");
    const year = date.getFullYear();
    const monthNum = date.getMonth();

    if (!monthMap.has(key)) {
      monthMap.set(key, { workouts: 0, year, monthNum });
    }
    monthMap.get(key)!.workouts++;
  });

  // Convert to array and calculate weekly averages
  const result: MonthlyWeeklyAvg[] = [];

  monthMap.forEach((data, key) => {
    // Calculate weeks in this month (roughly 4.33 weeks per month)
    const [yearStr, monthStr] = key.split("-");
    const year = parseInt(yearStr);
    const month = parseInt(monthStr) - 1;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const weeksInMonth = daysInMonth / 7;

    const monthDate = new Date(year, month, 1);
    const monthLabel = format(monthDate, "MMM yyyy");

    result.push({
      month: monthLabel,
      fullMonth: key,
      year: data.year,
      monthNum: data.monthNum,
      workoutsPerWeek: Math.round((data.workouts / weeksInMonth) * 10) / 10,
      totalWorkouts: data.workouts,
      weeksInMonth: Math.round(weeksInMonth * 10) / 10,
    });
  });

  // Sort by date
  return result.sort((a, b) => a.fullMonth.localeCompare(b.fullMonth));
}

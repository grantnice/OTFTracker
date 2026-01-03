export interface Workout {
  id: string;
  workout_date: string;
  treadmill_distance: number | null;
  rower_distance: number | null;
  splat_points: number | null;
  calories: number | null;
  email_subject: string | null;
  created_at: string;
}

export interface WorkoutStats {
  totalWorkouts: number;
  totalTreadmillMiles: number;
  totalRowerMeters: number;
  avgSplatPoints: number;
  avgCalories: number;
  maxTreadmillDistance: number;
  maxRowerDistance: number;
  maxSplatPoints: number;
  currentStreak: number;
}

export interface ChartDataPoint {
  date: string;
  fullDate: string;
  treadmill: number;
  rower: number;
  splats: number;
  calories: number;
  workoutCount: number;
  // Accumulated totals
  cumulativeTreadmill: number;
  cumulativeRower: number;
  cumulativeSplats: number;
  cumulativeCalories: number;
  cumulativeWorkouts: number;
}

export type TrendMetric = 'workouts' | 'treadmill' | 'rower' | 'splats' | 'calories';

"use client";

import { useState, useEffect, useCallback } from "react";
import type { Workout, TrendMetric } from "@/lib/types";
import {
  calculateStats,
  prepareChartData,
  getWeekdayFrequency,
  getAnnualStats,
  calculateWeeklyAverage,
  getMonthlyWeeklyAverage,
} from "@/lib/utils";
import StatsCards from "./StatsCards";
import TrendChart from "./TrendChart";
import WorkoutTable from "./WorkoutTable";
import WeekdayFrequency from "./WeekdayFrequency";
import WeeklyAvgTrend from "./WeeklyAvgTrend";
import YearlyGoals from "./YearlyGoals";

interface DashboardProps {
  onLogout: () => void;
}

export default function Dashboard({ onLogout }: DashboardProps) {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMetrics, setSelectedMetrics] = useState<TrendMetric[]>([
    "treadmill",
  ]);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    fetchWorkouts();
  }, []);

  const fetchWorkouts = async () => {
    try {
      const res = await fetch("/api/workouts");
      if (!res.ok) throw new Error("Failed to fetch workouts");
      const data = await res.json();
      setWorkouts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth", { method: "DELETE" });
    onLogout();
  };

  const handleToggleMetric = useCallback((metric: TrendMetric) => {
    setSelectedMetrics((prev) => {
      if (prev.includes(metric)) {
        return prev.filter((m) => m !== metric);
      }
      return [...prev, metric];
    });
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    setSyncMessage(null);

    try {
      const res = await fetch("/api/sync", { method: "POST" });
      const data = await res.json();

      if (data.success) {
        setSyncMessage({ type: "success", text: data.message });
        // Refresh workouts data
        await fetchWorkouts();
      } else {
        setSyncMessage({
          type: "error",
          text: data.message || "Sync failed",
        });
      }
    } catch {
      setSyncMessage({ type: "error", text: "Failed to sync" });
    } finally {
      setSyncing(false);
      // Clear message after 5 seconds
      setTimeout(() => setSyncMessage(null), 5000);
    }
  };

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--background)" }}
      >
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p style={{ color: "var(--text-muted)" }}>Loading workouts...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--background)" }}
      >
        <div className="text-center">
          <p className="text-[var(--accent-red)] mb-4">{error}</p>
          <button
            onClick={fetchWorkouts}
            className="px-4 py-2 text-white rounded-lg transition-colors"
            style={{ background: "var(--primary)" }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const stats = calculateStats(workouts);
  const chartData = prepareChartData(workouts);
  const weekdayData = getWeekdayFrequency(workouts);
  const annualStats = getAnnualStats(workouts);
  const weeklyAvg = calculateWeeklyAverage(workouts);
  const monthlyWeeklyAvg = getMonthlyWeeklyAverage(workouts);

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      {/* Header */}
      <header
        className="sticky top-0 z-10"
        style={{
          background: "var(--surface)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: "var(--primary)" }}
              >
                <span className="text-white font-bold text-sm">OT</span>
              </div>
              <h1
                className="text-xl font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                OTF Tracker
              </h1>
            </div>
            <button
              onClick={handleLogout}
              className="text-sm transition-colors hover:opacity-70"
              style={{ color: "var(--text-muted)" }}
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {workouts.length === 0 ? (
          <div className="text-center py-16">
            <h2
              className="text-xl font-semibold mb-2"
              style={{ color: "var(--text-primary)" }}
            >
              No workouts yet
            </h2>
            <p className="mb-6" style={{ color: "var(--text-muted)" }}>
              Run the email sync script to import your OTF workout data
            </p>
            <code
              className="px-4 py-2 rounded-lg text-sm"
              style={{
                background: "var(--border)",
                color: "var(--text-secondary)",
              }}
            >
              python scripts/sync_emails.py
            </code>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Stats */}
            <StatsCards
              stats={stats}
              weeklyAvg={weeklyAvg}
              selectedMetrics={selectedMetrics}
              onToggleMetric={handleToggleMetric}
            />

            {/* Yearly Goals */}
            <YearlyGoals
              currentYearStats={annualStats.find(
                (s) => s.year === new Date().getFullYear(),
              )}
            />

            {/* Charts Row */}
            <div className="grid lg:grid-cols-2 gap-6">
              <TrendChart data={chartData} selectedMetrics={selectedMetrics} />
              <WeekdayFrequency data={weekdayData} />
            </div>

            {/* Weekly Average Trend */}
            <WeeklyAvgTrend data={monthlyWeeklyAvg} />

            {/* Table */}
            <WorkoutTable workouts={workouts} />

            {/* Annual Stats */}
            {annualStats.length > 0 && (
              <div
                className="rounded-lg p-6"
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                }}
              >
                <h2
                  className="text-base font-semibold mb-4"
                  style={{ color: "var(--text-primary)" }}
                >
                  Year-over-Year
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--border)" }}>
                        <th
                          className="text-left py-3 px-4 font-medium"
                          style={{ color: "var(--text-muted)" }}
                        >
                          Year
                        </th>
                        <th
                          className="text-right py-3 px-4 font-medium"
                          style={{ color: "var(--text-muted)" }}
                        >
                          Workouts
                        </th>
                        <th
                          className="text-right py-3 px-4 font-medium"
                          style={{ color: "var(--text-muted)" }}
                        >
                          Miles
                        </th>
                        <th
                          className="text-right py-3 px-4 font-medium"
                          style={{ color: "var(--text-muted)" }}
                        >
                          Meters
                        </th>
                        <th
                          className="text-right py-3 px-4 font-medium"
                          style={{ color: "var(--text-muted)" }}
                        >
                          Splats
                        </th>
                        <th
                          className="text-right py-3 px-4 font-medium"
                          style={{ color: "var(--text-muted)" }}
                        >
                          Calories
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {annualStats.map((year, index) => (
                        <tr
                          key={year.year}
                          style={{
                            borderBottom:
                              index < annualStats.length - 1
                                ? "1px solid var(--border)"
                                : "none",
                          }}
                        >
                          <td
                            className="py-3 px-4 font-semibold"
                            style={{ color: "var(--text-primary)" }}
                          >
                            {year.year}
                          </td>
                          <td
                            className="py-3 px-4 text-right"
                            style={{ color: "var(--text-secondary)" }}
                          >
                            {year.workouts}
                          </td>
                          <td
                            className="py-3 px-4 text-right"
                            style={{ color: "var(--chart-orange)" }}
                          >
                            {year.treadmill.toFixed(1)}
                          </td>
                          <td
                            className="py-3 px-4 text-right"
                            style={{ color: "var(--chart-blue)" }}
                          >
                            {year.rower.toLocaleString()}
                          </td>
                          <td
                            className="py-3 px-4 text-right"
                            style={{ color: "var(--text-secondary)" }}
                          >
                            {year.splats.toLocaleString()}
                          </td>
                          <td
                            className="py-3 px-4 text-right"
                            style={{ color: "var(--text-secondary)" }}
                          >
                            {year.calories.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer
        className="py-6 mt-8"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center gap-4">
            <p
              className="text-center text-sm"
              style={{ color: "var(--text-muted)" }}
            >
              {workouts.length} workouts tracked &middot; {weeklyAvg.perWeek}{" "}
              workouts/week avg &middot; Last workout:{" "}
              {workouts[0]?.workout_date || "Never"}
            </p>

            <div className="flex flex-col items-center gap-2">
              <button
                onClick={handleSync}
                disabled={syncing}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50 flex items-center gap-2"
                style={{
                  background: syncing ? "var(--border)" : "var(--primary)",
                  color: syncing ? "var(--text-secondary)" : "#FFFFFF",
                }}
              >
                {syncing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Syncing emails...
                  </>
                ) : (
                  "Sync from Email"
                )}
              </button>

              {syncMessage && (
                <p
                  className="text-sm"
                  style={{
                    color:
                      syncMessage.type === "success"
                        ? "var(--accent-green)"
                        : "var(--accent-red)",
                  }}
                >
                  {syncMessage.text}
                </p>
              )}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

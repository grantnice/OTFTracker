"use client";

import { useState, useEffect } from "react";
import type { AnnualStats } from "@/lib/utils";

interface YearlyGoalsProps {
  currentYearStats: AnnualStats | undefined;
}

interface Goals {
  workouts: number;
  treadmill: number;
  rower: number;
  calories: number;
}

const DEFAULT_GOALS: Goals = {
  workouts: 150,
  treadmill: 300,
  rower: 100000,
  calories: 100000,
};

export default function YearlyGoals({ currentYearStats }: YearlyGoalsProps) {
  const [goals, setGoals] = useState<Goals>(DEFAULT_GOALS);
  const [isEditing, setIsEditing] = useState(false);
  const [editGoals, setEditGoals] = useState<Goals>(DEFAULT_GOALS);

  const currentYear = new Date().getFullYear();

  useEffect(() => {
    const saved = localStorage.getItem(`otf-goals-${currentYear}`);
    if (saved) {
      try {
        setGoals(JSON.parse(saved));
        setEditGoals(JSON.parse(saved));
      } catch {
        // Use defaults
      }
    }
  }, [currentYear]);

  const saveGoals = () => {
    localStorage.setItem(`otf-goals-${currentYear}`, JSON.stringify(editGoals));
    setGoals(editGoals);
    setIsEditing(false);
  };

  const cancelEdit = () => {
    setEditGoals(goals);
    setIsEditing(false);
  };

  const getProgress = (current: number, goal: number) => {
    if (goal === 0) return 0;
    return Math.min((current / goal) * 100, 100);
  };

  const getYearProgress = () => {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const endOfYear = new Date(now.getFullYear(), 11, 31);
    const totalDays =
      (endOfYear.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24);
    const daysPassed =
      (now.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24);
    return (daysPassed / totalDays) * 100;
  };

  const yearProgress = getYearProgress();

  const stats = currentYearStats || {
    year: currentYear,
    workouts: 0,
    treadmill: 0,
    rower: 0,
    splats: 0,
    calories: 0,
  };

  const goalItems = [
    {
      key: "workouts",
      label: "Workouts",
      current: stats.workouts,
      goal: goals.workouts,
      unit: "",
      color: "#E55A1B",
    },
    {
      key: "treadmill",
      label: "Treadmill",
      current: stats.treadmill,
      goal: goals.treadmill,
      unit: "mi",
      color: "#E55A1B",
      format: (v: number) => v.toFixed(1),
    },
    {
      key: "rower",
      label: "Rower",
      current: stats.rower,
      goal: goals.rower,
      unit: "m",
      color: "#3D6B99",
      format: (v: number) => v.toLocaleString(),
    },
    {
      key: "calories",
      label: "Calories",
      current: stats.calories,
      goal: goals.calories,
      unit: "",
      color: "#C53D3D",
      format: (v: number) => v.toLocaleString(),
    },
  ];

  return (
    <div
      className="rounded-lg p-5"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
      }}
    >
      <div className="flex items-center justify-between mb-5">
        <h2
          className="text-base font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          {currentYear} Goals
        </h2>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="text-sm font-medium transition-opacity hover:opacity-70"
            style={{ color: "var(--primary)" }}
          >
            Edit Goals
          </button>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={cancelEdit}
              className="text-sm transition-opacity hover:opacity-70"
              style={{ color: "var(--text-muted)" }}
            >
              Cancel
            </button>
            <button
              onClick={saveGoals}
              className="text-sm font-medium transition-opacity hover:opacity-70"
              style={{ color: "var(--primary)" }}
            >
              Save
            </button>
          </div>
        )}
      </div>

      {/* Year progress indicator */}
      <div
        className="mb-5 p-3 rounded-md"
        style={{ background: "var(--background)" }}
      >
        <div className="flex items-center justify-between text-sm mb-2">
          <span style={{ color: "var(--text-muted)" }}>Year Progress</span>
          <span
            className="font-medium"
            style={{ color: "var(--text-primary)" }}
          >
            {yearProgress.toFixed(0)}% of {currentYear}
          </span>
        </div>
        <div
          className="h-1.5 rounded-full overflow-hidden"
          style={{ background: "var(--border)" }}
        >
          <div
            className="h-full transition-all duration-300 rounded-full"
            style={{
              width: `${yearProgress}%`,
              background: "var(--text-muted)",
            }}
          />
        </div>
      </div>

      {/* Goals grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {goalItems.map((item) => {
          const progress = getProgress(item.current, item.goal);
          const isAhead = progress >= yearProgress;
          const format = item.format || ((v: number) => v.toString());

          return (
            <div
              key={item.key}
              className="p-4 rounded-md"
              style={{ background: "var(--background)" }}
            >
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ background: item.color }}
                />
                <span
                  className="font-medium text-sm"
                  style={{ color: "var(--text-primary)" }}
                >
                  {item.label}
                </span>
              </div>

              {isEditing ? (
                <div className="mb-3">
                  <label
                    className="text-xs mb-1 block"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Goal {item.unit && `(${item.unit})`}
                  </label>
                  <input
                    type="number"
                    value={editGoals[item.key as keyof Goals]}
                    onChange={(e) =>
                      setEditGoals({
                        ...editGoals,
                        [item.key]: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-2"
                    style={{
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                      color: "var(--text-primary)",
                    }}
                  />
                </div>
              ) : (
                <>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span
                      className="text-xl font-semibold"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {format(item.current)}
                    </span>
                    <span style={{ color: "var(--text-muted)" }}>
                      / {format(item.goal)} {item.unit}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div
                    className="h-2 rounded-full overflow-hidden mb-2"
                    style={{ background: "var(--border)" }}
                  >
                    <div
                      className="h-full transition-all duration-500 rounded-full"
                      style={{
                        width: `${progress}%`,
                        backgroundColor: item.color,
                      }}
                    />
                  </div>

                  {/* Status text */}
                  <div className="flex items-center justify-between text-xs">
                    <span
                      style={{
                        color: isAhead
                          ? "var(--accent-green)"
                          : "var(--primary)",
                      }}
                    >
                      {progress.toFixed(0)}% complete
                    </span>
                    <span style={{ color: "var(--text-muted)" }}>
                      {isAhead ? "On track" : "Behind pace"}
                    </span>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Projected totals */}
      {!isEditing && stats.workouts > 0 && (
        <div
          className="mt-5 pt-4"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            <span
              className="font-medium"
              style={{ color: "var(--text-secondary)" }}
            >
              Projected year-end:
            </span>{" "}
            {Math.round(stats.workouts / (yearProgress / 100))} workouts,{" "}
            {(stats.treadmill / (yearProgress / 100)).toFixed(0)} miles,{" "}
            {Math.round(stats.rower / (yearProgress / 100)).toLocaleString()}m
            rowed
          </p>
        </div>
      )}
    </div>
  );
}

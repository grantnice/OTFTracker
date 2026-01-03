"use client";

import { useState, useMemo } from "react";
import { formatDate } from "@/lib/utils";
import type { Workout } from "@/lib/types";

interface WorkoutTableProps {
  workouts: Workout[];
}

type SortKey =
  | "workout_date"
  | "treadmill_distance"
  | "rower_distance"
  | "splat_points"
  | "calories";

interface Filters {
  dateFrom: string;
  dateTo: string;
  treadmillMin: string;
  treadmillMax: string;
  rowerMin: string;
  rowerMax: string;
  splatsMin: string;
  splatsMax: string;
  caloriesMin: string;
  caloriesMax: string;
}

const initialFilters: Filters = {
  dateFrom: "",
  dateTo: "",
  treadmillMin: "",
  treadmillMax: "",
  rowerMin: "",
  rowerMax: "",
  splatsMin: "",
  splatsMax: "",
  caloriesMin: "",
  caloriesMax: "",
};

export default function WorkoutTable({ workouts }: WorkoutTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("workout_date");
  const [sortAsc, setSortAsc] = useState(false);
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [showFilters, setShowFilters] = useState(false);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  };

  const updateFilter = (key: keyof Filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters(initialFilters);
  };

  const hasActiveFilters = useMemo(() => {
    return Object.values(filters).some((v) => v !== "");
  }, [filters]);

  const filteredWorkouts = useMemo(() => {
    return workouts.filter((workout) => {
      if (filters.dateFrom) {
        const fromDate = new Date(filters.dateFrom);
        const workoutDate = new Date(workout.workout_date);
        if (workoutDate < fromDate) return false;
      }
      if (filters.dateTo) {
        const toDate = new Date(filters.dateTo);
        toDate.setHours(23, 59, 59, 999);
        const workoutDate = new Date(workout.workout_date);
        if (workoutDate > toDate) return false;
      }
      if (filters.treadmillMin) {
        const min = parseFloat(filters.treadmillMin);
        if (
          !isNaN(min) &&
          (workout.treadmill_distance === null ||
            workout.treadmill_distance < min)
        ) {
          return false;
        }
      }
      if (filters.treadmillMax) {
        const max = parseFloat(filters.treadmillMax);
        if (
          !isNaN(max) &&
          (workout.treadmill_distance === null ||
            workout.treadmill_distance > max)
        ) {
          return false;
        }
      }
      if (filters.rowerMin) {
        const min = parseFloat(filters.rowerMin);
        if (
          !isNaN(min) &&
          (workout.rower_distance === null || workout.rower_distance < min)
        ) {
          return false;
        }
      }
      if (filters.rowerMax) {
        const max = parseFloat(filters.rowerMax);
        if (
          !isNaN(max) &&
          (workout.rower_distance === null || workout.rower_distance > max)
        ) {
          return false;
        }
      }
      if (filters.splatsMin) {
        const min = parseFloat(filters.splatsMin);
        if (
          !isNaN(min) &&
          (workout.splat_points === null || workout.splat_points < min)
        ) {
          return false;
        }
      }
      if (filters.splatsMax) {
        const max = parseFloat(filters.splatsMax);
        if (
          !isNaN(max) &&
          (workout.splat_points === null || workout.splat_points > max)
        ) {
          return false;
        }
      }
      if (filters.caloriesMin) {
        const min = parseFloat(filters.caloriesMin);
        if (
          !isNaN(min) &&
          (workout.calories === null || workout.calories < min)
        ) {
          return false;
        }
      }
      if (filters.caloriesMax) {
        const max = parseFloat(filters.caloriesMax);
        if (
          !isNaN(max) &&
          (workout.calories === null || workout.calories > max)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [workouts, filters]);

  const sortedWorkouts = useMemo(() => {
    return [...filteredWorkouts].sort((a, b) => {
      const aVal = a[sortKey] ?? 0;
      const bVal = b[sortKey] ?? 0;

      if (sortKey === "workout_date") {
        return sortAsc
          ? new Date(aVal as string).getTime() -
              new Date(bVal as string).getTime()
          : new Date(bVal as string).getTime() -
              new Date(aVal as string).getTime();
      }

      return sortAsc
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number);
    });
  }, [filteredWorkouts, sortKey, sortAsc]);

  const SortHeader = ({
    label,
    sortKeyValue,
  }: {
    label: string;
    sortKeyValue: SortKey;
  }) => (
    <th
      onClick={() => handleSort(sortKeyValue)}
      className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer transition-colors"
      style={{
        color:
          sortKey === sortKeyValue
            ? "var(--text-primary)"
            : "var(--text-muted)",
      }}
    >
      {label}
      {sortKey === sortKeyValue && (
        <span className="ml-1">{sortAsc ? "↑" : "↓"}</span>
      )}
    </th>
  );

  const FilterInput = ({
    label,
    value,
    onChange,
    type = "number",
    placeholder,
    min,
    step,
  }: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    type?: "number" | "date";
    placeholder?: string;
    min?: string;
    step?: string;
  }) => (
    <div className="flex flex-col gap-1">
      <label className="text-xs" style={{ color: "var(--text-muted)" }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        min={min}
        step={step}
        className="w-full px-2 py-1.5 text-sm rounded-md focus:outline-none focus:ring-2"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          color: "var(--text-primary)",
        }}
      />
    </div>
  );

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
      }}
    >
      {/* Header */}
      <div
        className="px-5 py-4"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div className="flex items-center justify-between">
          <h2
            className="text-base font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            Workout History
          </h2>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors"
            style={{
              background:
                showFilters || hasActiveFilters
                  ? "var(--primary)"
                  : "var(--background)",
              color:
                showFilters || hasActiveFilters
                  ? "white"
                  : "var(--text-secondary)",
              border:
                showFilters || hasActiveFilters
                  ? "none"
                  : "1px solid var(--border)",
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
            Filters
            {hasActiveFilters && (
              <span
                className="ml-1 px-1.5 py-0.5 text-xs rounded"
                style={{ background: "rgba(255,255,255,0.2)" }}
              >
                Active
              </span>
            )}
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div
            className="mt-4 pt-4"
            style={{ borderTop: "1px solid var(--border)" }}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {/* Date Range Filter */}
              <div className="space-y-2">
                <div
                  className="text-sm font-medium"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Date Range
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <FilterInput
                    label="From"
                    value={filters.dateFrom}
                    onChange={(v) => updateFilter("dateFrom", v)}
                    type="date"
                  />
                  <FilterInput
                    label="To"
                    value={filters.dateTo}
                    onChange={(v) => updateFilter("dateTo", v)}
                    type="date"
                  />
                </div>
              </div>

              {/* Treadmill Filter */}
              <div className="space-y-2">
                <div
                  className="text-sm font-medium"
                  style={{ color: "var(--chart-orange)" }}
                >
                  Treadmill (mi)
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <FilterInput
                    label="Min"
                    value={filters.treadmillMin}
                    onChange={(v) => updateFilter("treadmillMin", v)}
                    placeholder="0"
                    min="0"
                    step="0.1"
                  />
                  <FilterInput
                    label="Max"
                    value={filters.treadmillMax}
                    onChange={(v) => updateFilter("treadmillMax", v)}
                    placeholder="10"
                    min="0"
                    step="0.1"
                  />
                </div>
              </div>

              {/* Rower Filter */}
              <div className="space-y-2">
                <div
                  className="text-sm font-medium"
                  style={{ color: "var(--chart-blue)" }}
                >
                  Rower (m)
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <FilterInput
                    label="Min"
                    value={filters.rowerMin}
                    onChange={(v) => updateFilter("rowerMin", v)}
                    placeholder="0"
                    min="0"
                    step="100"
                  />
                  <FilterInput
                    label="Max"
                    value={filters.rowerMax}
                    onChange={(v) => updateFilter("rowerMax", v)}
                    placeholder="5000"
                    min="0"
                    step="100"
                  />
                </div>
              </div>

              {/* Splat Points Filter */}
              <div className="space-y-2">
                <div
                  className="text-sm font-medium"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Splat Points
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <FilterInput
                    label="Min"
                    value={filters.splatsMin}
                    onChange={(v) => updateFilter("splatsMin", v)}
                    placeholder="0"
                    min="0"
                    step="1"
                  />
                  <FilterInput
                    label="Max"
                    value={filters.splatsMax}
                    onChange={(v) => updateFilter("splatsMax", v)}
                    placeholder="50"
                    min="0"
                    step="1"
                  />
                </div>
              </div>

              {/* Calories Filter */}
              <div className="space-y-2">
                <div
                  className="text-sm font-medium"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Calories
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <FilterInput
                    label="Min"
                    value={filters.caloriesMin}
                    onChange={(v) => updateFilter("caloriesMin", v)}
                    placeholder="0"
                    min="0"
                    step="10"
                  />
                  <FilterInput
                    label="Max"
                    value={filters.caloriesMax}
                    onChange={(v) => updateFilter("caloriesMax", v)}
                    placeholder="1000"
                    min="0"
                    step="10"
                  />
                </div>
              </div>
            </div>

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <div className="mt-4 flex justify-end">
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors"
                  style={{
                    background: "var(--background)",
                    border: "1px solid var(--border)",
                    color: "var(--text-secondary)",
                  }}
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Results Count */}
      {hasActiveFilters && (
        <div
          className="px-5 py-2 text-sm"
          style={{
            background: "var(--primary-muted)",
            color: "var(--primary)",
          }}
        >
          Showing <strong>{filteredWorkouts.length}</strong> of{" "}
          <strong>{workouts.length}</strong> workouts
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead style={{ background: "var(--background)" }}>
            <tr>
              <SortHeader label="Date" sortKeyValue="workout_date" />
              <SortHeader
                label="Treadmill (mi)"
                sortKeyValue="treadmill_distance"
              />
              <SortHeader label="Rower (m)" sortKeyValue="rower_distance" />
              <SortHeader label="Splats" sortKeyValue="splat_points" />
              <SortHeader label="Calories" sortKeyValue="calories" />
            </tr>
          </thead>
          <tbody>
            {sortedWorkouts.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center"
                  style={{ color: "var(--text-muted)" }}
                >
                  <div className="flex flex-col items-center gap-2">
                    <span>No workouts match your filters</span>
                    {hasActiveFilters && (
                      <button
                        onClick={clearFilters}
                        className="underline text-sm"
                        style={{ color: "var(--primary)" }}
                      >
                        Clear filters
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              sortedWorkouts.slice(0, 20).map((workout, index) => (
                <tr
                  key={workout.id}
                  className="transition-colors"
                  style={{
                    borderTop: index > 0 ? "1px solid var(--border)" : "none",
                  }}
                >
                  <td
                    className="px-4 py-3 text-sm"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {formatDate(workout.workout_date)}
                  </td>
                  <td
                    className="px-4 py-3 text-sm font-medium"
                    style={{ color: "var(--chart-orange)" }}
                  >
                    {workout.treadmill_distance?.toFixed(2) ?? "-"}
                  </td>
                  <td
                    className="px-4 py-3 text-sm font-medium"
                    style={{ color: "var(--chart-blue)" }}
                  >
                    {workout.rower_distance?.toLocaleString() ?? "-"}
                  </td>
                  <td
                    className="px-4 py-3 text-sm"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {workout.splat_points ?? "-"}
                  </td>
                  <td
                    className="px-4 py-3 text-sm"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {workout.calories ?? "-"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      {sortedWorkouts.length > 20 && (
        <div
          className="px-5 py-3 text-sm"
          style={{
            background: "var(--background)",
            color: "var(--text-muted)",
          }}
        >
          Showing 20 of {sortedWorkouts.length}{" "}
          {hasActiveFilters ? "filtered" : ""} workouts
        </div>
      )}
    </div>
  );
}

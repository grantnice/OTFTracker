"use client";

import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import type { MonthlyWeeklyAvg } from "@/lib/utils";

interface WeeklyAvgTrendProps {
  data: MonthlyWeeklyAvg[];
}

export default function WeeklyAvgTrend({ data }: WeeklyAvgTrendProps) {
  const overallAvg = useMemo(() => {
    if (data.length === 0) return 0;
    const total = data.reduce((sum, d) => sum + d.workoutsPerWeek, 0);
    return Math.round((total / data.length) * 10) / 10;
  }, [data]);

  const spansMultipleYears = useMemo(() => {
    if (data.length === 0) return false;
    const years = new Set(data.map((d) => d.year));
    return years.size > 1;
  }, [data]);

  const CustomXAxisTick = ({
    x,
    y,
    payload,
    index,
  }: {
    x: number;
    y: number;
    payload: { value: string };
    index: number;
  }) => {
    const dataPoint = data[index];
    if (!dataPoint) return null;

    const showYear =
      spansMultipleYears &&
      (index === 0 || (index > 0 && data[index - 1].year !== dataPoint.year));

    const monthOnly = dataPoint.month.split(" ")[0];

    return (
      <g transform={`translate(${x},${y})`}>
        <text
          x={0}
          y={0}
          dy={16}
          textAnchor="middle"
          fill="#8A8A8A"
          fontSize={11}
        >
          {monthOnly}
        </text>
        {showYear && (
          <text
            x={0}
            y={0}
            dy={30}
            textAnchor="middle"
            fill="#5C5C5C"
            fontSize={10}
            fontWeight={500}
          >
            {dataPoint.year}
          </text>
        )}
      </g>
    );
  };

  if (data.length === 0) {
    return (
      <div
        className="rounded-lg p-5"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
        }}
      >
        <h2
          className="text-base font-semibold mb-4"
          style={{ color: "var(--text-primary)" }}
        >
          Weekly Workout Average
        </h2>
        <div
          className="h-[200px] flex items-center justify-center"
          style={{ color: "var(--text-muted)" }}
        >
          No data available
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-lg p-5"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <h2
          className="text-base font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          Weekly Workout Average
        </h2>
        <div className="text-sm" style={{ color: "var(--text-muted)" }}>
          Avg:{" "}
          <span className="font-semibold" style={{ color: "var(--primary)" }}>
            {overallAvg}
          </span>{" "}
          workouts/week
        </div>
      </div>

      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{
              top: 10,
              right: 10,
              left: 0,
              bottom: spansMultipleYears ? 30 : 10,
            }}
          >
            <defs>
              <linearGradient
                id="weeklyAvgGradient"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="5%" stopColor="#E55A1B" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#E55A1B" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#E8E6E3"
              opacity={0.8}
              vertical={false}
            />
            <XAxis
              dataKey="month"
              stroke="#8A8A8A"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tick={spansMultipleYears ? CustomXAxisTick : undefined}
              interval="preserveStartEnd"
            />
            <YAxis
              stroke="#8A8A8A"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              domain={[0, "auto"]}
              tickFormatter={(value) => value.toFixed(1)}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#FFFFFF",
                border: "1px solid #E8E6E3",
                borderRadius: "6px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                color: "#1A1A1A",
              }}
              labelStyle={{ color: "#1A1A1A", fontWeight: 500 }}
              formatter={(value) => [`${value} workouts/week`, "Average"]}
            />
            <ReferenceLine
              y={overallAvg}
              stroke="#E55A1B"
              strokeDasharray="5 5"
              strokeOpacity={0.5}
            />
            <Area
              type="monotone"
              dataKey="workoutsPerWeek"
              stroke="#E55A1B"
              strokeWidth={2}
              fill="url(#weeklyAvgGradient)"
              dot={{ fill: "#E55A1B", strokeWidth: 0, r: 3 }}
              activeDot={{ r: 5, fill: "#E55A1B" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div
        className="mt-4 pt-4 grid grid-cols-3 gap-4 text-center"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <div>
          <div className="text-xs" style={{ color: "var(--text-muted)" }}>
            Best Month
          </div>
          <div
            className="text-sm font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            {
              data.reduce(
                (best, d) =>
                  d.workoutsPerWeek > best.workoutsPerWeek ? d : best,
                data[0],
              ).month
            }
          </div>
          <div className="text-xs" style={{ color: "var(--primary)" }}>
            {Math.max(...data.map((d) => d.workoutsPerWeek))}/week
          </div>
        </div>
        <div>
          <div className="text-xs" style={{ color: "var(--text-muted)" }}>
            Current
          </div>
          <div
            className="text-sm font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            {data[data.length - 1]?.month || "-"}
          </div>
          <div className="text-xs" style={{ color: "var(--primary)" }}>
            {data[data.length - 1]?.workoutsPerWeek || 0}/week
          </div>
        </div>
        <div>
          <div className="text-xs" style={{ color: "var(--text-muted)" }}>
            Trend
          </div>
          <div
            className="text-sm font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            {data.length >= 2
              ? data[data.length - 1].workoutsPerWeek >=
                data[data.length - 2].workoutsPerWeek
                ? "Improving"
                : "Declining"
              : "-"}
          </div>
          <div className="text-xs" style={{ color: "var(--text-muted)" }}>
            {data.length >= 2
              ? `${data[data.length - 1].workoutsPerWeek >= data[data.length - 2].workoutsPerWeek ? "+" : ""}${(data[data.length - 1].workoutsPerWeek - data[data.length - 2].workoutsPerWeek).toFixed(1)} vs last month`
              : ""}
          </div>
        </div>
      </div>
    </div>
  );
}

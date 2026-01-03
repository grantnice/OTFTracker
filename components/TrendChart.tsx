"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import type { ChartDataPoint, TrendMetric } from "@/lib/types";

interface TrendChartProps {
  data: ChartDataPoint[];
  selectedMetrics: TrendMetric[];
}

type ViewMode = "individual" | "accumulated";
type ChartType = "line" | "bar" | "scatter";
type DateRange = "30d" | "90d" | "1y" | "all";

const metricConfig: Record<
  TrendMetric,
  {
    label: string;
    color: string;
    dataKey: string;
    accumulatedKey: string;
    unit: string;
  }
> = {
  workouts: {
    label: "Workouts",
    color: "#E55A1B",
    dataKey: "workoutCount",
    accumulatedKey: "cumulativeWorkouts",
    unit: "",
  },
  treadmill: {
    label: "Treadmill",
    color: "#E55A1B",
    dataKey: "treadmill",
    accumulatedKey: "cumulativeTreadmill",
    unit: "mi",
  },
  rower: {
    label: "Rower",
    color: "#3D6B99",
    dataKey: "rower",
    accumulatedKey: "cumulativeRower",
    unit: "x100m",
  },
  splats: {
    label: "Splat Points",
    color: "#6B5B95",
    dataKey: "splats",
    accumulatedKey: "cumulativeSplats",
    unit: "",
  },
  calories: {
    label: "Calories",
    color: "#C53D3D",
    dataKey: "calories",
    accumulatedKey: "cumulativeCalories",
    unit: "cal",
  },
};

export default function TrendChart({ data, selectedMetrics }: TrendChartProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("individual");
  const [chartType, setChartType] = useState<ChartType>("line");
  const [dateRange, setDateRange] = useState<DateRange>("all");
  const [isExpanded, setIsExpanded] = useState(false);
  const [showWeeklyAvg, setShowWeeklyAvg] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isExpanded) {
        setIsExpanded(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isExpanded]);

  const toggleExpanded = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  const filteredData = useMemo(() => {
    if (dateRange === "all") return data;

    const now = new Date();
    const cutoff = new Date();

    switch (dateRange) {
      case "30d":
        cutoff.setDate(now.getDate() - 30);
        break;
      case "90d":
        cutoff.setDate(now.getDate() - 90);
        break;
      case "1y":
        cutoff.setFullYear(now.getFullYear() - 1);
        break;
    }

    return data.filter((d) => new Date(d.fullDate) >= cutoff);
  }, [data, dateRange]);

  const { spansMultipleYears } = useMemo(() => {
    if (filteredData.length === 0)
      return { spansMultipleYears: false, yearRanges: [] };

    const years = new Set(
      filteredData.map((d) => new Date(d.fullDate).getFullYear()),
    );
    return { spansMultipleYears: years.size > 1, yearRanges: [] };
  }, [filteredData]);

  const weeklyAverages = useMemo(() => {
    if (filteredData.length === 0) return {};

    const averages: Record<string, number> = {};
    const weeklyData: Record<string, Record<string, number[]>> = {};

    filteredData.forEach((d) => {
      const date = new Date(d.fullDate);
      const startOfYear = new Date(date.getFullYear(), 0, 1);
      const days = Math.floor(
        (date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000),
      );
      const weekNum = Math.ceil((days + startOfYear.getDay() + 1) / 7);
      const weekKey = `${date.getFullYear()}-W${weekNum}`;

      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = {
          treadmill: [],
          rower: [],
          splats: [],
          calories: [],
          workoutCount: [],
        };
      }

      weeklyData[weekKey].treadmill.push(d.treadmill);
      weeklyData[weekKey].rower.push(d.rower);
      weeklyData[weekKey].splats.push(d.splats);
      weeklyData[weekKey].calories.push(d.calories);
      weeklyData[weekKey].workoutCount.push(d.workoutCount);
    });

    const weeks = Object.keys(weeklyData).length;

    if (weeks > 0) {
      const totalTreadmill = filteredData.reduce(
        (sum, d) => sum + d.treadmill,
        0,
      );
      const totalRower = filteredData.reduce((sum, d) => sum + d.rower, 0);
      const totalSplats = filteredData.reduce((sum, d) => sum + d.splats, 0);
      const totalCalories = filteredData.reduce(
        (sum, d) => sum + d.calories,
        0,
      );
      const count = filteredData.length;

      averages.treadmill = Math.round((totalTreadmill / count) * 10) / 10;
      averages.rower = Math.round((totalRower / count) * 10) / 10;
      averages.splats = Math.round(totalSplats / count);
      averages.calories = Math.round(totalCalories / count);
      averages.workoutCount = Math.round((count / weeks) * 10) / 10;
    }

    return averages;
  }, [filteredData]);

  const getDataKey = (metric: TrendMetric): string => {
    const config = metricConfig[metric];
    return viewMode === "accumulated" ? config.accumulatedKey : config.dataKey;
  };

  const getLabel = (metric: TrendMetric): string => {
    const config = metricConfig[metric];
    const prefix = viewMode === "accumulated" ? "Total " : "";
    const suffix = config.unit ? ` (${config.unit})` : "";
    return `${prefix}${config.label}${suffix}`;
  };

  const gridProps = {
    strokeDasharray: "3 3",
    stroke: "#E8E6E3",
    opacity: 0.8,
  };

  const xAxisProps = {
    dataKey: "date",
    stroke: "#8A8A8A",
    fontSize: 11,
    tickLine: false,
  };

  const yAxisProps = {
    stroke: "#8A8A8A",
    fontSize: 11,
    tickLine: false,
  };

  // Light mode tooltip styling
  const tooltipProps = {
    contentStyle: {
      backgroundColor: "#FFFFFF",
      border: "1px solid #E8E6E3",
      borderRadius: "6px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
      color: "#1A1A1A",
    },
    labelStyle: { color: "#1A1A1A", fontWeight: 500 },
    itemStyle: { color: "#5C5C5C" },
  };

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
    const dataPoint = filteredData[index];
    if (!dataPoint) return null;

    const date = new Date(dataPoint.fullDate);
    const showYear =
      spansMultipleYears &&
      (index === 0 ||
        (index > 0 &&
          new Date(filteredData[index - 1].fullDate).getFullYear() !==
            date.getFullYear()));

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
          {payload.value}
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
            {date.getFullYear()}
          </text>
        )}
      </g>
    );
  };

  const renderChart = () => {
    if (selectedMetrics.length === 0) {
      return (
        <div
          className="h-full flex items-center justify-center"
          style={{ color: "var(--text-muted)" }}
        >
          <div className="text-center">
            <p>Select a stat card above to show its trend</p>
          </div>
        </div>
      );
    }

    const margin = {
      top: 5,
      right: 30,
      left: 20,
      bottom: spansMultipleYears ? 35 : 5,
    };

    const renderAverageLines = () => {
      if (!showWeeklyAvg || viewMode === "accumulated") return null;

      return selectedMetrics.map((metric) => {
        const config = metricConfig[metric];
        const avgValue = weeklyAverages[config.dataKey];
        if (avgValue === undefined) return null;

        return (
          <ReferenceLine
            key={`avg-${metric}`}
            y={avgValue}
            stroke={config.color}
            strokeDasharray="5 5"
            strokeOpacity={0.7}
            label={{
              value: `Avg: ${avgValue}`,
              fill: config.color,
              fontSize: 11,
              position: "right",
            }}
          />
        );
      });
    };

    if (viewMode === "accumulated") {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={filteredData} margin={margin}>
            <CartesianGrid {...gridProps} />
            <XAxis
              {...xAxisProps}
              tick={spansMultipleYears ? CustomXAxisTick : undefined}
            />
            <YAxis {...yAxisProps} />
            <Tooltip {...tooltipProps} />
            <Legend />
            {selectedMetrics.map((metric) => {
              const config = metricConfig[metric];
              const dataKey = getDataKey(metric);
              const label = getLabel(metric);

              return (
                <Area
                  key={metric}
                  type="monotone"
                  dataKey={dataKey}
                  name={label}
                  stroke={config.color}
                  fill={config.color}
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
              );
            })}
          </AreaChart>
        </ResponsiveContainer>
      );
    }

    if (chartType === "bar") {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={filteredData} margin={margin}>
            <CartesianGrid {...gridProps} />
            <XAxis
              {...xAxisProps}
              tick={spansMultipleYears ? CustomXAxisTick : undefined}
            />
            <YAxis {...yAxisProps} />
            <Tooltip {...tooltipProps} />
            <Legend />
            {renderAverageLines()}
            {selectedMetrics.map((metric) => {
              const config = metricConfig[metric];
              const dataKey = getDataKey(metric);
              const label = getLabel(metric);

              return (
                <Bar
                  key={metric}
                  dataKey={dataKey}
                  name={label}
                  fill={config.color}
                  radius={[2, 2, 0, 0]}
                />
              );
            })}
          </BarChart>
        </ResponsiveContainer>
      );
    }

    if (chartType === "scatter") {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={margin}>
            <CartesianGrid {...gridProps} />
            <XAxis
              type="category"
              dataKey="date"
              name="Date"
              stroke="#8A8A8A"
              fontSize={11}
              tickLine={false}
              allowDuplicatedCategory={false}
              tick={spansMultipleYears ? CustomXAxisTick : undefined}
            />
            <YAxis {...yAxisProps} />
            <Tooltip {...tooltipProps} cursor={{ strokeDasharray: "3 3" }} />
            <Legend />
            {selectedMetrics.map((metric) => {
              const config = metricConfig[metric];
              const label = getLabel(metric);

              return (
                <Scatter
                  key={metric}
                  name={label}
                  data={filteredData}
                  fill={config.color}
                >
                  {filteredData.map((_, index) => (
                    <circle
                      key={`dot-${index}`}
                      cx={0}
                      cy={0}
                      r={5}
                      fill={config.color}
                    />
                  ))}
                </Scatter>
              );
            })}
          </ScatterChart>
        </ResponsiveContainer>
      );
    }

    return (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={filteredData} margin={margin}>
          <CartesianGrid {...gridProps} />
          <XAxis
            {...xAxisProps}
            tick={spansMultipleYears ? CustomXAxisTick : undefined}
          />
          <YAxis {...yAxisProps} />
          <Tooltip {...tooltipProps} />
          <Legend />
          {renderAverageLines()}
          {selectedMetrics.map((metric) => {
            const config = metricConfig[metric];
            const dataKey = getDataKey(metric);
            const label = getLabel(metric);

            return (
              <Line
                key={metric}
                type="monotone"
                dataKey={dataKey}
                name={label}
                stroke={config.color}
                strokeWidth={2}
                dot={{ fill: config.color, strokeWidth: 0, r: 3 }}
                activeDot={{ r: 5 }}
              />
            );
          })}
        </LineChart>
      </ResponsiveContainer>
    );
  };

  const chartContent = (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2
          className="text-base font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          {viewMode === "accumulated"
            ? "Cumulative Totals"
            : "Performance Trends"}
        </h2>
        <div className="flex items-center gap-2">
          <div
            className="flex rounded-md overflow-hidden"
            style={{ border: "1px solid var(--border)" }}
          >
            {(["30d", "90d", "1y", "all"] as DateRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className="px-2.5 py-1 text-xs font-medium transition-colors"
                style={{
                  background:
                    dateRange === range ? "var(--primary)" : "var(--surface)",
                  color:
                    dateRange === range ? "white" : "var(--text-secondary)",
                }}
              >
                {range === "all" ? "All" : range.toUpperCase()}
              </button>
            ))}
          </div>

          <button
            onClick={toggleExpanded}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              color: "var(--text-secondary)",
            }}
          >
            {isExpanded ? "Collapse" : "Expand"}
          </button>
        </div>
      </div>

      <div
        className="flex flex-wrap items-center gap-4 mb-4 pb-4"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            View:
          </span>
          <div
            className="flex rounded-md overflow-hidden"
            style={{ border: "1px solid var(--border)" }}
          >
            <button
              onClick={() => setViewMode("individual")}
              className="px-3 py-1.5 text-xs font-medium transition-colors"
              style={{
                background:
                  viewMode === "individual"
                    ? "var(--primary)"
                    : "var(--surface)",
                color:
                  viewMode === "individual" ? "white" : "var(--text-secondary)",
              }}
            >
              Per Workout
            </button>
            <button
              onClick={() => setViewMode("accumulated")}
              className="px-3 py-1.5 text-xs font-medium transition-colors"
              style={{
                background:
                  viewMode === "accumulated"
                    ? "var(--primary)"
                    : "var(--surface)",
                color:
                  viewMode === "accumulated"
                    ? "white"
                    : "var(--text-secondary)",
              }}
            >
              Cumulative
            </button>
          </div>
        </div>

        {viewMode === "individual" && (
          <>
            <div className="flex items-center gap-2">
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                Style:
              </span>
              <div
                className="flex rounded-md overflow-hidden"
                style={{ border: "1px solid var(--border)" }}
              >
                {(["line", "bar", "scatter"] as ChartType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => setChartType(type)}
                    className="px-3 py-1.5 text-xs font-medium transition-colors capitalize"
                    style={{
                      background:
                        chartType === type
                          ? "var(--primary)"
                          : "var(--surface)",
                      color:
                        chartType === type ? "white" : "var(--text-secondary)",
                    }}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showWeeklyAvg}
                onChange={(e) => setShowWeeklyAvg(e.target.checked)}
                className="w-3.5 h-3.5 rounded"
                style={{ accentColor: "var(--primary)" }}
              />
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                Show Avg
              </span>
            </label>
          </>
        )}

        {selectedMetrics.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
              Showing:
            </span>
            <div className="flex gap-1">
              {selectedMetrics.map((metric) => (
                <span
                  key={metric}
                  className="px-2 py-0.5 text-xs font-medium rounded"
                  style={{
                    backgroundColor: `${metricConfig[metric].color}15`,
                    color: metricConfig[metric].color,
                  }}
                >
                  {metricConfig[metric].label}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div
        ref={containerRef}
        className={`relative ${isExpanded ? "h-[500px]" : "h-[280px]"} transition-all duration-300`}
      >
        {renderChart()}
      </div>
    </>
  );

  return (
    <div
      className={`rounded-lg p-5 transition-all duration-300 ${
        isExpanded ? "lg:col-span-2" : ""
      }`}
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
      }}
    >
      {chartContent}
    </div>
  );
}

"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { WeekdayData } from "@/lib/utils";

interface WeekdayFrequencyProps {
  data: WeekdayData[];
}

export default function WeekdayFrequency({ data }: WeekdayFrequencyProps) {
  const maxCount = Math.max(...data.map((d) => d.count), 1);

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
        Workout Frequency by Day
      </h2>

      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 10, right: 10, left: 0, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#E8E6E3"
              opacity={0.8}
              vertical={false}
            />
            <XAxis
              dataKey="shortDay"
              stroke="#8A8A8A"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#8A8A8A"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
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
              itemStyle={{ color: "#5C5C5C" }}
              formatter={(value, _name, props) => {
                const payload = props.payload as WeekdayData;
                return [
                  `${value} workouts (${payload.percentage}%)`,
                  payload.day,
                ];
              }}
              labelFormatter={() => ""}
            />
            <Bar dataKey="count" radius={[3, 3, 0, 0]} maxBarSize={50}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.count === maxCount ? "#E55A1B" : "#E55A1B"}
                  fillOpacity={0.3 + (entry.count / maxCount) * 0.7}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div
        className="mt-4 pt-4"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          {(() => {
            const sorted = [...data].sort((a, b) => b.count - a.count);
            const top = sorted[0];
            if (top.count === 0) return "No workout data yet";
            return `Most active on ${top.day}s (${top.count} workouts, ${top.percentage}%)`;
          })()}
        </p>
      </div>
    </div>
  );
}

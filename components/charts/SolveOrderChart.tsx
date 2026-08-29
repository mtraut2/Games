"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { ConnectionsStats } from "@/lib/personStats";

const COLOR_HEX: Record<string, string> = {
  yellow: "#ca8a04",
  green: "#16a34a",
  blue: "#2563eb",
  purple: "#9333ea",
};

const POSITION_LABELS = ["1st", "2nd", "3rd", "4th"];

export default function SolveOrderChart({ stats }: { stats: ConnectionsStats }) {
  const data = POSITION_LABELS.map((label, idx) => {
    const row: Record<string, string | number> = { position: label };
    for (const color of Object.keys(stats.solveOrderByColor)) {
      const counts = stats.solveOrderByColor[color as keyof typeof stats.solveOrderByColor];
      const total = counts.reduce((a, b) => a + b, 0);
      row[color] = total > 0 ? Math.round((counts[idx] / total) * 100) : 0;
    }
    return row;
  });

  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-neutral-200 dark:stroke-neutral-800" />
          <XAxis dataKey="position" tick={{ fontSize: 12 }} />
          <YAxis unit="%" tick={{ fontSize: 12 }} />
          <Tooltip formatter={(value) => `${value}%`} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {Object.keys(COLOR_HEX).map((color) => (
            <Bar key={color} dataKey={color} fill={COLOR_HEX[color]} radius={[4, 4, 0, 0]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

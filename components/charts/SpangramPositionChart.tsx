"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { StrandsStats } from "@/lib/personStats";

export default function SpangramPositionChart({ stats }: { stats: StrandsStats }) {
  const maxPosition = Math.max(4, ...Object.keys(stats.spangramPositionCounts).map(Number));
  const data = Array.from({ length: maxPosition }, (_, i) => {
    const position = i + 1;
    return { position: String(position), count: stats.spangramPositionCounts[position] ?? 0 };
  });

  return (
    <div className="h-40 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-neutral-200 dark:stroke-neutral-800" />
          <XAxis dataKey="position" tick={{ fontSize: 12 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
          <Tooltip />
          <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

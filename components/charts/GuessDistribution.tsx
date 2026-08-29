"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { WordleStats } from "@/lib/personStats";

export default function GuessDistribution({ stats }: { stats: WordleStats }) {
  const data = [1, 2, 3, 4, 5, 6].map((n) => ({ label: String(n), count: stats.distribution[n] ?? 0 }));
  data.push({ label: "X", count: stats.failCount });

  return (
    <div className="h-40 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-neutral-200 dark:stroke-neutral-800" />
          <XAxis dataKey="label" tick={{ fontSize: 12 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
          <Tooltip />
          <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

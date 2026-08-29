"use client";

import { useState } from "react";
import { todayDateString } from "@/lib/today";
import { rangeForPreset, type DateFilterPreset, type DateRange } from "@/lib/dateFilter";

const PRESETS: { id: DateFilterPreset; label: string }[] = [
  { id: "all", label: "All time" },
  { id: "month", label: "This month" },
  { id: "30days", label: "Last 30 days" },
  { id: "week", label: "This week" },
  { id: "custom", label: "Custom" },
];

export default function DateFilter({ onChange }: { onChange: (range: DateRange) => void }) {
  const [preset, setPreset] = useState<DateFilterPreset>("all");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const today = todayDateString();

  function apply(nextPreset: DateFilterPreset, start = customStart, end = customEnd) {
    setPreset(nextPreset);
    onChange(rangeForPreset(nextPreset, today, { start: start || null, end: end || null }));
  }

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      {PRESETS.map((p) => (
        <button
          key={p.id}
          onClick={() => apply(p.id)}
          className={`rounded-full border px-3 py-1 ${
            preset === p.id
              ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
              : "border-neutral-300 text-neutral-600 dark:border-neutral-700 dark:text-neutral-400"
          }`}
        >
          {p.label}
        </button>
      ))}
      {preset === "custom" && (
        <div className="flex items-center gap-1">
          <input
            type="date"
            value={customStart}
            onChange={(e) => {
              setCustomStart(e.target.value);
              apply("custom", e.target.value, customEnd);
            }}
            className="rounded-lg border border-neutral-300 p-1 text-xs dark:border-neutral-700 dark:bg-neutral-900"
          />
          <span>–</span>
          <input
            type="date"
            value={customEnd}
            onChange={(e) => {
              setCustomEnd(e.target.value);
              apply("custom", customStart, e.target.value);
            }}
            className="rounded-lg border border-neutral-300 p-1 text-xs dark:border-neutral-700 dark:bg-neutral-900"
          />
        </div>
      )}
    </div>
  );
}

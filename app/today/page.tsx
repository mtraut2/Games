"use client";

import { useAppData } from "@/lib/context/AppDataContext";
import { todayDateString } from "@/lib/today";
import { resultsForDate } from "@/lib/scoring";
import SubmitFlow from "@/components/submit/SubmitFlow";
import SkipPrompt from "@/components/SkipPrompt";
import TodaySummary from "@/components/TodaySummary";
import ResultCard from "@/components/ResultCard";

export default function TodayPage() {
  const { results } = useAppData();
  const today = todayDateString();
  const todayResults = [...resultsForDate(results, today)].sort((a, b) =>
    a.created_at < b.created_at ? 1 : -1
  );

  return (
    <div className="flex flex-col gap-4">
      <SkipPrompt />
      <SubmitFlow />
      <TodaySummary />
      <div className="flex flex-col gap-3">
        {todayResults.length === 0 && (
          <p className="py-6 text-center text-sm text-neutral-400">
            No results yet today — be the first!
          </p>
        )}
        {todayResults.map((r) => (
          <ResultCard key={r.id} result={r} />
        ))}
      </div>
    </div>
  );
}

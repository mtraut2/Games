"use client";

import { useState } from "react";
import { POINTS_BY_PLACE } from "@/lib/scoring";

export default function PointsExplainer() {
  const [open, setOpen] = useState(false);
  const [first, second, third] = POINTS_BY_PLACE;

  return (
    <div className="rounded-xl border border-neutral-200 dark:border-neutral-800">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between p-3 text-sm font-medium"
      >
        <span>ℹ️ How points work</span>
        <span className="text-neutral-400">{open ? "–" : "+"}</span>
      </button>
      {open && (
        <div className="flex flex-col gap-2 border-t border-neutral-200 p-3 text-sm text-neutral-600 dark:border-neutral-800 dark:text-neutral-400">
          <p>
            Each day, every game (Wordle, Connections, Strands) awards points to that
            day&apos;s best scores: 1st place gets {first}, 2nd gets {second}, 3rd gets{" "}
            {third} — based on fewer guesses, fewer mistakes, or fewer hints.
          </p>
          <p>
            A tie on that score isn&apos;t always a tie on skill: in Wordle, whoever found
            their first correct letter in fewer guesses wins the tiebreak; in Connections,
            whoever solved the harder categories (purple/blue) earlier wins it; in Strands,
            whoever found the spangram earlier wins it. Only when both the score and that
            tiebreak match do people split the points evenly — e.g. two people tied in
            every way for 1st/2nd share {first + second} pts, {(first + second) / 2} each.
          </p>
          <p>
            Play all three games in one day and have the most combined points, and you&apos;re
            that day&apos;s Overall winner — a recognition badge shown on Today, not an extra
            source of points. Your season total is purely what you&apos;ve earned from the
            three games, nothing added on top. Only people who played all three games that
            day are eligible for the badge — everyone else still earns points toward Overall
            from whichever games they play.
          </p>
          <p>
            The tabs above let you view Overall standings or just one game — handy if you
            only play, say, Wordle, since you can still compete without needing to play
            the other two.
          </p>
          <p>
            Season standings are just the sum of everyone&apos;s daily points over
            whatever date range is selected above. Streaks are separate — always
            all-time, never affected by this filter.
          </p>
        </div>
      )}
    </div>
  );
}

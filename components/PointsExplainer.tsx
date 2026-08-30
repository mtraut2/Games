"use client";

import { useState } from "react";
import { OVERALL_WINNER_BONUS, POINTS_BY_PLACE } from "@/lib/scoring";

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
            whoever solved the harder categories (blue/purple) earlier wins it; in Strands,
            whoever found the spangram earlier wins it. Only when both the score and that
            tiebreak match do people split the points evenly — e.g. two people tied in
            every way for 1st/2nd share {first + second} pts, {(first + second) / 2} each.
          </p>
          <p>
            Play all three games in one day and earn the most combined points across them,
            and you get an extra +{OVERALL_WINNER_BONUS} bonus point for that day — points,
            not raw score, since points already put every game on the same scale and already
            account for each game&apos;s own tiebreak. A tied points total splits the bonus
            evenly, since that tie already means two people were equally strong today, just
            via different games. Only people who played all three games that day are eligible
            — everyone else still earns points toward Overall from whichever games they play.
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

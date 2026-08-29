"use client";

import { useAppData } from "@/lib/context/AppDataContext";
import { usePerson } from "@/lib/context/PersonContext";
import { toggleReaction } from "@/lib/db";
import { REACTION_EMOJIS } from "@/lib/types";

export default function ReactionBar({ resultId }: { resultId: string }) {
  const { reactions, refetch } = useAppData();
  const { currentPersonId } = usePerson();
  const resultReactions = reactions.filter((r) => r.result_id === resultId);

  async function handleToggle(emoji: string) {
    if (!currentPersonId) return;
    await toggleReaction(resultId, currentPersonId, emoji);
    await refetch();
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {REACTION_EMOJIS.map((emoji) => {
        const count = resultReactions.filter((r) => r.emoji === emoji).length;
        const mine = resultReactions.some(
          (r) => r.emoji === emoji && r.person_id === currentPersonId
        );
        return (
          <button
            key={emoji}
            onClick={() => handleToggle(emoji)}
            className={`rounded-full border px-2 py-0.5 text-sm transition ${
              mine
                ? "border-blue-400 bg-blue-50 dark:bg-blue-950"
                : count > 0
                  ? "border-neutral-200 dark:border-neutral-800"
                  : "border-neutral-200 opacity-50 hover:opacity-100 dark:border-neutral-800"
            }`}
          >
            {emoji}
            {count > 0 ? ` ${count}` : ""}
          </button>
        );
      })}
    </div>
  );
}

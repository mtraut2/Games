import type { Game } from "./types";

export function scoreLabel(game: Game, score: number, failed?: boolean): string {
  if (game === "wordle") {
    const isFail = failed ?? score === 7;
    return isFail ? "X/6" : `${score}/6`;
  }
  if (game === "connections") return `${score} mistake${score === 1 ? "" : "s"}`;
  return `${score} hint${score === 1 ? "" : "s"}`;
}

export type Game = "wordle" | "connections" | "strands";

export type ConnectionsColor = "yellow" | "green" | "blue" | "purple";

export interface Person {
  id: string;
  name: string;
  created_at: string;
}

export interface Result {
  id: string;
  person_id: string;
  game: Game;
  date: string; // YYYY-MM-DD
  puzzle_number: number | null;
  score: number; // lower is better; wordle: guesses (fail=7), connections: mistakes, strands: hints
  failed: boolean; // wordle only
  raw_text: string;
  solve_order: ConnectionsColor[] | null; // connections only
  spangram_position: number | null; // strands only, 1-indexed among found words
  created_at: string;
  updated_at: string;
}

export interface Skip {
  id: string;
  person_id: string;
  date_covered: string; // YYYY-MM-DD, the day being protected
  date_applied: string; // YYYY-MM-DD, the day the skip was claimed
  created_at: string;
}

export interface Reaction {
  id: string;
  result_id: string;
  person_id: string;
  emoji: string;
  created_at: string;
}

export interface Comment {
  id: string;
  result_id: string;
  person_id: string;
  text: string;
  created_at: string;
}

export const REACTION_EMOJIS = ["👏", "🔥", "😂", "🎉", "❤️", "😭"] as const;

export const GAMES: Game[] = ["wordle", "connections", "strands"];

export const GAME_LABELS: Record<Game, string> = {
  wordle: "Wordle",
  connections: "Connections",
  strands: "Strands",
};

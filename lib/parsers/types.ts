import type { ConnectionsColor } from "@/lib/types";

export type Confidence = "high" | "low";

export interface ParsedWordle {
  game: "wordle";
  confidence: Confidence;
  puzzleNumber: number | null;
  score: number; // guesses used, 1-6; a fail is stored as 7 (worse than 6/6)
  failed: boolean;
}

export interface ParsedConnections {
  game: "connections";
  confidence: Confidence;
  puzzleNumber: number | null;
  score: number; // mistakes made
  solveOrder: ConnectionsColor[]; // colors in the order their group was fully solved
}

export interface ParsedStrands {
  game: "strands";
  confidence: Confidence;
  puzzleNumber: number | null;
  score: number; // hints used
  spangramPosition: number | null; // 1-indexed position among found words; null if undetermined
  needsSpangramConfirmation: boolean;
  totalFoundWords?: number; // total found words (theme words + spangram), for building a manual picker
}

export type ParsedResult = ParsedWordle | ParsedConnections | ParsedStrands;

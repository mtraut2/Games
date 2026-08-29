import { supabase } from "./supabase";
import type {
  Comment,
  ConnectionsColor,
  Game,
  Person,
  Reaction,
  Result,
  Skip,
} from "./types";

export async function fetchPeople(): Promise<Person[]> {
  const { data, error } = await supabase.from("people").select("*").order("name");
  if (error) throw error;
  return data ?? [];
}

export async function addPerson(name: string): Promise<Person> {
  const { data, error } = await supabase
    .from("people")
    .insert({ name: name.trim() })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deletePerson(id: string): Promise<void> {
  const { error } = await supabase.from("people").delete().eq("id", id);
  if (error) throw error;
}

export async function fetchResults(): Promise<Result[]> {
  const { data, error } = await supabase
    .from("results")
    .select("*")
    .order("date", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export interface UpsertResultInput {
  person_id: string;
  game: Game;
  date: string;
  puzzle_number: number | null;
  score: number;
  failed: boolean;
  raw_text: string;
  solve_order: ConnectionsColor[] | null;
  spangram_position: number | null;
}

export async function upsertResult(input: UpsertResultInput): Promise<Result> {
  const { data, error } = await supabase
    .from("results")
    .upsert(input, { onConflict: "person_id,game,date" })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteResult(id: string): Promise<void> {
  const { error } = await supabase.from("results").delete().eq("id", id);
  if (error) throw error;
}

export async function findExistingResult(
  personId: string,
  game: Game,
  date: string
): Promise<Result | null> {
  const { data, error } = await supabase
    .from("results")
    .select("*")
    .eq("person_id", personId)
    .eq("game", game)
    .eq("date", date)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchSkips(): Promise<Skip[]> {
  const { data, error } = await supabase.from("skips").select("*");
  if (error) throw error;
  return data ?? [];
}

export async function addSkip(
  personId: string,
  dateCovered: string,
  dateApplied: string
): Promise<Skip> {
  const { data, error } = await supabase
    .from("skips")
    .insert({ person_id: personId, date_covered: dateCovered, date_applied: dateApplied })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function fetchReactions(): Promise<Reaction[]> {
  const { data, error } = await supabase.from("reactions").select("*");
  if (error) throw error;
  return data ?? [];
}

/** Adds the reaction if this person hasn't reacted with this emoji yet, otherwise removes it. */
export async function toggleReaction(
  resultId: string,
  personId: string,
  emoji: string
): Promise<void> {
  const { data: existing, error: findError } = await supabase
    .from("reactions")
    .select("id")
    .eq("result_id", resultId)
    .eq("person_id", personId)
    .eq("emoji", emoji)
    .maybeSingle();
  if (findError) throw findError;

  if (existing) {
    const { error } = await supabase.from("reactions").delete().eq("id", existing.id);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from("reactions")
      .insert({ result_id: resultId, person_id: personId, emoji });
    if (error) throw error;
  }
}

export async function fetchComments(): Promise<Comment[]> {
  const { data, error } = await supabase
    .from("comments")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function addComment(
  resultId: string,
  personId: string,
  text: string
): Promise<Comment> {
  const { data, error } = await supabase
    .from("comments")
    .insert({ result_id: resultId, person_id: personId, text: text.trim() })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteComment(id: string): Promise<void> {
  const { error } = await supabase.from("comments").delete().eq("id", id);
  if (error) throw error;
}

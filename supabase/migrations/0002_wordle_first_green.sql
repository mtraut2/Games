-- Adds the "first green tile" signal used to break Wordle ties: which
-- guess row first contained a 🟩, 1-indexed. Nullable (older rows and
-- entries with no parseable grid just have no tiebreak data).
alter table results add column if not exists first_green_guess integer;

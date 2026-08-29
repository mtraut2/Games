-- Games (NYT family leaderboard) — initial schema
-- Run this once in your Supabase project's SQL editor (Database > SQL Editor).

create extension if not exists "pgcrypto";

create table if not exists people (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists results (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references people(id) on delete cascade,
  game text not null check (game in ('wordle', 'connections', 'strands')),
  date date not null,
  puzzle_number integer,
  score integer not null,
  failed boolean not null default false,
  raw_text text not null,
  solve_order jsonb,
  spangram_position integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (person_id, game, date)
);

create index if not exists results_date_idx on results(date);
create index if not exists results_person_idx on results(person_id);

create table if not exists skips (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references people(id) on delete cascade,
  date_covered date not null,
  date_applied date not null,
  created_at timestamptz not null default now(),
  unique (person_id, date_covered)
);

create table if not exists reactions (
  id uuid primary key default gen_random_uuid(),
  result_id uuid not null references results(id) on delete cascade,
  person_id uuid not null references people(id) on delete cascade,
  emoji text not null,
  created_at timestamptz not null default now(),
  unique (result_id, person_id, emoji)
);

create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  result_id uuid not null references results(id) on delete cascade,
  person_id uuid not null references people(id) on delete cascade,
  text text not null,
  created_at timestamptz not null default now()
);

create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists results_set_updated_at on results;
create trigger results_set_updated_at
before update on results
for each row execute function set_updated_at();

-- RLS: this app has no auth concept — it's a shared link with no
-- password, so anyone who has the link can read and write everything.
-- These permissive policies are a deliberate match for that trust model,
-- not an oversight.
alter table people enable row level security;
alter table results enable row level security;
alter table skips enable row level security;
alter table reactions enable row level security;
alter table comments enable row level security;

drop policy if exists "allow all to anon" on people;
create policy "allow all to anon" on people for all using (true) with check (true);

drop policy if exists "allow all to anon" on results;
create policy "allow all to anon" on results for all using (true) with check (true);

drop policy if exists "allow all to anon" on skips;
create policy "allow all to anon" on skips for all using (true) with check (true);

drop policy if exists "allow all to anon" on reactions;
create policy "allow all to anon" on reactions for all using (true) with check (true);

drop policy if exists "allow all to anon" on comments;
create policy "allow all to anon" on comments for all using (true) with check (true);

-- Realtime: broadcast INSERT/UPDATE/DELETE on the tables the Today feed
-- subscribes to, so results/reactions/comments show up live for everyone.
alter publication supabase_realtime add table results;
alter publication supabase_realtime add table reactions;
alter publication supabase_realtime add table comments;

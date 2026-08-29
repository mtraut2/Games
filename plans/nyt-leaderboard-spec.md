# NYT Games family leaderboard — build spec

## Overview
A free, mobile-friendly web app for a family (5-8 people) to log and compare
daily NYT Games results (Wordle, Connections, Strands), with a shared feed,
season standings, and per-person stats.

## Stack (all free tier)
- Frontend: Next.js, hosted on Vercel
- Database: Supabase (Postgres)
- Installable PWA (add to home screen, full-screen, no browser chrome)
- No paid APIs, no SMS/Twilio integration

## Access model
- Shared link, no password, no per-person login
- On first visit, pick your name from a list of family members; remembered
  via localStorage for future visits
- Anyone can submit a result on behalf of anyone else (in case someone forgets)
- All results are visible to everyone immediately upon submission (no gating
  or spoiler protection — matches how the family currently shares in their
  group chat)

## Data entry
- Primary flow: paste the NYT "Share" clipboard text into a textbox
- App auto-detects which game it is (Wordle / Connections / Strands) from
  the pasted text
- Parses the score automatically, shows a confirmation before saving
- Manual entry as a fallback if parsing fails

### Parsing rules
**Wordle**: extract puzzle number and X/6 score from first line via regex.
Fail (X) = worse than a 6/6.

**Connections**: count guess rows; a row that is all one color = solved
group; a mixed-color row = a mistake. Mistakes = (total rows - 4). Also
capture the ORDER in which each color group was fully solved (1st solve,
2nd solve, etc.) for solve-order stats.

**Strands**: do NOT hardcode specific emoji, since NYT sometimes uses
special/themed emoji on holidays or special puzzles. Parse structurally:
- The most-repeated non-hint emoji = "theme word found"
- The hint emoji is usually 💡 but treat this as a soft assumption
- The spangram is the emoji that is visually distinct from both the
  found-word emoji and the hint emoji, appearing in exactly one position
  in the grid
- Capture: total hints used, and the POSITION at which the spangram was
  found relative to other words (1st find, 2nd find, etc.)
- If parsing confidence is low (ambiguous emoji set), do not guess — prompt
  the submitter: "Which row was the spangram?" and let them tap to confirm,
  rather than silently saving incorrect data

## Scoring rules
- Wordle score = guesses used (lower is better; fail counts as worse than 6)
- Connections score = mistakes made (lower is better)
- Strands score = hints used (lower is better)
- **Daily per-game winner**: 3 separate winners each day, one per game,
  based on lowest score for that game that day
- **Daily overall winner**: only among people who played and submitted
  ALL THREE games that day; winner = lowest SUM of their three raw scores
  (guesses + mistakes + hints, summed as-is, no normalization)
- **Points (season standings)**:
  - Daily per-game winner: 3 pts, 2nd: 2 pts, 3rd: 1 pt (split on ties)
  - Daily overall winner: bonus points on top (e.g. +2) since it's harder
    to achieve
  - Running season total displayed on Standings tab

## Streaks
- One streak per PERSON (shared across all 3 games, not per-game)
- Playing at least one game on a given day maintains the streak; missing
  a day breaks it — UNLESS a skip is used (see below)
- Track both "current streak" and "longest streak" per person
- Streaks are NOT affected by the date-range filter (always show true
  all-time values, even when other stats are filtered to a shorter window)

### Skip mechanic
- Each person gets 1 skip per rolling 30-day window (not calendar month —
  continuously rolling; e.g. skip used Aug 1 means next skip available Aug 31)
- One skip covers ALL 3 games for that day (shared pool, not per-game)
- Can be applied retroactively, up to 1 day after the missed day
  (e.g. miss Tuesday, can still apply the skip on Wednesday)
- A skipped day counts as neutral for streak purposes (streak continues
  through it) but contributes ZERO to that day's stats/points (it's not
  a played result, just a streak preserver)
- UX: proactively prompt on the Today screen if yesterday was missed and
  a skip is still available — e.g. "Skip Tuesday to save your streak?" —
  rather than making the user hunt for this option

## Social features
- **Reactions**: small preset set of emoji (👏 🔥 😂 🎉 ❤️ 😭) tappable on
  any result; shows as stacked bubbles with counts under the result
- **Comments**: short text replies threaded under a specific result,
  visible to the whole family; attributed by whichever name the commenter
  is currently using on their device (same trust model as submitting
  on someone else's behalf — no verification)

## Views / navigation (tabbed)
1. **Today**: live feed of today's submitted results (as cards, each with
   reactions/comments), status of who's submitted which games, per-game
   daily winners, and the overall winner (once someone's completed all 3)
2. **Standings**: season points leaderboard, respects the global date filter
3. **People**: list of family members → tap into a person's detail page

### Person detail page
Tabbed by game (Wordle / Connections / Strands), each showing:
- **Wordle**: avg guesses, win %, guess distribution chart (1-6 breakdown),
  current/longest streak, best/worst puzzle
- **Connections**: avg mistakes, perfect-game %, solve-order chart (% of
  time each color — yellow/green/blue/purple — was solved 1st/2nd/3rd/4th),
  current/longest streak
- **Strands**: avg hints, hint-free %, spangram-first % and average
  spangram find-position chart, current/longest streak

## Global date filter
- One shared control (not per-tab) — presets: All time, This month,
  Last 30 days, This week, Custom range (date picker)
- Applies to Standings and Person detail stats
- Does NOT apply to streaks (see Streaks section above — always all-time)

## Data model (rough)
- `people`: id, name
- `results`: id, person_id, game, date, puzzle_number, score, failed,
  raw_text, solve_order (jsonb, Connections only), spangram_position
  (int, Strands only)
- `skips`: id, person_id, date_covered, date_applied
- `reactions`: id, result_id, person_id, emoji, timestamp
- `comments`: id, result_id, person_id, text, timestamp

Daily/overall winners and points are computed on read from `results`,
not stored separately, to avoid sync bugs.

## Decisions (resolved during planning)
- **Roster management**: in-app add/remove — a screen (reachable from the
  People tab) lets anyone add a new family member on the fly, no DB
  migration needed to onboard someone mid-season.
- **Editing/deleting results**: anyone can edit or delete any result,
  consistent with the existing "no verification, shared trust" model used
  for submitting on someone else's behalf. Editing re-runs the parser
  confirmation step; deleting removes reactions/comments on that result too.
- **Tie-break points**: pooled points for a tied rank are averaged across
  the tied people (e.g. two people tied for 1st in a 3/2/1 scheme split
  the 3+2=5 pts as 2.5 each). Season totals can therefore be fractional
  (displayed to 1 decimal place).
- **Live updates**: Today feed (new results, reactions, comments) updates
  live via Supabase Realtime subscriptions rather than requiring a manual
  refresh.

## Explicitly out of scope for v1
- No Twilio/SMS integration or automated group-chat reading (not
  technically feasible for free, or at all, for iMessage/SMS content)
- No push notifications (revisit later if requested)
- No category-name tracking for Connections (only color/order, since
  category names aren't in the share text and would require manual entry)
- No photo/media attachments on comments

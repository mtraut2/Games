# Games

A free, mobile-friendly family leaderboard for NYT Games (Wordle, Connections,
Strands). Paste your daily share text, it auto-parses your score, and the
family sees a live feed, daily winners, season standings, and per-person
stats. See [plans/nyt-leaderboard-spec.md](plans/nyt-leaderboard-spec.md) for
the full spec.

## Stack

Next.js (App Router) + Supabase (Postgres + Realtime) + Tailwind, deployed to
Vercel — all on free tiers, no paid APIs.

## One-time setup

You'll need to create your own free Supabase project and (for hosting)
Vercel account — this repo can't do that part for you.

1. **Create a Supabase project** at [supabase.com](https://supabase.com) (free tier).
2. **Run the migration**: open your project's SQL Editor and paste in the
   contents of [supabase/migrations/0001_init.sql](supabase/migrations/0001_init.sql), then run it.
   This creates the tables, a permissive RLS policy (there's no login system —
   anyone with the app link can read/write, matching the spec's shared-link
   trust model), and enables Realtime on the tables the Today feed watches.
3. **Get your API keys**: in the Supabase dashboard, go to
   Project Settings > API, and copy the "Project URL" and the "anon public" key.
4. **Configure the app**: copy `.env.local.example` to `.env.local` and fill
   in those two values:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
   ```

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The first visit prompts
you to pick your name (or add yourself) — this is remembered in
localStorage per device.

## Tests

Parsers, scoring/points, and streak/skip logic are unit tested (the riskiest,
least-obvious logic in the app):

```bash
npm test
```

## Deploying

1. Push this repo to GitHub.
2. Import it into [Vercel](https://vercel.com/new).
3. In the Vercel project's Environment Variables settings, add the same
   `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from your
   `.env.local`.
4. Deploy. Share the resulting URL with your family — no login needed.

## Installing as an app (PWA)

Once deployed, open the URL on a phone and use the browser's "Add to Home
Screen" option (Safari: Share > Add to Home Screen; Chrome: menu > Install
app). It launches full-screen, no browser chrome.

The current app icon is a placeholder (generated, not designed) — swap
`public/icons/icon-192.png`, `icon-512.png`, and `apple-touch-icon.png` for
real artwork whenever you like; the manifest already points at those paths.

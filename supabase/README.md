# AuraFit – Supabase backend

Schema, seed data and Edge Functions for the rebuilt app. The spec is `docs/04-database/` (schema,
v1 – workout v1.3) and `docs/03-design/` (AI strategy, quotas). Every table has RLS; scores, XP,
streaks and shields are **server-authoritative** (only the service role / Edge Functions write them).

```text
supabase/
├── config.toml                 CLI config (no secrets)
├── migrations/                 11 migrations, one+ per module, dependency order (last = backfill of existing auth users)
├── seed/
│   ├── build-seed.mjs          CSV + data/*.mjs → 01_catalog.sql, 02_exercises.sql, 03_program_templates.sql
│   ├── data/                   catalog.mjs (groups, 18 muscles, 37 heads, equipment, task templates, badges),
│   │                           program-templates.mjs (7 templates)
│   └── 0*_*.sql                GENERATED, idempotent (upsert / delete+insert)
├── functions/
│   ├── _shared/                cors, http, env, supabase (auth helpers), time, ai/ (AiProvider + Gemini),
│   │                           prompts/meal-analysis.ts
│   ├── analyze-meal/           photo → items, portions, 7 nutrients, confidence, ≤ 3 clarifying questions
│   ├── analyze-text/           text description → same shape
│   ├── close-day/              hourly cron: score each user's day at 03:00 local time
│   └── weekly-review/          weekly summary + adaptive TDEE (Sunday ≥ 20:00 local)
└── scripts/pglite-check/       offline SQL validation + Database type generator
```

## 1. Link a project

Requires the [Supabase CLI](https://supabase.com/docs/guides/cli) (Docker only for local `supabase start`).

```bash
supabase login
supabase link --project-ref <project-ref>      # region near VN, e.g. Singapore
```

## 2. Push migrations and seed

```bash
supabase db push                 # applies supabase/migrations/*
supabase db push --include-seed  # + seed/*.sql (config.toml [db.seed]); safe to re-run
```

Alternative for seed only: `psql "$SUPABASE_DB_URL" -f supabase/seed/01_catalog.sql -f supabase/seed/02_exercises.sql -f supabase/seed/03_program_templates.sql`.

After editing `docs/04-database/seed/exercises_v1.csv` or `seed/data/*.mjs`, regenerate:
`node supabase/seed/build-seed.mjs` (validates slugs, 37 heads, 7 templates).

Local stack: `supabase start` then `supabase db reset` (migrations + seed).

## 3. Secrets

`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` are injected automatically. Set the rest
(template: `functions/.env.example`):

```bash
supabase secrets set GEMINI_API_KEY=... AI_MODEL_FAST=gemini-flash-latest CRON_SECRET=$(openssl rand -hex 32)
# optional: AI_MODEL_STRONG, AI_DAILY_PHOTO_LIMIT (15), AI_DAILY_TEXT_LIMIT (50), AI_TIMEOUT_MS,
#           AI_PRICE_INPUT_PER_MTOK (0.5), AI_PRICE_OUTPUT_PER_MTOK (3), AI_PRICES_JSON, AI_PROVIDER (gemini)
```

Use a **paid** Gemini key before real users (launch-plan.md §4, D-047).

## 4. Deploy functions

```bash
supabase functions deploy analyze-meal
supabase functions deploy analyze-text
supabase functions deploy close-day
supabase functions deploy weekly-review
```

- Each function has a `deno.json` import map (`@supabase/supabase-js`, `zod`, `@aurafit/db`, and for
  close-day / weekly-review `@aurafit/core` → `../../../packages/core/src/index.ts`) with
  `"unstable": ["sloppy-imports"]` because the TS packages use extensionless imports.
- `verify_jwt` is set per function in `config.toml`: true for analyze-*, false for close-day /
  weekly-review (they check `CRON_SECRET` or a user JWT themselves).
- ⚠️ Not verified yet: bundling files outside `supabase/` (packages/core, packages/db). If the CLI
  refuses, deploy with `--use-api`, or vendor the packages into `functions/_shared/` with a copy step.

### Function contracts

| Function | Auth | Body | Response |
|---|---|---|---|
| `analyze-meal` | user JWT | `{ photo_path: "<uid>/<file>.jpg", meal_slot?, hint?, reanalyze? }` – photo already in bucket `meal-photos` (≤ 4 MB, ~1024 px) | `{ ai_request_id, model, analysis: { is_food, items[], overall_confidence, clarifying_questions[≤3]{ id, question, item_index, options[2–4]{ label, is_default, adjustment{kcal, protein_g, carb_g, fat_g, sugar_g} } }, notes }, totals, low_confidence, quota{used, limit} }`; 429 `quota_exceeded` |
| `analyze-text` | user JWT | `{ text, meal_slot? }` | same as above |
| `close-day` | `Bearer CRON_SECRET` | `{ now?, user_id?, max_backfill_days?, limit?, dry_run? }` | counts + per-day outcomes |
| `weekly-review` | user JWT → read-only summary + TDEE preview; `CRON_SECRET` → applies `weekly_adjust` targets | `{ now?, dry_run? }` | summary / results |

The app saves the confirmed meal itself (`meal_entries` + `meal_items` with `ai_request_id`);
clarifying answers are applied on the device (no second AI call, D-014). "Phân tích lại" =
`reanalyze: true` → `AI_MODEL_STRONG` if set. Quota = min(`AI_DAILY_PHOTO_LIMIT`,
`coach_settings.photo_quota_per_day`), counted from `ai_requests` (status `ok`) since local midnight.

## 5. Schedule close-day (pg_cron + pg_net + Vault)

The migration enables `pg_cron` / `pg_net` and creates `private.invoke_edge_function(name, body)`,
which reads two Vault secrets. Run once per environment in the SQL editor (values are NOT in git):

```sql
select vault.create_secret('https://<project-ref>.supabase.co', 'project_url');
select vault.create_secret('<same value as CRON_SECRET>', 'cron_secret');

select cron.schedule('close-day-hourly', '5 * * * *',
  $$ select private.invoke_edge_function('close-day', '{"source":"cron"}'::jsonb) $$);
select cron.schedule('weekly-review-hourly-sunday', '15 * * * 0,1',
  $$ select private.invoke_edge_function('weekly-review', '{"source":"cron"}'::jsonb) $$);
```

Why hourly: the day closes at **03:00 in each user's timezone** (gamification.md §3). Every run asks
`public.due_close_days()` which (user, date) pairs are due (backfills ≤ 3 days, never before
onboarding) and persists each with `public.apply_close_day()` – one transaction per day, idempotent.
Check runs: `select * from cron.job_run_details order by start_time desc limit 20;`
Manual run: `curl -X POST -H "Authorization: Bearer $CRON_SECRET" https://<ref>.supabase.co/functions/v1/close-day -d '{"dry_run":true}'`.

### Coach logic (`@aurafit/core`)

close-day has no scoring logic of its own; `close-day/coach-adapter.ts` only maps DB rows ↔ core:

- `buildCoachState`: `coach_state` (incl. `last_closed_date`, `last_streak_lost_date`, `last_monthly_gift`,
  `boss_wins`) + latest `boss_battles` row + `user_badges` + 37-day history rebuilt from
  `daily_scores.breakdown.record` → core `CoachState`.
- `buildCloseDayInput`: facts from `load.ts` → core `CloseDayInput` (`loggedFullDay` = ≥ 2 meals; safety
  floor via `nutrition.bmr` / `safetyFloorKcal`; `free_days.kind` is the free-day request; today's quests,
  quest facts, week plan, PRs of the day).
- `coach.closeDay(state, input)` → `toPayload` → `public.apply_close_day`: pillars after task
  redistribution, `breakdown` {record, detail, events, quests, xp_gained}, state, shield ledger, new badges,
  hard stats, completed quests, next day's quests (`coach.generateDailyQuests`), boss battle.
- weekly-review uses `health.adaptTdee` (+ `nutrition.safetyFloorKcal` for the new kcal target).
- Not wired yet (passed as unknown): hardcore "arm a shield" (`shieldArmed`, needs a column),
  `strengthTrendPct`, `bodyProgressScore`, `weightMilestone`, `beatLastSession`.

## 6. Database types

`packages/db` (`@aurafit/db`) exports `Database` in the exact `supabase gen types` shape, plus
`DbValues` (allowed values of every `text + check` column). With a linked project:

```bash
supabase gen types typescript --linked --schema public > packages/db/src/database.types.ts
```

Without a project (current state) the file is generated from the migrations by
`scripts/pglite-check/gen-types.mjs` (see §7). Typecheck: `npx tsc --noEmit -p packages/db/tsconfig.json`.

## 7. Validate without Supabase (PGlite)

```bash
cp -r supabase/scripts/pglite-check <scratch dir outside the repo> && cd <scratch dir>
npm init -y && npm i @electric-sql/pglite
node check.mjs <repo>/supabase --types <repo>/packages/db/src
```

It stubs `auth` (users, `uid()`, `role()`), `storage` (buckets, objects, `foldername()`) and the
`anon` / `authenticated` / `service_role` roles, skips pg_cron/pg_net, applies all migrations, the
seed twice (idempotency) and runs ~60 RLS/behaviour assertions (owner isolation, server-only
writes, friend meal visibility, invites, quotas columns, strictness weekly limit, close-day RPCs).

## 8. Security model (summary)

- RLS on every table, default deny; owner policies use `(select auth.uid())`.
- Server-only (owner read, write privileges revoked): `daily_scores`, `coach_state`,
  `shield_ledger`, `stat_snapshots`, `quests`, `boss_battles`, `user_badges`, `daily_summaries`,
  `ai_requests`, `personal_records`, `muscle_recovery`, `duo_streaks`; `nutrition_targets` accepts
  only `manual` rows from clients; `free_days` rows are requests (`quota` / `shield`) resolved by core at close (the shield is spent
  server-side) and become read-only once the day is closed; `coach_settings.photo_quota_per_day`
  is not client-updatable (column grants).
- Catalog (authenticated read-only): `exercises`, `muscle_groups`, `muscles`, `muscle_heads`,
  `equipment`, `exercise_*`, `program_template*`, `task_templates`, `badges`, `barcode_products`.
- Only cross-user exception: friends read `meal_entries` that are `is_shared` and from the owner's
  **today** (+ reactions on them). Friends see `public_profiles` / `public_coach_state` views only.
- Storage: `meal-photos`, `task-photos` private, folder `<user_id>/…`; `exercise-media` public read,
  service-role write.
- RPCs for clients: `find_user_by_username`, `redeem_invite`, `start_duo_streak`. Service-only:
  `due_close_days`, `apply_close_day`.

## 9. Deviations from `docs/04-database` (documented in CHANGELOG)

- Added: `task_templates` catalog; `exercises.home_friendly` (from CSV); `set_logs.distance_m`
  (distance exercises); `ai_requests.error`; private bucket `task-photos`; views
  `weekly_/monthly_/yearly_summaries`; RPCs above.
- `exercise_muscle_heads` seed: until `seed/exercise_muscle_heads_v1.csv` exists, every head of a
  region gets the region stimulus (primary 1.0, secondary 0.5) so the region view (max) is unchanged;
  chest heads use the coefficients from muscle-recovery.md §1b.
- Coach, to persist core state: `coach_state.last_closed_date / last_streak_lost_date / last_monthly_gift /
  boss_wins`, `quests.stat` + unique (user, date, code); `daily_scores` pillar columns hold core pillars
  after task redistribution (max 45/23/17/12/10/6); badge catalog = core `BADGES` (24 codes, i18n keys
  `badge.<code>.*`).
- Either side of a friendship may delete it (unfriend); a requester cannot delete a `blocked` row.
- For `measure = time` exercises, template `rep_min/rep_max` are seconds.
- `friendships` from invite links are created directly as `accepted`.

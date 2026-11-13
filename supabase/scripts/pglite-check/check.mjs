// Copy this folder OUTSIDE the repo, then:
//   npm init -y && npm i @electric-sql/pglite
//   node check.mjs <repo>/supabase [--types <repo>/packages/db/src]
// See supabase/README.md "Validate without Supabase".
// PGlite smoke test for AuraFit Supabase migrations + seed.
// Usage: node check.mjs <path-to-repo>/supabase [--types <out.ts>]
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { PGlite } from '@electric-sql/pglite';
import { citext } from '@electric-sql/pglite/contrib/citext';

const supabaseDir = process.argv[2];
const typesIdx = process.argv.indexOf('--types');
const typesOut = typesIdx > 0 ? process.argv[typesIdx + 1] : null;
if (!supabaseDir) { console.error('usage: node check.mjs <supabase dir> [--types out.ts]'); process.exit(2); }

const db = new PGlite({ extensions: { citext } });

const BOOTSTRAP = `
create role anon nologin noinherit;
create role authenticated nologin noinherit;
create role service_role nologin noinherit bypassrls;
create schema extensions;
create schema auth;
create schema storage;
grant usage on schema public, extensions to anon, authenticated, service_role;
grant usage on schema auth, storage to anon, authenticated, service_role;
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;

create table auth.users (
  id uuid primary key default gen_random_uuid(),
  email text,
  raw_user_meta_data jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);
create function auth.uid() returns uuid language sql stable as
  $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
create function auth.role() returns text language sql stable as
  $$ select nullif(current_setting('request.jwt.claim.role', true), '') $$;
create function auth.jwt() returns jsonb language sql stable as
  $$ select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;
grant execute on all functions in schema auth to anon, authenticated, service_role;

create table storage.buckets (
  id text primary key, name text not null, public boolean default false,
  file_size_limit bigint, allowed_mime_types text[], created_at timestamptz default now()
);
create table storage.objects (
  id uuid primary key default gen_random_uuid(), bucket_id text references storage.buckets(id),
  name text, owner uuid, created_at timestamptz default now()
);
alter table storage.objects enable row level security;
grant all on storage.objects, storage.buckets to anon, authenticated, service_role;
create function storage.foldername(name text) returns text[] language plpgsql as $$
declare _parts text[];
begin
  select string_to_array(name, '/') into _parts;
  return _parts[1:array_length(_parts, 1) - 1];
end $$;
`;

// Statements PGlite cannot run (Supabase-only extensions).
function preprocess(sql) {
  return sql
    .replace(/create extension if not exists pg_cron[^;]*;/gi, '-- [pglite] skipped pg_cron')
    .replace(/create extension if not exists pg_net[^;]*;/gi, '-- [pglite] skipped pg_net');
}

let failures = 0;
const ok = (msg) => console.log(`  ok   ${msg}`);
const bad = (msg) => { failures++; console.log(`  FAIL ${msg}`); };

async function applyDir(dir, label) {
  const files = readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();
  for (const f of files) {
    const sql = preprocess(readFileSync(join(dir, f), 'utf8'));
    try { await db.exec(sql); ok(`${label} ${f}`); }
    catch (e) {
      bad(`${label} ${f}: ${e.message}${e.position ? ` (pos ${e.position}: …${sql.slice(Math.max(0, e.position - 80), Number(e.position) + 20).replace(/\s+/g, ' ')}…)` : ''}`);
      try { await db.exec('rollback'); } catch { /* not in a transaction */ }
    }
  }
  return files.length;
}

async function as(uid, fn) {
  const role = uid ? 'authenticated' : 'anon';
  await db.exec(`reset role; select set_config('request.jwt.claim.sub', '${uid ?? ''}', false);
    select set_config('request.jwt.claim.role', '${role}', false); set role ${role};`);
  try { return await fn(); } finally { await db.exec(`reset role; select set_config('request.jwt.claim.sub', '', false); select set_config('request.jwt.claim.role', '', false);`); }
}
async function expectOk(label, fn) { try { const r = await fn(); ok(label); return r; } catch (e) { bad(`${label}: ${e.message}`); } }
async function expectErr(label, fn, re) {
  try { await fn(); bad(`${label}: expected error`); }
  catch (e) { if (!re || re.test(e.message)) ok(`${label} (rejected: ${e.message.slice(0, 70)})`); else bad(`${label}: wrong error ${e.message}`); }
}
const one = async (sql, p) => (await db.query(sql, p)).rows[0];
const count = async (sql, p) => Number(Object.values((await db.query(sql, p)).rows[0])[0]);

await db.exec(BOOTSTRAP);
// A user that exists before the migrations (like the 2 users of the real project) → backfill migration.
const PRE = 'dddddddd-0000-4000-8000-000000000004';
await db.exec(`insert into auth.users (id, email, raw_user_meta_data) values ('${PRE}', 'pre@x', '{"name":"Pre"}')`);
console.log('Migrations:');
await applyDir(join(supabaseDir, 'migrations'), 'migration');
const pre = await one(`select p.display_name, s.user_id is not null as settings, c.shields, c.last_monthly_gift, (select count(*) from public.shield_ledger l where l.user_id = p.user_id and l.reason = 'starter' and l.local_date is not null) as starter from public.profiles p join public.coach_settings s using (user_id) join public.coach_state c using (user_id) where p.user_id = $1`, [PRE]);
pre?.display_name === 'Pre' && pre.shields === 1 && /^[0-9]{4}-[0-9]{2}$/.test(pre.last_monthly_gift ?? '') && Number(pre.starter) === 1 ? ok('pre-existing auth user backfilled') : bad(`backfill ${JSON.stringify(pre)}`);
console.log('Seed:');
await applyDir(join(supabaseDir, 'seed'), 'seed');
console.log('Seed re-run (idempotency):');
await applyDir(join(supabaseDir, 'seed'), 'seed');

console.log('Catalog counts:');
for (const [t, n] of [['exercises', 90], ['muscle_groups', 9], ['muscles', 18], ['muscle_heads', 37], ['equipment', 9],
  ['program_templates', 7], ['task_templates', 6], ['badges', 24]]) {
  const c = await count(`select count(*) from public.${t}`);
  c === n ? ok(`${t} = ${c}`) : bad(`${t} = ${c}, expected ${n}`);
}
const emCount = await count('select count(*) from public.exercise_muscles');
emCount > 90 ? ok(`exercise_muscles view rows = ${emCount}`) : bad(`exercise_muscles rows ${emCount}`);
const pte = await count('select count(*) from public.program_template_exercises');
ok(`program_template_exercises = ${pte}`);

console.log('RLS coverage:');
const noRls = (await db.query(`select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity`)).rows;
noRls.length === 0 ? ok('all public tables have RLS enabled') : bad(`tables without RLS: ${noRls.map((r) => r.relname).join(', ')}`);
const tableCount = await count(`select count(*) from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname='public' and c.relkind='r'`);
ok(`public tables: ${tableCount}`);

console.log('Behaviour:');
const A = 'aaaaaaaa-0000-4000-8000-000000000001';
const B = 'bbbbbbbb-0000-4000-8000-000000000002';
const C = 'cccccccc-0000-4000-8000-000000000003';
await expectOk('create auth users (trigger → profile, settings, coach_state)', () => db.exec(`
  insert into auth.users (id, email, raw_user_meta_data) values
  ('${A}', 'a@x', '{"full_name":"Alice","locale":"en"}'), ('${B}', 'b@x', '{}'), ('${C}', 'c@x', '{}');`));
const st = await one(`select p.locale, p.display_name, s.photo_quota_per_day, c.shields,
  (select count(*) from public.shield_ledger l where l.user_id = p.user_id and reason = 'starter') as starter
  from public.profiles p join public.coach_settings s using (user_id) join public.coach_state c using (user_id) where p.user_id = $1`, [A]);
st?.locale === 'en' && st.display_name === 'Alice' && st.shields === 1 && Number(st.starter) === 1
  ? ok('new user rows created with starter shield') : bad(`new user rows: ${JSON.stringify(st)}`);

await as(A, () => expectOk('A updates own profile', () => db.exec(`update public.profiles set username='alice', timezone='Asia/Ho_Chi_Minh', "character"='mira', onboarding_completed_at = now() - interval '5 days' where user_id = '${A}'`)));
await as(A, () => expectErr('A sets invalid timezone', () => db.exec(`update public.profiles set timezone='Mars/Base' where user_id='${A}'`), /invalid timezone/));
await as(A, () => expectErr('A sets uppercase username', () => db.exec(`update public.profiles set username='Al ice' where user_id='${A}'`)));
const cn = await one(`select character_name from public.profiles where user_id=$1`, [A]);
cn?.character_name === 'Mira' ? ok('character_name defaults to Mira') : bad(`character_name ${JSON.stringify(cn)}`);
await as(B, async () => {
  const r = await count(`select count(*) from public.profiles`);
  r === 1 ? ok('B sees only own profile') : bad(`B sees ${r} profiles`);
});
await as(null, async () => {
  const r = await count(`select count(*) from public.profiles`);
  r === 0 ? ok('anon sees no profiles') : bad(`anon sees ${r} profiles`);
});

let mealId;
await as(A, async () => {
  mealId = (await expectOk('A inserts shared meal (local_date via trigger)', () => one(`insert into public.meal_entries (user_id, meal_slot, source, is_shared, photo_path)
    values ('${A}', 'lunch', 'photo', true, '${A}/m1.jpg') returning id, local_date`)))?.id;
  await expectOk('A inserts meal item', () => db.exec(`insert into public.meal_items (meal_entry_id, user_id, name, kcal, protein_g) values ('${mealId}', '${A}', 'Phở bò', 450, 25)`));
  await expectErr('A inserts meal with photo outside own folder', () => db.exec(`insert into public.meal_entries (user_id, meal_slot, source, photo_path) values ('${A}', 'lunch', 'photo', '${B}/x.jpg')`), /row-level security/);
  await expectErr('A inserts meal for B', () => db.exec(`insert into public.meal_entries (user_id, meal_slot, source) values ('${B}', 'lunch', 'text')`), /row-level security/);
  await expectErr('A writes daily_scores', () => db.exec(`insert into public.daily_scores (user_id, local_date, total, result, strictness) values ('${A}', current_date, 100, 'excellent', 'standard')`), /permission denied/);
  await expectErr('A updates coach_state xp', () => db.exec(`update public.coach_state set xp = 999999 where user_id='${A}'`), /permission denied/);
  await expectErr('A raises photo quota', () => db.exec(`update public.coach_settings set photo_quota_per_day = 99 where user_id='${A}'`), /permission denied/);
  await expectErr('A writes ai_requests', () => db.exec(`insert into public.ai_requests (user_id, kind, provider, model, status) values ('${A}', 'meal_image', 'x', 'y', 'ok')`), /permission denied/);
  await expectOk('A changes strictness', () => db.exec(`update public.coach_settings set strictness='hardcore' where user_id='${A}'`));
  await expectErr('A changes strictness twice in a week', () => db.exec(`update public.coach_settings set strictness='gentle' where user_id='${A}'`), /once per week/);
  await expectErr('A adds weekly_adjust target', () => db.exec(`insert into public.nutrition_targets (user_id, effective_from, kcal, protein_g, carb_g, fat_g, sugar_g, reason) values ('${A}', current_date, 2000, 150, 200, 60, 50, 'weekly_adjust')`), /row-level security/);
  await expectOk('A adds manual target', () => db.exec(`insert into public.nutrition_targets (user_id, effective_from, kcal, protein_g, carb_g, fat_g, sugar_g, reason) values ('${A}', current_date, 2000, 150, 200, 60, 50, 'manual')`));
  await expectOk('A requests shield free day (resolved by close-day)', () => db.exec(`insert into public.free_days (user_id, local_date, kind) values ('${A}', current_date + 2, 'shield')`));
  await expectOk('A adds quota free day', () => db.exec(`insert into public.free_days (user_id, local_date, kind, quoted_extra_kcal) values ('${A}', current_date + 1, 'quota', 1100)`));
  await expectErr('A creates 8 active tasks', () => db.exec(`insert into public.task_definitions (user_id, title, kind)
    select '${A}', 'Task ' || g, 'check' from generate_series(1, 8) g`), /at most 7/);
  await expectOk('A uploads photo to own folder', () => db.exec(`insert into storage.objects (bucket_id, name) values ('meal-photos', '${A}/p.jpg')`));
  await expectErr('A uploads photo to B folder', () => db.exec(`insert into storage.objects (bucket_id, name) values ('meal-photos', '${B}/p.jpg')`), /row-level security/);
  await expectErr('A writes exercises catalog', () => db.exec(`update public.exercises set name_en='x'`), /permission denied/);
  const ex = await count('select count(*) from public.exercises');
  ex === 90 ? ok('A reads 90 exercises') : bad(`A reads ${ex} exercises`);
});

await as(B, async () => {
  const r = await count(`select count(*) from public.meal_entries`);
  r === 0 ? ok('B (not friend) cannot see A meal') : bad(`B sees ${r} meals`);
  await expectOk('B sends friend request to A', () => db.exec(`insert into public.friendships (requester_id, addressee_id) values ('${B}', '${A}')`));
  await expectErr('B accepts own request', () => db.exec(`update public.friendships set status='accepted' where requester_id='${B}'`).then(async () => {
    if ((await count(`select count(*) from public.friendships where status='accepted'`)) === 0) throw new Error('no rows updated (RLS)');
  }), /no rows updated/);
});
await as(A, () => expectOk('A accepts B request', () => db.exec(`update public.friendships set status='accepted' where requester_id='${B}' and addressee_id='${A}'`)));
await as(B, async () => {
  const r = await count(`select count(*) from public.meal_entries`);
  r === 1 ? ok('B (friend) sees A shared meal today') : bad(`B sees ${r} meals`);
  const items = await count(`select count(*) from public.meal_items`);
  items === 0 ? ok('B cannot read A meal_items directly') : bad(`B reads ${items} meal_items`);
  await expectOk('B reacts to A meal', () => db.exec(`insert into public.meal_reactions (meal_entry_id, user_id, reaction) values ('${mealId}', '${B}', 'fire')`));
  const pc = await count(`select count(*) from public.public_coach_state`);
  pc === 2 ? ok('B sees self + A in public_coach_state') : bad(`public_coach_state rows ${pc}`);
  const pp = await count(`select count(*) from public.public_profiles`);
  pp === 2 ? ok('B sees self + A in public_profiles') : bad(`public_profiles rows ${pp}`);
  await expectErr('B updates public_coach_state', () => db.exec(`update public.public_coach_state set streak = 99`), /permission denied/);
  const f = await one(`select * from public.find_user_by_username('ALICE')`);
  f?.user_id === A ? ok('find_user_by_username (case-insensitive)') : bad(`find_user_by_username ${JSON.stringify(f)}`);
});
await as(A, async () => {
  const r = await count(`select count(*) from public.meal_reactions`);
  r === 1 ? ok('A (meal owner) sees reaction') : bad(`A sees ${r} reactions`);
});
await as(C, async () => {
  const r = await count(`select count(*) from public.meal_entries`);
  r === 0 ? ok('C (stranger) cannot see A meal') : bad(`C sees ${r}`);
  await expectErr('C reacts to A meal', () => db.exec(`insert into public.meal_reactions (meal_entry_id, user_id, reaction) values ('${mealId}', '${C}', 'heart')`), /row-level security/);
  const pc = await count(`select count(*) from public.public_coach_state`);
  pc === 1 ? ok('C sees only self in public_coach_state') : bad(`C public_coach_state rows ${pc}`);
});
let code;
await as(A, async () => { code = (await expectOk('A creates invite', () => one(`insert into public.invites (inviter_id) values ('${A}') returning code`)))?.code; });
await as(C, async () => {
  await expectOk(`C redeems invite ${code}`, () => one(`select public.redeem_invite('${code}') as id`));
  const r = await count(`select count(*) from public.meal_entries`);
  r === 1 ? ok('C (now friend) sees A shared meal') : bad(`C sees ${r}`);
  await expectOk('C starts duo streak with A', () => one(`select public.start_duo_streak('${A}') as id`));
  await expectErr('C calls apply_close_day', () => db.exec(`select public.apply_close_day('{}'::jsonb)`), /permission denied/);
});

console.log('Server functions (service role):');
await db.exec(`set role service_role`);
const due = (await db.query(`select * from public.due_close_days(now() + interval '1 day')`)).rows;
due.length > 0 && due.every((r) => r.user_id === A) ? ok(`due_close_days → ${due.length} day(s) for A`) : bad(`due_close_days ${JSON.stringify(due)}`);
const payload = {
  user_id: A, local_date: due[0]?.local_date?.toISOString?.().slice(0, 10) ?? due[0]?.local_date,
  summary: { kcal_in: 1900, protein_g: 120, water_ml: 2000, weight_kg: 70.2 },
  score: { nutrition_pts: 35, sleep_pts: 15, training_pts: 15, water_pts: 8, tasks_pts: 10, weight_pts: 5, penalty_pts: 0,
    total: 88, result: 'pass', strictness: 'standard', breakdown: { scale: 1 } },
  state: { xp: 88, level: 1, streak: 1, best_streak: 1, shields: 1, shield_fragments: 0, aura_score: 88, aura_tier: 'gold', mood: 'neutral', last_streak_lost_date: null, last_monthly_gift: '2026-11', boss_wins: 0 },
  ledger: [{ delta_shields: 0, delta_fragments: 1, reason: 'excellent_day', local_date: null }], badges: ['first_excellent_day', 'nope'], stats: [{ stat: 'water', value: 80 }],
  quests_completed: [], quests_next: [{ local_date: '2099-01-01', code: 'log_all_meals', stat: 'diet_discipline', params: {}, xp_reward: 15 }],
  boss: { week_start: '2026-11-09', boss_code: 'sugar_demon', hits_required: 5, hits: 1, won_on: null, reward: { shieldFragments: 1, accessoryCode: 'accessory_sugar_demon', badgeCode: 'boss_sugar_demon', won_on: null } },
};
const r1 = await one(`select public.apply_close_day($1::jsonb) as applied`, [JSON.stringify(payload)]);
const r2 = await one(`select public.apply_close_day($1::jsonb) as applied`, [JSON.stringify(payload)]);
r1?.applied === true && r2?.applied === false ? ok('apply_close_day applies once (idempotent)') : bad(`apply_close_day ${JSON.stringify([r1, r2])}`);
const cs = await one(`select xp, streak, aura_tier, last_closed_date, last_monthly_gift from public.coach_state where user_id = $1`, [A]);
Number(cs?.xp) === 88 && cs.aura_tier === 'gold' && cs.last_closed_date && cs.last_monthly_gift === '2026-11' ? ok('coach_state updated') : bad(`coach_state ${JSON.stringify(cs)}`);
const extra = await one(`select (select count(*) from public.quests where user_id = $1) as q, (select count(*) from public.boss_battles where user_id = $1) as b, (select count(*) from public.shield_ledger where user_id = $1 and local_date is not null) as l`, [A]);
Number(extra?.q) === 1 && Number(extra?.b) === 1 && Number(extra?.l) === 2 ? ok('quests_next, boss and ledger persisted') : bad(`extra ${JSON.stringify(extra)}`);
const ub = await count(`select count(*) from public.user_badges where user_id = $1`, [A]);
ub === 1 ? ok('unknown badge codes ignored') : bad(`user_badges ${ub}`);
await db.exec(`reset role`);
await as(A, async () => {
  const ds = await count(`select count(*) from public.daily_scores`);
  ds === 1 ? ok('A reads own daily score') : bad(`A daily_scores ${ds}`);
  const ws = await count(`select count(*) from public.weekly_summaries`);
  ws === 1 ? ok('weekly_summaries view (security_invoker) works') : bad(`weekly_summaries ${ws}`);
});
await as(B, async () => {
  const ds = await count(`select count(*) from public.daily_scores`);
  ds === 0 ? ok('B cannot read A daily score') : bad(`B daily_scores ${ds}`);
});

// ----------------------------------------------------------------- types
if (typesOut) {
  const { generateTypes } = await import('./gen-types.mjs');
  const { types, values } = await generateTypes(db);
  const banner = '// GENERATED from supabase/migrations by supabase/scripts/pglite-check (same shape as\n'
    + '// `supabase gen types typescript`). Regenerate with `supabase gen types typescript --linked`\n'
    + '// once a project exists. Do not edit by hand.\n\n';
  writeFileSync(join(typesOut, 'database.types.ts'), banner + types);
  const lines = Object.entries(values).map(([t, colsMap]) => `  ${t}: {\n${Object.entries(colsMap)
    .map(([c, v]) => `    ${/^[a-z_][a-z0-9_]*$/.test(c) ? c : JSON.stringify(c)}: [${v.map((x) => `'${x}'`).join(', ')}],`).join('\n')}\n  },`);
  writeFileSync(join(typesOut, 'values.ts'), `${banner.replace('(same shape as\n// `supabase gen types typescript`)', '').replace('Regenerate with `supabase gen types typescript --linked`\n// once a project exists. ', '')}`
    + '/** Allowed values of `text` columns constrained by CHECK (col IN (...)) – the DB uses text + check instead of enums. */\n'
    + `export const DbValues = {\n${lines.join('\n')}\n} as const;\n\n`
    + 'export type DbValue<\n  T extends keyof typeof DbValues,\n  C extends keyof (typeof DbValues)[T],\n> = (typeof DbValues)[T][C] extends readonly (infer V)[] ? V : never;\n');
  console.log(`Types written to ${typesOut}`);
}

console.log(failures === 0 ? '\nALL CHECKS PASSED' : `\n${failures} FAILURE(S)`);
process.exit(failures === 0 ? 0 : 1);

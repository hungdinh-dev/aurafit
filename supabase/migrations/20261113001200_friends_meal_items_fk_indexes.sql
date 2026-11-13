-- =============================================================================
-- Follow-up after applying v1.3 to the real project (Supabase advisors + app gap)
-- 1. Friends can read the dishes (meal_items) of a meal shared today (FRD-02 story).
-- 2. meal_entries: merge the two permissive SELECT policies into one (perf advisor 0006).
-- 3. Covering indexes for foreign keys flagged by advisor 0001.
-- =============================================================================

-- 1 + 2 -----------------------------------------------------------------------
drop policy if exists meal_entries_owner_select on public.meal_entries;
drop policy if exists meal_entries_friends_select on public.meal_entries;

create policy meal_entries_select on public.meal_entries
  for select to authenticated
  using (user_id = (select auth.uid())
         or (is_shared
             and local_date = private.user_today(user_id)
             and private.are_friends((select auth.uid()), user_id)));

create policy meal_items_friends_select on public.meal_items
  for select to authenticated
  using (exists (select 1 from public.meal_entries me
                 where me.id = meal_entry_id
                   and me.user_id <> (select auth.uid())
                   and me.is_shared
                   and me.local_date = private.user_today(me.user_id)
                   and private.are_friends((select auth.uid()), me.user_id)));

-- 3 ---------------------------------------------------------------------------
create index if not exists focus_sessions_task_idx on public.focus_sessions (task_id);
create index if not exists meal_entries_ai_request_idx on public.meal_entries (ai_request_id);
create index if not exists meal_items_saved_food_idx on public.meal_items (saved_food_id);
create index if not exists meal_reactions_user_idx on public.meal_reactions (user_id);
create index if not exists muscle_recovery_head_idx on public.muscle_recovery (head_code);
create index if not exists muscle_volume_targets_muscle_idx on public.muscle_volume_targets (muscle_code);
create index if not exists muscles_group_idx on public.muscles (group_code);
create index if not exists personal_records_exercise_idx on public.personal_records (exercise_id);
create index if not exists personal_records_set_log_idx on public.personal_records (set_log_id);
create index if not exists planned_exercises_backup_idx on public.planned_exercises (backup_exercise_id);
create index if not exists planned_exercises_exercise_idx on public.planned_exercises (exercise_id);
create index if not exists planned_sessions_equipment_profile_idx on public.planned_sessions (equipment_profile_id);
create index if not exists program_template_exercises_backup_idx on public.program_template_exercises (backup_exercise_id);
create index if not exists program_template_exercises_exercise_idx on public.program_template_exercises (exercise_id);
create index if not exists set_logs_exercise_idx on public.set_logs (exercise_id);
create index if not exists task_definitions_template_idx on public.task_definitions (template_code);
create index if not exists user_badges_badge_idx on public.user_badges (badge_code);
create index if not exists workout_sessions_equipment_profile_idx on public.workout_sessions (equipment_profile_id);
create index if not exists workout_sessions_planned_session_idx on public.workout_sessions (planned_session_id);

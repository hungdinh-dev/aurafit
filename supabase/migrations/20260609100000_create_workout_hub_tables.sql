-- Migration: Create Workout Hub tables and seed initial exercise/plan data

-- 1. Create Exercises table
create table public.exercises (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  primary_muscle text not null,
  secondary_muscles text[] default '{}'::text[] not null,
  equipment text not null,
  instructions text,
  image_url text,
  default_reps_min integer default 8 not null,
  default_reps_max integer default 12 not null,
  xp_per_set integer default 10 not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for Exercises
alter table public.exercises enable row level security;

-- Setup RLS Policies for Exercises (Public read, Admin modify)
create policy "Allow public read access to exercises" on public.exercises
  for select using (true);

-- 2. Create Workout Plans table
create table public.workout_plans (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade, -- null means system default plan
  name text not null,
  description text,
  day_of_week integer check (day_of_week between 1 and 7), -- 1: Mon, 2: Tue, ..., 7: Sun
  difficulty text default 'Beginner' not null, -- Beginner, Intermediate, Advanced
  created_by text default 'system'::text not null, -- 'system' or 'user'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for Workout Plans
alter table public.workout_plans enable row level security;

-- Setup RLS Policies for Workout Plans
create policy "Allow users to view public plans and their own plans" on public.workout_plans
  for select using (user_id is null or user_id = auth.uid());

create policy "Allow users to insert their own plans" on public.workout_plans
  for insert with check (user_id = auth.uid());

create policy "Allow users to update their own plans" on public.workout_plans
  for update using (user_id = auth.uid());

create policy "Allow users to delete their own plans" on public.workout_plans
  for delete using (user_id = auth.uid());

-- 3. Create Workout Plan Exercises table
create table public.workout_plan_exercises (
  id uuid default gen_random_uuid() primary key,
  plan_id uuid references public.workout_plans(id) on delete cascade not null,
  exercise_id uuid references public.exercises(id) on delete cascade not null,
  sequence_order integer not null,
  default_sets integer default 3 not null,
  default_reps_min integer default 8 not null,
  default_reps_max integer default 12 not null,
  default_weight_ratio numeric(3,2) default 0.30 not null
);

-- Enable RLS for Workout Plan Exercises
alter table public.workout_plan_exercises enable row level security;

-- Setup RLS Policies for Workout Plan Exercises
create policy "Allow users to view exercises in plans they have access to" on public.workout_plan_exercises
  for select using (
    exists (
      select 1 from public.workout_plans
      where workout_plans.id = workout_plan_exercises.plan_id
      and (workout_plans.user_id is null or workout_plans.user_id = auth.uid())
    )
  );

create policy "Allow users to manage exercises in their own plans" on public.workout_plan_exercises
  for all using (
    exists (
      select 1 from public.workout_plans
      where workout_plans.id = workout_plan_exercises.plan_id
      and workout_plans.user_id = auth.uid()
    )
  );

-- 4. Extend public.workouts (Workout Session Logs) with plan_id
alter table public.workouts 
  add column if not exists plan_id uuid references public.workout_plans(id) on delete set null;

-- 5. Create Exercise Set Logs table
create table public.exercise_set_logs (
  id uuid default gen_random_uuid() primary key,
  workout_id uuid references public.workouts(id) on delete cascade not null,
  exercise_id uuid references public.exercises(id) on delete cascade not null,
  set_number integer not null,
  weight_kg numeric(5,2) not null,
  reps_completed integer not null,
  is_completed boolean default true not null,
  xp_gained integer default 10 not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for Exercise Set Logs
alter table public.exercise_set_logs enable row level security;

-- Setup RLS Policies for Exercise Set Logs
create policy "Allow users to view their own set logs" on public.exercise_set_logs
  for select using (
    exists (
      select 1 from public.workouts
      where workouts.id = exercise_set_logs.workout_id
      and workouts.user_id = auth.uid()
    )
  );

create policy "Allow users to manage their own set logs" on public.exercise_set_logs
  for all using (
    exists (
      select 1 from public.workouts
      where workouts.id = exercise_set_logs.workout_id
      and workouts.user_id = auth.uid()
    )
  );

-- ==========================================
-- SEED DATA: Seed Exercises
-- ==========================================

insert into public.exercises (name, primary_muscle, secondary_muscles, equipment, instructions, default_reps_min, default_reps_max, xp_per_set) values
('Bench Press (Đẩy Ngực Ngang)', 'Chest', '{"Triceps", "Front Shoulders"}'::text[], 'Barbell', 'Nằm trên ghế phẳng, hai tay nắm tạ rộng hơn vai. Hạ tạ xuống chạm nhẹ ngực giữa rồi đẩy mạnh tạ lên thẳng tay.', 8, 12, 10),
('Lat Pulldown (Kéo Xô Cáp)', 'Lats', '{"Biceps", "Upper Back"}'::text[], 'Cable', 'Ngồi vào máy, hai tay nắm thanh xà rộng hơn vai. Ưỡn ngực, kéo thanh xà xuống sát ngực trên bằng cơ lưng rồi từ từ đưa lên.', 8, 12, 10),
('Barbell Squat (Gánh Đùi Tạ Đòn)', 'Quads', '{"Glutes", "Hamstrings", "Core"}'::text[], 'Barbell', 'Đặt tạ đòn lên cơ cầu vai. Đứng thẳng chân rộng bằng vai, hạ thấp mông xuống dưới góc 90 độ rồi đẩy người đứng dậy.', 8, 12, 12),
('Dumbbell Bicep Curl (Cuốn Tay Trước)', 'Biceps', '{"Forearms"}'::text[], 'Dumbbell', 'Đứng thẳng nắm tạ đơn hướng vào đùi. Co khuỷu tay nâng tạ lên xoay lòng bàn tay hướng lên trên, siết chặt cơ bắp tay trước.', 10, 15, 8),
('Tricep Pushdown (Kéo Cáp Tay Sau)', 'Triceps', '{}'::text[], 'Cable', 'Đứng đối diện cáp kéo nắm tay cầm chữ V hoặc dây thừng. Giữ cố định khuỷu tay sát thân, đẩy cáp xuống dưới thẳng tay.', 10, 15, 8),
('Shoulder Press (Đẩy Vai Tạ Đơn)', 'Shoulders', '{"Triceps"}'::text[], 'Dumbbell', 'Ngồi thẳng lưng trên ghế, nâng hai quả tạ đơn lên ngang tai. Đẩy thẳng tạ lên trên đầu cho đến khi thẳng tay rồi hạ xuống.', 8, 12, 10),
('Leg Press (Đạp Đùi Bằng Máy)', 'Quads', '{"Glutes", "Calves"}'::text[], 'Machine', 'Đặt hai bàn chân rộng bằng vai lên bàn đạp. Mở khóa an toàn, hạ thấp đùi vuông góc rồi đạp mạnh bàn đạp đẩy thẳng chân.', 8, 12, 10),
('Lateral Raise (Dang Tạ Đơn Vai Bên)', 'Shoulders', '{}'::text[], 'Dumbbell', 'Đứng thẳng nắm hai tạ đơn ở hông. Dang thẳng hai cánh tay sang hai bên cho đến khi ngang vai rồi hạ xuống chậm rãi.', 12, 15, 8),
('Deadlift (Kéo Lưng Đùi Sau)', 'Hamstrings', '{"Lower Back", "Glutes", "Lats"}'::text[], 'Barbell', 'Đứng sát thanh tạ đòn dưới sàn. Cúi người thẳng lưng nắm tạ, siết mông đẩy đùi kéo tạ đứng thẳng dậy sát chân.', 5, 8, 15),
('Cable Row (Kéo Cáp Lưng Giữa)', 'Back', '{"Biceps", "Rear Shoulders"}'::text[], 'Cable', 'Ngồi vào máy kéo cáp, đặt chân lên điểm tựa. Kéo tay cầm cáp sát vào bụng dưới, khép bả vai lại và giữ cơ lưng siết chặt.', 8, 12, 10),
('Leg Curl (Móc Đùi Sau)', 'Hamstrings', '{}'::text[], 'Machine', 'Nằm sấp trên máy, đặt gót chân dưới đệm cuộn. Co gối kéo đệm cuộn sát vào mông rồi duỗi ra từ từ.', 10, 12, 8),
('Incline Bench Press (Đẩy Ngực Dốc Lên)', 'Chest', '{"Front Shoulders", "Triceps"}'::text[], 'Barbell', 'Nằm trên ghế dốc lên 30-45 độ. Hạ tạ đòn chạm nhẹ ngực trên rồi đẩy tạ lên thẳng đứng.', 8, 12, 10),
('Hanging Leg Raise (Đu Xà Nhấc Chân)', 'Abs', '{"Hip Flexors"}'::text[], 'Bodyweight', 'Hai tay đu bám trên thanh xà đơn. Giữ thẳng chân nâng cao đùi hoặc gối lên góc vuông với thân rồi hạ xuống chậm rãi.', 12, 15, 8);


-- ==========================================
-- SEED DATA: Seed Workout Plans (Lộ trình tuần)
-- ==========================================

-- Ta dùng các câu lệnh chèn và lưu lại ID cho bước tiếp theo
do $$
declare
  plan_monday_id uuid;
  plan_wednesday_id uuid;
  plan_friday_id uuid;
  ex_bench_press_id uuid;
  ex_lat_pulldown_id uuid;
  ex_squat_id uuid;
  ex_curl_id uuid;
  ex_tricep_id uuid;
  ex_shoulder_id uuid;
  ex_leg_press_id uuid;
  ex_lateral_id uuid;
  ex_row_id uuid;
  ex_curl_ham_id uuid;
  ex_abs_id uuid;
begin
  -- Lấy IDs của các bài tập tương ứng
  select id into ex_bench_press_id from public.exercises where name = 'Bench Press (Đẩy Ngực Ngang)';
  select id into ex_lat_pulldown_id from public.exercises where name = 'Lat Pulldown (Kéo Xô Cáp)';
  select id into ex_squat_id from public.exercises where name = 'Barbell Squat (Gánh Đùi Tạ Đòn)';
  select id into ex_curl_id from public.exercises where name = 'Dumbbell Bicep Curl (Cuốn Tay Trước)';
  select id into ex_tricep_id from public.exercises where name = 'Tricep Pushdown (Kéo Cáp Tay Sau)';
  select id into ex_shoulder_id from public.exercises where name = 'Shoulder Press (Đẩy Vai Tạ Đơn)';
  select id into ex_leg_press_id from public.exercises where name = 'Leg Press (Đạp Đùi Bằng Máy)';
  select id into ex_lateral_id from public.exercises where name = 'Lateral Raise (Dang Tạ Đơn Vai Bên)';
  select id into ex_row_id from public.exercises where name = 'Cable Row (Kéo Cáp Lưng Giữa)';
  select id into ex_curl_ham_id from public.exercises where name = 'Leg Curl (Móc Đùi Sau)';
  select id into ex_abs_id from public.exercises where name = 'Hanging Leg Raise (Đu Xà Nhấc Chân)';

  -- 1. Chèn giáo án Thứ Hai: Kéo (Pull)
  insert into public.workout_plans (name, description, day_of_week, difficulty, created_by)
  values (
    'Thứ Hai - Lộ Trình KÉO (Pull day)', 
    'Tập trung phát triển cơ lưng xô vững chãi và bắp tay trước khỏe khoắn. Thích hợp khởi đầu tuần mới.', 
    1, 
    'Beginner', 
    'system'
  ) returning id into plan_monday_id;

  -- Gán các bài tập cho Thứ Hai
  insert into public.workout_plan_exercises (plan_id, exercise_id, sequence_order, default_sets, default_reps_min, default_reps_max, default_weight_ratio)
  values 
  (plan_monday_id, ex_lat_pulldown_id, 1, 3, 8, 12, 0.40), -- 40% trọng lượng cơ thể
  (plan_monday_id, ex_row_id, 2, 3, 8, 12, 0.40),
  (plan_monday_id, ex_curl_id, 3, 3, 10, 12, 0.15); -- 15% trọng lượng cơ thể cho tạ đơn mỗi bên

  -- 2. Chèn giáo án Thứ Tư: Đẩy (Push day)
  insert into public.workout_plans (name, description, day_of_week, difficulty, created_by)
  values (
    'Thứ Tư - Lộ Trình ĐẨY (Push day)', 
    'Tập trung phát triển cơ ngực săn chắc, cơ vai khỏe mạnh và cơ tay sau bền bỉ.', 
    3, 
    'Beginner', 
    'system'
  ) returning id into plan_wednesday_id;

  -- Gán các bài tập cho Thứ Tư
  insert into public.workout_plan_exercises (plan_id, exercise_id, sequence_order, default_sets, default_reps_min, default_reps_max, default_weight_ratio)
  values 
  (plan_wednesday_id, ex_bench_press_id, 1, 4, 8, 12, 0.50), -- 50% trọng lượng cơ thể
  (plan_wednesday_id, ex_shoulder_id, 2, 3, 8, 12, 0.25), -- 25% trọng lượng cơ thể
  (plan_wednesday_id, ex_tricep_id, 3, 3, 10, 12, 0.20),
  (plan_wednesday_id, ex_lateral_id, 4, 3, 12, 15, 0.08);

  -- 3. Chèn giáo án Thứ Sáu: Chân & Bụng (Legs & Abs day)
  insert into public.workout_plans (name, description, day_of_week, difficulty, created_by)
  values (
    'Thứ Sáu - Lộ Trình CHÂN & BỤNG (Legs & Abs)', 
    'Tập trung xây dựng nhóm cơ thân dưới mạnh mẽ và cơ bụng săn chắc thon gọn.', 
    5, 
    'Beginner', 
    'system'
  ) returning id into plan_friday_id;

  -- Gán các bài tập cho Thứ Sáu
  insert into public.workout_plan_exercises (plan_id, exercise_id, sequence_order, default_sets, default_reps_min, default_reps_max, default_weight_ratio)
  values 
  (plan_friday_id, ex_squat_id, 1, 4, 8, 12, 0.60), -- 60% trọng lượng cơ thể
  (plan_friday_id, ex_leg_press_id, 2, 3, 8, 12, 1.00), -- 100% trọng lượng cơ thể
  (plan_friday_id, ex_curl_ham_id, 3, 3, 10, 12, 0.25),
  (plan_friday_id, ex_abs_id, 4, 3, 12, 15, 0.00); -- Khối lượng tạ 0 (bodyweight)

end $$;

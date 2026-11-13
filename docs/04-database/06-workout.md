# DB – Tập luyện

**Phiên bản hiện tại:** v1.3 (thiết kế, chưa migrate) · **Chức năng:** WRK-01 → WRK-20 · **Mốc:** M5

## Lịch sử phiên bản

| Phiên bản | Ngày | Migration | Thay đổi |
|---|---|---|---|
| v1.3 | 2026-11-13 | `…_workout_beta_extras.sql`, `…_workout_seed_templates.sql` (M5) | Bổ sung cho WRK-13 → WRK-20 (D-048): ngưỡng khối lượng, RIR, lịch xoay vòng, thời gian nghỉ mặc định, bài dự phòng, kho dụng cụ phòng gym, tải đặc biệt, giáo án mẫu. Xem §6 |
| v1.2 | 2026-11-13 | `…_workout_muscle_heads.sql` (M5) | Thêm cấp **phần cơ**: bảng `muscle_heads` (37 phần) và `exercise_muscle_heads`. `muscle_recovery` chuyển khoá sang `head_code`. `exercise_muscles` thành **view** tổng hợp từ cấp phần cơ |
| v1.1 | 2026-11-13 | `…_workout_library.sql`, `…_workout_seed_library.sql`, `…_workout_recovery.sql` (M5) | Thêm nhóm cơ, cơ chi tiết, dụng cụ, bảng nối bài tập – cơ / dụng cụ, media có giấy phép, cache hồi phục cơ. Bỏ cột `primary_muscle`, `secondary_muscles`, `equipment` dạng text trong `exercises` (thay bằng bảng nối) |
| v1 | 2026-11-13 | – | Thiết kế đầu tiên |

## 1. Danh mục (dùng chung, chỉ đọc)

### `muscle_groups` – 9 nhóm cơ của thư viện (D-042)

| `code` | `name_vi` | `name_en` |
|---|---|---|
| `chest` | Ngực | Chest |
| `back` | Lưng | Back |
| `shoulders` | Vai | Shoulders |
| `biceps` | Tay trước | Biceps |
| `triceps` | Tay sau | Triceps |
| `forearms` | Cẳng tay | Forearms |
| `abs` | Bụng | Abs |
| `glutes` | Mông | Glutes |
| `legs` | Chân | Legs |

Cột: `code` PK, `name_vi`, `name_en`, `sort_order`.

### `muscles` – 18 cơ chi tiết cho bản đồ hồi phục

| `code` | Tên | Nhóm | Mặt | Cỡ | Hồi phục cơ bản |
|---|---|---|---|---|---|
| `chest` | Ngực | chest | trước | lớn | 72 giờ |
| `front_delts` | Vai trước | shoulders | trước | vừa | 48 giờ |
| `side_delts` | Vai giữa | shoulders | cả hai | vừa | 48 giờ |
| `rear_delts` | Vai sau | shoulders | sau | vừa | 48 giờ |
| `biceps` | Tay trước | biceps | trước | nhỏ | 48 giờ |
| `triceps` | Tay sau | triceps | sau | nhỏ | 48 giờ |
| `forearms` | Cẳng tay | forearms | cả hai | nhỏ | 36 giờ |
| `abs` | Bụng | abs | trước | nhỏ | 36 giờ |
| `obliques` | Bụng chéo | abs | trước | nhỏ | 36 giờ |
| `traps` | Cơ thang | back | sau | vừa | 48 giờ |
| `lats` | Xô | back | sau | lớn | 72 giờ |
| `upper_back` | Lưng giữa | back | sau | lớn | 60 giờ |
| `lower_back` | Lưng dưới | back | sau | lớn | 72 giờ |
| `glutes` | Mông | glutes | sau | lớn | 72 giờ |
| `quads` | Đùi trước | legs | trước | lớn | 72 giờ |
| `hamstrings` | Đùi sau | legs | sau | lớn | 72 giờ |
| `adductors` | Đùi trong | legs | trước | vừa | 48 giờ |
| `calves` | Bắp chân | legs | sau | nhỏ | 48 giờ |

Cột: `code` PK, `group_code` FK, `name_vi`, `name_en`, `view` (`front` \| `back` \| `both`), `size` (`large` \| `medium` \| `small`), `base_recovery_hours`.

### `equipment` – 9 loại dụng cụ (D-042)

`barbell` (Tạ đòn) · `dumbbell` (Tạ đơn) · `cable` (Cáp) · `machine` (Máy) · `smith_machine` (Máy Smith) · `bodyweight` (Trọng lượng cơ thể) · `pullup_bar` (Xà đơn) · `band` (Dây kháng lực) · `kettlebell` (Tạ ấm).

Cột: `code` PK, `name_vi`, `name_en`, `home_friendly bool`, `sort_order`.

### `exercises`

| Cột | Kiểu | Ghi chú |
|---|---|---|
| `id` | uuid PK | |
| `slug` | text unique | `barbell_bench_press` |
| `name_vi`, `name_en` | text | |
| `group_code` | text FK `muscle_groups` | Nhóm hiển thị trong thư viện |
| `category` | text | `strength` \| `warmup` \| `mobility` |
| `mechanic` | text | `compound` \| `isolation` |
| `level` | text | `beginner` \| `intermediate` \| `advanced` |
| `movement_pattern` | text | `push_h` \| `push_v` \| `pull_h` \| `pull_v` \| `squat` \| `hinge` \| `lunge` \| `core` \| `carry` – dùng để đổi bài tương đương |
| `measure` | text | `reps` \| `time` \| `distance` |
| `progression_group`, `progression_level`, `unlock_criteria` | | Chuỗi bậc calisthenics |
| `default_rep_min`, `default_rep_max` | smallint | |
| `load_step_kg` | numeric(4,2) | Bước tăng tạ nhỏ nhất |
| `steps_vi`, `steps_en` | text[] | Hướng dẫn từng bước – **AuraFit tự viết** |
| `tips_vi`, `tips_en` | text[] | Lỗi hay gặp |
| `is_published` | bool | |

### `muscle_heads` – 37 phần cơ (v1.2, D-044)

| Cột | Kiểu | Ghi chú |
|---|---|---|
| `code` | text PK | `chest_upper`, `chest_middle`, `chest_lower`, `triceps_long`… |
| `muscle_code` | text FK `muscles` | Vùng chứa phần này |
| `name_vi`, `name_en` | text | "Ngực trên" |
| `base_recovery_hours` | smallint null | null = dùng giá trị của vùng |
| `sort_order` | smallint | Thứ tự hiển thị trong sheet chi tiết |

Danh sách đầy đủ 37 phần: `02-features/muscle-recovery.md` §1b.

### `exercise_muscle_heads` – bài tập nhấn vào phần cơ nào (v1.2)

PK (`exercise_id`, `head_code`).
- `stimulus` numeric(3,2): 0–1, ví dụ đẩy ngực dốc lên: ngực trên 1,0 · ngực giữa 0,6 · ngực dưới 0,2.
- `role`: `primary` \| `secondary` – để hiển thị chip cơ chính / cơ phụ.

### `exercise_muscles` – view cấp vùng (v1.2)

**View**, không còn là bảng. Lấy từ `exercise_muscle_heads`: mỗi vùng nhận mức kích thích cao nhất trong các phần của nó. Thư viện bài tập và màn chi tiết đọc view này.

### `exercise_equipment` – lọc "Bài tập theo dụng cụ"

PK (`exercise_id`, `equipment_code`). Một bài có thể có nhiều dụng cụ (ví dụ ghế + tạ đơn).

### `exercise_media` – GIF / video hướng dẫn (D-041)

| Cột | Kiểu | Ghi chú |
|---|---|---|
| `id` | uuid PK | |
| `exercise_id` | uuid FK cascade | |
| `kind` | text | `gif` \| `mp4` \| `webp` \| `image` |
| `storage_path` | text | File lưu trong Supabase Storage (bucket `exercise-media`), **không link thẳng sang web khác** |
| `width`, `height`, `duration_ms` | int | |
| `variant` | text | `default` \| `kai` \| `mira` (sau này có bản nhân vật) |
| `source` | text | `own` \| `licensed` \| `open_license` |
| `provider` | text | Tên nhà cung cấp |
| `license` | text | Tên / mã giấy phép |
| `attribution` | text null | Dòng ghi công nếu giấy phép yêu cầu |
| `is_primary` | bool | |

**Không có dòng nào được thêm nếu chưa ghi rõ `source` và `license`.**

## 2. Dữ liệu người dùng

### `equipment_profiles`

`id`, `user_id`, `name`, `kind` (`gym` \| `home` \| `bodyweight`), `equipment_codes text[]` (mã trong `equipment`), `is_default`, `created_at`.

### `programs`

`id`, `user_id`, `goal_type`, `split` (`full_body` \| `upper_lower` \| `ppl`), `days_per_week`, `session_minutes`, `total_weeks`, `started_on`, `status` (`active` \| `completed` \| `archived`), `generator_version`, `created_at`.

### `planned_sessions`

`id`, `program_id` FK cascade, `user_id`, `week_no`, `day_of_week`, `name`, `is_deload`, `equipment_profile_id` FK null.

### `planned_exercises`

`id`, `planned_session_id` FK cascade, `exercise_id` FK, `sort_order`, `sets`, `rep_min`, `rep_max`, `target_load_kg`, `rest_sec`, `is_extra`.

### `workout_sessions`

`id`, `user_id`, `planned_session_id` FK null, `equipment_profile_id` FK null, `local_date`, `started_at`, `ended_at`, `readiness`, `readiness_applied`, `status` (`in_progress` \| `completed` \| `cancelled`), `feeling`.

### `set_logs`

`id`, `session_id` FK cascade, `user_id`, `exercise_id` FK, `set_no`, `load_kg`, `reps`, `duration_sec`, `rpe`, `is_warmup`, `completed_at`.

### `personal_records`

`id`, `user_id`, `exercise_id`, `kind` (`max_load` \| `est_1rm` \| `max_reps` \| `max_time` \| `progression_level`), `value`, `set_log_id`, `achieved_at`. Server ghi.

### `muscle_recovery` – cache hồi phục theo phần cơ (chỉ server ghi)

| Cột | Kiểu | Ghi chú |
|---|---|---|
| `user_id`, `head_code` | | PK (v1.2: đổi từ `muscle_code` sang `head_code`) |
| `fatigue` | numeric(5,2) | 0–100 tại `updated_at` |
| `last_trained_at` | timestamptz | |
| `recovered_at` | timestamptz | Dự kiến lúc hồi phục ≥ 80 % |
| `updated_at` | timestamptz | |

- Tính bằng `packages/core/workout/recovery` từ `set_logs` 7 ngày gần nhất.
- Màu vùng trên bản đồ = phần cơ có `fatigue` cao nhất trong vùng.
- "Vì sao?" không cần bảng riêng: đọc lại `set_logs` 7 ngày + `exercise_muscle_heads`.
- App tự tính lại theo thời gian thực từ cache này. Server cập nhật khi kết thúc buổi tập và trong `close-day`.
- Công thức: `02-features/muscle-recovery.md`.

## 3. RLS

- `muscle_groups`, `muscles`, `muscle_heads`, `equipment`, `exercises`, `exercise_muscle_heads`, `exercise_equipment`, `exercise_media`: mọi người đã đăng nhập được đọc; chỉ service role ghi.
- `equipment_profiles`, `programs`, `planned_*`, `workout_sessions`, `set_logs`: chủ dữ liệu toàn quyền.
- `personal_records`, `muscle_recovery`: chủ dữ liệu chỉ đọc.
- Storage `exercise-media`: công khai đọc (đã có giấy phép phân phối), chỉ service role ghi.

## 4. Index

- `exercises(group_code, is_published)`.
- `exercise_equipment(equipment_code)`.
- `exercise_muscle_heads(head_code)`.
- `set_logs(user_id, completed_at desc)`.
- `set_logs(user_id, exercise_id, completed_at desc)`.

## 4b. Bổ sung v1.3 (D-048)

| Thay đổi | Cột / bảng | Chức năng |
|---|---|---|
| Thêm cột vào `muscles` | `default_sets_min` (10), `default_sets_max` (20), `overreach_sets` (25) – ngưỡng mặc định số set hiệu quả/tuần | WRK-13 |
| Bảng mới `muscle_volume_targets` | PK (`user_id`, `muscle_code`); `sets_min`, `sets_max`, `source` (`default` \| `auto` \| `manual`), `updated_at`. Người dùng hoặc app chỉnh theo thời gian | WRK-13 |
| Thêm cột vào `set_logs` | `rir` smallint null (0–5); `rpe` đã có | WRK-14 |
| Thêm cột vào `programs` | `schedule_mode` (`weekday` \| `rotation`), `next_rotation_index` | WRK-15 |
| Thêm cột vào `planned_sessions` | `rotation_index` smallint null (A = 0, B = 1…); `day_of_week` chỉ dùng khi `weekday` | WRK-15 |
| Thêm cột vào `exercises` | `default_rest_sec` (đa khớp 150, đơn khớp 75) | WRK-16 |
| Thêm cột vào `planned_exercises` | `backup_exercise_id` uuid FK null; `target_rir` smallint null | WRK-17, WRK-14 |
| Thêm cột vào `equipment_profiles` | `inventory` jsonb: `{ "bars": [{"type":"olympic","kg":20}], "plates_kg": [25,20,15,10,5,2.5,1.25], "dumbbells_kg": [2,4,…,30], "machines": {"<exercise_slug>": {"step_kg":5,"min_kg":5,"max_kg":100}}, "bands": [{"color":"red","kg_equiv":11}] }` | WRK-18 |
| Thêm cột vào `set_logs` | `added_load_kg` numeric null (tạ đeo thêm), `side` (`both` \| `left` \| `right`), `bands` jsonb null (danh sách dây dùng) | WRK-19 |
| Bảng mới `program_templates` (dùng chung) | `id`, `slug`, `name_vi`, `name_en`, `level`, `days_per_week`, `split`, `equipment_kind`, `description_vi/en` | WRK-20 |
| Bảng mới `program_template_sessions` | `id`, `template_id` FK, `rotation_index`, `name_vi`, `name_en` | WRK-20 |
| Bảng mới `program_template_exercises` | `id`, `session_id` FK, `exercise_id` FK, `sort_order`, `sets`, `rep_min`, `rep_max`, `target_rir`, `rest_sec`, `backup_exercise_id` | WRK-20 |

- RLS: 3 bảng `program_template*` là dữ liệu dùng chung, chỉ đọc; `muscle_volume_targets` chủ dữ liệu toàn quyền.
- `muscles.default_sets_*` là giá trị khởi điểm theo các phân tích gộp về liều–đáp ứng (`feature-backlog.md` [1][2]), không phải ngưỡng cố định cho mọi người.

## 5. Dữ liệu khởi tạo

[seed/exercises_v1.csv](seed/exercises_v1.csv) – **90 bài, 10 bài mỗi nhóm cơ**:
- có tên Việt / Anh, cơ chính, cơ phụ, dụng cụ, mức độ, có tập ở nhà được không;
- media gắn sau khi chốt nguồn có giấy phép (D-041);
- hệ số theo **phần cơ** cho 90 bài sẽ thêm vào `seed/exercise_muscle_heads_v1.csv` ở M5. Trước khi có, mức kích thích của vùng chia đều cho các phần trong vùng.

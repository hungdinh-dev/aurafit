# Lịch sử phiên bản database

Mỗi thay đổi schema thêm một dòng ở **đầu** bảng. Chi tiết nằm trong file module tương ứng.

| Ngày | Module | Phiên bản | Migration | Thay đổi | PR |
|---|---|---|---|---|---|
| 2026-11-13 | Tất cả (01 → 07) | v1 · 06-workout v1.3 – **migrations implemented** | `20261113000100_base_init.sql` → `20261113001100_backfill_existing_users.sql` (11 file) | Viết migration cho toàn bộ schema (49 bảng, RLS mọi bảng, bảng điểm/XP/streak chỉ server ghi), seed (90 bài, 18 cơ, 37 phần cơ, 7 giáo án mẫu, 6 mẫu nhiệm vụ, 24 huy hiệu theo `core/coach/badges.ts`). Khớp với `packages/core` coach: thêm `coach_state.last_closed_date`, `last_streak_lost_date`, `last_monthly_gift`, `boss_wins`, `quests.stat`; cột điểm trụ cột của `daily_scores` lưu điểm sau khi chia lại (tối đa 45/23/17/12/10/6); `free_days` là yêu cầu (`quota`/`shield`) do `close-day` xử lý, Edge Functions `analyze-meal`, `analyze-text`, `close-day`, `weekly-review`, gói `@aurafit/db`. Bổ sung so với thiết kế: bảng `task_templates`, cột `exercises.home_friendly`, `set_logs.distance_m`, `ai_requests.error`, bucket `task-photos`, view tuần/tháng/năm, RPC `find_user_by_username` / `redeem_invite` / `start_duo_streak` / `due_close_days` / `apply_close_day`. Chi tiết: `supabase/README.md` §9 | – |
| 2026-11-13 | 06-workout | v1.3 (thiết kế) | – | Thêm `muscle_volume_targets`, `program_templates*`; thêm cột cho RIR, lịch xoay vòng, nghỉ mặc định, bài dự phòng, kho dụng cụ, tải đặc biệt (WRK-13 → WRK-20, D-048) | – |
| 2026-11-13 | 06-workout | v1.2 (thiết kế) | – | Thêm `muscle_heads` (37 phần cơ), `exercise_muscle_heads`; `muscle_recovery` theo phần cơ; `exercise_muscles` thành view | – |
| 2026-11-13 | 06-workout | v1.1 (thiết kế) | – | Thêm `muscle_groups`, `muscles`, `equipment`, `exercise_muscles`, `exercise_equipment`, `exercise_media`, `muscle_recovery`; bộ khởi tạo 90 bài `seed/exercises_v1.csv` | – |
| 2026-11-13 | Tất cả (01 → 07) | v1 (thiết kế) | – | Thiết kế schema đầu tiên cho bản xây lại; chưa tạo migration | – |
| 2026-06-10 | (bản cũ) | legacy | `20260610000000_expand_database_schema.sql` | Schema bản cũ – không dùng lại, giữ ở tag `legacy-v0` | – |

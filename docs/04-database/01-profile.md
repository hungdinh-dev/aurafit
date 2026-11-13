# DB – Hồ sơ & cài đặt

**Phiên bản hiện tại:** v1 (thiết kế, chưa migrate) · **Chức năng:** ONB-01 → ONB-06 · **Mốc:** M0–M1

## Lịch sử phiên bản

| Phiên bản | Ngày | Migration | Thay đổi |
|---|---|---|---|
| v1 | 2026-11-13 | `…_profile_init.sql` (M0), `…_profile_onboarding.sql` (M1) | Thiết kế đầu tiên |

## Bảng

### `profiles` – 1 dòng / người dùng

| Cột | Kiểu | Ràng buộc | Ghi chú |
|---|---|---|---|
| `user_id` | uuid | PK, FK `auth.users` | |
| `username` | citext | unique, 3–20 ký tự `[a-z0-9_.]` | Dùng để kết bạn |
| `display_name` | text | | |
| `locale` | text | `vi` \| `en`, mặc định `vi` | |
| `timezone` | text | mặc định `Asia/Ho_Chi_Minh` | Dùng tính `local_date` |
| `sex` | text | `male` \| `female` | Cho công thức BMR |
| `birth_date` | date | | Tuổi tính từ đây, không lưu tuổi |
| `height_cm` | numeric(5,1) | 100–250 | |
| `activity_level` | text | `sedentary` \| `light` \| `moderate` \| `active` \| `very_active` | Hệ số TDEE |
| `experience_level` | text | `beginner` \| `intermediate` \| `advanced` | Cho giáo án |
| `body_fat_pct` | numeric(4,1) | null được | Không bắt buộc |
| `character` | text | `kai` \| `mira` | D-032 |
| `character_name` | text | mặc định theo nhân vật | |
| `onboarding_completed_at` | timestamptz | | null = chưa xong |
| `created_at`, `updated_at` | timestamptz | | |

- Tạo tự động bằng trigger khi có `auth.users` mới.
- Cân nặng **không** nằm ở đây, mà ở `health_samples` (có lịch sử).

### `goals` – lịch sử mục tiêu

| Cột | Kiểu | Ràng buộc | Ghi chú |
|---|---|---|---|
| `id` | uuid | PK | |
| `user_id` | uuid | FK | |
| `goal_type` | text | `lose_fat` \| `maintain` \| `gain_muscle` | D-024 |
| `pace` | text | `slow` \| `medium` \| `fast` \| `auto` | D-013 |
| `target_weight_kg` | numeric(5,1) | null được | Cho "Về đích ngày…" |
| `effective_from` | date | | Mục tiêu hiện tại = dòng mới nhất ≤ hôm nay |
| `created_at` | timestamptz | | |

### `coach_settings` – 1 dòng / người dùng

| Cột | Kiểu | Ràng buộc | Ghi chú |
|---|---|---|---|
| `user_id` | uuid | PK | |
| `strictness` | text | `gentle` \| `standard` \| `hardcore` | |
| `strictness_changed_at` | timestamptz | | Giới hạn đổi 1 lần/tuần |
| `voice` | text | `bestie` \| `coach` \| `drama`, mặc định `bestie` | D-033 |
| `free_days_per_week` | smallint | 0–3 | D-035 |
| `free_day_mode` | text | `compensate` \| `no_compensate`, mặc định `compensate` | |
| `quiet_start`, `quiet_end` | time | | Mặc định theo giờ ngủ |
| `work_start`, `work_end` | time | null được | Giờ làm việc không nhắc (D-034) |
| `photo_quota_per_day` | smallint | mặc định 15 | Hạn mức AI |
| `updated_at` | timestamptz | | |

## RLS

- Chủ dữ liệu toàn quyền trên cả 3 bảng.
- Bạn bè chỉ đọc `username`, `display_name`, `character`, `character_name` qua view `public_profiles`, không đọc bảng gốc.

## Index

- `profiles(username)` unique.
- `goals(user_id, effective_from desc)`.

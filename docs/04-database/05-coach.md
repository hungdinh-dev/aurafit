# DB – Huấn luyện viên (game hoá)

**Phiên bản hiện tại:** v1 (thiết kế, chưa migrate) · **Chức năng:** COA-01 → COA-08 · **Mốc:** M4

> Toàn bộ bảng trong file này **chỉ server ghi** (Edge Function `close-day`, chạy bằng pg_cron). App chỉ đọc. Đây là thay đổi quan trọng nhất so với bản cũ.

## Lịch sử phiên bản

| Phiên bản | Ngày | Migration | Thay đổi |
|---|---|---|---|
| v1 | 2026-11-13 | `…_coach_init.sql` (M4) | Thiết kế đầu tiên |

## Bảng

### `daily_scores` – điểm ngày, 1 dòng / ngày

| Cột | Kiểu | Ghi chú |
|---|---|---|
| `user_id`, `local_date` | | PK |
| `nutrition_pts` | smallint | 0–40 |
| `sleep_pts` | smallint | 0–20 |
| `training_pts` | smallint | 0–15 |
| `water_pts` | smallint | 0–10 |
| `tasks_pts` | smallint | 0–10 (chia lại nếu không có task) |
| `weight_pts` | smallint | 0–5 |
| `penalty_pts` | smallint | Trừ khi vượt số ngày tự do |
| `total` | smallint | 0–100 |
| `result` | text | `excellent` \| `pass` \| `fail` |
| `strictness` | text | Mức khắt khe lúc chấm (giữ lịch sử) |
| `is_free_day` | bool | |
| `shield_used` | bool | |
| `breakdown` | jsonb | Chi tiết để giải thích điểm |
| `closed_at` | timestamptz | |

### `coach_state` – trạng thái hiện tại, 1 dòng / người dùng

| Cột | Kiểu | Ghi chú |
|---|---|---|
| `user_id` | uuid PK | |
| `xp` | bigint | Không bao giờ giảm |
| `level` | int | |
| `streak` | int | |
| `best_streak` | int | |
| `shields` | smallint | 0–3 |
| `shield_fragments` | smallint | 0–2 |
| `aura_score` | numeric(5,2) | Trung bình 30 ngày |
| `aura_tier` | text | `gray` \| `green` \| `blue` \| `purple` \| `gold` \| `red` |
| `mood` | text | `radiant` \| `sleepy` \| `thirsty` \| `hungry` \| `fired_up` \| `sad` \| `neutral` |
| `updated_at` | timestamptz | |

### `shield_ledger` – sổ cái khiên (kiểm tra được mọi thay đổi)

`id`, `user_id`, `delta_shields`, `delta_fragments`, `reason` (`excellent_day` \| `monthly_gift` \| `starter` \| `protect_streak` \| `free_day` \| `boss_reward`), `local_date`, `created_at`.

### `stat_snapshots` – chỉ số cứng theo ngày

PK (`user_id`, `local_date`, `stat`). `stat` ∈ `diet_discipline`, `protein`, `sleep`, `water`, `training`, `strength`, `body_progress`, `self_growth`; `value numeric(5,2)`.

### `quests` – nhiệm vụ huấn luyện viên

`id`, `user_id`, `local_date`, `code` (ví dụ `water_before_10`), `params jsonb`, `xp_reward`, `completed_at`.

### `boss_battles` – Boss tuần

`id`, `user_id`, `week_start date`, `boss_code` (`sugar_demon` \| `sloth` \| `night_owl` …), `hits_required`, `hits`, `won_at`, `reward jsonb`. Unique (`user_id`, `week_start`).

### `badges` (dùng chung) và `user_badges`

- `badges`: `code` PK, `name_key`, `description_key` (khoá i18n), `icon`, `rarity`.
- `user_badges`: PK (`user_id`, `badge_code`), `earned_at`.

## RLS

- Chủ dữ liệu **chỉ đọc** mọi bảng ở trên. Không có policy insert/update cho người dùng.
- `badges`: mọi người đã đăng nhập được đọc.
- Bạn bè đọc `streak`, `aura_tier`, `mood` qua view `public_coach_state` (cho streak đôi, hiển thị bạn bè).

## Index

- `daily_scores` dùng khoá chính.
- `shield_ledger(user_id, created_at)`.
- `quests(user_id, local_date)`.

# DB – Daily Tasks

**Phiên bản hiện tại:** v1 (thiết kế, chưa migrate) · **Chức năng:** TSK-01 → TSK-03 · **Mốc:** M3

## Lịch sử phiên bản

| Phiên bản | Ngày | Migration | Thay đổi |
|---|---|---|---|
| v1 | 2026-11-13 | `…_tasks_init.sql` (M3) | Thiết kế đầu tiên |

## Bảng

### `task_definitions`

| Cột | Kiểu | Ghi chú |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid FK | |
| `template_code` | text null | `reading`, `focus`, `meditation`, `social_limit`, `steps`, `wake_early`… null = tự tạo |
| `title` | text | |
| `kind` | text | `check` \| `count` \| `timer` \| `auto` |
| `target_value` | numeric null | 20 (trang), 2 (phiên), 8000 (bước) |
| `unit` | text null | `pages`, `sessions`, `min`, `steps` |
| `auto_source` | text null | `steps` \| `wake_before` |
| `days_of_week` | smallint[] | 1 = Thứ Hai … 7 = Chủ nhật |
| `reminder_time` | time null | |
| `is_active` | bool | Tối đa 7 nhiệm vụ đang bật (kiểm tra ở server) |
| `sort_order` | smallint | |
| `created_at` | timestamptz | |

### `task_logs` – 1 dòng / nhiệm vụ / ngày

| Cột | Kiểu | Ghi chú |
|---|---|---|
| `id` | uuid PK | |
| `task_id` | uuid FK cascade | |
| `user_id` | uuid FK | |
| `local_date` | date | unique (`task_id`, `local_date`) |
| `value` | numeric | |
| `is_completed` | bool | |
| `source` | text | `manual` \| `auto` \| `timer` |
| `note` | text null | Ví dụ tên sách |
| `photo_path` | text null | Ảnh bìa sách (không gọi AI) |
| `updated_at` | timestamptz | |

### `focus_sessions` – phiên làm việc tập trung

`id`, `user_id`, `task_id` FK null, `started_at`, `ended_at`, `planned_min`, `completed bool`.

## RLS

Chủ dữ liệu toàn quyền trên cả 3 bảng.

## Index

- `task_logs(user_id, local_date)`.
- `task_definitions(user_id, is_active)`.

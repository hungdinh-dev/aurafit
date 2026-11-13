# DB – Sức khoẻ

**Phiên bản hiện tại:** v1 (thiết kế, chưa migrate) · **Chức năng:** HLT-01 → HLT-06 · **Mốc:** M3

## Lịch sử phiên bản

| Phiên bản | Ngày | Migration | Thay đổi |
|---|---|---|---|
| v1 | 2026-11-13 | `…_health_init.sql` (M3) | Thiết kế đầu tiên |

## Bảng

### `health_samples` – mọi số đo sức khoẻ, mọi nguồn (D-019)

| Cột | Kiểu | Ghi chú |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid FK | |
| `type` | text | `weight` \| `water` \| `sleep_session` \| `steps` \| `active_energy` \| `resting_hr` |
| `value` | numeric(10,2) | Theo đơn vị chuẩn |
| `unit` | text | `kg` \| `ml` \| `min` \| `count` \| `kcal` \| `bpm` |
| `start_at` | timestamptz | |
| `end_at` | timestamptz null | Dữ liệu có khoảng (giấc ngủ) |
| `local_date` | date | Giấc ngủ tính cho **ngày thức dậy** |
| `source` | text | `manual` \| `apple_health` (sau này `garmin`, `google_fit`) |
| `source_id` | text null | Mã bản ghi ở nguồn |
| `metadata` | jsonb | Chất lượng ngủ 1–5, giai đoạn ngủ, thiết bị… |
| `created_at` | timestamptz | |

- **Chống trùng**: unique (`user_id`, `source`, `source_id`) khi `source_id` có giá trị.
- **Ưu tiên nguồn** khi cùng loại, cùng ngày: thiết bị > nhập tay. Tính lúc tổng hợp, không xoá dữ liệu gốc.

### `daily_summaries` – tổng hợp theo ngày (chỉ server ghi)

| Cột | Kiểu | Ghi chú |
|---|---|---|
| `user_id` | uuid | PK (`user_id`, `local_date`) |
| `local_date` | date | |
| `kcal_in`, `protein_g`, `carb_g`, `fat_g`, `sugar_g` | numeric | Từ `meal_items` |
| `kcal_target` | int | Mục tiêu hiệu lực hôm đó |
| `water_ml` | int | |
| `sleep_min`, `sleep_quality`, `wake_time` | | |
| `steps`, `active_kcal`, `resting_hr` | | |
| `weight_kg` | numeric(5,1) null | Lần cân của ngày |
| `weight_trend_kg` | numeric(5,2) | Trung bình trượt có trọng số |
| `is_free_day` | bool | |
| `updated_at` | timestamptz | |

- Cập nhật khi có dữ liệu mới (trigger gọi hàng đợi) và chốt lại trong `close-day`.
- Biểu đồ tuần / tháng / năm đọc từ bảng này (D-018). Tuần / tháng / năm là **view** tính từ đây, không lưu riêng.

## RLS

- `health_samples`: chủ dữ liệu toàn quyền.
- `daily_summaries`: chủ dữ liệu chỉ đọc.

## Index

- `health_samples(user_id, type, local_date)`.
- `daily_summaries` dùng khoá chính.

# DB – Dinh dưỡng

**Phiên bản hiện tại:** v1 (thiết kế, chưa migrate) · **Chức năng:** NUT-01 → NUT-12 · **Mốc:** M1–M2

## Lịch sử phiên bản

| Phiên bản | Ngày | Migration | Thay đổi |
|---|---|---|---|
| v1 | 2026-11-13 | `…_nutrition_targets.sql` (M1), `…_nutrition_init.sql` (M2) | Thiết kế đầu tiên |

## Bảng

### `nutrition_targets` – lịch sử mục tiêu dinh dưỡng

| Cột | Kiểu | Ghi chú |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid FK | |
| `effective_from` | date | Mục tiêu hôm nay = dòng mới nhất ≤ hôm nay |
| `tdee_kcal` | int | TDEE dùng để tính |
| `kcal`, `protein_g`, `carb_g`, `fat_g`, `sugar_g` | int | Mục tiêu ngày |
| `fiber_g`, `sodium_mg` | int | Tuỳ chọn |
| `reason` | text | `initial` \| `weekly_adjust` \| `goal_change` \| `manual` |
| `explanation` | jsonb | Số liệu để app giải thích "vì sao đổi" |
| `created_at` | timestamptz | |

Chỉnh tự động (`weekly_adjust`) do server ghi; `manual` do người dùng ghi.

### `meal_entries` – một bữa / một lần ghi

| Cột | Kiểu | Ghi chú |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid FK | |
| `eaten_at` | timestamptz | |
| `local_date` | date | Ngày theo múi giờ người dùng |
| `meal_slot` | text | `breakfast` \| `lunch` \| `dinner` \| `snack` |
| `source` | text | `photo` \| `text` \| `library` \| `recent` \| `barcode` |
| `photo_path` | text | Đường dẫn Storage (bucket riêng tư `meal-photos`) |
| `ai_request_id` | uuid FK null | |
| `is_shared` | bool, mặc định false | Hiện trong story bạn bè (FRD-02) |
| `created_at`, `updated_at` | timestamptz | |

### `meal_items` – món trong bữa

| Cột | Kiểu | Ghi chú |
|---|---|---|
| `id` | uuid PK | |
| `meal_entry_id` | uuid FK cascade | |
| `user_id` | uuid FK | Lặp lại để RLS nhanh |
| `name` | text | |
| `portion_text` | text | "1 bát vừa", "150 g" |
| `quantity` | numeric(5,2), mặc định 1 | Hệ số ×0,5 / ×1,5… |
| `kcal` | int | Đã nhân `quantity` |
| `protein_g`, `carb_g`, `fat_g`, `sugar_g`, `fiber_g` | numeric(6,1) | Luôn lưu đủ (D-015) |
| `sodium_mg` | int | Ước tính thô |
| `confidence` | numeric(3,2) null | Độ tin cậy AI 0–1 |
| `clarifications` | jsonb | Câu hỏi + đáp án đã chọn |
| `saved_food_id` | uuid FK null | Nếu chọn từ Món của tôi |
| `barcode` | text null | |

### `saved_foods` – Món của tôi

| Cột | Kiểu | Ghi chú |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid FK | |
| `name` | text | "Cà phê sữa đá" |
| `kind` | text | `item` \| `combo` |
| `kcal`, `protein_g`, `carb_g`, `fat_g`, `sugar_g`, `fiber_g`, `sodium_mg` | | Tổng cho 1 phần |
| `usual_slot` | text null | Để sắp theo khung giờ |
| `use_count` | int, mặc định 0 | |
| `last_used_at` | timestamptz | |
| `created_at` | timestamptz | |

### `saved_food_items` – thành phần của combo

`id`, `saved_food_id` FK cascade, `name`, `quantity`, các cột chất như trên.

### `barcode_products` – cache mã vạch (dùng chung)

`barcode` PK, `name`, `brand`, chất **trên 100 g**, `serving_g`, `source` (`openfoodfacts` | `user`), `fetched_at`. Chỉ server ghi; người dùng đã đăng nhập được đọc.

### `free_days` – ngày tự do

| Cột | Kiểu | Ghi chú |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid FK | |
| `local_date` | date | unique (`user_id`, `local_date`) |
| `kind` | text | `quota` (trong số ngày đã đặt) \| `shield` (đổi bằng khiên) |
| `quoted_extra_kcal` | int | Báo giá lúc bật |
| `compensated` | bool | Có bù trong tuần không |
| `created_at` | timestamptz | |

### `ai_requests` – nhật ký gọi AI (chỉ server ghi)

`id`, `user_id`, `kind` (`meal_image` \| `meal_text` \| `reanalyze`), `provider`, `model`, `input_tokens`, `output_tokens`, `cost_usd numeric(10,6)`, `latency_ms`, `status` (`ok` \| `error` \| `quota_exceeded`), `created_at`.

## RLS

- `meal_entries`, `meal_items`, `saved_foods`, `saved_food_items`, `free_days`: chủ dữ liệu toàn quyền.
- `meal_entries`: thêm policy cho bạn bè đọc khi `is_shared = true` và trong ngày hôm nay (`07-friends.md`).
- `nutrition_targets`: chủ dữ liệu đọc và thêm dòng `manual`; dòng tự động do server ghi.
- `ai_requests`: chủ dữ liệu chỉ đọc.
- Storage `meal-photos`: thư mục `<user_id>/…`, chỉ chủ đọc/ghi; bạn bè xem ảnh đã chia sẻ qua signed URL do server cấp.

## Index

- `meal_entries(user_id, local_date)`.
- `meal_items(meal_entry_id)`.
- `saved_foods(user_id, use_count desc)`.
- `nutrition_targets(user_id, effective_from desc)`.
- `ai_requests(user_id, created_at)` – để đếm hạn mức trong ngày.

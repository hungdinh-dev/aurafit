# DB – Bạn bè

**Phiên bản hiện tại:** v1 (thiết kế, chưa migrate) · **Chức năng:** FRD-01 → FRD-03 · **Mốc:** M6

## Lịch sử phiên bản

| Phiên bản | Ngày | Migration | Thay đổi |
|---|---|---|---|
| v1 | 2026-11-13 | `…_friends_init.sql` (M6) | Thiết kế đầu tiên |

## Bảng

### `friendships`

| Cột | Kiểu | Ghi chú |
|---|---|---|
| `id` | uuid PK | |
| `requester_id` | uuid FK | |
| `addressee_id` | uuid FK | |
| `status` | text | `pending` \| `accepted` \| `blocked` |
| `created_at`, `responded_at` | timestamptz | |

- Unique theo cặp không phân biệt chiều: index unique trên (`least(a,b)`, `greatest(a,b)`).
- Hàm `are_friends(a, b)` (security definer) dùng trong các policy khác.

### `invites` – link mời / mã QR (D-036)

`code` text PK (ngẫu nhiên 10 ký tự), `inviter_id`, `expires_at` (mặc định +7 ngày), `max_uses` (mặc định 5), `uses`, `created_at`.

### `meal_reactions`

`id`, `meal_entry_id` FK cascade, `user_id`, `reaction` (`fire` \| `clap` \| `heart` \| `drool` \| `strong`), `created_at`. Unique (`meal_entry_id`, `user_id`).

### `duo_streaks` – streak đôi

`id`, `user_a`, `user_b` (lưu `user_a < user_b`), `streak`, `best_streak`, `started_at`, `last_counted_date`, `status` (`active` \| `ended`). Server cập nhật trong `close-day`.

## RLS

- `friendships`: hai người trong cặp được đọc. Người nhận được cập nhật `status`. Người gửi được tạo và xoá.
- `invites`: chủ được tạo / đọc / xoá. Dùng mã mời qua Edge Function (không đọc trực tiếp).
- `meal_entries` (bảng của Dinh dưỡng) thêm policy cho bạn bè đọc khi đủ cả ba điều kiện:
  - `is_shared = true`;
  - `local_date` = ngày hôm nay theo múi giờ của chủ bữa ăn;
  - `are_friends(auth.uid(), user_id)`.

  Tức là bạn bè chỉ thấy bữa đã chia sẻ trong ngày hôm nay.
- `meal_reactions`: tạo nếu xem được bữa đó; chủ bữa và người thả đọc được.
- `duo_streaks`: hai người trong cặp chỉ đọc.

## Index

- `friendships(addressee_id, status)`.
- `meal_reactions(meal_entry_id)`.

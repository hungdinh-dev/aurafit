# Lịch sử phiên bản database

Mỗi thay đổi schema thêm một dòng ở **đầu** bảng. Chi tiết nằm trong file module tương ứng.

| Ngày | Module | Phiên bản | Migration | Thay đổi | PR |
|---|---|---|---|---|---|
| 2026-11-13 | 06-workout | v1.3 (thiết kế) | – | Thêm `muscle_volume_targets`, `program_templates*`; thêm cột cho RIR, lịch xoay vòng, nghỉ mặc định, bài dự phòng, kho dụng cụ, tải đặc biệt (WRK-13 → WRK-20, D-048) | – |
| 2026-11-13 | 06-workout | v1.2 (thiết kế) | – | Thêm `muscle_heads` (37 phần cơ), `exercise_muscle_heads`; `muscle_recovery` theo phần cơ; `exercise_muscles` thành view | – |
| 2026-11-13 | 06-workout | v1.1 (thiết kế) | – | Thêm `muscle_groups`, `muscles`, `equipment`, `exercise_muscles`, `exercise_equipment`, `exercise_media`, `muscle_recovery`; bộ khởi tạo 90 bài `seed/exercises_v1.csv` | – |
| 2026-11-13 | Tất cả (01 → 07) | v1 (thiết kế) | – | Thiết kế schema đầu tiên cho bản xây lại; chưa tạo migration | – |
| 2026-06-10 | (bản cũ) | legacy | `20260610000000_expand_database_schema.sql` | Schema bản cũ – không dùng lại, giữ ở tag `legacy-v0` | – |

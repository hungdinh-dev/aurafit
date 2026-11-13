# AuraFit – Danh mục toàn bộ chức năng

File tổng hợp **mọi chức năng** của AuraFit. Mỗi chức năng có mã, độ ưu tiên, mốc triển khai, file đặc tả và các bảng database liên quan. Đặc tả chi tiết nằm ở `02-features/`, thiết kế database ở `04-database/`.

**Trạng thái:** 📝 Đã đặc tả (nháp) · 🔨 Đang làm · ✅ Xong · ⏸️ Sau MVP
**Ưu tiên:** Must = có trong beta · Should = beta nếu kịp · Later = sau beta

## 1. Onboarding & Hồ sơ – [đặc tả](02-features/onboarding-profile.md) · [DB](04-database/01-profile.md)

| Mã | Chức năng | Ưu tiên | Mốc | Bảng DB | Trạng thái |
|---|---|---|---|---|---|
| ONB-01 | Đăng nhập Google + email OTP, giữ phiên | Must | M0 | `profiles` | 📝 |
| ONB-02 | Ngôn ngữ Việt / Anh, đổi trong Cài đặt | Must | M0 | `profiles.locale` | 📝 |
| ONB-03 | Onboarding ngắn: thông số cơ thể, mức vận động, mục tiêu + tốc độ (hoặc "để app quyết") | Must | M1 | `profiles`, `goals` | 📝 |
| ONB-04 | Chọn huấn luyện viên: mức khắt khe + giọng văn | Must | M1 | `coach_settings` | 📝 |
| ONB-05 | Chọn nhân vật Kai / Mira, đặt tên | Must | M1 | `profiles` | 📝 |
| ONB-06 | Hỏi dần trong tuần đầu (hồ sơ dụng cụ, % mỡ, Apple Health, ngày tự do) | Should | M1–M5 | nhiều bảng | 📝 |
| ONB-07 | Sign in with Apple | Later (bắt buộc trước khi lên App Store) | – | `auth` | ⏸️ |

## 2. Dinh dưỡng ⭐ – [đặc tả](02-features/nutrition.md) · [DB](04-database/02-nutrition.md)

| Mã | Chức năng | Ưu tiên | Mốc | Bảng DB | Trạng thái |
|---|---|---|---|---|---|
| NUT-01 | Mục tiêu kcal/macro từ TDEE, sàn an toàn, lưu lịch sử mục tiêu | Must | M1 | `nutrition_targets` | 📝 |
| NUT-02 | Ghi món bằng **ảnh + AI** (Gemini rẻ, có hạn mức) | Must | M2 | `meal_entries`, `meal_items`, `ai_requests` | 📝 |
| NUT-03 | Câu hỏi làm rõ ≤ 3, trả lời tính trên máy (không gọi AI lần 2) | Must | M2 | `meal_items` | 📝 |
| NUT-04 | Ghi món bằng **mô tả chữ / giọng nói** | Must | M2 | `meal_entries`, `ai_requests` | 📝 |
| NUT-05 | **Món của tôi**: lưu món / combo, chọn lại 1 chạm | Must | M2 | `saved_foods`, `saved_food_items` | 📝 |
| NUT-06 | Gần đây / Lặp lại bữa hôm qua | Must | M2 | `meal_entries` | 📝 |
| NUT-07 | Quét **mã vạch** | Must | M2 | `barcode_products` | 📝 |
| NUT-08 | Nhật ký ngày: dòng thời gian ảnh, sửa / xoá | Must | M2 | `meal_entries`, `meal_items` | 📝 |
| NUT-09 | **Ngày tự do** 0–3/tuần + báo giá + bù trong tuần | Must | M2 | `free_days`, `coach_settings` | 📝 |
| NUT-10 | **Ăn gì bây giờ?** – gợi ý từ món của bạn, 0 AI | Must | M2 | `saved_foods` | 📝 |
| NUT-11 | **Ngân sách tuần** | Must | M2 | `nutrition_targets`, `daily_summaries` | 📝 |
| NUT-12 | Chất xơ, natri (tuỳ chọn hiển thị) | Should | M2 | `meal_items` | 📝 |

## 3. Sức khoẻ – [đặc tả](02-features/lifestyle.md) · [DB](04-database/03-health.md)

| Mã | Chức năng | Ưu tiên | Mốc | Bảng DB | Trạng thái |
|---|---|---|---|---|---|
| HLT-01 | Nước: ghi 1 chạm + nhắc thông minh | Must | M3 | `health_samples` | 📝 |
| HLT-02 | Cân nặng: ghi, cân nặng xu hướng, nhắc cân | Must | M3 | `health_samples`, `daily_summaries` | 📝 |
| HLT-03 | Chỉnh TDEE hằng tuần theo xu hướng cân nặng | Must | M3 | `nutrition_targets` | 📝 |
| HLT-04 | Giấc ngủ: nhập tay (giờ ngủ, giờ dậy, chất lượng) | Must | M3 | `health_samples` | 📝 |
| HLT-05 | Kết nối **Apple Health** (Apple Watch, Garmin qua Apple Health) | Must | M3 | `health_samples` | 📝 |
| HLT-06 | Tổng hợp theo ngày cho biểu đồ | Must | M3 | `daily_summaries` | 📝 |

## 4. Daily Tasks – [đặc tả](02-features/daily-tasks.md) · [DB](04-database/04-tasks.md)

| Mã | Chức năng | Ưu tiên | Mốc | Bảng DB | Trạng thái |
|---|---|---|---|---|---|
| TSK-01 | Nhiệm vụ 4 loại: đánh dấu, đếm, hẹn giờ, tự động | Must | M3 | `task_definitions`, `task_logs` | 📝 |
| TSK-02 | Hẹn giờ làm việc tập trung + giờ làm việc không làm phiền | Must | M3 | `focus_sessions`, `coach_settings` | 📝 |
| TSK-03 | Thư viện mẫu: đọc sách, thiền, giới hạn MXH… | Must | M3 | `task_definitions` | 📝 |

## 5. Huấn luyện viên (game hoá) – [đặc tả](02-features/gamification.md) · [DB](04-database/05-coach.md)

| Mã | Chức năng | Ưu tiên | Mốc | Bảng DB | Trạng thái |
|---|---|---|---|---|---|
| COA-01 | Điểm ngày 0–100, chốt 03:00 ở server | Must | M4 | `daily_scores` | 📝 |
| COA-02 | Streak, mảnh khiên, khiên | Must | M4 | `coach_state`, `shield_ledger` | 📝 |
| COA-03 | Level/XP (không mất) + Aura 30 ngày (có thể tụt) + chỉ số cứng | Must | M4 | `coach_state`, `stat_snapshots` | 📝 |
| COA-04 | Nhiệm vụ huấn luyện viên hằng ngày | Must | M4 | `quests` | 📝 |
| COA-05 | Boss tuần | Must | M4 | `boss_battles` | 📝 |
| COA-06 | Nhân vật Kai/Mira: hào quang theo Aura, nét mặt theo dữ liệu | Must | M4 | `coach_state` | 📝 |
| COA-07 | 3 giọng văn vi/en + nhắc theo ngữ cảnh, giờ yên lặng | Must | M4 | `coach_settings` | 📝 |
| COA-08 | Màn tuyên dương + huy hiệu | Must | M4 | `badges`, `user_badges` | 📝 |

## 6. Tập luyện – [đặc tả](02-features/workout.md) · [DB](04-database/06-workout.md)

| Mã | Chức năng | Ưu tiên | Mốc | Bảng DB | Trạng thái |
|---|---|---|---|---|---|
| WRK-01 | Thư viện bài tập gym / nhà / calisthenics | Must | M5 | `exercises` | 📝 |
| WRK-02 | Hồ sơ dụng cụ | Must | M5 | `equipment_profiles` | 📝 |
| WRK-03 | Sinh giáo án dài + ngắn hạn | Must | M5 | `programs`, `planned_sessions`, `planned_exercises` | 📝 |
| WRK-04 | Buổi tập: ghi set, đồng hồ nghỉ có thông báo, đổi bài, thêm/bớt set | Must | M5 | `workout_sessions`, `set_logs` | 📝 |
| WRK-05 | Autoregulation theo khoảng rep + tăng tải | Must | M5 | `planned_exercises`, `set_logs` | 📝 |
| WRK-06 | Readiness – buổi tập tự điều chỉnh | Must | M5 | `workout_sessions` | 📝 |
| WRK-07 | PR, 1RM ước tính (chỉ tính khi set ≤ 10 rep – EXT-09), bậc calisthenics | Must | M5 | `personal_records` | 📝 |
| WRK-08 | Cây kỹ năng calisthenics đầy đủ | Later | v1.1 | `exercises` | ⏸️ |
| WRK-09 | **Thư viện bài tập** theo 9 nhóm cơ và 9 loại dụng cụ; GIF hướng dẫn có giấy phép; 90 bài đầu tiên (10/nhóm) | Must | M5 | `muscle_groups`, `equipment`, `exercises`, `exercise_muscles`, `exercise_equipment`, `exercise_media` | 📝 |
| WRK-10 | **Bản đồ hồi phục cơ 2D** (trước / sau, màu theo % hồi phục, thời gian còn lại) – [đặc tả](02-features/muscle-recovery.md) | Must | M5 | `muscles`, `muscle_recovery` | 📝 |
| WRK-11 | **Chi tiết phần cơ + "Vì sao?"**: chạm một vùng → hình phóng to chia phần (ví dụ ngực trên / giữa / dưới), mỗi phần một màu; lịch sử bài tập gây mỏi 7 ngày gần nhất | Must | M5 | `muscle_heads`, `exercise_muscle_heads`, `set_logs` | 📝 |
| WRK-12 | **Bản đồ cơ chi tiết** theo ảnh mẫu: trước + sau cạnh nhau, thân đen viền mảnh, ~40 khối cơ màu đặc; chế độ **Khối lượng tuần** (set/tuần từng phần) và **Phục hồi**; chạm để xem số liệu | Must | M5 | `muscle_heads`, `exercise_muscle_heads`, `set_logs` | 📝 |
| WRK-13 | **Ngưỡng khối lượng** theo nhóm cơ trên bản đồ Khối lượng tuần: dưới mức kích thích / hiệu quả / nguy cơ quá tải, khởi điểm ~10–20 set/tuần (EXT-01) | Must | M5 | `muscles`, `muscle_volume_targets` | 📝 |
| WRK-14 | **Ghi RIR / RPE** cho từng set, tuỳ chọn 1 chạm; dùng cho tự chỉnh tạ (EXT-02) | Must | M5 | `set_logs.rpe`, `set_logs.rir` | 📝 |
| WRK-15 | **Lịch xoay vòng A/B/C** không phụ thuộc thứ trong tuần; lỡ buổi thì buổi sau lùi (EXT-05) | Must | M5 | `programs.schedule_mode`, `planned_sessions.rotation_index` | 📝 |
| WRK-16 | **Thời gian nghỉ mặc định theo loại bài**: đa khớp ≥ 2 phút, đơn khớp 60–90 giây (EXT-07) | Must | M5 | `exercises.default_rest_sec` | 📝 |
| WRK-17 | **Bài dự phòng 1 chạm** khi máy bận, giữ nguyên set/rep (EXT-12) | Must | M5 | `planned_exercises.backup_exercise_id` | 📝 |
| WRK-18 | **Hồ sơ phòng gym chi tiết** (bước tạ thật từng máy, bánh tạ có sẵn) + **máy tính lắp bánh tạ** (EXT-13) | Must | M5 | `equipment_profiles.inventory` | 📝 |
| WRK-19 | **Tạ đeo thêm, rep từng bên, dây kháng lực nhiều sợi** (EXT-14) | Must | M5 | `set_logs.added_load_kg`, `set_logs.side`, `set_logs.bands` | 📝 |
| WRK-20 | **7 giáo án mẫu** soạn theo nguyên tắc khoa học: toàn thân A/B, trên/dưới, đẩy/kéo/chân, 5×5, tại nhà, calisthenics, nữ ưu tiên thân dưới (EXT-26) | Must | M5 | `program_templates`, `program_template_sessions`, `program_template_exercises` | 📝 |

## 7. Hôm nay & Tiến độ – [đặc tả](02-features/progress-insights.md)

| Mã | Chức năng | Ưu tiên | Mốc | Bảng DB | Trạng thái |
|---|---|---|---|---|---|
| PRG-01 | Màn **Hôm nay** | Must | M2→M4 | đọc nhiều bảng | 📝 |
| PRG-02 | Biểu đồ ngày / tuần / tháng / năm | Must | M6 | `daily_summaries` | 📝 |
| PRG-03 | Heatmap theo điểm ngày | Must | M6 | `daily_scores` | 📝 |
| PRG-04 | Tổng kết tuần + "Về đích ngày…" | Must | M6 | `daily_summaries`, `goals` | 📝 |

## 8. Bạn bè – [đặc tả](02-features/social.md) · [DB](04-database/07-friends.md)

| Mã | Chức năng | Ưu tiên | Mốc | Bảng DB | Trạng thái |
|---|---|---|---|---|---|
| FRD-01 | Kết bạn bằng username / link mời / QR | Must | M6 | `friendships`, `invites` | 📝 |
| FRD-02 | Story bữa ăn hôm nay + thả cảm xúc | Must | M6 | `meal_entries.shared`, `meal_reactions` | 📝 |
| FRD-03 | Streak đôi | Must | M6 | `duo_streaks` | 📝 |

## 9. Sau beta

Danh sách ứng viên mở rộng có nguồn khoa học (mã `EXT-xx`, chưa chốt): [02-features/feature-backlog.md](02-features/feature-backlog.md).

| Mã | Chức năng | Khi nào |
|---|---|---|
| LAT-01 | Widget màn hình khoá + Live Activity (đồng hồ nghỉ trên Dynamic Island) | v1.1 |
| LAT-02 | Nhân vật hoạt hình (Rive) + trang phục | v1.1 |
| LAT-03 | AuraFit Wrapped tháng / năm | v1.2 |
| LAT-04 | Ảnh tiến độ có bóng mờ căn tư thế | v1.2 |
| LAT-05 | Tuổi tim mạch (Nes et al. 2014) | v1.2 |
| LAT-06 | Bản đồ cơ 3D (nâng cấp từ bản 2D WRK-10) | Sau v1 |
| LAT-07 | Android | Sau v1 |
| LAT-08 | Social mở rộng (phòng gym, diễn đàn, chat, guild), gói trả phí | Sau v1 |

**Tổng beta:** 61 chức năng Must/Should, chia vào 8 mốc M0 → M7 (xem `03-design/mvp-roadmap.md`).

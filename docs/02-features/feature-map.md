# Bản đồ tính năng

Cập nhật 2026-11-13 sau vòng 3. Trọng tâm: **dinh dưỡng & sức khoẻ hằng ngày** (D-005). Điểm khác biệt: [signature-features.md](signature-features.md).

## Tổng quan module

| # | Module | Mô tả ngắn | Ưu tiên | Phụ thuộc | File |
|---|---|---|---|---|---|
| 1 | Onboarding & Profile | Onboarding ngắn, TDEE, mục tiêu, huấn luyện viên, Google + email | **Must** | – | [onboarding-profile.md](onboarding-profile.md) |
| 2 | **Nutrition** ⭐ lõi | 5 cách ghi món, AI ảnh, Món của tôi, ngày tự do & ngân sách tuần | **Must** | 1 | [nutrition.md](nutrition.md) |
| 3 | Health tracking | Ngủ, nước, cân nặng (xu hướng), vận động; mô hình dữ liệu chuẩn | **Must** | 1 | [lifestyle.md](lifestyle.md) |
| 4 | Daily Tasks | Nhiệm vụ chất lượng sống: đọc sách, làm việc tập trung, thiền… | **Must** (bản gọn) | 1, 3 | [daily-tasks.md](daily-tasks.md) |
| 5 | Workout | Gym, tại nhà, calisthenics; giáo án tự sinh; readiness | **Must** | 1, 3 | [workout.md](workout.md) |
| 6 | Huấn luyện viên (Gamification) | Điểm ngày, Level/Aura, streak, khiên, Boss, Auri, giọng văn | **Must** | 2, 3, 4, 5 | [gamification.md](gamification.md) |
| 7 | Today & Progress | Màn Hôm nay, thống kê ngày/tuần/tháng/năm, heatmap | **Must** | 2–6 | [progress-insights.md](progress-insights.md) |
| 8 | Bạn bè | Kết bạn, story bữa ăn, streak đôi | **Must** (bản gọn) | 1, 2, 6 | [social.md](social.md) |
| 9 | 3D Anatomy | Bản đồ cơ 3D mỏi / hồi phục | Won't (lúc này) | 5 | [anatomy-3d.md](anatomy-3d.md) |

Social mở rộng (phòng gym, diễn đàn, chat, guild) và 3D: **sau v1**.

## Sơ đồ phụ thuộc

```text
                    ┌──► Nutrition ⭐ ───────┐
                    ├──► Health tracking ────┤
Onboarding ─────────┼──► Daily Tasks ────────┼──► Huấn luyện viên ──► Today & Progress
 (TDEE, mục tiêu,   └──► Workout ────────────┘     (điểm, Aura, Auri)        │
  huấn luyện viên)                                        │                  │
                                                          └──────► Bạn bè ◄──┘
```

## Mâu thuẫn trong ý tưởng cũ – đã xử lý

| # | Mâu thuẫn | Cách xử lý |
|---|---|---|
| C1 | Khiên: 2/tuần vs theo độ khó vs mua bằng EXP | Mảnh khiên từ ngày xuất sắc + khiên tặng hằng tháng (`gamification.md` §7) |
| C2 | Chỉ tập buổi của hôm nay vs tập bù | ❓ WO-6 – sẽ chốt khi thiết kế chi tiết M5 |
| C3 | Nhắc nước mỗi 10–15 phút | Nhắc thông minh theo lượng còn thiếu, trong giờ thức (`lifestyle.md` §4) |
| C4 | Chỉ số tự động vs phân bổ điểm | Tự động theo dữ liệu thật (D-007) |
| C5 | Streak theo ngày nhưng lịch tập 3–6 ngày | Streak theo **điểm ngày**; ngày nghỉ theo lịch vẫn đủ điểm tập |
| C6 | "Kiểu Locket" = chia sẻ hay riêng tư | Cả hai: nhật ký riêng + story cho bạn bè (D-025) |

## Ý tưởng chưa phân loại

_Thêm ý tưởng mới vào đây._

- Bài tập của người nổi tiếng (celebrity workouts).
- Hàng đợi đồng bộ offline.
- Tuổi tim mạch (Nes et al. 2014) – sau MVP.
- Guild / thử thách nhóm nhiều người.

# Giả định khi triển khai (cần chủ dự án duyệt)

Những chỗ tài liệu chưa nói rõ, code đã chọn một giá trị để chạy được. Mỗi giả định có chú thích nguồn ngay trong code. Đổi giá trị nào thì sửa code tương ứng và gạch dòng ở đây.

Cập nhật: 13/11/2026 · nhánh `feat/beta-build`.

## 1. Dinh dưỡng & sức khoẻ (`packages/core/src/nutrition`, `health`, `time`)

| # | Giả định | Ở đâu |
|---|---|---|
| N1 | Hệ số vận động 1,2 / 1,375 / 1,55 / 1,725 / 1,9 | `nutrition/energy.ts` |
| N2 | Không rõ giới tính: BMR dùng hằng số giữa (−78) và sàn an toàn cao hơn 1.500 kcal. kcal làm tròn 10, sàn làm tròn lên | `nutrition/energy.ts`, `targets.ts` |
| N3 | Đạm 2,2 / 1,6 / 1,8 g/kg cho giảm / giữ / tăng; đạm và béo tính theo cân nặng ứng với BMI 25 khi người dùng nặng hơn; béo = max(0,6 g/kg, 25 % kcal) | `nutrition/targets.ts` |
| N4 | Chất xơ 14 g / 1.000 kcal; natri tối đa 2.000 mg | `nutrition/targets.ts` |
| N5 | "App tự quyết" tốc độ: giảm mỡ dựa % mỡ, không có thì dùng ngưỡng BMI châu Á 23 / 27,5; bám kế hoạch kém thì chậm một bậc. Tăng cơ: người mới vừa, trung cấp trở lên chậm | `nutrition/targets.ts` |
| N6 | Ngày tự do: mặc định ăn vượt 50 % mục tiêu (khớp ví dụ +1.100 kcal); báo chậm về đích chỉ áp dụng khi giảm mỡ | `nutrition/freeDay.ts` |
| N7 | Ngân sách tuần: ăn vượt thường luôn được bù; chế độ bù chỉ ảnh hưởng ngày tự do | `nutrition/weeklyBudget.ts` |
| H1 | Xu hướng cân nặng: trung bình trượt hệ số 0,1; buổi cân đầu tiên trong ngày | `health/weightTrend.ts`, `dailySummary.ts` |
| H2 | Chỉnh TDEE: bỏ qua thay đổi < 50 kcal; giữ trong 1,1–2,5 × BMR | `health/adaptiveTdee.ts` |
| H3 | Nước: mục tiêu 1,5–4 L; khoảng nhắc tối đa 150 / 120 / 90 phút theo mức khắt khe | `health/water.ts` |
| T1 | Ngày chốt lúc 03:00 sáng hôm sau theo múi giờ người dùng | `time/timezone.ts` |

## 2. Huấn luyện viên (`packages/core/src/coach`)

| # | Giả định |
|---|---|
| C1 | ⭐ cần 95 điểm ở mọi mức khắt khe |
| C2 | Tính điểm một phần: thời lượng ngủ và nước tuyến tính; giờ dậy đạt/không đạt trong ±30 phút. Không có nhiệm vụ thì 10 điểm của nhiệm vụ chia đều theo tỉ lệ cho các trụ khác |
| C3 | Ngày được khiên bảo vệ giữ streak nhưng không cộng thêm |
| C4 | Ví khiên đầy thì mảnh thêm bị mất; quà khiên hằng tháng bắt đầu từ tháng sau khi đăng ký |
| C5 | XP lên cấp L → L+1 = 400 × 1,08^(L−1) |
| C6 | Ngưỡng Aura 40 / 55 / 70 / 82 / 92; tốc độ giảm theo mức khắt khe = chu kỳ bán rã 20 / 12 / 7 ngày; trọng số chỉ số trong Aura do code chọn |
| C7 | Boss tuần: thắng khi đạt 5/7 ngày; boss "lười" cần đủ mọi buổi tập đã lên lịch |
| C8 | Thứ tự ưu tiên tâm trạng nhân vật: buồn → rực rỡ → đói → khát → buồn ngủ → hừng hực |

## 3. Tập luyện (`packages/core/src/workout`)

| # | Giả định |
|---|---|
| W1 | Set chỉ tính vào khối lượng tuần khi RIR ≤ 4 |
| W2 | Mã 37 phần cơ (`chest_upper`, `biceps_long`…) do code đặt; DB seed dùng đúng bộ mã này |
| W3 | Hàng chèo ngồi trong ví dụ buổi kéo: nghỉ 120 s thay vì 90 s để theo quy tắc bài đa khớp |
| W4 | Tạ khởi điểm để trống – còn chờ câu hỏi WO-1 |

**Hạn chế đã biết:** thư viện chưa có squat không tạ nên giáo án calisthenics thiếu bài đùi trước; giáo án 5×5 tập ngực/vai ~1,5 lần/tuần (dưới quy tắc ≥ 2 lần).

## 4. Backend (`supabase/`)

Phần bổ sung ngoài tài liệu DB (bảng `task_templates`, `exercises.home_friendly`, `set_logs.distance_m`, `ai_requests.error`, bucket `task-photos`, view tổng hợp tuần/tháng/năm, 5 hàm server) được liệt kê ở `supabase/README.md` §9 và `docs/04-database/CHANGELOG.md`.

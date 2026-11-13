# Module: Daily Tasks (Chất lượng sống)

**Trạng thái:** 🟧 Thiết kế nháp · **Ưu tiên:** Must – bản gọn (D-024)

## Mục tiêu

Ngoài ăn – ngủ – tập, giúp người dùng xây các thói quen nâng chất lượng sống (làm việc tập trung, đọc sách, thiền…) dưới dạng **nhiệm vụ hằng ngày**. Nhiệm vụ được tính vào điểm ngày và chỉ số.

## 1. Bốn loại nhiệm vụ

| Loại | Cách hoàn thành | Ví dụ |
|---|---|---|
| ✅ **Đánh dấu** | 1 chạm | Thiền, dọn phòng, không lướt MXH sau 22h |
| 🔢 **Đếm** | Nhập số, đạt ngưỡng là xong | Đọc 20 trang, học 15 từ mới |
| ⏱️ **Hẹn giờ** | Bấm giờ ngay trong app | 2 phiên làm việc tập trung × 50 phút ❓ Q4.3 |
| 🔄 **Tự động** | Tự hoàn thành từ dữ liệu sức khoẻ | 8.000 bước, dậy trước 6:30 |

## 2. Thư viện mẫu

Chọn ở onboarding (bước "Cải thiện chất lượng sống") hoặc thêm sau:

- 📚 **Đọc sách**: đếm trang; tuỳ chọn ghi tên sách và chụp bìa. Ảnh chỉ để lưu, không gọi AI.
- 💻 **Làm việc tập trung**: hẹn giờ theo phiên (mặc định 50 phút làm / 10 phút nghỉ).
- 🧘 **Thiền / hít thở**: đánh dấu hoặc hẹn giờ.
- 📵 **Giới hạn MXH**: cuối ngày tự khai báo ("Hôm nay lướt khoảng… giờ"), vì iOS không cho app đọc thời gian dùng app khác (R7).
- 🚶 **Bước chân**: tự động từ Apple Health.
- 🌅 **Dậy sớm**: tự động từ dữ liệu giấc ngủ.
- ✍️ **Tự tạo**: tên, loại, ngưỡng, lịch.

## 3. Lịch & nhắc

- Mỗi nhiệm vụ có: các ngày trong tuần, khung giờ (tuỳ chọn), nhắc (tuỳ chọn, theo giọng văn đã chọn).
- MVP giới hạn **tối đa 7 nhiệm vụ** đang bật; app khuyên bắt đầu với 2–3 để không quá tải.

## 4. Tính vào điểm & chỉ số

- Trụ cột **Sống chất lượng** = 10 điểm trong điểm ngày (`gamification.md` §3), tính bằng % nhiệm vụ hôm nay hoàn thành × 10.
- Không bật nhiệm vụ nào → 10 điểm này **chia lại** cho các trụ cột khác, nên người không dùng không bị thiệt.
- Chỉ số cứng mới:
  - 🧠 **Phát triển bản thân**: % nhiệm vụ hoàn thành trong 30 ngày.
  - 📚 **Đọc**: tổng trang 30 ngày so với mục tiêu, nếu có nhiệm vụ đọc.
- Các chỉ số Wisdom / Focus / Discipline của bản cũ giờ được đo bằng dữ liệu thật.

## 5. Phân biệt với "Nhiệm vụ huấn luyện viên"

- **Daily task**: người dùng tự đặt, lặp lại đều đặn.
- **Nhiệm vụ huấn luyện viên**: app giao 1–3 việc mỗi ngày, nhắm vào chỉ số yếu nhất, chỉ cộng thưởng (`gamification.md` §6).

## Dữ liệu cần lưu (bản nháp)

- `task_definitions`: người dùng, tên, loại, ngưỡng, đơn vị, lịch, nhắc, nguồn tự động.
- `task_logs`: nhiệm vụ, ngày, giá trị, hoàn thành, nguồn (tay / tự động / hẹn giờ).

## Tiêu chí chấp nhận (bản nháp)

- Đánh dấu một nhiệm vụ ≤ **1 chạm** từ màn Hôm nay.
- Nhiệm vụ tự động tự đánh dấu khi dữ liệu sức khoẻ về, không cần mở app.
- Hẹn giờ tập trung vẫn chạy đúng khi khoá màn hình (dùng thông báo cục bộ đặt lịch).

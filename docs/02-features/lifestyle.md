# Module: Health tracking (Sức khoẻ)

**Trạng thái:** 🟧 Thiết kế nháp · **Ưu tiên:** Must – làm hoàn chỉnh (D-012)

Gồm: **Giấc ngủ, Nước, Cân nặng**, cộng **Vận động** đọc từ thiết bị. Lượng nạp vào nằm ở `nutrition.md`. Đọc sách, giới hạn MXH, cardio ngoài gym để sau MVP.

## 1. Mô hình dữ liệu chuẩn (D-019)

Mọi chỉ số sức khoẻ, dù từ nguồn nào, đều đi vào **một dạng chung**:

| Trường | Ý nghĩa |
|---|---|
| `type` | `weight`, `sleep_session`, `water`, `steps`, `active_energy`, `resting_hr`… |
| `value` + `unit` | Luôn quy về đơn vị chuẩn: kg, phút, ml, kcal, bpm |
| `start_at`, `end_at` | Thời điểm (UTC); `end_at` cho dữ liệu có khoảng như giấc ngủ |
| `source` | `manual`, `apple_health`, (sau này) `garmin`, `google_fit`… |
| `source_id` | Mã bản ghi ở nguồn gốc – dùng để **không nhập trùng** |
| `metadata` | Phần riêng: chất lượng ngủ 1–5, các giai đoạn ngủ… |

- **Nhập tay làm trước**; nguồn thiết bị chỉ là thêm một "adapter" ghi vào cùng bảng.
- **Apple Watch** ghi vào Apple Health. **Garmin Forerunner** đồng bộ được sang Apple Health qua app Garmin Connect ⇒ trên iOS, **một adapter Apple Health phủ được cả hai**.
- Trùng dữ liệu (vừa nhập tay vừa có từ đồng hồ): ưu tiên **thiết bị > nhập tay**, người dùng có thể đổi.
- **Tổng theo ngày** (`daily_health_summary`) được tính sẵn từ bảng gốc để vẽ biểu đồ tuần/tháng/năm nhanh (D-018).

## 2. Cân nặng (D-020)

**Cập nhật ngắn hạn có lợi hơn không?** – Có, nhưng với **xu hướng**, không phải từng lần cân:
- Cân nặng có thể lệch **±1–2 kg chỉ trong một ngày** (nước, muối, thức ăn trong ruột).
- Nếu chỉnh TDEE theo từng lần cân, mục tiêu kcal sẽ nhảy loạn và người dùng mất niềm tin.
- Cách đúng: **cân thường xuyên**, app tính **cân nặng xu hướng** (trung bình trượt có trọng số) mỗi ngày, và **chỉ chỉnh mục tiêu mỗi tuần một lần**.

**Thiết kế:**
- App gợi ý: **cân mỗi sáng** sau khi đi vệ sinh, trước khi ăn; tối thiểu **3 lần/tuần**.
- Nhắc cân theo lịch người dùng chọn (mặc định 7:00 các ngày đã chọn); không nhắc nếu đã có dữ liệu từ cân thông minh qua Apple Health.
- Biểu đồ hiện cả **điểm cân thật** (chấm mờ) và **đường xu hướng** (đường đậm).
- **Mỗi Chủ nhật**: nếu đủ ≥ 4 lần cân trong 14 ngày và ≥ 10 ngày có ghi ăn → tính lại TDEE, báo cho người dùng: "TDEE của bạn được chỉnh từ 2.350 → 2.280 kcal vì…".
- Thiếu dữ liệu → **giữ nguyên** mục tiêu và nhắc người dùng cân/ghi ăn đều hơn.

## 3. Giấc ngủ

- **Nhập tay** (mỗi sáng, 1 màn): giờ đi ngủ, giờ dậy (mặc định theo hôm qua), chất lượng 1–5 sao.
- **Apple Health**: đọc phiên ngủ (Apple Watch, Garmin…) – tự điền, người dùng chỉ chấm chất lượng.
- **Mục tiêu**: thời lượng theo tuổi (người lớn 7–9 giờ, người dùng chỉnh được) và **giờ dậy đều đặn** (lệch ≤ 30 phút so với giờ mục tiêu).
- Chỉ số: thời lượng, độ đều giờ dậy (7 ngày), chất lượng trung bình.

## 4. Nước

- **Mục tiêu** mặc định ≈ **35 ml/kg** cân nặng, cộng thêm ngày tập (≈ +500 ml); người dùng chỉnh được.
- **Ghi 1 chạm**: nút ly đặt sẵn (250 ml, 500 ml, chai tự đặt). Nhấn giữ để chọn ly khác.
- **Nhắc thông minh** thay vì cố định 10–15 phút (mâu thuẫn C3):
  - Chỉ nhắc trong **giờ thức** (từ giờ dậy đến 1 tiếng trước giờ ngủ).
  - Khoảng cách nhắc tuỳ **lượng còn thiếu so với tiến độ** trong ngày: đang chậm thì nhắc dày hơn (tối thiểu 45 phút), đủ rồi thì ngừng.
  - Mức huấn luyện viên (`gamification.md`) quyết định độ dày nhắc.
- Đồ uống ghi ở Nutrition (cà phê, trà sữa) **không** tự cộng vào nước trong MVP, để tránh phức tạp.

## 5. Vận động (chỉ đọc từ thiết bị)

- Bước chân, năng lượng vận động từ Apple Health → hiển thị trên màn Hôm nay và dùng cho mục 7 trong `nutrition.md`.
- Không nhập tay trong MVP.

## Câu hỏi mở

Xem `01-discovery/open-questions.md`: **LS-5**, **LS-6** (sau MVP).

## Tiêu chí chấp nhận (bản nháp)

- Ghi nước ≤ **1 chạm**; ghi giấc ngủ ≤ **3 chạm**; ghi cân nặng ≤ **3 chạm**.
- Cùng một phiên ngủ từ Apple Health không bị nhập trùng khi đồng bộ lại.
- Mục tiêu kcal **không đổi** giữa các ngày trong tuần, trừ khi người dùng tự sửa.

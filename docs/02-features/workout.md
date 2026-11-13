# Module: Workout

**Trạng thái:** ❓ Đang làm rõ · **Ưu tiên đề xuất:** Must

## Mục tiêu

Hướng dẫn người dùng tập đúng khối lượng trong từng buổi và tự động ghi lại mọi set/rep/tạ, để theo thời gian có lịch sử đầy đủ và tiến bộ đều.

## Định hướng đã chốt

- **App tự sinh giáo án** theo logic khoa học (D-008): có **lộ trình dài hạn** (nhiều tuần, tăng tải dần) và **kế hoạch ngắn hạn** (tuần này), **ưu tiên ngắn hạn** nhưng phải nhất quán với dài hạn.
- Phục vụ **mọi trình độ** (D-006): trình độ xác định ở onboarding quyết định khối lượng, độ khó, mức tạ khởi điểm.
- Workout là **một trụ cột**, không còn là trung tâm app (D-005).
- Hỗ trợ **gym, tại nhà, calisthenics** (D-028).

## Thiết kế (bản nháp sau vòng 3)

### Hồ sơ dụng cụ

| Hồ sơ | Có gì |
|---|---|
| 🏋️ Phòng gym | Máy, tạ đòn, cáp, tạ đơn |
| 🏠 Tại nhà có dụng cụ | Tạ đơn, dây kháng lực, xà đơn (chọn những gì có) |
| 🤸 Calisthenics / không dụng cụ | Trọng lượng cơ thể, sàn, xà nếu có |

- Một người có thể có **nhiều hồ sơ** (gym ngày thường, nhà cuối tuần).
- Khi bắt đầu buổi, chọn hồ sơ → app **thay bài tương đương** theo cùng nhóm cơ và kiểu chuyển động.

### Sinh giáo án (D-008)

- **Đầu vào**: mục tiêu, trình độ, số ngày/tuần, thời lượng mỗi buổi, hồ sơ dụng cụ, nhóm cơ ưu tiên.
- **Lịch chia nhóm cơ** chọn theo số ngày tập: 2–3 ngày → toàn thân; 4 ngày → thân trên / thân dưới; 5–6 ngày → đẩy / kéo / chân.
- **Dài hạn**: chu kỳ 8–12 tuần chia thành các khối; giảm tải (deload) mỗi 4–6 tuần, hoặc sớm hơn khi readiness thấp nhiều ngày.
- **Ngắn hạn**: tuần hiện tại chi tiết từng buổi; được điều chỉnh mỗi tuần theo kết quả thực tế.
- **Tăng tải (double progression)**: khi mọi set đạt **đỉnh** khoảng rep → buổi sau tăng **bước tạ nhỏ nhất** của dụng cụ đó.
  - Máy: thường 5 kg.
  - Tạ đơn: 1–2 kg.
  - Calisthenics: đạt tiêu chí → lên bậc khó hơn (cây kỹ năng, `signature-features.md` §8).
- **Autoregulation trong buổi**: ngưỡng tăng/giảm tạ lấy theo **khoảng rep của từng bài**, không viết cứng số. Bản cũ viết cứng `> 14`, không làm lại lỗi này.
- **Readiness**: buổi tập được đề xuất nhẹ hoặc nặng hơn theo giấc ngủ và ăn uống (`signature-features.md` §5).

### Bổ sung beta (D-048) – nguồn khoa học ở `feature-backlog.md`

- **WRK-13 · Ngưỡng khối lượng:**
  - bản đồ "Khối lượng tuần" có 3 vùng: dưới mức kích thích / hiệu quả / nguy cơ quá tải;
  - mặc định 10–20 set hiệu quả/tuần/nhóm cơ, người mới bắt đầu ở mức thấp;
  - app chỉnh dần theo tiến bộ và readiness.
- **WRK-14 · RIR / RPE:**
  - sau mỗi set có hàng nút 0–4+ "còn mấy rep"; không bắt buộc;
  - có RIR thì tự chỉnh tạ dùng RIR thay cho chỉ đếm rep.
- **WRK-15 · Lịch xoay vòng:**
  - lộ trình chọn được "Theo thứ trong tuần" hoặc "Xoay vòng A → B → C";
  - xoay vòng thì buổi lỡ không mất, chỉ lùi sang lần mở app kế tiếp;
  - vẫn đảm bảo mỗi nhóm cơ ≥ 2 lần/tuần khi đủ số buổi.
- **WRK-16 · Thời gian nghỉ mặc định:**
  - bài đa khớp 120–180 giây, bài đơn khớp 60–90 giây;
  - người dùng sửa được từng bài.
- **WRK-17 · Bài dự phòng:**
  - mỗi bài trong giáo án có một bài thay thế cùng kiểu chuyển động, chọn sẵn;
  - chạm "Máy đang bận" → đổi ngay, giữ set/rep/RIR mục tiêu.
- **WRK-18 · Hồ sơ phòng gym:**
  - mỗi hồ sơ lưu thanh đòn, bánh tạ có sẵn, bước tạ thật của từng máy;
  - tạ gợi ý luôn làm tròn theo bước có thật;
  - máy tính lắp bánh tạ cho thanh đòn / EZ / máy Smith.
- **WRK-19 · Tải đặc biệt:**
  - tạ đeo thêm (cộng vào cân nặng cơ thể cho bài nhún xà, kéo xà);
  - ghi rep riêng trái / phải;
  - dây kháng lực nhiều sợi (màu / mức lực).
- **WRK-20 · 7 giáo án mẫu:** soạn theo nguyên tắc ở `feature-backlog.md` §6, là dữ liệu khởi tạo cho bộ sinh giáo án; người dùng chọn rồi chỉnh.
- **WRK-07 (bổ sung):** 1RM ước tính chỉ tính từ set ≤ 10 rep, vì công thức kém chính xác ở rep cao.

### Ghi kết quả

- Bài có tạ: kg × rep.
- Bài trọng lượng cơ thể: rep, kèm bậc.
- Bài giữ: giây (plank, L-sit).
- Cardio: phút, tuỳ chọn tốc độ / độ dốc.
- Đồng hồ nghỉ dùng thông báo cục bộ đặt lịch, nên vẫn báo khi khoá màn hình.

## Nghiệp vụ đã biết (từ ý tưởng cũ)

**Giáo án**
- Hệ thống đề xuất **giáo án tuần mặc định** (ví dụ Pull / Push / Legs), người dùng có thể **tập theo** hoặc **tự tạo giáo án** cho từng ngày.
- Màn hình Workout hiển thị **theo tuần** (Thứ 2 → CN), ngày giờ theo múi giờ Việt Nam.
- Thư viện bài tập lưu trong DB: cơ chính, cơ phụ, dụng cụ, hướng dẫn, ảnh/video.

**Trước khi tập**
- App **gợi ý mức tạ (kg)** cho từng bài, tính theo số đo/cân nặng người dùng (bản cũ: cân nặng × hệ số).
- Bước **pre-setup**: hướng dẫn chỉnh form/máy trước khi vào set chính.

**Trong buổi tập**
- Người dùng tập rồi **nhập số rep đã đạt** cho mỗi set.
- **Autoregulation:** ví dụ Lat Pulldown 8–10 rep
  - Nhập < 8 (ví dụ 5–6) → tạ quá nặng, gợi ý giảm ? kg.
  - Nhập 15–20 → tạ quá nhẹ, gợi ý tăng ? kg.
- Xong set → **đếm ngược nghỉ** (60/90/120s tuỳ bài) → hết giờ **thông báo** vào set tiếp, lặp đến hết bài.
- Buổi tập có **bài mặc định** và **bài extra**:
  - Mệt → giảm bài / giảm set để xong sớm.
  - Sung → thêm bài / thêm set.
- **Swap**: hôm nay muốn tập thanh đòn thay vì máy → đổi sang biến thể tương đương.
- **Cardio cuối buổi**: ví dụ đi bộ dốc 20 phút, dốc 10–12 %, 4.2–4.5 km/h, không vịn tay.

**Ví dụ giáo án Pull day (từ chủ dự án)**

| Bài | Set × Rep | Nghỉ |
|---|---|---|
| Lat Pulldown | 3 × 8–10 | 2 phút |
| Seated Cable Row | 3 × 10–12 | 90 giây |
| Dumbbell Rear Delt Fly | 3 × 12–15 | 60 giây |
| Dumbbell Bicep Curl | 3 × 10–12 | 60 giây |
| Cardio: đi bộ dốc | 20 phút | – |

## Câu hỏi mở

Xem `01-discovery/open-questions.md`: **Q1.7**, **WO-1 → WO-10**.

## Luồng người dùng
_Điền sau Discovery._

## Quy tắc nghiệp vụ
_Điền sau Discovery (công thức tạ gợi ý, ngưỡng autoregulation, mức tăng/giảm kg, quy tắc swap, progressive overload…)._

## Dữ liệu cần lưu
_Điền sau Discovery._

## Tiêu chí chấp nhận
_Điền sau Discovery._

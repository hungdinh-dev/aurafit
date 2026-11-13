# Tính năng "chữ ký" – điểm khác biệt của AuraFit (D-030)

Mục tiêu: những thứ các app đếm calo hoặc app gym phổ biến **thường không có**, hoặc có nhưng **không gộp lại thành một trải nghiệm**. Phần lớn chạy bằng **luật**, không tốn AI, nên vừa ấn tượng vừa rẻ.

## Tổng quan

| # | Tính năng | Vì sao ấn tượng | Công sức | Đề xuất ❓ Q4.6 |
|---|---|---|---|---|
| 1 | **Nhân vật Kai / Mira** sống theo dữ liệu thật (hào quang + nét mặt) | Gắn bó cảm xúc; mở app để xem nhân vật hôm nay thế nào | Vừa | Beta (hình tĩnh) → động sau |
| 2 | **"Về đích ngày…"** + **báo giá ngày tự do** | Biến kcal khô khan thành **thời gian** dễ hiểu | Thấp | Beta |
| 3 | **Ngân sách tuần** (bù ngày tự do) | Linh hoạt mà vẫn đúng lộ trình | Thấp | Beta |
| 4 | **"Ăn gì bây giờ?"** | Gợi ý từ chính món của bạn theo macro còn thiếu, 0 AI | Thấp | Beta |
| 5 | **Readiness** – buổi tập tự điều chỉnh theo giấc ngủ & ăn uống | Việc chỉ PT thật mới làm | Thấp–Vừa | Beta (cùng M5) |
| 6 | **Nhiệm vụ huấn luyện viên + Boss tuần** | Dopamine mỗi ngày, mục tiêu tuần rõ ràng, vui | Thấp | Beta |
| 7 | **Story bữa ăn + Streak đôi** với bạn bè | Áp lực xã hội tích cực trong nhóm nhỏ | Vừa | Beta (bản gọn) |
| 8 | **Cây kỹ năng calisthenics** | RPG thật sự cho người tập tại nhà | Vừa | v1.1, hoặc beta nếu kịp |
| 9 | **Widget màn hình khoá + Live Activity** (đồng hồ nghỉ trên Dynamic Island, kcal còn lại) | App "sống" cả ngoài app | Vừa–Cao (code native) | v1.1 |
| 10 | **AuraFit Wrapped** (tổng kết tháng/năm dạng story) | Chia sẻ lan truyền | Vừa | v1.2 |
| 11 | **Ảnh tiến độ có "bóng mờ"** căn đúng tư thế lần trước | So sánh trước – sau chuẩn xác | Vừa | v1.2 |
| 12 | **Bản đồ cơ 3D** mỏi / hồi phục | Ý tưởng gốc, rất ấn tượng | Cao | Sau v1 |

## Chi tiết

### 2. "Về đích ngày…" & báo giá ngày tự do
- Từ cân nặng xu hướng và tốc độ 4 tuần gần nhất: **"Với nhịp hiện tại, bạn chạm 65 kg vào khoảng 14/03."** Con số cập nhật mỗi ngày.
- Trước khi bật ngày tự do, app **báo giá**: "Ước tính +1.100 kcal → về đích muộn ~2 ngày. Hoặc bù trong tuần: các ngày còn lại −180 kcal."
- Công thức: số ngày muộn ≈ kcal vượt ÷ mức thâm hụt (hoặc thặng dư) mỗi ngày.

### 3. Ngân sách tuần
- Ngoài mục tiêu ngày, app giữ một **ngân sách kcal cả tuần**.
- Ăn quá hôm nay → các ngày còn lại tự giảm nhẹ: tối đa −10 %/ngày, không dưới sàn an toàn.
- Ăn ít hơn → **không** cộng dồn để ăn bù quá đà (tránh vòng lặp ăn kiêng – ăn bù).

### 4. "Ăn gì bây giờ?"
- Nút trên thẻ Dinh dưỡng: lấy kcal và protein **còn lại**, tìm trong **Món của tôi + Gần đây** 1–2 món hoặc combo vừa nhất, theo khung giờ.
- Ví dụ: "Còn 520 kcal / 42 g protein → Ức gà áp chảo + cơm ½ bát (510 kcal, 45 g)".
- Chạy bằng luật trên máy, **không tốn AI**.

### 5. Readiness
- Mỗi sáng có điểm sẵn sàng 0–100, tính từ: giấc ngủ so với mục tiêu, chất lượng ngủ, ăn uống hôm qua (kcal, protein), khối lượng tập 3 ngày gần nhất, nhịp tim nghỉ (nếu có từ đồng hồ).
- Readiness < 50 → đề xuất buổi nhẹ hơn (bớt 1 set mỗi bài, hoặc đổi sang giãn cơ).
- Readiness ≥ 80 → "Hôm nay hợp để thử PR".
- Người dùng chọn **Nhận** hoặc **Bỏ qua**.

### 7. Story bữa ăn & Streak đôi
- Bạn bè (đã kết bạn) thấy các bữa **hôm nay** của nhau. Qua ngày, bữa ăn chỉ còn trong nhật ký riêng của chủ.
- Thả cảm xúc; không có bình luận trong MVP.
- Streak đôi: xem `gamification.md` §10.

### 8. Cây kỹ năng calisthenics
- Mỗi nhánh là một chuỗi bậc tiến:
  - **Đẩy**: hít đất tựa tường → hít đất quỳ gối → hít đất → kim cương → archer → một tay.
  - **Kéo**: kéo xà úc → kéo xà có hỗ trợ → kéo xà → …
  - **Chân**, **Core**, **Kỹ năng**: trồng chuối, L-sit…
- Mở khoá bậc tiếp khi đạt tiêu chí, ví dụ **3 × 12 rep đúng form**, hoặc giữ 30 giây.
- Lên bậc → màn tuyên dương + tăng chỉ số Sức mạnh; giáo án tự dùng bậc mới.

### 9. Widget & Live Activity
- Widget màn hình khoá: vòng kcal còn lại, Auri, streak.
- Live Activity trong buổi tập: đồng hồ nghỉ đếm ngược trên Dynamic Island, set tiếp theo.
- Cần phần mở rộng native cho iOS. Để sau beta, nhưng thiết kế dữ liệu sẵn từ đầu.

## Nguyên tắc

- Cơ chế (streak, boss, linh vật, story) là các ý tưởng game hoá phổ biến. AuraFit dùng **tên, hình ảnh và linh vật của riêng mình**, không sao chép app khác.
- Mỗi tính năng phải gắn với **một hành vi sức khoẻ thật**. Không có điểm "ảo" chỉ để bấm.

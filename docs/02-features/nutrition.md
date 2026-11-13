# Module: Nutrition ⭐ (tính năng lõi)

**Trạng thái:** 🟧 Thiết kế nháp · **Ưu tiên:** Must (D-005, D-012)

## Mục tiêu

Người dùng biết **mình đã ăn bao nhiêu** và **còn được ăn bao nhiêu** so với mục tiêu, gần như không phải nhập liệu: chụp ảnh, hoặc chọn lại món đã có.

## 1. Mục tiêu dinh dưỡng

### Mục tiêu và tốc độ (D-013)

| Mục tiêu (✅ D-024) | Tốc độ người dùng chọn | "Để app quyết định" |
|---|---|---|
| Giảm mỡ | Nhẹ −0,25 kg/tuần · Vừa −0,5 · Nhanh −0,75 | App chọn theo % mỡ, trình độ, lịch sử tuân thủ |
| Giữ cân | – | – |
| Tăng cơ | Nhẹ +0,1 kg/tuần · Vừa +0,25 · Nhanh +0,4 | App chọn theo trình độ tập |

### Cách tính

1. **BMR**: Mifflin-St Jeor (giới tính, tuổi, chiều cao, cân nặng).
2. **TDEE ban đầu** = BMR × hệ số vận động (chọn ở onboarding).
3. **Mục tiêu kcal** = TDEE + chênh lệch theo tốc độ (≈ 7.700 kcal cho 1 kg mỡ ⇒ −0,5 kg/tuần ≈ −550 kcal/ngày).
4. **Sàn an toàn**: không bao giờ gợi ý dưới max(BMR, 1.200 kcal nữ / 1.500 kcal nam).
5. **Macro**:
   - Protein: 1,6–2,2 g/kg (giảm mỡ lấy mức cao).
   - Fat: ≥ 0,6 g/kg.
   - Carb: phần kcal còn lại.
   - Đường thêm vào: ≤ 10 % kcal.
6. **TDEE thích ứng**: mỗi tuần so cân nặng xu hướng với lượng ăn thực tế để hiệu chỉnh TDEE (xem `lifestyle.md` → Cân nặng). Mỗi lần chỉ chỉnh tối đa ±150 kcal.
7. **Ngày tập / vận động nhiều**: cộng thêm một phần năng lượng vận động (lấy từ Apple Health khi có).

## 2. Chất theo dõi (D-015)

| Bắt buộc | Tuỳ chọn (bật trong Cài đặt) |
|---|---|
| kcal, protein, carb, fat, **đường** | chất xơ, natri |

**Thêm chất có phải chụp nhiều ảnh hơn không? – Không.**
- Một lần gọi AI trả về **mọi chất** cho cả bữa; thêm chất chỉ làm câu trả lời dài thêm vài dòng, chi phí tăng không đáng kể.
- Độ chính xác giảm khi **món trộn lẫn** (bún, lẩu, cơm đĩa), không phải vì theo dõi nhiều chất.
- **Natri** gần như không thể đoán từ ảnh (nước mắm, nước dùng) ⇒ luôn gắn nhãn **"ước tính thô"**.
- App luôn lưu đủ mọi chất; bật/tắt chỉ ảnh hưởng hiển thị, nên bật lên sau vẫn có dữ liệu cũ.

## 3. Năm cách ghi món (D-016)

Sắp theo thứ tự hiển thị trên màn **Thêm món** – cách rẻ và nhanh nhất đứng trước:

| # | Cách | Chi phí AI | Khi nào dùng |
|---|---|---|---|
| 1 | **Gần đây / Lặp lại bữa** ("Như bữa sáng hôm qua") | 0 | Ăn giống hôm trước |
| 2 | **Món của tôi** (thư viện đã lưu) | 0 | Cà phê sáng, bữa quen |
| 3 | **Quét mã vạch** (cơ sở dữ liệu thực phẩm mở) | 0 | Đồ đóng gói |
| 4 | **Mô tả chữ / giọng nói** ("2 trứng luộc, 1 bát cơm") | Thấp (chỉ chữ) | Không tiện chụp |
| 5 | **Chụp ảnh** | Cao nhất | Món mới |

### "Món của tôi" (D-017)

- Sau khi xác nhận bất kỳ món nào → có nút **☆ Lưu vào Món của tôi** (đặt tên: "Cà phê sữa sáng").
- Lưu được **món đơn** hoặc **cả bữa** (combo nhiều món).
- Danh sách sắp theo **số lần dùng** và **khung giờ**: buổi sáng thì cà phê sáng lên đầu.
- Ghi món từ thư viện = **1 chạm**, có thể chỉnh khẩu phần (×0,5 / ×1 / ×1,5 / ×2).
- App tự **gợi ý lưu** khi một món giống nhau được ghi ≥ 2 lần.

## 4. Luồng chụp ảnh với hỏi lại tiết kiệm (D-014)

```text
Chụp / chọn ảnh → nén ~1024px → gửi Edge Function analyze-meal
AI trả về MỘT lần duy nhất:
  - danh sách món + khẩu phần ước tính + đủ chất + độ tin cậy
  - tối đa 3 câu hỏi làm rõ, MỖI đáp án kèm sẵn mức điều chỉnh
      ví dụ: "Cỡ bát?"  [Nhỏ −120 kcal] [Vừa 0] [Lớn +150 kcal]
             "Có thêm quẩy?" [Không 0] [Có +230 kcal]
Người dùng bấm đáp án → app cộng/trừ NGAY TRÊN MÁY (không gọi AI lần 2)
Chỉnh khẩu phần nếu cần → Lưu (→ gợi ý ☆ Lưu vào Món của tôi)
```

- Độ tin cậy thấp → nhãn "AI không chắc chắn" và mở sẵn phần chỉnh.
- Chỉ khi người dùng bấm **"Phân tích lại"** mới gọi AI lần 2 (có thể dùng mô hình mạnh hơn, D-022).

## 5. Chia sẻ món ăn theo ngày (D-025)

- **Dòng thời gian ảnh trong ngày** của chính mình: luôn có.
- **Story bữa ăn**: chỉ **bạn bè đã kết bạn** thấy các bữa **hôm nay**; qua ngày thì bữa ăn chỉ còn trong nhật ký riêng.
- Mặc định **không chia sẻ**; người dùng bật một lần trong Cài đặt, và có thể ẩn từng bữa.
- Bạn bè thả cảm xúc; không có bình luận trong MVP.

## 6. Màn hình chính của module

| Màn | Nội dung |
|---|---|
| **Hôm nay → thẻ Dinh dưỡng** | Vòng kcal còn lại; thanh protein / carb / fat / đường; nút **+** lớn |
| **Thêm món** | 5 cách ghi món theo thứ tự ở mục 3; ô tìm kiếm chung |
| **Xác nhận món** | Ảnh, danh sách món, câu hỏi làm rõ, chỉnh khẩu phần, ☆ lưu |
| **Nhật ký ngày** | Dòng thời gian các bữa (ảnh); tổng chất; sửa/xoá |
| **Món của tôi** | Danh sách, sửa, gộp bữa |

## 7. Ngày tự do & ngân sách tuần (D-026)

- Người dùng đặt **0–3 ngày tự do/tuần** (❓ Q4.4); luật chấm điểm ở `gamification.md` §7.
- **Báo giá trước khi bật**: "≈ +1.100 kcal → về đích muộn ~2 ngày", tính bằng kcal vượt ÷ mức thâm hụt mỗi ngày.
- **Hai chế độ:**
  - **Bù trong tuần**: các ngày còn lại tự giảm mục tiêu tối đa −10 %/ngày, không dưới sàn an toàn ⇒ ngày về đích giữ nguyên.
  - **Không bù**: mục tiêu các ngày khác giữ nguyên; ngày về đích lùi lại và hiện rõ trong tổng kết tuần.
- Ăn ít hơn mục tiêu **không** được cộng dồn thành "quỹ" để ăn bù quá đà.

## 8. "Ăn gì bây giờ?" và "Về đích ngày…"

Xem `signature-features.md` mục 2 và 4: gợi ý món từ thư viện của chính người dùng theo macro còn thiếu (0 AI), và dự báo ngày đạt mục tiêu cân nặng.

## Câu hỏi mở

Xem `01-discovery/open-questions.md`: **Q4.4**, **NU-3**.

## Dữ liệu cần lưu (bản nháp)

- `meal_entries`: người dùng, thời điểm, bữa, nguồn ghi (photo / text / library / barcode / repeat), ảnh, trạng thái AI.
- `meal_items`: món trong bữa; khẩu phần; kcal, protein, carb, fat, sugar, fiber, sodium; độ tin cậy.
- `saved_foods` / `saved_meals`: thư viện "Món của tôi", số lần dùng, khung giờ hay dùng.
- `nutrition_targets`: mục tiêu theo ngày hiệu lực (giữ lịch sử khi TDEE đổi).
- `ai_requests`: nhật ký gọi AI (mô hình, token, chi phí) để theo dõi ngân sách.

## Tiêu chí chấp nhận (bản nháp)

- Ghi một món từ "Món của tôi" ≤ **2 chạm**.
- Từ lúc chụp đến lúc lưu ≤ **15 giây** với món rõ ràng.
- Trả lời câu hỏi làm rõ **không** phát sinh lượt gọi AI mới.
- Mục tiêu kcal không bao giờ thấp hơn sàn an toàn.

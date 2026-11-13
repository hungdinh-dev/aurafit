# AuraFit – Tài liệu tổng hợp

> Một file duy nhất tóm toàn bộ dự án: là gì, làm những chức năng nào (chi tiết), giao diện, công nghệ, database, lộ trình. Chi tiết sâu hơn nằm trong các file được link ở cuối.
> Cập nhật: 13/11/2026 · Trạng thái: **đã xong thiết kế, chưa viết code** (bước tiếp theo: M0).

---

## 1. Thông tin nhanh

| | |
|---|---|
| **Sản phẩm** | App sức khoẻ hằng ngày được game hoá: ăn uống, ngủ, nước, cân nặng, tập luyện, thói quen |
| **Tính năng lõi** | Chụp ảnh bữa ăn → AI ước tính kcal/macro → so với TDEE và mục tiêu |
| **Người dùng** | Mọi trình độ; beta cho bạn + 5–10 người bạn |
| **Nền tảng** | iOS trước, phát qua TestFlight (cần Apple Developer 99 USD/năm) |
| **Ngôn ngữ** | Tiếng Việt + tiếng Anh từ đầu, thêm ngôn ngữ sau |
| **Định hướng** | Dùng cá nhân trước, kinh doanh sau |
| **Giao diện** | Chuẩn Apple HIG, Liquid Glass, tối giản; nhân vật Kai (nam) / Mira (nữ) |
| **Công nghệ** | Expo + Expo Router + TypeScript · Supabase · AI qua Gemini rẻ (đổi được) |
| **Quy mô beta** | 61 chức năng, 8 mốc M0 → M7 |

---

## 2. Tầm nhìn

**Vấn đề cần giải quyết**
- Đếm calo thủ công mệt nên người dùng bỏ.
- Không ai tính TDEE riêng cho mình.
- Ăn, ngủ, uống nước, tập nằm rải rác ở nhiều app.
- Thiếu động lực và kỷ luật.
- Người mới không biết tập gì, tập bao nhiêu.

**Vòng lặp mỗi ngày**

```text
Sáng   → mở "Hôm nay": mục tiêu kcal, giấc ngủ đêm qua, buổi tập, nhiệm vụ
Mỗi bữa → chụp ảnh / chọn lại món → xác nhận 1 chạm → còn lại bao nhiêu kcal
Tập    → theo giáo án, ghi set → app chỉnh tạ cho lần sau
Tối    → điểm ngày, streak, nhân vật sáng lên hoặc mệt đi
Tuần   → tổng kết, TDEE được hiệu chỉnh, giáo án tuần sau, Boss tuần mới
```

**Nguyên tắc**
1. Nhập liệu gần như bằng không.
2. AI chỉ gợi ý, người dùng quyết định.
3. Có thúc ép nhưng không gắt.
4. Mọi con số đều giải thích được.
5. Dữ liệu sức khoẻ mặc định riêng tư.

---

## 3. Phạm vi

| Trong beta | Sau beta |
|---|---|
| Onboarding & hồ sơ | Sign in with Apple (bắt buộc trước khi lên App Store) |
| **Dinh dưỡng** (lõi) | Widget màn hình khoá, Live Activity |
| Sức khoẻ: ngủ, nước, cân nặng, Apple Health | Nhân vật hoạt hình + trang phục |
| Daily Tasks (chất lượng sống) | AuraFit Wrapped tháng/năm |
| Huấn luyện viên (game hoá) | Ảnh tiến độ, tuổi tim mạch |
| Tập luyện: gym, nhà, calisthenics, thư viện 90 bài, **bản đồ hồi phục cơ 2D** | Bản đồ cơ **3D**, cây kỹ năng calisthenics đầy đủ |
| Hôm nay & Tiến độ | Android, diễn đàn, chat, phòng gym, gói trả phí |
| Bạn bè: kết bạn, story bữa ăn, streak đôi | |

---

## 4. Chi tiết chức năng

Ký hiệu: **Mốc** = mốc triển khai · **DB** = bảng dữ liệu chính.

### 4.1 Onboarding & Hồ sơ

**ONB-01 · Đăng nhập** – M0 · DB `profiles`
- Đăng nhập bằng Google hoặc email nhận mã OTP.
- Phiên đăng nhập lưu an toàn (SecureStore), không phải đăng nhập lại.
- Sign in with Apple thêm trước khi lên App Store.

**ONB-02 · Ngôn ngữ** – M0
- Theo ngôn ngữ của máy, đổi được Việt / Anh trong Cài đặt.
- Không có chữ nào viết cứng trong code.

**ONB-03 · Onboarding ngắn** – M1 · DB `profiles`, `goals`
- Khoảng 60 giây: giới tính, ngày sinh, chiều cao, cân nặng, mức vận động, mục tiêu.
- **Mục tiêu**: giảm mỡ / giữ cân / tăng cơ.
- **Tốc độ**: người dùng chọn (ví dụ −0,25 / −0,5 / −0,75 kg/tuần) hoặc "Để app quyết định".
- Hiện ngay mục tiêu kcal/macro kèm giải thích.

**ONB-04 · Chọn huấn luyện viên** – M1 · DB `coach_settings`
- **Mức khắt khe**: Nhẹ nhàng / Tiêu chuẩn / Khắc nghiệt – quyết định luật chấm điểm.
- **Giọng văn**: Bestie (Gen Z, mặc định) / Coach (gọn) / Drama (làm quá kiểu meme) – quyết định cách app nói.
- Xem ví dụ câu thông báo ngay khi chọn.

**ONB-05 · Chọn nhân vật** – M1 · DB `profiles`
- Kai (nam) hoặc Mira (nữ), chọn tự do, đặt lại tên được, đổi bất cứ lúc nào.

**ONB-06 · Hỏi dần** – M1–M5
- Những gì không cần ngay thì hỏi đúng lúc: hồ sơ dụng cụ (khi mở tab Tập), % mỡ, kết nối Apple Health, số ngày tự do.

### 4.2 Dinh dưỡng ⭐ (tính năng lõi)

**NUT-01 · Mục tiêu kcal/macro** – M1 · DB `nutrition_targets`
- **BMR** theo công thức Mifflin-St Jeor; **TDEE** = BMR × hệ số vận động.
- **Mục tiêu kcal** = TDEE ± mức chênh theo tốc độ (−0,5 kg/tuần ≈ −550 kcal/ngày).
- **Sàn an toàn**: không bao giờ dưới BMR hoặc 1.200 (nữ) / 1.500 (nam) kcal.
- **Protein** 1,6–2,2 g/kg; fat ≥ 0,6 g/kg; carb là phần còn lại; đường thêm vào ≤ 10 % kcal.
- Lưu lịch sử mỗi lần mục tiêu thay đổi.

**NUT-02 · Ghi món bằng ảnh + AI** – M2 · DB `meal_entries`, `meal_items`, `ai_requests`
- Chụp hoặc chọn ảnh → nén ~1024 px → server gọi mô hình AI rẻ (dòng Gemini Flash).
- AI trả về: danh sách món, khẩu phần, kcal, protein, carb, fat, đường, xơ, natri, độ tin cậy.
- Mỗi người có hạn mức ảnh/ngày (mặc định 15) để kiểm soát chi phí.
- Khoá API chỉ nằm ở server, không nằm trong app.

**NUT-03 · Câu hỏi làm rõ** – M2
- AI hỏi tối đa 3 câu (ví dụ "Cỡ bát?", "Có quẩy?"), **trả về cùng lần gọi đầu**.
- Mỗi đáp án kèm sẵn mức chênh kcal, nên người dùng bấm là app cộng/trừ ngay, **không tốn thêm lượt gọi AI**.
- Nút "Phân tích lại" mới gọi AI lần 2 (có thể dùng mô hình mạnh hơn).

**NUT-04 · Mô tả bằng chữ / giọng nói** – M2
- Ví dụ "2 trứng luộc, 1 bát cơm" → AI chỉ đọc chữ, rẻ hơn ảnh.

**NUT-05 · Món của tôi** – M2 · DB `saved_foods`, `saved_food_items`
- Lưu món hoặc cả bữa (combo) sau khi xác nhận.
- Lần sau chọn lại bằng 1 chạm, chỉnh khẩu phần ×0,5 / ×1 / ×1,5 / ×2.
- Sắp theo số lần dùng và khung giờ (buổi sáng thì "Cà phê sữa đá" lên đầu).
- App tự gợi ý lưu khi một món được ghi từ 2 lần.

**NUT-06 · Gần đây / Lặp lại bữa** – M2
- "Như bữa tối hôm qua" – 1 chạm, 0 AI.

**NUT-07 · Quét mã vạch** – M2 · DB `barcode_products`
- Tra cơ sở dữ liệu thực phẩm mở, lưu cache dùng chung, 0 AI.

**NUT-08 · Nhật ký ngày** – M2
- Dòng thời gian các bữa có ảnh; sửa / xoá; chọn ngày trong tuần.

**NUT-09 · Ngày tự do (cheat day)** – M2 · DB `free_days`
- Người dùng tự đặt **0–3 ngày/tuần**.
- **Báo giá trước khi bật**: "≈ +1.100 kcal → về đích muộn ~2 ngày".
- **Bù trong tuần** (mặc định): các ngày còn lại giảm tối đa 10 %/ngày, ngày về đích giữ nguyên.
- Vượt số ngày đã đặt thì bị trừ điểm theo mức khắt khe; có thể dùng khiên để biến thành ngày tự do hợp lệ.

**NUT-10 · "Ăn gì bây giờ?"** – M2
- Lấy kcal và protein còn lại, gợi ý 1–2 món hoặc combo **từ chính Món của tôi**, 0 AI.

**NUT-11 · Ngân sách tuần** – M2
- Giữ tổng kcal cả tuần. Ăn ít hơn **không** cộng dồn để ăn bù quá đà.

**NUT-12 · Chất xơ, natri** – M2
- Bật/tắt hiển thị; dữ liệu luôn được lưu. Natri gắn nhãn "ước tính thô".

### 4.3 Sức khoẻ

**HLT-01 · Nước** – M3 · DB `health_samples`
- Mục tiêu ≈ 35 ml/kg (+500 ml ngày tập); ghi 1 chạm (250 / 500 ml).
- **Nhắc thông minh**: chỉ trong giờ thức, dày hơn khi đang chậm tiến độ (tối thiểu 45 phút), ngừng khi đủ.

**HLT-02 · Cân nặng** – M3 · DB `health_samples`, `daily_summaries`
- Khuyên cân mỗi sáng, ít nhất 3 lần/tuần; nhắc theo lịch.
- Biểu đồ hiện cả điểm cân thật và **đường xu hướng** (cân nặng dao động ±1–2 kg/ngày nên phải xem xu hướng).

**HLT-03 · Tự chỉnh TDEE hằng tuần** – M3
- Mỗi Chủ nhật, nếu đủ dữ liệu (≥ 4 lần cân trong 14 ngày, ≥ 10 ngày có ghi ăn), so xu hướng cân nặng với lượng ăn để chỉnh TDEE.
- Mỗi lần tối đa ±150 kcal, kèm giải thích. Thiếu dữ liệu thì giữ nguyên và nhắc.

**HLT-04 · Giấc ngủ** – M3
- Nhập tay: giờ ngủ, giờ dậy, chất lượng 1–5.
- Mục tiêu 7–9 giờ, giờ dậy lệch ≤ 30 phút.

**HLT-05 · Apple Health** – M3
- Đọc giấc ngủ, bước chân, năng lượng vận động, cân nặng, nhịp tim nghỉ.
- Apple Watch và Garmin (qua Garmin Connect → Apple Health) đều đi qua một cổng nối.
- Chống nhập trùng; ưu tiên dữ liệu thiết bị hơn nhập tay.

**HLT-06 · Tổng hợp theo ngày** – M3 · DB `daily_summaries`
- Mỗi ngày một dòng tổng hợp; tuần / tháng / năm tính từ đây.

### 4.4 Daily Tasks – chất lượng sống

**TSK-01 · Nhiệm vụ 4 loại** – M3 · DB `task_definitions`, `task_logs`
- **Đánh dấu**: thiền, không lướt MXH sau 22h.
- **Đếm**: đọc 20 trang.
- **Hẹn giờ**: làm việc tập trung.
- **Tự động**: 8.000 bước, dậy trước 6:30.
- Tối đa 7 nhiệm vụ đang bật.

**TSK-02 · Làm việc tập trung** – M3 · DB `focus_sessions`
- Hẹn giờ 50/10 ngay trong app, chạy cả khi khoá màn hình.
- Khai báo giờ làm việc để app không nhắc vào lúc đó.

**TSK-03 · Thư viện mẫu** – M3
- Đọc sách (có thể chụp bìa), làm việc tập trung, thiền, giới hạn MXH (tự khai báo), bước chân, dậy sớm, nhiệm vụ tự tạo.

### 4.5 Huấn luyện viên (game hoá)

**COA-01 · Điểm ngày 0–100** – M4 · DB `daily_scores`
- Chốt lúc 03:00 sáng hôm sau, tính ở server.

| Trụ cột | Điểm |
|---|---|
| Dinh dưỡng (ghi đủ, kcal trong khoảng, protein, đường) | 40 |
| Giấc ngủ | 20 |
| Tập luyện (ngày nghỉ theo lịch tự đủ) | 15 |
| Nước | 10 |
| Daily tasks | 10 |
| Cân nặng | 5 |

- ⭐ Xuất sắc ≥ 95 · ✅ Đạt ≥ 70 · ⚠️ Trượt < 70 (ngưỡng theo mức Tiêu chuẩn).

**COA-02 · Streak & khiên** – M4 · DB `coach_state`, `shield_ledger`
- Streak = số ngày liên tiếp đạt ✅.
- Ngày ⭐ được 1 mảnh khiên; 3 mảnh = 1 khiên; giữ tối đa 3; tặng 1 khiên mỗi tháng.
- Khiên dùng để bảo vệ streak hoặc đổi lấy một ngày tự do.

**COA-03 · Level, Aura, chỉ số cứng** – M4 · DB `coach_state`, `stat_snapshots`
- **Level/XP**: không bao giờ mất → tạo dopamine.
- **Aura**: phong độ 30 ngày, **có thể tụt** → tạo áp lực. Bậc màu: Xám → Xanh lá → Xanh dương → Tím → Vàng → Đỏ lửa.
- **8 chỉ số cứng** đo bằng dữ liệu thật: kỷ luật ăn uống, protein, giấc ngủ, nước, chuyên cần tập, sức mạnh, tiến độ cơ thể, phát triển bản thân.

**COA-04 · Nhiệm vụ huấn luyện viên** – M4 · DB `quests`
- 1–3 việc mỗi sáng, nhắm vào chỉ số yếu nhất; chỉ cộng XP, trượt không trừ.

**COA-05 · Boss tuần** – M4 · DB `boss_battles`
- Ví dụ 😈 Quỷ Đường: giữ đường dưới giới hạn 5/7 ngày. Boss có thanh máu; thắng được huy hiệu, mảnh khiên, đồ cho nhân vật.

**COA-06 · Nhân vật Kai / Mira** – M4
- **Hào quang** = bậc Aura.
- **Nét mặt** = dữ liệu hôm nay: rạng rỡ, ngái ngủ, khát, đói, bốc lửa, buồn.

**COA-07 · Giọng văn & nhắc nhở** – M4
- 3 bộ giọng, viết riêng cho tiếng Việt và tiếng Anh.
- Nhắc theo ngữ cảnh (ví dụ 14h chưa ghi bữa trưa); không nhắc trong giờ ngủ.
- **Không bao giờ** chê ngoại hình hay thưởng cho việc ăn dưới sàn an toàn.

**COA-08 · Tuyên dương & huy hiệu** – M4 · DB `badges`, `user_badges`
- Màn ăn mừng + rung khi: ngày ⭐, lên level / bậc Aura, mốc streak 7/30/100/365, PR mới, thắng Boss, tuần hoàn hảo.

### 4.6 Tập luyện

**WRK-01 / WRK-09 · Thư viện bài tập** – M5 · DB `exercises`, `muscle_groups`, `equipment`, `exercise_muscles`, `exercise_equipment`, `exercise_media`
- **9 nhóm cơ**: Ngực, Lưng, Vai, Tay trước, Tay sau, Cẳng tay, Bụng, Mông, Chân.
- **9 loại dụng cụ**: tạ đòn, tạ đơn, cáp, máy, máy Smith, trọng lượng cơ thể, xà đơn, dây kháng lực, tạ ấm.
- **90 bài khởi tạo** (10 bài/nhóm, 51 bài tập được ở nhà).
- Xem theo nhóm cơ hoặc theo dụng cụ; tìm kiếm.
- **GIF hướng dẫn** chỉ lấy từ nguồn **có giấy phép**, tải về kho của mình. **Không** lấy từ smartworkout.app vì điều khoản của họ cấm. Hướng dẫn từng bước do AuraFit tự viết.

**WRK-02 · Hồ sơ dụng cụ** – M5 · DB `equipment_profiles`
- Gym / Nhà có dụng cụ / Không dụng cụ. Đổi hồ sơ thì app thay bài tương đương.

**WRK-03 · Sinh giáo án** – M5 · DB `programs`, `planned_sessions`, `planned_exercises`
- **Đầu vào**: mục tiêu, trình độ, số ngày/tuần, thời lượng, dụng cụ.
- **Lịch chia nhóm cơ**: 2–3 ngày → toàn thân · 4 ngày → trên / dưới · 5–6 ngày → đẩy / kéo / chân.
- **Dài hạn**: 8–12 tuần, giảm tải mỗi 4–6 tuần. **Ngắn hạn**: tuần này chi tiết, chỉnh theo kết quả thật.

**WRK-04 · Buổi tập** – M5 · DB `workout_sessions`, `set_logs`
- Ghi kg × rep (hoặc giây), đánh dấu set, thêm/bớt set, đổi bài.
- Đồng hồ nghỉ vẫn báo khi khoá màn hình.

**WRK-05 · Tự chỉnh tạ** – M5
- Trong buổi: dưới khoảng rep → gợi ý giảm tạ; vượt khoảng rep → gợi ý tăng.
- Giữa các buổi: mọi set chạm đỉnh khoảng rep → buổi sau tăng một bước tạ nhỏ nhất của dụng cụ.

**WRK-06 · Readiness** – M5
- Điểm sẵn sàng 0–100 mỗi sáng, tính từ giấc ngủ, ăn uống hôm qua, khối lượng tập 3 ngày, nhịp tim nghỉ, cơ còn mỏi.
- Thấp → đề xuất buổi nhẹ hơn; cao → "Hợp để thử PR". Người dùng chọn Nhận hoặc Bỏ qua.

**WRK-07 · PR & 1RM** – M5 · DB `personal_records`
- Kỷ lục cho từng bài, 1RM ước tính, bậc calisthenics.

**WRK-10 · Bản đồ hồi phục cơ 2D** – M5 · DB `muscles`, `muscle_recovery`
- Cơ thể **mặt trước / mặt sau**, 18 vùng cơ.
- Phong cách mảng cơ cách điệu tách rời bằng khe hở. Màu một tông đỏ đậm dần theo độ mỏi: đỏ đậm < 40 % · đỏ vừa 40–64 % · đỏ nhạt 65–79 % · xám = sẵn sàng (≥ 80 %). Luôn kèm số % và "sẵn sàng sau ~X giờ".
- **Cách tính**: mỗi set cộng độ mỏi (cơ chính 1,0, cơ phụ 0,5), độ mỏi giảm dần theo thời gian hồi phục từng cơ (cơ lớn ~72 giờ, cơ nhỏ ~36–48 giờ). Ngủ thiếu thì chậm hơn 15 %, đủ protein thì nhanh hơn 10 %.
- Gợi ý "Hôm nay hợp tập: Chân · Mông"; giáo án tránh cơ còn đỏ.

**WRK-11 · Chi tiết phần cơ + "Vì sao?"** – M5 · DB `muscle_heads`, `exercise_muscle_heads`
- Chạm một vùng (ví dụ ngực) → hình phóng to chia **3 phần: trên / giữa / dưới**, mỗi phần **một màu riêng** theo bài bạn đã tập.
- Ví dụ chỉ tập đẩy ngực dốc lên và đẩy ngực ngang: ngực trên đỏ đậm, ngực giữa đỏ vừa, ngực dưới xám.
- **"Vì sao?"**: "Thứ Năm 12/11 · Đẩy ngực dốc lên · 4 set 50 kg × 8–10 → ngực trên +44".
- Có **37 phần cơ** cho 18 vùng.

**WRK-13 → WRK-20 · Bổ sung beta từ SmartWorkout & openGym** – M5 (D-048, chi tiết + nguồn ở `02-features/feature-backlog.md`)
- Ngưỡng khối lượng 10–20 set/tuần/nhóm cơ trên bản đồ cơ.
- Ghi RIR / RPE; lịch xoay vòng A/B/C; thời gian nghỉ mặc định theo loại bài.
- Bài dự phòng khi máy bận; kho dụng cụ từng phòng gym + máy tính bánh tạ.
- Tạ đeo, rep từng bên, dây kháng lực; 7 giáo án mẫu.

**WRK-12 · Bản đồ cơ chi tiết** – M5
- Bám sát model tham chiếu: mặt trước + sau cạnh nhau, thân đen viền mảnh, khối cơ màu đặc tách bằng khe đen (không chấm, không hiệu ứng nổi).
- Chế độ **Khối lượng tuần**: set/tuần từng phần cơ – xanh dương < 6 · xanh lá 6–11 · vàng 12–17 · cam ≥ 18.
- Chế độ **Phục hồi**: thang đỏ như WRK-10.
- Chạm khối cơ → "Ngực trên · Cao · 22 set/tuần".
- Bản **3D** làm sau v1, dùng lại cùng cách tính.

### 4.7 Hôm nay & Tiến độ

**PRG-01 · Màn Hôm nay** – M2 → M4
- Nhân vật + điểm ngày, streak, khiên, thẻ dinh dưỡng (vòng kcal, 4 thanh macro, "Ăn gì bây giờ?"), nước, giấc ngủ, buổi tập, nhiệm vụ.

**PRG-02 · Biểu đồ ngày / tuần / tháng / năm** – M6
- kcal, protein, cân nặng, giấc ngủ, nước, khối lượng tập.

**PRG-03 · Heatmap điểm ngày** – M6
- Ô càng sáng điểm càng cao; bấm vào xem chi tiết ngày đó.

**PRG-04 · Tổng kết tuần + "Về đích ngày…"** – M6
- "Với nhịp hiện tại, bạn chạm 65 kg vào khoảng 14/03."

### 4.8 Bạn bè

**FRD-01 · Kết bạn** – M6 · DB `friendships`, `invites`
- Tìm theo username, hoặc gửi link mời (kèm mã QR).

**FRD-02 · Story bữa ăn** – M6 · DB `meal_entries.is_shared`, `meal_reactions`
- Bạn bè chỉ thấy các bữa **hôm nay** mà bạn chọn chia sẻ.
- Thả cảm xúc; không có bình luận.
- Cân nặng, giấc ngủ **không bao giờ** chia sẻ.

**FRD-03 · Streak đôi** – M6 · DB `duo_streaks`
- Hai người cùng đạt thì streak đôi +1; một người trượt có thể dùng khiên để cứu.

---

## 5. Tính năng chữ ký (điểm khác biệt)

| # | Tính năng | Beta? |
|---|---|---|
| 1 | Nhân vật Kai/Mira sống theo dữ liệu thật | ✅ (hình tĩnh) |
| 2 | "Về đích ngày…" + báo giá ngày tự do | ✅ |
| 3 | Ngân sách kcal theo tuần | ✅ |
| 4 | "Ăn gì bây giờ?" – gợi ý từ món của bạn, 0 AI | ✅ |
| 5 | Readiness – buổi tập tự điều chỉnh | ✅ |
| 6 | Nhiệm vụ huấn luyện viên + Boss tuần | ✅ |
| 7 | Story bữa ăn + streak đôi | ✅ |
| 8 | Bản đồ hồi phục cơ (2D → 3D) | ✅ 2D |
| 9 | Cây kỹ năng calisthenics | v1.1 |
| 10 | Widget + Live Activity (đồng hồ nghỉ trên Dynamic Island) | v1.1 |
| 11 | AuraFit Wrapped | v1.2 |
| 12 | Ảnh tiến độ có bóng mờ căn tư thế | v1.2 |

---

## 6. Giao diện

- **Chuẩn Apple HIG + Liquid Glass**:
  - Kính chỉ dùng cho tab bar, nút nổi, thanh công cụ, sheet.
  - Nội dung nằm trên nền đặc, kiểu danh sách nhóm của iOS.
- **Điều hướng**: tab bar kính 4 tab **Hôm nay · Nhật ký · Tập · Tôi** + **nút chụp món** tròn nổi bên cạnh.
- **Chữ**: SF Pro, số liệu SF Pro Rounded; hỗ trợ phóng to chữ.
- **Màu**: một màu nhấn bạc hà; các màu khác chỉ cho số liệu; hỗ trợ sáng / tối.
- **Bản xem trước** (artifact *AuraFit UI Preview*), 11 màn:
  - Hôm nay, Nhật ký, Thêm món, Xác nhận món;
  - Chọn nhân vật, Buổi tập, Tôi, Tuyên dương;
  - Phục hồi cơ, Thư viện bài tập, Chi tiết bài tập.

---

## 7. Công nghệ & kiến trúc

| Lớp | Lựa chọn |
|---|---|
| App | Expo, Expo Router, TypeScript strict, EAS Build → TestFlight (không cần Mac) |
| Giao diện | Tab bar native (Liquid Glass), expo-glass-effect, expo-blur, expo-symbols, expo-haptics, NativeWind cho bố cục. **Không dùng shadcn** (chỉ cho web) |
| Dữ liệu | TanStack Query, Zustand, SecureStore, MMKV, Zod |
| Đa ngôn ngữ | i18next |
| Backend | Supabase: Postgres + RLS, Auth, Storage, Edge Functions, pg_cron |
| AI | Edge Function → Gemini rẻ; chỉ dùng mô hình mạnh hơn khi cần; đổi nhà cung cấp bằng cấu hình |
| Logic | `packages/core`: TDEE, điểm, giáo án, hồi phục cơ – hàm thuần, có test |

**Cấu trúc repo**

```text
apps/mobile/       app/ (định tuyến) + src/features/<module>/ (api, hooks, components)
packages/core/     logic thuần + test
supabase/          migrations, functions, seed
docs/
```

**Quy tắc quan trọng** (rút từ lỗi bản cũ):
- Điểm, XP, streak tính ở server; người dùng không tự sửa được.
- File màn hình chỉ để định tuyến; component tối đa ~300 dòng.
- Không có chữ viết cứng; TypeScript strict, không dùng `any`.

---

## 8. Database (tóm tắt)

**Quy tắc chung**
- Mọi bảng bật RLS: chỉ chủ dữ liệu đọc/ghi.
- Bảng game hoá chỉ server được ghi.
- Lưu thời gian UTC kèm `local_date` theo múi giờ người dùng.
- Mỗi lần đổi schema: migration mới + cập nhật file module + `CHANGELOG.md`.

| Module | Bảng | Phiên bản |
|---|---|---|
| Hồ sơ | `profiles`, `goals`, `coach_settings` | v1 |
| Dinh dưỡng | `nutrition_targets`, `meal_entries`, `meal_items`, `saved_foods`, `saved_food_items`, `barcode_products`, `free_days`, `ai_requests` | v1 |
| Sức khoẻ | `health_samples`, `daily_summaries` | v1 |
| Daily Tasks | `task_definitions`, `task_logs`, `focus_sessions` | v1 |
| Huấn luyện viên | `daily_scores`, `coach_state`, `shield_ledger`, `stat_snapshots`, `quests`, `boss_battles`, `badges`, `user_badges` | v1 |
| Tập luyện | `muscle_groups`, `muscles`, `equipment`, `exercises`, `exercise_muscles`, `exercise_equipment`, `exercise_media`, `equipment_profiles`, `programs`, `planned_sessions`, `planned_exercises`, `workout_sessions`, `set_logs`, `personal_records`, `muscle_recovery` | v1.1 |
| Bạn bè | `friendships`, `invites`, `meal_reactions`, `duo_streaks` | v1 |

---

## 9. Lộ trình

| Mốc | Nội dung | Xong khi |
|---|---|---|
| **M0** Nền móng | Repo mới, Expo + Router + i18n + UI theo HIG, Supabase, đăng nhập Google + email, CI | Đăng nhập Google trên iPhone, đổi được Việt / Anh |
| **Spike AI** (song song) | 30–50 ảnh món Việt qua Gemini rẻ: sai số, tốc độ, chi phí | Có báo cáo chọn mô hình |
| **M1** Onboarding | TDEE, mục tiêu, huấn luyện viên, nhân vật | 10 hồ sơ mẫu ra đúng mục tiêu |
| **M2** Dinh dưỡng | Hôm nay, 5 cách ghi món, AI ảnh, Món của tôi, ngày tự do, "Ăn gì bây giờ?" | Ghi đủ một ngày ăn thật |
| **M3** Sức khoẻ + Tasks | Nước, cân nặng, ngủ, Apple Health, daily tasks | Dữ liệu Apple Watch hiện đúng |
| **M4** Huấn luyện viên | Điểm, streak, khiên, Aura, nhiệm vụ, Boss, giọng văn, tuyên dương | 1 tuần dữ liệu mẫu ra đúng |
| **M5** Tập luyện | Thư viện 90 bài, giáo án, buổi tập, readiness, PR, bản đồ hồi phục 2D | Tập trọn buổi gym và buổi ở nhà |
| **M6** Tiến độ + Bạn bè | Biểu đồ, heatmap, tổng kết tuần, kết bạn, story, streak đôi | 2 tài khoản thấy story của nhau |
| **M7** Beta | TestFlight, chính sách quyền riêng tư, phản hồi | 5–10 người bạn dùng được |

**Sau M7 – ra mắt công khai** (chi tiết `03-design/launch-plan.md`): beta kín → beta mở rộng (50–200 người) → v1.0 App Store miễn phí → v1.x thêm gói Premium. Trước khi lên App Store bắt buộc có Sign in with Apple, xoá tài khoản trong app, chính sách quyền riêng tư, Gemini gói trả phí.

Trễ tiến độ thì cắt theo thứ tự: Boss tuần → streak đôi → readiness → "Ăn gì bây giờ?". **Không cắt**: ghi món, TDEE, điểm + streak, sức khoẻ cơ bản.

**Việc bạn cần chuẩn bị**

| Khi nào | Việc |
|---|---|
| Trước M0 | Supabase project mới, tài khoản Expo, OAuth client Google (iOS + Web) |
| Trước spike AI | Gemini API key, 30–50 ảnh món Việt |
| Trước M5 | Chọn nguồn GIF bài tập có giấy phép |
| Trước M7 | Apple Developer Program (99 USD/năm) |

---

## 10. Rủi ro chính

| Rủi ro | Cách xử lý |
|---|---|
| Phạm vi lớn so với một người làm | MVP rõ, thứ tự cắt sẵn |
| AI đoán sai món Việt | Spike đo trước, cho sửa nhanh, hỏi lại khi mơ hồ |
| Chi phí AI | Ưu tiên cách ghi 0 AI, hạn mức ảnh/ngày, nén ảnh |
| Đếm calo + thúc ép gây hại | Sàn an toàn, ngôn từ tích cực, không thưởng ăn quá ít |
| Bản quyền GIF bài tập | Chỉ dùng nguồn có giấy phép, lưu nguồn từng file |
| App Store yêu cầu Sign in with Apple | Thêm trước khi phát hành công khai |

---

## 11. Tài liệu chi tiết

| Muốn xem | File |
|---|---|
| Danh mục chức năng dạng bảng | `docs/FEATURES.md` |
| Đặc tả từng module | `docs/02-features/*.md` |
| Thiết kế database từng module | `docs/04-database/*.md`, 90 bài tập: `docs/04-database/seed/exercises_v1.csv` |
| Kế hoạch triển khai | `docs/03-design/implementation-plan.md` |
| Ngôn ngữ thiết kế | `docs/03-design/design-language.md` |
| 43 quyết định đã chốt | `docs/01-discovery/decisions.md` |
| Câu hỏi & câu trả lời 4 vòng | `docs/01-discovery/open-questions.md` |

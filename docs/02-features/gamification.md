# Module: Gamification – "Huấn luyện viên AuraFit"

**Trạng thái:** 🟧 Thiết kế nháp v2 (sau vòng 3) · **Ưu tiên:** Must (D-007, D-021, D-026, D-027)

## Mục tiêu

Tạo **dopamine** khi làm đúng và **áp lực vừa đủ** khi lơ là, như một PT tận tâm: khen đúng lúc, nhắc đúng lúc, khắt khe theo mức người dùng chọn – nhưng **không bao giờ gắt** (Q3.4). Mọi phần thưởng đều đến từ **hành vi thật**, kể cả ngày không tập.

## 1. Hai núm chỉnh độc lập: Mức khắt khe × Giọng văn (D-027)

- **Mức khắt khe** quyết định **luật**: khoảng sai số, ngưỡng giữ streak, mức trừ điểm.
- **Giọng văn** quyết định **cách nói**.
- Ví dụ: có thể chọn luật Khắc nghiệt nhưng giọng Bestie dễ thương.

### 1a. Mức khắt khe

Chọn ở onboarding; đổi được tối đa 1 lần/tuần.

| | 🌱 Nhẹ nhàng | 💪 Tiêu chuẩn | 🔥 Khắc nghiệt |
|---|---|---|---|
| Khoảng kcal được coi là "đạt" | ±15 % | ±10 % | ±5 % |
| Ngưỡng điểm để giữ streak | ≥ 60 | ≥ 70 | ≥ 80 |
| Khiên tự động bảo vệ streak | Có | Có | Không – phải chủ động dùng |
| Ngày tự do mặc định / tuần | 2 | 1 | 0 |
| Trừ điểm mỗi ngày tự do vượt số đã đặt | 0 | −5 | −10 |
| Tần suất nhắc | Ít | Vừa | Dày |
| Aura tụt khi lơ là | Chậm | Vừa | Nhanh |

### 1b. Giọng văn ❓ (Q4.2)

Ba bộ giọng văn, mỗi bộ viết riêng cho **tiếng Việt và tiếng Anh**: không dịch máy, vì đùa kiểu Gen Z phải tự nhiên trong từng ngôn ngữ.

| Tình huống | 😎 Bestie (Gen Z) | 🎯 Coach (chuyên nghiệp) | 🎭 Drama (làm quá, meme) |
|---|---|---|---|
| 14h chưa ghi bữa trưa | "Ủa bữa trưa đâu rồi ní? 👀 Chụp một tấm cho Auri xem với." | "14:00 – chưa có bữa trưa. Ghi lại để giữ số liệu chính xác." | "Auri đói meo vì chưa thấy bữa trưa đâu… 14 giờ rồi đó 😩" |
| Tối còn thiếu protein | "Protein hôm nay hơi flop nha, còn thiếu 45 g 😭 Ức gà trong Món của tôi đang chờ đó." | "Còn thiếu 45 g protein. Gợi ý: ức gà 150 g (+46 g)." | "45 g protein đang khóc trong góc vì bị bỏ quên 🥩💔" |
| Ngày xuất sắc | "98 điểm?? Đỉnh nóc kịch trần 🔥 +1 mảnh khiên về túi." | "98/100. Ngày xuất sắc – +1 mảnh khiên." | "Không thể tin nổi! 98 điểm! Auri phải đi kể cho cả xóm 🎉" |
| Mất streak | "Streak toang rồi 🥲 Không sao, mai làm lại, Auri vẫn ở đây." | "Streak dừng ở 12 ngày. Mục tiêu hôm nay: ≥ 70 điểm." | "Streak 12 ngày… đã ra đi 🕯️ Nhưng huyền thoại luôn quay lại, đúng không?" |
| Nhắc uống nước | "Nước chưa uống mà đòi glow up hả 💧 Làm ly 250 ml nha." | "Nước: 1,2 / 2,5 L. Uống 250 ml ngay bây giờ." | "Auri đang khô héo như cây xương rồng 🌵 Cứu bằng một ly nước đi!" |

**Luật viết cho mọi giọng:**
1. Đùa vào **tình huống hoặc linh vật**, không bao giờ đùa vào người dùng.
2. Không nhắc tới ngoại hình, cân nặng theo kiểu chê bai.
3. Không làm người dùng thấy tội lỗi vì đã ăn.
4. Mọi câu đều có **một hành động cụ thể** đi kèm.

## 2. Nhân vật đại diện Nam / Nữ (D-032)

Hai nhân vật gốc của AuraFit: **Kai** (nam) và **Mira** (nữ), phong cách chibi 2D. Người dùng chọn tự do, đặt lại tên được. Trong ví dụ giọng văn ở §1b, "Auri" đọc là **tên nhân vật người dùng chọn**.

- **Hào quang quanh nhân vật = bậc Aura** (§4). Lơ là thì hào quang nhạt màu thật sự.
- **Tâm trạng = dữ liệu hôm nay**:

| Tâm trạng | Khi nào |
|---|---|
| ✨ Rạng rỡ | Điểm hôm nay đang ≥ 90 |
| 😴 Ngái ngủ | Đêm qua ngủ < 6 giờ |
| 🥵 Khát | 15h mà nước < 40 % mục tiêu |
| 🍽️ Đói | 11h chưa ghi bữa nào |
| 🔥 Bốc lửa | Streak ≥ 7 ngày |
| 🥲 Buồn | Vừa mất streak (chỉ trong 1 ngày) |

- Xuất hiện ở màn Hôm nay, trong thông báo (sticker), màn tuyên dương; sau này có widget màn hình khoá.
- **Trang phục / phụ kiện** mở khoá khi thắng Boss tuần, đạt mốc streak, lên level.
- Kỹ thuật: beta dùng bộ hình tĩnh theo tâm trạng; v1.1 chuyển sang hoạt hình 2D có trạng thái (Rive).

## 3. Điểm ngày (Daily Score, 0–100)

Chốt lúc **03:00 sáng hôm sau** theo giờ người dùng, để ai ăn khuya hay ghi bù vẫn kịp.

| Trụ cột | Điểm | Đạt đủ khi |
|---|---|---|
| Dinh dưỡng | 40 | Ghi ăn đủ ngày (15) · kcal trong khoảng (15) · protein ≥ 90 % (7) · đường ≤ giới hạn (3) |
| Giấc ngủ | 20 | Thời lượng đạt (12) · giờ dậy đúng ±30 phút (8) |
| Tập luyện | 15 | Ngày có lịch: hoàn thành buổi tập. **Ngày nghỉ theo lịch: tự đủ 15.** |
| Nước | 10 | Tỷ lệ theo % mục tiêu |
| Sống chất lượng | 10 | % daily task hoàn thành (`daily-tasks.md`). Không có task → chia lại cho trụ cột khác |
| Cân nặng | 5 | Đã cân nếu hôm nay là ngày cần cân; không cần cân → tự đủ |

| Kết quả | Điểm (mức Tiêu chuẩn) | Hiệu ứng |
|---|---|---|
| ⭐ **Xuất sắc** (phá target) | ≥ 95 | Màn tuyên dương + rung + **+1 mảnh khiên** |
| ✅ Đạt | ≥ 70 | Giữ streak, XP đầy đủ |
| ⚠️ Trượt | < 70 | Mất streak, trừ khi có khiên |

## 4. Hai lớp tiến bộ: Level (không mất) & Aura (có thể tụt)

- **Level / XP – thành tựu trọn đời, không bao giờ giảm** → dopamine.
  - XP mỗi ngày = điểm ngày, cộng thưởng streak (+1 % mỗi 7 ngày, tối đa +20 %), cộng XP từ nhiệm vụ.
  - Mỗi level sau cần nhiều XP hơn một chút; lên level có màn ăn mừng, danh hiệu, skin cho Auri.
- **Aura – phong độ 30 ngày gần nhất, có thể tụt** → áp lực.
  - Aura = trung bình có trọng số của các chỉ số cứng (§5).
  - Bậc màu: Xám → Xanh lá → Xanh dương → Tím → Vàng → Đỏ lửa.
  - Lơ là vài ngày, Aura tụt bậc thật và Auri đổi màu. Đây là phần thúc ép, thay cho việc trừ XP.

## 5. Chỉ số cứng

Mỗi chỉ số 0–100, tính từ dữ liệu thật 30 ngày gần nhất; bấm vào là thấy cách tính.

| Chỉ số | Đo bằng |
|---|---|
| 🍽️ Kỷ luật ăn uống | % ngày kcal trong khoảng (ngày tự do hợp lệ không tính là trượt) |
| 🥩 Protein | % ngày đạt protein |
| 😴 Giấc ngủ | % đêm đủ giờ + độ đều giờ dậy |
| 💧 Nước | % ngày đủ nước |
| 🏋️ Chuyên cần tập | % buổi tập theo lịch đã hoàn thành |
| 💪 Sức mạnh | Xu hướng 1RM ước tính / bậc calisthenics so với 30 ngày trước |
| ⚖️ Tiến độ cơ thể | Cân nặng xu hướng đi đúng hướng và đúng tốc độ đã chọn |
| 🧠 Phát triển bản thân | % daily task hoàn thành |

## 6. Nhiệm vụ huấn luyện viên & Boss tuần

**Nhiệm vụ huấn luyện viên (hằng ngày):**
- App giao 1–3 nhiệm vụ mỗi sáng, nhắm vào **chỉ số yếu nhất**.
- Chọn bằng luật, không tốn AI. Ví dụ: "Ngủ trước 23:30", "Bữa sáng ≥ 30 g protein", "500 ml nước trước 10h".
- Chỉ **cộng** XP (+10 → +30), trượt không bị trừ.

**Boss tuần:**
- Mỗi thứ Hai xuất hiện một "boss" nhắm vào điểm yếu tuần trước.
- Ví dụ: 😈 **Quỷ Đường** – giữ đường dưới giới hạn 5/7 ngày; 🦥 **Lười Biếng** – hoàn thành mọi buổi tập theo lịch; 🌙 **Cú Đêm** – ngủ trước 23:30 ít nhất 5 đêm.
- Boss có **thanh máu**, mỗi ngày đạt là một đòn đánh.
- Thắng → huy hiệu + 1 mảnh khiên + phụ kiện cho Auri.

## 7. Streak, mảnh khiên, khiên, ngày tự do (D-026)

**Streak** = số ngày liên tiếp đạt ✅ trở lên. Ngày không tập vẫn tính, vì ngày nghỉ theo lịch đủ điểm tập.

**Mảnh khiên & khiên:**
- Mỗi ngày ⭐ nhận 1 mảnh; **3 mảnh = 1 khiên**; giữ tối đa **3 khiên**.
- Tặng 1 khiên khởi đầu, mỗi tháng tặng thêm 1 (Nhẹ nhàng: 2).
- Khiên dùng để:
  1. **Bảo vệ streak** khi một ngày bị ⚠️ Trượt.
  2. **Đổi một ngày ăn quá đà thành ngày tự do hợp lệ**, ngoài số ngày đã đặt.

**Ngày tự do (cheat day):**
- Người dùng tự đặt **0–3 ngày/tuần** ❓ (Q4.4). Mặc định theo mức khắt khe (§1a).
- Có thể **lên lịch trước** (ví dụ mỗi thứ Bảy) hoặc **bật trong ngày**.
- Trong ngày tự do hợp lệ:
  - Tiêu chí kcal và đường **tự đạt**.
  - Vẫn **cần ghi món** để có dữ liệu và nhận 15 điểm "ghi ăn đủ ngày".
- **Báo cáo ảnh hưởng**: mỗi ngày tự do hiện "≈ +1.100 kcal so với mục tiêu → về đích muộn khoảng 2 ngày". Tổng kết tuần cộng dồn lại.
- **Chế độ bù trong tuần** (tuỳ chọn): các ngày còn lại tự giảm nhẹ mục tiêu (tối đa −10 %/ngày, không xuống dưới sàn an toàn) để tuần vẫn đúng lộ trình. Chi tiết ở `nutrition.md` §7.
- **Vượt số ngày đã đặt**: ngày đó chấm điểm bình thường và bị trừ thêm theo §1a (0 / −5 / −10); chỉ số Kỷ luật ăn uống tụt. Có thể dùng 1 khiên để biến nó thành ngày tự do hợp lệ.

## 8. Nhắc nhở

- **Nhắc theo ngữ cảnh**, không theo giờ cố định. Ví dụ: 14h chưa ghi bữa trưa; 20h protein mới đạt 50 %; gần giờ tập.
- **Không bao giờ nhắc** từ giờ ngủ đến giờ dậy của người dùng.
- **Tổng kết sáng**: điểm hôm qua, điểm yếu, nhiệm vụ hôm nay, theo giọng văn đã chọn.
- **Cảnh báo Aura**: "Còn 2 ngày trượt nữa là Aura tụt về Xanh lá."

### Giới hạn an toàn (R12)

- Không bao giờ thưởng cho việc ăn **dưới** sàn an toàn.
- Ăn dưới sàn 2 ngày liên tiếp → nhắc nhẹ nhàng ở mọi mức, kể cả Khắc nghiệt.
- Ngày tự do không bao giờ bị gọi là "thất bại".

## 9. Tuyên dương

Màn ăn mừng toàn màn hình + rung + Auri nhảy múa khi có:
- Ngày ⭐.
- Lên level / bậc Aura.
- Mốc streak 7 / 30 / 100 / 365.
- PR mới hoặc lên bậc calisthenics.
- Thắng Boss tuần.
- Tuần hoàn hảo 7/7.
- Đạt mốc cân nặng.

Huy hiệu lưu trong Hồ sơ.

## 10. Bạn bè

- **Streak đôi**: ghép cặp với một người bạn; cả hai cùng đạt ✅ thì streak đôi +1. Một người trượt có thể dùng khiên của mình để cứu.
- Thả cảm xúc vào story bữa ăn của bạn (`social.md`).
- Thông báo nhẹ: "Minh vừa xong ngày 92 điểm, tới lượt bạn 👀".

## 11. Tính ở đâu

Điểm, XP, streak, khiên, Aura, Boss **đều tính ở server** (Edge Function + pg_cron chốt ngày) từ dữ liệu gốc; app chỉ hiển thị. Mọi con số ở đây là **giá trị khởi điểm**, sẽ chỉnh sau 2 tuần beta.

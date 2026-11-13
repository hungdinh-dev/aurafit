# Module: Bản đồ hồi phục cơ (WRK-10)

**Trạng thái:** 🟧 Thiết kế nháp · **Ưu tiên:** Must – bản 2D trong beta (D-043); 3D sau v1 (`anatomy-3d.md`)

## Mục tiêu

Cho người dùng biết **nhóm cơ nào đã sẵn sàng tập lại và còn bao lâu nữa**, thay vì đoán mò. Đây là ý tưởng gốc của AuraFit, làm trước bằng 2D cho nhẹ và nhanh.

## 1. Giao diện

- **Hình cơ thể 2D** có hai mặt **Trước / Sau** (bộ chọn), gồm 18 vùng cơ (`04-database/06-workout.md`).
- **Phong cách** (theo ảnh tham chiếu của chủ dự án):
  - Các mảng cơ cách điệu, tách nhau bằng khe hở, không có viền thân người.
  - Vẽ một nửa rồi lật gương để hai bên cân đối.
  - Hình do AuraFit tự vẽ, không dùng ảnh stock.
- **Màu theo mức mỏi** – một tông đỏ, đậm dần theo độ mỏi; cơ không mỏi giữ màu xám. Các mức khác nhau cả về độ sáng, và luôn kèm số %, nên người mù màu vẫn đọc được:

| Màu | % hồi phục | Ý nghĩa |
|---|---|---|
| Đỏ đậm `#FF453A` | < 40 % | Mỏi nặng, nên tránh |
| Đỏ vừa `#C9504A` | 40–64 % | Mỏi vừa |
| Đỏ nhạt `#8E4B48` | 65–79 % | Hơi mỏi, tập nhẹ được |
| Xám `#48484A` | ≥ 80 % hoặc chưa tập | Sẵn sàng |

- **Màn chi tiết bài tập** dùng cùng hình đó: cơ chính tô đỏ đậm, cơ phụ đỏ nhạt.

- **Chạm vào một cơ** → sheet nhỏ:
  - % hồi phục và thời gian còn lại ("Sẵn sàng sau ~22 giờ");
  - buổi tập gần nhất tác động vào cơ đó;
  - các bài tập cho cơ đó.
- **Danh sách bên dưới** xếp theo cơ mỏi nhất.
- **Gợi ý:** "Hôm nay hợp tập: Chân, Mông".
- **Vị trí trong app:** đầu tab **Tập**; hình thu nhỏ ở màn chi tiết bài tập để làm nổi các cơ bài đó tác động.

## 1b. Hai cấp chi tiết: vùng cơ → phần cơ (D-044)

**Cấp 1 – Bản đồ toàn thân**
- 18 vùng cơ như trên.
- Màu của vùng = **phần cơ mỏi nhất** trong vùng. Ví dụ ngực trên mỏi nặng thì cả vùng ngực hiện đỏ đậm, dù ngực dưới đã hồi phục.

**Cấp 2 – Chạm vào một vùng → sheet chi tiết**
- **Hình phóng to** của vùng, chia đúng các phần cơ, mỗi phần **một màu riêng** theo mức mỏi của nó.
- **Danh sách phần cơ**: %, thời gian còn lại, thanh tiến độ. Chạm một phần thì hình sáng viền phần đó.
- **"Vì sao?"** – lịch sử gần nhất làm phần cơ đó mỏi:
  - mỗi dòng: thời điểm, bài tập, số set × tạ × rep, **mức mỏi cộng thêm** (ví dụ "+44");
  - lấy từ các buổi tập 7 ngày gần nhất, xếp theo mức đóng góp.
- **Gợi ý**: phần nào đã sẵn sàng và bài nào nhắm vào nó. Ví dụ: "Ngực dưới sẵn sàng – nhún xà kép, ép cáp từ trên xuống".

**37 phần cơ**

| Vùng | Các phần |
|---|---|
| Ngực | Ngực trên · Ngực giữa · Ngực dưới |
| Vai | Vai trước · Vai giữa · Vai sau |
| Tay trước | Đầu dài · Đầu ngắn · Cơ cánh tay (brachialis) |
| Tay sau | Đầu dài · Đầu ngoài · Đầu trong |
| Cẳng tay | Nhóm gập · Nhóm duỗi · Cơ cánh tay quay |
| Bụng | Bụng trên · Bụng dưới |
| Bụng chéo | Chéo ngoài · Răng cưa |
| Cơ thang | Thang trên · Thang giữa · Thang dưới |
| Xô | Xô |
| Lưng giữa | Cơ trám · Cơ tròn / dưới gai |
| Lưng dưới | Cơ dựng sống |
| Mông | Mông lớn · Mông nhỡ |
| Đùi trước | Cơ thẳng đùi · Rộng ngoài · Rộng trong |
| Đùi sau | Nhị đầu đùi · Bán gân / bán màng |
| Đùi trong | Nhóm khép |
| Bắp chân | Bắp chân (gastrocnemius) · Dép (soleus) · Chày trước |

**Mỗi bài tập nhấn vào phần nào** – hệ số trong `exercise_muscle_heads`. Ví dụ nhóm ngực:

| Bài | Ngực trên | Ngực giữa | Ngực dưới |
|---|---|---|---|
| Đẩy ngực dốc lên (incline) | 1,0 | 0,6 | 0,2 |
| Đẩy ngực ngang (flat) | 0,5 | 1,0 | 0,5 |
| Nhún xà kép / đẩy ngực dốc xuống | 0,2 | 0,6 | 1,0 |
| Ép cáp từ trên xuống | 0,2 | 0,8 | 0,8 |
| Hít đất | 0,4 | 1,0 | 0,5 |

- Các hệ số này là **ước lượng** theo kinh nghiệm huấn luyện và các nghiên cứu đo hoạt động cơ (EMG). Chúng cho biết bài nào **nhấn** vào phần nào, không phải số đo chính xác.
- Bài chưa có hệ số theo phần thì chia đều mức kích thích của vùng cho các phần trong vùng.

## 1c. Bản đồ cơ chi tiết 2.5D + chế độ khối lượng tuần (D-045, WRK-12)

Màn **"Bản đồ cơ"** riêng, mở từ màn Phục hồi. Theo model tham chiếu của chủ dự án:
- **Mặt trước và mặt sau đặt cạnh nhau.** Khoảng 40 khối cơ **tách rời** theo đúng 37 phần cơ, không có viền thân người.
- **Bám sát model tham chiếu**:
  - thân người đen có viền mảnh;
  - tay dang nhẹ, thấy cả bàn tay, bàn chân;
  - khối cơ màu đặc phẳng, tách nhau bằng khe đen;
  - chip tên cơ + mức đặt cạnh hình.

  **Không** dùng hiệu ứng chấm, **không** thêm hiệu ứng nổi riêng (bản thử 2.5D đã bỏ theo yêu cầu).
- **Hai chế độ** (bộ chọn):

| Chế độ | Tô màu theo | Thang màu |
|---|---|---|
| **Khối lượng tuần** | Số set hiệu quả / tuần của từng phần cơ (cơ chính tính 1 set, cơ phụ tính theo hệ số) | Xanh dương < 6 · Xanh lá 6–11 · Vàng 12–17 · Cam ≥ 18 |
| **Phục hồi** | % hồi phục | Thang đỏ như §1 |

- **Chạm một khối** → chip kính ở trên hiện tên phần cơ, mức và số liệu, ví dụ "Ngực trên · Cao · 22 set/tuần".
- **Dòng tóm tắt** dưới hình: tổng set tuần, phần cao nhất, phần thấp nhất. Giúp thấy ngay nhóm cơ bị bỏ quên.
- Màn Phục hồi kiểu mảng đỏ (§1) vẫn giữ làm màn nhanh. Màn này là bản chi tiết.
- **Kỹ thuật**: vẽ bằng `react-native-svg`, mỗi khối là một path bấm được. Bản 3D xoay được (three.js) vẫn để sau v1.

## 2. Mô hình tính (bản nháp, trong `packages/core/workout/recovery`)

1. **Mỗi set hoàn thành** cộng độ mỏi vào từng cơ: `fatigue += stimulus × hệ số cường độ`.
   - `stimulus` lấy từ `exercise_muscles`: cơ chính 1,0, cơ phụ 0,5.
   - Hệ số cường độ:
     - set đạt đỉnh khoảng rep hoặc RPE ≥ 8 → 1,0;
     - set dễ → 0,7;
     - set khởi động → 0.
   - Mỗi set tối đa +12 điểm mỏi; độ mỏi giới hạn 0–100.
2. **Độ mỏi giảm dần theo thời gian** (hàm mũ). Hằng số thời gian chọn sao cho sau `base_recovery_hours` của cơ đó, độ mỏi về dưới 20 % mức ban đầu:
   - cơ lớn 72 giờ;
   - lưng giữa 60 giờ;
   - cơ vừa 48 giờ;
   - cơ nhỏ 36–48 giờ.
3. **Điều chỉnh theo lối sống** (đã có dữ liệu trong app):
   - ngủ dưới mục tiêu đêm qua → hồi phục chậm hơn 15 %;
   - đạt protein hôm qua → nhanh hơn 10 %;
   - người mới tập → chậm hơn 10 % trong 4 tuần đầu.
4. **% hồi phục = 100 − độ mỏi.** Thời gian còn lại = lúc dự kiến độ mỏi xuống dưới 20.
5. Đây là **ước tính để định hướng**, không phải đo sinh lý. App ghi rõ như vậy.

## 3. Liên kết với chức năng khác

- **Readiness (WRK-06):** cộng thêm thông tin cơ nào còn mỏi.
- **Sinh giáo án (WRK-03):** nếu buổi hôm nay rơi vào cơ đang đỏ, đề xuất đổi thứ tự buổi hoặc đổi bài.
- **Nhân vật:** cơ quá mỏi nhiều ngày liền có thể làm nhân vật "mệt".

## 4. Dữ liệu

- Tính ở **cấp phần cơ** từ `set_logs` + `exercise_muscle_heads`; cấp vùng lấy phần mỏi nhất.
- Cache trong `muscle_recovery` (theo phần cơ) để màn hình mở nhanh và để gửi thông báo "Ngực đã hồi phục, sẵn sàng cho buổi đẩy".
- **"Vì sao?"** đọc lại `set_logs` 7 ngày gần nhất của các bài có tác động vào phần cơ đó, rồi tính mức đóng góp còn lại của từng bài sau khi đã giảm theo thời gian. Không cần lưu thêm bảng: dữ liệu gốc đã đủ, index `set_logs(user_id, completed_at)` giúp truy vấn nhanh.

## Tiêu chí chấp nhận (bản nháp)

- Kết thúc buổi tập → bản đồ cập nhật ngay.
- Màu và số luôn khớp với thời gian còn lại.
- Có mô tả bằng chữ cho VoiceOver ("Ngực 35 %, sẵn sàng sau 22 giờ").

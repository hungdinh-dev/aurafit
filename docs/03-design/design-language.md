# Ngôn ngữ thiết kế – HIG + Liquid Glass, tối giản (D-039, D-040)

Mục tiêu: AuraFit trông và cảm giác như **một app gốc của iOS**: tối giản, rõ thứ bậc, dùng Liquid Glass đúng chỗ. Cá tính thương hiệu đến từ **nhân vật Kai/Mira, một màu nhấn và số liệu** – không đến từ trang trí.

## 1. Ba nguyên tắc

1. **Nội dung là trung tâm.** Mỗi màn chỉ có **một việc chính**. Mọi thứ khác lùi xuống bằng màu chữ phụ, không bằng viền hay khung.
2. **Hai lớp rõ ràng:**
   - **Lớp nội dung**: nền hệ thống đặc (grouped background), danh sách nhóm, thẻ không viền.
   - **Lớp điều khiển** nổi phía trên, dùng **Liquid Glass**: tab bar, thanh công cụ, nút nổi, sheet.
   - **Không** dùng kính cho thẻ nội dung (đúng hướng dẫn HIG).
3. **Một màu nhấn.** Màu bạc hà thương hiệu chỉ dùng cho hành động chính và tiến độ của chính người dùng. Màu dữ liệu chỉ xuất hiện trong biểu đồ và thanh.

## 2. Chữ – SF Pro (font hệ thống)

| Kiểu (Dynamic Type) | Cỡ / độ đậm | Dùng cho |
|---|---|---|
| Large Title | 34 / Bold | Tiêu đề màn chính (Hôm nay, Nhật ký, Tập, Tôi) |
| Title 2 | 22 / Bold | Tiêu đề màn phụ, sheet |
| Headline | 17 / Semibold | Tiêu đề nhóm, tên món |
| Body | 17 / Regular | Nội dung chính |
| Subheadline | 15 / Regular | Dòng phụ |
| Footnote | 13 / Regular | Chú thích, đơn vị |
| Caption | 12 / Medium | Nhãn nhỏ |
| **Số liệu** | **SF Pro Rounded**, 28–56 / Bold | kcal, điểm, kg – nét tròn thân thiện, hợp app sức khoẻ |

- Tôn trọng **Dynamic Type**: bố cục không vỡ khi người dùng phóng to chữ.
- SF Pro hiển thị tiếng Việt đầy đủ dấu, không cần tải font ngoài.

## 3. Màu

| Vai trò | Tối | Sáng |
|---|---|---|
| Nền | systemBackground `#000000` | `#F2F2F7` (grouped) |
| Bề mặt nhóm | secondarySystemGroupedBackground `#1C1C1E` | `#FFFFFF` |
| Bề mặt lồng | `#2C2C2E` | `#E5E5EA` |
| Chữ chính / phụ | label / secondaryLabel (60 %) | như hệ thống |
| Đường kẻ | separator | như hệ thống |
| **Màu nhấn (tint)** | Bạc hà `#4BE3A7` | Bạc hà đậm `#0F9D6B` |
| Dữ liệu | Protein `#8F84FF` · Carb `#5AB0FF` · Fat `#FFB36B` · Đường `#F58FB4` · Nước `#5AB0FF` · Ngủ `#A79FFF` | bản đậm hơn cho nền sáng |
| Hào quang Aura | Xám → Xanh lá → Xanh dương → Tím → Vàng → Đỏ lửa | – |

Trong code dùng **màu ngữ nghĩa của iOS** (PlatformColor), nên tự đổi theo sáng/tối và chế độ tương phản cao.

## 4. Liquid Glass – dùng ở đâu

| Thành phần | Cách làm |
|---|---|
| **Tab bar** | Tab bar native của Expo Router: 4 tab Hôm nay · Nhật ký · Tập · Tôi. iOS 26 tự vẽ Liquid Glass, tự thu nhỏ khi cuộn |
| **Nút chụp món** | Nút tròn kính tô màu nhấn, nổi cạnh tab bar (kiểu nút hành động riêng của iOS 26), mở sheet Thêm món |
| **Thanh công cụ / nút trên header** | Nút tròn kính 44 pt (streak, khiên, cài đặt) |
| **Sheet** | Sheet native có tay nắm, nhiều mức chiều cao (Thêm món, Xác nhận món, Ngày tự do) |
| **Thanh hành động dưới cùng** | Thanh kính chứa nút chính (Lưu bữa, Kết thúc buổi tập) |
| iOS < 26 | expo-blur làm kính mờ dự phòng |

## 5. Bố cục

- Lề 16 pt; lưới 8 pt; khoảng giữa nhóm 24–32 pt.
- Bo góc **đồng tâm**:
  - nhóm 26 pt;
  - phần tử bên trong 16–18 pt;
  - nút: dạng **viên thuốc** (bo tròn hoàn toàn).
- Danh sách theo kiểu **inset grouped** của iOS; đường kẻ mảnh thay cho viền thẻ.
- Vùng chạm tối thiểu **44 × 44 pt**.

## 6. Biểu tượng, chuyển động, phản hồi

- **SF Symbols**, độ đậm khớp chữ đi kèm.
- **Haptics**:
  - nhẹ khi đánh dấu set, ghi nước;
  - thành công khi lưu bữa;
  - mạnh khi có màn tuyên dương.
- Animation ngắn (≤ 300 ms), dùng spring; tắt hoặc giảm khi bật **Giảm chuyển động**.

## 7. Trợ năng

- Mọi nút có nhãn VoiceOver; biểu đồ có mô tả bằng chữ.
- Tương phản chữ ≥ 4.5:1.
- Không dùng màu làm tín hiệu duy nhất: có thêm số liệu hoặc biểu tượng.

## 8. Bản xem trước

Artifact **AuraFit UI Preview** đã được vẽ lại theo tài liệu này. Trình duyệt không có SF Pro nên bản xem trước dùng font hệ thống gần nhất; trên iPhone thật sẽ là SF Pro.

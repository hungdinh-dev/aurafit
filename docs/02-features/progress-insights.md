# Module: Today & Progress

**Trạng thái:** 🟧 Thiết kế nháp · **Ưu tiên:** Must (màn Hôm nay), Should (thống kê dài hạn)

## Mục tiêu

Cho người dùng thấy **hôm nay cần làm gì** và **mình đang tiến bộ ra sao** – lý do quan trọng nhất để họ quay lại.

## 1. Màn "Hôm nay" (màn chính của app)

Từ trên xuống:
1. **Lời chào của huấn luyện viên** + điểm ngày tạm tính + streak 🔥 + số khiên 🛡️.
2. **Dinh dưỡng**: vòng kcal còn lại, thanh macro, nút **+ Thêm món** lớn.
3. **Nước**: thanh tiến độ + nút ly 1 chạm.
4. **Giấc ngủ đêm qua**: thời lượng, chất lượng (nếu chưa ghi → nút ghi nhanh).
5. **Buổi tập hôm nay**: tên buổi, số bài, nút Bắt đầu – hoặc "Ngày nghỉ".
6. **Cân nặng**: nếu hôm nay là ngày cần cân → ô nhập nhanh.

## 2. Thống kê theo ngày / tuần / tháng / năm (D-018)

- Dữ liệu gốc lưu theo ngày; tuần/tháng/năm là **tổng hợp** (trung bình, tổng, % ngày đạt).
- Mỗi chỉ số có biểu đồ với bộ chọn **T · Th · N** (tuần, tháng, năm):
  - kcal so với mục tiêu
  - protein
  - cân nặng (điểm cân thật + đường xu hướng)
  - giấc ngủ
  - nước
  - khối lượng tập
- **Heatmap kiểu GitHub** theo **điểm ngày**: ô càng đậm điểm càng cao; ô ⭐ có viền vàng. Bấm vào ô → xem chi tiết ngày đó (bữa ăn, ngủ, buổi tập).
- **Tổng kết tuần** (mỗi Chủ nhật): điểm trung bình, ngày tốt nhất, chỉ số tăng/giảm nhiều nhất, TDEE mới (nếu có).

## 3. Kỷ lục & sức khoẻ tim mạch

- **PR và 1RM ước tính** cho từng bài tập (xem `workout.md`).
- **Tuổi tim mạch** (Nes et al. 2014): để **sau MVP**. Chỉ hiển thị kèm ghi chú "ước tính, không phải chẩn đoán" (PI-2).

## Câu hỏi mở

**PI-3** (ảnh body theo thời gian).

## Tiêu chí chấp nhận (bản nháp)

- Màn Hôm nay mở ra là thấy ngay việc còn thiếu, không cần cuộn với nội dung 1–4.
- Biểu đồ năm tải trong < 1 giây (dùng bảng tổng hợp theo ngày).

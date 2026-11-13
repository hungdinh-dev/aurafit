# Bản xem trước giao diện (mockup)

Mã nguồn 35 màn của artifact **AuraFit UI Preview** (https://claude.ai/artifact/HAnTsEbBdyLQEkmMmydz6v).

- Mỗi file `*.dc.html` là một màn 390 × 844 (iPhone). Số thứ tự và mã chức năng của từng màn nằm trong `canvas.json` (trường `title`).
- Đối chiếu màn ↔ chức năng: [`../screen-map.md`](../screen-map.md).
- Các file dùng định dạng "Design canvas" (`{{ biến }}`, `sc-for`, `sc-if`, lớp `Component extends DCLogic`) và cần `support.js` của artifact để chạy, nên mở trực tiếp bằng trình duyệt sẽ không hiển thị đúng. Xem bản chạy được ở link artifact.
- Đây là tài liệu tham khảo cho `apps/mobile`, không phải code của app.

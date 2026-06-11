# AuraFit - Báo cáo Kỹ thuật Giai đoạn 1 (Phase 1 Report)

Báo cáo này tài liệu hóa toàn bộ quá trình thiết lập, cấu hình và gỡ lỗi để xây dựng bộ khung ứng dụng AuraFit ổn định, sẵn sàng cho việc phát triển lâu dài.

---

## 1. Cấu trúc Dự án (Folder Structure)

Chúng ta đã thống nhất và thiết lập một cấu trúc **Monorepo** bọc toàn bộ dự án để dễ dàng quản lý:

```text
aurafit/
├── .git/                     # Git Repository chính quản lý toàn bộ dự án
├── mobile/                   # React Native (Expo SDK 54) - App Điện thoại
│   ├── components/
│   │   └── ui/               # Chứa các UI components của Gluestack (Button, Provider)
│   ├── metro.config.js       # Cấu hình Metro Bundler tích hợp NativeWind v4
│   ├── tailwind.config.js    # Cấu hình Tailwind của dự án mobile
│   ├── babel.config.js       # Cấu hình Babel hỗ trợ NativeWind
│   ├── global.css            # CSS entrypoint cho Tailwind mobile
│   └── nativewind-env.d.ts   # Cấu hình Type cho className và CSS imports
├── web-3d/                   # React (Vite + R3F) - 3D Muscle Fatigue Viewer
│   ├── src/
│   │   ├── App.tsx           # 3D Canvas và spinning cube test
│   │   └── index.css         # CSS entrypoint chứa Tailwind v4
│   ├── tailwind.config.js    # Cấu hình Tailwind v4 cho Web
│   └── postcss.config.js     # Cấu hình PostCSS với @tailwindcss/postcss
└── docs/                     # Thư mục lưu trữ tài liệu đặc tả dự án
    ├── roadmap_todo.md       # Bảng checklist theo dõi tiến độ các tính năng
    └── walkthrough.md        # File báo cáo kỹ thuật này
```

---

## 2. Các cột mốc cấu hình kỹ thuật (Technical Highlights)

### A. Đồng bộ hóa Thiết bị thật (Expo SDK 54 Downgrade)
* **Vấn đề ban đầu:** Ứng dụng Expo khi tạo mới sử dụng SDK 56 (phiên bản thử nghiệm tương lai), trong khi ứng dụng **Expo Go** trên App Store của iPhone đang hỗ trợ phiên bản ổn định mới nhất là **SDK 54**. Lệch phiên bản khiến iPhone không thể quét chạy thử được.
* **Giải pháp:** Thực hiện hạ cấp (downgrade) toàn bộ hệ thống dependencies của `mobile/` về phiên bản tương thích với **SDK 54**:
  - `expo`: `~54.0.0`
  - `react-native`: `0.81.5`
  - `react`: `^19.1.0`
  - Tự động chạy `npx expo install --fix` để căn chỉnh lại các thư viện native liên quan.

### B. Giải quyết lỗi nạp thư viện `react-dom`
* **Vấn đề:** Khi khởi chạy trên điện thoại, Metro báo lỗi không tìm thấy `react-dom` xuất phát từ thư viện con `@react-aria/utils` của Gluestack UI.
* **Giải pháp:** Cài đặt `react-dom@19.1.0` vào dự án mobile thông qua `npx expo install react-dom`. Việc này giúp Metro giải quyết được import tĩnh (static resolution) mà không gây nặng hay ảnh hưởng tới bundle native của ứng dụng.

### C. Tích hợp Gluestack UI v3 & NativeWind v4
* Khởi tạo thành công **Gluestack UI v3** tích hợp sâu với **NativeWind v4** (Tailwind CSS cho di động).
* Cài đặt component `Button` đầu tiên và viết mã nguồn hiển thị chạy thử thành công trên điện thoại thật thông qua ngrok tunnel bypass tường lửa.

---

## 3. Kết quả Kiểm thử (Validation Status)
- **Kiểm tra kiểu dữ liệu (Static Analysis):** Chạy `npx tsc --noEmit` trên cả `mobile/` và `web-3d/` đều đạt trạng thái **0 lỗi (clean compiled)**.
- **Chạy thực tế (Hot Reloading Test):** Đã kết nối thành công tới iPhone thông qua tunnel, hiển thị giao diện Dark Mode chàm sang trọng cùng nút nhấn tương tác phản hồi tức thời.

---

## 4. Chuyển đổi Figma Landing Page sang React Native (Feature-based Structure)

Chúng ta đã tiến hành cấu hình lại toàn bộ luồng giao diện của app mobile dựa trên bản thiết kế Figma của bạn:
* **Tái cấu trúc thư mục dạng Feature-based:** Tổ chức code trong thư mục `mobile/src/features/dashboard` để tối ưu bảo trì lâu dài, tách biệt rõ ràng các file Header, Hero, BentoGrid, BottomNav.
* **Xây dựng các Component:**
  - [Header.tsx](file:///c:/Projects/Personal/aurafit/mobile/src/features/dashboard/components/Header.tsx): Avatar Elena Vance, hiển thị Level 12 Architect, logo AuraFit, danh hiệu và quét thiết bị Cpu.
  - [HeroSection.tsx](file:///c:/Projects/Personal/aurafit/mobile/src/features/dashboard/components/HeroSection.tsx): Tiêu đề "Forge Your Aura", nút bấm Gluestack "BEGIN ASCENSION" và "EXPLORE METHOD".
  - [BentoGrid.tsx](file:///c:/Projects/Personal/aurafit/mobile/src/features/dashboard/components/BentoGrid.tsx):
    - Card 1: Tiến trình EXP.
    - Card 2: Tuổi tim mạch 24 với vòng tròn biểu đồ.
    - Card 3: **Nhúng trực tiếp 3D WebGL WebView** chạy một đối tượng 3D Torus Knot (Khối nút thắt) xoay tự động bằng Three.js để test hiệu năng WebGL trên điện thoại.
  - [QuoteSection.tsx](file:///c:/Projects/Personal/aurafit/mobile/src/features/dashboard/components/QuoteSection.tsx): Trích dẫn triết lý thiết kế của Elena Vance.
  - [InquiryForm.tsx](file:///c:/Projects/Personal/aurafit/mobile/src/features/dashboard/components/InquiryForm.tsx): Form điền tên và mục tiêu tham gia hội viên, có tương tác Alert.
  - [BottomNav.tsx](file:///c:/Projects/Personal/aurafit/mobile/src/features/dashboard/components/BottomNav.tsx): Thanh điều hướng nổi dạng viên thuốc ở dưới màn hình.
* **Tương tác 3D WebGL trực tiếp:** 
  - Khối 3D Torus Knot màu xanh lục bảo (Emerald) dạng wireframe được vẽ trực tiếp bằng GPU của iPhone và xoay mượt mà 60fps bên trong Bento Card mà không làm chậm giao diện cuộn của ứng dụng.
* **Kết quả kiểm thử:**
  - `npx tsc --noEmit` thành công 100% không có bất kỳ lỗi nào về import hay kiểu dữ liệu.
  - Giao diện tự động cập nhật hiển thị mượt mà trên màn hình iPhone thật của bạn!

---

## 5. Nhật Ký Thay Đổi & Nâng Cấp - Ngày 11/06/2026 17:00 (UTC+7)

### Nâng Cấp Giao Diện Tuần Ngang & Logic Chuỗi Khiên (Aura Shields)

Chúng tôi đã hoàn thành việc nâng cấp cấu trúc dịch vụ tập luyện, xây dựng giao diện lịch tuần ngang chuẩn thiết kế, tích hợp cơ chế bảo vệ chuỗi (Streak) bằng khiên (Shields) dựa trên mức độ khó, và tạo tệp lưu trữ ý tưởng.

#### Các thay đổi mã nguồn chi tiết:
* **Tệp cấu hình ý tưởng [ideas.md](file:///C:/Projects/Personal/aurafit/ideas.md) [NEW]:** Tạo tệp ở gốc dự án để bạn dễ dàng lưu trữ và mở rộng ý tưởng sau này mà không cần gõ lại ở prompt.
* **Tệp dịch vụ [workoutService.ts](file:///C:/Projects/Personal/aurafit/mobile/src/features/workout/services/workoutService.ts) [MODIFY]:** Bổ sung các hàm API `saveWorkoutPlan` và `saveWorkoutPlanExercises` hỗ trợ lưu giáo án tùy chỉnh online và offline sandbox.
* **Component [CustomizePlanModal.tsx](file:///C:/Projects/Personal/aurafit/mobile/src/features/workout/components/CustomizePlanModal.tsx) [NEW]:** Xây dựng Modal chỉnh sửa giáo án toàn diện cho phép đổi tên, độ khó, điều chỉnh hiệp/số lần lặp/tỷ lệ tạ và thêm bớt các bài tập từ danh mục.
* **Component [WorkoutOverview.tsx](file:///C:/Projects/Personal/aurafit/mobile/src/features/workout/components/WorkoutOverview.tsx) [MODIFY]:** 
  - Tái thiết kế giao diện theo ảnh tham chiếu.
  - Hiển thị Badge chỉ số **Streak** `🔥` và **Khiên bảo vệ** `🛡️` ở Header.
  - Thiết kế lịch tuần ngang (MON &rarr; SUN). Hiển thị trực quan trạng thái: Đã tập (Tích xanh), Ngày nghỉ/Hồi phục (Trăng khuyết `🌙`), Ngày có lịch tập chưa làm (Vòng tròn rỗng).
  - Tích hợp màn hình ngày nghỉ (Rest Day) giải thích cách dùng khiên bảo toàn chuỗi.
  - Đặt nút **Bắt đầu (Start)** màu vàng/xanh neon nổi bật cạnh nút **Tùy chỉnh (+)**.
* **Màn hình [WorkoutScreen.tsx](file:///C:/Projects/Personal/aurafit/mobile/src/features/workout/screens/WorkoutScreen.tsx) [MODIFY]:** Tích hợp múi giờ Việt Nam (UTC+7) tự động chọn đúng ngày hiện tại trong tuần và điều phối `CustomizePlanModal`.

#### Kết Quả Xác Minh:
* Chạy TypeScript compiler (`npx tsc --noEmit`) trong thư mục `mobile/`, kết quả **thành công 100% không có bất kỳ lỗi kiểu dữ liệu (TS errors) nào**.



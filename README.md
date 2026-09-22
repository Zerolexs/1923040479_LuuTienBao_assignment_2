# Movie Watchlist App 🎬

Ứng dụng quản lý danh sách phim cần xem (Movie Watchlist), xây dựng bằng **React Native (Expo SDK 57)**, **TypeScript**, **Zustand**, **TanStack Query** và kết nối **TMDB API**.

- **Sinh viên thực hiện**: Lưu Tiến Bảo
- **Mã số sinh viên (MSSV)**: 1923040479
- **Môn học**: Lập trình thiết bị di động (Mobile App Development)

---

## 🛠 Yêu cầu môi trường
- **Node.js**: Phiên bản 18 trở lên (Khuyến nghị Node.js 20 LTS).
- **Trình quản lý gói**: `npm` (đi kèm Node.js).
- Thiết bị chạy thử: Trình duyệt Web (Chrome/Edge/Firefox), điện thoại cài ứng dụng **Expo Go**, hoặc Máy ảo Android/iOS Simulator.

---

## 🚀 Hướng dẫn cài đặt và chạy ứng dụng

### 1. Cài đặt các thư viện phụ thuộc (Dependencies)
Mở terminal tại thư mục gốc của dự án và chạy:
```bash
npm install
```

### 2. Kiểm tra lỗi kiểu dữ liệu TypeScript (Type-check)
Chạy lệnh kiểm tra tính toàn vẹn code và kiểu dữ liệu:
```bash
npx tsc --noEmit
```
*(Nếu terminal không xuất hiện thông báo lỗi và thoát với mã 0 là toàn bộ code đã chuẩn xác).*

### 3. Khởi chạy ứng dụng với Expo
Chạy máy chủ phát triển Expo:
```bash
npx expo start
```

Sau khi máy chủ khởi động:
- **Chạy trên Web**: Nhấn phím `w` hoặc chạy trực tiếp lệnh:
  ```bash
  npx expo start --web
  ```
- **Chạy trên Điện thoại thật**: Quét mã QR hiển thị trên Terminal bằng ứng dụng **Expo Go** (Android) hoặc Camera (iOS).
- **Chạy trên Máy ảo Android**: Nhấn phím `a` (cần cài đặt Android Studio & Emulator).

---

## ✨ Các tính năng chính
- 🎬 **Danh sách phim trực tuyến**: Tích hợp TMDB API qua TanStack Query, hỗ trợ cả Phim lẻ (Movie) và Phim bộ (TV Series).
- 🔄 **Cơ chế Fallback Domain**: Tự động chuyển đổi giữa `api.themoviedb.org` và `api.tmdb.org` khi gặp sự cố chặn mạng / DNS.
- ⚡ **Quản lý trạng thái xem (Zustand)**: Đánh dấu 1-tap "Đã xem" / "Cần xem", lưu bền vững vào `AsyncStorage`.
- 📊 **Thanh tiến độ xem phim**: Bấm vào thanh tiến độ để mở Bottom Sheet xem danh sách toàn bộ các phim đã xem và quản lý trạng thái.
- 🔍 **Tìm kiếm & Bộ lọc mượt mà**: Tìm kiếm theo tên có xử lý Debounce 250ms chống giật lag và mất focus bàn phím; lọc theo thể loại phim dạng cuộn ngang.
- 📄 **Trang Chi tiết phim (Dynamic Route)**: Đường dẫn `app/title/[id].tsx`, hiển thị Poster, thông tin phim và Accordion danh sách Mùa / Tập phim cho Phim bộ.
- 🌓 **Chuyển đổi giao diện Sáng / Tối (Light/Dark Mode Toggle)**: Nút bấm Icon ☀️/🌙 góc trên cùng bên phải, đạt chuẩn Touch Target 44x44 pt và lưu trạng thái vào bộ nhớ máy.
- ⚠️ **Banner trạng thái Mạng (Offline Banner)**: Tự động phát hiện và hiển thị cảnh báo khi mất kết nối Internet.

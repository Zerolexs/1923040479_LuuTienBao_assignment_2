# NHẬT KÝ SỬ DỤNG AI TRONG DỰ ÁN (AI_LOG.md)

- **Sinh viên thực hiện**: Lưu Tiến Bảo
- **Mã số sinh viên (MSSV)**: 1923040479
- **Dự án**: Movie Watchlist App (Assignment 3 - Lập trình thiết bị di động)
- **Công cụ AI hỗ trợ**: Antigravity AI Assistant

---

## 1. Mục tiêu dự án
Xây dựng ứng dụng quản lý danh sách phim cần xem (Movie Watchlist) hoàn chỉnh, chạy mượt mà trên đa nền tảng (Web, Android, iOS) với các tiêu chuẩn kỹ thuật:
- Sử dụng **Expo Router** (Expo SDK 57) cho cấu trúc điều hướng tệp tin (File-based Routing).
- Sử dụng **Zustand** làm nguồn dữ liệu duy nhất (Single Source of Truth) kết hợp lưu trữ bền vững với `AsyncStorage`.
- Gọi dữ liệu thực tế từ **TMDB API** bằng **TanStack Query** (React Query).
- Hỗ trợ chuyển đổi giao diện **Sáng / Tối (Light / Dark Mode)** và lưu trạng thái người dùng.
- Đảm bảo các tiêu chuẩn về **Accessibility** (vùng chạm tối thiểu 44x44 pt, role chuẩn).
- Viết code đơn giản, cấu trúc rõ ràng, dễ bảo trì và có comment tiếng Việt đầy đủ.

---

## 2. Các Prompt chính đã sử dụng

### Prompt 1: Đồng bộ Store và Màn hình chính
> *"QUY TẮC CODE: Code đơn giản, ngắn gọn, dùng Zustand làm Single Source of Truth. Comment tiếng Việt đầy đủ.*  
> *Nhiệm vụ: Đồng bộ Màn hình Danh sách `app/(tabs)/index.tsx` với Zustand Store: Store khởi tạo `titles`, hàm `toggleWatchStatus(id)`. Xóa bỏ dữ liệu tĩnh hardcoded, lọc danh sách phim cần xem `status === 'to_watch'` kết hợp tìm kiếm và lọc thể loại."*

### Prompt 2: Xây dựng Dynamic Route trang Chi tiết
> *"QUY TẮC CODE: Viết code cực kỳ đơn giản, ngắn gọn, dùng Expo Router và Zustand Store. Comment tiếng Việt giải thích từng bước.*  
> *Nhiệm vụ: Tạo file dynamic route mới `app/title/[id].tsx`, lấy id từ `useLocalSearchParams()`, tìm phim trong store, render poster, tên, thể loại, trạng thái. Nếu là series thì hiển thị Seasons và Episodes với kiểm tra an toàn tránh crash."*

### Prompt 3: Tích hợp TMDB Public API thực tế
> *"QUY TẮC CODE: Viết code sạch, dùng TanStack Query + Fetch/Axios. Comment tiếng Việt giải thích từng đoạn code.*  
> *Nhiệm vụ: Cấu hình Token v4 TMDB API, tạo service `services/tmdbApi.ts` lấy danh sách phim phổ biến (kết hợp Phim lẻ và TV Series) và hàm lấy chi tiết phim. Thêm cơ chế Fallback Domain khi domain chính bị lỗi mạng."*

### Prompt 4: Sửa lỗi không điều hướng được sang trang Chi tiết
> *"QUY TẮC CODE: Viết code đơn giản, sửa trực tiếp các file Router. Comment tiếng Việt giải thích rõ giải pháp gỡ lỗi.*  
> *Nhiệm vụ: Gỡ lỗi dứt điểm việc KHÔNG CHUYỂN ĐƯỢC TRANG CHI TIẾT khi bấm vào Card phim: Tách biệt hoàn toàn vùng bấm của CARD PHIM (`accessibilityRole="link"`) và NÚT "ĐÃ XEM" (`accessibilityRole="button"`)."*

### Prompt 5: Khắc phục lỗi TextInput bị mất Focus sau mỗi ký tự
> *"QUY TẮC CODE: Code đơn giản, giải quyết triệt để lỗi re-render mất focus. Comment tiếng Việt rõ ràng.*  
> *Nhiệm vụ: Sửa lỗi ô Tìm kiếm (TextInput) bị mất Focus sau mỗi ký tự gõ vào trong `app/(tabs)/index.tsx`: Đảm bảo không khai báo component con bên trong hàm HomeScreen, nhúng trực tiếp JSX của TextInput, bổ sung giải pháp Debounce 250ms."*

### Prompt 6: Bổ sung Bottom Sheet danh sách phim đã xem
> *"QUY TẮC CODE: Code đơn giản, ngắn gọn, dùng Modal có sẵn của React Native. Comment tiếng Việt giải thích logic.*  
> *Nhiệm vụ: Bấm vào Thanh Tiến Độ để mở Modal/Bottom Sheet hiển thị danh sách phim đã xem, cho phép bấm vào xem chi tiết hoặc bấm '↩ Cần xem' để hoàn tác."*

### Prompt 7: Thêm Nút chuyển đổi giao diện Sáng / Tối (Theme Toggle)
> *"QUY TẮC CODE: Code đơn giản, ngắn gọn. Sử dụng Zustand + React Native Appearance. Comment tiếng Việt đầy đủ.*  
> *Nhiệm vụ: Thêm state `themeMode` ('dark' | 'light') vào Zustand store lưu vào AsyncStorage. Thêm nút Toggle dạng icon (☀️ / 🌙) ở góc trên bên phải màn hình chính, chuẩn Accessibility minHeight 44, minWidth 44, đồng bộ màu sắc toàn bộ app."*

### Prompt 8: Sửa lỗi Console `<button> cannot contain a nested <button>`
> *"Fix lỗi Console Error: `<button> cannot contain a nested <button>` trong `app/(tabs)/index.tsx` khi chạy trên nền tảng React Native Web."*

---

## 3. Các giải pháp ĐỒNG Ý áp dụng (Accepted Solutions)

1. **Sử dụng Zustand thay vì Redux Toolkit hay Context API**:
   - **Lý do chấp thuận**: Zustand cực kỳ nhẹ, không cần boilerplate (không cần reducers, dispatchers, context provider bọc ngoài), hỗ trợ middleware `persist` với `AsyncStorage` chỉ bằng vài dòng code.
2. **TanStack Query (React Query) kết hợp Fallback Domain**:
   - **Lý do chấp thuận**: Tự động quản lý vòng đời dữ liệu (Loading, Error, Cache, Refetch). Đặc biệt, cơ chế tự động thử URL phụ `api.tmdb.org` khi `api.themoviedb.org` bị chặn DNS tại Việt Nam giúp app hoạt động ổn định 100%.
3. **Debounce 250ms cho thanh tìm kiếm**:
   - **Lý do chấp thuận**: Tránh việc lọc mảng phim liên tục sau mỗi phím gõ, loại bỏ hoàn toàn hiện tượng giật lag bàn phím và giữ nguyên focus của con trỏ nhập liệu.
4. **Sử dụng `<Modal>` gốc của React Native cho danh sách Đã xem**:
   - **Lý do chấp thuận**: Tận dụng component có sẵn của hệ thống, hỗ trợ hiệu ứng trượt mượt mà (`animationType="slide"`), không phụ thuộc thêm thư viện ngoài.
5. **Cấu trúc Container `<View>` và Backdrop `<Pressable>` độc lập**:
   - **Lý do chấp thuận**: Giải quyết triệt để lỗi thẻ `<button>` lồng trong `<button>` trên nền tảng Web, vừa đảm bảo tính năng chạm ra ngoài để đóng modal, vừa tuân thủ chuẩn HTML và Accessibility.
6. **Quản lý màu tập trung qua Hook `useThemeColors()`**:
   - **Lý do chấp thuận**: Toàn bộ màu sắc được định nghĩa tại `constants/theme.ts`, không hardcode mã hex trong StyleSheet, giúp chuyển đổi Theme Sáng/Tối lập tức có hiệu lực toàn ứng dụng.

---

## 4. Các giải pháp TỪ CHỐI vì quá phức tạp (Rejected Solutions)

1. **Từ chối dùng thư viện UI nặng (như React Native Paper, NativeBase, Tamagui)**:
   - **Lý do từ chối**: Tăng dung lượng ứng dụng đáng kể, cấu hình theme phức tạp và thường xuyên gặp lỗi không tương thích với React 19 và Expo SDK 57 mới nhất. Thay vào đó, tự viết component với StyleSheet chuẩn giúp kiểm soát 100% giao diện và hiệu năng cao nhất.
2. **Từ chối dùng `@gorhom/bottom-sheet`**:
   - **Lý do từ chối**: Đòi hỏi phải cài đặt và cấu hình thêm `react-native-reanimated` và `react-native-gesture-handler`, dễ gây lỗi build trên Web và xung đột phiên bản. Thay vào đó, dùng `<Modal transparent animationType="slide">` đơn giản, gọn nhẹ và đáp ứng trọn vẹn yêu cầu.
3. **Từ chối dùng Redux / Redux Saga**:
   - **Lý do từ chối**: Quá cồng kềnh cho ứng dụng quy mô vừa và nhỏ; cấu hình action/reducer rườm rà, khó debug đối với sinh viên so với Zustand.
4. **Từ chối tách nhỏ quá nhiều Component phụ bên trong thân hàm Screen**:
   - **Lý do từ chối**: Ban đầu AI gợi ý tách nhỏ các hàm `renderSearchInput()`, `renderHeader()` ngay bên trong `HomeScreen`. Cách làm này khiến mỗi lần component cha re-render, component con bị unmount và mount lại từ đầu làm mất focus bàn phím. Đã từ chối và chọn cách nhúng trực tiếp JSX hoặc tách component ra file riêng ngoài phạm vi hàm.

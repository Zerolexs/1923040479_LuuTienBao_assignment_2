/**
 * Định nghĩa bảng màu cho giao diện Sáng (Light Mode) và Tối (Dark Mode).
 * Tất cả các màn hình và component sẽ dùng màu từ file này, không dùng mã Hex trực tiếp.
 */
export const Colors = {
  // Bảng màu cho chế độ Sáng
  light: {
    background: '#F8F9FA',      // Màu nền chính của ứng dụng
    card: '#FFFFFF',            // Màu nền thẻ nội dung, danh sách
    text: '#111827',            // Màu chữ chính (tương phản cao, dễ đọc)
    textSecondary: '#6B7280',   // Màu chữ phụ (mô tả, nhãn phụ)
    primary: '#007AFF',         // Màu chủ đạo (nút bấm, icon nổi bật)
    border: '#E5E7EB',          // Màu đường viền ngăn cách
    error: '#EF4444',           // Màu đỏ báo lỗi, cảnh báo, giảm giá
    success: '#10B981',         // Màu xanh lá thành công, tăng giá
    warning: '#F59E0B',         // Màu vàng/cam cảnh báo (Offline Banner)
    warningText: '#FFFFFF',     // Màu chữ trên nền cảnh báo vàng/cam
    buttonText: '#FFFFFF',      // Màu chữ hiển thị trên nút bấm chính
  },

  // Bảng màu cho chế độ Tối
  dark: {
    background: '#121212',      // Màu nền chính chế độ tối
    card: '#1E1E1E',            // Màu nền thẻ nội dung chế độ tối
    text: '#F9FAFB',            // Màu chữ chính sáng trên nền tối
    textSecondary: '#9CA3AF',   // Màu chữ phụ chế độ tối
    primary: '#0A84FF',         // Màu chủ đạo sáng rõ trên nền tối
    border: '#2D3748',          // Màu đường viền chế độ tối
    error: '#F87171',           // Màu đỏ sáng cho nền tối
    success: '#34D399',         // Màu xanh lá sáng cho nền tối
    warning: '#D97706',         // Màu vàng/cam cảnh báo chế độ tối
    warningText: '#FFFFFF',     // Màu chữ trên nền cảnh báo vàng/cam
    buttonText: '#FFFFFF',      // Màu chữ hiển thị trên nút bấm chính
  },
};

// Kiểu dữ liệu bảng màu để TypeScript tự động gợi ý code chính xác
export type ThemeColors = typeof Colors.light;

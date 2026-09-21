import React from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useThemeColors } from '../hooks/useThemeColors';

/**
 * Các thuộc tính truyền vào AppButton (Props):
 * - title: Chữ hiển thị trên nút (bắt buộc)
 * - onPress: Hàm kích hoạt khi người dùng chạm vào nút
 * - disabled: Khóa nút không cho bấm (true/false, mặc định là false)
 * - style: Tùy biến kiểu dáng của khung nút bấm (nếu cần)
 * - textStyle: Tùy biến kiểu dáng chữ bên trong nút (nếu cần)
 */
interface AppButtonProps {
  title: string;
  onPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  accessibilityLabel?: string; // Nhãn trợ năng cho trình đọc màn hình
}

/**
 * Component nút bấm cơ bản: AppButton
 *
 * ĐẶC ĐIỂM:
 * 1. Bọc thẻ Pressable sẵn có của React Native (không cần cài thêm thư viện).
 * 2. Đã thiết lập accessibilityRole="button" hỗ trợ tính năng trợ năng.
 * 3. Kích thước vùng bấm tối thiểu 44x44 pt chuẩn Apple & Android.
 * 4. Tự đổi màu theo chế độ Sáng/Tối mà không cần mã màu Hex thủ công.
 *
 * CÁCH SỬ DỤNG:
 * ```tsx
 * import { AppButton } from './components/AppButton';
 *
 * // 1. Nút bấm thông thường:
 * <AppButton
 *   title="Thêm vào danh sách"
 *   onPress={() => console.log('Đã bấm!')}
 * />
 *
 * // 2. Nút bấm bị vô hiệu hóa (disabled):
 * <AppButton
 *   title="Đang tải..."
 *   disabled={true}
 * />
 * ```
 */
export function AppButton({
  title,
  onPress,
  disabled = false,
  style,
  textStyle,
  accessibilityLabel,
}: AppButtonProps) {
  // Lấy bộ màu theo chế độ sáng/tối hiện tại của thiết bị
  const colors = useThemeColors();

  return (
    <Pressable
      // Khai báo vai trò nút bấm cho trình đọc màn hình (Accessibility)
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      onPress={onPress}
      disabled={disabled}
      // Định kiểu dáng và hiệu ứng chạm
      style={({ pressed }) => [
        styles.button,
        {
          // Khi bị khóa dùng màu viền (border), bình thường dùng màu chủ đạo (primary)
          backgroundColor: disabled ? colors.border : colors.primary,
          // Khi nhấn giữ nút sẽ mờ nhẹ 30% tạo cảm giác bấm mượt mà
          opacity: pressed && !disabled ? 0.7 : 1,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            // Khi bị khóa dùng chữ phụ (textSecondary), bình thường dùng chữ trắng (buttonText)
            color: disabled ? colors.textSecondary : colors.buttonText,
          },
          textStyle,
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    // Đảm bảo kích thước vùng bấm tối thiểu đạt chuẩn 44x44 pt
    minHeight: 44,
    minWidth: 44,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
});

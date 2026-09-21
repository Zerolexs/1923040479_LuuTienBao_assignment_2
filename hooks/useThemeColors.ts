import { useColorScheme } from 'react-native';
import { Colors, ThemeColors } from '../constants/theme';

/**
 * Custom Hook: useThemeColors
 * Tự động lấy bộ màu (Light hoặc Dark) theo cài đặt hệ thống của điện thoại.
 *
 * Cách dùng:
 * const colors = useThemeColors();
 * <View style={{ backgroundColor: colors.background }} />
 */
export function useThemeColors(): ThemeColors {
  // Lấy chế độ màu của máy ('light' hoặc 'dark')
  const colorScheme = useColorScheme();

  // Trả về bộ màu tương ứng, mặc định là light nếu không xác định được
  return colorScheme === 'dark' ? Colors.dark : Colors.light;
}

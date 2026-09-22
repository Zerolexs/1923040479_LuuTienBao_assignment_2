import { Colors, ThemeColors } from '../constants/theme';
import { useThemeStore } from '../store/useThemeStore';

/**
 * Custom Hook: useThemeColors
 * Tự động lấy bộ màu (Light hoặc Dark) theo lựa chọn của người dùng trong Zustand Store (được lưu bền vững).
 *
 * Cách dùng:
 * const colors = useThemeColors();
 * <View style={{ backgroundColor: colors.background }} />
 */
export function useThemeColors(): ThemeColors {
  // Lấy themeMode trực tiếp từ Zustand Theme Store
  const themeMode = useThemeStore((state) => state.themeMode);

  // Trả về bộ màu tương ứng với theme hiện tại
  return themeMode === 'dark' ? Colors.dark : Colors.light;
}


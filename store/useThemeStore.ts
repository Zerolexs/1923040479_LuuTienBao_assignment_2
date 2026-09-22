import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';

export type ThemeMode = 'dark' | 'light';

/**
 * Interface định nghĩa trạng thái và các hành động quản lý Theme
 */
interface ThemeState {
  themeMode: ThemeMode;          // Chế độ theme hiện tại: 'dark' hoặc 'light'
  toggleTheme: () => void;       // Hàm chuyển đổi qua lại giữa 'dark' và 'light'
  setThemeMode: (mode: ThemeMode) => void; // Hàm gán trực tiếp themeMode
}

// Khởi tạo mặc định theo cài đặt hệ thống của thiết bị, mặc định 'dark'
const systemTheme = Appearance.getColorScheme();
const initialThemeMode: ThemeMode = systemTheme === 'light' ? 'light' : 'dark';

/**
 * Zustand Store: useThemeStore
 * Quản lý chế độ giao diện Sáng / Tối của toàn bộ ứng dụng.
 * Lưu trữ bền vững vào AsyncStorage để giữ nguyên lựa chọn của người dùng khi khởi động lại.
 */
export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      themeMode: initialThemeMode,

      /**
       * Chuyển đổi qua lại giữa chế độ Sáng và Tối
       */
      toggleTheme: () => {
        set((state) => ({
          themeMode: state.themeMode === 'dark' ? 'light' : 'dark',
        }));
      },

      /**
       * Đặt chế độ giao diện cụ thể
       */
      setThemeMode: (mode: ThemeMode) => {
        set({ themeMode: mode });
      },
    }),
    {
      name: 'app-theme-mode-storage', // Khóa lưu trữ trong AsyncStorage
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

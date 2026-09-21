import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

/**
 * Định nghĩa thông tin người dùng cơ bản
 */
export interface User {
  id: string;      // Mã người dùng
  name: string;    // Tên hiển thị
  email: string;   // Email đăng nhập
}

/**
 * Cấu trúc trạng thái (State) và các hàm xử lý của AuthStore
 */
interface AuthState {
  user: User | null;         // Thông tin người dùng hiện tại
  token: string | null;      // Token xác thực đăng nhập
  isLoading: boolean;        // Trạng thái đang kiểm tra đăng nhập lúc mở app

  // Các hàm thao tác
  signIn: (user: User, token: string) => Promise<void>;  // Đăng nhập
  signOut: () => Promise<void>;                         // Đăng xuất
  loadAuth: () => Promise<void>;                        // Tải lại đăng nhập khi mở app
}

// Khóa lưu trữ trong SecureStore
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

/**
 * Store quản lý đăng nhập sử dụng Zustand kết hợp expo-secure-store
 */
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: true, // Mặc định là true khi vừa bật app để load dữ liệu cũ

  /**
   * Hàm đăng nhập: Lưu thông tin người dùng và token vào SecureStore, đồng thời cập nhật store
   */
  signIn: async (user: User, token: string) => {
    try {
      // Lưu an toàn vào bộ nhớ máy (SecureStore)
      await SecureStore.setItemAsync(TOKEN_KEY, token);
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));

      // Cập nhật trạng thái trong Zustand
      set({ user, token });
    } catch (error) {
      console.error('Lỗi khi lưu thông tin đăng nhập:', error);
    }
  },

  /**
   * Hàm đăng xuất: Xóa sạch token và dữ liệu trong SecureStore, đặt lại trạng thái ban đầu
   */
  signOut: async () => {
    try {
      // Xóa dữ liệu khỏi SecureStore
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await SecureStore.deleteItemAsync(USER_KEY);

      // Đặt lại user và token về null
      set({ user: null, token: null });
    } catch (error) {
      console.error('Lỗi khi đăng xuất:', error);
    }
  },

  /**
   * Hàm khởi tạo: Đọc dữ liệu từ SecureStore khi mở app để giữ trạng thái đăng nhập
   */
  loadAuth: async () => {
    try {
      // Đọc token và user đã lưu từ trước
      const savedToken = await SecureStore.getItemAsync(TOKEN_KEY);
      const savedUserString = await SecureStore.getItemAsync(USER_KEY);

      if (savedToken && savedUserString) {
        const savedUser: User = JSON.parse(savedUserString);
        // Khôi phục lại trạng thái đăng nhập
        set({ user: savedUser, token: savedToken, isLoading: false });
      } else {
        set({ user: null, token: null, isLoading: false });
      }
    } catch (error) {
      console.error('Lỗi khi tải lại trạng thái đăng nhập:', error);
      set({ user: null, token: null, isLoading: false });
    }
  },
}));

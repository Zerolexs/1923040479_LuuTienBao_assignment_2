import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Title } from '../types/watchlist';
import { MOCK_TITLES } from '../services/mockData';

/**
 * Định nghĩa kiểu dữ liệu cho Store quản lý Watchlist
 */
interface WatchlistState {
  titles: Title[];                              // Danh sách toàn bộ phim
  toggleWatchStatus: (titleId: string) => void; // Đổi trạng thái xem phim và lưu vĩnh viễn
  resetWatchlist: () => void;                   // Đặt lại danh sách mặc định nếu cần
}

/**
 * Store quản lý Watchlist với tính năng lưu bền vững (Persistent Store):
 * - Sử dụng Zustand kết hợp AsyncStorage.
 * - Khi người dùng bấm "Đã xem", trạng thái mới sẽ tự động lưu vào bộ nhớ máy (Cache/Persistent Store).
 * - Khi tắt/khởi động lại ứng dụng, danh sách và trạng thái đã xem vẫn được giữ nguyên vẹn.
 */
export const useWatchlist = create<WatchlistState>()(
  persist(
    (set) => ({
      // Khởi tạo ban đầu từ MOCK_TITLES nếu chưa có trong bộ nhớ máy
      titles: MOCK_TITLES,

      /**
       * Hàm cập nhật trạng thái xem phim:
       * - Khi phim đang là 'to_watch' -> đổi ngay thành 'watched' (đã xem).
       * - Trạng thái mới này lập tức được ghi vào AsyncStorage qua middleware persist.
       * 
       * @param titleId Mã định danh duy nhất của phim
       */
      toggleWatchStatus: (titleId: string) => {
        set((state) => ({
          titles: state.titles.map((item) => {
            if (item.id === titleId) {
              const nextStatus = item.status === 'to_watch' ? 'watched' : 'to_watch';
              return { ...item, status: nextStatus };
            }
            return item;
          }),
        }));
      },

      /**
       * Hàm khôi phục lại danh sách phim gốc phục vụ kiểm thử
       */
      resetWatchlist: () => {
        set({ titles: MOCK_TITLES });
      },
    }),
    {
      name: 'movie-watchlist-storage',               // Khóa lưu trong AsyncStorage
      storage: createJSONStorage(() => AsyncStorage), // Sử dụng AsyncStorage để lưu bền vững
    }
  )
);

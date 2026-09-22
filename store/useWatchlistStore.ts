import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Title } from '../types/watchlist';
import { MOCK_TITLES } from '../services/mockData';

/**
 * Định nghĩa cấu trúc trạng thái của Watchlist Store
 */
interface WatchlistState {
  watchedIds: string[];                    // Danh sách các ID phim người dùng đã xem (lưu bền vững)
  titles: Title[];                         // Danh sách phim mẫu cơ sở
  toggleWatchStatus: (id: string) => void; // Hàm chuyển đổi trạng thái giữa 'to_watch' và 'watched'
  isWatched: (id: string) => boolean;      // Kiểm tra nhanh phim đã xem hay chưa
  resetWatchlist: () => void;              // Hàm khôi phục lại danh sách phim mặc định
}

// Danh sách các ID ban đầu đã xem từ mockData
const INITIAL_WATCHED_IDS = MOCK_TITLES.filter((t) => t.status === 'watched').map((t) => t.id);

/**
 * Zustand Store: useWatchlistStore
 * Quản lý trạng thái xem phim của người dùng cho cả API thực tế và Dữ liệu mẫu.
 * Tích hợp AsyncStorage qua middleware persist để giữ nguyên trạng thái khi restart app.
 */
export const useWatchlistStore = create<WatchlistState>()(
  persist(
    (set, get) => ({
      watchedIds: INITIAL_WATCHED_IDS,
      titles: MOCK_TITLES,

      /**
       * Đổi trạng thái xem của một phim (Chưa xem <-> Đã xem):
       * - Thêm/xóa ID khỏi mảng watchedIds
       * - Đồng bộ cập nhật trường status trong mảng titles nếu phim có trong store
       */
      toggleWatchStatus: (id: string) => {
        set((state) => {
          const alreadyWatched = state.watchedIds.includes(id);
          const nextWatchedIds = alreadyWatched
            ? state.watchedIds.filter((item) => item !== id)
            : [...state.watchedIds, id];

          const nextTitles = state.titles.map((movie) => {
            if (movie.id === id) {
              return {
                ...movie,
                status: alreadyWatched ? ('to_watch' as const) : ('watched' as const),
              };
            }
            return movie;
          });

          return {
            watchedIds: nextWatchedIds,
            titles: nextTitles,
          };
        });
      },

      /**
       * Kiểm tra xem một bộ phim bất kỳ (theo id) đã được đánh dấu là 'watched' hay chưa
       */
      isWatched: (id: string): boolean => {
        return get().watchedIds.includes(id);
      },

      /**
       * Đặt lại danh sách phim về trạng thái gốc từ MOCK_TITLES
       */
      resetWatchlist: () => {
        set({
          watchedIds: INITIAL_WATCHED_IDS,
          titles: MOCK_TITLES,
        });
      },
    }),
    {
      name: 'movie-watchlist-storage',                // Khóa lưu trong AsyncStorage
      storage: createJSONStorage(() => AsyncStorage),  // Bộ nhớ bền vững AsyncStorage
    }
  )
);

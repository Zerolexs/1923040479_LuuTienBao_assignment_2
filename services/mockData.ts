import { Title, WatchLog } from '../types/watchlist';

/**
 * Danh sách 6 bộ phim mẫu (3 Phim lẻ - Movie và 3 Phim bộ - Series)
 * Dùng để hiển thị và kiểm tra giao diện danh sách Watchlist.
 */
export const MOCK_TITLES: Title[] = [
  // ===================== 3 BỘ PHIM LẺ (MOVIE) =====================
  {
    id: 'movie-1',
    name: 'Inception (Kẻ Đánh Cắp Giấc Mơ)',
    type: 'movie',
    genre: ['Hành động', 'Khoa học viễn tưởng'],
    status: 'watched',
    posterUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'movie-2',
    name: 'Interstellar (Hố Đen Tử Thần)',
    type: 'movie',
    genre: ['Phiêu lưu', 'Khoa học viễn tưởng', 'Kịch tính'],
    status: 'to_watch',
    posterUrl: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'movie-3',
    name: 'Spirited Away (Vùng Đất Linh Hồn)',
    type: 'movie',
    genre: ['Hoạt hình', 'Phiêu lưu', 'Kỳ ảo'],
    status: 'watched',
    posterUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=600&q=80',
  },

  // ===================== 3 BỘ PHIM BỘ (SERIES) =====================
  {
    id: 'series-1',
    name: 'Breaking Bad (Biến Chất)',
    type: 'series',
    genre: ['Tội phạm', 'Kịch tính', 'Giật gân'],
    status: 'watched',
    posterUrl: 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?auto=format&fit=crop&w=600&q=80',
    seasons: [
      {
        seasonNumber: 1,
        episodes: [
          { id: 'ep-bb-101', episodeNumber: 1, name: 'Khởi đầu' },
          { id: 'ep-bb-102', episodeNumber: 2, name: 'Tình thế nan giải' },
          { id: 'ep-bb-103', episodeNumber: 3, name: 'Lựa chọn khó khăn' },
        ],
      },
      {
        seasonNumber: 2,
        episodes: [
          { id: 'ep-bb-201', episodeNumber: 1, name: 'Bước ngoặt mới' },
          { id: 'ep-bb-202', episodeNumber: 2, name: 'Bế tắc' },
        ],
      },
    ],
  },
  {
    id: 'series-2',
    name: 'Stranger Things (Cậu Bé Mất Tích)',
    type: 'series',
    genre: ['Kỳ ảo', 'Kinh dị', 'Kịch tính'],
    status: 'to_watch',
    posterUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80',
    seasons: [
      {
        seasonNumber: 1,
        episodes: [
          { id: 'ep-st-101', episodeNumber: 1, name: 'Sự biến mất của Will Byers' },
          { id: 'ep-st-102', episodeNumber: 2, name: 'Cô bé lập dị đường Maple' },
          { id: 'ep-st-103', episodeNumber: 3, name: 'Những ánh đèn nhấp nháy' },
        ],
      },
      {
        seasonNumber: 2,
        episodes: [
          { id: 'ep-st-201', episodeNumber: 1, name: 'Chúa tể điên cuồng' },
          { id: 'ep-st-202', episodeNumber: 2, name: 'Bóng ma quá khứ' },
        ],
      },
    ],
  },
  {
    id: 'series-3',
    name: 'Arcane (Hồi Kết Của Hai Thế Giới)',
    type: 'series',
    genre: ['Hoạt hình', 'Hành động', 'Khoa học viễn tưởng'],
    status: 'to_watch',
    posterUrl: 'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=600&q=80',
    seasons: [
      {
        seasonNumber: 1,
        episodes: [
          { id: 'ep-arc-101', episodeNumber: 1, name: 'Chào mừng bạn đến với Zaun' },
          { id: 'ep-arc-102', episodeNumber: 2, name: 'Bí mật Hextech' },
          { id: 'ep-arc-103', episodeNumber: 3, name: 'Bạo lực định hình số phận' },
        ],
      },
    ],
  },
];

/**
 * Danh sách mẫu nhật ký xem phim (WatchLog)
 * Hỗ trợ kiểm tra hiển thị lịch sử xem và đánh giá sao
 */
export const MOCK_WATCH_LOGS: WatchLog[] = [
  {
    id: 'log-1',
    titleId: 'movie-1',
    dateWatched: '2026-03-10',
    rating: 5,
  },
  {
    id: 'log-2',
    titleId: 'movie-3',
    dateWatched: '2026-03-15',
    rating: 5,
  },
  {
    id: 'log-3',
    titleId: 'series-1',
    dateWatched: '2026-03-18',
    rating: 4.5,
  },
];

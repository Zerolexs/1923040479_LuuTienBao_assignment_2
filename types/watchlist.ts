/**
 * Định nghĩa cấu trúc tập phim (dành cho phim bộ - series)
 */
export interface Episode {
  id: string;             // Mã định danh duy nhất của tập phim
  episodeNumber: number;  // Số thứ tự tập phim trong mùa (ví dụ: 1, 2, 3...)
  name: string;           // Tên của tập phim
}

/**
 * Định nghĩa cấu trúc một mùa phim (Season)
 */
export interface Season {
  seasonNumber: number;   // Số thứ tự mùa (ví dụ: Mùa 1, Mùa 2...)
  episodes: Episode[];    // Danh sách các tập phim thuộc mùa này
}

/**
 * Kiểu dữ liệu chính cho một bộ phim hoặc phim bộ (Title)
 */
export interface Title {
  id: string;                       // Mã định danh duy nhất của phim
  name: string;                     // Tên bộ phim
  type: 'movie' | 'series';         // Phân loại: 'movie' (phim lẻ) hoặc 'series' (phim bộ)
  genre: string[];                  // Danh sách các thể loại (ví dụ: ['Hành động', 'Khoa học viễn tưởng'])
  status: 'to_watch' | 'watched';   // Trạng thái: 'to_watch' (cần xem) hoặc 'watched' (đã xem)
  posterUrl: string;                // Đường dẫn hình ảnh poster/ảnh bìa của phim
  seasons?: Season[];               // Danh sách mùa và tập phim (chỉ có khi type là 'series')
}

/**
 * Kiểu dữ liệu ghi lại lịch sử xem và đánh giá phim (WatchLog)
 */
export interface WatchLog {
  id: string;           // Mã định danh duy nhất của lượt xem
  titleId: string;      // Mã phim liên kết (khớp với id trong Title)
  dateWatched: string;  // Ngày xem phim (định dạng YYYY-MM-DD)
  rating: number;       // Điểm đánh giá (thang điểm 1 đến 5 hoặc 1 đến 10)
}

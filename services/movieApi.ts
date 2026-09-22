import { Title, Season, Episode } from '../types/watchlist';
import { MOCK_TITLES } from './mockData';

const BASE_API_URL = 'https://phimapi.com';

/**
 * Hàm lấy danh sách phim hot / mới cập nhật từ Public API (phimapi.com).
 * Tự động chuyển đổi (map) dữ liệu từ API về đúng cấu trúc Title của ứng dụng.
 * Có cơ chế dự phòng (fallback) về MOCK_TITLES nếu gặp sự cố mạng hoặc lỗi kết nối.
 */
export async function fetchPopularTitles(): Promise<Title[]> {
  try {
    const response = await fetch(`${BASE_API_URL}/danh-sach/phim-moi-cap-nhat?page=1`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    if (!data.status || !Array.isArray(data.items)) {
      return MOCK_TITLES;
    }

    // Chuyển đổi mảng kết quả API sang định dạng Title của ứng dụng
    const mappedTitles: Title[] = data.items.map((item: any) => {
      // Xác định loại phim: Nếu TMDB ghi nhận là 'tv' hoặc tên có chứa chữ 'Phần' -> 'series', ngược lại là 'movie'
      const isSeries =
        item.tmdb?.type === 'tv' ||
        item.name.toLowerCase().includes('phần') ||
        item.name.toLowerCase().includes('season');

      return {
        id: item.slug || item._id,
        name: item.name,
        type: isSeries ? 'series' : 'movie',
        genre: ['Phổ biến', item.year ? `${item.year}` : 'Mới nhất'],
        status: 'to_watch' as const, // Mặc định là cần xem
        posterUrl:
          item.poster_url ||
          item.thumb_url ||
          'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=600&q=80',
      };
    });

    // Kết hợp thêm phim mẫu có sẵn để phong phú danh sách
    return [...mappedTitles, ...MOCK_TITLES];
  } catch (error) {
    console.warn('Lỗi khi gọi API danh sách phim, chuyển sang dùng dữ liệu mẫu:', error);
    return MOCK_TITLES;
  }
}

/**
 * Hàm lấy thông tin chi tiết của một bộ phim theo id (slug) và type từ Public API.
 * - Nếu là Movie: Lấy thông tin phim lẻ cơ bản.
 * - Nếu là Series: Lấy thông tin phim + danh sách các Mùa (Seasons) và Tập phim (Episodes).
 * 
 * @param id Slug hoặc ID của phim
 * @param type Loại phim ('movie' hoặc 'series')
 */
export async function fetchTitleDetail(id: string, type?: 'movie' | 'series'): Promise<Title | null> {
  if (!id) {
    return null;
  }

  // 1. Kiểm tra trước trong dữ liệu mẫu (để tương thích các ID cục bộ như 'movie-1', 'series-1')
  const localMock = MOCK_TITLES.find((m) => m.id === id);
  if (localMock) {
    return localMock;
  }

  // 2. Gọi API phim thực tế từ phimapi.com
  try {
    const response = await fetch(`${BASE_API_URL}/phim/${id}`);
    
    // Nếu phim không tồn tại (404)
    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`Lỗi kết nối máy chủ: ${response.status}`);
    }

    const data = await response.json();
    if (!data.status || !data.movie) {
      return null;
    }

    const movie = data.movie;

    // Xác định loại phim chính xác từ chi tiết API trả về
    const isSeries =
      type === 'series' ||
      movie.type === 'series' ||
      movie.type === 'tvshows' ||
      movie.name.toLowerCase().includes('phần') ||
      movie.name.toLowerCase().includes('season');

    // Chuyển đổi danh sách thể loại từ trường category của API
    const genres: string[] =
      Array.isArray(movie.category) && movie.category.length > 0
        ? movie.category.map((cat: any) => cat.name)
        : ['Phim ảnh'];

    // Xử lý danh sách Mùa và Tập phim nếu là phim bộ (Series)
    let seasons: Season[] | undefined = undefined;
    if (isSeries && Array.isArray(data.episodes) && data.episodes.length > 0) {
      seasons = data.episodes.map((serverGroup: any, serverIdx: number) => {
        const episodeList: Episode[] = Array.isArray(serverGroup.server_data)
          ? serverGroup.server_data.map((ep: any, epIdx: number) => ({
              id: ep.slug || `ep-${serverIdx + 1}-${epIdx + 1}`,
              episodeNumber: epIdx + 1,
              name: ep.name ? (ep.name.startsWith('Tập') ? ep.name : `Tập ${ep.name}`) : `Tập ${epIdx + 1}`,
            }))
          : [];

        return {
          seasonNumber: serverIdx + 1,
          episodes: episodeList,
        };
      });
    }

    return {
      id: movie.slug || id,
      name: movie.name || 'Không có tên',
      type: isSeries ? 'series' : 'movie',
      genre: genres,
      status: 'to_watch',
      posterUrl:
        movie.poster_url ||
        movie.thumb_url ||
        'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=600&q=80',
      seasons,
    };
  } catch (error) {
    console.error('Lỗi khi fetch chi tiết phim từ API:', error);
    // Ném lỗi để TanStack Query nhận diện isError và hiển thị nút Thử lại
    throw error;
  }
}

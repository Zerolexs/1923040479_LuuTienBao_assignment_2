import { Title, Season, Episode } from '../types/watchlist';
import { MOCK_TITLES } from './mockData';

// =============================================================================
// 1. CẤU HÌNH TOKEN TMDB API (V4 READ ACCESS TOKEN)
// =============================================================================
const TMDB_ACCESS_TOKEN =
  'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI4YTA0MjkwZjhkOWVhMTNlZDMwM2E3MWE3YWNjMmY3OCIsIm5iZiI6MTc5MDAzNzY0OS4yNzcsInN1YiI6IjZhYjFjZTkxMGM3MTY3MzRiMDk0NDk0YyIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.FTGcWyGk-t3uHIGnC5f6e1j_T3vcQSiEawztN42UDM4';

// Header chuẩn khi gọi API TMDB
const TMDB_HEADERS: HeadersInit = {
  Authorization: `Bearer ${TMDB_ACCESS_TOKEN}`,
  'Content-Type': 'application/json',
};

// Base URL chính thức và URL dự phòng (phòng khi ISP tại Việt Nam chặn api.themoviedb.org)
const TMDB_PRIMARY_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_FALLBACK_BASE_URL = 'https://api.tmdb.org/3';

// URL cơ sở để nạp ảnh bìa poster chất lượng cao
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

// Bảng ánh xạ mã thể loại ID sang tên tiếng Việt cho TMDB API
const TMDB_GENRES_MAP: Record<number, string> = {
  28: 'Hành Động',
  12: 'Phiêu Lưu',
  16: 'Hoạt Hình',
  35: 'Hài Hước',
  80: 'Hình Sự',
  99: 'Tài Liệu',
  18: 'Chính Kịch',
  10751: 'Gia Đình',
  14: 'Giả Tưởng',
  36: 'Lịch Sử',
  27: 'Kinh Dị',
  10402: 'Âm Nhạc',
  9648: 'Bí Ẩn',
  10749: 'Lãng Mạn',
  878: 'Khoa Học Viễn Tưởng',
  10770: 'Phim Truyền Hình',
  53: 'Gây Cấn',
  10752: 'Chiến Tranh',
  37: 'Miền Tây',
  10759: 'Hành Động & Phiêu Lưu',
  10762: 'Trẻ Em',
  10763: 'Tin Tức',
  10764: 'Thực Tế',
  10765: 'Khoa Học Giả Tưởng',
  10766: 'Truyền Hình Dài Tập',
  10767: 'Trò Chuyện',
  10768: 'Chính Trị & Quân Sự',
};

/**
 * Hàm gọi API TMDB có cơ chế tự động thử URL dự phòng:
 * - Đầu tiên thử `https://api.themoviedb.org/3`
 * - Nếu bị chặn mạng (ECONNRESET/DNS), tự động chuyển sang `https://api.tmdb.org/3`
 */
async function fetchTmdb(endpoint: string): Promise<any> {
  try {
    const res = await fetch(`${TMDB_PRIMARY_BASE_URL}${endpoint}`, {
      headers: TMDB_HEADERS,
      signal: AbortSignal.timeout(3000), // Timeout 3s để chuyển fallback nhanh chóng
    });
    if (res.ok) {
      return await res.json();
    }
    if (res.status === 404) {
      return null;
    }
  } catch {
    // Nếu gặp sự cố mạng với domain chính, tiếp tục với fallback domain
  }

  // Thử gọi qua domain dự phòng api.tmdb.org
  const fallbackRes = await fetch(`${TMDB_FALLBACK_BASE_URL}${endpoint}`, {
    headers: TMDB_HEADERS,
  });
  if (fallbackRes.status === 404) {
    return null;
  }
  if (!fallbackRes.ok) {
    throw new Error(`Lỗi kết nối TMDB API: HTTP ${fallbackRes.status}`);
  }
  return await fallbackRes.json();
}

/**
 * =============================================================================
 * 2. HÀM getPopularTitles(): Lấy danh sách phim phổ biến (Movie + TV Series)
 * =============================================================================
 * Gọi song song /movie/popular và /tv/popular, chuyển đổi chuẩn kiểu Title
 */
export async function getPopularTitles(): Promise<Title[]> {
  try {
    // Gọi song song cả phim lẻ hot và phim bộ hot
    const [movieData, tvData] = await Promise.all([
      fetchTmdb('/movie/popular?language=vi-VN&page=1'),
      fetchTmdb('/tv/popular?language=vi-VN&page=1'),
    ]);

    const mappedMovies: Title[] = Array.isArray(movieData?.results)
      ? movieData.results.map((item: any) => {
          const genreNames =
            Array.isArray(item.genre_ids) && item.genre_ids.length > 0
              ? item.genre_ids.map((id: number) => TMDB_GENRES_MAP[id] || 'Phim lẻ')
              : ['Phim lẻ'];

          return {
            id: String(item.id),
            name: item.title || item.original_title || 'Phim không tên',
            type: 'movie' as const,
            genre: genreNames.slice(0, 3),
            status: 'to_watch' as const,
            posterUrl: item.poster_path
              ? `${TMDB_IMAGE_BASE}${item.poster_path}`
              : 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=600&q=80',
          };
        })
      : [];

    const mappedSeries: Title[] = Array.isArray(tvData?.results)
      ? tvData.results.map((item: any) => {
          const genreNames =
            Array.isArray(item.genre_ids) && item.genre_ids.length > 0
              ? item.genre_ids.map((id: number) => TMDB_GENRES_MAP[id] || 'Phim bộ')
              : ['Phim bộ'];

          return {
            id: String(item.id),
            name: item.name || item.original_name || 'Phim không tên',
            type: 'series' as const,
            genre: genreNames.slice(0, 3),
            status: 'to_watch' as const,
            posterUrl: item.poster_path
              ? `${TMDB_IMAGE_BASE}${item.poster_path}`
              : 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=600&q=80',
          };
        })
      : [];

    // Kết hợp xen kẽ giữa phim lẻ và phim bộ để danh sách đa dạng
    const combined: Title[] = [];
    const maxLength = Math.max(mappedMovies.length, mappedSeries.length);
    for (let i = 0; i < maxLength; i++) {
      if (i < mappedMovies.length) combined.push(mappedMovies[i]);
      if (i < mappedSeries.length) combined.push(mappedSeries[i]);
    }

    // Kết hợp thêm các phim mẫu có sẵn trong ứng dụng
    return [...combined, ...MOCK_TITLES];
  } catch (error) {
    console.warn('Lỗi khi tải danh sách từ TMDB API, sử dụng dữ liệu mẫu:', error);
    return MOCK_TITLES;
  }
}

/**
 * =============================================================================
 * 3. HÀM getDetailTitle(id, type): Lấy thông tin chi tiết một bộ phim từ TMDB API
 * =============================================================================
 * - Nếu type === 'movie': Gọi API `/movie/{id}`
 * - Nếu type === 'series': Gọi API `/tv/{id}` để lấy chi tiết số Mùa và Tập phim
 *
 * @param id ID của phim trên TMDB (hoặc ID mẫu trong ứng dụng)
 * @param type Loại phim ('movie' hoặc 'series')
 */
export async function getDetailTitle(
  id: string,
  type?: 'movie' | 'series'
): Promise<Title | null> {
  if (!id) {
    return null;
  }

  // 1. Kiểm tra trước trong dữ liệu mẫu (để tương thích các ID cục bộ cũ như 'movie-1', 'series-1')
  const localMock = MOCK_TITLES.find((m) => m.id === id);
  if (localMock) {
    return localMock;
  }

  try {
    // 2. Phân loại để gọi đúng endpoint của TMDB API
    const isSeries = type === 'series';

    if (isSeries) {
      // Gọi chi tiết Phim bộ (TV Series)
      const tvData = await fetchTmdb(`/tv/${id}?language=vi-VN`);
      if (!tvData) {
        return null;
      }

      // Chuyển đổi danh sách thể loại
      const genres: string[] =
        Array.isArray(tvData.genres) && tvData.genres.length > 0
          ? tvData.genres.map((g: any) => g.name)
          : ['Phim bộ'];

      // Xử lý danh sách Mùa (Seasons) và Tập phim (Episodes)
      let seasons: Season[] | undefined = undefined;
      if (Array.isArray(tvData.seasons) && tvData.seasons.length > 0) {
        // Lọc bỏ season 0 (Specials) nếu có và lấy tối đa 5 mùa để tối ưu tốc độ
        const filteredSeasons = tvData.seasons.filter(
          (s: any) => s.season_number > 0
        );

        const targetSeasons =
          filteredSeasons.length > 0 ? filteredSeasons : tvData.seasons;

        // Gọi chi tiết danh sách tập phim cho từng mùa
        const seasonPromises = targetSeasons.slice(0, 4).map(async (s: any) => {
          try {
            const seasonDetail = await fetchTmdb(
              `/tv/${id}/season/${s.season_number}?language=vi-VN`
            );

            if (seasonDetail && Array.isArray(seasonDetail.episodes)) {
              const episodes: Episode[] = seasonDetail.episodes.map((ep: any) => ({
                id: String(ep.id || `${s.season_number}-${ep.episode_number}`),
                episodeNumber: ep.episode_number,
                name: ep.name || `Tập ${ep.episode_number}`,
              }));

              return {
                seasonNumber: s.season_number,
                episodes,
              };
            }
          } catch {
            // Dự phòng nếu không tải được chi tiết mùa
          }

          // Fallback tạo danh sách tập theo số lượng episode_count
          const count = s.episode_count || 1;
          const fallbackEpisodes: Episode[] = Array.from({ length: count }, (_, idx) => ({
            id: `s${s.season_number}-ep${idx + 1}`,
            episodeNumber: idx + 1,
            name: `Tập ${idx + 1}`,
          }));

          return {
            seasonNumber: s.season_number,
            episodes: fallbackEpisodes,
          };
        });

        seasons = await Promise.all(seasonPromises);
      }

      return {
        id: String(tvData.id || id),
        name: tvData.name || tvData.original_name || 'Phim bộ',
        type: 'series',
        genre: genres,
        status: 'to_watch',
        posterUrl: tvData.poster_path
          ? `${TMDB_IMAGE_BASE}${tvData.poster_path}`
          : 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=600&q=80',
        seasons,
      };
    } else {
      // Gọi chi tiết Phim lẻ (Movie)
      const movieData = await fetchTmdb(`/movie/${id}?language=vi-VN`);
      if (!movieData) {
        return null;
      }

      const genres: string[] =
        Array.isArray(movieData.genres) && movieData.genres.length > 0
          ? movieData.genres.map((g: any) => g.name)
          : ['Phim lẻ'];

      return {
        id: String(movieData.id || id),
        name: movieData.title || movieData.original_title || 'Phim lẻ',
        type: 'movie',
        genre: genres,
        status: 'to_watch',
        posterUrl: movieData.poster_path
          ? `${TMDB_IMAGE_BASE}${movieData.poster_path}`
          : 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=600&q=80',
      };
    }
  } catch (error) {
    console.error('Lỗi khi gọi getDetailTitle từ TMDB API:', error);
    // Ném lỗi để TanStack Query nhận diện isError và hiển thị nút Thử lại
    throw error;
  }
}

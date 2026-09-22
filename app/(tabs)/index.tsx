import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  Image,
  ActivityIndicator,
  Pressable,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useWatchlistStore } from '../../store/useWatchlistStore';
import { getPopularTitles } from '../../services/tmdbApi';
import { Title } from '../../types/watchlist';
import { AppButton } from '../../components/AppButton';
import { OfflineBanner } from '../../components/OfflineBanner';

/**
 * Màn hình chính danh sách phim cần xem (WatchlistScreen)
 * Nằm tại app/(tabs)/index.tsx theo chuẩn Expo Router.
 */
export default function WatchlistScreen() {
  // Lấy bảng màu hiện tại theo giao diện Sáng/Tối
  const colors = useThemeColors();

  // =========================================================================
  // 1. GỌI TMDB API QUA TANSTACK QUERY & KẾT HỢP ZUSTAND STORE
  // =========================================================================
  // Gọi API lấy danh sách phim phổ biến kết hợp Phim lẻ & Phim bộ
  const {
    data: apiTitles = [],
    isLoading,
    isError,
    refetch,
  } = useQuery<Title[]>({
    queryKey: ['popular-titles'],
    queryFn: getPopularTitles,
  });

  // Lấy danh sách ID đã xem và hàm cập nhật từ Zustand Store (Single Source of Truth)
  const { watchedIds, toggleWatchStatus, resetWatchlist } = useWatchlistStore();

  // Ánh xạ trạng thái 'watched' / 'to_watch' dựa trên watchedIds từ Zustand Store
  const titles: Title[] = useMemo(() => {
    return apiTitles.map((movie) => ({
      ...movie,
      status: watchedIds.includes(movie.id) ? ('watched' as const) : ('to_watch' as const),
    }));
  }, [apiTitles, watchedIds]);

  // =========================================================================
  // 2. QUẢN LÝ Ô TÌM KIẾM VỚI DEBOUNCE (TRÁNH RE-RENDER LIÊN TỤC VÀ ĐƠ BÀN PHÍM)
  // =========================================================================
  // State lưu giá trị nhập liệu trực tiếp của TextInput (cập nhật tức thì)
  const [searchQuery, setSearchQuery] = useState<string>('');

  // State lưu từ khóa tìm kiếm đã debounce 250ms để lọc dữ liệu mượt mà
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 250);

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

  const [selectedGenre, setSelectedGenre] = useState<string>('Tất cả');

  // =========================================================================
  // 3. TÍNH TOÁN TIẾN ĐỘ THỜI GIAN THỰC (REAL-TIME PROGRESS)
  // =========================================================================
  const totalTitles: number = titles.length;
  const watchedCount: number = titles.filter((item) => item.status === 'watched').length;
  const toWatchCount: number = titles.filter((item) => item.status === 'to_watch').length;
  const watchedPercentage: number =
    totalTitles > 0 ? Math.round((watchedCount / totalTitles) * 100) : 0;

  // Trích xuất danh sách tất cả các thể loại phim không trùng lặp
  const genres = useMemo(() => {
    const genreSet = new Set<string>();
    titles.forEach((item) => {
      item.genre.forEach((g) => genreSet.add(g));
    });
    return ['Tất cả', ...Array.from(genreSet)];
  }, [titles]);

  // =========================================================================
  // 4. LỌC DANH SÁCH "PHIM CẦN XEM" DỰA TRÊN DEBOUNCED SEARCH VÀ GENRE
  // =========================================================================
  const filteredTitles = useMemo(() => {
    const keyword = debouncedSearch.trim().toLowerCase();
    return titles.filter((item) => {
      // Điều kiện 1: Phải là phim chưa xem (to_watch)
      const isToWatch = item.status === 'to_watch';

      // Điều kiện 2: Khớp với từ khóa tìm kiếm theo tên
      const matchesSearch =
        keyword.length === 0 || item.name.toLowerCase().includes(keyword);

      // Điều kiện 3: Khớp với thể loại đã chọn
      const matchesGenre =
        selectedGenre === 'Tất cả' || item.genre.includes(selectedGenre);

      return isToWatch && matchesSearch && matchesGenre;
    });
  }, [titles, debouncedSearch, selectedGenre]);

  // ==================== TRẠNG THÁI 1: LOADING ====================
  if (isLoading) {
    return (
      <SafeAreaView
        style={[styles.centerContainer, { backgroundColor: colors.background }]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.centerText, { color: colors.textSecondary }]}>
          Đang tải danh sách phim từ máy chủ...
        </Text>
      </SafeAreaView>
    );
  }

  // ==================== TRẠNG THÁI 2: ERROR ====================
  if (isError) {
    return (
      <SafeAreaView
        style={[styles.centerContainer, { backgroundColor: colors.background }]}
      >
        <Text style={[styles.errorTitle, { color: colors.error }]}>
          Không thể tải danh sách phim
        </Text>
        <Text style={[styles.centerText, { color: colors.textSecondary }]}>
          Không thể kết nối với máy chủ phim. Vui lòng thử lại.
        </Text>
        <AppButton
          title="Thử lại"
          accessibilityLabel="Thử lại tải danh sách phim"
          onPress={() => refetch()}
          style={styles.retryButton}
        />
      </SafeAreaView>
    );
  }

  /**
   * Render từng mục phim (TRẠNG THÁI 4: CONTENT)
   * - Thẻ phim sử dụng <View> làm khung bao ngoài để tránh lỗi HTML "<button> cannot contain a nested <button>" trên Web.
   * - Vùng bấm xem chi tiết: <Pressable accessibilityRole="link"> bọc Poster và Thông tin phim.
   * - Nút "✓ Đã xem": <Pressable accessibilityRole="button"> là phần tử độc lập (sibling), không bị lồng nhau.
   */
  const renderItem = ({ item }: { item: Title }) => (
    <View
      style={[
        styles.movieCard,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
      ]}
    >
      {/* Vùng bấm xem chi tiết phim (Poster + Tên + Thể loại) */}
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={`Xem chi tiết phim ${item.name}`}
        accessibilityHint="Nhấn để xem thông tin chi tiết của bộ phim này"
        onPress={() => router.push(`/title/${item.id}?type=${item.type}`)}
        style={({ pressed }) => [
          styles.cardMainAction,
          { opacity: pressed ? 0.75 : 1 },
        ]}
      >
        {/* Ảnh bìa poster phim */}
        <Image
          source={{ uri: item.posterUrl }}
          style={styles.poster}
          resizeMode="cover"
        />

        {/* Thông tin chi tiết của phim */}
        <View style={styles.movieInfo}>
          <Text style={[styles.movieName, { color: colors.text }]} numberOfLines={2}>
            {item.name}
          </Text>

          {/* Thể loại & định dạng phim */}
          <Text
            style={[styles.movieMeta, { color: colors.textSecondary }]}
            numberOfLines={1}
          >
            {item.type === 'movie' ? '🎬 Phim lẻ' : '📺 Phim bộ'} • {item.genre.join(', ')}
          </Text>
        </View>
      </Pressable>

      {/* 
        Nút 1-tap "✓ Đã xem" đặt độc lập bên cạnh (sibling) - KHÔNG lồng bên trong button khác:
        - Giải quyết triệt để lỗi Console: "<button> cannot contain a nested <button>" trên React Native Web.
        - Bấm nút lập tức đánh dấu đã xem mà không kích hoạt mở trang Chi tiết.
      */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Đánh dấu phim ${item.name} là đã xem`}
        accessibilityHint="Chuyển trạng thái sang đã xem và loại khỏi danh sách cần xem"
        onPress={() => toggleWatchStatus(item.id)}
        style={({ pressed }) => [
          styles.watchedButton,
          {
            backgroundColor: colors.primary,
            opacity: pressed ? 0.7 : 1,
          },
        ]}
      >
        <Text style={[styles.watchedButtonText, { color: colors.buttonText }]}>
          ✓ Đã xem
        </Text>
      </Pressable>
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.screenContainer, { backgroundColor: colors.background }]}
    >
      {/* Banner cảnh báo Offline tự động hiển thị khi mất mạng */}
      <OfflineBanner />

      {/* 
        =============================================================================
        NHÚNG TRỰC TIẾP JSX TÌM KIẾM VÀ HEADER VÀO LAYOUT CHÍNH:
        - Không khai báo component phụ hay hàm renderHeader bên trong hàm HomeScreen.
        - TextInput giữ nguyên con trỏ và Focus khi gõ, không bị unmount hay re-mount.
        - TextInput dùng value={searchQuery} và onChangeText={(text) => setSearchQuery(text)}.
        - KHÔNG gán key động cho TextInput.
        =============================================================================
      */}
      <View style={styles.headerContainer}>
        {/* Khối hiển thị tiến độ xem phim */}
        <View
          style={[
            styles.progressCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={styles.progressTextRow}>
            <Text style={[styles.progressTitle, { color: colors.text }]}>
              Tiến độ xem phim
            </Text>
            <Text style={[styles.progressPercent, { color: colors.primary }]}>
              {watchedPercentage}%
            </Text>
          </View>

          {/* Thanh tiến độ trực quan */}
          <View
            style={[styles.progressBarBackground, { backgroundColor: colors.border }]}
          >
            <View
              style={[
                styles.progressBarFill,
                {
                  backgroundColor: colors.success,
                  width: `${watchedPercentage}%`,
                },
              ]}
            />
          </View>

          <Text style={[styles.progressSubtext, { color: colors.textSecondary }]}>
            Đã xem {watchedCount} trên tổng số {totalTitles} bộ phim
          </Text>
        </View>

        {/* Thanh tìm kiếm theo tên phim - Nhúng trực tiếp, không qua hàm con */}
        <View
          style={[
            styles.searchBox,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <TextInput
            value={searchQuery}
            onChangeText={(text) => setSearchQuery(text)}
            placeholder="Tìm kiếm phim theo tên..."
            placeholderTextColor={colors.textSecondary}
            style={[styles.searchInput, { color: colors.text }]}
            accessibilityLabel="Ô tìm kiếm phim theo tên"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {/* Nút xóa từ khóa tìm kiếm */}
          {searchQuery.trim().length > 0 && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Xóa nội dung tìm kiếm"
              onPress={() => setSearchQuery('')}
              style={styles.clearSearchButton}
            >
              <Text style={[styles.clearSearchText, { color: colors.textSecondary }]}>
                ✕
              </Text>
            </Pressable>
          )}
        </View>

        {/* Bộ lọc thể loại dạng cuộn ngang */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.genreList}
        >
          {genres.map((genre) => {
            const isSelected = selectedGenre === genre;
            return (
              <Pressable
                key={genre}
                accessibilityRole="button"
                accessibilityLabel={`Lọc theo thể loại: ${genre}`}
                accessibilityState={{ selected: isSelected }}
                accessibilityHint={
                  isSelected
                    ? 'Đang chọn thể loại này'
                    : `Nhấn để lọc danh sách phim theo thể loại ${genre}`
                }
                onPress={() => setSelectedGenre(genre)}
                style={[
                  styles.genreChip,
                  {
                    backgroundColor: isSelected ? colors.primary : colors.card,
                    borderColor: isSelected ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.genreChipText,
                    { color: isSelected ? colors.buttonText : colors.text },
                  ]}
                >
                  {genre}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Tiêu đề danh sách: Số lượng phim giảm ngay lập tức khi bấm Đã xem */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {searchQuery.trim().length > 0 || selectedGenre !== 'Tất cả'
              ? `Phim cần xem (${filteredTitles.length}/${toWatchCount})`
              : `Phim cần xem (${toWatchCount})`}
          </Text>
        </View>
      </View>

      {/* Danh sách phim - cuộn mượt mà phía dưới */}
      <FlatList
        data={filteredTitles}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {searchQuery.trim().length > 0 || selectedGenre !== 'Tất cả'
                ? 'Không tìm thấy bộ phim nào phù hợp với bộ lọc.'
                : 'Tuyệt vời! Bạn đã xem hết các bộ phim trong danh sách.'}
            </Text>
            {toWatchCount === 0 && (
              <AppButton
                title="Đặt lại danh sách mẫu"
                accessibilityLabel="Đặt lại danh sách mẫu để kiểm tra"
                onPress={resetWatchlist}
                style={styles.resetButton}
              />
            )}
          </View>
        }
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  centerText: {
    marginTop: 12,
    fontSize: 15,
    textAlign: 'center',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  retryButton: {
    marginTop: 16,
    minWidth: 140,
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    marginBottom: 4,
  },
  // Khối tiến độ
  progressCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  progressTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  progressPercent: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  progressBarBackground: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressSubtext: {
    fontSize: 13,
  },
  // Ô tìm kiếm
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingLeft: 12,
    marginBottom: 12,
    minHeight: 44, // Chuẩn chạm 44pt
  },
  searchInput: {
    flex: 1,
    minHeight: 44,
    fontSize: 15,
  },
  clearSearchButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearSearchText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Bộ lọc thể loại
  genreList: {
    paddingVertical: 4,
    gap: 8,
    marginBottom: 12,
  },
  genreChip: {
    minHeight: 44, // Kích thước chuẩn chạm 44x44 pt
    minWidth: 44,
    paddingHorizontal: 16,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  genreChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  // Tiêu đề phần
  sectionHeader: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
  },
  // Thẻ phim (Card container)
  movieCard: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  // Vùng nhấn xem chi tiết phim (Poster + Thông tin)
  cardMainAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
    minHeight: 44, // Chuẩn Touch Target tối thiểu 44pt
  },
  poster: {
    width: 70,
    height: 95,
    borderRadius: 8,
  },
  movieInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  movieName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  movieMeta: {
    fontSize: 13,
  },
  // Nút Đã xem (1-tap) - Độc lập, không lồng nhau
  watchedButton: {
    minHeight: 44, // Đảm bảo diện tích chạm tối thiểu 44x44 pt
    minWidth: 44,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  watchedButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  // Trạng thái trống
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  resetButton: {
    marginTop: 16,
    minWidth: 180,
  },
});

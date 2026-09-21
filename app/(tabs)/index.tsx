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
import { useRouter } from 'expo-router';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useWatchlist } from '../../hooks/useWatchlist';
import { Title } from '../../types/watchlist';
import { AppButton } from '../../components/AppButton';
import { OfflineBanner } from '../../components/OfflineBanner';

/**
 * Màn hình chính danh sách phim cần xem (WatchlistScreen)
 * Nằm tại app/(tabs)/index.tsx theo chuẩn Expo Router.
 */
export default function WatchlistScreen() {
  const router = useRouter();

  // Lấy bảng màu hiện tại theo giao diện Sáng/Tối
  const colors = useThemeColors();

  // Lấy dữ liệu và hàm thao tác từ persistent custom hook (lưu vĩnh viễn trong AsyncStorage)
  const { titles, toggleWatchStatus, resetWatchlist } = useWatchlist();

  // Quản lý trạng thái tìm kiếm và bộ lọc
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedGenre, setSelectedGenre] = useState<string>('Tất cả');

  // Quản lý 4 trạng thái màn hình: Loading, Error, Empty, Content
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);

  /**
   * Giả lập nạp dữ liệu (phục vụ hiển thị trạng thái Loading và cho phép Thử lại khi Error)
   */
  const loadData = () => {
    setIsLoading(true);
    setIsError(false);

    // Thời gian trễ ngắn để hiển thị ActivityIndicator
    setTimeout(() => {
      setIsLoading(false);
    }, 300);
  };

  useEffect(() => {
    loadData();
  }, []);

  // =========================================================================
  // 1. CÔNG THỨC TÍNH TỶ LỆ (%) PHIM ĐÃ XEM:
  // % Phim đã xem = (Số phim có trạng thái 'watched' / Tổng số phim) * 100
  //
  // GIẢI THÍCH:
  // - Tính toán trực tiếp dựa trên state 'titles' đang có trong Persistent Store.
  // - Khi người dùng bấm nút "Đã xem", trạng thái phim đổi sang 'watched',
  //   watchedCount tăng lên, toWatchCount giảm đi, watchedPercentage tự động cập nhật ngay.
  // - Nếu totalTitles = 0, trả về 0 để tránh phép chia cho 0 (lỗi NaN).
  // =========================================================================
  const totalTitles = titles.length;
  const watchedCount = titles.filter((item) => item.status === 'watched').length;
  const toWatchCount = titles.filter((item) => item.status === 'to_watch').length;
  const watchedPercentage =
    totalTitles > 0 ? Math.round((watchedCount / totalTitles) * 100) : 0;

  // Trích xuất danh sách tất cả các thể loại phim không trùng lặp
  const genres = useMemo(() => {
    const genreSet = new Set<string>();
    titles.forEach((item) => {
      item.genre.forEach((g) => genreSet.add(g));
    });
    return ['Tất cả', ...Array.from(genreSet)];
  }, [titles]);

  // Lọc danh sách phim cần hiển thị:
  // 1. Chỉ lấy phim có trạng thái 'to_watch' (chưa xem)
  // 2. Tìm kiếm theo tên (không phân biệt hoa/thường)
  // 3. Lọc theo thể loại đã chọn
  const filteredTitles = useMemo(() => {
    return titles.filter((item) => {
      // Điều kiện 1: Phải là phim chưa xem
      const isToWatch = item.status === 'to_watch';

      // Điều kiện 2: Khớp với từ khóa tìm kiếm trong tên
      const matchesSearch = item.name
        .toLowerCase()
        .includes(searchQuery.trim().toLowerCase());

      // Điều kiện 3: Khớp với thể loại được chọn (hoặc chọn 'Tất cả')
      const matchesGenre =
        selectedGenre === 'Tất cả' || item.genre.includes(selectedGenre);

      return isToWatch && matchesSearch && matchesGenre;
    });
  }, [titles, searchQuery, selectedGenre]);

  // ==================== TRẠNG THÁI 1: LOADING ====================
  if (isLoading) {
    return (
      <SafeAreaView
        style={[styles.centerContainer, { backgroundColor: colors.background }]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.centerText, { color: colors.textSecondary }]}>
          Đang tải danh sách phim...
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
          Đã có lỗi xảy ra. Vui lòng thử lại.
        </Text>
        <AppButton
          title="Thử lại"
          accessibilityLabel="Thử lại tải danh sách phim"
          onPress={loadData}
          style={styles.retryButton}
        />
      </SafeAreaView>
    );
  }

  /**
   * Component phần đầu danh sách (Header):
   * Gồm thanh tiến độ xem phim, ô tìm kiếm và danh sách nút bấm lọc thể loại.
   */
  const renderHeader = () => (
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

      {/* Thanh tìm kiếm theo tên phim */}
      <View
        style={[
          styles.searchBox,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Tìm kiếm phim theo tên..."
          placeholderTextColor={colors.textSecondary}
          style={[styles.searchInput, { color: colors.text }]}
          accessibilityLabel="Ô tìm kiếm phim theo tên"
        />
        {/* Nút xóa từ khóa tìm kiếm (Đảm bảo chuẩn chạm 44x44 pt và Accessibility) */}
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
  );

  /**
   * Component khi danh sách trống (TRẠNG THÁI 3: EMPTY)
   */
  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
        {searchQuery.trim().length > 0 || selectedGenre !== 'Tất cả'
          ? 'Không tìm thấy bộ phim nào phù hợp với bộ lọc.'
          : 'Tuyệt vời! Bạn đã xem hết các bộ phim trong danh sách.'}
      </Text>
      {/* Nút khôi phục lại danh sách mẫu để tiện kiểm tra */}
      {toWatchCount === 0 && (
        <AppButton
          title="Đặt lại danh sách mẫu"
          accessibilityLabel="Đặt lại danh sách mẫu để kiểm tra"
          onPress={resetWatchlist}
          style={styles.resetButton}
        />
      )}
    </View>
  );

  /**
   * Render từng mục phim (TRẠNG THÁI 4: CONTENT)
   * Nút "Đã xem" (1-tap): Bấm là đổi status, phim sẽ tự biến mất khỏi danh sách 'to_watch'
   */
  const renderItem = ({ item }: { item: Title }) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Xem chi tiết phim ${item.name}`}
      accessibilityHint="Nhấn để xem thông tin chi tiết của bộ phim này"
      onPress={() => router.push(`/title/${item.id}`)}
      style={({ pressed }) => [
        styles.movieCard,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          opacity: pressed ? 0.9 : 1,
        },
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

        {/* Nút 1-tap chuyển sang Đã xem (Đảm bảo chuẩn touch target tối thiểu 44x44 pt và Accessibility) */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Đánh dấu phim ${item.name} là đã xem`}
          accessibilityHint="Chuyển trạng thái sang đã xem và loại khỏi danh sách cần xem"
          onPress={(e) => {
            // Ngăn chặn sự kiện nổi bọt để không mở trang chi tiết khi bấm nút Đã xem
            e.stopPropagation();
            toggleWatchStatus(item.id);
          }}
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
    </Pressable>
  );

  return (
    <SafeAreaView
      style={[styles.screenContainer, { backgroundColor: colors.background }]}
    >
      {/* Banner cảnh báo Offline tự động hiển thị khi mất mạng */}
      <OfflineBanner />

      <FlatList
        data={filteredTitles}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
  },
  listContent: {
    padding: 16,
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
    marginBottom: 16,
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
    minHeight: 44, // Đạt kích thước tối thiểu 44pt
  },
  searchInput: {
    flex: 1,
    minHeight: 44,
    fontSize: 15,
  },
  clearSearchButton: {
    minWidth: 44,  // Đảm bảo kích thước tối thiểu 44x44 pt
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
    minHeight: 44, // Kích thước chuẩn chạm tối thiểu 44x44 pt
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
  // Thẻ phim (Card)
  movieCard: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  poster: {
    width: 70,
    height: 95,
    borderRadius: 8,
  },
  movieInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  movieName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  movieMeta: {
    fontSize: 13,
    marginBottom: 10,
  },
  // Nút Đã xem (1-tap)
  watchedButton: {
    minHeight: 44, // Đảm bảo diện tích chạm tối thiểu 44x44 pt
    minWidth: 44,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
  },
  watchedButtonText: {
    fontSize: 14,
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

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  SafeAreaView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useWatchlist } from '../../hooks/useWatchlist';
import { Title } from '../../types/watchlist';
import { AppButton } from '../../components/AppButton';

/**
 * Màn hình Chi tiết phim (TitleDetailScreen)
 * Đường dẫn: app/title/[id].tsx
 */
export default function TitleDetailScreen() {
  // =========================================================================
  // 1. LẤY ID TỪ ROUTE PARAMS ĐỂ TÌM PHIM TRONG STORE
  // =========================================================================
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  // Bảng màu giao diện theo chuẩn Light / Dark mode
  const colors = useThemeColors();

  // Lấy dữ liệu danh sách và hàm cập nhật từ Persistent Zustand Store
  const { titles, toggleWatchStatus } = useWatchlist();

  // Tìm phim theo mã định danh (id) được truyền qua router
  const title: Title | undefined = titles.find((item) => item.id === id);

  // Quản lý các trạng thái giao diện: Loading, Error
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);

  /**
   * Hàm nạp dữ liệu phim (hỗ trợ hiển thị Loading và xử lý Thử lại khi có lỗi)
   */
  const loadTitleData = (): void => {
    setIsLoading(true);
    setIsError(false);

    // Thời gian trễ ngắn mô phỏng quá trình đọc Cache/Store
    setTimeout(() => {
      // Nếu có id nhưng không tìm thấy phim và có lỗi kết nối thì có thể set isError
      // Ở đây hoàn tất nạp thành công trạng thái
      setIsLoading(false);
    }, 250);
  };

  useEffect(() => {
    loadTitleData();
  }, [id]);

  // =========================================================================
  // 2. XỬ LÝ 4 TRẠNG THÁI GIAO DIỆN (UI STATES)
  // =========================================================================

  // TRẠNG THÁI 1: LOADING (Đang tải dữ liệu)
  if (isLoading) {
    return (
      <SafeAreaView
        style={[styles.container, styles.centerBox, { backgroundColor: colors.background }]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.statusSubtext, { color: colors.textSecondary }]}>
          Đang tải thông tin phim...
        </Text>
      </SafeAreaView>
    );
  }

  // TRẠNG THÁI 2: ERROR (Lỗi tải dữ liệu kèm nút Thử lại)
  if (isError) {
    return (
      <SafeAreaView
        style={[styles.container, styles.centerBox, { backgroundColor: colors.background }]}
      >
        <Text style={[styles.errorHeading, { color: colors.error }]}>
          Không thể tải dữ liệu
        </Text>
        <Text style={[styles.statusSubtext, { color: colors.textSecondary }]}>
          Đã có lỗi xảy ra. Vui lòng thử lại.
        </Text>
        <AppButton
          title="Thử lại"
          accessibilityLabel="Thử lại tải thông tin phim"
          onPress={loadTitleData}
          style={styles.stateActionButton}
        />
      </SafeAreaView>
    );
  }

  // TRẠNG THÁI 3: EMPTY (Không tìm thấy phim với id tương ứng)
  if (!title) {
    return (
      <SafeAreaView
        style={[styles.container, styles.centerBox, { backgroundColor: colors.background }]}
      >
        <Text style={[styles.emptyHeading, { color: colors.text }]}>
          Không tìm thấy phim
        </Text>
        <Text style={[styles.statusSubtext, { color: colors.textSecondary }]}>
          Bộ phim này không tồn tại trong danh sách hoặc đã bị xóa.
        </Text>
        <AppButton
          title="Quay lại danh sách"
          accessibilityLabel="Quay lại danh sách phim"
          onPress={() => router.back()}
          style={styles.stateActionButton}
        />
      </SafeAreaView>
    );
  }

  // TRẠNG THÁI 4: CONTENT (Hiển thị đầy đủ nội dung chi tiết của bộ phim)
  const isWatched: boolean = title.status === 'watched';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Nút quay lại đạt chuẩn Touch Target 44x44 pt và Accessibility */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Quay lại màn hình trước"
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.backNavButton,
            {
              borderColor: colors.border,
              backgroundColor: colors.card,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <Text style={[styles.backNavText, { color: colors.text }]}>← Quay lại</Text>
        </Pressable>

        {/* Poster phim */}
        <Image
          source={{ uri: title.posterUrl }}
          style={styles.poster}
          resizeMode="cover"
        />

        {/* Khối thông tin chi tiết */}
        <View
          style={[
            styles.infoCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          {/* Tên phim */}
          <Text style={[styles.titleName, { color: colors.text }]}>
            {title.name}
          </Text>

          {/* Huy hiệu Phân loại & Trạng thái */}
          <View style={styles.badgeRow}>
            <View style={[styles.badge, { backgroundColor: colors.primary }]}>
              <Text style={[styles.badgeText, { color: colors.buttonText }]}>
                {title.type === 'movie' ? '🎬 Phim lẻ (Movie)' : '📺 Phim bộ (Series)'}
              </Text>
            </View>

            <View
              style={[
                styles.badge,
                { backgroundColor: isWatched ? colors.success : colors.error },
              ]}
            >
              <Text style={[styles.badgeText, { color: colors.buttonText }]}>
                {isWatched ? '✓ Đã xem' : '⏳ Cần xem'}
              </Text>
            </View>
          </View>

          {/* Danh sách thể loại (Genre Chips) */}
          <View style={styles.genreList}>
            {title.genre.map((genreName) => (
              <View
                key={genreName}
                style={[
                  styles.genreChip,
                  { backgroundColor: colors.background, borderColor: colors.border },
                ]}
              >
                <Text style={[styles.genreChipText, { color: colors.textSecondary }]}>
                  {genreName}
                </Text>
              </View>
            ))}
          </View>

          {/* 
            Nút đổi trạng thái 1-Tap:
            - Chuyển đổi qua lại 'Chưa xem' <-> 'Đã xem' ngay tức thì.
            - Tự động đồng bộ vào Persistent Zustand Store (AsyncStorage) để không mất khi restart.
          */}
          <AppButton
            title={isWatched ? 'Đánh dấu: Chưa xem' : '✓ Đánh dấu: Đã xem'}
            accessibilityLabel={
              isWatched
                ? `Đánh dấu phim ${title.name} là chưa xem`
                : `Đánh dấu phim ${title.name} là đã xem`
            }
            onPress={() => toggleWatchStatus(title.id)}
            style={styles.toggleStatusButton}
          />
        </View>

        {/* 
          =============================================================================
          3. XỬ LÝ GIAO DIỆN PHIM BỘ (SERIES) TUYỆT ĐỐI AN TOÀN - KHÔNG BỊ CRASH:
          - Kiểm tra điều kiện an toàn: (title.type === 'series').
          - Nếu có seasons: Kiểm tra chặt chẽ (title.seasons && title.seasons.length > 0)
            trước khi gọi hàm .map().
          - Nếu seasons là undefined/null hoặc mảng rỗng []:
            Lập tức chuyển sang nhánh hiển thị "Chưa có thông tin tập phim",
            ngăn chặn hoàn toàn lỗi Runtime Exception: Cannot read properties of undefined.
          =============================================================================
        */}
        {title.type === 'series' && (
          <View style={styles.seriesContainer}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Danh sách Mùa & Tập phim
            </Text>

            {title.seasons && title.seasons.length > 0 ? (
              title.seasons.map((season) => (
                <View
                  key={season.seasonNumber}
                  style={[
                    styles.seasonCard,
                    { backgroundColor: colors.card, borderColor: colors.border },
                  ]}
                >
                  <Text style={[styles.seasonHeader, { color: colors.primary }]}>
                    Mùa {season.seasonNumber} (
                    {season.episodes ? season.episodes.length : 0} tập)
                  </Text>

                  {/* Kiểm tra an toàn danh sách tập phim trong mùa */}
                  {season.episodes && season.episodes.length > 0 ? (
                    season.episodes.map((episode) => (
                      <View
                        key={episode.id}
                        style={[
                          styles.episodeItem,
                          { borderBottomColor: colors.border },
                        ]}
                      >
                        <Text
                          style={[
                            styles.episodeNumber,
                            { color: colors.textSecondary },
                          ]}
                        >
                          Tập {episode.episodeNumber}:
                        </Text>
                        <Text
                          style={[styles.episodeTitle, { color: colors.text }]}
                        >
                          {episode.name}
                        </Text>
                      </View>
                    ))
                  ) : (
                    <Text
                      style={[
                        styles.emptyNoticeText,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Chưa có thông tin tập phim cho mùa này.
                    </Text>
                  )}
                </View>
              ))
            ) : (
              /* Xử lý khi seasons rỗng hoặc undefined */
              <View
                style={[
                  styles.seasonCard,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <Text
                  style={[
                    styles.emptyNoticeText,
                    { color: colors.textSecondary },
                  ]}
                >
                  Chưa có thông tin tập phim
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  centerBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  statusSubtext: {
    fontSize: 15,
    marginTop: 10,
    textAlign: 'center',
  },
  errorHeading: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  emptyHeading: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  stateActionButton: {
    marginTop: 18,
    minWidth: 170,
  },
  // Nút điều hướng quay lại
  backNavButton: {
    alignSelf: 'flex-start',
    minHeight: 44, // Chuẩn Touch Target tối thiểu 44pt
    minWidth: 44,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  backNavText: {
    fontSize: 15,
    fontWeight: '600',
  },
  // Ảnh bìa
  poster: {
    width: '100%',
    height: 320,
    borderRadius: 14,
    marginBottom: 16,
  },
  // Khối thông tin
  infoCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 18,
  },
  titleName: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  // Chip thể loại
  genreList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  genreChip: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  genreChipText: {
    fontSize: 13,
  },
  toggleStatusButton: {
    width: '100%',
  },
  // Khu vực Series
  seriesContainer: {
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  seasonCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 14,
  },
  seasonHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  episodeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  episodeNumber: {
    fontSize: 14,
    fontWeight: '600',
    width: 65,
  },
  episodeTitle: {
    fontSize: 14,
    flex: 1,
  },
  emptyNoticeText: {
    fontSize: 14,
    fontStyle: 'italic',
    paddingVertical: 8,
    textAlign: 'center',
  },
});

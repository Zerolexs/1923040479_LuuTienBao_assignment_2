import React, { useState } from 'react';
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
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useWatchlistStore } from '../../store/useWatchlistStore';
import { getDetailTitle } from '../../services/tmdbApi';
import { Title } from '../../types/watchlist';
import { AppButton } from '../../components/AppButton';

/**
 * Màn hình Chi tiết phim (TitleDetailScreen)
 * Đường dẫn: app/title/[id].tsx
 * - Lấy id và type từ URL query params: useLocalSearchParams<{ id: string; type: string }>()
 * - Dùng TanStack Query (useQuery) gọi getDetailTitle từ TMDB API
 * - Đồng bộ trạng thái đã xem (1-tap) với Zustand Store
 * - Render giao diện an toàn 4 trạng thái: Loading, Error, Empty, Content
 * - Render Season/Episode dạng Accordion cho Phim bộ mà KHÔNG BỊ CRASH
 */
export default function TitleDetailScreen() {
  // =========================================================================
  // 1. LẤY ID VÀ TYPE TỪ EXPO ROUTER PARAMS
  // =========================================================================
  const { id, type } = useLocalSearchParams<{ id: string; type: string }>();

  // Bảng màu giao diện chuẩn Light / Dark mode (không dùng mã màu hex trực tiếp)
  const colors = useThemeColors();

  // Lấy hàm kiểm tra trạng thái xem và cập nhật từ Zustand Store
  const { isWatched, toggleWatchStatus } = useWatchlistStore();

  // Trạng thái mở/đóng Accordion của từng Mùa (mặc định Mùa 1 mở sẵn)
  const [expandedSeasons, setExpandedSeasons] = useState<Record<number, boolean>>({ 1: true });

  // Hàm chuyển đổi thu gọn / mở rộng Accordion của một Mùa
  const toggleSeasonAccordion = (seasonNumber: number) => {
    setExpandedSeasons((prev) => ({
      ...prev,
      [seasonNumber]: prev[seasonNumber] !== undefined ? !prev[seasonNumber] : false,
    }));
  };

  // =========================================================================
  // 2. GỌI TMDB API CHI TIẾT QUA TANSTACK QUERY (REACT QUERY)
  // =========================================================================
  const {
    data: title,
    isLoading,
    isError,
    refetch,
  } = useQuery<Title | null>({
    queryKey: ['title-detail', id, type],
    queryFn: () => getDetailTitle(id as string, type as 'movie' | 'series' | undefined),
    enabled: Boolean(id), // Chỉ gọi khi đã có id hợp lệ
  });

  // Trạng thái đã xem thực tế của người dùng từ Zustand Store
  const watched: boolean = Boolean(id && isWatched(id));

  /**
   * Hàm quay lại màn hình trước an toàn
   * Nếu có lịch sử điều hướng thì gọi router.back(), nếu không thì quay về trang chủ '/'
   */
  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  // =========================================================================
  // 3. XỬ LÝ 4 TRẠNG THÁI GIAO DIỆN (UI STATES)
  // =========================================================================

  // TRẠNG THÁI 1: LOADING (Đang tải dữ liệu từ máy chủ API)
  if (isLoading) {
    return (
      <SafeAreaView
        style={[styles.container, styles.centerBox, { backgroundColor: colors.background }]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.statusSubtext, { color: colors.textSecondary }]}>
          Đang tải thông tin phim từ máy chủ...
        </Text>
      </SafeAreaView>
    );
  }

  // TRẠNG THÁI 2: ERROR (Lỗi kết nối máy chủ API kèm nút Thử lại)
  if (isError) {
    return (
      <SafeAreaView
        style={[styles.container, styles.centerBox, { backgroundColor: colors.background }]}
      >
        <Text style={[styles.errorHeading, { color: colors.error }]}>
          Không thể tải dữ liệu
        </Text>
        <Text style={[styles.statusSubtext, { color: colors.textSecondary }]}>
          Đã có lỗi xảy ra trong quá trình kết nối máy chủ. Vui lòng thử lại.
        </Text>
        <AppButton
          title="Thử lại"
          accessibilityLabel="Thử lại tải thông tin phim"
          onPress={() => refetch()}
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
          onPress={handleBack}
          style={styles.stateActionButton}
        />
      </SafeAreaView>
    );
  }

  // TRẠNG THÁI 4: CONTENT (Hiển thị đầy đủ nội dung chi tiết của bộ phim)
  const isSeriesType = title.type === 'series' || type === 'series';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Nút quay lại: Chuẩn Touch Target tối thiểu 44x44 pt và Accessibility */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Quay lại màn hình trước"
          onPress={handleBack}
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
                {isSeriesType ? '📺 Phim bộ (Series)' : '🎬 Phim lẻ (Movie)'}
              </Text>
            </View>

            <View
              style={[
                styles.badge,
                { backgroundColor: watched ? colors.success : colors.error },
              ]}
            >
              <Text style={[styles.badgeText, { color: colors.buttonText }]}>
                {watched ? '✓ Đã xem' : '⏳ Cần xem'}
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
            - Tự động đồng bộ vào Zustand Store (được lưu bền vững trong AsyncStorage).
          */}
          <AppButton
            title={watched ? 'Đánh dấu: Chưa xem' : '✓ Đánh dấu: Đã xem'}
            accessibilityLabel={
              watched
                ? `Đánh dấu phim ${title.name} là chưa xem`
                : `Đánh dấu phim ${title.name} là đã xem`
            }
            onPress={() => toggleWatchStatus(title.id)}
            style={styles.toggleStatusButton}
          />
        </View>

        {/* 
          =============================================================================
          4. XỬ LÝ GIAO DIỆN PHIM BỘ (SERIES) ACCORDION - TUYỆT ĐỐI AN TOÀN KHÔNG CRASH:
          - Kiểm tra điều kiện: (isSeriesType).
          - Kiểm tra an toàn: Boolean(title.seasons && title.seasons.length > 0).
          - Hỗ trợ Accordion: Bấm vào tiêu đề Mùa để mở rộng / thu gọn danh sách tập phim.
          - Nếu seasons bị null, undefined hoặc mảng rỗng:
            Hiển thị thông báo thân thiện: "Chưa có thông tin tập phim",
            không bao giờ để ứng dụng bị crash hay văng màn hình.
          =============================================================================
        */}
        {isSeriesType && (
          <View style={styles.seriesContainer}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Danh sách Mùa & Tập phim
            </Text>

            {Boolean(title.seasons && title.seasons.length > 0) ? (
              title.seasons!.map((season) => {
                const isExpanded =
                  expandedSeasons[season.seasonNumber] ?? (season.seasonNumber === 1);
                const episodeCount = season.episodes ? season.episodes.length : 0;

                return (
                  <View
                    key={season.seasonNumber}
                    style={[
                      styles.seasonCard,
                      { backgroundColor: colors.card, borderColor: colors.border },
                    ]}
                  >
                    {/* Header Mùa dạng Accordion có thể bấm để đóng/mở */}
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Mùa ${season.seasonNumber}, có ${episodeCount} tập. Nhấn để ${isExpanded ? 'thu gọn' : 'mở rộng'}`}
                      onPress={() => toggleSeasonAccordion(season.seasonNumber)}
                      style={({ pressed }) => [
                        styles.seasonHeaderRow,
                        { opacity: pressed ? 0.7 : 1 },
                      ]}
                    >
                      <Text style={[styles.seasonHeader, { color: colors.primary }]}>
                        Mùa {season.seasonNumber} ({episodeCount} tập)
                      </Text>
                      <Text style={[styles.accordionIcon, { color: colors.textSecondary }]}>
                        {isExpanded ? '▲ Thu gọn' : '▼ Mở rộng'}
                      </Text>
                    </Pressable>

                    {/* Danh sách tập phim hiển thị khi Accordion mở */}
                    {isExpanded && (
                      <View style={styles.episodeListContainer}>
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
                    )}
                  </View>
                );
              })
            ) : (
              /* Trường hợp Series chưa có dữ liệu seasons hoặc rỗng */
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
  // Nút điều hướng quay lại (chuẩn Touch Target 44x44 pt)
  backNavButton: {
    alignSelf: 'flex-start',
    minHeight: 44,
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
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 14,
    overflow: 'hidden',
  },
  // Tiêu đề Mùa dạng Accordion
  seasonHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 44, // Chuẩn Touch Target tối thiểu 44pt
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  seasonHeader: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  accordionIcon: {
    fontSize: 13,
    fontWeight: '600',
  },
  episodeListContainer: {
    paddingHorizontal: 14,
    paddingBottom: 10,
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
    paddingVertical: 12,
    textAlign: 'center',
  },
});

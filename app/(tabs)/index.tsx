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
  Modal,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useWatchlistStore } from '../../store/useWatchlistStore';
import { useThemeStore } from '../../store/useThemeStore';
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

  // Quản lý chế độ giao diện Sáng / Tối từ Zustand Theme Store
  const { themeMode, toggleTheme } = useThemeStore();

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
  // 3. TÍNH TOÁN TIẾN ĐỘ THỜI GIAN THỰC & QUẢN LÝ PHIM ĐÃ XEM
  // =========================================================================
  // State kiểm tra hiển thị Modal danh sách phim đã xem khi bấm vào Card Tiến độ
  const [isWatchedModalOpen, setIsWatchedModalOpen] = useState<boolean>(false);

  // Danh sách các bộ phim người dùng đã xem (status === 'watched')
  const watchedTitles: Title[] = useMemo(() => {
    return titles.filter((t) => t.status === 'watched');
  }, [titles]);

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
        {/* Hàng tiêu đề ứng dụng & Nút chuyển đổi Theme Sáng/Tối ở góc trên cùng bên phải */}
        <View style={styles.topBarRow}>
          <Text style={[styles.appHeaderTitle, { color: colors.text }]}>
            🎬 Movie Watchlist
          </Text>

          {/* 
            Nút bấm chuyển đổi giao diện Sáng / Tối (Light / Dark Mode Toggle):
            - Dark Mode: Hiển thị icon Mặt Trời ☀️ (để bấm chuyển sang Light Mode)
            - Light Mode: Hiển thị icon Mặt Trăng 🌙 (để bấm chuyển sang Dark Mode)
            - Chuẩn Accessibility: minHeight 44, minWidth 44, accessibilityRole="button"
          */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Chuyển đổi giao diện sáng tối"
            accessibilityHint="Nhấn để chuyển đổi qua lại giữa giao diện Sáng và Tối"
            onPress={toggleTheme}
            style={({ pressed }) => [
              styles.themeToggleBtn,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <Text style={styles.themeToggleIcon}>
              {themeMode === 'dark' ? '☀️' : '🌙'}
            </Text>
          </Pressable>
        </View>

        {/* Khối hiển thị tiến độ xem phim - Bấm để mở Modal danh sách phim đã xem */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setIsWatchedModalOpen(true)}
          accessibilityRole="button"
          accessibilityLabel={`Tiến độ xem phim: đã xem ${watchedCount} trên ${totalTitles} bộ phim, đạt ${watchedPercentage}%. Nhấn để xem danh sách phim đã xem.`}
          style={[
            styles.progressCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={styles.progressTextRow}>
            <View style={styles.progressTitleWithHint}>
              <Text style={[styles.progressTitle, { color: colors.text }]}>
                Tiến độ xem phim
              </Text>
              <Text style={[styles.progressHintBadge, { color: colors.primary }]}>
                (Xem danh sách 👁)
              </Text>
            </View>
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
            Đã xem {watchedCount} trên tổng số {totalTitles} bộ phim • Nhấn để xem chi tiết
          </Text>
        </TouchableOpacity>

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

      {/* 
        =============================================================================
        MODAL HIỂN THỊ DANH SÁCH PHIM ĐÃ XEM (DÙNG MODAL CÓ SẴN CỦA REACT NATIVE):
        - animationType="slide", transparent={true}
        - Đóng khi bấm ra ngoài vùng nền mờ (backdrop) hoặc bấm nút Đóng (✕)
        - Render danh sách bằng FlatList: Poster, Tên phim, Thể loại, Nút Bỏ đánh dấu
        - Bấm vào item chuyển hướng sang trang chi tiết phim và đóng modal
        - Chuẩn Touch Target >= 44x44 pt và không lồng button
        =============================================================================
      */}
      <Modal
        visible={isWatchedModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsWatchedModalOpen(false)}
      >
        {/* Khung chứa Modal: dùng View bao ngoài để tránh tạo thẻ <button> bọc toàn bộ trên Web */}
        <View style={styles.modalRootContainer}>
          {/* Lớp nền mờ backdrop: đặt độc lập phía sau để đóng modal khi chạm bên ngoài */}
          <Pressable
            style={[StyleSheet.absoluteFill, { backgroundColor: colors.overlay }]}
            onPress={() => setIsWatchedModalOpen(false)}
            accessibilityRole="none"
            accessibilityLabel="Đóng danh sách phim đã xem"
          />

          {/* Hộp nội dung Modal dạng Bottom Sheet: dùng View làm container */}
          <View
            style={[
              styles.modalContent,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            {/* Header Modal */}
            <View
              style={[
                styles.modalHeader,
                { borderBottomColor: colors.border },
              ]}
            >
              <View style={styles.modalHeaderTitleBox}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  Danh sách Phim Đã Xem ({watchedTitles.length})
                </Text>
                <Text
                  style={[styles.modalSubtitle, { color: colors.textSecondary }]}
                >
                  Bấm vào phim để xem chi tiết hoặc bấm Bỏ đánh dấu
                </Text>
              </View>

              {/* Nút Đóng Modal (Chuẩn Touch Target >= 44x44 pt) */}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Đóng danh sách phim đã xem"
                onPress={() => setIsWatchedModalOpen(false)}
                style={({ pressed }) => [
                  styles.modalCloseButton,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                <Text style={[styles.modalCloseButtonText, { color: colors.text }]}>
                  ✕
                </Text>
              </Pressable>
            </View>

            {/* Danh sách phim đã xem hoặc thông báo trống */}
            {watchedTitles.length === 0 ? (
              <View style={styles.modalEmptyContainer}>
                <Text
                  style={[styles.modalEmptyText, { color: colors.textSecondary }]}
                >
                  Chưa có bộ phim nào được đánh dấu là đã xem.
                </Text>
              </View>
            ) : (
              <FlatList
                data={watchedTitles}
                keyExtractor={(item) => `modal-watched-${item.id}`}
                renderItem={({ item }) => (
                  <View
                    style={[
                      styles.modalItemCard,
                      {
                        backgroundColor: colors.background,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    {/* Vùng bấm xem chi tiết phim trong Modal */}
                    <Pressable
                      accessibilityRole="link"
                      accessibilityLabel={`Xem chi tiết phim ${item.name}`}
                      onPress={() => {
                        setIsWatchedModalOpen(false);
                        router.push(`/title/${item.id}?type=${item.type}`);
                      }}
                      style={({ pressed }) => [
                        styles.modalItemAction,
                        { opacity: pressed ? 0.75 : 1 },
                      ]}
                    >
                      <Image
                        source={{ uri: item.posterUrl }}
                        style={styles.modalPoster}
                        resizeMode="cover"
                      />
                      <View style={styles.modalItemInfo}>
                        <Text
                          style={[styles.modalItemName, { color: colors.text }]}
                          numberOfLines={1}
                        >
                          {item.name}
                        </Text>
                        <Text
                          style={[
                            styles.modalItemMeta,
                            { color: colors.textSecondary },
                          ]}
                          numberOfLines={1}
                        >
                          {item.type === 'movie' ? '🎬 Phim lẻ' : '📺 Phim bộ'} •{' '}
                          {item.genre.join(', ')}
                        </Text>
                      </View>
                    </Pressable>

                    {/* Nút Bỏ đánh dấu / Chuyển về Cần xem (độc lập, không lồng button) */}
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Bỏ đánh dấu phim ${item.name} chuyển về cần xem`}
                      onPress={() => toggleWatchStatus(item.id)}
                      style={({ pressed }) => [
                        styles.modalUnwatchButton,
                        {
                          borderColor: colors.border,
                          backgroundColor: colors.card,
                          opacity: pressed ? 0.7 : 1,
                        },
                      ]}
                    >
                      <Text
                        style={[styles.modalUnwatchText, { color: colors.error }]}
                      >
                        ↩ Cần xem
                      </Text>
                    </Pressable>
                  </View>
                )}
                contentContainerStyle={styles.modalListContent}
              />
            )}
          </View>
        </View>
      </Modal>
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
  // Hàng thanh công cụ chứa tiêu đề và nút chuyển Theme Sáng/Tối
  topBarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  appHeaderTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  themeToggleBtn: {
    minHeight: 44, // Chuẩn Touch Target tối thiểu 44pt
    minWidth: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeToggleIcon: {
    fontSize: 20,
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
  progressTitleWithHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  progressHintBadge: {
    fontSize: 12,
    fontWeight: '600',
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
  // Modal danh sách phim đã xem
  modalRootContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    maxHeight: '80%',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 28,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  modalHeaderTitleBox: {
    flex: 1,
    marginRight: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  modalCloseButton: {
    minWidth: 44, // Chuẩn Touch Target tối thiểu 44pt
    minHeight: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalEmptyContainer: {
    paddingVertical: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalEmptyText: {
    fontSize: 15,
    textAlign: 'center',
  },
  modalListContent: {
    paddingBottom: 20,
  },
  modalItemCard: {
    flexDirection: 'row',
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalItemAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
    minHeight: 44, // Chuẩn Touch Target tối thiểu 44pt
  },
  modalPoster: {
    width: 48,
    height: 68,
    borderRadius: 6,
  },
  modalItemInfo: {
    flex: 1,
    marginLeft: 10,
    justifyContent: 'center',
  },
  modalItemName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  modalItemMeta: {
    fontSize: 12,
  },
  modalUnwatchButton: {
    minHeight: 44, // Chuẩn Touch Target tối thiểu 44pt
    minWidth: 44,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalUnwatchText: {
    fontSize: 13,
    fontWeight: '600',
  },
});

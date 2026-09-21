import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  SafeAreaView,
  Pressable,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useWatchlist } from '../../hooks/useWatchlist';
import { AppButton } from '../../components/AppButton';

/**
 * Màn hình chi tiết phim: app/title/[id].tsx
 */
export default function TitleDetailScreen() {
  // 1. Lấy id phim từ tham số đường dẫn (Expo Router params)
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  // Lấy bộ màu giao diện theo chế độ Sáng/Tối
  const colors = useThemeColors();

  // Lấy danh sách phim và hàm cập nhật trạng thái
  const { titles, toggleWatchStatus } = useWatchlist();

  // Tìm phim tương ứng theo id
  const title = titles.find((item) => item.id === id);

  // Xử lý an toàn: Nếu không tìm thấy phim (hoặc id không hợp lệ), không để app bị crash
  if (!title) {
    return (
      <SafeAreaView
        style={[styles.container, styles.centerBox, { backgroundColor: colors.background }]}
      >
        <Text style={[styles.notFoundText, { color: colors.textSecondary }]}>
          Không tìm thấy thông tin bộ phim này.
        </Text>
        <AppButton
          title="Quay lại danh sách"
          accessibilityLabel="Quay lại danh sách phim"
          onPress={() => router.back()}
          style={styles.backButton}
        />
      </SafeAreaView>
    );
  }

  // Xác định trạng thái đã xem hay chưa
  const isWatched = title.status === 'watched';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Nút quay lại đạt chuẩn Touch Target 44x44 pt và Accessibility */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Quay lại danh sách phim"
          onPress={() => router.back()}
          style={[styles.backNavButton, { borderColor: colors.border, backgroundColor: colors.card }]}
        >
          <Text style={[styles.backNavText, { color: colors.text }]}>← Quay lại</Text>
        </Pressable>

        {/* 2. Hiển thị thông tin chung: Poster, Tên phim, Thể loại, Trạng thái */}
        <Image
          source={{ uri: title.posterUrl }}
          style={styles.poster}
          resizeMode="cover"
        />

        <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.titleName, { color: colors.text }]}>
            {title.name}
          </Text>

          {/* Huy hiệu loại phim và trạng thái */}
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

          {/* Thể loại phim */}
          <Text style={[styles.genreText, { color: colors.textSecondary }]}>
            Thể loại: {title.genre.join(', ')}
          </Text>

          {/* 
            =====================================================================
            3. KIỂM TRA LOẠI PHIM - TRƯỜNG HỢP MOVIE:
            - Dùng toán tử điều kiện đơn giản (title.type === 'movie').
            - Nếu là phim lẻ: Hiển thị nút đổi trạng thái xem ('to_watch' <-> 'watched').
            =====================================================================
          */}
          {title.type === 'movie' && (
            <AppButton
              title={isWatched ? 'Đánh dấu: Chưa xem' : 'Đánh dấu: Đã xem'}
              accessibilityLabel={isWatched ? 'Đánh dấu phim là chưa xem' : 'Đánh dấu phim là đã xem'}
              onPress={() => toggleWatchStatus(title.id)}
              style={styles.actionButton}
            />
          )}
        </View>

        {/* 
          =====================================================================
          3 & 4. KIỂM TRA LOẠI PHIM - TRƯỜNG HỢP SERIES:
          LÝ DO CODE AN TOÀN TUYỆT ĐỐI, KHÔNG BỊ CRASH:
          1. Dùng toán tử (title.type === 'series') để chỉ render khu vực này khi đúng là phim bộ.
          2. Kiểm tra điều kiện (title.seasons && title.seasons.length > 0):
             - Nếu seasons là undefined, null hoặc mảng rỗng [] -> điều kiện trả về false,
               nhánh fallback sẽ hiển thị thông báo "Chưa có thông tin tập phim".
             - Nhờ đó, Javascript KHÔNG BAO GIỜ gọi hàm .map() trên undefined/null,
               ngăn chặn hoàn toàn lỗi Runtime Exception: "TypeError: Cannot read properties of undefined (reading 'map')".
          3. Kiểm tra tương tự với từng mùa: (season.episodes && season.episodes.length > 0)
             đảm bảo dù một mùa nào đó chưa có tập phim thì app vẫn chạy mượt mà.
          =====================================================================
        */}
        {title.type === 'series' && (
          <View style={styles.seriesSection}>
            <Text style={[styles.sectionHeading, { color: colors.text }]}>
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
                          styles.episodeRow,
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
                          style={[styles.episodeName, { color: colors.text }]}
                        >
                          {episode.name}
                        </Text>
                      </View>
                    ))
                  ) : (
                    <Text
                      style={[
                        styles.emptyNotice,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Chưa có thông tin tập phim cho mùa này.
                    </Text>
                  )}
                </View>
              ))
            ) : (
              /* 4. Xử lý trường hợp seasons bị undefined hoặc rỗng */
              <View
                style={[
                  styles.seasonCard,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <Text
                  style={[
                    styles.emptyNotice,
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
    padding: 20,
  },
  notFoundText: {
    fontSize: 16,
    marginBottom: 16,
  },
  backButton: {
    minWidth: 160,
  },
  // Nút quay lại góc trên đạt chuẩn touch target 44x44 pt
  backNavButton: {
    alignSelf: 'flex-start',
    minHeight: 44,
    minWidth: 44,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  backNavText: {
    fontSize: 15,
    fontWeight: '600',
  },
  // Poster phim
  poster: {
    width: '100%',
    height: 320,
    borderRadius: 14,
    marginBottom: 16,
  },
  // Khối thông tin chi tiết
  infoCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
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
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  genreText: {
    fontSize: 15,
    marginBottom: 16,
  },
  actionButton: {
    width: '100%',
  },
  // Phần danh sách mùa và tập của Series
  seriesSection: {
    marginTop: 8,
  },
  sectionHeading: {
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
  episodeRow: {
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
  episodeName: {
    fontSize: 14,
    flex: 1,
  },
  emptyNotice: {
    fontSize: 14,
    fontStyle: 'italic',
    paddingVertical: 6,
    textAlign: 'center',
  },
});

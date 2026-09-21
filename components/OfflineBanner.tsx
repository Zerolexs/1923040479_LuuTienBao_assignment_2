import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNetInfo } from '@react-native-community/netinfo';
import { useThemeColors } from '../hooks/useThemeColors';

interface OfflineBannerProps {
  // Cho phép ép hiển thị Offline để kiểm tra giao diện (mặc định theo dõi qua NetInfo)
  forceOffline?: boolean;
}

/**
 * Component OfflineBanner:
 * Tự động theo dõi trạng thái mạng qua @react-native-community/netinfo.
 * Khi mất kết nối (Offline), hiển thị một thanh màu vàng/cam ở đầu màn hình.
 * Khi có mạng trở lại (Online), thanh này tự động ẩn đi.
 */
export function OfflineBanner({ forceOffline }: OfflineBannerProps) {
  // Lấy bộ màu giao diện (không dùng mã Hex trực tiếp)
  const colors = useThemeColors();

  // Theo dõi trạng thái mạng thời gian thực
  const netInfo = useNetInfo();

  // Xác định máy có đang mất mạng hay không:
  // - isConnected === false: Thiết bị không bật Wifi/Dữ liệu di động
  // - isInternetReachable === false: Đã kết nối Wifi nhưng không có Internet
  const isOffline =
    forceOffline ??
    (netInfo.isConnected === false || netInfo.isInternetReachable === false);

  // Nếu có mạng bình thường thì không render gì cả (tự động ẩn)
  if (!isOffline) {
    return null;
  }

  // Khi mất mạng: Hiển thị thanh cảnh báo màu vàng/cam
  return (
    <View
      accessibilityRole="alert"
      style={[styles.banner, { backgroundColor: colors.warning }]}
    >
      <Text style={[styles.bannerText, { color: colors.warningText }]}>
        ⚠️ Bạn đang ở chế độ Offline. Đang hiển thị dữ liệu đã lưu.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    width: '100%',
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
});

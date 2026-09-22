import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';

// Khởi tạo QueryClient cho toàn bộ ứng dụng Expo Router
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5,
    },
  },
});

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)/index" options={{ headerShown: false }} />
        <Stack.Screen name="title/[id]" options={{ headerShown: false }} />
      </Stack>
    </QueryClientProvider>
  );
}

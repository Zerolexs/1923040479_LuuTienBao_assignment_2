import { useWatchlistStore } from '../store/useWatchlistStore';

/**
 * Custom hook tương thích ngược (Backward compatible)
 * Chuyển hướng trực tiếp về useWatchlistStore để giữ tính nhất quán (Single Source of Truth).
 */
export const useWatchlist = useWatchlistStore;
export { useWatchlistStore };

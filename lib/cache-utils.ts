// Cache utilities for optimizing API calls
"use client";

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresIn: number; // milliseconds
}

class CacheManager {
  private static instance: CacheManager;
  private cache: Map<string, CacheItem<any>> = new Map();

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  // Set cache with expiration
  set<T>(key: string, data: T, expiresInMs: number = 300000): void { // 5 minutes default
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      expiresIn: expiresInMs,
    };

    this.cache.set(key, item);

    // Also store in localStorage for persistence across page reloads
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`cache_${key}`, JSON.stringify(item));
      } catch (error) {
        console.warn('Failed to store in localStorage:', error);
      }
    }
  }

  // Get from cache
  get<T>(key: string): T | null {
    // First check memory cache
    let item = this.cache.get(key);

    // If not in memory, try localStorage
    if (!item && typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(`cache_${key}`);
        if (stored) {
          item = JSON.parse(stored);
          // Restore to memory cache
          if (item) {
            this.cache.set(key, item);
          }
        }
      } catch (error) {
        console.warn('Failed to read from localStorage:', error);
      }
    }

    if (!item) return null;

    // Check if expired
    const now = Date.now();
    if (now - item.timestamp > item.expiresIn) {
      this.delete(key);
      return null;
    }

    return item.data;
  }

  // Delete from cache
  delete(key: string): void {
    this.cache.delete(key);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(`cache_${key}`);
    }
  }

  // Clear all cache
  clear(): void {
    this.cache.clear();
    if (typeof window !== 'undefined') {
      const keys = Object.keys(localStorage).filter(key => key.startsWith('cache_'));
      keys.forEach(key => localStorage.removeItem(key));
    }
  }

  // Check if item exists and is valid
  has(key: string): boolean {
    return this.get(key) !== null;
  }
}

// Cached fetch function
export async function cachedFetch<T>(
  url: string,
  cacheKey: string,
  expiresInMs: number = 300000, // 5 minutes default
  options?: RequestInit
): Promise<T> {
  const cache = CacheManager.getInstance();

  // Try to get from cache first
  const cached = cache.get<T>(cacheKey);
  if (cached) {
    return cached;
  }

  // Fetch from API
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  
  // Store in cache
  cache.set(cacheKey, data, expiresInMs);
  
  return data;
}

// Specific cache functions for common data
export const departmentCache = {
  get: () => CacheManager.getInstance().get<any>('departments'),
  set: (data: any) => CacheManager.getInstance().set('departments', data, 300000), // 5 minutes
  clear: () => CacheManager.getInstance().delete('departments'),
};

export const userStatsCache = {
  get: (userId: number) => CacheManager.getInstance().get<any>(`user_stats_${userId}`),
  set: (userId: number, data: any) => CacheManager.getInstance().set(`user_stats_${userId}`, data, 60000), // 1 minute
  clear: (userId: number) => CacheManager.getInstance().delete(`user_stats_${userId}`),
};

export default CacheManager;

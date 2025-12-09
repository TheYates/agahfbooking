// 🚀 Redis Caching for Sub-10ms Performance
// Multi-layer cache with fallback strategies

import Redis from "ioredis";

// Redis client configuration
const redis = new Redis({
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  password: process.env.REDIS_PASSWORD,
  db: 0,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  // Optimizations for speed
  enableReadyCheck: false,
  commandTimeout: 5000,
  connectTimeout: 10000,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

// Memory cache for ultra-fast access (< 1ms)
const memoryCache = new Map<string, { data: any; expires: number }>();

// Cache strategies by data type (in seconds)
export const CACHE_STRATEGIES = {
  departments: 3600, // 1 hour - rarely change
  userStats: 30, // 30 seconds - real-time feel
  appointments: 10, // 10 seconds - near real-time
  calendar: 5, // 5 seconds - ultra fresh
  availableSlots: 15, // 15 seconds - booking critical
  recentActivity: 60, // 1 minute - activity feed
  monthlyStats: 300, // 5 minutes - historical data
  dashboardStats: 30, // 30 seconds - main dashboard
} as const;

export type CacheStrategy = keyof typeof CACHE_STRATEGIES;

// Advanced multi-layer cache class
export class AdvancedCache {
  // Multi-layer cache with fallback (Memory → Redis → Database)
  static async get<T>(
    key: string,
    fallback: () => Promise<T>,
    strategy: CacheStrategy = "userStats"
  ): Promise<T> {
    const ttl = CACHE_STRATEGIES[strategy];
    const startTime = Date.now();

    try {
      // Layer 1: Memory cache (< 1ms) - Fastest
      const memoryResult = this.getFromMemory<T>(key);
      if (memoryResult) {
        console.log(`🔥 Memory hit: ${key} (${Date.now() - startTime}ms)`);
        return memoryResult;
      }

      // Layer 2: Redis cache (2-5ms) - Very fast
      const redisResult = await this.getFromRedis<T>(key);
      if (redisResult) {
        // Store in memory for next time
        this.setInMemory(key, redisResult, Math.min(ttl, 60));
        console.log(`⚡ Redis hit: ${key} (${Date.now() - startTime}ms)`);
        return redisResult;
      }

      // Layer 3: Database fallback (5-100ms) - Last resort
      console.log(`🔍 Cache miss: ${key}, fetching from DB...`);
      const result = await fallback();
      const dbTime = Date.now() - startTime;

      // Store in both caches (fire and forget)
      Promise.all([
        this.setInRedis(key, result, ttl),
        this.setInMemory(key, result, Math.min(ttl, 60)),
      ]).catch((err) => console.warn("Cache storage error:", err));

      return result;
    } catch (error) {
      console.error(`❌ Cache error for ${key}:`, error);
      // Always fallback to database on cache errors
      return await fallback();
    }
  }

  // Get from memory cache
  private static getFromMemory<T>(key: string): T | null {
    const cached = memoryCache.get(key);
    if (cached && cached.expires > Date.now()) {
      return cached.data;
    }
    if (cached) {
      memoryCache.delete(key); // Cleanup expired
    }
    return null;
  }

  // Set in memory cache
  private static setInMemory<T>(
    key: string,
    data: T,
    ttlSeconds: number
  ): void {
    const expires = Date.now() + ttlSeconds * 1000;
    memoryCache.set(key, { data, expires });

    // Cleanup old entries periodically
    if (memoryCache.size > 100) {
      this.cleanupMemoryCache();
    }
  }

  // Get from Redis cache
  private static async getFromRedis<T>(key: string): Promise<T | null> {
    try {
      const result = await redis.get(key);
      return result ? JSON.parse(result) : null;
    } catch (error) {
      console.warn("Redis get error:", error);
      return null;
    }
  }

  // Set in Redis cache
  private static async setInRedis<T>(
    key: string,
    data: T,
    ttlSeconds: number
  ): Promise<void> {
    try {
      await redis.setex(key, ttlSeconds, JSON.stringify(data));
    } catch (error) {
      console.warn("Redis set error:", error);
    }
  }

  // Invalidate cache for a specific pattern
  static async invalidate(pattern: string): Promise<void> {
    try {
      // Clear from memory
      for (const [key] of memoryCache) {
        if (key.includes(pattern)) {
          memoryCache.delete(key);
        }
      }

      // Clear from Redis
      const keys = await redis.keys(`*${pattern}*`);
      if (keys.length > 0) {
        await redis.del(...keys);
      }

      console.log(
        `🧹 Invalidated cache pattern: ${pattern} (${keys.length} keys)`
      );
    } catch (error) {
      console.warn("Cache invalidation error:", error);
    }
  }

  // Cache warming for critical data
  static async warmCache(): Promise<void> {
    console.log("🔥 Warming cache with critical data...");

    const warmTasks = [this.warmDepartments(), this.warmSystemSettings()];

    const results = await Promise.allSettled(warmTasks);
    const successful = results.filter((r) => r.status === "fulfilled").length;
    console.log(
      `🎯 Cache warmed: ${successful}/${warmTasks.length} tasks completed`
    );
  }

  private static async warmDepartments(): Promise<void> {
    try {
      // This would use your actual query function
      const { query } = await import("./db");
      await this.get(
        "departments",
        async () => {
          const result = await query(
            "SELECT * FROM departments WHERE is_active = true ORDER BY name"
          );
          return result.rows;
        },
        "departments"
      );
    } catch (error) {
      console.warn("Department cache warming failed:", error);
    }
  }

  private static async warmSystemSettings(): Promise<void> {
    try {
      const { query } = await import("./db");
      await this.get(
        "system_settings",
        async () => {
          const result = await query(
            "SELECT setting_key, setting_value FROM system_settings"
          );
          return result.rows.reduce((acc: any, row: any) => {
            acc[row.setting_key] = row.setting_value;
            return acc;
          }, {});
        },
        "departments"
      );
    } catch (error) {
      console.warn("System settings cache warming failed:", error);
    }
  }

  // Cleanup expired memory cache entries
  private static cleanupMemoryCache(): void {
    const now = Date.now();
    for (const [key, value] of memoryCache) {
      if (value.expires <= now) {
        memoryCache.delete(key);
      }
    }
  }

  // Get cache statistics
  static async getStats(): Promise<{
    memory: { size: number; keys: string[] };
    redis: { memory: string; keys: number };
  }> {
    try {
      const redisInfo = await redis.info("memory");
      const redisDbSize = await redis.dbsize();

      return {
        memory: {
          size: memoryCache.size,
          keys: Array.from(memoryCache.keys()),
        },
        redis: {
          memory:
            redisInfo
              .split("\n")
              .find((line) => line.startsWith("used_memory_human:"))
              ?.split(":")[1] || "unknown",
          keys: redisDbSize,
        },
      };
    } catch (error) {
      return {
        memory: {
          size: memoryCache.size,
          keys: Array.from(memoryCache.keys()),
        },
        redis: { memory: "error", keys: 0 },
      };
    }
  }
}

// Connection event handlers
redis.on("connect", () => {
  console.log("🔗 Redis connected");
});

redis.on("ready", () => {
  console.log("⚡ Redis ready for caching");
  // Warm cache on startup
  AdvancedCache.warmCache().catch(console.warn);
});

redis.on("error", (err) => {
  console.warn("🔴 Redis error (falling back to database):", err.message);
});

redis.on("close", () => {
  console.log("📴 Redis connection closed");
});

// Graceful shutdown
process.on("SIGTERM", () => {
  redis.disconnect();
});

export { redis };

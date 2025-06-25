/**
 * Redis Configuration and Caching Utilities for SecureShare
 *
 * Provides Redis caching functionality using Upstash Redis
 * with proper error handling and type safety.
 */

import { Redis } from "@upstash/redis";
import type {
  UserSessionData,
  SecretMetadata,
  AccessLogMetadata,
} from "./types";

// Redis configuration
const REDIS_URL =
  process.env.UPSTASH_REDIS_REST_URL ||
  "https://prime-pangolin-40296.upstash.io";
const REDIS_TOKEN =
  process.env.UPSTASH_REDIS_REST_TOKEN ||
  "Ap1oAAIgcDHcLO9n4l22m2yFjdZe7n9UCcghGfVtJr-rFfFFocs_Pw";

// Initialize Redis client
export const redis = new Redis({
  url: REDIS_URL,
  token: REDIS_TOKEN,
});

// Cache key prefixes for organization
export const CACHE_PREFIXES = {
  USER: "user:",
  SECRET: "secret:",
  SESSION: "session:",
  RATE_LIMIT: "rate_limit:",
  EMAIL_VERIFICATION: "email_verify:",
  PASSWORD_RESET: "password_reset:",
  ACCESS_LOG: "access_log:",
} as const;

// Cache TTL values (in seconds)
export const CACHE_TTL = {
  USER_SESSION: 60 * 60 * 24 * 7, // 7 days
  USER_PROFILE: 60 * 60, // 1 hour
  SECRET_METADATA: 60 * 30, // 30 minutes
  SECRET_CONTENT: 60 * 10, // 10 minutes
  RATE_LIMIT: 60 * 60, // 1 hour
  EMAIL_VERIFICATION: 60 * 15, // 15 minutes
  PASSWORD_RESET: 60 * 30, // 30 minutes
  ACCESS_ANALYTICS: 60 * 60 * 24, // 24 hours
} as const;

// ============================================================================
// CACHE UTILITIES
// ============================================================================

/**
 * Generic cache get function with error handling
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const result = await redis.get(key);
    return result as T | null;
  } catch (error) {
    console.error(`Cache GET error for key ${key}:`, error);
    return null;
  }
}

/**
 * Generic cache set function with TTL and error handling
 */
export async function cacheSet<T>(
  key: string,
  value: T,
  ttl?: number
): Promise<boolean> {
  try {
    if (ttl) {
      await redis.setex(key, ttl, JSON.stringify(value));
    } else {
      await redis.set(key, JSON.stringify(value));
    }
    return true;
  } catch (error) {
    console.error(`Cache SET error for key ${key}:`, error);
    return false;
  }
}

/**
 * Delete cache entry
 */
export async function cacheDel(key: string): Promise<boolean> {
  try {
    await redis.del(key);
    return true;
  } catch (error) {
    console.error(`Cache DEL error for key ${key}:`, error);
    return false;
  }
}

/**
 * Check if cache key exists
 */
export async function cacheExists(key: string): Promise<boolean> {
  try {
    const result = await redis.exists(key);
    return result === 1;
  } catch (error) {
    console.error(`Cache EXISTS error for key ${key}:`, error);
    return false;
  }
}

/**
 * Increment counter with TTL
 */
export async function cacheIncr(key: string, ttl?: number): Promise<number> {
  try {
    const result = await redis.incr(key);
    if (ttl && result === 1) {
      await redis.expire(key, ttl);
    }
    return result;
  } catch (error) {
    console.error(`Cache INCR error for key ${key}:`, error);
    return 0;
  }
}

/**
 * Get multiple cache keys at once
 */
export async function cacheMultiGet<T>(keys: string[]): Promise<(T | null)[]> {
  try {
    const results = await redis.mget(...keys);
    return results.map((result) => result as T | null);
  } catch (error) {
    console.error(`Cache MGET error for keys ${keys.join(", ")}:`, error);
    return keys.map(() => null);
  }
}

// ============================================================================
// SPECIALIZED CACHE FUNCTIONS
// ============================================================================

/**
 * User session caching
 */
export const userCache = {
  async getSession(userId: string): Promise<UserSessionData | null> {
    return cacheGet<UserSessionData>(`${CACHE_PREFIXES.SESSION}${userId}`);
  },

  async setSession(
    userId: string,
    userData: UserSessionData
  ): Promise<boolean> {
    return cacheSet(
      `${CACHE_PREFIXES.SESSION}${userId}`,
      userData,
      CACHE_TTL.USER_SESSION
    );
  },

  async deleteSession(userId: string): Promise<boolean> {
    return cacheDel(`${CACHE_PREFIXES.SESSION}${userId}`);
  },

  async getProfile<T = Record<string, unknown>>(
    userId: string
  ): Promise<T | null> {
    return cacheGet<T>(`${CACHE_PREFIXES.USER}profile:${userId}`);
  },

  async setProfile<T = Record<string, unknown>>(
    userId: string,
    profile: T
  ): Promise<boolean> {
    return cacheSet(
      `${CACHE_PREFIXES.USER}profile:${userId}`,
      profile,
      CACHE_TTL.USER_PROFILE
    );
  },
};

/**
 * Secret caching
 */
export const secretCache = {
  async getMetadata(secretId: string): Promise<SecretMetadata | null> {
    return cacheGet<SecretMetadata>(`${CACHE_PREFIXES.SECRET}meta:${secretId}`);
  },

  async setMetadata(
    secretId: string,
    metadata: SecretMetadata
  ): Promise<boolean> {
    return cacheSet(
      `${CACHE_PREFIXES.SECRET}meta:${secretId}`,
      metadata,
      CACHE_TTL.SECRET_METADATA
    );
  },

  async getContent(secretId: string): Promise<string | null> {
    return cacheGet<string>(`${CACHE_PREFIXES.SECRET}content:${secretId}`);
  },

  async setContent(secretId: string, content: string): Promise<boolean> {
    return cacheSet(
      `${CACHE_PREFIXES.SECRET}content:${secretId}`,
      content,
      CACHE_TTL.SECRET_CONTENT
    );
  },

  async deleteSecret(secretId: string): Promise<void> {
    await Promise.all([
      cacheDel(`${CACHE_PREFIXES.SECRET}meta:${secretId}`),
      cacheDel(`${CACHE_PREFIXES.SECRET}content:${secretId}`),
    ]);
  },

  async incrementViews(secretId: string): Promise<number> {
    return cacheIncr(
      `${CACHE_PREFIXES.SECRET}views:${secretId}`,
      CACHE_TTL.SECRET_METADATA
    );
  },
};

/**
 * Rate limiting utilities
 */
export const rateLimitCache = {
  async checkLimit(
    identifier: string,
    limit: number,
    windowSeconds: number
  ): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: number;
  }> {
    const key = `${CACHE_PREFIXES.RATE_LIMIT}${identifier}`;

    try {
      const current = await cacheIncr(key, windowSeconds);
      const remaining = Math.max(0, limit - current);
      const resetTime = Date.now() + windowSeconds * 1000;

      return {
        allowed: current <= limit,
        remaining,
        resetTime,
      };
    } catch (error) {
      console.error(`Rate limit check error for ${identifier}:`, error);
      return { allowed: true, remaining: limit, resetTime: Date.now() };
    }
  },

  async resetLimit(identifier: string): Promise<boolean> {
    return cacheDel(`${CACHE_PREFIXES.RATE_LIMIT}${identifier}`);
  },
};

/**
 * Email verification caching
 */
export const emailCache = {
  async setVerificationCode(email: string, code: string): Promise<boolean> {
    return cacheSet(
      `${CACHE_PREFIXES.EMAIL_VERIFICATION}${email}`,
      { code, timestamp: Date.now() },
      CACHE_TTL.EMAIL_VERIFICATION
    );
  },

  async getVerificationCode(
    email: string
  ): Promise<{ code: string; timestamp: number } | null> {
    return cacheGet<{ code: string; timestamp: number }>(
      `${CACHE_PREFIXES.EMAIL_VERIFICATION}${email}`
    );
  },

  async deleteVerificationCode(email: string): Promise<boolean> {
    return cacheDel(`${CACHE_PREFIXES.EMAIL_VERIFICATION}${email}`);
  },

  async setPasswordResetToken(email: string, token: string): Promise<boolean> {
    return cacheSet(
      `${CACHE_PREFIXES.PASSWORD_RESET}${email}`,
      { token, timestamp: Date.now() },
      CACHE_TTL.PASSWORD_RESET
    );
  },

  async getPasswordResetToken(
    email: string
  ): Promise<{ token: string; timestamp: number } | null> {
    return cacheGet<{ token: string; timestamp: number }>(
      `${CACHE_PREFIXES.PASSWORD_RESET}${email}`
    );
  },

  async deletePasswordResetToken(email: string): Promise<boolean> {
    return cacheDel(`${CACHE_PREFIXES.PASSWORD_RESET}${email}`);
  },
};

/**
 * Analytics caching
 */
export const analyticsCache = {
  async logAccess(
    secretId: string,
    userId?: string,
    metadata?: AccessLogMetadata
  ): Promise<boolean> {
    const key = `${CACHE_PREFIXES.ACCESS_LOG}${secretId}:${Date.now()}`;
    return cacheSet(
      key,
      {
        secretId,
        userId,
        timestamp: Date.now(),
        ...metadata,
      },
      CACHE_TTL.ACCESS_ANALYTICS
    );
  },

  async getAccessStats(
    secretId: string
  ): Promise<Record<string, unknown> | null> {
    // This would require a more complex implementation with sorted sets
    // For now, return basic cached stats
    return cacheGet<Record<string, unknown>>(
      `${CACHE_PREFIXES.ACCESS_LOG}stats:${secretId}`
    );
  },

  async setAccessStats(
    secretId: string,
    stats: Record<string, unknown>
  ): Promise<boolean> {
    return cacheSet(
      `${CACHE_PREFIXES.ACCESS_LOG}stats:${secretId}`,
      stats,
      CACHE_TTL.ACCESS_ANALYTICS
    );
  },
};

// ============================================================================
// CACHE HEALTH CHECK
// ============================================================================

/**
 * Check Redis connection health
 */
export async function checkRedisHealth(): Promise<{
  connected: boolean;
  latency?: number;
  error?: string;
}> {
  try {
    const start = Date.now();
    await redis.ping();
    const latency = Date.now() - start;

    return { connected: true, latency };
  } catch (error) {
    return {
      connected: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Clear all cache with optional pattern
 */
export async function clearCache(pattern?: string): Promise<boolean> {
  try {
    if (pattern) {
      // Note: Upstash Redis might not support SCAN, so this is a simplified version
      // In production, you might want to implement pattern-based deletion differently
      console.warn(
        "Pattern-based cache clearing not fully implemented for Upstash"
      );
      return false;
    } else {
      await redis.flushall();
      return true;
    }
  } catch (error) {
    console.error("Cache clear error:", error);
    return false;
  }
}

// Export default redis instance for direct use
export default redis;

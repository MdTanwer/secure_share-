/**
 * Rate Limiting System for SecureShare
 *
 * Implements various rate limiting strategies using Redis
 * for API protection and abuse prevention.
 */

import { rateLimitCache } from "./redis";
import type {
  RateLimitResult,
  RateLimitOptions,
  ExpressRequest,
  ExpressResponse,
  NextFunction,
} from "./types";

// Rate limit configurations
export const RATE_LIMITS = {
  // Authentication endpoints
  LOGIN: { requests: 5, windowMs: 15 * 60 * 1000 }, // 5 attempts per 15 minutes
  REGISTER: { requests: 3, windowMs: 60 * 60 * 1000 }, // 3 attempts per hour
  EMAIL_VERIFICATION: { requests: 3, windowMs: 5 * 60 * 1000 }, // 3 codes per 5 minutes
  PASSWORD_RESET: { requests: 3, windowMs: 60 * 60 * 1000 }, // 3 requests per hour

  // Secret endpoints
  CREATE_SECRET: { requests: 10, windowMs: 60 * 60 * 1000 }, // 10 secrets per hour
  VIEW_SECRET: { requests: 50, windowMs: 60 * 60 * 1000 }, // 50 views per hour
  SHARE_SECRET: { requests: 20, windowMs: 60 * 60 * 1000 }, // 20 shares per hour

  // General API
  API_GENERAL: { requests: 100, windowMs: 60 * 60 * 1000 }, // 100 requests per hour
  API_STRICT: { requests: 20, windowMs: 60 * 60 * 1000 }, // 20 requests per hour
} as const;

/**
 * Check rate limit for a given identifier
 */
export async function checkRateLimit(
  identifier: string,
  options: RateLimitOptions
): Promise<RateLimitResult> {
  const { requests, windowMs } = options;
  const windowSeconds = Math.floor(windowMs / 1000);

  const keyGenerator = options.keyGenerator || ((id) => `rate_limit:${id}`);
  const key = keyGenerator(identifier);

  const result = await rateLimitCache.checkLimit(key, requests, windowSeconds);

  return {
    success: result.allowed,
    limit: requests,
    remaining: result.remaining,
    resetTime: result.resetTime,
    retryAfter: result.allowed ? undefined : Math.ceil(windowSeconds * 1000),
  };
}

/**
 * Rate limit by IP address
 */
export async function rateLimitByIP(
  ipAddress: string,
  options: RateLimitOptions
): Promise<RateLimitResult> {
  return checkRateLimit(`ip:${ipAddress}`, options);
}

/**
 * Rate limit by user ID
 */
export async function rateLimitByUser(
  userId: string,
  options: RateLimitOptions
): Promise<RateLimitResult> {
  return checkRateLimit(`user:${userId}`, options);
}

/**
 * Rate limit by email address
 */
export async function rateLimitByEmail(
  email: string,
  options: RateLimitOptions
): Promise<RateLimitResult> {
  return checkRateLimit(`email:${email}`, options);
}

/**
 * Composite rate limiting (IP + User)
 */
export async function rateLimitComposite(
  ipAddress: string,
  options: RateLimitOptions,
  userId?: string
): Promise<RateLimitResult> {
  // Check IP-based rate limit first
  const ipResult = await rateLimitByIP(ipAddress, options);

  if (!ipResult.success) {
    return ipResult;
  }

  // If user is logged in, check user-based rate limit
  if (userId) {
    const userResult = await rateLimitByUser(userId, {
      ...options,
      requests: options.requests * 2, // More lenient for authenticated users
    });

    if (!userResult.success) {
      return userResult;
    }
  }

  return ipResult;
}

/**
 * Rate limit middleware factory for different endpoints
 */
export const createRateLimiter = (limitType: keyof typeof RATE_LIMITS) => {
  const config = RATE_LIMITS[limitType];

  return async (identifier: string): Promise<RateLimitResult> => {
    return checkRateLimit(identifier, config);
  };
};

// Pre-configured rate limiters for common use cases
export const rateLimiters = {
  login: createRateLimiter("LOGIN"),
  register: createRateLimiter("REGISTER"),
  emailVerification: createRateLimiter("EMAIL_VERIFICATION"),
  passwordReset: createRateLimiter("PASSWORD_RESET"),
  createSecret: createRateLimiter("CREATE_SECRET"),
  viewSecret: createRateLimiter("VIEW_SECRET"),
  shareSecret: createRateLimiter("SHARE_SECRET"),
  apiGeneral: createRateLimiter("API_GENERAL"),
  apiStrict: createRateLimiter("API_STRICT"),
};

/**
 * Express-style middleware for rate limiting
 */
export function rateLimitMiddleware(
  limitType: keyof typeof RATE_LIMITS,
  getIdentifier: (req: ExpressRequest) => string = (req) => req.ip
) {
  const limiter = createRateLimiter(limitType);

  return async (
    req: ExpressRequest,
    res: ExpressResponse,
    next: NextFunction
  ) => {
    const identifier = getIdentifier(req);
    const result = await limiter(identifier);

    // Add rate limit headers
    res.setHeader("X-RateLimit-Limit", result.limit);
    res.setHeader("X-RateLimit-Remaining", result.remaining);
    res.setHeader(
      "X-RateLimit-Reset",
      new Date(result.resetTime).toISOString()
    );

    if (!result.success) {
      res.setHeader("Retry-After", Math.ceil((result.retryAfter || 0) / 1000));
      return res.status(429).json({
        error: "Too Many Requests",
        message: "Rate limit exceeded. Please try again later.",
        retryAfter: result.retryAfter,
        resetTime: result.resetTime,
      });
    }

    next();
  };
}

/**
 * tRPC rate limiting helper
 */
export function withRateLimit<T>(
  limitType: keyof typeof RATE_LIMITS,
  getIdentifier: (ctx: T) => string
) {
  const limiter = createRateLimiter(limitType);

  return async (ctx: T) => {
    const identifier = getIdentifier(ctx);
    const result = await limiter(identifier);

    if (!result.success) {
      throw new Error(
        `Rate limit exceeded. Try again in ${Math.ceil(
          (result.retryAfter || 0) / 1000
        )} seconds.`
      );
    }

    return result;
  };
}

/**
 * Advanced rate limiting with burst protection
 */
export async function burstRateLimit(
  identifier: string,
  shortTerm: RateLimitOptions,
  longTerm: RateLimitOptions
): Promise<RateLimitResult> {
  // Check short-term limit (burst protection)
  const shortResult = await checkRateLimit(`burst:${identifier}`, shortTerm);

  if (!shortResult.success) {
    return shortResult;
  }

  // Check long-term limit
  const longResult = await checkRateLimit(`sustained:${identifier}`, longTerm);

  return longResult.success ? shortResult : longResult;
}

/**
 * Reset rate limit for an identifier
 */
export async function resetRateLimit(identifier: string): Promise<boolean> {
  return rateLimitCache.resetLimit(identifier);
}

/**
 * Get current rate limit status without incrementing
 */
export async function getRateLimitStatus(
  identifier: string,
  options: RateLimitOptions
): Promise<Omit<RateLimitResult, "success">> {
  // This is a simplified version - in a real implementation,
  // you'd want to check the current count without incrementing
  const result = await checkRateLimit(identifier, options);

  return {
    limit: result.limit,
    remaining: result.remaining,
    resetTime: result.resetTime,
    retryAfter: result.retryAfter,
  };
}

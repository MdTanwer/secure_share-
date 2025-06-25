/**
 * Redis Test API Endpoint
 *
 * Simple endpoint to test Redis connectivity and caching functionality
 */

import { NextRequest, NextResponse } from "next/server";
import {
  checkRedisHealth,
  cacheGet,
  cacheSet,
  cacheDel,
  userCache,
  secretCache,
} from "@/lib/redis";
import { rateLimiters } from "@/lib/rate-limiter";

// Helper function to get client IP
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const real = request.headers.get("x-real-ip");

  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }

  if (real) {
    return real;
  }

  return "unknown";
}

export async function GET(request: NextRequest) {
  try {
    const ip = getClientIP(request);

    // Check rate limit first
    const rateLimitResult = await rateLimiters.apiGeneral(`ip:${ip}`);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          retryAfter: rateLimitResult.retryAfter,
        },
        { status: 429 }
      );
    }

    // Test Redis connectivity
    const healthCheck = await checkRedisHealth();

    if (!healthCheck.connected) {
      return NextResponse.json(
        {
          error: "Redis connection failed",
          details: healthCheck.error,
        },
        { status: 500 }
      );
    }

    // Test basic cache operations
    const testKey = `test:${Date.now()}`;
    const testValue = {
      message: "Redis is working!",
      timestamp: new Date().toISOString(),
      ip,
    };

    // Set a test value
    await cacheSet(testKey, testValue, 60); // Expire in 60 seconds

    // Get the test value back
    const retrievedValue = await cacheGet(testKey);

    // Clean up
    await cacheDel(testKey);

    return NextResponse.json({
      status: "success",
      redis: {
        connected: healthCheck.connected,
        latency: healthCheck.latency,
      },
      test: {
        original: testValue,
        retrieved: retrievedValue,
        matches: JSON.stringify(testValue) === JSON.stringify(retrievedValue),
      },
      rateLimit: {
        remaining: rateLimitResult.remaining,
        resetTime: new Date(rateLimitResult.resetTime).toISOString(),
      },
    });
  } catch (error) {
    console.error("Redis test error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIP(request);

    // Check rate limit
    const rateLimitResult = await rateLimiters.apiStrict(`ip:${ip}`);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { key, value, ttl, action } = body;

    if (!key) {
      return NextResponse.json({ error: "Key is required" }, { status: 400 });
    }

    // Ensure test keys only
    if (!key.startsWith("test:")) {
      return NextResponse.json(
        { error: 'Only test keys (starting with "test:") are allowed' },
        { status: 400 }
      );
    }

    let result;

    switch (action) {
      case "set":
        if (value === undefined) {
          return NextResponse.json(
            { error: "Value is required for set operation" },
            { status: 400 }
          );
        }
        result = await cacheSet(key, value, ttl);
        return NextResponse.json({
          action: "set",
          key,
          success: result,
          ttl: ttl || "no expiration",
        });

      case "get":
        result = await cacheGet(key);
        return NextResponse.json({
          action: "get",
          key,
          value: result,
        });

      case "delete":
        result = await cacheDel(key);
        return NextResponse.json({
          action: "delete",
          key,
          success: result,
        });

      case "user-session-test":
        // Test user cache functionality
        const testUserId = "test-user-123";
        const userData = {
          id: testUserId,
          email: "test@example.com",
          name: "Test User",
        };

        await userCache.setSession(testUserId, userData);
        const retrievedUser = await userCache.getSession(testUserId);
        await userCache.deleteSession(testUserId);

        return NextResponse.json({
          action: "user-session-test",
          original: userData,
          retrieved: retrievedUser,
          matches: JSON.stringify(userData) === JSON.stringify(retrievedUser),
        });

      case "secret-cache-test":
        // Test secret cache functionality
        const testSecretId = "test-secret-123";
        const secretMetadata = {
          id: testSecretId,
          title: "Test Secret",
          description: "Test description",
          contentType: "TEXT" as const,
          fileName: undefined,
          expiresAt: null,
          deleteAfterView: false,
          isPublic: false,
          maxViews: undefined,
          currentViews: 0,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdById: "test-user",
          hasPassword: false,
        };
        const secretContent = "This is test secret content";

        await secretCache.setMetadata(testSecretId, secretMetadata);
        await secretCache.setContent(testSecretId, secretContent);

        const retrievedMetadata = await secretCache.getMetadata(testSecretId);
        const retrievedContent = await secretCache.getContent(testSecretId);

        await secretCache.deleteSecret(testSecretId);

        return NextResponse.json({
          action: "secret-cache-test",
          metadata: {
            original: secretMetadata,
            retrieved: retrievedMetadata,
          },
          content: {
            original: secretContent,
            retrieved: retrievedContent,
          },
        });

      default:
        return NextResponse.json(
          {
            error:
              "Invalid action. Use: set, get, delete, user-session-test, or secret-cache-test",
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Redis operation error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

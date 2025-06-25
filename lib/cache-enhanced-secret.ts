/**
 * Cache-Enhanced Secret Operations
 *
 * Example implementation showing how to integrate Redis caching
 * with your existing secret operations for better performance.
 */

import { db } from "./db";
import { secretCache, userCache, analyticsCache } from "./redis";
import { rateLimiters } from "./rate-limiter";
import type {
  Secret,
  SecretMetadata,
  CacheCreateSecretInput,
  DatabaseSecret,
} from "./types";

// Helper function to convert database secret to SecretMetadata
function dbSecretToMetadata(secret: DatabaseSecret): SecretMetadata {
  return {
    id: secret.id,
    title: secret.title,
    description: secret.description || undefined,
    contentType: secret.contentType as "TEXT" | "FILE",
    fileName: secret.fileName || undefined,
    expiresAt: secret.expiresAt,
    deleteAfterView: secret.deleteAfterView,
    isPublic: secret.isPublic,
    maxViews: secret.maxViews || undefined,
    currentViews: secret.currentViews,
    isActive: secret.isActive,
    createdAt: secret.createdAt,
    updatedAt: secret.updatedAt,
    createdById: secret.createdById,
    hasPassword: !!secret.password,
  };
}

/**
 * Get secret with caching
 */
export async function getCachedSecret(
  secretId: string,
  includeContent = true
): Promise<Secret | null> {
  try {
    // Try to get from cache first
    const [cachedMetadata, cachedContent] = await Promise.all([
      secretCache.getMetadata(secretId),
      includeContent ? secretCache.getContent(secretId) : Promise.resolve(null),
    ]);

    // If we have cached data, return it
    if (cachedMetadata && (!includeContent || cachedContent)) {
      return {
        ...cachedMetadata,
        content: cachedContent || "",
        password: undefined, // Don't return password in response
      };
    }

    // If not in cache, fetch from database
    const secret = await db.secret.findUnique({
      where: { id: secretId },
    });

    if (!secret) {
      return null;
    }

    // Cache the metadata and content separately
    const metadata = dbSecretToMetadata(secret as DatabaseSecret);

    // Cache metadata and content separately for better performance
    await Promise.all([
      secretCache.setMetadata(secretId, metadata),
      secretCache.setContent(secretId, secret.content),
    ]);

    return secret as Secret;
  } catch (error) {
    console.error("Error getting cached secret:", error);
    // Fallback to database if cache fails
    return db.secret.findUnique({
      where: { id: secretId },
    }) as Promise<Secret | null>;
  }
}

/**
 * Create secret with caching
 */
export async function createCachedSecret(
  userId: string,
  input: CacheCreateSecretInput,
  ipAddress: string
): Promise<Secret> {
  // Check rate limit
  const rateLimitResult = await rateLimiters.createSecret(`user:${userId}`);
  if (!rateLimitResult.success) {
    throw new Error(
      `Rate limit exceeded. Try again in ${Math.ceil(
        (rateLimitResult.retryAfter || 0) / 1000
      )} seconds.`
    );
  }

  // Create in database
  const secret = await db.secret.create({
    data: {
      ...input,
      contentType: input.contentType || "TEXT",
      deleteAfterView: input.deleteAfterView || false,
      isPublic: input.isPublic || false,
      createdById: userId,
      currentViews: 0,
      isActive: true,
    },
  });

  // Cache the new secret
  const metadata = dbSecretToMetadata(secret as DatabaseSecret);

  await Promise.all([
    secretCache.setMetadata(secret.id, metadata),
    secretCache.setContent(secret.id, secret.content),
  ]);

  // Log analytics
  await analyticsCache.logAccess(secret.id, userId, {
    secretId: secret.id,
    userId,
    timestamp: Date.now(),
    action: "create",
    ipAddress,
  });

  return secret as Secret;
}

/**
 * Access secret with rate limiting and caching
 */
export async function accessCachedSecret(
  secretId: string,
  ipAddress: string,
  userAgent: string,
  userId?: string,
  password?: string
): Promise<{
  secret: Secret;
  shouldDeleteAfterView: boolean;
}> {
  // Rate limit by IP
  const rateLimitResult = await rateLimiters.viewSecret(`ip:${ipAddress}`);
  if (!rateLimitResult.success) {
    throw new Error("Rate limit exceeded for secret access");
  }

  // Get secret from cache
  const secret = await getCachedSecret(secretId, true);
  if (!secret) {
    throw new Error("Secret not found");
  }

  // Validate secret state
  const now = new Date();
  if (secret.expiresAt && now > secret.expiresAt) {
    throw new Error("Secret has expired");
  }

  if (secret.maxViews && secret.currentViews >= secret.maxViews) {
    throw new Error("Secret has reached maximum views");
  }

  if (!secret.isActive) {
    throw new Error("Secret is not active");
  }

  // Check password if required
  if (secret.password && password !== secret.password) {
    throw new Error("Invalid password");
  }

  // Increment view count in database and cache
  const updatedSecret = await db.secret.update({
    where: { id: secretId },
    data: { currentViews: { increment: 1 } },
  });

  // Update cache with new view count
  const updatedMetadata: SecretMetadata = {
    id: secret.id,
    title: secret.title,
    description: secret.description,
    contentType: secret.contentType,
    fileName: secret.fileName,
    expiresAt: secret.expiresAt,
    deleteAfterView: secret.deleteAfterView,
    isPublic: secret.isPublic,
    maxViews: secret.maxViews,
    currentViews: updatedSecret.currentViews,
    isActive: secret.isActive,
    createdAt: secret.createdAt,
    updatedAt: secret.updatedAt,
    createdById: secret.createdById,
    hasPassword: !!secret.password,
  };

  await secretCache.setMetadata(secretId, updatedMetadata);

  // Log access
  await Promise.all([
    db.accessLog.create({
      data: {
        secretId,
        userId,
        ipAddress,
        userAgent,
        accessedAt: now,
      },
    }),
    analyticsCache.logAccess(secretId, userId, {
      secretId,
      userId,
      timestamp: Date.now(),
      action: "view",
      ipAddress,
      userAgent,
    }),
  ]);

  const shouldDeleteAfterView = secret.deleteAfterView;

  // If it's a one-time view, mark as inactive
  if (shouldDeleteAfterView) {
    await Promise.all([
      db.secret.update({
        where: { id: secretId },
        data: { isActive: false },
      }),
      secretCache.deleteSecret(secretId),
    ]);
  }

  return {
    secret: {
      ...secret,
      currentViews: updatedSecret.currentViews,
    },
    shouldDeleteAfterView,
  };
}

/**
 * Get user's secrets with caching
 */
export async function getUserSecrets(
  userId: string
): Promise<SecretMetadata[]> {
  try {
    // Try to get from user cache first
    const cachedSecrets = await userCache.getProfile<SecretMetadata[]>(
      `secrets:${userId}`
    );
    if (cachedSecrets) {
      return cachedSecrets;
    }

    // Fetch from database
    const secrets = await db.secret.findMany({
      where: {
        createdById: userId,
        isActive: true,
      },
      select: {
        id: true,
        title: true,
        description: true,
        contentType: true,
        fileName: true,
        expiresAt: true,
        deleteAfterView: true,
        isPublic: true,
        maxViews: true,
        currentViews: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        createdById: true,
        password: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const secretMetadata: SecretMetadata[] = secrets.map((secret) =>
      dbSecretToMetadata(secret as DatabaseSecret)
    );

    // Cache the result
    await userCache.setProfile(`secrets:${userId}`, secretMetadata);

    return secretMetadata;
  } catch (error) {
    console.error("Error getting user secrets:", error);
    throw error;
  }
}

/**
 * Delete secret with cache invalidation
 */
export async function deleteCachedSecret(
  secretId: string,
  userId: string
): Promise<boolean> {
  try {
    // Verify ownership
    const secret = await getCachedSecret(secretId, false);
    if (!secret || secret.createdById !== userId) {
      throw new Error("Secret not found or unauthorized");
    }

    // Soft delete in database
    await db.secret.update({
      where: { id: secretId },
      data: { isActive: false },
    });

    // Remove from cache
    await secretCache.deleteSecret(secretId);

    // Invalidate user's secrets cache
    await userCache.deleteSession(`secrets:${userId}`);

    // Log the deletion
    await analyticsCache.logAccess(secretId, userId, {
      secretId,
      userId,
      timestamp: Date.now(),
      action: "delete",
    });

    return true;
  } catch (error) {
    console.error("Error deleting cached secret:", error);
    throw error;
  }
}

/**
 * Update secret with cache invalidation
 */
export async function updateCachedSecret(
  secretId: string,
  userId: string,
  updates: Partial<CacheCreateSecretInput>
): Promise<Secret> {
  try {
    // Verify ownership first
    const existingSecret = await getCachedSecret(secretId, false);
    if (!existingSecret || existingSecret.createdById !== userId) {
      throw new Error("Secret not found or unauthorized");
    }

    // Update in database
    const updatedSecret = await db.secret.update({
      where: { id: secretId },
      data: updates,
    });

    // Update cache
    const metadata = dbSecretToMetadata(updatedSecret as DatabaseSecret);

    await Promise.all([
      secretCache.setMetadata(secretId, metadata),
      updates.content
        ? secretCache.setContent(secretId, updates.content)
        : Promise.resolve(),
    ]);

    // Invalidate user's secrets cache
    await userCache.deleteSession(`secrets:${userId}`);

    // Log the update
    await analyticsCache.logAccess(secretId, userId, {
      secretId,
      userId,
      timestamp: Date.now(),
      action: "update",
    });

    return updatedSecret as Secret;
  } catch (error) {
    console.error("Error updating cached secret:", error);
    throw error;
  }
}

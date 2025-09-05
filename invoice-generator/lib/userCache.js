import { createClerkClient } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

// In-memory cache for user data with size limits and LRU eviction
const userCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_SIZE = 1000; // Maximum number of cached users
const CLEANUP_INTERVAL = 10 * 60 * 1000; // Cleanup every 10 minutes

// Track access order for LRU eviction
const accessOrder = new Map();
let accessCounter = 0;

// Periodic cleanup to prevent memory leaks
let cleanupTimer = null;

/**
 * Initialize cleanup timer
 */
function initializeCleanup() {
  if (cleanupTimer) return;
  
  cleanupTimer = setInterval(() => {
    cleanupExpiredEntries();
    enforceCacheSize();
  }, CLEANUP_INTERVAL);
  
  // Ensure cleanup runs on process exit
  process.on('exit', () => {
    if (cleanupTimer) {
      clearInterval(cleanupTimer);
    }
  });
}

/**
 * Remove expired entries from cache
 */
function cleanupExpiredEntries() {
  const now = Date.now();
  const expiredKeys = [];
  
  for (const [key, value] of userCache.entries()) {
    if (now - value.timestamp >= CACHE_TTL) {
      expiredKeys.push(key);
    }
  }
  
  expiredKeys.forEach(key => {
    userCache.delete(key);
    accessOrder.delete(key);
  });
  
  if (expiredKeys.length > 0) {
    console.log(`Cleaned up ${expiredKeys.length} expired cache entries`);
  }
}

/**
 * Enforce maximum cache size using LRU eviction
 */
function enforceCacheSize() {
  if (userCache.size <= MAX_CACHE_SIZE) return;
  
  // Sort by access order (oldest first)
  const sortedEntries = Array.from(accessOrder.entries())
    .sort((a, b) => a[1] - b[1]);
  
  const entriesToRemove = userCache.size - MAX_CACHE_SIZE;
  const keysToRemove = sortedEntries.slice(0, entriesToRemove).map(([key]) => key);
  
  keysToRemove.forEach(key => {
    userCache.delete(key);
    accessOrder.delete(key);
  });
  
  console.log(`Evicted ${keysToRemove.length} LRU cache entries to enforce size limit`);
}

/**
 * Update access order for LRU tracking
 */
function updateAccessOrder(key) {
  accessOrder.set(key, ++accessCounter);
}

// Initialize cleanup on module load
initializeCleanup();

/**
 * Get or create user with caching to reduce database queries
 * @param {string} clerkUserId - Clerk user ID
 * @returns {Promise<Object>} User object from database
 */
export async function getCachedUser(clerkUserId) {
  if (!clerkUserId) {
    throw new Error('User ID is required');
  }

  // Check cache first
  const cacheKey = `user_${clerkUserId}`;
  const cached = userCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    // Update access order for LRU tracking
    updateAccessOrder(cacheKey);
    return cached.user;
  }

  try {
    // Try to find existing user in database
    let dbUser = await prisma.user.findUnique({
      where: { clerkId: clerkUserId },
    });

    // If user doesn't exist, create them
    if (!dbUser) {
      const clerkUser = await clerkClient.users.getUser(clerkUserId);
      const username = clerkUser.username || clerkUser.firstName || "Unknown";
      
      dbUser = await prisma.user.create({
        data: {
          name: username,
          clerkId: clerkUserId,
        },
      });
    }

    // Cache the result with LRU tracking
    userCache.set(cacheKey, {
      user: dbUser,
      timestamp: Date.now(),
    });
    
    // Update access order for LRU tracking
    updateAccessOrder(cacheKey);
    
    // Enforce cache size limits
    enforceCacheSize();

    return dbUser;
  } catch (error) {
    console.error('Error in getCachedUser:', error);
    throw error;
  }
}

/**
 * Clear user from cache (useful when user data is updated)
 * @param {string} clerkUserId - Clerk user ID
 */
export function clearUserCache(clerkUserId) {
  const cacheKey = `user_${clerkUserId}`;
  userCache.delete(cacheKey);
  accessOrder.delete(cacheKey);
}

/**
 * Clear all cached users (useful for testing or memory management)
 */
export function clearAllUserCache() {
  userCache.clear();
  accessOrder.clear();
  accessCounter = 0;
}

/**
 * Get cache statistics for monitoring
 */
export function getCacheStats() {
  const now = Date.now();
  let expiredCount = 0;
  
  // Count expired entries
  for (const [key, value] of userCache.entries()) {
    if (now - value.timestamp >= CACHE_TTL) {
      expiredCount++;
    }
  }
  
  return {
    size: userCache.size,
    maxSize: MAX_CACHE_SIZE,
    expiredEntries: expiredCount,
    accessOrderSize: accessOrder.size,
    accessCounter,
    cacheTTL: CACHE_TTL,
    cleanupInterval: CLEANUP_INTERVAL,
    keys: Array.from(userCache.keys()),
    memoryUsage: {
      cacheEntries: userCache.size,
      accessOrderEntries: accessOrder.size,
      estimatedMemoryKB: Math.round((userCache.size * 0.5) + (accessOrder.size * 0.1)) // Rough estimate
    }
  };
}
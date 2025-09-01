import { createClerkClient } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

// In-memory cache for user data
const userCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

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

    // Cache the result
    userCache.set(cacheKey, {
      user: dbUser,
      timestamp: Date.now(),
    });

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
}

/**
 * Clear all cached users (useful for testing or memory management)
 */
export function clearAllUserCache() {
  userCache.clear();
}

/**
 * Get cache statistics for monitoring
 */
export function getCacheStats() {
  return {
    size: userCache.size,
    keys: Array.from(userCache.keys()),
  };
}
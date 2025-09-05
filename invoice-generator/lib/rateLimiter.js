/**
 * Rate limiting utility for API routes
 * Prevents DoS attacks and API abuse
 */

// In-memory store for rate limiting (use Redis in production)
const rateLimitStore = new Map();

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of rateLimitStore.entries()) {
    if (now - data.resetTime > 0) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Rate limiter configuration
 */
const RATE_LIMITS = {
  // General API endpoints
  default: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100, // 100 requests per window
  },
  // Authentication endpoints (more restrictive)
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 20, // 20 requests per window
  },
  // Create/Update operations (more restrictive)
  mutation: {
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: 30, // 30 requests per window
  },
  // Search operations (moderate)
  search: {
    windowMs: 1 * 60 * 1000, // 1 minute
    maxRequests: 60, // 60 requests per window
  }
};

/**
 * Create rate limiter for specific endpoint type
 * @param {string} type - Rate limit type (default, auth, mutation, search)
 * @returns {Function} Rate limiter middleware function
 */
function createRateLimiter(type = 'default') {
  const config = RATE_LIMITS[type] || RATE_LIMITS.default;
  
  return function rateLimiter(request, identifier = null) {
    // Use provided identifier or extract from request
    const clientId = identifier || getClientIdentifier(request);
    const key = `${type}:${clientId}`;
    const now = Date.now();
    
    // Get or create rate limit data for this client
    let rateLimitData = rateLimitStore.get(key);
    
    if (!rateLimitData || now > rateLimitData.resetTime) {
      // Create new window
      rateLimitData = {
        count: 0,
        resetTime: now + config.windowMs,
        windowMs: config.windowMs,
        maxRequests: config.maxRequests
      };
    }
    
    // Increment request count
    rateLimitData.count++;
    rateLimitStore.set(key, rateLimitData);
    
    // Check if limit exceeded
    const isLimited = rateLimitData.count > config.maxRequests;
    const remaining = Math.max(0, config.maxRequests - rateLimitData.count);
    const resetTime = rateLimitData.resetTime;
    
    return {
      isLimited,
      remaining,
      resetTime,
      retryAfter: isLimited ? Math.ceil((resetTime - now) / 1000) : null,
      headers: {
        'X-RateLimit-Limit': config.maxRequests.toString(),
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': Math.ceil(resetTime / 1000).toString(),
        ...(isLimited && { 'Retry-After': Math.ceil((resetTime - now) / 1000).toString() })
      }
    };
  };
}

/**
 * Extract client identifier from request
 * Uses IP address and User-Agent as fallback if no user ID available
 */
function getClientIdentifier(request) {
  // Try to get IP address from various headers
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwarded?.split(',')[0] || realIp || 'unknown';
  
  // Get user agent for additional uniqueness
  const userAgent = request.headers.get('user-agent') || 'unknown';
  
  // Create a simple hash of IP + User Agent
  const identifier = `${ip}:${userAgent.substring(0, 50)}`;
  
  return identifier;
}

/**
 * Apply rate limiting to API route
 * @param {Request} request - Next.js request object
 * @param {string} type - Rate limit type
 * @param {string} userId - Optional user ID for user-specific limiting
 * @returns {Object} Rate limit result
 */
function applyRateLimit(request, type = 'default', userId = null) {
  const rateLimiter = createRateLimiter(type);
  const identifier = userId || getClientIdentifier(request);
  
  return rateLimiter(request, identifier);
}

/**
 * Create rate limit response
 * @param {Object} rateLimitResult - Result from applyRateLimit
 * @returns {Response} Next.js Response object
 */
function createRateLimitResponse(rateLimitResult) {
  const response = new Response(
    JSON.stringify({
      error: 'Too many requests',
      message: `Rate limit exceeded. Try again in ${rateLimitResult.retryAfter} seconds.`,
      retryAfter: rateLimitResult.retryAfter
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        ...rateLimitResult.headers
      }
    }
  );
  
  return response;
}

/**
 * Middleware wrapper for API routes
 * @param {Function} handler - API route handler
 * @param {string} type - Rate limit type
 * @returns {Function} Wrapped handler with rate limiting
 */
function withRateLimit(handler, type = 'default') {
  return async function rateLimitedHandler(request, context) {
    // Apply rate limiting
    const rateLimitResult = applyRateLimit(request, type);
    
    // If rate limited, return error response
    if (rateLimitResult.isLimited) {
      return createRateLimitResponse(rateLimitResult);
    }
    
    // Call original handler
    const response = await handler(request, context);
    
    // Add rate limit headers to successful responses
    if (response instanceof Response) {
      Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
    }
    
    return response;
  };
}

/**
 * Get current rate limit status for a client
 * @param {Request} request - Next.js request object
 * @param {string} type - Rate limit type
 * @param {string} userId - Optional user ID
 * @returns {Object} Current rate limit status
 */
function getRateLimitStatus(request, type = 'default', userId = null) {
  const identifier = userId || getClientIdentifier(request);
  const key = `${type}:${identifier}`;
  const rateLimitData = rateLimitStore.get(key);
  const config = RATE_LIMITS[type] || RATE_LIMITS.default;
  
  if (!rateLimitData) {
    return {
      remaining: config.maxRequests,
      resetTime: Date.now() + config.windowMs,
      isLimited: false
    };
  }
  
  const remaining = Math.max(0, config.maxRequests - rateLimitData.count);
  const isLimited = rateLimitData.count >= config.maxRequests;
  
  return {
    remaining,
    resetTime: rateLimitData.resetTime,
    isLimited
  };
}

module.exports = {
  createRateLimiter,
  applyRateLimit,
  createRateLimitResponse,
  withRateLimit,
  getRateLimitStatus,
  RATE_LIMITS
};
/**
 * Centralized configuration for the invoice generator application
 * Contains security, performance, validation, and feature settings
 */

// Environment configuration
export const ENV = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 3000,
  DATABASE_URL: process.env.DATABASE_URL,
  CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  WEBHOOK_SECRET: process.env.WEBHOOK_SECRET,
  APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
};

// Security configuration
export const SECURITY_CONFIG = {
  // Rate limiting
  RATE_LIMITS: {
    api: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 100,
      message: 'Too many API requests'
    },
    auth: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 5,
      message: 'Too many authentication attempts'
    },
    search: {
      windowMs: 1 * 60 * 1000, // 1 minute
      maxRequests: 30,
      message: 'Too many search requests'
    },
    health: {
      windowMs: 1 * 60 * 1000, // 1 minute
      maxRequests: 10,
      message: 'Too many health check requests'
    }
  },

  // Request size limits
  REQUEST_LIMITS: {
    maxBodySize: 1024 * 1024, // 1MB
    maxFileSize: 5 * 1024 * 1024, // 5MB
    maxFieldCount: 50,
    maxStringLength: 10000
  },

  // Security headers
  SECURITY_HEADERS: {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://clerk.com https://*.clerk.accounts.dev https://challenges.cloudflare.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob: https://img.clerk.com",
      "connect-src 'self' https://clerk.com https://*.clerk.accounts.dev https://api.clerk.dev https://clerk-telemetry.com https://*.clerk-telemetry.com",
      "frame-src 'self' https://clerk.com https://*.clerk.accounts.dev https://challenges.cloudflare.com",
      "worker-src 'self' blob:"
    ].join('; ')
  },

  // Brute force protection
  BRUTE_FORCE: {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    blockDuration: 60 * 60 * 1000 // 1 hour
  },

  // SQL injection patterns
  SQL_INJECTION_PATTERNS: [
    /('|(\-\-)|(;)|(\||\|)|(\*|\*))/i,
    /(union|select|insert|delete|update|drop|create|alter|exec|execute)/i,
    /(script|javascript|vbscript|onload|onerror|onclick)/i,
    /(\<|\>|\&lt;|\&gt;)/i
  ],

  // XSS patterns
  XSS_PATTERNS: [
    /<script[^>]*>.*?<\/script>/gi,
    /<iframe[^>]*>.*?<\/iframe>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<img[^>]+src[\s]*=[\s]*["']?[\s]*javascript:/gi,
    /<[^>]+style[\s]*=[\s]*["'][^"']*expression[\s]*\(/gi
  ]
};

// Performance configuration
export const PERFORMANCE_CONFIG = {
  // Database
  DATABASE: {
    connectionTimeout: 10000, // 10 seconds
    queryTimeout: 30000, // 30 seconds
    maxConnections: 10,
    slowQueryThreshold: 1000, // 1 second
    cacheTimeout: 5 * 60 * 1000, // 5 minutes
    maxCacheSize: 1000
  },

  // Memory monitoring
  MEMORY: {
    warningThreshold: 256, // MB
    criticalThreshold: 512, // MB
    monitoringInterval: 60000, // 1 minute
    gcThreshold: 0.8 // 80% heap usage
  },

  // Response times
  RESPONSE_TIMES: {
    slowRequestThreshold: 1000, // 1 second
    criticalRequestThreshold: 5000, // 5 seconds
    timeoutThreshold: 30000 // 30 seconds
  },

  // Caching
  CACHE: {
    defaultTTL: 5 * 60 * 1000, // 5 minutes
    maxSize: 1000,
    cleanupInterval: 10 * 60 * 1000 // 10 minutes
  }
};

// Validation configuration
export const VALIDATION_CONFIG = {
  // Pagination
  PAGINATION: {
    defaultLimit: 10,
    maxLimit: 100,
    minLimit: 1,
    defaultPage: 1
  },

  // String lengths
  STRING_LIMITS: {
    name: { min: 1, max: 255 },
    email: { min: 5, max: 255 },
    description: { min: 0, max: 1000 },
    address: { min: 0, max: 500 },
    phone: { min: 0, max: 20 },
    website: { min: 0, max: 255 },
    invoiceNumber: { min: 1, max: 50 },
    itemName: { min: 1, max: 255 }
  },

  // Numeric limits
  NUMERIC_LIMITS: {
    price: { min: 0, max: 999999.99 },
    quantity: { min: 0, max: 99999 },
    discount: { min: 0, max: 100 },
    tax: { min: 0, max: 100 }
  },

  // Regular expressions
  REGEX_PATTERNS: {
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    phone: /^[\+]?[1-9][\d\s\-\(\)]{7,15}$/,
    website: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
    clientId: /^[a-zA-Z0-9]{8,}$/,
    invoiceNumber: /^[A-Z0-9\-_]{1,50}$/i,
    uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  }
};

// Feature flags
export const FEATURE_FLAGS = {
  // Security features
  ENABLE_RATE_LIMITING: true,
  ENABLE_SECURITY_HEADERS: true,
  ENABLE_BRUTE_FORCE_PROTECTION: true,
  ENABLE_SQL_INJECTION_DETECTION: true,
  ENABLE_XSS_DETECTION: true,
  ENABLE_SECURITY_AUDIT_LOGGING: true,

  // Performance features
  ENABLE_QUERY_CACHING: true,
  ENABLE_PERFORMANCE_MONITORING: true,
  ENABLE_MEMORY_MONITORING: true,
  ENABLE_SLOW_QUERY_LOGGING: true,
  ENABLE_DATABASE_OPTIMIZATION: true,

  // Monitoring features
  ENABLE_ERROR_MONITORING: true,
  ENABLE_HEALTH_CHECKS: true,
  ENABLE_METRICS_COLLECTION: true,
  ENABLE_AUDIT_LOGGING: true,

  // Development features
  ENABLE_DEBUG_LOGGING: ENV.NODE_ENV === 'development',
  ENABLE_VERBOSE_ERRORS: ENV.NODE_ENV === 'development',
  ENABLE_PERFORMANCE_PROFILING: ENV.NODE_ENV === 'development'
};

// Logging configuration
export const LOGGING_CONFIG = {
  // Log levels
  LEVELS: {
    ERROR: 0,
    WARN: 1,
    INFO: 2,
    DEBUG: 3
  },

  // Current log level
  CURRENT_LEVEL: ENV.NODE_ENV === 'production' ? 1 : 3, // WARN in prod, DEBUG in dev

  // Log retention
  RETENTION: {
    maxLogSize: 10000, // Maximum number of log entries
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    cleanupInterval: 24 * 60 * 60 * 1000 // 24 hours
  },

  // Log formatting
  FORMAT: {
    timestamp: true,
    level: true,
    context: true,
    stack: ENV.NODE_ENV === 'development'
  }
};

// API configuration
export const API_CONFIG = {
  // Timeouts
  TIMEOUTS: {
    request: 30000, // 30 seconds
    database: 10000, // 10 seconds
    external: 5000 // 5 seconds
  },

  // Retry configuration
  RETRY: {
    maxAttempts: 3,
    backoffMs: 1000,
    backoffMultiplier: 2
  },

  // Response configuration
  RESPONSE: {
    maxSize: 10 * 1024 * 1024, // 10MB
    compressionThreshold: 1024, // 1KB
    cacheHeaders: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  }
};

// Database configuration
export const DATABASE_CONFIG = {
  // Connection settings
  CONNECTION: {
    maxConnections: 10,
    connectionTimeout: 10000,
    idleTimeout: 30000,
    acquireTimeout: 10000
  },

  // Query settings
  QUERY: {
    timeout: 30000,
    slowQueryThreshold: 1000,
    maxQueryLength: 10000
  },

  // Migration settings
  MIGRATION: {
    timeout: 60000,
    lockTimeout: 30000
  }
};

// Monitoring configuration
export const MONITORING_CONFIG = {
  // Health check intervals
  HEALTH_CHECK: {
    interval: 30000, // 30 seconds
    timeout: 5000, // 5 seconds
    retries: 3
  },

  // Metrics collection
  METRICS: {
    collectionInterval: 60000, // 1 minute
    retentionPeriod: 24 * 60 * 60 * 1000, // 24 hours
    maxDataPoints: 1440 // 24 hours of minute-by-minute data
  },

  // Alerting thresholds
  ALERTS: {
    errorRate: 0.05, // 5%
    responseTime: 2000, // 2 seconds
    memoryUsage: 0.8, // 80%
    diskUsage: 0.9, // 90%
    cpuUsage: 0.8 // 80%
  }
};

// Export all configurations
export const CONFIG = {
  ENV,
  SECURITY_CONFIG,
  PERFORMANCE_CONFIG,
  VALIDATION_CONFIG,
  FEATURE_FLAGS,
  LOGGING_CONFIG,
  API_CONFIG,
  DATABASE_CONFIG,
  MONITORING_CONFIG
};

// Configuration validation
export function validateConfiguration() {
  const errors = [];
  const warnings = [];

  // Check required environment variables
  if (!ENV.DATABASE_URL) {
    errors.push('DATABASE_URL environment variable is required');
  }

  if (!ENV.CLERK_SECRET_KEY) {
    errors.push('CLERK_SECRET_KEY environment variable is required');
  }

  if (!ENV.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    errors.push('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY environment variable is required');
  }

  // Check security configuration
  if (!FEATURE_FLAGS.ENABLE_RATE_LIMITING) {
    warnings.push('Rate limiting is disabled - consider enabling for production');
  }

  if (!FEATURE_FLAGS.ENABLE_SECURITY_HEADERS) {
    warnings.push('Security headers are disabled - consider enabling for production');
  }

  // Check performance configuration
  if (PERFORMANCE_CONFIG.DATABASE.maxConnections < 5) {
    warnings.push('Database connection pool is very small - may impact performance');
  }

  // Check production-specific settings
  if (ENV.NODE_ENV === 'production') {
    if (FEATURE_FLAGS.ENABLE_DEBUG_LOGGING) {
      warnings.push('Debug logging is enabled in production');
    }

    if (FEATURE_FLAGS.ENABLE_VERBOSE_ERRORS) {
      warnings.push('Verbose errors are enabled in production');
    }

    if (LOGGING_CONFIG.CURRENT_LEVEL > 2) {
      warnings.push('Log level is too verbose for production');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    summary: {
      totalErrors: errors.length,
      totalWarnings: warnings.length,
      securityFeaturesEnabled: Object.values(FEATURE_FLAGS).filter(f => f).length,
      environment: ENV.NODE_ENV
    }
  };
}

// Get configuration for specific environment
export function getEnvironmentConfig(environment = ENV.NODE_ENV) {
  const baseConfig = { ...CONFIG };

  switch (environment) {
    case 'production':
      return {
        ...baseConfig,
        FEATURE_FLAGS: {
          ...baseConfig.FEATURE_FLAGS,
          ENABLE_DEBUG_LOGGING: false,
          ENABLE_VERBOSE_ERRORS: false,
          ENABLE_PERFORMANCE_PROFILING: false
        },
        LOGGING_CONFIG: {
          ...baseConfig.LOGGING_CONFIG,
          CURRENT_LEVEL: 1 // WARN level
        }
      };

    case 'development':
      return {
        ...baseConfig,
        FEATURE_FLAGS: {
          ...baseConfig.FEATURE_FLAGS,
          ENABLE_DEBUG_LOGGING: true,
          ENABLE_VERBOSE_ERRORS: true,
          ENABLE_PERFORMANCE_PROFILING: true
        },
        LOGGING_CONFIG: {
          ...baseConfig.LOGGING_CONFIG,
          CURRENT_LEVEL: 3 // DEBUG level
        }
      };

    case 'test':
      return {
        ...baseConfig,
        FEATURE_FLAGS: {
          ...baseConfig.FEATURE_FLAGS,
          ENABLE_RATE_LIMITING: false,
          ENABLE_SECURITY_AUDIT_LOGGING: false,
          ENABLE_PERFORMANCE_MONITORING: false
        },
        SECURITY_CONFIG: {
          ...baseConfig.SECURITY_CONFIG,
          RATE_LIMITS: {
            ...baseConfig.SECURITY_CONFIG.RATE_LIMITS,
            api: { ...baseConfig.SECURITY_CONFIG.RATE_LIMITS.api, maxRequests: 1000 }
          }
        }
      };

    default:
      return baseConfig;
  }
}

// Initialize configuration
export function initializeConfiguration() {
  const validation = validateConfiguration();
  
  if (!validation.isValid) {
    console.error('❌ Configuration validation failed:');
    validation.errors.forEach(error => console.error(`  - ${error}`));
    throw new Error('Invalid configuration');
  }

  if (validation.warnings.length > 0) {
    console.warn('⚠️ Configuration warnings:');
    validation.warnings.forEach(warning => console.warn(`  - ${warning}`));
  }

  console.log('✅ Configuration initialized successfully');
  console.log(`Environment: ${ENV.NODE_ENV}`);
  console.log(`Security features enabled: ${validation.summary.securityFeaturesEnabled}`);
  
  return getEnvironmentConfig();
}

// Default export
export default CONFIG;
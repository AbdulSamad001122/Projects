/**
 * Comprehensive error handling utility for the invoice generator
 * Provides structured error logging, monitoring, and response formatting
 */

// Error types for categorization
export const ErrorTypes = {
  VALIDATION: 'VALIDATION_ERROR',
  AUTHENTICATION: 'AUTHENTICATION_ERROR',
  AUTHORIZATION: 'AUTHORIZATION_ERROR',
  DATABASE: 'DATABASE_ERROR',
  RATE_LIMIT: 'RATE_LIMIT_ERROR',
  EXTERNAL_API: 'EXTERNAL_API_ERROR',
  INTERNAL: 'INTERNAL_ERROR'
};

// Error severity levels
export const ErrorSeverity = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

/**
 * Custom error class with additional context
 */
export class AppError extends Error {
  constructor(message, type = ErrorTypes.INTERNAL, statusCode = 500, severity = ErrorSeverity.MEDIUM, context = {}) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.statusCode = statusCode;
    this.severity = severity;
    this.context = context;
    this.timestamp = new Date().toISOString();
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Sanitize error details for client response
 * Removes sensitive information from error messages
 */
export function sanitizeErrorForClient(error) {
  const sensitivePatterns = [
    /password/i,
    /token/i,
    /secret/i,
    /key/i,
    /auth/i,
    /credential/i,
    /session/i
  ];

  let message = error.message || 'An unexpected error occurred';
  
  // Check if message contains sensitive information
  const containsSensitiveInfo = sensitivePatterns.some(pattern => pattern.test(message));
  
  if (containsSensitiveInfo) {
    message = 'An error occurred while processing your request';
  }

  return {
    error: message,
    type: error.type || ErrorTypes.INTERNAL,
    timestamp: error.timestamp || new Date().toISOString()
  };
}

/**
 * Log error with structured format
 */
export function logError(error, context = {}) {
  const errorLog = {
    timestamp: new Date().toISOString(),
    message: error.message,
    type: error.type || ErrorTypes.INTERNAL,
    severity: error.severity || ErrorSeverity.MEDIUM,
    statusCode: error.statusCode || 500,
    stack: error.stack,
    context: {
      ...error.context,
      ...context
    }
  };

  // In production, you would send this to a logging service
  // For now, we'll use console with structured format
  if (error.severity === ErrorSeverity.CRITICAL || error.severity === ErrorSeverity.HIGH) {
    console.error('🚨 CRITICAL ERROR:', JSON.stringify(errorLog, null, 2));
  } else if (error.severity === ErrorSeverity.MEDIUM) {
    console.warn('⚠️ WARNING:', JSON.stringify(errorLog, null, 2));
  } else {
    console.log('ℹ️ INFO:', JSON.stringify(errorLog, null, 2));
  }

  return errorLog;
}

/**
 * Handle database errors and convert to AppError
 */
export function handleDatabaseError(error, operation = 'database operation') {
  let message = `Database error during ${operation}`;
  let statusCode = 500;
  let severity = ErrorSeverity.HIGH;

  // Handle specific Prisma errors
  if (error.code) {
    switch (error.code) {
      case 'P2002':
        message = 'A record with this information already exists';
        statusCode = 409;
        severity = ErrorSeverity.MEDIUM;
        break;
      case 'P2025':
        message = 'The requested record was not found';
        statusCode = 404;
        severity = ErrorSeverity.LOW;
        break;
      case 'P2003':
        message = 'This operation would violate a data constraint';
        statusCode = 400;
        severity = ErrorSeverity.MEDIUM;
        break;
      case 'P2021':
        message = 'The database table does not exist';
        statusCode = 500;
        severity = ErrorSeverity.CRITICAL;
        break;
      default:
        message = 'A database error occurred';
        break;
    }
  }

  return new AppError(
    message,
    ErrorTypes.DATABASE,
    statusCode,
    severity,
    {
      operation,
      originalError: error.message,
      code: error.code
    }
  );
}

/**
 * Create validation error
 */
export function createValidationError(field, value, rule) {
  return new AppError(
    `Validation failed for field '${field}': ${rule}`,
    ErrorTypes.VALIDATION,
    400,
    ErrorSeverity.LOW,
    { field, value, rule }
  );
}

/**
 * Create authentication error
 */
export function createAuthError(message = 'Authentication required') {
  return new AppError(
    message,
    ErrorTypes.AUTHENTICATION,
    401,
    ErrorSeverity.MEDIUM
  );
}

/**
 * Create authorization error
 */
export function createAuthorizationError(resource = 'resource') {
  return new AppError(
    `You don't have permission to access this ${resource}`,
    ErrorTypes.AUTHORIZATION,
    403,
    ErrorSeverity.MEDIUM,
    { resource }
  );
}

/**
 * Create rate limit error
 */
export function createRateLimitError(limit, windowMs) {
  return new AppError(
    `Rate limit exceeded. Maximum ${limit} requests per ${windowMs / 1000} seconds`,
    ErrorTypes.RATE_LIMIT,
    429,
    ErrorSeverity.LOW,
    { limit, windowMs }
  );
}

/**
 * Async error handler wrapper for API routes
 */
export function asyncHandler(fn) {
  return async (request, context) => {
    try {
      return await fn(request, context);
    } catch (error) {
      // Log the error
      const errorLog = logError(error, {
        url: request.url,
        method: request.method,
        userAgent: request.headers.get('user-agent')
      });

      // Handle different error types
      let appError;
      if (error instanceof AppError) {
        appError = error;
      } else if (error.code && error.code.startsWith('P')) {
        // Prisma error
        appError = handleDatabaseError(error);
      } else {
        // Generic error
        appError = new AppError(
          'An unexpected error occurred',
          ErrorTypes.INTERNAL,
          500,
          ErrorSeverity.HIGH,
          { originalError: error.message }
        );
      }

      // Return sanitized error response
      const clientError = sanitizeErrorForClient(appError);
      return new Response(
        JSON.stringify(clientError),
        {
          status: appError.statusCode,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }
  };
}

/**
 * Monitor error patterns and alert on anomalies
 */
class ErrorMonitor {
  constructor() {
    this.errorCounts = new Map();
    this.alertThresholds = {
      [ErrorSeverity.CRITICAL]: 1, // Alert immediately
      [ErrorSeverity.HIGH]: 5,     // Alert after 5 occurrences
      [ErrorSeverity.MEDIUM]: 20,  // Alert after 20 occurrences
      [ErrorSeverity.LOW]: 100     // Alert after 100 occurrences
    };
  }

  recordError(error) {
    const key = `${error.type}_${error.severity}`;
    const count = this.errorCounts.get(key) || 0;
    this.errorCounts.set(key, count + 1);

    // Check if we should alert
    const threshold = this.alertThresholds[error.severity] || 50;
    if ((count + 1) >= threshold) {
      this.sendAlert(error, count + 1);
      // Reset counter after alert
      this.errorCounts.set(key, 0);
    }
  }

  sendAlert(error, count) {
    // In production, this would integrate with alerting services
    // like PagerDuty, Slack, email, etc.
    console.error(`🚨 ERROR ALERT: ${error.type} (${error.severity}) occurred ${count} times`);
    console.error(`Message: ${error.message}`);
    console.error(`Context:`, error.context);
  }

  getErrorStats() {
    return Object.fromEntries(this.errorCounts);
  }

  clearStats() {
    this.errorCounts.clear();
  }
}

// Global error monitor instance
export const errorMonitor = new ErrorMonitor();

/**
 * Enhanced error logging with monitoring
 */
export function logErrorWithMonitoring(error, context = {}) {
  const errorLog = logError(error, context);
  errorMonitor.recordError(error);
  return errorLog;
}
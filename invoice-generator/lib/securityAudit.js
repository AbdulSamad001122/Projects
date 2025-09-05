/**
 * Security audit utility for the invoice generator
 * Provides security monitoring, threat detection, and audit logging
 */

import { logErrorWithMonitoring, AppError, ErrorTypes, ErrorSeverity } from './errorHandler.js';

// Security event types
export const SecurityEventTypes = {
  SUSPICIOUS_REQUEST: 'SUSPICIOUS_REQUEST',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  UNAUTHORIZED_ACCESS: 'UNAUTHORIZED_ACCESS',
  SQL_INJECTION_ATTEMPT: 'SQL_INJECTION_ATTEMPT',
  XSS_ATTEMPT: 'XSS_ATTEMPT',
  CSRF_ATTEMPT: 'CSRF_ATTEMPT',
  BRUTE_FORCE_ATTEMPT: 'BRUTE_FORCE_ATTEMPT',
  DATA_BREACH_ATTEMPT: 'DATA_BREACH_ATTEMPT'
};

// Risk levels
export const RiskLevels = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

/**
 * Security audit logger
 */
class SecurityAuditLogger {
  constructor() {
    this.auditLog = [];
    this.suspiciousIPs = new Map();
    this.failedAttempts = new Map();
    this.maxLogSize = 10000; // Keep last 10k entries
  }

  /**
   * Log security event
   */
  logSecurityEvent(eventType, riskLevel, details, request = null) {
    const event = {
      timestamp: new Date().toISOString(),
      eventType,
      riskLevel,
      details,
      ip: this.extractIP(request),
      userAgent: request?.headers?.get('user-agent') || 'unknown',
      url: request?.url || 'unknown',
      method: request?.method || 'unknown'
    };

    // Add to audit log
    this.auditLog.push(event);
    
    // Maintain log size
    if (this.auditLog.length > this.maxLogSize) {
      this.auditLog.shift();
    }

    // Track suspicious IPs
    if (riskLevel === RiskLevels.HIGH || riskLevel === RiskLevels.CRITICAL) {
      this.trackSuspiciousIP(event.ip, eventType);
    }

    // Log to console with appropriate level
    this.logToConsole(event);

    return event;
  }

  /**
   * Extract IP address from request
   */
  extractIP(request) {
    if (!request) return 'unknown';
    
    // Check various headers for real IP
    const headers = request.headers;
    return (
      headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      headers.get('x-real-ip') ||
      headers.get('cf-connecting-ip') ||
      headers.get('x-client-ip') ||
      'unknown'
    );
  }

  /**
   * Track suspicious IP addresses
   */
  trackSuspiciousIP(ip, eventType) {
    if (ip === 'unknown') return;

    const current = this.suspiciousIPs.get(ip) || { count: 0, events: [], firstSeen: new Date() };
    current.count++;
    current.events.push({ eventType, timestamp: new Date() });
    current.lastSeen = new Date();

    this.suspiciousIPs.set(ip, current);

    // Alert if IP has multiple suspicious events
    if (current.count >= 5) {
      this.alertSuspiciousIP(ip, current);
    }
  }

  /**
   * Alert on suspicious IP activity
   */
  alertSuspiciousIP(ip, activity) {
    console.error(`🚨 SUSPICIOUS IP DETECTED: ${ip}`);
    console.error(`Events: ${activity.count}, First seen: ${activity.firstSeen}`);
    console.error('Recent events:', activity.events.slice(-5));
  }

  /**
   * Log to console with appropriate formatting
   */
  logToConsole(event) {
    const logMessage = `[SECURITY] ${event.eventType} - ${event.riskLevel.toUpperCase()}`;
    const logDetails = {
      timestamp: event.timestamp,
      ip: event.ip,
      url: event.url,
      details: event.details
    };

    switch (event.riskLevel) {
      case RiskLevels.CRITICAL:
        console.error(`🚨 ${logMessage}`, logDetails);
        break;
      case RiskLevels.HIGH:
        console.error(`⚠️ ${logMessage}`, logDetails);
        break;
      case RiskLevels.MEDIUM:
        console.warn(`⚠️ ${logMessage}`, logDetails);
        break;
      default:
        console.log(`ℹ️ ${logMessage}`, logDetails);
    }
  }

  /**
   * Get audit log entries
   */
  getAuditLog(limit = 100) {
    return this.auditLog.slice(-limit);
  }

  /**
   * Get suspicious IPs
   */
  getSuspiciousIPs() {
    return Object.fromEntries(this.suspiciousIPs);
  }

  /**
   * Clear audit log
   */
  clearAuditLog() {
    this.auditLog = [];
    this.suspiciousIPs.clear();
    this.failedAttempts.clear();
  }
}

// Global security audit logger
export const securityAudit = new SecurityAuditLogger();

/**
 * Detect potential SQL injection attempts
 */
export function detectSQLInjection(input) {
  if (typeof input !== 'string') return false;

  const sqlPatterns = [
    /('|(\-\-)|(;)|(\||\|)|(\*|\*))/i,
    /(union|select|insert|delete|update|drop|create|alter|exec|execute)/i,
    /(script|javascript|vbscript|onload|onerror|onclick)/i,
    /(\<|\>|\&lt;|\&gt;)/i
  ];

  return sqlPatterns.some(pattern => pattern.test(input));
}

/**
 * Detect potential XSS attempts
 */
export function detectXSS(input) {
  if (typeof input !== 'string') return false;

  const xssPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /<iframe[^>]*>.*?<\/iframe>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<img[^>]+src[\s]*=[\s]*["']?[\s]*javascript:/gi,
    /<[^>]+style[\s]*=[\s]*["'][^"']*expression[\s]*\(/gi
  ];

  return xssPatterns.some(pattern => pattern.test(input));
}

/**
 * Validate request headers for security
 */
export function validateRequestHeaders(request) {
  const issues = [];
  const headers = request.headers;

  // Check for missing security headers in response context
  const requiredHeaders = [
    'user-agent',
    'accept'
  ];

  requiredHeaders.forEach(header => {
    if (!headers.get(header)) {
      issues.push(`Missing ${header} header`);
    }
  });

  // Check for suspicious user agents
  const userAgent = headers.get('user-agent') || '';
  const suspiciousUAPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /curl/i,
    /wget/i,
    /python/i,
    /java/i
  ];

  if (suspiciousUAPatterns.some(pattern => pattern.test(userAgent))) {
    issues.push('Suspicious user agent detected');
  }

  return issues;
}

/**
 * Monitor for brute force attempts
 */
class BruteForceMonitor {
  constructor() {
    this.attempts = new Map();
    this.maxAttempts = 5;
    this.windowMs = 15 * 60 * 1000; // 15 minutes
  }

  recordAttempt(identifier, success = false) {
    const now = Date.now();
    const key = identifier;
    
    if (!this.attempts.has(key)) {
      this.attempts.set(key, []);
    }

    const attempts = this.attempts.get(key);
    
    // Clean old attempts
    const validAttempts = attempts.filter(attempt => 
      now - attempt.timestamp < this.windowMs
    );

    // Add new attempt
    validAttempts.push({ timestamp: now, success });
    this.attempts.set(key, validAttempts);

    // Check for brute force
    const failedAttempts = validAttempts.filter(attempt => !attempt.success);
    
    if (failedAttempts.length >= this.maxAttempts) {
      return {
        isBruteForce: true,
        attempts: failedAttempts.length,
        timeWindow: this.windowMs
      };
    }

    return {
      isBruteForce: false,
      attempts: failedAttempts.length,
      remaining: this.maxAttempts - failedAttempts.length
    };
  }

  isBlocked(identifier) {
    const result = this.recordAttempt(identifier, true); // Check without recording
    return result.isBruteForce;
  }

  clearAttempts(identifier) {
    this.attempts.delete(identifier);
  }
}

// Global brute force monitor
export const bruteForceMonitor = new BruteForceMonitor();

/**
 * Security middleware for API routes
 */
export function securityMiddleware(request) {
  const securityIssues = [];
  const ip = securityAudit.extractIP(request);

  // Validate headers
  const headerIssues = validateRequestHeaders(request);
  securityIssues.push(...headerIssues);

  // Check for suspicious patterns in URL
  const url = request.url || '';
  if (detectSQLInjection(url) || detectXSS(url)) {
    securityIssues.push('Suspicious patterns in URL');
    securityAudit.logSecurityEvent(
      SecurityEventTypes.SUSPICIOUS_REQUEST,
      RiskLevels.HIGH,
      { reason: 'Malicious patterns in URL', url },
      request
    );
  }

  // Log security issues
  if (securityIssues.length > 0) {
    securityAudit.logSecurityEvent(
      SecurityEventTypes.SUSPICIOUS_REQUEST,
      RiskLevels.MEDIUM,
      { issues: securityIssues },
      request
    );
  }

  return {
    hasIssues: securityIssues.length > 0,
    issues: securityIssues,
    riskLevel: securityIssues.length > 2 ? RiskLevels.HIGH : RiskLevels.MEDIUM
  };
}

/**
 * Validate and sanitize request body for security
 */
export function validateRequestBody(body, maxSize = 1024 * 1024) {
  const issues = [];

  // Check body size
  const bodyString = JSON.stringify(body);
  if (bodyString.length > maxSize) {
    issues.push(`Request body too large: ${bodyString.length} bytes`);
  }

  // Recursively check for malicious content
  function checkValue(value, path = '') {
    if (typeof value === 'string') {
      if (detectSQLInjection(value)) {
        issues.push(`Potential SQL injection in ${path}`);
      }
      if (detectXSS(value)) {
        issues.push(`Potential XSS in ${path}`);
      }
    } else if (typeof value === 'object' && value !== null) {
      Object.entries(value).forEach(([key, val]) => {
        checkValue(val, path ? `${path}.${key}` : key);
      });
    }
  }

  checkValue(body);

  return {
    isValid: issues.length === 0,
    issues,
    sanitizedBody: body // In a real implementation, you'd sanitize the body
  };
}

/**
 * Generate security report
 */
export function generateSecurityReport() {
  const auditLog = securityAudit.getAuditLog(1000);
  const suspiciousIPs = securityAudit.getSuspiciousIPs();
  
  // Analyze events by type
  const eventsByType = {};
  const eventsByRisk = {};
  
  auditLog.forEach(event => {
    eventsByType[event.eventType] = (eventsByType[event.eventType] || 0) + 1;
    eventsByRisk[event.riskLevel] = (eventsByRisk[event.riskLevel] || 0) + 1;
  });

  // Recent high-risk events
  const highRiskEvents = auditLog
    .filter(event => event.riskLevel === RiskLevels.HIGH || event.riskLevel === RiskLevels.CRITICAL)
    .slice(-20);

  return {
    summary: {
      totalEvents: auditLog.length,
      suspiciousIPs: Object.keys(suspiciousIPs).length,
      highRiskEvents: highRiskEvents.length
    },
    eventsByType,
    eventsByRisk,
    suspiciousIPs,
    recentHighRiskEvents: highRiskEvents,
    generatedAt: new Date().toISOString()
  };
}

/**
 * Security health check
 */
export function performSecurityHealthCheck() {
  const report = generateSecurityReport();
  const issues = [];
  const recommendations = [];

  // Check for high number of suspicious events
  if (report.eventsByRisk[RiskLevels.CRITICAL] > 0) {
    issues.push('Critical security events detected');
    recommendations.push('Investigate critical security events immediately');
  }

  if (report.eventsByRisk[RiskLevels.HIGH] > 10) {
    issues.push('High number of high-risk security events');
    recommendations.push('Review security measures and consider additional protection');
  }

  // Check for suspicious IPs
  if (Object.keys(report.suspiciousIPs).length > 5) {
    issues.push('Multiple suspicious IP addresses detected');
    recommendations.push('Consider implementing IP blocking or additional rate limiting');
  }

  // Check for brute force attempts
  const bruteForceEvents = report.eventsByType[SecurityEventTypes.BRUTE_FORCE_ATTEMPT] || 0;
  if (bruteForceEvents > 5) {
    issues.push('Multiple brute force attempts detected');
    recommendations.push('Implement account lockout and stronger authentication measures');
  }

  return {
    status: issues.length === 0 ? 'healthy' : 'issues_detected',
    issues,
    recommendations,
    report,
    checkedAt: new Date().toISOString()
  };
}
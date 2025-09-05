/**
 * Performance monitoring utility for the invoice generator
 * Tracks response times, database queries, memory usage, and provides optimization insights
 */

import { logErrorWithMonitoring } from './errorHandler.js';

/**
 * Performance metrics collector
 */
class PerformanceMonitor {
  constructor() {
    this.metrics = {
      requests: [],
      dbQueries: [],
      memoryUsage: [],
      errors: []
    };
    this.maxMetrics = 1000; // Keep last 1000 entries per type
    this.startTime = Date.now();
  }

  /**
   * Start timing a request
   */
  startRequest(requestId, method, url) {
    const startTime = process.hrtime.bigint();
    return {
      requestId,
      method,
      url,
      startTime,
      startTimestamp: new Date().toISOString()
    };
  }

  /**
   * End timing a request and record metrics
   */
  endRequest(requestData, statusCode, responseSize = 0) {
    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - requestData.startTime) / 1000000; // Convert to milliseconds

    const metric = {
      ...requestData,
      endTime,
      endTimestamp: new Date().toISOString(),
      duration,
      statusCode,
      responseSize,
      memoryUsage: this.getCurrentMemoryUsage()
    };

    this.metrics.requests.push(metric);
    this.maintainMetricsSize('requests');

    // Log slow requests
    if (duration > 1000) { // Slower than 1 second
      console.warn(`🐌 Slow request detected: ${requestData.method} ${requestData.url} took ${duration.toFixed(2)}ms`);
    }

    return metric;
  }

  /**
   * Record database query performance
   */
  recordDbQuery(operation, table, duration, recordCount = 0) {
    const metric = {
      timestamp: new Date().toISOString(),
      operation,
      table,
      duration,
      recordCount,
      memoryUsage: this.getCurrentMemoryUsage()
    };

    this.metrics.dbQueries.push(metric);
    this.maintainMetricsSize('dbQueries');

    // Log slow queries
    if (duration > 500) { // Slower than 500ms
      console.warn(`🐌 Slow database query: ${operation} on ${table} took ${duration.toFixed(2)}ms`);
    }

    return metric;
  }

  /**
   * Record error metrics
   */
  recordError(error, context = {}) {
    const metric = {
      timestamp: new Date().toISOString(),
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      context,
      memoryUsage: this.getCurrentMemoryUsage()
    };

    this.metrics.errors.push(metric);
    this.maintainMetricsSize('errors');

    return metric;
  }

  /**
   * Get current memory usage
   */
  getCurrentMemoryUsage() {
    const usage = process.memoryUsage();
    return {
      rss: Math.round(usage.rss / 1024 / 1024), // MB
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024), // MB
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024), // MB
      external: Math.round(usage.external / 1024 / 1024) // MB
    };
  }

  /**
   * Record memory usage snapshot
   */
  recordMemoryUsage() {
    const usage = this.getCurrentMemoryUsage();
    const metric = {
      timestamp: new Date().toISOString(),
      ...usage
    };

    this.metrics.memoryUsage.push(metric);
    this.maintainMetricsSize('memoryUsage');

    // Alert on high memory usage
    if (usage.heapUsed > 512) { // More than 512MB
      console.warn(`⚠️ High memory usage detected: ${usage.heapUsed}MB heap used`);
    }

    return metric;
  }

  /**
   * Maintain metrics array size
   */
  maintainMetricsSize(type) {
    if (this.metrics[type].length > this.maxMetrics) {
      this.metrics[type] = this.metrics[type].slice(-this.maxMetrics);
    }
  }

  /**
   * Get performance statistics
   */
  getStats(timeWindow = 3600000) { // Default 1 hour
    const now = Date.now();
    const cutoff = new Date(now - timeWindow).toISOString();

    // Filter recent metrics
    const recentRequests = this.metrics.requests.filter(r => r.startTimestamp > cutoff);
    const recentDbQueries = this.metrics.dbQueries.filter(q => q.timestamp > cutoff);
    const recentErrors = this.metrics.errors.filter(e => e.timestamp > cutoff);

    // Calculate request statistics
    const requestStats = this.calculateRequestStats(recentRequests);
    const dbStats = this.calculateDbStats(recentDbQueries);
    const errorStats = this.calculateErrorStats(recentErrors);
    const memoryStats = this.calculateMemoryStats();

    return {
      timeWindow: timeWindow / 1000 / 60, // minutes
      uptime: (now - this.startTime) / 1000 / 60, // minutes
      requests: requestStats,
      database: dbStats,
      errors: errorStats,
      memory: memoryStats,
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * Calculate request statistics
   */
  calculateRequestStats(requests) {
    if (requests.length === 0) {
      return { count: 0, avgDuration: 0, minDuration: 0, maxDuration: 0 };
    }

    const durations = requests.map(r => r.duration);
    const statusCodes = {};
    const methods = {};
    const slowRequests = requests.filter(r => r.duration > 1000);

    requests.forEach(r => {
      statusCodes[r.statusCode] = (statusCodes[r.statusCode] || 0) + 1;
      methods[r.method] = (methods[r.method] || 0) + 1;
    });

    return {
      count: requests.length,
      avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
      minDuration: Math.min(...durations),
      maxDuration: Math.max(...durations),
      p95Duration: this.calculatePercentile(durations, 95),
      p99Duration: this.calculatePercentile(durations, 99),
      statusCodes,
      methods,
      slowRequestsCount: slowRequests.length,
      requestsPerMinute: requests.length / (Date.now() - this.startTime) * 60000
    };
  }

  /**
   * Calculate database statistics
   */
  calculateDbStats(queries) {
    if (queries.length === 0) {
      return { count: 0, avgDuration: 0, minDuration: 0, maxDuration: 0 };
    }

    const durations = queries.map(q => q.duration);
    const operations = {};
    const tables = {};
    const slowQueries = queries.filter(q => q.duration > 500);

    queries.forEach(q => {
      operations[q.operation] = (operations[q.operation] || 0) + 1;
      tables[q.table] = (tables[q.table] || 0) + 1;
    });

    return {
      count: queries.length,
      avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
      minDuration: Math.min(...durations),
      maxDuration: Math.max(...durations),
      p95Duration: this.calculatePercentile(durations, 95),
      operations,
      tables,
      slowQueriesCount: slowQueries.length
    };
  }

  /**
   * Calculate error statistics
   */
  calculateErrorStats(errors) {
    const errorTypes = {};
    const errorMessages = {};

    errors.forEach(e => {
      errorTypes[e.error.name] = (errorTypes[e.error.name] || 0) + 1;
      errorMessages[e.error.message] = (errorMessages[e.error.message] || 0) + 1;
    });

    return {
      count: errors.length,
      errorTypes,
      topErrors: Object.entries(errorMessages)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([message, count]) => ({ message, count }))
    };
  }

  /**
   * Calculate memory statistics
   */
  calculateMemoryStats() {
    const current = this.getCurrentMemoryUsage();
    const recent = this.metrics.memoryUsage.slice(-100); // Last 100 measurements

    if (recent.length === 0) {
      return { current };
    }

    const heapUsedValues = recent.map(m => m.heapUsed);
    const rssValues = recent.map(m => m.rss);

    return {
      current,
      trends: {
        avgHeapUsed: heapUsedValues.reduce((a, b) => a + b, 0) / heapUsedValues.length,
        maxHeapUsed: Math.max(...heapUsedValues),
        avgRss: rssValues.reduce((a, b) => a + b, 0) / rssValues.length,
        maxRss: Math.max(...rssValues)
      }
    };
  }

  /**
   * Calculate percentile
   */
  calculatePercentile(values, percentile) {
    const sorted = values.sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index] || 0;
  }

  /**
   * Get performance insights and recommendations
   */
  getInsights() {
    const stats = this.getStats();
    const insights = [];
    const recommendations = [];

    // Request performance insights
    if (stats.requests.avgDuration > 500) {
      insights.push('Average request duration is high');
      recommendations.push('Consider optimizing slow endpoints and database queries');
    }

    if (stats.requests.slowRequestsCount > stats.requests.count * 0.1) {
      insights.push('High percentage of slow requests');
      recommendations.push('Implement caching and optimize critical paths');
    }

    // Database insights
    if (stats.database.avgDuration > 200) {
      insights.push('Database queries are slow');
      recommendations.push('Add database indexes and optimize queries');
    }

    if (stats.database.slowQueriesCount > 0) {
      insights.push('Slow database queries detected');
      recommendations.push('Review and optimize slow queries, consider query caching');
    }

    // Memory insights
    if (stats.memory.current.heapUsed > 256) {
      insights.push('High memory usage detected');
      recommendations.push('Monitor for memory leaks and optimize data structures');
    }

    // Error insights
    if (stats.errors.count > stats.requests.count * 0.05) {
      insights.push('High error rate detected');
      recommendations.push('Investigate and fix recurring errors');
    }

    return {
      insights,
      recommendations,
      stats,
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * Clear all metrics
   */
  clearMetrics() {
    this.metrics = {
      requests: [],
      dbQueries: [],
      memoryUsage: [],
      errors: []
    };
    this.startTime = Date.now();
  }

  /**
   * Export metrics for analysis
   */
  exportMetrics() {
    return {
      ...this.metrics,
      exportedAt: new Date().toISOString(),
      uptime: Date.now() - this.startTime
    };
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * Middleware to automatically track request performance
 */
export function performanceMiddleware(request) {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const method = request.method || 'UNKNOWN';
  const url = request.url || 'unknown';
  
  const requestData = performanceMonitor.startRequest(requestId, method, url);
  
  return {
    requestData,
    end: (statusCode, responseSize) => {
      return performanceMonitor.endRequest(requestData, statusCode, responseSize);
    }
  };
}

/**
 * Database query performance wrapper
 */
export function trackDbQuery(operation, table) {
  const startTime = process.hrtime.bigint();
  
  return {
    end: (recordCount = 0) => {
      const endTime = process.hrtime.bigint();
      const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds
      return performanceMonitor.recordDbQuery(operation, table, duration, recordCount);
    }
  };
}

/**
 * Memory monitoring with automatic cleanup
 */
export function startMemoryMonitoring(intervalMs = 60000) { // Default 1 minute
  const interval = setInterval(() => {
    performanceMonitor.recordMemoryUsage();
  }, intervalMs);

  // Return cleanup function
  return () => clearInterval(interval);
}

/**
 * Performance health check
 */
export function performanceHealthCheck() {
  const insights = performanceMonitor.getInsights();
  const issues = [];
  
  // Check for performance issues
  if (insights.stats.requests.avgDuration > 1000) {
    issues.push('High average response time');
  }
  
  if (insights.stats.database.avgDuration > 500) {
    issues.push('Slow database performance');
  }
  
  if (insights.stats.memory.current.heapUsed > 512) {
    issues.push('High memory usage');
  }
  
  if (insights.stats.errors.count > 10) {
    issues.push('High error rate');
  }

  return {
    status: issues.length === 0 ? 'healthy' : 'performance_issues',
    issues,
    insights: insights.insights,
    recommendations: insights.recommendations,
    stats: insights.stats,
    checkedAt: new Date().toISOString()
  };
}

/**
 * Generate performance report
 */
export function generatePerformanceReport(timeWindow) {
  const stats = performanceMonitor.getStats(timeWindow);
  const insights = performanceMonitor.getInsights();
  
  return {
    summary: {
      uptime: stats.uptime,
      totalRequests: stats.requests.count,
      avgResponseTime: stats.requests.avgDuration,
      errorRate: stats.errors.count / stats.requests.count * 100,
      memoryUsage: stats.memory.current.heapUsed
    },
    performance: stats,
    insights: insights.insights,
    recommendations: insights.recommendations,
    generatedAt: new Date().toISOString()
  };
}
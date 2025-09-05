/**
 * Health check endpoint for monitoring application status
 * Provides comprehensive health information including database, performance, and security status
 */

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { performanceHealthCheck, performanceMonitor } from '../../../lib/performanceMonitor.js';
import { performSecurityHealthCheck, generateSecurityReport } from '../../../lib/securityAudit.js';
import { rateLimiter } from '../../../lib/rateLimiter.js';

const prisma = new PrismaClient();

/**
 * Basic health check endpoint
 */
export async function GET(request) {
  // Apply rate limiting for health checks
  const rateLimitResult = await rateLimiter(request, 'health');
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429 }
    );
  }

  const startTime = Date.now();
  const healthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    checks: {}
  };

  let overallHealthy = true;

  try {
    // Database health check
    const dbStartTime = Date.now();
    try {
      await prisma.$queryRaw`SELECT 1`;
      const dbResponseTime = Date.now() - dbStartTime;
      
      healthStatus.checks.database = {
        status: 'healthy',
        responseTime: dbResponseTime,
        message: 'Database connection successful'
      };
    } catch (dbError) {
      overallHealthy = false;
      healthStatus.checks.database = {
        status: 'unhealthy',
        error: dbError.message,
        message: 'Database connection failed'
      };
    }

    // Memory health check
    const memoryUsage = process.memoryUsage();
    const memoryUsageMB = {
      rss: Math.round(memoryUsage.rss / 1024 / 1024),
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      external: Math.round(memoryUsage.external / 1024 / 1024)
    };

    const memoryHealthy = memoryUsageMB.heapUsed < 512; // Less than 512MB
    if (!memoryHealthy) overallHealthy = false;

    healthStatus.checks.memory = {
      status: memoryHealthy ? 'healthy' : 'warning',
      usage: memoryUsageMB,
      message: memoryHealthy ? 'Memory usage normal' : 'High memory usage detected'
    };

    // Performance health check
    try {
      const perfHealth = performanceHealthCheck();
      healthStatus.checks.performance = {
        status: perfHealth.status === 'healthy' ? 'healthy' : 'warning',
        issues: perfHealth.issues,
        recommendations: perfHealth.recommendations,
        stats: {
          avgResponseTime: perfHealth.stats.requests.avgDuration,
          totalRequests: perfHealth.stats.requests.count,
          errorRate: perfHealth.stats.errors.count / Math.max(perfHealth.stats.requests.count, 1) * 100
        }
      };
      
      if (perfHealth.status !== 'healthy') {
        overallHealthy = false;
      }
    } catch (perfError) {
      healthStatus.checks.performance = {
        status: 'unknown',
        error: perfError.message,
        message: 'Performance monitoring unavailable'
      };
    }

    // Security health check
    try {
      const securityHealth = performSecurityHealthCheck();
      healthStatus.checks.security = {
        status: securityHealth.status === 'healthy' ? 'healthy' : 'warning',
        issues: securityHealth.issues,
        recommendations: securityHealth.recommendations,
        summary: securityHealth.report.summary
      };
      
      if (securityHealth.status !== 'healthy') {
        overallHealthy = false;
      }
    } catch (secError) {
      healthStatus.checks.security = {
        status: 'unknown',
        error: secError.message,
        message: 'Security monitoring unavailable'
      };
    }

    // Disk space check (if available)
    try {
      const fs = require('fs');
      const stats = fs.statSync('.');
      healthStatus.checks.disk = {
        status: 'healthy',
        message: 'Disk access available'
      };
    } catch (diskError) {
      healthStatus.checks.disk = {
        status: 'warning',
        error: diskError.message,
        message: 'Disk access issues detected'
      };
    }

    // Set overall status
    healthStatus.status = overallHealthy ? 'healthy' : 'degraded';
    healthStatus.responseTime = Date.now() - startTime;

    // Return appropriate status code
    const statusCode = overallHealthy ? 200 : 503;
    return NextResponse.json(healthStatus, { status: statusCode });

  } catch (error) {
    console.error('Health check error:', error);
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
      responseTime: Date.now() - startTime
    }, { status: 503 });
  }
}

/**
 * Detailed health check with extended metrics
 */
export async function POST(request) {
  // Apply rate limiting
  const rateLimitResult = await rateLimiter(request, 'health');
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429 }
    );
  }

  try {
    const { detailed = false, includeMetrics = false } = await request.json().catch(() => ({}));
    
    const startTime = Date.now();
    const healthReport = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      checks: {},
      metrics: {}
    };

    let overallHealthy = true;

    // Extended database health check
    try {
      const dbStartTime = Date.now();
      
      // Test basic connection
      await prisma.$queryRaw`SELECT 1`;
      
      // Test table access
      const userCount = await prisma.user.count();
      const clientCount = await prisma.client.count();
      const invoiceCount = await prisma.invoice.count();
      
      const dbResponseTime = Date.now() - dbStartTime;
      
      healthReport.checks.database = {
        status: 'healthy',
        responseTime: dbResponseTime,
        tables: {
          users: userCount,
          clients: clientCount,
          invoices: invoiceCount
        },
        message: 'Database fully operational'
      };
    } catch (dbError) {
      overallHealthy = false;
      healthReport.checks.database = {
        status: 'unhealthy',
        error: dbError.message,
        message: 'Database issues detected'
      };
    }

    // Include performance metrics if requested
    if (includeMetrics) {
      try {
        const perfStats = performanceMonitor.getStats();
        healthReport.metrics.performance = perfStats;
      } catch (perfError) {
        healthReport.metrics.performance = {
          error: perfError.message,
          message: 'Performance metrics unavailable'
        };
      }
    }

    // Include security metrics if requested
    if (includeMetrics) {
      try {
        const securityReport = generateSecurityReport();
        healthReport.metrics.security = securityReport;
      } catch (secError) {
        healthReport.metrics.security = {
          error: secError.message,
          message: 'Security metrics unavailable'
        };
      }
    }

    // System resource checks
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    healthReport.checks.system = {
      status: 'healthy',
      memory: {
        rss: Math.round(memoryUsage.rss / 1024 / 1024),
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        external: Math.round(memoryUsage.external / 1024 / 1024)
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system
      },
      uptime: process.uptime()
    };

    // Environment checks
    healthReport.checks.environment = {
      status: 'healthy',
      nodeEnv: process.env.NODE_ENV,
      hasClerkKeys: !!(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY),
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      message: 'Environment configuration valid'
    };

    // Set overall status
    healthReport.status = overallHealthy ? 'healthy' : 'degraded';
    healthReport.responseTime = Date.now() - startTime;

    const statusCode = overallHealthy ? 200 : 503;
    return NextResponse.json(healthReport, { status: statusCode });

  } catch (error) {
    console.error('Detailed health check error:', error);
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
      message: 'Health check failed'
    }, { status: 503 });
  }
}
/**
 * Database optimization utility for the invoice generator
 * Provides query optimization, indexing recommendations, and connection pooling
 */

import { PrismaClient } from '@prisma/client';
import { logErrorWithMonitoring, AppError, ErrorTypes } from './errorHandler.js';
import { trackDbQuery } from './performanceMonitor.js';

/**
 * Enhanced Prisma client with optimization features
 */
class OptimizedPrismaClient {
  constructor() {
    this.prisma = new PrismaClient({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'warn' },
      ],
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });

    this.queryCache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    this.slowQueryThreshold = 1000; // 1 second
    this.queryStats = new Map();

    this.setupEventListeners();
    this.setupConnectionPooling();
  }

  /**
   * Setup Prisma event listeners for monitoring
   */
  setupEventListeners() {
    // Log slow queries
    this.prisma.$on('query', (e) => {
      if (e.duration > this.slowQueryThreshold) {
        console.warn(`🐌 Slow query detected (${e.duration}ms):`, {
          query: e.query,
          params: e.params,
          duration: e.duration
        });
      }

      // Track query statistics
      const queryType = this.extractQueryType(e.query);
      const stats = this.queryStats.get(queryType) || {
        count: 0,
        totalDuration: 0,
        avgDuration: 0,
        maxDuration: 0,
        minDuration: Infinity
      };

      stats.count++;
      stats.totalDuration += e.duration;
      stats.avgDuration = stats.totalDuration / stats.count;
      stats.maxDuration = Math.max(stats.maxDuration, e.duration);
      stats.minDuration = Math.min(stats.minDuration, e.duration);

      this.queryStats.set(queryType, stats);
    });

    // Log database errors
    this.prisma.$on('error', (e) => {
      logErrorWithMonitoring(new Error(e.message), {
        context: 'Database Error',
        target: e.target
      });
    });

    // Log warnings
    this.prisma.$on('warn', (e) => {
      console.warn('Database warning:', e.message);
    });
  }

  /**
   * Setup connection pooling optimization
   */
  setupConnectionPooling() {
    // Connection pool settings are handled by Prisma's datasource configuration
    // This method can be extended for custom pooling logic if needed
    console.log('Database connection pooling initialized');
  }

  /**
   * Extract query type from SQL query
   */
  extractQueryType(query) {
    const queryUpper = query.toUpperCase().trim();
    if (queryUpper.startsWith('SELECT')) return 'SELECT';
    if (queryUpper.startsWith('INSERT')) return 'INSERT';
    if (queryUpper.startsWith('UPDATE')) return 'UPDATE';
    if (queryUpper.startsWith('DELETE')) return 'DELETE';
    if (queryUpper.startsWith('CREATE')) return 'CREATE';
    if (queryUpper.startsWith('ALTER')) return 'ALTER';
    if (queryUpper.startsWith('DROP')) return 'DROP';
    return 'OTHER';
  }

  /**
   * Execute query with caching
   */
  async cachedQuery(cacheKey, queryFn, ttl = this.cacheTimeout) {
    // Check cache first
    const cached = this.queryCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < ttl) {
      return cached.data;
    }

    // Execute query
    const result = await queryFn();

    // Cache result
    this.queryCache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    });

    // Clean old cache entries
    this.cleanCache();

    return result;
  }

  /**
   * Clean expired cache entries
   */
  cleanCache() {
    const now = Date.now();
    for (const [key, value] of this.queryCache.entries()) {
      if (now - value.timestamp > this.cacheTimeout) {
        this.queryCache.delete(key);
      }
    }
  }

  /**
   * Get query statistics
   */
  getQueryStats() {
    return Object.fromEntries(this.queryStats);
  }

  /**
   * Clear query statistics
   */
  clearQueryStats() {
    this.queryStats.clear();
  }

  /**
   * Clear query cache
   */
  clearCache() {
    this.queryCache.clear();
  }

  /**
   * Get the underlying Prisma client
   */
  getClient() {
    return this.prisma;
  }

  /**
   * Disconnect from database
   */
  async disconnect() {
    await this.prisma.$disconnect();
  }
}

// Global optimized Prisma instance
export const optimizedPrisma = new OptimizedPrismaClient();

/**
 * Database optimization recommendations
 */
export const dbOptimizationRecommendations = {
  indexes: [
    {
      table: 'Invoice',
      columns: ['userId', 'createdAt'],
      reason: 'Optimize user invoice queries with date sorting',
      sql: 'CREATE INDEX idx_invoice_user_created ON "Invoice" ("userId", "createdAt" DESC);'
    },
    {
      table: 'Invoice',
      columns: ['clientId', 'status'],
      reason: 'Optimize client invoice filtering by status',
      sql: 'CREATE INDEX idx_invoice_client_status ON "Invoice" ("clientId", "status");'
    },
    {
      table: 'Invoice',
      columns: ['invoiceNumber'],
      reason: 'Optimize invoice number searches',
      sql: 'CREATE INDEX idx_invoice_number ON "Invoice" ("invoiceNumber");'
    },
    {
      table: 'Client',
      columns: ['userId', 'name'],
      reason: 'Optimize user client queries with name sorting',
      sql: 'CREATE INDEX idx_client_user_name ON "Client" ("userId", "name");'
    },
    {
      table: 'Client',
      columns: ['email'],
      reason: 'Optimize client email lookups',
      sql: 'CREATE INDEX idx_client_email ON "Client" ("email");'
    },
    {
      table: 'Item',
      columns: ['clientId', 'name'],
      reason: 'Optimize client item queries',
      sql: 'CREATE INDEX idx_item_client_name ON "Item" ("clientId", "name");'
    },
    {
      table: 'InvoiceItem',
      columns: ['invoiceId'],
      reason: 'Optimize invoice item lookups',
      sql: 'CREATE INDEX idx_invoice_item_invoice ON "InvoiceItem" ("invoiceId");'
    }
  ],
  
  queries: [
    {
      name: 'User Invoice List',
      optimization: 'Use cursor-based pagination for large datasets',
      before: 'findMany with skip/take',
      after: 'findMany with cursor and take'
    },
    {
      name: 'Invoice Search',
      optimization: 'Use database full-text search instead of LIKE queries',
      before: 'WHERE invoiceNumber LIKE "%term%"',
      after: 'Use database-specific full-text search features'
    },
    {
      name: 'Client Statistics',
      optimization: 'Use aggregation queries instead of fetching all records',
      before: 'findMany + JavaScript aggregation',
      after: 'Use Prisma aggregation methods'
    }
  ]
};

/**
 * Optimized query builders
 */
export class OptimizedQueries {
  constructor(prisma) {
    this.prisma = prisma;
  }

  /**
   * Optimized invoice list query with caching
   */
  async getInvoiceList(userId, options = {}) {
    const {
      page = 1,
      limit = 10,
      clientId,
      status,
      searchTerm,
      searchDate,
      useCache = true
    } = options;

    const cacheKey = `invoices:${userId}:${JSON.stringify(options)}`;
    
    if (useCache) {
      return optimizedPrisma.cachedQuery(cacheKey, async () => {
        return this.executeInvoiceListQuery(userId, options);
      });
    }

    return this.executeInvoiceListQuery(userId, options);
  }

  /**
   * Execute optimized invoice list query
   */
  async executeInvoiceListQuery(userId, options) {
    const {
      page = 1,
      limit = 10,
      clientId,
      status,
      searchTerm,
      searchDate
    } = options;

    const tracker = trackDbQuery('OPTIMIZED_INVOICE_LIST', 'Invoice');

    try {
      // Build where clause
      const where = {
        userId,
        ...(clientId && { clientId }),
        ...(status && { status }),
        ...(searchTerm && {
          OR: [
            { invoiceNumber: { contains: searchTerm, mode: 'insensitive' } },
            { client: { name: { contains: searchTerm, mode: 'insensitive' } } }
          ]
        }),
        ...(searchDate && {
          OR: [
            { invoiceDate: { gte: new Date(searchDate), lt: new Date(new Date(searchDate).getTime() + 24 * 60 * 60 * 1000) } },
            { issueDate: { gte: new Date(searchDate), lt: new Date(new Date(searchDate).getTime() + 24 * 60 * 60 * 1000) } }
          ]
        })
      };

      // Use transaction for consistency
      const [totalCount, invoices] = await this.prisma.$transaction([
        this.prisma.invoice.count({ where }),
        this.prisma.invoice.findMany({
          where,
          include: {
            client: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            items: {
              select: {
                id: true,
                name: true,
                price: true,
                quantity: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          skip: (page - 1) * limit,
          take: limit
        })
      ]);

      tracker.end(invoices.length);

      return {
        invoices,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit)
        }
      };
    } catch (error) {
      tracker.end(0);
      throw error;
    }
  }

  /**
   * Optimized client list with invoice counts
   */
  async getClientListWithStats(userId, options = {}) {
    const { page = 1, limit = 10, useCache = true } = options;
    const cacheKey = `clients_stats:${userId}:${page}:${limit}`;

    if (useCache) {
      return optimizedPrisma.cachedQuery(cacheKey, async () => {
        return this.executeClientStatsQuery(userId, options);
      });
    }

    return this.executeClientStatsQuery(userId, options);
  }

  /**
   * Execute optimized client stats query
   */
  async executeClientStatsQuery(userId, options) {
    const { page = 1, limit = 10 } = options;
    const tracker = trackDbQuery('CLIENT_STATS', 'Client');

    try {
      const clients = await this.prisma.client.findMany({
        where: { userId },
        include: {
          _count: {
            select: {
              invoices: true,
              items: true
            }
          },
          invoices: {
            select: {
              total: true,
              status: true
            }
          }
        },
        orderBy: {
          name: 'asc'
        },
        skip: (page - 1) * limit,
        take: limit
      });

      // Calculate client statistics
      const clientsWithStats = clients.map(client => {
        const totalRevenue = client.invoices.reduce((sum, invoice) => sum + (invoice.total || 0), 0);
        const paidInvoices = client.invoices.filter(inv => inv.status === 'PAID').length;
        const pendingInvoices = client.invoices.filter(inv => inv.status === 'PENDING').length;

        return {
          ...client,
          stats: {
            totalInvoices: client._count.invoices,
            totalItems: client._count.items,
            totalRevenue,
            paidInvoices,
            pendingInvoices
          },
          invoices: undefined, // Remove detailed invoices from response
          _count: undefined // Remove count object
        };
      });

      tracker.end(clients.length);

      return clientsWithStats;
    } catch (error) {
      tracker.end(0);
      throw error;
    }
  }

  /**
   * Optimized dashboard statistics
   */
  async getDashboardStats(userId, useCache = true) {
    const cacheKey = `dashboard_stats:${userId}`;
    
    if (useCache) {
      return optimizedPrisma.cachedQuery(cacheKey, async () => {
        return this.executeDashboardStatsQuery(userId);
      }, 2 * 60 * 1000); // 2 minutes cache
    }

    return this.executeDashboardStatsQuery(userId);
  }

  /**
   * Execute dashboard stats query
   */
  async executeDashboardStatsQuery(userId) {
    const tracker = trackDbQuery('DASHBOARD_STATS', 'Multiple');

    try {
      const [clientCount, invoiceStats, recentInvoices] = await this.prisma.$transaction([
        // Client count
        this.prisma.client.count({
          where: { userId }
        }),
        
        // Invoice statistics
        this.prisma.invoice.groupBy({
          by: ['status'],
          where: { userId },
          _count: {
            id: true
          },
          _sum: {
            total: true
          }
        }),
        
        // Recent invoices
        this.prisma.invoice.findMany({
          where: { userId },
          include: {
            client: {
              select: {
                name: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 5
        })
      ]);

      // Process invoice statistics
      const stats = {
        totalClients: clientCount,
        totalInvoices: 0,
        totalRevenue: 0,
        paidInvoices: 0,
        pendingInvoices: 0,
        overdueInvoices: 0
      };

      invoiceStats.forEach(stat => {
        stats.totalInvoices += stat._count.id;
        stats.totalRevenue += stat._sum.total || 0;
        
        switch (stat.status) {
          case 'PAID':
            stats.paidInvoices = stat._count.id;
            break;
          case 'PENDING':
            stats.pendingInvoices = stat._count.id;
            break;
          case 'OVERDUE':
            stats.overdueInvoices = stat._count.id;
            break;
        }
      });

      tracker.end();

      return {
        stats,
        recentInvoices
      };
    } catch (error) {
      tracker.end(0);
      throw error;
    }
  }
}

// Global optimized queries instance
export const optimizedQueries = new OptimizedQueries(optimizedPrisma.getClient());

/**
 * Database health check
 */
export async function checkDatabaseHealth() {
  const startTime = Date.now();
  const health = {
    status: 'healthy',
    responseTime: 0,
    connections: 'unknown',
    queryStats: optimizedPrisma.getQueryStats(),
    cacheStats: {
      size: optimizedPrisma.queryCache.size,
      hitRate: 'unknown' // Would need to track hits/misses
    }
  };

  try {
    // Test basic connectivity
    await optimizedPrisma.getClient().$queryRaw`SELECT 1`;
    
    // Test table access
    await optimizedPrisma.getClient().user.findFirst();
    
    health.responseTime = Date.now() - startTime;
    
    if (health.responseTime > 1000) {
      health.status = 'slow';
    }
  } catch (error) {
    health.status = 'unhealthy';
    health.error = error.message;
    health.responseTime = Date.now() - startTime;
  }

  return health;
}

/**
 * Apply database optimizations
 */
export async function applyDatabaseOptimizations() {
  const results = [];
  
  try {
    // Note: In a real implementation, you would execute these SQL commands
    // through a migration system or database admin tool
    console.log('Database optimization recommendations:');
    
    dbOptimizationRecommendations.indexes.forEach((index, i) => {
      console.log(`${i + 1}. ${index.reason}`);
      console.log(`   SQL: ${index.sql}`);
      results.push({
        type: 'index',
        table: index.table,
        columns: index.columns,
        status: 'recommended',
        sql: index.sql
      });
    });
    
    return {
      success: true,
      recommendations: results,
      message: 'Optimization recommendations generated. Apply manually through migrations.'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      message: 'Failed to generate optimization recommendations'
    };
  }
}
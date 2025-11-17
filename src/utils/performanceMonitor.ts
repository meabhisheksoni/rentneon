/**
 * Performance monitoring utility for tracking database query execution times
 * Logs slow queries (>500ms) to console and provides metrics for debugging
 */

export interface QueryMetrics {
  queryName: string
  executionTime: number
  parameters?: Record<string, unknown>
  timestamp: number
  isSlow: boolean
}

export interface CacheMetrics {
  hits: number
  misses: number
  hitRate: number
}

class PerformanceMonitor {
  private queryLogs: QueryMetrics[] = []
  private cacheHits = 0
  private cacheMisses = 0
  private readonly SLOW_QUERY_THRESHOLD = 500 // ms
  private readonly MAX_LOG_SIZE = 100 // Keep last 100 queries

  /**
   * Track a database query execution time
   * Logs to console if query is slow (>500ms)
   */
  logQuery(
    queryName: string,
    executionTime: number,
    parameters?: Record<string, unknown>
  ): void {
    const isSlow = executionTime > this.SLOW_QUERY_THRESHOLD

    const metrics: QueryMetrics = {
      queryName,
      executionTime,
      parameters,
      timestamp: Date.now(),
      isSlow
    }

    // Add to log history
    this.queryLogs.push(metrics)

    // Keep log size manageable
    if (this.queryLogs.length > this.MAX_LOG_SIZE) {
      this.queryLogs.shift()
    }

    // Log slow queries to console
    if (isSlow) {
      console.warn(
        `🐌 Slow query detected: ${queryName} took ${executionTime}ms`,
        parameters ? { parameters } : ''
      )
    } else if (process.env.NODE_ENV === 'development') {
      console.log(
        `⚡ Query: ${queryName} completed in ${executionTime}ms`,
        parameters ? { parameters } : ''
      )
    }
  }

  /**
   * Record a cache hit
   */
  recordCacheHit(): void {
    this.cacheHits++
  }

  /**
   * Record a cache miss
   */
  recordCacheMiss(): void {
    this.cacheMisses++
  }

  /**
   * Get cache statistics
   */
  getCacheMetrics(): CacheMetrics {
    const total = this.cacheHits + this.cacheMisses
    const hitRate = total > 0 ? (this.cacheHits / total) * 100 : 0

    return {
      hits: this.cacheHits,
      misses: this.cacheMisses,
      hitRate: Math.round(hitRate * 100) / 100 // Round to 2 decimal places
    }
  }

  /**
   * Get all query logs
   */
  getQueryLogs(): QueryMetrics[] {
    return [...this.queryLogs]
  }

  /**
   * Get slow queries only
   */
  getSlowQueries(): QueryMetrics[] {
    return this.queryLogs.filter(log => log.isSlow)
  }

  /**
   * Get average query time for a specific query name
   */
  getAverageQueryTime(queryName: string): number {
    const queries = this.queryLogs.filter(log => log.queryName === queryName)
    if (queries.length === 0) return 0

    const total = queries.reduce((sum, log) => sum + log.executionTime, 0)
    return Math.round(total / queries.length)
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.queryLogs = []
    this.cacheHits = 0
    this.cacheMisses = 0
  }

  /**
   * Get summary statistics
   */
  getSummary(): {
    totalQueries: number
    slowQueries: number
    averageTime: number
    cacheMetrics: CacheMetrics
  } {
    const totalQueries = this.queryLogs.length
    const slowQueries = this.getSlowQueries().length
    const averageTime = totalQueries > 0
      ? Math.round(
          this.queryLogs.reduce((sum, log) => sum + log.executionTime, 0) / totalQueries
        )
      : 0

    return {
      totalQueries,
      slowQueries,
      averageTime,
      cacheMetrics: this.getCacheMetrics()
    }
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor()

/**
 * Utility function to wrap async functions with performance tracking
 */
export async function trackQueryPerformance<T>(
  queryName: string,
  queryFn: () => Promise<T>,
  parameters?: Record<string, unknown>
): Promise<T> {
  const startTime = performance.now()

  try {
    const result = await queryFn()
    const executionTime = Math.round(performance.now() - startTime)
    performanceMonitor.logQuery(queryName, executionTime, parameters)
    return result
  } catch (error) {
    const executionTime = Math.round(performance.now() - startTime)
    performanceMonitor.logQuery(queryName, executionTime, {
      ...parameters,
      error: error instanceof Error ? error.message : String(error)
    })
    throw error
  }
}

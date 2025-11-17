'use client'

import { useState, useEffect } from 'react'
import { performanceMonitor, QueryMetrics } from '@/utils/performanceMonitor'

/**
 * Performance overlay component for development mode
 * Displays query execution times and cache statistics
 * Only visible in development environment
 */
export default function PerformanceOverlay() {
  const [isVisible, setIsVisible] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [summary, setSummary] = useState({
    totalQueries: 0,
    slowQueries: 0,
    averageTime: 0,
    cacheMetrics: { hits: 0, misses: 0, hitRate: 0 }
  })
  const [recentQueries, setRecentQueries] = useState<QueryMetrics[]>([])

  // Only show in development mode
  const isDevelopment = process.env.NODE_ENV === 'development'

  // Keyboard shortcut to toggle visibility (Ctrl+Shift+P)
  useEffect(() => {
    if (!isDevelopment) return

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        setIsVisible(prev => !prev)
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [isDevelopment])

  useEffect(() => {
    if (!isDevelopment) return

    // Update metrics every 2 seconds
    const interval = setInterval(() => {
      setSummary(performanceMonitor.getSummary())
      setRecentQueries(performanceMonitor.getQueryLogs().slice(-5).reverse())
    }, 2000)

    return () => clearInterval(interval)
  }, [isDevelopment])

  if (!isDevelopment) return null

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-gray-800 text-white px-3 py-2 rounded-lg shadow-lg text-xs font-mono hover:bg-gray-700 transition-colors z-50"
        title="Show performance metrics (Ctrl+Shift+P)"
      >
        ⚡ Perf
      </button>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 bg-gray-900 text-white rounded-lg shadow-2xl z-50 font-mono text-xs max-w-md">
      {/* Header */}
      <div className="flex items-center justify-between bg-gray-800 px-3 py-2 rounded-t-lg">
        <div className="flex items-center gap-2">
          <span className="text-yellow-400">⚡</span>
          <span className="font-semibold">Performance Monitor</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="hover:text-gray-300 transition-colors"
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? '▼' : '▲'}
          </button>
          <button
            onClick={() => performanceMonitor.clear()}
            className="hover:text-gray-300 transition-colors"
            title="Clear metrics"
          >
            🗑️
          </button>
          <button
            onClick={async () => {
              const { PerformanceDiagnostic } = await import('@/utils/performanceDiagnostic')
              PerformanceDiagnostic.runDiagnostic()
            }}
            className="hover:text-gray-300 transition-colors"
            title="Run diagnostic"
          >
            🔍
          </button>
          <button
            onClick={() => setIsVisible(false)}
            className="hover:text-gray-300 transition-colors"
            title="Hide (Ctrl+Shift+P)"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="p-3 space-y-2 border-b border-gray-700">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <div className="text-gray-400">Total Queries</div>
            <div className="text-lg font-semibold">{summary.totalQueries}</div>
          </div>
          <div>
            <div className="text-gray-400">Slow Queries</div>
            <div className={`text-lg font-semibold ${summary.slowQueries > 0 ? 'text-red-400' : 'text-green-400'}`}>
              {summary.slowQueries}
            </div>
          </div>
          <div>
            <div className="text-gray-400">Avg Time</div>
            <div className="text-lg font-semibold">{summary.averageTime}ms</div>
          </div>
          <div>
            <div className="text-gray-400">Cache Hit Rate</div>
            <div className={`text-lg font-semibold ${summary.cacheMetrics.hitRate > 70 ? 'text-green-400' : 'text-yellow-400'}`}>
              {summary.cacheMetrics.hitRate}%
            </div>
          </div>
        </div>

        {/* Cache Details */}
        <div className="text-gray-400 text-[10px]">
          Cache: {summary.cacheMetrics.hits} hits / {summary.cacheMetrics.misses} misses
        </div>
      </div>

      {/* Recent Queries (Expanded View) */}
      {isExpanded && (
        <div className="p-3 space-y-2 max-h-64 overflow-y-auto">
          <div className="text-gray-400 font-semibold mb-2">Recent Queries</div>
          {recentQueries.length === 0 ? (
            <div className="text-gray-500 text-center py-4">No queries yet</div>
          ) : (
            recentQueries.map((query, index) => (
              <div
                key={`${query.queryName}-${query.timestamp}-${index}`}
                className={`p-2 rounded ${query.isSlow ? 'bg-red-900/30 border border-red-700' : 'bg-gray-800'}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold truncate flex-1">{query.queryName}</span>
                  <span className={`ml-2 ${query.isSlow ? 'text-red-400' : 'text-green-400'}`}>
                    {query.executionTime}ms
                  </span>
                </div>
                {query.parameters && Object.keys(query.parameters).length > 0 && (
                  <div className="text-gray-400 text-[10px] truncate">
                    {JSON.stringify(query.parameters)}
                  </div>
                )}
                <div className="text-gray-500 text-[10px]">
                  {new Date(query.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Footer */}
      <div className="px-3 py-2 bg-gray-800 rounded-b-lg text-[10px] text-gray-400 text-center">
        Press Ctrl+Shift+P to toggle
      </div>
    </div>
  )
}

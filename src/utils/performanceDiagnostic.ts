/**
 * Performance Diagnostic Utility
 * Helps identify performance bottlenecks and the 500ms getBillWithDetails issue
 */

export interface DiagnosticResult {
  issue: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  recommendation: string
  queryTime?: number
}

export interface DatabaseDiagnostic {
  timestamp: number
  results: DiagnosticResult[]
  summary: {
    totalIssues: number
    criticalIssues: number
    averageQueryTime: number
    recommendedActions: string[]
  }
}

export class PerformanceDiagnostic {
  /**
   * Test database connection speed
   */
  static async testDatabaseSpeed(): Promise<{
    connectionTime: number
    queryTime: number
    totalTime: number
    recommendation: string
  }> {
    const startTime = performance.now()
    
    try {
      // Simple connection test
      const connectionStart = performance.now()
      const { SupabaseService } = await import('@/services/supabaseService')
      const connectionTime = performance.now() - connectionStart
      
      // Simple query test
      const queryStart = performance.now()
      await SupabaseService.getActiveRenters()
      const queryTime = performance.now() - queryStart
      
      const totalTime = performance.now() - startTime
      
      let recommendation = ''
      if (totalTime > 1000) {
        recommendation = 'Very slow connection. Consider using a database region closer to your location.'
      } else if (totalTime > 500) {
        recommendation = 'Moderate latency detected. Database indexes and caching will help.'
      } else if (totalTime > 200) {
        recommendation = 'Good connection speed. Optimize queries and use caching for best performance.'
      } else {
        recommendation = 'Excellent connection speed!'
      }
      
      return {
        connectionTime: Math.round(connectionTime),
        queryTime: Math.round(queryTime),
        totalTime: Math.round(totalTime),
        recommendation
      }
    } catch (error) {
      return {
        connectionTime: 0,
        queryTime: 0,
        totalTime: performance.now() - startTime,
        recommendation: `Connection failed: ${error instanceof Error ? error.message : String(error)}`
      }
    }
  }

  /**
   * Test the specific getBillWithDetails performance issue
   */
  static async testBillQueryPerformance(): Promise<{
    rpcAvailable: boolean
    queryTime: number
    recommendation: string
    severity: 'low' | 'medium' | 'high' | 'critical'
  }> {
    try {
      const { supabase } = await import('@/lib/supabase')
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        return {
          rpcAvailable: false,
          queryTime: 0,
          recommendation: 'Cannot test - user not authenticated',
          severity: 'medium'
        }
      }

      // Test RPC function availability and performance
      const startTime = performance.now()
      
      try {
        await supabase.rpc('get_bill_with_details', {
          p_renter_id: 1,
          p_month: 11,
          p_year: 2025,
          p_user_id: user.id
        })
        
        const queryTime = performance.now() - startTime
        
        let recommendation = ''
        let severity: 'low' | 'medium' | 'high' | 'critical' = 'low'
        
        if (queryTime > 500) {
          recommendation = 'RPC function is slow - check database indexes'
          severity = 'high'
        } else if (queryTime > 200) {
          recommendation = 'RPC function performance is acceptable but could be better'
          severity = 'medium'
        } else {
          recommendation = 'RPC function performance is excellent'
          severity = 'low'
        }
        
        return {
          rpcAvailable: true,
          queryTime: Math.round(queryTime),
          recommendation,
          severity
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        
        if (errorMessage.includes('function get_bill_with_details') || errorMessage.includes('does not exist')) {
          return {
            rpcAvailable: false,
            queryTime: 0,
            recommendation: 'RPC function missing - this causes 500ms queries. Deploy simple-schema.sql immediately!',
            severity: 'critical'
          }
        } else {
          return {
            rpcAvailable: false,
            queryTime: 0,
            recommendation: `RPC function error: ${errorMessage}`,
            severity: 'high'
          }
        }
      }
    } catch (error) {
      return {
        rpcAvailable: false,
        queryTime: 0,
        recommendation: `Test failed: ${error}`,
        severity: 'high'
      }
    }
  }

  /**
   * Run comprehensive performance diagnostic
   */
  static async runComprehensiveDiagnostic(): Promise<DatabaseDiagnostic> {
    const results: DiagnosticResult[] = []
    const timestamp = Date.now()

    // Test basic database speed
    const dbSpeed = await this.testDatabaseSpeed()
    if (dbSpeed.totalTime > 500) {
      results.push({
        issue: 'Slow Database Connection',
        severity: dbSpeed.totalTime > 1000 ? 'critical' : 'high',
        description: `Database queries taking ${dbSpeed.totalTime}ms on average`,
        recommendation: dbSpeed.recommendation,
        queryTime: dbSpeed.totalTime
      })
    }

    // Test getBillWithDetails specifically
    const billTest = await this.testBillQueryPerformance()
    if (!billTest.rpcAvailable) {
      results.push({
        issue: 'Missing RPC Functions',
        severity: 'critical',
        description: 'getBillWithDetails RPC function not available - causing 500-600ms queries',
        recommendation: billTest.recommendation
      })
    } else if (billTest.queryTime > 200) {
      results.push({
        issue: 'Slow getBillWithDetails Query',
        severity: billTest.severity,
        description: `getBillWithDetails taking ${billTest.queryTime}ms`,
        recommendation: billTest.recommendation,
        queryTime: billTest.queryTime
      })
    }

    // Check performance monitor data
    try {
      const { performanceMonitor } = await import('@/utils/performanceMonitor')
      const slowQueries = performanceMonitor.getSlowQueries()
      const billQueries = slowQueries.filter(q => q.queryName === 'getBillWithDetails')

      if (billQueries.length > 0) {
        const avgTime = billQueries.reduce((sum, q) => sum + q.executionTime, 0) / billQueries.length
        
        if (avgTime > 400) {
          results.push({
            issue: 'Consistently Slow Bill Queries',
            severity: avgTime > 600 ? 'critical' : 'high',
            description: `${billQueries.length} slow getBillWithDetails queries averaging ${Math.round(avgTime)}ms`,
            recommendation: 'Deploy database optimizations immediately',
            queryTime: avgTime
          })
        }
      }
    } catch (error) {
      // Performance monitor not available
    }

    // Generate summary
    const criticalIssues = results.filter(r => r.severity === 'critical').length
    const totalIssues = results.length
    
    const queryTimes = results
      .filter(r => r.queryTime !== undefined)
      .map(r => r.queryTime!)
    
    const averageQueryTime = queryTimes.length > 0
      ? queryTimes.reduce((sum, time) => sum + time, 0) / queryTimes.length
      : 0

    const recommendedActions: string[] = []
    
    if (results.some(r => r.issue === 'Missing RPC Functions')) {
      recommendedActions.push('🚨 URGENT: Deploy simple-schema.sql to fix 500ms query issue')
    }
    
    if (results.some(r => r.issue.includes('Slow') && r.queryTime! > 400)) {
      recommendedActions.push('⚡ Apply database indexes to improve query performance')
    }
    
    if (criticalIssues === 0 && averageQueryTime < 200) {
      recommendedActions.push('✅ Performance looks good')
    }

    return {
      timestamp,
      results,
      summary: {
        totalIssues,
        criticalIssues,
        averageQueryTime: Math.round(averageQueryTime),
        recommendedActions
      }
    }
  }
  
  /**
   * Run performance diagnostic and log results
   */
  static async runDiagnostic(): Promise<DatabaseDiagnostic> {
    console.log('🔍 Running Performance Diagnostic...')
    
    const diagnostic = await this.runComprehensiveDiagnostic()
    
    console.log('📊 Performance Diagnostic Results:')
    console.log(`   Total Issues: ${diagnostic.summary.totalIssues}`)
    console.log(`   Critical Issues: ${diagnostic.summary.criticalIssues}`)
    console.log(`   Average Query Time: ${diagnostic.summary.averageQueryTime}ms`)
    
    diagnostic.results.forEach(result => {
      const icon = result.severity === 'critical' ? '🚨' : 
                   result.severity === 'high' ? '⚠️' : 
                   result.severity === 'medium' ? '💡' : '✅'
      console.log(`   ${icon} ${result.issue}: ${result.description}`)
      console.log(`      → ${result.recommendation}`)
    })
    
    console.log('💡 Recommended Actions:')
    diagnostic.summary.recommendedActions.forEach(action => {
      console.log(`   ${action}`)
    })
    
    return diagnostic
  }

  /**
   * Quick fix instructions for the 500ms issue
   */
  static getQuickFixInstructions(): string[] {
    return [
      '🚀 Quick Fix for 500ms getBillWithDetails Issue:',
      '',
      '1. Copy the content from simple-schema.sql file',
      '2. Go to Supabase Dashboard → SQL Editor',
      '3. Paste and run the SQL script',
      '4. Refresh your app',
      '5. Check console - should see "✅ RPC functions are available"',
      '6. Query time should drop from 500ms to <100ms',
      '',
      'If you need help, check the TESTING_GUIDE.md file'
    ]
  }
}

// Export for console use
if (typeof window !== 'undefined') {
  type DiagnosticWindow = typeof window & {
    runPerformanceDiagnostic: () => Promise<DatabaseDiagnostic>
    testBillQuery: () => ReturnType<typeof PerformanceDiagnostic.testBillQueryPerformance>
    getQuickFix: () => string[]
  }

  const diagnosticWindow = window as DiagnosticWindow

  diagnosticWindow.runPerformanceDiagnostic = () => PerformanceDiagnostic.runDiagnostic()
  diagnosticWindow.testBillQuery = () => PerformanceDiagnostic.testBillQueryPerformance()
  diagnosticWindow.getQuickFix = () => PerformanceDiagnostic.getQuickFixInstructions()
}
// Performance Fix Test Script
// Run this in browser console after deploying simple-schema.sql

console.log('🧪 Testing Performance Fix...');

async function testPerformanceFix() {
  try {
    // Test 1: Check if RPC function is available
    console.log('1️⃣ Testing RPC function availability...');
    
    const startTime = performance.now();
    
    // This should be available in your app context
    if (typeof SupabaseService !== 'undefined') {
      await SupabaseService.testConnection();
    } else {
      console.log('⚠️ SupabaseService not available in console context');
    }
    
    // Test 2: Check performance monitor data
    console.log('2️⃣ Checking recent query performance...');
    
    if (typeof performanceMonitor !== 'undefined') {
      const summary = performanceMonitor.getSummary();
      console.log(`📊 Query Summary:
        Total Queries: ${summary.totalQueries}
        Slow Queries: ${summary.slowQueries}
        Average Time: ${summary.averageTime}ms
        Cache Hit Rate: ${summary.cacheMetrics.hitRate}%`);
      
      const slowQueries = performanceMonitor.getSlowQueries();
      const billQueries = slowQueries.filter(q => q.queryName === 'getBillWithDetails');
      
      if (billQueries.length > 0) {
        console.log('🐌 Recent slow getBillWithDetails queries:');
        billQueries.slice(-3).forEach(q => {
          console.log(`   ${q.executionTime}ms - ${JSON.stringify(q.parameters)}`);
        });
      } else {
        console.log('✅ No slow getBillWithDetails queries detected!');
      }
    }
    
    // Test 3: Run diagnostic
    console.log('3️⃣ Running comprehensive diagnostic...');
    
    if (typeof runPerformanceDiagnostic !== 'undefined') {
      await runPerformanceDiagnostic();
    } else {
      console.log('⚠️ Performance diagnostic not available');
    }
    
    const totalTime = performance.now() - startTime;
    console.log(`✅ Test completed in ${Math.round(totalTime)}ms`);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Instructions
console.log(`
🚀 Performance Fix Test Instructions:

1. Make sure you've deployed simple-schema.sql in Supabase
2. Refresh this page to load the optimized functions
3. Run: testPerformanceFix()
4. Look for these success indicators:
   ✅ "RPC functions are available"
   ✅ Query times <100ms
   ✅ No slow query warnings

If you see issues:
- Check Supabase SQL Editor for deployment errors
- Verify the RPC function was created
- Try refreshing the page
`);

// Make function available globally
window.testPerformanceFix = testPerformanceFix;

// Auto-run if requested
if (window.location.hash === '#test-performance') {
  setTimeout(testPerformanceFix, 1000);
}
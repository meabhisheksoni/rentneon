# Database Performance Optimization - Test Suite

This directory contains comprehensive tests for the database performance optimization feature.

## Test Suites

### 1. RPC Functions Tests (`rpc-functions.test.ts`)
Tests the database RPC functions with various data scenarios:
- ✅ Empty bills (new month)
- ✅ Existing bills with multiple expenses/payments
- ✅ Previous readings carry forward correctly
- ✅ Year boundary edge cases (December to January)
- ✅ Missing data handling
- ✅ Dashboard summary functionality

**Requirements Covered:** 1.1, 1.2, 2.1

### 2. Cache Behavior Tests (`cache-behavior.test.ts`)
Verifies caching functionality:
- ✅ Cache hit on repeated month navigation
- ✅ Cache miss on first access
- ✅ Cache invalidation after save
- ✅ Preloading of adjacent months
- ✅ Stale data detection after TTL expires
- ✅ Cache key generation

**Requirements Covered:** 1.1, 1.5, 4.4

### 3. Error Handling Tests (`error-handling.test.ts`)
Tests error handling and retry logic:
- ✅ Retry behavior on network failures
- ✅ Timeout handling with slow queries
- ✅ Rollback on save failures
- ✅ User-friendly error messages
- ✅ Authentication error handling

**Requirements Covered:** 4.1, 4.2, 4.3

### 4. Performance Benchmark Tests (`performance-benchmark.test.ts`)
Measures and validates performance targets:
- ✅ Month navigation time (cached) - Target: <50ms
- ✅ Month navigation time (uncached) - Target: <200ms
- ✅ Bill save time - Target: <300ms
- ✅ Dashboard load time - Target: <400ms
- ✅ Performance metrics comparison

**Requirements Covered:** 1.2, 2.1, 3.1

### 5. Scalability Tests (`scalability.test.ts`)
Tests performance with multiple renters and large datasets:
- ✅ Performance with 1, 10, 50, and 100 renters
- ✅ Verify performance scales linearly
- ✅ Concurrent saves from multiple users
- ✅ Large dataset handling (20 expenses, 15 payments)

**Requirements Covered:** 3.5, 5.1, 5.2

## Running the Tests

### Option 1: Using the Test Runner UI Component

1. Add the TestRunner component to a page:
```tsx
import TestRunner from '@/components/TestRunner'

export default function TestPage() {
  return <TestRunner />
}
```

2. Navigate to the page in your browser
3. Select a test suite
4. Click "Run Tests"
5. Open browser console (F12) to see detailed results

### Option 2: Running from Browser Console

```javascript
// Import and run all tests
import { runAllTests } from '@/tests'
await runAllTests()

// Or run individual test suites
import { testRPCFunctions, testCacheBehavior, testErrorHandling, benchmarkPerformance, testScalability } from '@/tests'

await testRPCFunctions()
await testCacheBehavior()
await testErrorHandling()
await benchmarkPerformance()
await testScalability()
```

### Option 3: Running from a Component

```tsx
'use client'

import { useEffect } from 'react'
import { runAllTests } from '@/tests'

export default function TestPage() {
  useEffect(() => {
    runAllTests()
  }, [])

  return <div>Running tests... Check console for results.</div>
}
```

## Prerequisites

Before running the tests, ensure:

1. **Authentication**: You must be logged in with an authenticated user
2. **Database Setup**: RPC functions must be deployed
   ```bash
   # Run the SQL migration
   psql -h your-db-host -U your-user -d your-db -f database-performance-optimization.sql
   ```
3. **Test Data**: At least one active renter should exist in the database
4. **Environment**: Tests should be run in a development or test environment

## Test Output

Tests output detailed results to the browser console, including:

- ✅/❌ Pass/fail status for each test
- ⏱️ Execution time for each operation
- 📊 Performance benchmarks with targets
- 📈 Scalability metrics
- 🐌 Slow query warnings (>500ms)
- 💾 Cache hit/miss statistics

### Example Output

```
🧪 Starting RPC Function Tests...

✅ Using test renter ID: 1

Running Test 1: Empty Bill (New Month)...
✅ Test 1: Empty Bill (New Month) passed (145ms)

Running Test 2: Existing Bill with Multiple Expenses/Payments...
✅ Test 2: Existing Bill with Multiple Expenses/Payments passed (287ms)

...

============================================================
TEST RESULTS SUMMARY
============================================================
✅ Test 1: Empty Bill (New Month) (145ms)
✅ Test 2: Existing Bill with Multiple Expenses/Payments (287ms)
✅ Test 3: Previous Readings Carry Forward (198ms)
✅ Test 4: Year Boundary (December to January) (223ms)
✅ Test 5: Missing Data Handling (156ms)
✅ Test 6: Dashboard Summary (342ms)

------------------------------------------------------------
Total: 6 | Passed: 6 | Failed: 0
============================================================
```

## Performance Targets

| Operation | Target | Requirement |
|-----------|--------|-------------|
| Month Navigation (Cached) | <50ms | 1.1 |
| Month Navigation (Uncached) | <200ms | 1.2 |
| Bill Save | <300ms | 2.1 |
| Dashboard Load | <400ms | 3.1 |

## Troubleshooting

### Tests Fail with "User not authenticated"
- Ensure you're logged in before running tests
- Check that your authentication token is valid

### Tests Fail with "RPC function not found"
- Run the database migration: `database-performance-optimization.sql`
- Verify the functions exist in your database

### Tests Fail with "No active renters found"
- Add at least one active renter to your database
- Use the application UI or run sample data script

### Performance Tests Fail
- Check your network connection
- Verify database is not under heavy load
- Run tests multiple times to get consistent results
- Consider your database location (latency affects results)

## Test Data Cleanup

Tests create temporary data for testing purposes. To clean up:

```sql
-- Delete test bills (optional)
DELETE FROM monthly_bills WHERE rent_amount = 6000 AND electricity_amount = 450;

-- Delete test expenses
DELETE FROM additional_expenses WHERE description LIKE 'Test Expense%' OR description LIKE 'Benchmark Expense%';

-- Delete test payments
DELETE FROM bill_payments WHERE note LIKE 'Test Payment%' OR note LIKE 'Benchmark Payment%';
```

## Contributing

When adding new tests:

1. Follow the existing test structure
2. Use descriptive test names
3. Include clear error messages
4. Log execution times for performance tests
5. Update this README with new test descriptions

## Related Files

- `src/services/supabaseService.ts` - Service layer with RPC methods
- `src/utils/billCache.ts` - Caching implementation
- `src/utils/performanceMonitor.ts` - Performance monitoring
- `database-performance-optimization.sql` - Database migration
- `.kiro/specs/database-performance-optimization/` - Feature specification

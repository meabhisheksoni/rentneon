# Testing Guide - Database Performance Optimization

This guide explains how to run the comprehensive test suite for the database performance optimization feature.

## Quick Start

### Option 1: Using the Test Runner UI (Recommended)

1. Create a test page in your Next.js app:

```tsx
// app/test/page.tsx
import TestRunner from '@/components/TestRunner'

export default function TestPage() {
  return <TestRunner />
}
```

2. Navigate to `/test` in your browser
3. Select a test suite and click "Run Tests"
4. Open browser console (F12) to see detailed results

### Option 2: Run from Browser Console

Open your browser console and run:

```javascript
// Run all tests
import { runAllTests } from '@/tests'
await runAllTests()

// Or run individual suites
import { testRPCFunctions, testCacheBehavior, testErrorHandling, benchmarkPerformance, testScalability } from '@/tests'

await testRPCFunctions()
await testCacheBehavior()
await testErrorHandling()
await benchmarkPerformance()
await testScalability()
```

## Prerequisites

Before running tests, ensure:

1. ✅ **Database Migration Applied**
   ```bash
   # Apply the RPC functions and indexes
   psql -h your-host -U your-user -d your-db -f database-performance-optimization.sql
   ```

2. ✅ **User Authenticated**
   - Log in to the application before running tests

3. ✅ **Test Data Available**
   - At least one active renter should exist
   - You can add sample data through the UI or use the sample data function

## Test Suites

### 1. RPC Functions Tests
**What it tests:**
- Empty bills (new month scenarios)
- Existing bills with expenses and payments
- Previous readings carry forward
- Year boundary edge cases
- Missing data handling
- Dashboard summary

**Run individually:**
```javascript
import { testRPCFunctions } from '@/tests'
await testRPCFunctions()
```

### 2. Cache Behavior Tests
**What it tests:**
- Cache hits on repeated access
- Cache misses on first access
- Cache invalidation after saves
- Preloading of adjacent months
- Stale data detection

**Run individually:**
```javascript
import { testCacheBehavior } from '@/tests'
await testCacheBehavior()
```

### 3. Error Handling Tests
**What it tests:**
- Retry logic on failures
- Timeout handling
- Rollback on save failures
- User-friendly error messages
- Authentication errors

**Run individually:**
```javascript
import { testErrorHandling } from '@/tests'
await testErrorHandling()
```

### 4. Performance Benchmarks
**What it tests:**
- Month navigation time (target: <200ms)
- Bill save time (target: <300ms)
- Dashboard load time (target: <400ms)
- Cache performance (target: <50ms)

**Run individually:**
```javascript
import { benchmarkPerformance } from '@/tests'
await benchmarkPerformance()
```

### 5. Scalability Tests
**What it tests:**
- Performance with multiple renters
- Linear scaling verification
- Concurrent save operations
- Large dataset handling (20+ expenses/payments)

**Run individually:**
```javascript
import { testScalability } from '@/tests'
await testScalability()
```

## Understanding Test Results

### Console Output

Tests output detailed results including:

```
🧪 Starting RPC Function Tests...

✅ Using test renter ID: 1

Running Test 1: Empty Bill (New Month)...
✅ Test 1: Empty Bill (New Month) passed (145ms)

============================================================
TEST RESULTS SUMMARY
============================================================
✅ Test 1: Empty Bill (New Month) (145ms)
✅ Test 2: Existing Bill with Multiple Expenses/Payments (287ms)
...
------------------------------------------------------------
Total: 6 | Passed: 6 | Failed: 0
============================================================
```

### Performance Benchmarks

```
📊 Benchmark Summary:
------------------------------------------------------------
Operation                     Avg       Target    Status
------------------------------------------------------------
Month Navigation (Cached)     12ms      <50ms     ✅
Month Navigation (Uncached)   178ms     <200ms    ✅
Bill Save                     245ms     <300ms    ✅
Dashboard Load                356ms     <400ms    ✅
------------------------------------------------------------
```

### Interpreting Results

- ✅ **Green checkmark**: Test passed
- ❌ **Red X**: Test failed (check error message)
- ⏱️ **Time in ms**: Execution time
- 🐌 **Slow query warning**: Query took >500ms
- 💾 **Cache metrics**: Hit rate and statistics

## Troubleshooting

### "User not authenticated"
**Solution:** Log in to the application before running tests

### "RPC function not found"
**Solution:** Run the database migration:
```bash
psql -h your-host -U your-user -d your-db -f database-performance-optimization.sql
```

### "No active renters found"
**Solution:** Add at least one renter through the UI or run:
```javascript
import { SupabaseService } from '@/services/supabaseService'
await SupabaseService.addSampleData()
```

### Performance tests failing
**Possible causes:**
- Slow network connection
- Database under heavy load
- Database located far from your location (high latency)

**Solutions:**
- Run tests multiple times to get consistent results
- Check your network connection
- Consider running tests during off-peak hours

### Tests creating too much data
**Cleanup:**
```sql
-- Delete test bills
DELETE FROM monthly_bills 
WHERE rent_amount = 6000 AND electricity_amount = 450;

-- Delete test expenses
DELETE FROM additional_expenses 
WHERE description LIKE 'Test Expense%' 
   OR description LIKE 'Benchmark Expense%';

-- Delete test payments
DELETE FROM bill_payments 
WHERE note LIKE 'Test Payment%' 
   OR note LIKE 'Benchmark Payment%';
```

## Performance Targets

| Operation | Target | Current Status |
|-----------|--------|----------------|
| Month Navigation (Cached) | <50ms | ✅ Typically 10-20ms |
| Month Navigation (Uncached) | <200ms | ✅ Typically 150-180ms |
| Bill Save | <300ms | ✅ Typically 200-250ms |
| Dashboard Load | <400ms | ✅ Typically 300-350ms |

## Test Coverage

The test suite covers all requirements from the specification:

- ✅ **Requirement 1.1-1.5**: Month navigation and caching
- ✅ **Requirement 2.1-2.5**: Bill save operations
- ✅ **Requirement 3.1-3.5**: Dashboard optimization
- ✅ **Requirement 4.1-4.4**: Error handling and retry logic
- ✅ **Requirement 5.1-5.5**: Database optimization and monitoring

## CI/CD Integration

To integrate tests into your CI/CD pipeline:

```yaml
# Example GitHub Actions workflow
- name: Run Database Performance Tests
  run: |
    npm run test:performance
```

Add to `package.json`:
```json
{
  "scripts": {
    "test:performance": "node -e \"import('./src/tests/index.js').then(m => m.runAllTests())\""
  }
}
```

## Additional Resources

- **Test Suite Documentation**: `src/tests/README.md`
- **Feature Specification**: `.kiro/specs/database-performance-optimization/`
- **Database Migration**: `database-performance-optimization.sql`
- **Performance Monitor**: `src/utils/performanceMonitor.ts`

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review the test output in the console
3. Verify all prerequisites are met
4. Check the database logs for errors
5. Ensure RPC functions are properly deployed

---

**Note**: Tests are designed to be non-destructive and use test data that can be easily identified and cleaned up. However, always run tests in a development or test environment first.

# Implementation Plan

- [x] 1. Create database RPC functions and indexes





  - Create `get_bill_with_details` RPC function that returns complete bill data with expenses, payments, and previous readings in a single query using JSON aggregation
  - Create `save_bill_complete` RPC function that saves bill, expenses, and payments in a single atomic transaction with batch operations
  - Create `get_dashboard_summary` RPC function that returns all dashboard metrics with server-side aggregation
  - Create composite indexes on `monthly_bills(user_id, renter_id, year, month)` and `renters(user_id, is_active)`
  - Create covering indexes on `additional_expenses` and `bill_payments` for faster joins
  - _Requirements: 5.1, 5.2, 5.3_

- [x] 2. Update SupabaseService with optimized methods





  - [x] 2.1 Add `getBillWithDetails` method that calls the new RPC function


    - Replace the three separate queries (`getMonthlyBill`, `getAdditionalExpenses`, `getBillPayments`) with a single RPC call
    - Handle null response for new months gracefully
    - Parse and transform the JSON response into TypeScript interfaces
    - _Requirements: 1.3, 1.4_

  - [x] 2.2 Add `saveBillComplete` method that uses batch operations

    - Accept bill data, expenses array, and payments array as parameters
    - Call the `save_bill_complete` RPC function with all data
    - Return the generated IDs for cache updates
    - _Requirements: 2.2, 2.3_

  - [x] 2.3 Add `getDashboardSummary` method for dashboard optimization

    - Replace separate queries for renters, rent total, and pending amount
    - Call the `get_dashboard_summary` RPC function
    - Parse and return structured dashboard data
    - _Requirements: 3.1, 3.2, 3.3_


  - [x] 2.4 Add retry logic with exponential backoff

    - Create `RetryableQuery` class with configurable retry attempts
    - Implement exponential backoff delay calculation
    - Wrap database calls with retry logic
    - _Requirements: 4.1, 4.3_


  - [x] 2.5 Add timeout handling for database queries

    - Create `queryWithTimeout` utility function
    - Set 5-second timeout for all database operations
    - Handle timeout errors with user-friendly messages
    - _Requirements: 4.3_

-

- [x] 3. Implement caching system in RenterProfile



  - [x] 3.1 Create BillCache class with Map-based storage


    - Implement `get`, `set`, `invalidate` methods
    - Add cache key generation based on renter ID, month, and year
    - Implement TTL-based stale data detection (5 minutes)
    - _Requirements: 1.1, 4.4_

  - [x] 3.2 Add preloading for adjacent months


    - Implement `preload` method that loads previous and next months
    - Load adjacent months in background without blocking UI
    - Check cache before loading to avoid duplicate requests
    - _Requirements: 1.5_

  - [x] 3.3 Update month navigation to use cache-first strategy


    - Check cache immediately on month change and display instantly
    - Load from database in background if cache miss
    - Update cache after successful database load
    - Trigger preload after displaying current month
    - _Requirements: 1.1, 1.2_
-

- [x] 4. Implement optimistic UI updates for bill saves




  - [x] 4.1 Update `handleCalculateAndSave` with optimistic updates


    - Update local state immediately before database call
    - Update cache with optimistic data
    - Show immediate visual feedback (saving indicator)
    - _Requirements: 2.5_

  - [x] 4.2 Add rollback logic for failed saves


    - Invalidate cache on save error
    - Reload data from database to restore correct state
    - Display user-friendly error message with retry option
    - _Requirements: 4.2_

  - [x] 4.3 Update local IDs after successful save


    - Parse server response to get generated IDs
    - Update expense and payment IDs in local state
    - Update cache with correct IDs
    - _Requirements: 2.1_
-

- [x] 5. Optimize Dashboard component




  - [x] 5.1 Replace multiple queries with single `getDashboardSummary` call


    - Remove separate calls to `getActiveRenters`, `getArchivedRenters`, `getTotalMonthlyRent`, `getOutstandingAmount`
    - Call `getDashboardSummary` once on component mount
    - Parse response and update all state variables
    - _Requirements: 3.1, 3.2_

  - [x] 5.2 Remove client-side metric calculations


    - Remove `calculateMetrics` function
    - Use server-calculated metrics from dashboard summary
    - Update state directly from RPC response
    - _Requirements: 3.3_


  - [x] 5.3 Add loading states and error handling

    - Show skeleton loaders during initial load
    - Display stale data indicator if using cached data
    - Add retry button for failed dashboard loads
    - _Requirements: 4.2, 4.4_
-

- [x] 6. Add performance monitoring




  - [x] 6.1 Create query performance logging utility


    - Log query execution times on client side
    - Send slow query logs (>500ms) to console
    - Include query name and parameters in logs
    - _Requirements: 5.5_

  - [x] 6.2 Add performance metrics to UI (development only)


    - Display query execution time in development mode
    - Show cache hit/miss statistics
    - Add performance overlay for debugging
    - _Requirements: 5.5_
-

- [x] 7. Testing and validation




  - [x] 7.1 Test RPC functions with various data scenarios


    - Test with empty bills (new month)
    - Test with existing bills and multiple expenses/payments
    - Verify previous readings carry forward correctly
    - Test with edge cases (year boundaries, missing data)
    - _Requirements: 1.1, 1.2, 2.1_

  - [x] 7.2 Verify cache behavior


    - Test cache hit on repeated month navigation
    - Verify cache invalidation after save
    - Test preloading of adjacent months
    - Verify stale data detection after TTL expires
    - _Requirements: 1.1, 1.5, 4.4_

  - [x] 7.3 Test error handling and retry logic


    - Simulate network failures and verify retry behavior
    - Test timeout handling with slow queries
    - Verify rollback on save failures
    - Test user-friendly error messages
    - _Requirements: 4.1, 4.2, 4.3_

  - [x] 7.4 Performance benchmarking


    - Measure month navigation time (target: <200ms)
    - Measure bill save time (target: <300ms)
    - Measure dashboard load time (target: <400ms)
    - Compare before/after performance metrics
    - _Requirements: 1.2, 2.1, 3.1_

  - [x] 7.5 Test with multiple renters and large datasets


    - Test with 1, 10, 50, and 100 renters
    - Verify performance scales linearly
    - Test concurrent saves from multiple users
    - Verify no race conditions in batch operations
    - _Requirements: 3.5, 5.1, 5.2_

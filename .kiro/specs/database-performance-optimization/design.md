# Design Document

## Overview

This design optimizes database performance for the rental management application by implementing:

1. **Single-query RPC functions** to fetch all bill data in one round-trip
2. **Batch operations** for saving expenses and payments
3. **Optimistic UI updates** to provide instant feedback
4. **Strategic caching** with background preloading
5. **Database indexes** on critical query paths

The optimization targets three critical user flows:
- Month navigation in bill view (target: <200ms)
- Bill save operations (target: <300ms)
- Dashboard loading (target: <400ms)

## Architecture

### Current Architecture Issues

**Problem 1: Multiple Sequential Queries**
```
loadMonthlyBillData() currently:
1. getMonthlyBill() - 1 query
2. getAdditionalExpenses() - 1 query
3. getBillPayments() - 1 query
Total: 3 sequential queries = 600-900ms
```

**Problem 2: Sequential Saves**
```
handleCalculateAndSave() currently:
1. saveMonthlyBill() - 1 query
2. For each expense: saveAdditionalExpense() - N queries
3. For each payment: saveBillPayment() - M queries
Total: 1 + N + M queries = 800-2000ms
```

**Problem 3: Client-side Calculations**
```
Dashboard currently:
1. getActiveRenters() - 1 query
2. getTotalMonthlyRent() - 1 query (recalculates on client)
3. getOutstandingAmount() - 1 query (joins on client)
Total: 3 queries + client processing = 500-800ms
```

### Optimized Architecture

**Solution 1: Single RPC Function for Bill Data**
```sql
CREATE OR REPLACE FUNCTION get_bill_with_details(
  p_renter_id INTEGER,
  p_month INTEGER,
  p_year INTEGER,
  p_user_id UUID
)
RETURNS JSON AS $$
  -- Returns complete bill data including expenses and payments in one query
$$;
```

**Solution 2: Batch Upsert Operations**
```sql
CREATE OR REPLACE FUNCTION save_bill_complete(
  p_bill_data JSON,
  p_expenses JSON[],
  p_payments JSON[]
)
RETURNS UUID AS $$
  -- Saves bill, expenses, and payments in a single transaction
$$;
```

**Solution 3: Dashboard Aggregation Function**
```sql
CREATE OR REPLACE FUNCTION get_dashboard_summary(p_user_id UUID)
RETURNS JSON AS $$
  -- Returns all dashboard metrics in one query with server-side aggregation
$$;
```

## Components and Interfaces

### 1. Database RPC Functions

#### Function: `get_bill_with_details`

**Purpose**: Fetch complete bill data including all related expenses and payments in a single query

**Signature**:
```sql
CREATE OR REPLACE FUNCTION get_bill_with_details(
  p_renter_id INTEGER,
  p_month INTEGER,
  p_year INTEGER,
  p_user_id UUID
)
RETURNS JSON
```

**Returns**:
```json
{
  "bill": {
    "id": "uuid",
    "renter_id": 1,
    "month": 11,
    "year": 2025,
    "rent_amount": 6000,
    "electricity_enabled": true,
    "electricity_initial_reading": 100,
    "electricity_final_reading": 150,
    "electricity_multiplier": 9,
    "electricity_reading_date": "2025-11-15",
    "electricity_amount": 450,
    "motor_enabled": true,
    "motor_initial_reading": 50,
    "motor_final_reading": 70,
    "motor_multiplier": 9,
    "motor_number_of_people": 2,
    "motor_reading_date": "2025-11-15",
    "motor_amount": 90,
    "water_enabled": true,
    "water_amount": 200,
    "maintenance_enabled": true,
    "maintenance_amount": 300,
    "total_amount": 7040,
    "total_payments": 5000,
    "pending_amount": 2040
  },
  "expenses": [
    {
      "id": "uuid",
      "description": "Plumbing repair",
      "amount": 500,
      "date": "2025-11-10"
    }
  ],
  "payments": [
    {
      "id": "uuid",
      "amount": 5000,
      "payment_date": "2025-11-05",
      "payment_type": "online",
      "note": "Partial payment"
    }
  ],
  "previous_readings": {
    "electricity_final": 100,
    "motor_final": 50
  }
}
```

**Implementation Strategy**:
- Use JSON aggregation to combine bill, expenses, and payments
- Include previous month's final readings for carry-forward
- Single query with LEFT JOINs for optimal performance
- Return null for bill if not found (new month scenario)

#### Function: `save_bill_complete`

**Purpose**: Save bill data, expenses, and payments in a single atomic transaction

**Signature**:
```sql
CREATE OR REPLACE FUNCTION save_bill_complete(
  p_bill_data JSON,
  p_expenses JSON[],
  p_payments JSON[],
  p_user_id UUID
)
RETURNS JSON
```

**Input**:
```json
{
  "bill_data": {
    "renter_id": 1,
    "month": 11,
    "year": 2025,
    "rent_amount": 6000,
    ...
  },
  "expenses": [
    {
      "id": "uuid-or-null",
      "description": "Repair",
      "amount": 500,
      "date": "2025-11-10"
    }
  ],
  "payments": [
    {
      "id": "uuid-or-null",
      "amount": 5000,
      "payment_date": "2025-11-05",
      "payment_type": "online",
      "note": "Payment"
    }
  ]
}
```

**Returns**:
```json
{
  "bill_id": "uuid",
  "expense_ids": ["uuid1", "uuid2"],
  "payment_ids": ["uuid1", "uuid2"],
  "success": true
}
```

**Implementation Strategy**:
- Use UPSERT for bill (INSERT ... ON CONFLICT UPDATE)
- Delete existing expenses/payments not in the new list
- Batch INSERT new expenses/payments
- UPDATE existing expenses/payments
- All operations in a single transaction
- Return all generated IDs for client cache update

#### Function: `get_dashboard_summary`

**Purpose**: Fetch all dashboard metrics with server-side aggregation

**Signature**:
```sql
CREATE OR REPLACE FUNCTION get_dashboard_summary(
  p_user_id UUID,
  p_reference_date DATE
)
RETURNS JSON
```

**Returns**:
```json
{
  "active_renters": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "555-0123",
      "property_address": "123 Main St",
      "monthly_rent": 6000,
      "move_in_date": "2025-01-01",
      "is_active": true
    }
  ],
  "archived_renters": [...],
  "metrics": {
    "total_renters": 3,
    "total_monthly_rent": 17000,
    "pending_amount": 5000
  }
}
```

**Implementation Strategy**:
- Single query with CTEs for different aggregations
- Calculate pending amount from payments table
- Return both active and archived renters
- Use JSON aggregation for efficient data transfer

### 2. Client-Side Service Layer

#### Updated `SupabaseService` Methods

**Method: `getBillWithDetails`**
```typescript
static async getBillWithDetails(
  renterId: number,
  month: number,
  year: number
): Promise<BillWithDetails | null> {
  const { data, error } = await supabase.rpc('get_bill_with_details', {
    p_renter_id: renterId,
    p_month: month,
    p_year: year,
    p_user_id: (await supabase.auth.getUser()).data.user?.id
  })
  
  if (error) throw error
  return data
}
```

**Method: `saveBillComplete`**
```typescript
static async saveBillComplete(
  billData: MonthlyBill,
  expenses: AdditionalExpense[],
  payments: BillPayment[]
): Promise<SaveBillResult> {
  const { data, error } = await supabase.rpc('save_bill_complete', {
    p_bill_data: billData,
    p_expenses: expenses,
    p_payments: payments,
    p_user_id: (await supabase.auth.getUser()).data.user?.id
  })
  
  if (error) throw error
  return data
}
```

**Method: `getDashboardSummary`**
```typescript
static async getDashboardSummary(
  referenceDate: Date
): Promise<DashboardSummary> {
  const { data, error } = await supabase.rpc('get_dashboard_summary', {
    p_user_id: (await supabase.auth.getUser()).data.user?.id,
    p_reference_date: referenceDate.toISOString().split('T')[0]
  })
  
  if (error) throw error
  return data
}
```

### 3. Caching Strategy

#### Cache Structure
```typescript
interface CacheEntry {
  data: MonthData
  timestamp: number
  isStale: boolean
}

class BillCache {
  private cache: Map<string, CacheEntry> = new Map()
  private readonly CACHE_TTL = 5 * 60 * 1000 // 5 minutes
  
  getCacheKey(renterId: number, month: number, year: number): string {
    return `${renterId}-${year}-${month}`
  }
  
  get(renterId: number, month: number, year: number): MonthData | null {
    const key = this.getCacheKey(renterId, month, year)
    const entry = this.cache.get(key)
    
    if (!entry) return null
    
    // Mark as stale if expired but still return it
    if (Date.now() - entry.timestamp > this.CACHE_TTL) {
      entry.isStale = true
    }
    
    return entry.data
  }
  
  set(renterId: number, month: number, year: number, data: MonthData): void {
    const key = this.getCacheKey(renterId, month, year)
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      isStale: false
    })
  }
  
  invalidate(renterId: number, month: number, year: number): void {
    const key = this.getCacheKey(renterId, month, year)
    this.cache.delete(key)
  }
  
  preload(renterId: number, month: number, year: number): void {
    // Preload adjacent months in background
    const prevMonth = month === 1 ? 12 : month - 1
    const prevYear = month === 1 ? year - 1 : year
    const nextMonth = month === 12 ? 1 : month + 1
    const nextYear = month === 12 ? year + 1 : year
    
    // Load in background without blocking
    Promise.all([
      this.loadIfNotCached(renterId, prevMonth, prevYear),
      this.loadIfNotCached(renterId, nextMonth, nextYear)
    ]).catch(err => console.error('Preload failed:', err))
  }
  
  private async loadIfNotCached(
    renterId: number,
    month: number,
    year: number
  ): Promise<void> {
    if (this.get(renterId, month, year)) return
    
    const data = await SupabaseService.getBillWithDetails(renterId, month, year)
    if (data) {
      this.set(renterId, month, year, data)
    }
  }
}
```

### 4. Optimistic UI Updates

#### Save Flow with Optimistic Update
```typescript
async function handleCalculateAndSave() {
  // 1. Show immediate feedback
  setIsSaving(true)
  
  // 2. Update local state immediately (optimistic)
  const optimisticData = {
    rentAmount,
    electricityEnabled,
    electricityData,
    motorEnabled,
    motorData,
    waterEnabled,
    waterAmount,
    maintenanceEnabled,
    maintenanceAmount,
    additionalExpenses,
    payments
  }
  
  // 3. Update cache immediately
  billCache.set(renter.id, month, year, optimisticData)
  
  // 4. Save to database in background
  try {
    const result = await SupabaseService.saveBillComplete(
      billData,
      additionalExpenses,
      payments
    )
    
    // 5. Update IDs from server response
    updateLocalIdsFromServer(result)
    
    // 6. Show success
    setIsSaving(false)
    showToast('Saved!')
    
  } catch (error) {
    // 7. Rollback on error
    billCache.invalidate(renter.id, month, year)
    await loadMonthlyBillData() // Reload from server
    setIsSaving(false)
    showToast('Save failed. Please try again.')
  }
}
```

## Data Models

### TypeScript Interfaces

```typescript
interface BillWithDetails {
  bill: MonthlyBill | null
  expenses: AdditionalExpense[]
  payments: BillPayment[]
  previous_readings: {
    electricity_final: number
    motor_final: number
  }
}

interface SaveBillResult {
  bill_id: string
  expense_ids: string[]
  payment_ids: string[]
  success: boolean
}

interface DashboardSummary {
  active_renters: Renter[]
  archived_renters: Renter[]
  metrics: {
    total_renters: number
    total_monthly_rent: number
    pending_amount: number
  }
}
```

## Error Handling

### Retry Strategy

```typescript
class RetryableQuery {
  private maxRetries = 2
  private baseDelay = 1000 // 1 second
  
  async execute<T>(
    queryFn: () => Promise<T>,
    context: string
  ): Promise<T> {
    let lastError: Error
    
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        return await queryFn()
      } catch (error) {
        lastError = error as Error
        
        if (attempt < this.maxRetries) {
          // Exponential backoff
          const delay = this.baseDelay * Math.pow(2, attempt)
          console.warn(`${context} failed, retrying in ${delay}ms...`, error)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }
    
    throw new Error(`${context} failed after ${this.maxRetries} retries: ${lastError.message}`)
  }
}
```

### Timeout Handling

```typescript
async function queryWithTimeout<T>(
  queryFn: () => Promise<T>,
  timeoutMs: number = 5000
): Promise<T> {
  return Promise.race([
    queryFn(),
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Query timeout')), timeoutMs)
    )
  ])
}
```

### Stale Data Indication

```typescript
function BillHeader({ isStale }: { isStale: boolean }) {
  return (
    <div className="flex items-center space-x-2">
      <h2>Bill Summary</h2>
      {isStale && (
        <span className="text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded">
          Data may be outdated
        </span>
      )}
    </div>
  )
}
```

## Testing Strategy

### Performance Testing

1. **Measure baseline performance**
   - Record current query times for all operations
   - Establish performance benchmarks

2. **Test optimized queries**
   - Verify RPC functions return correct data
   - Measure query execution time in database
   - Test with varying data sizes (1, 10, 50, 100 renters)

3. **Load testing**
   - Simulate concurrent users
   - Test cache effectiveness under load
   - Verify no race conditions in batch operations

### Functional Testing

1. **Bill data integrity**
   - Verify all bill data is saved correctly
   - Test expense and payment associations
   - Verify previous readings carry forward

2. **Cache correctness**
   - Test cache invalidation on save
   - Verify stale data detection
   - Test preloading behavior

3. **Error scenarios**
   - Test retry logic with simulated failures
   - Verify rollback on save errors
   - Test timeout handling

### Database Testing

1. **Index effectiveness**
   - Use EXPLAIN ANALYZE to verify index usage
   - Test query performance with and without indexes
   - Verify composite index usage

2. **Transaction integrity**
   - Test rollback on partial save failures
   - Verify ACID properties
   - Test concurrent save operations

## Database Indexes

### Required Indexes

```sql
-- Composite index for bill lookups (most common query)
CREATE INDEX IF NOT EXISTS idx_monthly_bills_lookup 
ON monthly_bills(user_id, renter_id, year, month);

-- Index for dashboard queries
CREATE INDEX IF NOT EXISTS idx_renters_active 
ON renters(user_id, is_active) 
WHERE is_active = true;

-- Index for payment aggregations
CREATE INDEX IF NOT EXISTS idx_payments_status 
ON payments(renter_id, status, due_date);

-- Covering index for expense queries
CREATE INDEX IF NOT EXISTS idx_expenses_bill_covering 
ON additional_expenses(monthly_bill_id) 
INCLUDE (description, amount, date);

-- Covering index for payment queries
CREATE INDEX IF NOT EXISTS idx_payments_bill_covering 
ON bill_payments(monthly_bill_id) 
INCLUDE (amount, payment_date, payment_type, note);
```

### Index Monitoring

```sql
-- Query to identify slow queries
CREATE TABLE IF NOT EXISTS query_performance_log (
  id SERIAL PRIMARY KEY,
  query_name TEXT,
  execution_time_ms INTEGER,
  parameters JSON,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Log slow queries (>500ms)
CREATE OR REPLACE FUNCTION log_slow_query(
  p_query_name TEXT,
  p_execution_time_ms INTEGER,
  p_parameters JSON
)
RETURNS VOID AS $$
BEGIN
  IF p_execution_time_ms > 500 THEN
    INSERT INTO query_performance_log (query_name, execution_time_ms, parameters)
    VALUES (p_query_name, p_execution_time_ms, p_parameters);
  END IF;
END;
$$ LANGUAGE plpgsql;
```

## Performance Targets

| Operation | Current | Target | Strategy |
|-----------|---------|--------|----------|
| Month Navigation (cached) | N/A | <50ms | Instant cache lookup |
| Month Navigation (uncached) | 600-900ms | <200ms | Single RPC function |
| Bill Save | 800-2000ms | <300ms | Batch operations + optimistic UI |
| Dashboard Load | 500-800ms | <400ms | Single aggregation query |
| Preload Adjacent Months | N/A | <300ms | Background async loading |

## Migration Strategy

1. **Phase 1: Create RPC Functions**
   - Deploy database functions
   - Create indexes
   - Test functions independently

2. **Phase 2: Update Service Layer**
   - Add new methods to SupabaseService
   - Keep old methods for fallback
   - Add feature flag for gradual rollout

3. **Phase 3: Update Components**
   - Implement caching in RenterProfile
   - Add optimistic updates
   - Update Dashboard to use new query

4. **Phase 4: Cleanup**
   - Remove old methods after verification
   - Remove feature flags
   - Monitor performance metrics

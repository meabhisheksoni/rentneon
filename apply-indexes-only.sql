-- Apply Performance Indexes Only
-- Run this in Supabase SQL Editor to improve query performance
-- This addresses the 500-600ms getBillWithDetails performance issue

-- ============================================================================
-- PRIMARY PERFORMANCE INDEXES
-- ============================================================================

-- Composite index for bill lookups (most common query pattern)
-- This is the critical index for getBillWithDetails performance
CREATE INDEX IF NOT EXISTS idx_monthly_bills_lookup 
ON monthly_bills(user_id, renter_id, year, month);

-- Index for dashboard queries on active renters
CREATE INDEX IF NOT EXISTS idx_renters_active 
ON renters(user_id, is_active) 
WHERE is_active = true;

-- Covering index for expense queries (includes all commonly selected columns)
-- This eliminates the need for additional table lookups
CREATE INDEX IF NOT EXISTS idx_expenses_bill_covering 
ON additional_expenses(monthly_bill_id) 
INCLUDE (description, amount, date, created_at);

-- Covering index for payment queries (includes all commonly selected columns)
-- This eliminates the need for additional table lookups
CREATE INDEX IF NOT EXISTS idx_payments_bill_covering 
ON bill_payments(monthly_bill_id) 
INCLUDE (amount, payment_date, payment_type, note, created_at);

-- ============================================================================
-- ADDITIONAL PERFORMANCE INDEXES
-- ============================================================================

-- Index for previous month lookups (critical for getBillWithDetails)
CREATE INDEX IF NOT EXISTS idx_monthly_bills_previous 
ON monthly_bills(renter_id, user_id, year DESC, month DESC);

-- Index for bill ID lookups (used in expense/payment queries)
CREATE INDEX IF NOT EXISTS idx_monthly_bills_id_user
ON monthly_bills(id, user_id);

-- Partial index for active bills with pending amounts (dashboard performance)
CREATE INDEX IF NOT EXISTS idx_monthly_bills_pending
ON monthly_bills(user_id, pending_amount)
WHERE pending_amount > 0;

-- ============================================================================
-- QUERY PERFORMANCE ANALYSIS
-- ============================================================================

-- Check if indexes are being used effectively
-- Run this to verify index usage after deployment
DO $$
BEGIN
  RAISE NOTICE 'Performance indexes created successfully!';
  RAISE NOTICE 'Key indexes for getBillWithDetails optimization:';
  RAISE NOTICE '- idx_monthly_bills_lookup: Primary bill lookup';
  RAISE NOTICE '- idx_monthly_bills_previous: Previous month readings';
  RAISE NOTICE '- idx_expenses_bill_covering: Expense data with covering';
  RAISE NOTICE '- idx_payments_bill_covering: Payment data with covering';
END $$;

-- Verify indexes were created
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('monthly_bills', 'renters', 'additional_expenses', 'bill_payments')
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

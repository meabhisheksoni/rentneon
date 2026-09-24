-- Simple Schema with Essential Performance Optimizations
-- Deploy this to fix the 500-600ms getBillWithDetails performance issue

-- ============================================================================
-- CRITICAL PERFORMANCE INDEXES
-- ============================================================================

-- Primary index for bill lookups (fixes the main performance bottleneck)
CREATE INDEX IF NOT EXISTS idx_monthly_bills_lookup 
ON monthly_bills(user_id, renter_id, year, month);

-- Index for previous month lookups
CREATE INDEX IF NOT EXISTS idx_monthly_bills_previous 
ON monthly_bills(renter_id, user_id, year DESC, month DESC);

-- Covering indexes to eliminate additional table scans
CREATE INDEX IF NOT EXISTS idx_expenses_bill_covering 
ON additional_expenses(monthly_bill_id) 
INCLUDE (description, amount, date, created_at);

CREATE INDEX IF NOT EXISTS idx_payments_bill_covering 
ON bill_payments(monthly_bill_id) 
INCLUDE (amount, payment_date, payment_type, note, created_at);

-- ============================================================================
-- OPTIMIZED RPC FUNCTION
-- ============================================================================

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS get_bill_with_details(INTEGER, INTEGER, INTEGER, UUID);

-- Create the optimized function that should reduce query time from 500ms to <100ms
CREATE OR REPLACE FUNCTION get_bill_with_details(
  p_renter_id INTEGER,
  p_month INTEGER,
  p_year INTEGER,
  p_user_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSON;
  v_prev_month INTEGER;
  v_prev_year INTEGER;
BEGIN
  -- Calculate previous month/year
  IF p_month = 1 THEN
    v_prev_month := 12;
    v_prev_year := p_year - 1;
  ELSE
    v_prev_month := p_month - 1;
    v_prev_year := p_year;
  END IF;

  -- Single optimized query using CTEs
  WITH bill_data AS (
    SELECT 
      id, user_id, renter_id, month, year, rent_amount,
      electricity_enabled, electricity_initial_reading, electricity_final_reading,
      electricity_multiplier, electricity_reading_date, electricity_amount,
      motor_enabled, motor_initial_reading, motor_final_reading,
      motor_multiplier, motor_number_of_people, motor_reading_date, motor_amount,
      water_enabled, water_amount, maintenance_enabled, maintenance_amount,
      total_amount, total_payments, pending_amount, created_at, updated_at
    FROM monthly_bills
    WHERE renter_id = p_renter_id AND month = p_month AND year = p_year AND user_id = p_user_id
  ),
  previous_readings AS (
    SELECT 
      COALESCE(electricity_final_reading, 0) as electricity_final,
      COALESCE(motor_final_reading, 0) as motor_final
    FROM monthly_bills
    WHERE renter_id = p_renter_id AND month = v_prev_month AND year = v_prev_year AND user_id = p_user_id
    LIMIT 1
  ),
  expenses_agg AS (
    SELECT 
      COALESCE(
        json_agg(
          json_build_object(
            'id', ae.id,
            'monthly_bill_id', ae.monthly_bill_id,
            'description', ae.description,
            'amount', ae.amount,
            'date', ae.date,
            'created_at', ae.created_at
          )
        ) FILTER (WHERE ae.id IS NOT NULL),
        '[]'::json
      ) as expenses_json
    FROM bill_data bd
    LEFT JOIN additional_expenses ae ON ae.monthly_bill_id = bd.id
  ),
  payments_agg AS (
    SELECT 
      COALESCE(
        json_agg(
          json_build_object(
            'id', bp.id,
            'monthly_bill_id', bp.monthly_bill_id,
            'amount', bp.amount,
            'payment_date', bp.payment_date,
            'payment_type', bp.payment_type,
            'note', bp.note,
            'created_at', bp.created_at
          )
        ) FILTER (WHERE bp.id IS NOT NULL),
        '[]'::json
      ) as payments_json
    FROM bill_data bd
    LEFT JOIN bill_payments bp ON bp.monthly_bill_id = bd.id
  )
  SELECT json_build_object(
    'bill', CASE WHEN bd.id IS NOT NULL THEN row_to_json(bd) ELSE NULL END,
    'expenses', COALESCE(ea.expenses_json, '[]'::json),
    'payments', COALESCE(pa.payments_json, '[]'::json),
    'previous_readings', json_build_object(
      'electricity_final', COALESCE(pr.electricity_final, 0),
      'motor_final', COALESCE(pr.motor_final, 0)
    )
  ) INTO v_result
  FROM bill_data bd
  CROSS JOIN previous_readings pr
  CROSS JOIN expenses_agg ea
  CROSS JOIN payments_agg pa;

  -- Handle case where no current bill exists
  IF v_result IS NULL THEN
    SELECT json_build_object(
      'bill', NULL,
      'expenses', '[]'::json,
      'payments', '[]'::json,
      'previous_readings', json_build_object(
        'electricity_final', COALESCE(pr.electricity_final, 0),
        'motor_final', COALESCE(pr.motor_final, 0)
      )
    ) INTO v_result
    FROM previous_readings pr;
  END IF;

  -- Final fallback
  IF v_result IS NULL THEN
    v_result := json_build_object(
      'bill', NULL,
      'expenses', '[]'::json,
      'payments', '[]'::json,
      'previous_readings', json_build_object('electricity_final', 0, 'motor_final', 0)
    );
  END IF;

  RETURN v_result;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_bill_with_details(INTEGER, INTEGER, INTEGER, UUID) TO authenticated;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify the function was created
SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines 
WHERE routine_name = 'get_bill_with_details'
  AND routine_schema = 'public';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Performance optimization deployed successfully!';
  RAISE NOTICE 'The getBillWithDetails query should now run in <100ms instead of 500-600ms';
  RAISE NOTICE 'Key improvements:';
  RAISE NOTICE '- Optimized indexes for bill lookups';
  RAISE NOTICE '- Single RPC function instead of multiple queries';
  RAISE NOTICE '- Covering indexes to eliminate table scans';
END $$;
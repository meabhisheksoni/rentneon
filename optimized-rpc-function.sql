-- Optimized RPC Function for getBillWithDetails
-- This addresses the 500-600ms performance issue by using a single optimized query

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS get_bill_with_details(INTEGER, INTEGER, INTEGER, UUID);

-- Create optimized version with better query plan
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
  -- Calculate previous month/year efficiently
  IF p_month = 1 THEN
    v_prev_month := 12;
    v_prev_year := p_year - 1;
  ELSE
    v_prev_month := p_month - 1;
    v_prev_year := p_year;
  END IF;

  -- Single optimized query using CTEs and proper joins
  WITH bill_data AS (
    SELECT 
      id,
      user_id,
      renter_id,
      month,
      year,
      rent_amount,
      electricity_enabled,
      electricity_initial_reading,
      electricity_final_reading,
      electricity_multiplier,
      electricity_reading_date,
      electricity_amount,
      motor_enabled,
      motor_initial_reading,
      motor_final_reading,
      motor_multiplier,
      motor_number_of_people,
      motor_reading_date,
      motor_amount,
      water_enabled,
      water_amount,
      maintenance_enabled,
      maintenance_amount,
      total_amount,
      total_payments,
      pending_amount,
      created_at,
      updated_at
    FROM monthly_bills
    WHERE renter_id = p_renter_id
      AND month = p_month
      AND year = p_year
      AND user_id = p_user_id
  ),
  previous_readings AS (
    SELECT 
      COALESCE(electricity_final_reading, 0) as electricity_final,
      COALESCE(motor_final_reading, 0) as motor_final
    FROM monthly_bills
    WHERE renter_id = p_renter_id
      AND month = v_prev_month
      AND year = v_prev_year
      AND user_id = p_user_id
    LIMIT 1
  ),
  bill_expenses AS (
    SELECT 
      bd.id as bill_id,
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
    GROUP BY bd.id
  ),
  bill_payments AS (
    SELECT 
      bd.id as bill_id,
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
    GROUP BY bd.id
  )
  SELECT json_build_object(
    'bill', CASE 
      WHEN bd.id IS NOT NULL THEN row_to_json(bd)
      ELSE NULL
    END,
    'expenses', COALESCE(be.expenses_json, '[]'::json),
    'payments', COALESCE(bp.payments_json, '[]'::json),
    'previous_readings', json_build_object(
      'electricity_final', COALESCE(pr.electricity_final, 0),
      'motor_final', COALESCE(pr.motor_final, 0)
    )
  ) INTO v_result
  FROM bill_data bd
  LEFT JOIN previous_readings pr ON true
  LEFT JOIN bill_expenses be ON be.bill_id = bd.id
  LEFT JOIN bill_payments bp ON bp.bill_id = bd.id;

  -- Handle case where no current bill exists but we need previous readings
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
      'previous_readings', json_build_object(
        'electricity_final', 0,
        'motor_final', 0
      )
    );
  END IF;

  RETURN v_result;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_bill_with_details(INTEGER, INTEGER, INTEGER, UUID) TO authenticated;

-- Test the function (optional - remove in production)
-- SELECT get_bill_with_details(1, 11, 2025, auth.uid());
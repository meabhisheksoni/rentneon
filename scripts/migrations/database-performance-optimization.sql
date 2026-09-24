-- Database Performance Optimization Migration
-- This file creates RPC functions and indexes for optimized database queries

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Composite index for bill lookups (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_monthly_bills_lookup 
ON monthly_bills(user_id, renter_id, year, month);

-- Index for dashboard queries on active renters
CREATE INDEX IF NOT EXISTS idx_renters_active 
ON renters(user_id, is_active) 
WHERE is_active = true;

-- Covering index for expense queries (includes all commonly selected columns)
CREATE INDEX IF NOT EXISTS idx_expenses_bill_covering 
ON additional_expenses(monthly_bill_id) 
INCLUDE (description, amount, date);

-- Covering index for payment queries (includes all commonly selected columns)
CREATE INDEX IF NOT EXISTS idx_payments_bill_covering 
ON bill_payments(monthly_bill_id) 
INCLUDE (amount, payment_date, payment_type, note);

-- ============================================================================
-- RPC FUNCTION: get_bill_with_details
-- ============================================================================
-- Purpose: Fetch complete bill data including expenses, payments, and previous
--          readings in a single query using JSON aggregation
-- Returns: JSON object with bill, expenses, payments, and previous_readings

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
  v_bill_id UUID;
BEGIN
  -- Get the bill data with aggregated expenses and payments
  SELECT json_build_object(
    'bill', (
      SELECT row_to_json(mb)
      FROM (
        SELECT 
          id,
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
      ) mb
    ),
    'expenses', COALESCE((
      SELECT json_agg(
        json_build_object(
          'id', ae.id,
          'description', ae.description,
          'amount', ae.amount,
          'date', ae.date,
          'created_at', ae.created_at
        )
      )
      FROM additional_expenses ae
      WHERE ae.monthly_bill_id = (
        SELECT id FROM monthly_bills
        WHERE renter_id = p_renter_id
          AND month = p_month
          AND year = p_year
          AND user_id = p_user_id
      )
    ), '[]'::json),
    'payments', COALESCE((
      SELECT json_agg(
        json_build_object(
          'id', bp.id,
          'amount', bp.amount,
          'payment_date', bp.payment_date,
          'payment_type', bp.payment_type,
          'note', bp.note,
          'created_at', bp.created_at
        )
      )
      FROM bill_payments bp
      WHERE bp.monthly_bill_id = (
        SELECT id FROM monthly_bills
        WHERE renter_id = p_renter_id
          AND month = p_month
          AND year = p_year
          AND user_id = p_user_id
      )
    ), '[]'::json),
    'previous_readings', COALESCE((
      SELECT json_build_object(
        'electricity_final', COALESCE(prev.electricity_final_reading, 0),
        'motor_final', COALESCE(prev.motor_final_reading, 0)
      )
      FROM monthly_bills prev
      WHERE prev.renter_id = p_renter_id
        AND prev.user_id = p_user_id
        AND (
          (prev.year = p_year AND prev.month = p_month - 1) OR
          (prev.year = p_year - 1 AND prev.month = 12 AND p_month = 1)
        )
      ORDER BY prev.year DESC, prev.month DESC
      LIMIT 1
    ), json_build_object('electricity_final', 0, 'motor_final', 0))
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- ============================================================================
-- RPC FUNCTION: save_bill_complete
-- ============================================================================
-- Purpose: Save bill data, expenses, and payments in a single atomic transaction
-- Returns: JSON object with bill_id, expense_ids, payment_ids, and success flag

CREATE OR REPLACE FUNCTION save_bill_complete(
  p_bill_data JSON,
  p_expenses JSON,
  p_payments JSON,
  p_user_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_bill_id UUID;
  v_expense_ids UUID[];
  v_payment_ids UUID[];
  v_expense JSON;
  v_payment JSON;
  v_new_expense_id UUID;
  v_new_payment_id UUID;
BEGIN
  -- UPSERT the bill (insert or update if exists)
  INSERT INTO monthly_bills (
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
    pending_amount
  ) VALUES (
    p_user_id,
    (p_bill_data->>'renter_id')::INTEGER,
    (p_bill_data->>'month')::INTEGER,
    (p_bill_data->>'year')::INTEGER,
    (p_bill_data->>'rent_amount')::DECIMAL,
    (p_bill_data->>'electricity_enabled')::BOOLEAN,
    (p_bill_data->>'electricity_initial_reading')::INTEGER,
    (p_bill_data->>'electricity_final_reading')::INTEGER,
    (p_bill_data->>'electricity_multiplier')::DECIMAL,
    (p_bill_data->>'electricity_reading_date')::DATE,
    (p_bill_data->>'electricity_amount')::DECIMAL,
    (p_bill_data->>'motor_enabled')::BOOLEAN,
    (p_bill_data->>'motor_initial_reading')::INTEGER,
    (p_bill_data->>'motor_final_reading')::INTEGER,
    (p_bill_data->>'motor_multiplier')::DECIMAL,
    (p_bill_data->>'motor_number_of_people')::INTEGER,
    (p_bill_data->>'motor_reading_date')::DATE,
    (p_bill_data->>'motor_amount')::DECIMAL,
    (p_bill_data->>'water_enabled')::BOOLEAN,
    (p_bill_data->>'water_amount')::DECIMAL,
    (p_bill_data->>'maintenance_enabled')::BOOLEAN,
    (p_bill_data->>'maintenance_amount')::DECIMAL,
    (p_bill_data->>'total_amount')::DECIMAL,
    (p_bill_data->>'total_payments')::DECIMAL,
    (p_bill_data->>'pending_amount')::DECIMAL
  )
  ON CONFLICT (renter_id, month, year)
  DO UPDATE SET
    rent_amount = EXCLUDED.rent_amount,
    electricity_enabled = EXCLUDED.electricity_enabled,
    electricity_initial_reading = EXCLUDED.electricity_initial_reading,
    electricity_final_reading = EXCLUDED.electricity_final_reading,
    electricity_multiplier = EXCLUDED.electricity_multiplier,
    electricity_reading_date = EXCLUDED.electricity_reading_date,
    electricity_amount = EXCLUDED.electricity_amount,
    motor_enabled = EXCLUDED.motor_enabled,
    motor_initial_reading = EXCLUDED.motor_initial_reading,
    motor_final_reading = EXCLUDED.motor_final_reading,
    motor_multiplier = EXCLUDED.motor_multiplier,
    motor_number_of_people = EXCLUDED.motor_number_of_people,
    motor_reading_date = EXCLUDED.motor_reading_date,
    motor_amount = EXCLUDED.motor_amount,
    water_enabled = EXCLUDED.water_enabled,
    water_amount = EXCLUDED.water_amount,
    maintenance_enabled = EXCLUDED.maintenance_enabled,
    maintenance_amount = EXCLUDED.maintenance_amount,
    total_amount = EXCLUDED.total_amount,
    total_payments = EXCLUDED.total_payments,
    pending_amount = EXCLUDED.pending_amount,
    updated_at = NOW()
  RETURNING id INTO v_bill_id;

  -- Delete existing expenses not in the new list
  DELETE FROM additional_expenses
  WHERE monthly_bill_id = v_bill_id
    AND id NOT IN (
      SELECT (value->>'id')::UUID
      FROM json_array_elements(p_expenses)
      WHERE value->>'id' IS NOT NULL AND value->>'id' != 'null'
    );

  -- Delete existing payments not in the new list
  DELETE FROM bill_payments
  WHERE monthly_bill_id = v_bill_id
    AND id NOT IN (
      SELECT (value->>'id')::UUID
      FROM json_array_elements(p_payments)
      WHERE value->>'id' IS NOT NULL AND value->>'id' != 'null'
    );

  -- Initialize arrays
  v_expense_ids := ARRAY[]::UUID[];
  v_payment_ids := ARRAY[]::UUID[];

  -- Process expenses (insert new or update existing)
  FOR v_expense IN SELECT * FROM json_array_elements(p_expenses)
  LOOP
    IF v_expense->>'id' IS NULL OR v_expense->>'id' = 'null' THEN
      -- Insert new expense
      INSERT INTO additional_expenses (
        monthly_bill_id,
        description,
        amount,
        date
      ) VALUES (
        v_bill_id,
        v_expense->>'description',
        (v_expense->>'amount')::DECIMAL,
        (v_expense->>'date')::DATE
      )
      RETURNING id INTO v_new_expense_id;
      v_expense_ids := array_append(v_expense_ids, v_new_expense_id);
    ELSE
      -- Update existing expense
      UPDATE additional_expenses
      SET
        description = v_expense->>'description',
        amount = (v_expense->>'amount')::DECIMAL,
        date = (v_expense->>'date')::DATE
      WHERE id = (v_expense->>'id')::UUID
        AND monthly_bill_id = v_bill_id;
      v_expense_ids := array_append(v_expense_ids, (v_expense->>'id')::UUID);
    END IF;
  END LOOP;

  -- Process payments (insert new or update existing)
  FOR v_payment IN SELECT * FROM json_array_elements(p_payments)
  LOOP
    IF v_payment->>'id' IS NULL OR v_payment->>'id' = 'null' THEN
      -- Insert new payment
      INSERT INTO bill_payments (
        monthly_bill_id,
        amount,
        payment_date,
        payment_type,
        note
      ) VALUES (
        v_bill_id,
        (v_payment->>'amount')::DECIMAL,
        (v_payment->>'payment_date')::DATE,
        v_payment->>'payment_type',
        v_payment->>'note'
      )
      RETURNING id INTO v_new_payment_id;
      v_payment_ids := array_append(v_payment_ids, v_new_payment_id);
    ELSE
      -- Update existing payment
      UPDATE bill_payments
      SET
        amount = (v_payment->>'amount')::DECIMAL,
        payment_date = (v_payment->>'payment_date')::DATE,
        payment_type = v_payment->>'payment_type',
        note = v_payment->>'note'
      WHERE id = (v_payment->>'id')::UUID
        AND monthly_bill_id = v_bill_id;
      v_payment_ids := array_append(v_payment_ids, (v_payment->>'id')::UUID);
    END IF;
  END LOOP;

  -- Return result
  RETURN json_build_object(
    'bill_id', v_bill_id,
    'expense_ids', v_expense_ids,
    'payment_ids', v_payment_ids,
    'success', true
  );
END;
$$;

-- ============================================================================
-- RPC FUNCTION: get_dashboard_summary
-- ============================================================================
-- Purpose: Fetch all dashboard metrics with server-side aggregation
-- Returns: JSON object with active_renters, archived_renters, and metrics

CREATE OR REPLACE FUNCTION get_dashboard_summary(
  p_user_id UUID,
  p_reference_date DATE DEFAULT CURRENT_DATE
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSON;
  v_current_month INTEGER;
  v_current_year INTEGER;
BEGIN
  -- Extract month and year from reference date
  v_current_month := EXTRACT(MONTH FROM p_reference_date);
  v_current_year := EXTRACT(YEAR FROM p_reference_date);

  -- Build the complete dashboard summary
  SELECT json_build_object(
    'active_renters', COALESCE((
      SELECT json_agg(renter_data ORDER BY renter_data->>'name')
      FROM (
        SELECT json_build_object(
          'id', r.id,
          'name', r.name,
          'email', r.email,
          'phone', r.phone,
          'property_address', r.property_address,
          'monthly_rent', r.monthly_rent,
          'move_in_date', r.move_in_date,
          'is_active', r.is_active,
          'created_at', r.created_at
        ) as renter_data
        FROM renters r
        WHERE r.user_id = p_user_id
          AND r.is_active = true
      ) active_renters_subquery
    ), '[]'::json),
    'archived_renters', COALESCE((
      SELECT json_agg(renter_data ORDER BY renter_data->>'name')
      FROM (
        SELECT json_build_object(
          'id', r.id,
          'name', r.name,
          'email', r.email,
          'phone', r.phone,
          'property_address', r.property_address,
          'monthly_rent', r.monthly_rent,
          'move_in_date', r.move_in_date,
          'is_active', r.is_active,
          'created_at', r.created_at
        ) as renter_data
        FROM renters r
        WHERE r.user_id = p_user_id
          AND r.is_active = false
      ) archived_renters_subquery
    ), '[]'::json),
    'metrics', (
      SELECT json_build_object(
        'total_renters', (
          SELECT COUNT(*)
          FROM renters
          WHERE user_id = p_user_id
            AND is_active = true
        ),
        'total_monthly_rent', COALESCE((
          SELECT SUM(monthly_rent)
          FROM renters
          WHERE user_id = p_user_id
            AND is_active = true
        ), 0),
        'pending_amount', COALESCE((
          SELECT SUM(mb.pending_amount)
          FROM monthly_bills mb
          INNER JOIN renters r ON r.id = mb.renter_id
          WHERE mb.user_id = p_user_id
            AND r.is_active = true
            AND mb.pending_amount > 0
        ), 0)
      )
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================
-- Allow authenticated users to execute these functions

GRANT EXECUTE ON FUNCTION get_bill_with_details(INTEGER, INTEGER, INTEGER, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION save_bill_complete(JSON, JSON, JSON, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_dashboard_summary(UUID, DATE) TO authenticated;

-- Add user_id column to existing renters table
ALTER TABLE renters ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id column to monthly_bills table
ALTER TABLE monthly_bills ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Enable Row Level Security
ALTER TABLE renters ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE additional_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_payments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user isolation
-- Renters: Users can only see their own renters
DROP POLICY IF EXISTS "Users can manage their own renters" ON renters;
CREATE POLICY "Users can manage their own renters" ON renters 
  FOR ALL USING (auth.uid() = user_id);

-- Monthly Bills: Users can only see their own bills
DROP POLICY IF EXISTS "Users can manage their own monthly bills" ON monthly_bills;
CREATE POLICY "Users can manage their own monthly bills" ON monthly_bills 
  FOR ALL USING (auth.uid() = user_id);

-- Additional Expenses: Users can only see expenses for their bills
DROP POLICY IF EXISTS "Users can manage their own expenses" ON additional_expenses;
CREATE POLICY "Users can manage their own expenses" ON additional_expenses 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM monthly_bills 
      WHERE monthly_bills.id = additional_expenses.monthly_bill_id 
      AND monthly_bills.user_id = auth.uid()
    )
  );

-- Bill Payments: Users can only see payments for their bills
DROP POLICY IF EXISTS "Users can manage their own payments" ON bill_payments;
CREATE POLICY "Users can manage their own payments" ON bill_payments 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM monthly_bills 
      WHERE monthly_bills.id = bill_payments.monthly_bill_id 
      AND monthly_bills.user_id = auth.uid()
    )
  );
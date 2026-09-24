-- Update renters table to include user_id for multi-user support
ALTER TABLE renters ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Monthly Bills Table (only create if it doesn't exist)
CREATE TABLE IF NOT EXISTS monthly_bills (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  renter_id INTEGER REFERENCES renters(id) ON DELETE CASCADE,
  month INTEGER NOT NULL, -- 1-12
  year INTEGER NOT NULL,
  rent_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  
  -- Electricity data
  electricity_enabled BOOLEAN DEFAULT FALSE,
  electricity_initial_reading INTEGER DEFAULT 0,
  electricity_final_reading INTEGER DEFAULT 0,
  electricity_multiplier DECIMAL(5,2) DEFAULT 9,
  electricity_reading_date DATE,
  electricity_amount DECIMAL(10,2) DEFAULT 0,
  
  -- Motor data
  motor_enabled BOOLEAN DEFAULT FALSE,
  motor_initial_reading INTEGER DEFAULT 0,
  motor_final_reading INTEGER DEFAULT 0,
  motor_multiplier DECIMAL(5,2) DEFAULT 9,
  motor_number_of_people INTEGER DEFAULT 2,
  motor_reading_date DATE,
  motor_amount DECIMAL(10,2) DEFAULT 0,
  
  -- Water data
  water_enabled BOOLEAN DEFAULT FALSE,
  water_amount DECIMAL(10,2) DEFAULT 0,
  
  -- Maintenance data
  maintenance_enabled BOOLEAN DEFAULT FALSE,
  maintenance_amount DECIMAL(10,2) DEFAULT 0,
  
  -- Totals
  total_amount DECIMAL(10,2) DEFAULT 0,
  total_payments DECIMAL(10,2) DEFAULT 0,
  pending_amount DECIMAL(10,2) DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(renter_id, month, year)
);

-- Additional Expenses Table (only create if it doesn't exist)
CREATE TABLE IF NOT EXISTS additional_expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  monthly_bill_id UUID REFERENCES monthly_bills(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bill Payments Table (different from existing payments table)
CREATE TABLE IF NOT EXISTS bill_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  monthly_bill_id UUID REFERENCES monthly_bills(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  payment_date DATE DEFAULT CURRENT_DATE,
  payment_type TEXT CHECK (payment_type IN ('cash', 'online')) DEFAULT 'cash',
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance (only create if they don't exist)
CREATE INDEX IF NOT EXISTS idx_monthly_bills_renter_date ON monthly_bills(renter_id, year, month);
CREATE INDEX IF NOT EXISTS idx_additional_expenses_bill ON additional_expenses(monthly_bill_id);
CREATE INDEX IF NOT EXISTS idx_bill_payments_bill ON bill_payments(monthly_bill_id);

-- RLS Policies (Row Level Security) - User isolation
ALTER TABLE renters ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE additional_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_payments ENABLE ROW LEVEL SECURITY;

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

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_monthly_bills_updated_at 
    BEFORE UPDATE ON monthly_bills 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://kxktdehjjmadjcevghgx.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4a3RkZWhqam1hZGpjZXZnaGd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5OTM0NDIsImV4cCI6MjA3NDU2OTQ0Mn0.6JB06MofxGN3TQpN1MMgO2PQg7wp-MJlgMiwkUOPBJc'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
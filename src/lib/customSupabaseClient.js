import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://neswuuicqesslduqwzck.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5lc3d1dWljcWVzc2xkdXF3emNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3NDk5NDAsImV4cCI6MjA3NTMyNTk0MH0.NNXBeZlryJcPpszrPk6K24GO1Wh70PgsGhZTC6iBurQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
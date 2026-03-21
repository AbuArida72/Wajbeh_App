import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://zbhjqfoaxgyvoehqekfi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpiaGpxZm9heGd5dm9laHFla2ZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxMTY3MTEsImV4cCI6MjA4OTY5MjcxMX0.Wk7PkWg8lqTS2xpn8TVAxhv92j1Ks9EevICuRFJR47A';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
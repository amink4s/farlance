// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/supabase-js';

// This is the actual Supabase client instance
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
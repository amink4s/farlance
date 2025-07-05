// lib/supabase/client.ts
import { createClient } from '@supabase/supabase-js'; // Changed import here

export const supabase = createClient( // Changed function call here
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
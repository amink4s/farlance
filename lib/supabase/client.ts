// lib/supabase/client.ts
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client only if window (browser environment) is defined.
// During Next.js server-side prerendering, window is undefined, so `supabase` will be null.
// This prevents "supabaseUrl is required" errors during build time.
export const supabase = typeof window !== 'undefined'
  ? createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  : null; // Export null when running on the server (during build/prerender)
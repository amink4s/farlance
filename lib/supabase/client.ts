// lib/supabase/client.ts
// This file initializes and exports a Supabase client instance for client-side usage.
// It does NOT need a "use client" directive itself, as it's not a React component.

import { createClient } from '@supabase/supabase-js'; // Use createClient from the base package

// Ensure environment variables are loaded (though Next.js handles this for NEXT_PUBLIC_)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Create and export the Supabase client instance
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
// Removed: import { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/cookies';

export function createClient() {
  // Cast cookies() result to 'any' to bypass volatile internal Next.js type definitions.
  // This tells TypeScript to not worry about its specific methods here.
  const cookieStore: any = cookies(); // <--- MODIFIED LINE

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          // This should now pass type check due to `any` cast on cookieStore
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch (e) {
            console.warn('Failed to set cookie in createClient server:', e);
          }
        },
      },
    }
  );
}
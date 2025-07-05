// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
// Import the specific type for the cookies object
import { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/cookies';

export function createClient() {
  // Cast the result of cookies() to its expected type: ReadonlyRequestCookies.
  // This tells TypeScript that this object will have the getAll() and set() methods.
  const cookieStore = cookies() as ReadonlyRequestCookies;

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          // Now TypeScript knows cookieStore is a ReadonlyRequestCookies object
          // and expects getAll() to exist synchronously on it.
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch (e) {
            // The `cookies()` may not be readable yet in a Server Action.
            // This error is caught and handled by the `short` or `long`
            // callbacks in `middleware.ts`
            console.warn('Failed to set cookie in createClient server:', e);
          }
        },
      },
    }
  );
}
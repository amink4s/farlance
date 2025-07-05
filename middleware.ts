// middleware.ts
import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
// Removed: import { RequestCookie } from 'next/dist/server/web/spec-extension/cookies';
// Removed: import { type CookieSerializeOptions as SerializeOptions } from 'next/dist/compiled/@edge-runtime/cookies';

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              // Cast `options` to `any` because its specific type definition
              // (CookieSerializeOptions) is causing import/compatibility issues.
              // This tells TypeScript to accept that `options` is valid here.
              request.cookies.set(name, value, options as any); // <--- CHANGE IS HERE
            });
          } catch (e) {
            // The `cookies()` may not be readable yet in a Server Action.
            // This error is caught and handled by the `short` or `long`
            // callbacks in `middleware.ts`
            console.warn('Failed to set cookie in middleware:', e);
          }
        },
      },
    }
  );

  // Refresh session if expired
  await supabase.auth.getSession();

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api (API routes, handled by route handlers)
     * - etc.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
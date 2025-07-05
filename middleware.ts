// middleware.ts
import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
// No need to import `cookies` directly from 'next/headers' here
// as createServerClient handles cookie access via the request/response objects.

export async function middleware(request: NextRequest) {
  // Create a clone of the response so we can modify its cookies.
  // This is crucial for Supabase session management in Next.js middleware.
  const response = NextResponse.next({
    request: {
      headers: request.headers, // Maintain request headers for next handler
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll(); // Read cookies from the incoming request
        },
        // This `setAll` method is a callback provided by Supabase's `createServerClient`.
        // It tells *our* middleware how to apply cookies to the response.
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              // The crucial change: Use `response.cookies.set` to apply cookies.
              // This method correctly accepts name, value, and options object.
              response.cookies.set(name, value, options as any); // Cast options to any to bypass volatile type issues
            });
          } catch (e) {
            // Catch errors if cookies cannot be set (e.g., during Server Actions before response is ready)
            console.warn('Failed to set cookie in middleware response:', e);
          }
        },
      },
    }
  );

  // Refresh session. This call will internally trigger the `setAll` callback above
  // if Supabase needs to set new session cookies.
  await supabase.auth.getSession();

  // Return the modified response object.
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
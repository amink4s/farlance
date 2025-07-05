// app/api/auth/route.ts
// This API route handles authentication by validating the Quick Auth JWT.
// It will return the Farcaster user's data and manage its Supabase profile.

import { createClient as createQuickAuthClient, Errors } from '@farcaster/quick-auth';
import { NextResponse } from 'next/server';
import { headers } from 'next/headers'; // For accessing Authorization header
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server'; // Server-side Supabase client
import { NeynarAPIClient, Configuration } from "@neynar/nodejs-sdk"; // To fetch additional user info

// Initialize Farcaster Quick Auth client
const quickAuthClient = createQuickAuthClient();

// Initialize Neynar API client for resolving more user data
// Ensure NEYNAR_API_KEY is set in Vercel environment variables for server-side access
const neynarClient = new NeynarAPIClient(new Configuration({
  apiKey: process.env.NEYNAR_API_KEY!,
}));

// This function resolves additional user info using Neynar's API
async function resolveFarcasterUser(fid: number) {
  try {
    // Use Neynar to get hydrated user profile data (username, display_name, pfp_url)
    const { users } = await neynarClient.fetchBulkUsers({ fids: [fid] });
    if (users && users.length > 0) {
      const user = users[0];
      return {
        fid: user.fid,
        username: user.username,
        display_name: user.display_name,
        pfp_url: user.pfp_url, // Neynar provides this field
        // Add any other relevant fields you need from Neynar's user object
      };
    }
    return null;
  } catch (error) {
    console.error("Error resolving user with Neynar:", error);
    return null;
  }
}

export async function GET(request: Request) {
  // Await the headers() function to get the actual Headers object
  const authHeader = (await headers()).get('Authorization'); // <--- MODIFIED LINE

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ message: 'Missing token' }, { status: 401 });
  }

  const token = authHeader.split(' ')[1];
  const host = request.headers.get('host'); // request.headers is typically synchronous, so no await needed here

  if (!host) {
    return NextResponse.json({ message: 'Host header missing' }, { status: 400 });
  }

  try {
    // Validate the JWT token received from Quick Auth
    const payload = await quickAuthClient.verifyJwt({
      token: token,
      // The domain must match your app's domain (e.g., farlance.vercel.app)
      // Ensure NEXT_PUBLIC_URL is correctly set in Vercel.
      domain: new URL(process.env.NEXT_PUBLIC_URL!).hostname,
    });

    // Payload.sub contains the Farcaster ID (FID) of the authenticated user
    const fid = payload.sub;

    // Initialize server-side Supabase client
    const supabase = createSupabaseServerClient();

    // Resolve additional user info using Neynar (for display data)
    const farcasterUser = await resolveFarcasterUser(fid);

    if (!farcasterUser) {
      return NextResponse.json({ message: 'Farcaster user data not found from Neynar' }, { status: 404 });
    }

    // Check if user profile exists in our Supabase DB, if not, create it
    const { data: existingProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('fid', farcasterUser.fid)
      .single();

    if (fetchError && fetchError.code === 'PGRST116') { // Supabase error code for "no rows found"
      // No profile found, create a new one in Supabase
      console.log(`Creating new Supabase profile for FID: ${farcasterUser.fid}`);
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          fid: farcasterUser.fid,
          username: farcasterUser.username || null,
          display_name: farcasterUser.display_name || null,
          // If you added 'pfp_url' to your Supabase profiles table, you'd add it here:
          // pfp_url: farcasterUser.pfp_url || null,
        })
        .select()
        .single();

      if (createError) {
        console.error("Error creating profile in Supabase:", createError);
        return NextResponse.json({ message: 'Error creating profile' }, { status: 500 });
      } else if (newProfile) {
        return NextResponse.json({ user: farcasterUser, profile: newProfile }, { status: 200 });
      }
    } else if (fetchError) {
      console.error("Error fetching profile from Supabase:", fetchError);
      return NextResponse.json({ message: 'Error fetching profile' }, { status: 500 });
    } else if (existingProfile) {
      // Existing profile found, return it
      console.log(`Existing Supabase profile fetched for FID: ${existingProfile.fid}`);
      return NextResponse.json({ user: farcasterUser, profile: existingProfile }, { status: 200 });
    }

    // Fallback in case none of the above branches return (should not be reached)
    return NextResponse.json({ message: 'Authentication process incomplete or unknown error' }, { status: 500 });

  } catch (e) {
    if (e instanceof Errors.InvalidTokenError) {
      console.info('Invalid Quick Auth token:', e.message);
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }
    console.error('Unhandled Quick Auth error:', e);
    return NextResponse.json({ message: 'Authentication failed' }, { status: 500 });
  }
}
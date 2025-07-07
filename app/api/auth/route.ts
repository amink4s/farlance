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
const neynarClient = new NeynarAPIClient(new Configuration({
  apiKey: process.env.NEYNAR_API_KEY!, // Use your server-side Neynar API key
}));

// This function resolves additional user info using Neynar's API
async function resolveFarcasterUser(fid: number) {
  try {
    const { users } = await neynarClient.fetchBulkUsers({ fids: [fid] });
    if (users && users.length > 0) {
      const user = users[0];
      return {
        fid: user.fid,
        username: user.username,
        display_name: user.display_name,
        pfp_url: user.pfp_url, // Neynar provides this field
      };
    }
    return null;
  } catch (error) {
    console.error("Error resolving user with Neynar:", error);
    return null;
  }
}

export async function GET(request: Request) {
  const authHeader = (await headers()).get('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ message: 'Missing token' }, { status: 401 });
  }

  const token = authHeader.split(' ')[1];
  const host = request.headers.get('host');

  if (!host) {
    return NextResponse.json({ message: 'Host header missing' }, { status: 400 });
  }

  try {
    const payload = await quickAuthClient.verifyJwt({
      token: token,
      domain: new URL(process.env.NEXT_PUBLIC_URL!).hostname,
    });

    const fid = payload.sub;
    const supabase = createSupabaseServerClient();
    const farcasterUser = await resolveFarcasterUser(fid);

    if (!farcasterUser) {
      return NextResponse.json({ message: 'Farcaster user data not found from Neynar' }, { status: 404 });
    }

    // Check if user profile exists in our Supabase DB
    const { data: existingProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('fid', farcasterUser.fid)
      .single();

    if (fetchError && fetchError.code === 'PGRST116') {
      // No profile found, create a new one
      console.log(`Creating new Supabase profile for FID: ${farcasterUser.fid}`);
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          fid: farcasterUser.fid,
          username: farcasterUser.username || null,
          display_name: farcasterUser.display_name || null,
          pfp_url: farcasterUser.pfp_url || null, // NEW: Add pfp_url here for new profiles
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
      // Existing profile found: Update its pfp_url if it's different or missing
      if (existingProfile.pfp_url !== farcasterUser.pfp_url) {
        console.log(`Updating pfp_url for existing profile FID: ${farcasterUser.fid}`);
        const { data: updatedProfile, error: updateError } = await supabase
          .from('profiles')
          .update({ pfp_url: farcasterUser.pfp_url || null })
          .eq('id', existingProfile.id)
          .select() // Select the updated profile to return
          .single();

        if (updateError) {
          console.error("Error updating existing profile pfp_url:", updateError);
          // Don't fail auth, but log the error
          // Return the old existing profile if update failed
          return NextResponse.json({ user: farcasterUser, profile: existingProfile }, { status: 200 });
        } else if (updatedProfile) {
          // Return the newly updated profile
          return NextResponse.json({ user: farcasterUser, profile: updatedProfile }, { status: 200 });
        }
      }
      // Return existing profile if pfp_url is already up-to-date
      return NextResponse.json({ user: farcasterUser, profile: existingProfile }, { status: 200 });
    }

    // Fallback
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
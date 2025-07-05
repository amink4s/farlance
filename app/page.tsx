// app/page.tsx
"use client"; // This directive is necessary for client-side hooks and components

// NEW: Import Farcaster SDK for quickAuth and actions.ready()
import { sdk } from "@farcaster/frame-sdk";

import { useEffect, useMemo, useState, useCallback } from "react";
import { Button, Icon, Card } from "./components/ui/shared"; // Your shared UI components
import { supabase } from '@/lib/supabase/client'; // Import the Supabase client INSTANCE
import Image from 'next/image'; // Used for displaying Farcaster PFP

// Define types for data received from /api/auth and your Supabase profile
type FarcasterUserAuth = {
  fid: number;
  username: string;
  display_name: string;
  pfp_url: string;
};

type SupabaseProfile = {
  id: string; // UUID from Supabase
  fid: number; // Farcaster ID
  username?: string | null;
  display_name?: string | null;
  bio?: string | null;
  contact_info?: string | null;
  created_at: string;
};

// Define a combined type for the authenticated user data
type AuthenticatedUserData = {
  user: FarcasterUserAuth;
  profile: SupabaseProfile;
};

export default function App() {
  const [authenticatedData, setAuthenticatedData] = useState<AuthenticatedUserData | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true); // Tracks initial authentication and profile load

  // The supabaseClient instance is now imported directly
  const supabaseClient = supabase;

  // Effect to tell Farcaster SDK that the app is ready to be displayed
  useEffect(() => {
    const signalReady = async () => {
      if (sdk) { // Simply check if sdk object exists before using it
        await sdk.actions.ready();
        console.log("Farcaster Mini App signaled ready.");
      }
    };
    signalReady();
  }, []); // Run once on mount

  // Effect to perform Quick Auth and fetch/create profile
  useEffect(() => {
    async function authenticateAndLoadProfile() {
      setLoadingAuth(true);
      try {
        // 1. Attempt Quick Auth to get a session token and fetch user data from our backend
        // This will automatically handle getting the token and adding Authorization header
        const res = await sdk.quickAuth.fetch('/api/auth'); // Call our backend auth route

        if (res.ok) {
          const data: AuthenticatedUserData = await res.json();
          setAuthenticatedData(data);
          console.log("Quick Auth successful. User and profile data:", data);
        } else {
          // If auth fails (e.g., no token, invalid token), set authenticatedData to null
          console.error("Quick Auth failed:", res.status, await res.text());
          setAuthenticatedData(null);
        }
      } catch (error) {
        console.error("Error during Quick Auth or profile fetch:", error);
        setAuthenticatedData(null); // Clear auth data on error
      } finally {
        setLoadingAuth(false); // Authentication attempt finished
      }
    }

    // Call the authentication and profile loading function
    authenticateAndLoadProfile();

    // The effect runs once on mount. If user logs out (not implemented yet),
    // we would need a way to trigger this again or clear state.
  }, []); // Empty dependency array: runs once on component mount

  // UI Render Logic
  return (
    <div className="flex flex-col min-h-screen font-sans text-[var(--app-foreground)] mini-app-theme from-[var(--app-background)] to-[var(--app-gray)]">
      <div className="w-full max-w-md mx-auto px-4 py-3">
        <header className="flex justify-between items-center mb-3 h-11">
          {/* Removed NeynarAuthButton, as Quick Auth handles authentication implicitly */}
          {/* The user will ideally be "signed in" automatically or prompted by Farcaster client */}
          <div className="flex items-center space-x-2">
            {/* You could add a custom "Sign Out" button here later if needed */}
          </div>
        </header>

        <main className="flex-1">
          {loadingAuth ? (
            <Card title="Connecting to Farcaster...">
              <p className="text-[var(--app-foreground-muted)]">Please wait while we connect your Farcaster identity.</p>
            </Card>
          ) : !authenticatedData ? ( // If authentication failed or no data
            <Card title="Welcome to Farlance">
              <p className="text-[var(--app-foreground-muted)] mb-4">
                Please ensure you are viewing this Mini App in a Farcaster client (like Warpcast) to sign in automatically.
              </p>
              {/* Optionally add a button to trigger explicit Quick Auth if needed later */}
            </Card>
          ) : ( // User is authenticated and data is loaded
            <Card title="Your Farlance Profile">
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  {authenticatedData.user.pfp_url && ( // Display Farcaster Profile Picture
                    <Image
                      src={authenticatedData.user.pfp_url}
                      alt="Farcaster Profile Picture"
                      width={64}
                      height={64}
                      className="rounded-full"
                    />
                  )}
                  <div>
                    <p className="text-xl font-bold">{authenticatedData.user.display_name || authenticatedData.user.username || 'Unnamed Farcaster'}</p>
                    <p className="text-[var(--app-foreground-muted)] text-sm">@{authenticatedData.user.username || 'N/A'}</p>
                    <p className="text-[var(--app-foreground-muted)] text-sm">FID: {authenticatedData.user.fid}</p>
                  </div>
                </div>
                <p className="text-[var(--app-foreground-muted)]">
                  {authenticatedData.profile.bio || 'No custom bio provided yet. Add it in Edit Profile.'}
                </p>
                {authenticatedData.profile.contact_info && (
                  <p className="text-[var(--app-foreground-muted)]">
                    Contact: {authenticatedData.profile.contact_info}
                  </p>
                )}
                <p className="text-[var(--app-foreground-muted)] text-xs">
                  Supabase Profile ID: {authenticatedData.profile.id}
                </p>

                <Button variant="primary" size="md" onClick={() => alert('Edit profile functionality coming soon!')}>
                  Edit Profile & Skills
                </Button>
              </div>
            </Card>
          )}
        </main>

        {/* Simple footer message */}
        <footer className="mt-2 pt-4 flex justify-center">
           <span className="text-[var(--app-foreground-muted)] text-xs">
             Farlance: Built for Farcaster
           </span>
        </footer>
      </div> {/* Closing div for w-full max-w-md mx-auto px-4 py-3 */}
    </div> // Closing div for flex flex-col min-h-screen ...
  );
}
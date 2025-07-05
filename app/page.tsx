// app/page.tsx
"use client"; // This directive is necessary for client-side hooks and components

// REMOVE OnchainKit/MiniKit specific imports
// import { useMiniKit, useAddFrame, useOpenUrl } from "@coinbase/onchainkit/minikit";
// import { Name, Identity, Address, Avatar, EthBalance } from "@coinbase/onchainkit/identity";
// import { ConnectWallet, Wallet, WalletDropdown, WalletDropdownDisconnect } from "@coinbase/onchainkit/wallet";

// NEW: Import Neynar SIWN components and hooks
import { NeynarAuthButton, useNeynarContext } from "@neynar/react";

import { useEffect, useMemo, useState, useCallback } from "react";
import { Button, Icon, Card } from "./components/ui/shared"; // Your shared UI components
import { supabase } from '@/lib/supabase/client'; // Import the Supabase client INSTANCE
import Image from 'next/image'; // Used for displaying Farcaster PFP

// Define a type for your profile data based on your Supabase table schema
type Profile = {
  id: string; // UUID from Supabase
  fid: number; // Farcaster ID (bigint in DB, number in JS)
  username?: string | null;
  display_name?: string | null;
  bio?: string | null;
  contact_info?: string | null;
  created_at: string; // TIMESTAMP WITH TIME ZONE
  // If you added pfp_url to your Supabase profiles table for storage, you could add it here:
  // pfp_url?: string | null;
};

export default function App() {
  // Replace useMiniKit with useNeynarContext
  const { user, isAuthenticated } = useNeynarContext(); // user contains fid, username, displayName, pfpUrl if authenticated

  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // The Supabase client instance is now imported directly
  const supabaseClient = supabase;

  // The frameReady, addFrame, openUrl hooks and related state/memos/callbacks are removed as they were MiniKit specific.
  // The NeynarAuthButton handles all the authentication.
  // The "Save Frame" button functionality is also removed for simplicity with Neynar SIWN.

  // Define the async function for profile management using useCallback to memoize it
  const getOrCreateProfile = useCallback(async () => {
    // Access properties directly from `user` object from useNeynarContext.
    // No `(as any)` needed here, as Neynar's `user` object is typed to contain these.
    const fId = user?.fid;
    const userName = user?.username;
    const displayName = user?.displayName;
    const pfpUrl = user?.pfpUrl;

    if (fId && supabaseClient) { // CRITICAL: Only proceed if fId AND supabaseClient are valid
      setLoadingProfile(true);
      try {
        // 1. Attempt to fetch an existing profile from the 'profiles' table
        const { data: existingProfile, error: fetchError } = await supabaseClient
          .from('profiles')
          .select('*')
          .eq('fid', fId)
          .single();

        if (fetchError && fetchError.code === 'PGRST116') { // 'PGRST116' is Supabase's error code for "no rows found"
          // 2. If no profile exists, create a new one
          console.log("No existing profile found, creating new Farlance profile...");
          const { data: newProfile, error: createError } = await supabaseClient
            .from('profiles')
            .insert({
              fid: fId,
              username: userName || null,
              display_name: displayName || null,
              // If you added a 'pfp_url' column to your Supabase profiles table, you could add it here:
              // pfp_url: pfpUrl || null,
            })
            .select()
            .single();

          if (createError) {
            console.error("Error creating profile:", createError);
            // TODO: Implement user-facing error message here
          } else if (newProfile) {
            console.log("New Farlance profile created:", newProfile);
            setUserProfile(newProfile);
          }
        } else if (fetchError) {
          console.error("Error fetching profile:", fetchError);
        } else if (existingProfile) {
          console.log("Existing Farlance profile fetched:", existingProfile);
          setUserProfile(existingProfile);
        }
      } catch (err) {
        console.error("Unhandled error in getOrCreateProfile:", err);
      } finally {
        setLoadingProfile(false);
      }
    } else if (!isAuthenticated) { // Use isAuthenticated from useNeynarContext
        setLoadingProfile(false);
        setUserProfile(null); // Not authenticated, clear profile
    } else { // This branch handles the case where isAuthenticated is true but user.fid might still be null (e.g., initial state after auth) or supabaseClient is null (server prerender)
        setLoadingProfile(true); // Keep loading, waiting for client-side hydration or user context update
        setUserProfile(null);
    }
  }, [user?.fid, user?.username, user?.displayName, user?.pfpUrl, isAuthenticated, supabaseClient]); // Dependency array: uses properties from `user` and `isAuthenticated`

  // Call the async function inside useEffect.
  useEffect(() => {
    getOrCreateProfile();
  }, [getOrCreateProfile]);

  // Main UI Render for the App component
  return (
    <div className="flex flex-col min-h-screen font-sans text-[var(--app-foreground)] mini-app-theme from-[var(--app-background)] to-[var(--app-gray)]">
      <div className="w-full max-w-md mx-auto px-4 py-3">
        <header className="flex justify-between items-center mb-3 h-11">
          {/* Replace the old Wallet/ConnectWallet UI with NeynarAuthButton */}
          <div className="flex items-center space-x-2">
            <NeynarAuthButton /> {/* This button handles the Farcaster login */}
          </div>
          {/* Removed saveFrameButton as it was MiniKit specific */}
          {/* <div>{saveFrameButton}</div> */}
        </header>

        <main className="flex-1">
          {loadingProfile ? (
            <Card title="Loading Farlance Profile...">
              <p className="text-[var(--app-foreground-muted)]">Please wait while we fetch or create your profile.</p>
            </Card>
          ) : !isAuthenticated ? ( // Check isAuthenticated from useNeynarContext
            <Card title="Welcome to Farlance">
              <p className="text-[var(--app-foreground-muted)] mb-4">
                Please connect your Farcaster wallet to get started.
              </p>
              {/* NeynarAuthButton already provides the login UI */}
            </Card>
          ) : userProfile ? (
            <Card title="Your Farlance Profile">
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  {user?.pfpUrl && ( // Display Farcaster Profile Picture from `user` object
                    <Image
                      src={user.pfpUrl}
                      alt="Farcaster Profile Picture"
                      width={64}
                      height={64}
                      className="rounded-full"
                    />
                  )}
                  <div>
                    <p className="text-xl font-bold">{userProfile.display_name || userProfile.username || 'Unnamed Farcaster'}</p>
                    <p className="text-[var(--app-foreground-muted)] text-sm">@{userProfile.username || 'N/A'}</p>
                    <p className="text-[var(--app-foreground-muted)] text-sm">FID: {userProfile.fid}</p>
                  </div>
                </div>
                <p className="text-[var(--app-foreground-muted)]">
                  {userProfile.bio || 'No custom bio provided yet. Add it in Edit Profile.'}
                </p>
                {userProfile.contact_info && (
                  <p className="text-[var(--app-foreground-muted)]">
                    Contact: {userProfile.contact_info}
                  </p>
                )}
                <p className="text-[var(--app-foreground-muted)] text-xs">
                  Supabase Profile ID: {userProfile.id}
                </p>

                <Button variant="primary" size="md" onClick={() => alert('Edit profile functionality coming soon!')}>
                  Edit Profile & Skills
                </Button>
              </div>
            </Card>
          ) : (
            <Card title="Error">
              <p className="text-red-500">Failed to load or create your Farlance profile. Please try refreshing or contact support.</p>
            </Card>
          )}
        </main>

        <footer className="mt-2 pt-4 flex justify-center">
          {/* Removed OnchainKit specific "Built on Base with MiniKit" button */}
          {/* Re-add a similar button with generic link if desired */}
          {/* <Button
            variant="ghost"
            size="sm"
            className="text-[var(--ock-text-foreground-muted)] text-xs"
            onClick={() => openUrl("https://base.org/builders/minikit")}
          >
            Built on Base with MiniKit
          </Button> */}
        </footer>
      </div> {/* Closing div for w-full max-w-md mx-auto px-4 py-3 */}
    </div> // Closing div for flex flex-col min-h-screen ...
  );
}
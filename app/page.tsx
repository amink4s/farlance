// app/page.tsx
"use client"; // This directive is necessary for client-side hooks and components

// NEW: Import Neynar SIWN components and hooks
import { NeynarAuthButton, useNeynarContext } from "@neynar/react";
// NEW: Import Farcaster SDK for actions.ready()
import { sdk } from "@farcaster/frame-sdk";

import { useEffect, useMemo, useState, useCallback } from "react";
import { Button, Icon, Card } from "./components/ui/shared"; // Your shared UI components
import { supabase } from '@/lib/supabase/client'; // Import the Supabase client INSTANCE
import Image from 'next/image'; // Used for displaying Farcaster PFP

// Define a type for your profile data based on your Supabase table schema
type Profile = {
  id: string; // UUID from Supabase
  fid: number; // Farcaster ID (bigint in DB, number in JS)
  username?: string | null;
  display_name?: string | null; // Corrected to display_name
  bio?: string | null;
  contact_info?: string | null;
  created_at: string; // TIMESTAMP WITH TIME ZONE
  // If you added pfp_url to your Supabase profiles table for storage, you could add it here:
  // pfp_url?: string | null; // Corrected to pfp_url
};

export default function App() {
  const { user, isAuthenticated } = useNeynarContext(); // Neynar user context

  const [frameAdded, setFrameAdded] = useState(false); // State for "Save Frame" button animation (not used currently)

  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const supabaseClient = supabase;

  // Effect to tell Farcaster SDK that the app is ready to be displayed
  // This is crucial for the Mini App to render correctly in Farcaster clients.
  useEffect(() => {
    const signalReady = async () => {
      if (sdk && !sdk.isReady) { // Check if SDK is loaded and not already ready
        await sdk.actions.ready(); // Signal ready
        console.log("Farcaster Mini App signaled ready.");
      }
    };
    signalReady();
  }, []); // Empty dependency array: run once on mount


  // Define the async function for profile management using useCallback to memoize it
  const getOrCreateProfile = useCallback(async () => {
    // Access properties using correct snake_case from `user` object
    const fId = user?.fid;
    const userName = user?.username;
    const display_name = user?.display_name;
    const pfp_url = user?.pfp_url;

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
              display_name: display_name || null,
              // If you added a 'pfp_url' column to your Supabase profiles table, you could add it here:
              // pfp_url: pfp_url || null,
            })
            .select()
            .single();

          if (createError) {
            console.error("Error creating profile:", createError);
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
    } else if (!isAuthenticated) { // If Farcaster user is NOT authenticated
        setLoadingProfile(false);
        setUserProfile(null);
    } else { // This branch handles: authenticated but user.fid might be null initially, or supabaseClient is null (server prerender)
        setLoadingProfile(true); // Keep loading, waiting for client-side hydration or user context update
        setUserProfile(null);
    }
  }, [user?.fid, user?.username, user?.display_name, user?.pfp_url, isAuthenticated, supabaseClient]); // Dependency array

  // Call the async function inside useEffect.
  useEffect(() => {
    getOrCreateProfile();
  }, [getOrCreateProfile]);

  // Main UI Render for the App component
  return (
    <div className="flex flex-col min-h-screen font-sans text-[var(--app-foreground)] mini-app-theme from-[var(--app-background)] to-[var(--app-gray)]">
      <div className="w-full max-w-md mx-auto px-4 py-3">
        <header className="flex justify-between items-center mb-3 h-11">
          {/* NeynarAuthButton handles the Farcaster login/logout UI */}
          <div className="flex items-center space-x-2">
            <NeynarAuthButton />
          </div>
        </header>

        <main className="flex-1">
          {loadingProfile ? (
            <Card title="Loading Farlance Profile...">
              <p className="text-[var(--app-foreground-muted)]">Please wait while we fetch or create your profile.</p>
            </Card>
          ) : !isAuthenticated ? ( // Check isAuthenticated to display login prompt
            <Card title="Welcome to Farlance">
              <p className="text-[var(--app-foreground-muted)] mb-4">
                Please connect your Farcaster wallet to get started.
              </p>
            </Card>
          ) : userProfile ? (
            <Card title="Your Farlance Profile">
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  {user?.pfp_url && ( // Display Farcaster Profile Picture from `user.pfp_url`
                    <Image
                      src={user.pfp_url}
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

        {/* Simple footer message */}
        <footer className="mt-2 pt-4 flex justify-center">
           <span className="text-[var(--app-foreground-muted)] text-xs">
             Farlance: Built for Farcaster
           </span>
        </footer>
      </div> {/* Closing div for w-full max-w-md mx-auto px-4 py-3 */}
    </div> //* Closing div for flex flex-col min-h-screen ... */
  );
}
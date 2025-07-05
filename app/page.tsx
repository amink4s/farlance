// app/page.tsx
"use client";

import { useMiniKit, useAddFrame, useOpenUrl } from "@coinbase/onchainkit/minikit";
import {
  Name,
  Identity,
  Address,
  Avatar,
  EthBalance,
} from "@coinbase/onchainkit/identity";
import {
  ConnectWallet,
  Wallet,
  WalletDropdown,
  WalletDropdownDisconnect,
} from "@coinbase/onchainkit/wallet";

import { useEffect, useMemo, useState, useCallback } from "react";
import { Button, Icon, Card } from "./components/ui/shared"; // Updated import path to shared.tsx
import { createClient as createSupabaseClient } from '@/lib/supabase/client'; // Client-side Supabase client
import Image from 'next/image';

// Define a type for your profile data based on Supabase table
type Profile = {
  id: string; // UUID from Supabase
  fid: number; // Farcaster ID
  username?: string | null;
  display_name?: string | null;
  bio?: string | null;
  contact_info?: string | null;
  created_at: string; // TIMESTAMP WITH TIME ZONE
};

export default function App() {
  const { setFrameReady, isFrameReady, context } = useMiniKit(); // Farcaster context
  const [frameAdded, setFrameAdded] = useState(false); // State for "Save Frame" button
  const addFrame = useAddFrame(); // Hook to add the frame to Farcaster
  const openUrl = useOpenUrl(); // Hook to open external URLs

  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true); // Manages loading state for profile
  const supabase = createSupabaseClient(); // Initialize client-side Supabase client

  // Effect to tell MiniKit that the frame is ready to be displayed
  useEffect(() => {
    if (!isFrameReady) {
      setFrameReady();
    }
  }, [setFrameReady, isFrameReady]);

  // Callback to handle saving the frame to Farcaster
  const handleAddFrame = useCallback(async () => {
    const frameAddedResult = await addFrame();
    setFrameAdded(Boolean(frameAddedResult));
  }, [addFrame]);

  // Memoized button component for saving the frame
  const saveFrameButton = useMemo(() => {
    if (context && !context.client.added) { // If frame is not yet added to client
      return (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleAddFrame}
          className="text-[var(--app-accent)] p-4"
          icon={<Icon name="plus" size="sm" />}
        >
          Save Frame
        </Button>
      );
    }

    if (frameAdded) { // If frame was just added
      return (
        <div className="flex items-center space-x-1 text-sm font-medium text-[#0052FF] animate-fade-out">
          <Icon name="check" size="sm" className="text-[#0052FF]" />
          <span>Saved</span>
        </div>
      );
    }
    return null; // If frame is already added or not applicable
  }, [context, frameAdded, handleAddFrame]);

  // Effect to get or create user profile in Supabase
  useEffect(() => {
    async function getOrCreateProfile() {
      if (context?.fid) { // Only run this logic if a Farcaster user is logged in (has an FID)
        setLoadingProfile(true); // Start loading state
        try {
          // 1. Attempt to fetch an existing profile from Supabase
          const { data: existingProfile, error: fetchError } = await supabase
            .from('profiles')
            .select('*')
            .eq('fid', context.fid)
            .single(); // .single() expects 0 or 1 row

          if (fetchError && fetchError.code === 'PGRST116') { // Supabase specific error code for "no rows found"
            // 2. If no profile exists, create a new one using Farcaster context data
            console.log("No existing profile found, creating new one...");
            const { data: newProfile, error: createError } = await supabase
              .from('profiles')
              .insert({
                fid: context.fid,
                username: context.username || null, // Use Farcaster username
                display_name: context.displayName || null, // Use Farcaster display name
                // Add other Farcaster context fields here if they map to your profile table
                // e.g., pfp_url if you add it to your profile table (recommended)
              })
              .select() // Select the newly created row to return it
              .single(); // Expecting one new row

            if (createError) {
              console.error("Error creating profile:", createError);
              // TODO: Implement user-facing error message
            } else if (newProfile) {
              console.log("New Farlance profile created:", newProfile);
              setUserProfile(newProfile);
            }
          } else if (fetchError) {
            // Handle other types of fetch errors (e.g., network issues, permission errors)
            console.error("Error fetching profile:", fetchError);
            // TODO: Implement user-facing error message
          } else if (existingProfile) {
            // If a profile was found, set it to state
            console.log("Existing Farlance profile fetched:", existingProfile);
            setUserProfile(existingProfile);
          }
        } catch (err) {
          // Catch any unhandled errors during the async operation
          console.error("Unhandled error in getOrCreateProfile:", err);
        } finally {
          setLoadingProfile(false); // End loading state regardless of outcome
        }
      } else {
        // If no Farcaster user is logged in (context.fid is null/undefined)
        setLoadingProfile(false); // Stop loading, show login prompt
        setUserProfile(null); // Clear any old profile data
      }
    }

    getOrCreateProfile();
  }, [context?.fid, supabase]); // Dependency array: re-run when FID changes (user logs in/out) or supabase client instance changes

  // Main UI Render
  return (
    <div className="flex flex-col min-h-screen font-sans text-[var(--app-foreground)] mini-app-theme from-[var(--app-background)] to-[var(--app-gray)]">
      <div className="w-full max-w-md mx-auto px-4 py-3">
        <header className="flex justify-between items-center mb-3 h-11">
          {/* Farcaster/Wallet Identity Display (from original template) */}
          <div>
            <div className="flex items-center space-x-2">
              <Wallet className="z-10">
                <ConnectWallet>
                  <Name className="text-inherit" />
                </ConnectWallet>
                <WalletDropdown>
                  <Identity className="px-4 pt-3 pb-2" hasCopyAddressOnClick>
                    <Avatar />
                    <Name />
                    <Address />
                    <EthBalance />
                  </Identity>
                  <WalletDropdownDisconnect />
                </WalletDropdown>
              </Wallet>
            </div>
          </div>
          {/* "Save Frame" Button (from original template) */}
          <div>{saveFrameButton}</div>
        </header>

        <main className="flex-1">
          {loadingProfile ? (
            // Show loading state while profile is being fetched/created
            <Card title="Loading Farlance Profile...">
              <p className="text-[var(--app-foreground-muted)]">Please wait while we fetch or create your profile.</p>
            </Card>
          ) : !context?.fid ? (
            // Show login prompt if no Farcaster user is logged in
            <Card title="Welcome to Farlance">
              <p className="text-[var(--app-foreground-muted)] mb-4">
                Please connect your Farcaster wallet to get started.
              </p>
              {/* The MiniKitProvider usually handles the actual "Connect Wallet" button within the Frame */}
            </Card>
          ) : userProfile ? (
            // Display user profile if successfully fetched or created
            <Card title="Your Farlance Profile">
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  {context.pfpUrl && ( // Display Farcaster PFP if available from context
                    <Image
                      src={context.pfpUrl}
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
            // Show error if profile could not be loaded/created
            <Card title="Error">
              <p className="text-red-500">Failed to load or create your Farlance profile. Please try refreshing or contact support.</p>
            </Card>
          )}
        </main>

        <footer className="mt-2 pt-4 flex justify-center">
          <Button
            variant="ghost"
            size="sm"
            className="text-[var(--ock-text-foreground-muted)] text-xs"
            onClick={() => openUrl("https://base.org/builders/minikit")}
          >
            Built on Base with MiniKit
          </Button>
        </footer>
      </div>
    </div>
  );
}
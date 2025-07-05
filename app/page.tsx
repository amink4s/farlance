// app/page.tsx
"use client"; // This directive is necessary for client-side hooks and components

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
  const { setFrameReady, isFrameReady, context } = useMiniKit(); // Farcaster context provides user FID, username, etc.
  const [frameAdded, setFrameAdded] = useState(false); // State for "Save Frame" button animation
  const addFrame = useAddFrame(); // Hook to add the frame to Farcaster client
  const openUrl = useOpenUrl(); // Hook to open external URLs

  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true); // Manages loading state for profile fetch/create

  // The Supabase client instance is now imported directly
  // It will be `null` during server-side prerendering due to defensive initialization in lib/supabase/client.ts
  const supabaseClient = supabase;

  // Effect to tell MiniKit that the frame is ready to be displayed
  useEffect(() => {
    if (!isFrameReady) {
      setFrameReady();
    }
  }, [setFrameReady, isFrameReady]);

  // Callback to handle saving the frame to Farcaster
  const handleAddFrame = useCallback(async () => {
    const frameAddedResult = await addFrame(); // Execute the add frame action
    setFrameAdded(Boolean(frameAddedResult)); // Update state based on if it was added
  }, [addFrame]);

  // Memoized button component for saving the frame (Farcaster client integration)
  const saveFrameButton = useMemo(() => {
    // Show "Save Frame" button if the frame is not yet added to the client
    if (context && !(context as any).client?.added) { // Use (context as any) for client.added as well
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

    // Show "Saved" feedback if the addFrame action just completed successfully
    if (frameAdded) {
      return (
        <div className="flex items-center space-x-1 text-sm font-medium text-[#0052FF] animate-fade-out">
          <Icon name="check" size="sm" className="text-[#0052FF]" />
          <span>Saved</span>
        </div>
      );
    }
    return null; // Don't render if already added and not in animation state
  }, [context, frameAdded, handleAddFrame]);

  // Define the async function for profile management using useCallback to memoize it
  const getOrCreateProfile = useCallback(async () => {
    // Use type assertion `as any` to bypass strict type checking for `fid`, `username`, `displayName`, `pfpUrl`
    // This is a workaround because the installed `@farcaster/frame-sdk` version's type definitions
    // might not correctly reflect the runtime properties of the `context` object in this environment.
    const fId = (context as any)?.fid;
    const userName = (context as any)?.username;
    const displayName = (context as any)?.displayName;
    const pfpUrl = (context as any)?.pfpUrl;

    if (fId && supabaseClient) { // CRITICAL: Only proceed if fId AND supabaseClient are valid (not null from server-side prerender)
      setLoadingProfile(true); // Start loading state for profile
      try {
        // 1. Attempt to fetch an existing profile from the 'profiles' table
        const { data: existingProfile, error: fetchError } = await supabaseClient
          .from('profiles')
          .select('*') // Select all columns
          .eq('fid', fId) // Use fId here
          .single(); // Expecting zero or one row

        if (fetchError && fetchError.code === 'PGRST116') { // 'PGRST116' is Supabase's error code for "no rows found"
          // 2. If no profile exists, create a new one
          console.log("No existing profile found, creating new Farlance profile...");
          const { data: newProfile, error: createError } = await supabaseClient
            .from('profiles')
            .insert({
              fid: fId,
              username: userName || null, // Pull from Farcaster context
              display_name: displayName || null, // Pull from Farcaster context
              // If you added a 'pfp_url' column to your Supabase profiles table, you could add it here:
              // pfp_url: pfpUrl || null,
            })
            .select() // Select the newly created row to return its data
            .single(); // Expecting one new row back

          if (createError) {
            console.error("Error creating profile:", createError);
            // TODO: Implement user-facing error message here
          } else if (newProfile) {
            console.log("New Farlance profile created:", newProfile);
            setUserProfile(newProfile); // Set the newly created profile to state
          }
        } else if (fetchError) {
          // Handle other types of errors during fetching (e.g., network issues, database errors)
          console.error("Error fetching profile:", fetchError);
          // TODO: Implement user-facing error message
        } else if (existingProfile) {
          console.log("Existing Farlance profile fetched:", existingProfile);
          setUserProfile(existingProfile);
        }
      } catch (err) {
        console.error("Unhandled error in getOrCreateProfile:", err);
      } finally {
        setLoadingProfile(false); // Always set loading to false when done
      }
    } else if (!fId) { // If Farcaster user is NOT logged in (fId is null/undefined)
        setLoadingProfile(false); // Stop loading, display login prompt
        setUserProfile(null); // Clear profile state
    } else { // This branch handles the case where fId is present but supabaseClient is null (due to server-side prerender)
        setLoadingProfile(true); // Keep loading, waiting for client-side hydration where supabaseClient will be available
        setUserProfile(null); // No profile yet
    }
  }, [context, supabaseClient]); // Dependencies for useCallback: context and supabaseClient. All derived values (fId, userName, etc.) are from context.

  // Call the async function inside useEffect.
  // The useEffect itself is synchronous, but it triggers the memoized async callback.
  useEffect(() => {
    getOrCreateProfile();
  }, [getOrCreateProfile]); // Dependency array for useEffect: re-run when the memoized callback changes (i.e., when its own dependencies change)

  // Main UI Render for the App component
  return (
    <div className="flex flex-col min-h-screen font-sans text-[var(--app-foreground)] mini-app-theme from-[var(--app-background)] to-[var(--app-gray)]">
      <div className="w-full max-w-md mx-auto px-4 py-3">
        <header className="flex justify-between items-center mb-3 h-11">
          {/* Farcaster/Wallet Identity Display (from original template, for user's connected wallet) */}
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
          {/* "Save Frame" Button (Farcaster client integration) */}
          <div>{saveFrameButton}</div>
        </header>

        <main className="flex-1">
          {loadingProfile ? (
            // Display loading state while profile data is being processed
            <Card title="Loading Farlance Profile...">
              <p className="text-[var(--app-foreground-muted)]">Please wait while we fetch or create your profile.</p>
            </Card>
          ) : !((context as any)?.fid) ? ( // Check (context as any)?.fid for displaying initial welcome/login message
            // Display a welcome message and prompt to connect if no Farcaster user is logged in
            <Card title="Welcome to Farlance">
              <p className="text-[var(--app-foreground-muted)] mb-4">
                Please connect your Farcaster wallet to get started.
              </p>
              {/* The MiniKitProvider typically handles the actual "Connect Wallet" button within the Frame UI itself */}
            </Card>
          ) : userProfile ? (
            // Display the user's Farlance profile if successfully loaded or created
            <Card title="Your Farlance Profile">
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  {(context as any)?.pfpUrl && ( // Display Farcaster Profile Picture if available from the context
                    <Image
                      src={(context as any).pfpUrl} // Access pfpUrl directly from context
                      alt="Farcaster Profile Picture"
                      width={64}
                      height={64}
                      className="rounded-full"
                    />
                  )}
                  <div>
                    {/* Display Farcaster display name or username, fallback to generic */}
                    <p className="text-xl font-bold">{userProfile.display_name || userProfile.username || 'Unnamed Farcaster'}</p>
                    <p className="text-[var(--app-foreground-muted)] text-sm">@{userProfile.username || 'N/A'}</p>
                    <p className="text-[var(--app-foreground-muted)] text-sm">FID: {userProfile.fid}</p>
                  </div>
                </div>
                {/* Display custom bio or placeholder */}
                <p className="text-[var(--app-foreground-muted)]">
                  {userProfile.bio || 'No custom bio provided yet. Add it in Edit Profile.'}
                </p>
                {/* Display contact info if available */}
                {userProfile.contact_info && (
                  <p className="text-[var(--app-foreground-muted)]">
                    Contact: {userProfile.contact_info}
                  </p>
                )}
                {/* Display Supabase internal profile ID */}
                <p className="text-[var(--app-foreground-muted)] text-xs">
                  Supabase Profile ID: {userProfile.id}
                </p>

                {/* Button for future Edit Profile & Skills functionality */}
                <Button variant="primary" size="md" onClick={() => alert('Edit profile functionality coming soon!')}>
                  Edit Profile & Skills
                </Button>
              </div>
            </Card>
          ) : (
            // Display a generic error message if profile could not be loaded/created
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
      </div> {/* Closing div for w-full max-w-md mx-auto px-4 py-3 */}
    </div> // Closing div for flex flex-col min-h-screen ...
  );
}
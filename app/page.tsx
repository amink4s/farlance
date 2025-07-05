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
import Image from 'next/image';

// Define a type for your profile data based on your Supabase table schema
type Profile = {
  id: string; // UUID from Supabase
  fid: number; // Farcaster ID (bigint in DB, number in JS)
  username?: string | null;
  display_name?: string | null;
  bio?: string | null;
  contact_info?: string | null;
  created_at: string; // TIMESTAMP WITH TIME ZONE
};

export default function App() {
  const { setFrameReady, isFrameReady, context } = useMiniKit(); // Farcaster context provides user FID, username, etc.
  const [frameAdded, setFrameAdded] = useState(false); // State for "Save Frame" button animation
  const addFrame = useAddFrame(); // Hook to add the frame to Farcaster client
  const openUrl = useOpenUrl(); // Hook to open external URLs

  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true); // Manages loading state for profile fetch/create

  // The Supabase client instance is now imported directly
  // We'll use a local variable `supabaseClient` for clarity
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
    if (context && !context.client.added) {
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

  // Effect to get or create user profile in Supabase
  useEffect(() => {
    async function getOrCreateProfile() {
      if (context?.fid) { // Only run this logic if a Farcaster user is logged in (has an FID in context)
        setLoadingProfile(true); // Start loading state for profile
        try {
          // 1. Attempt to fetch an existing profile from the 'profiles' table
          const { data: existingProfile, error: fetchError } = await supabaseClient
            .from('profiles')
            .select('*') // Select all columns
            .eq('fid', context.fid) // Where FID matches current Farcaster user's FID
            .single(); // Expecting zero or one row

          if (fetchError && fetchError.code === 'PGRST116') { // 'PGRST116' is Supabase's error code for "no rows found"
            // 2. If no profile exists, create a new one
            console.log("No existing profile found, creating new Farlance profile...");
            const { data: newProfile, error: createError } = await supabaseClient
              .from('profiles')
              .insert({
                fid: context.fid,
                username: context.username || null, // Pull from Farcaster context
                display_name: context.displayName || null, // Pull from Farcaster context
                // You can add more Farcaster context fields here if they map to your profile table
                // For example, if you added a 'pfp_url' column: pfp_url: context.pfpUrl || null,
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
            // If an existing profile was found, set it to state
            console.log("Existing Farlance profile fetched:", existingProfile);
            setUserProfile(existingProfile);
          }
        } catch (err) {
          // Catch any unhandled synchronous errors or rejections from promises
          console.error("Unhandled error in getOrCreateProfile:", err);
        } finally {
          setLoadingProfile(false); // Always set loading to false when done
        }
      } else {
        // If no Farcaster user is logged in (context.fid is null/undefined)
        setLoadingProfile(false); // Stop loading, so the "Connect Wallet" prompt can be displayed
        setUserProfile(null); // Clear any old profile data from state
      }
    }

    getOrCreateProfile(); // Call the function when the component mounts or context.fid changes
  }, [context?.fid, supabaseClient]); // Dependency array: re-run this effect when Farcaster FID changes or supabaseClient changes

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
          ) : !context?.fid ? (
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
                  {context.pfpUrl && ( // Display Farcaster Profile Picture if available from the context
                    <Image
                      src={context.pfpUrl}
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
                <p className="text-[var(--app-
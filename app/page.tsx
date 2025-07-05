// app/page.tsx
"use client"; // This directive is necessary for client-side hooks and components

import { sdk } from "@farcaster/frame-sdk";
import { NeynarAuthButton, useNeynarContext } from "@neynar/react";

import { useEffect, useMemo, useState, useCallback } from "react";
import { Button, Icon, Card } from "./components/ui/shared"; // Your shared UI components
import { supabase } from '@/lib/supabase/client'; // Import the Supabase client INSTANCE
import Image from 'next/image'; // Used for displaying Farcaster PFP

import ProfileEditor from './components/ProfileEditor'; // Import the ProfileEditor component
import SkillDisplay from './components/SkillDisplay'; // <--- NEW: Import the SkillDisplay component

// Define types for data received from /api/auth and your Supabase profile
type FarcasterUserAuth = {
  fid: number;
  username: string;
  display_name: string;
  pfp_url: string;
};

type SupabaseProfile = { // Updated to be consistent with Profile type in ProfileEditor.tsx
  id: string; // UUID from Supabase
  fid: number; // Farcaster ID
  username?: string | null;
  display_name?: string | null;
  bio?: string | null;
  contact_info?: string | null;
  created_at: string;
};

type AuthenticatedUserData = {
  user: FarcasterUserAuth;
  profile: SupabaseProfile;
};

export default function App() {
  const { user, isAuthenticated } = useNeynarContext(); // Neynar user context (user is Neynar's INeynarAuthenticatedUser)
  const [authenticatedData, setAuthenticatedData] = useState<AuthenticatedUserData | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  const supabaseClient = supabase;

  const [showProfileEditor, setShowProfileEditor] = useState(false); // State to control ProfileEditor visibility

  // Effect to tell Farcaster SDK that the app is ready to be displayed
  useEffect(() => {
    const signalReady = async () => {
      if (sdk) {
        await sdk.actions.ready();
        console.log("Farcaster Mini App signaled ready.");
      }
    };
    signalReady();
  }, []);

  // Effect to perform Quick Auth and fetch/create profile
  useEffect(() => {
    async function authenticateAndLoadProfile() {
      setLoadingAuth(true);
      try {
        const res = await sdk.quickAuth.fetch('/api/auth');

        if (res.ok) {
          const data: AuthenticatedUserData = await res.json();
          setAuthenticatedData(data);
          console.log("Quick Auth successful. User and profile data:", data);
        } else {
          console.error("Quick Auth failed:", res.status, await res.text());
          setAuthenticatedData(null);
        }
      } catch (error) {
        console.error("Error during Quick Auth or profile fetch:", error);
        setAuthenticatedData(null);
      } finally {
        setLoadingAuth(false);
      }
    }

    authenticateAndLoadProfile();
  }, []);

  // Callback when ProfileEditor saves changes
  const handleProfileSave = useCallback((updatedProfile: SupabaseProfile) => {
    if (authenticatedData) {
      setAuthenticatedData(prev => prev ? { ...prev, profile: updatedProfile } : null);
    }
    setShowProfileEditor(false); // Close the editor after save
  }, [authenticatedData]);

  // Callback to cancel ProfileEditor
  const handleProfileCancel = useCallback(() => {
    setShowProfileEditor(false); // Close the editor
  }, []);

  // Main UI Render Logic
  return (
    <div className="flex flex-col min-h-screen font-sans text-[var(--app-foreground)] mini-app-theme from-[var(--app-background)] to-[var(--app-gray)]">
      <div className="w-full max-w-md mx-auto px-4 py-3">
        <header className="flex justify-between items-center mb-3 h-11">
          <div className="flex items-center space-x-2">
            <NeynarAuthButton />
          </div>
        </header>

        <main className="flex-1">
          {showProfileEditor && authenticatedData ? (
            <ProfileEditor
              userProfile={authenticatedData.profile}
              onSave={handleProfileSave}
              onCancel={handleProfileCancel}
            />
          ) : loadingAuth ? (
            <Card title="Connecting to Farcaster...">
              <p className="text-[var(--app-foreground-muted)]">Please wait while we connect your Farcaster identity.</p>
            </Card>
          ) : !authenticatedData ? (
            <Card title="Welcome to Farlance">
              <p className="text-[var(--app-foreground-muted)] mb-4">
                Please ensure you are viewing this Mini App in a Farcaster client (like Warpcast) to sign in automatically.
              </p>
            </Card>
          ) : ( // User is authenticated and data is loaded, show profile display
            <Card title="Your Farlance Profile">
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  {authenticatedData.user.pfp_url && (
                    <Image
                      src={authenticatedData.user.pfp_url}
                      alt="Farcaster Profile Picture"
                      width={64}
                      height={64}
                      className="rounded-full"
                      unoptimized={true}
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

                {/* Button to open ProfileEditor */}
                <Button variant="primary" size="md" onClick={() => setShowProfileEditor(true)}>
                  Edit Profile & Skills
                </Button>
              </div>
              {/* Display selected skills */}
              {authenticatedData.profile.id && (
                <SkillDisplay profileId={authenticatedData.profile.id} />
              )}
            </Card>
          )}
        </main>

        <footer className="mt-2 pt-4 flex justify-center">
           <span className="text-[var(--app-foreground-muted)] text-xs">
             Farlance: Built for Farcaster
           </span>
        </footer>
      </div>
    </div>
  );
}
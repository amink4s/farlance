// app/page.tsx
"use client";

import { sdk } from "@farcaster/frame-sdk";
import { useNeynarContext } from "@neynar/react"; // Only useNeynarContext
import React, { useEffect, useState, useCallback } from "react";

// Import the new layout and view components
import MainLayout from './components/MainLayout';
import ProfileView from './components/ProfileView';
import JobsView from './components/JobsView';

// Import Supabase client and types
import { supabase } from '@/lib/supabase/client';
// Import Card here, as it's used in this file too
import { Card } from './components/ui/shared'; // <--- NEW: Import Card here

// Define types for data from /api/auth and Supabase
type FarcasterUserAuth = {
  fid: number;
  username: string;
  display_name: string;
  pfp_url: string;
};

type SupabaseProfile = {
  id: string;
  fid: number;
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
  const { user, isAuthenticated } = useNeynarContext(); // Neynar user context
  const [authenticatedData, setAuthenticatedData] = useState<AuthenticatedUserData | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  const supabaseClient = supabase;

  const [activeView, setActiveView] = useState<'jobs' | 'profile'>('jobs'); // State to manage current view

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
      setLoadingAuth(true); // Always start loading when attempting auth
      try {
        // REMOVED CONDITIONAL: Always attempt Quick Auth on component mount.
        // sdk.quickAuth.fetch will handle whether a new token is needed.
        const res = await sdk.quickAuth.fetch('/api/auth'); // Call our backend auth route
  
        if (res.ok) {
          const data: AuthenticatedUserData = await res.json();
          setAuthenticatedData(data);
          console.log("Quick Auth successful. User and profile data:", data);
        } else {
          console.error("Quick Auth failed:", res.status, await res.text());
          // If auth fails, ensure we set authenticatedData to null and show non-auth UI
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
  }, [user?.fid, isAuthenticated]); // Dependencies: user.fid to re-authenticate on login/logout

  // Determine content to show based on auth and loading state
  let contentToRender: React.ReactNode;

  if (loadingAuth) {
    contentToRender = (
      <Card title="Connecting to Farcaster...">
        <p className="text-[var(--app-foreground-muted)]">Please wait while we connect your Farcaster identity.</p>
      </Card>
    );
  } else if (!authenticatedData) {
    contentToRender = (
      <Card title="Welcome to Farlance">
        <p className="text-[var(--app-foreground-muted)] mb-4">
          Please ensure you are viewing this Mini App in a Farcaster client (like Warpcast) to sign in automatically.
        </p>
      </Card>
    );
  } else { // User is authenticated and data is loaded
    if (activeView === 'profile') {
      contentToRender = (
        <ProfileView
          authenticatedUser={authenticatedData.user}
          supabaseProfile={authenticatedData.profile}
          onProfileUpdate={(updatedProfile) => setAuthenticatedData(prev => prev ? { ...prev, profile: updatedProfile } : null)}
        />
      );
    } else { // activeView === 'jobs'
      contentToRender = <JobsView />;
    }
  }

  // MainLayout will wrap all the content and provide the header/footer/navigation
  return (
    <MainLayout
      activeView={activeView}
      setActiveView={setActiveView}
      authenticatedUser={authenticatedData?.user || null}
    >
      {contentToRender}
    </MainLayout>
  );
}
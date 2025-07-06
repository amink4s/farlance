// app/page.tsx
"use client"; // This directive is necessary for client-side hooks and components

// NEW: Import Farcaster SDK for quickAuth and actions.ready()
import { sdk } from "@farcaster/frame-sdk";

import { useEffect, useState, useCallback } from "react"; // Removed useMemo as it's not strictly needed here for now
import { Button, Icon, Card } from "./components/ui/shared"; // Your shared UI components
import { supabase } from '@/lib/supabase/client'; // Import the Supabase client INSTANCE
import Image from 'next/image'; // Used for displaying Farcaster PFP

// Import the new layout and view components
import MainLayout from './components/MainLayout';
import ProfileView from './components/ProfileView';
import JobsView from './components/JobsView';
import JobPostForm from './components/JobPostForm';

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

type AuthenticatedUserData = {
  user: FarcasterUserAuth;
  profile: SupabaseProfile;
};

export default function App() {
  // `user` from useNeynarContext might not be immediately populated.
  // We primarily rely on `sdk.quickAuth.fetch` for `authenticatedData`.
  // Keeping `useNeynarContext` for `isAuthenticated` if needed for overall session.
  const { user, isAuthenticated } = useNeynarContext();

  const [authenticatedData, setAuthenticatedData] = useState<AuthenticatedUserData | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  const supabaseClient = supabase;

  const [activeView, setActiveView] = useState<'jobs' | 'profile' | 'post-job'>('jobs'); // State to manage current view

  // Effect to tell Farcaster SDK that the app is ready to be displayed
  useEffect(() => {
    const signalReady = async () => {
      if (sdk) {
        await sdk.actions.ready();
        console.log("Farcaster Mini App signaled ready.");
      }
    };
    signalReady();
  }, []); // Run once on mount

  // Effect to perform Quick Auth and fetch/create profile
  useEffect(() => {
    async function authenticateAndLoadProfile() {
      setLoadingAuth(true); // Always start loading when attempting auth
      try {
        // Attempt Quick Auth unconditionally on component mount.
        // sdk.quickAuth.fetch will handle whether a new token is needed.
        const res = await sdk.quickAuth.fetch('/api/auth'); // Call our backend auth route

        console.log("Quick Auth Fetch Raw Response:", res); // <--- DEBUG LOG
        console.log("Quick Auth Fetch res.ok:", res.ok);     // <--- DEBUG LOG

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

    // Trigger auth process when component mounts
    authenticateAndLoadProfile();
  }, []); // Empty dependency array: runs once on component mount


  // Callback for when a job is successfully posted
  const handleJobPosted = useCallback(() => {
    setActiveView('jobs'); // Go back to jobs list after posting
    alert('Your job has been posted!');
    // Optionally, could refresh jobs list here later
  }, []);

  // Callback to cancel job posting
  const handleCancelJobPost = useCallback(() => {
    setActiveView('profile'); // Go back to profile view
  }, []);

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
          onPostJob={() => setActiveView('post-job')}
        />
      );
    } else if (activeView === 'post-job') { // Render JobPostForm
      contentToRender = (
        <JobPostForm
          posterId={authenticatedData.profile.id}
          onJobPosted={handleJobPosted}
          onCancel={handleCancelJobPost}
        />
      );
    } else { // activeView === 'jobs' (default)
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
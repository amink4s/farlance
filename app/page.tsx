// app/page.tsx
"use client";

import { sdk } from "@farcaster/frame-sdk";
import React, { useEffect, useState, useCallback } from "react";

import MainLayout from './components/MainLayout';
import ProfileView from './components/ProfileView';
import JobsView from './components/JobsView';
import JobPostForm from './components/JobPostForm';
import TalentView from './components/TalentView';

import { supabase } from '@/lib/supabase/client';
import { Card } from './components/ui/shared';

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
  const [authenticatedData, setAuthenticatedData] = useState<AuthenticatedUserData | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  const supabaseClient = supabase;

  const [activeView, setActiveView] = useState<'jobs' | 'profile' | 'post-job' | 'talent'>('jobs');

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

        console.log("Quick Auth Fetch Raw Response:", res);
        console.log("Quick Auth Fetch res.ok:", res.ok);

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


  // Callback for when a job is successfully posted
  const handleJobPosted = useCallback(() => {
    setActiveView('jobs');
    alert('Your job has been posted!');
  }, []);

  // Callback to cancel job posting
  const handleCancelJobPost = useCallback(() => {
    setActiveView('profile');
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
    } else if (activeView === 'post-job') {
      contentToRender = (
        <JobPostForm
          posterId={authenticatedData.profile.id}
          posterFid={authenticatedData.user.fid} // <--- NEW: Pass posterFid here
          onJobPosted={handleJobPosted}
          onCancel={handleCancelJobPost}
        />
      );
    } else if (activeView === 'talent') {
      contentToRender = <TalentView />;
    } else { // activeView === 'jobs' (default)
      contentToRender = <JobsView />;
    }
  }

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
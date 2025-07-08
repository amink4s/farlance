// app/page.tsx
"use client";

import { sdk } from "@farcaster/frame-sdk";
import React, { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from 'next/navigation';

import MainLayout from './components/MainLayout';
import ProfileView from './components/ProfileView';
import JobsView from './components/JobsView';
import JobPostForm from './components/JobPostForm';
import TalentView from './components/TalentView';
import JobDetails from './components/JobDetails';
import Modal from './components/ui/Modal'; // Keep this import if it's used for JobDetailsModal

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
  pfp_url?: string | null;
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

  // State for Job Details Modal (controlled from app/page.tsx for deep-linking)
  const [isJobDetailsModalOpen, setIsJobDetailsModalOpen] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [initialJobIdFromUrl, setInitialJobIdFromUrl] = useState<string | null>(null);

  // REMOVED: State for Share Profile Modal: const [isShareProfileModalOpen, setIsShareProfileModalOpen] = useState(false);

  const searchParams = useSearchParams();

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

  // Effect to read jobId from URL on initial load and open modal
  useEffect(() => {
    const jobIdParam = searchParams.get('jobId');
    if (jobIdParam && !initialJobIdFromUrl) {
      setInitialJobIdFromUrl(jobIdParam);
      setSelectedJobId(jobIdParam);
      setIsJobDetailsModalOpen(true);
      setActiveView('jobs'); // Ensure 'jobs' view is active when deep-linking to a job
    }
  }, [searchParams, initialJobIdFromUrl]);


  // Callback for when a job is successfully posted
  const handleJobPosted = useCallback(() => {
    setActiveView('jobs');
    alert('Your job has been posted!');
  }, []);

  // Callback to cancel job posting
  const handleCancelJobPost = useCallback(() => {
    setActiveView('profile');
  }, []);

  // Close Job Details Modal (from app/page.tsx)
  const closeJobDetailsModal = useCallback(() => {
    setIsJobDetailsModalOpen(false);
    setSelectedJobId(null);
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.delete('jobId');
    window.history.replaceState({}, '', newUrl.toString());
  }, []);

  // REMOVED: Callback for when profile is saved, to trigger share modal: const handleProfileSavedForShare = useCallback((updatedProfile: SupabaseProfile) => { ... });
  // REMOVED: Close Share Profile Modal: const closeShareProfileModal = useCallback(() => { ... });


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
          // UPDATED: onProfileUpdate just updates state, no share modal trigger here
          onProfileUpdate={(updatedProfile) => setAuthenticatedData(prev => prev ? { ...prev, profile: updatedProfile } : null)}
          onPostJob={() => setActiveView('post-job')}
        />
      );
    } else if (activeView === 'post-job') {
      contentToRender = (
        <JobPostForm
          posterId={authenticatedData.profile.id}
          posterFid={authenticatedData.user.fid}
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
    <Suspense fallback={<div>Loading app...</div>}>
      <MainLayout
        activeView={activeView}
        setActiveView={setActiveView}
        authenticatedUser={authenticatedData?.user || null}
      >
        {contentToRender}

        {/* Job Details Modal (controlled from app/page.tsx) */}
        {isJobDetailsModalOpen && selectedJobId && (
          <Modal isOpen={isJobDetailsModalOpen} onClose={closeJobDetailsModal}>
            <JobDetails jobId={selectedJobId} onClose={closeJobDetailsModal} />
          </Modal>
        )}

        {/* REMOVED: Share Profile Modal conditional rendering */}
        {/* {isShareProfileModalOpen && authenticatedData?.user.username && (
          <Modal isOpen={isShareProfileModalOpen} onClose={closeShareProfileModal}>
            <ShareProfileModal
              username={authenticatedData.user.username}
              appUrl={process.env.NEXT_PUBLIC_URL!}
              onClose={closeShareProfileModal}
            />
          </Modal>
        )} */}
      </MainLayout>
    </Suspense>
  );
}
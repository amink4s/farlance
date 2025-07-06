// components/ProfileView.tsx
"use client";

import React, { useState, useCallback } from 'react';
import Image from 'next/image'; // Keep this import

import { Button, Icon, Card } from "./ui/shared"; // Reusable UI components
import ProfileEditor from './ProfileEditor'; // Import the ProfileEditor component
import SkillDisplay from './SkillDisplay'; // <--- NEW: Import the SkillDisplay component

// Define types for data passed as props
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

type ProfileViewProps = {
  authenticatedUser: FarcasterUserAuth; // Data from Farcaster Quick Auth
  supabaseProfile: SupabaseProfile;   // Data from Supabase profiles table
  onProfileUpdate: (updatedProfile: SupabaseProfile) => void; // Callback for when profile is saved
};

export default function ProfileView({ authenticatedUser, supabaseProfile, onProfileUpdate }: ProfileViewProps) {
  const [showProfileEditor, setShowProfileEditor] = useState(false); // State to control ProfileEditor visibility

  // Callback when ProfileEditor saves changes
  const handleProfileSave = useCallback((updatedProfile: SupabaseProfile) => {
    onProfileUpdate(updatedProfile); // Pass updated profile back to parent (App component)
    setShowProfileEditor(false); // Close the editor after save
  }, [onProfileUpdate]);

  // Callback to cancel ProfileEditor
  const handleProfileCancel = useCallback(() => {
    setShowProfileEditor(false); // Close the editor
  }, []);

  return (
    <div className="flex flex-col min-h-screen font-sans text-[var(--app-foreground)] mini-app-theme from-[var(--app-background)] to-[var(--app-gray)]">
      <div className="w-full max-w-md mx-auto px-4 py-3">
        {/* Main content area within ProfileView */}
        <main className="flex-1">
          {showProfileEditor ? ( // Conditionally render ProfileEditor
            <ProfileEditor
              userProfile={supabaseProfile} // Pass supabaseProfile to editor
              onSave={handleProfileSave}
              onCancel={handleProfileCancel}
            />
          ) : ( // Show profile display
            <Card title="Your Farlance Profile">
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  {authenticatedUser.pfp_url && (
                    <Image
                      src={authenticatedUser.pfp_url}
                      alt="Farcaster Profile Picture"
                      width={64}
                      height={64}
                      className="rounded-full"
                      unoptimized={true}
                    />
                  )}
                  <div>
                    <p className="text-xl font-bold">{authenticatedUser.display_name || authenticatedUser.username || 'Unnamed Farcaster'}</p>
                    <p className="text-[var(--app-foreground-muted)] text-sm">@{authenticatedUser.username || 'N/A'}</p>
                    <p className="text-[var(--app-foreground-muted)] text-sm">FID: {authenticatedUser.fid}</p>
                  </div>
                </div>
                <p className="text-[var(--app-foreground-muted)]">
                  {supabaseProfile.bio || 'No custom bio provided yet. Add it in Edit Profile.'}
                </p>
                {supabaseProfile.contact_info && (
                  <p className="text-[var(--app-foreground-muted)]">
                    Contact: {supabaseProfile.contact_info}
                  </p>
                )}
                <p className="text-[var(--app-foreground-muted)] text-xs">
                  Supabase Profile ID: {supabaseProfile.id}
                </p>

                {/* Button to open ProfileEditor */}
                <Button variant="primary" size="md" onClick={() => setShowProfileEditor(true)}>
                  Edit Profile & Skills
                </Button>
                {/* "Post a Job" button */}
                <Button variant="secondary" size="md" onClick={() => alert('Post a Job functionality coming soon!')}>
                  Post a Job
                </Button>
              </div>
              {/* Display selected skills */}
              {supabaseProfile.id && (
                <SkillDisplay profileId={supabaseProfile.id} />
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
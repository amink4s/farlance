// components/ProfileView.tsx
"use client";

import React, { useState, useCallback } from 'react';
import Image from 'next/image';

import { Button, Icon, Card } from "./ui/shared";
import ProfileEditor from './ProfileEditor';
import SkillDisplay from './SkillDisplay';

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

type ProfileViewProps = {
  authenticatedUser: FarcasterUserAuth;
  supabaseProfile: SupabaseProfile;
  // NEW: onProfileUpdate now takes a direct SupabaseProfile, as it's the updated profile
  // and it will trigger the handleProfileSavedForShare in page.tsx
  onProfileUpdate: (updatedProfile: SupabaseProfile) => void;
  onPostJob: () => void;
};

export default function ProfileView({ authenticatedUser, supabaseProfile, onProfileUpdate, onPostJob }: ProfileViewProps) {
  const [showProfileEditor, setShowProfileEditor] = useState(false);

  // This handleProfileSave now just passes the updatedProfile directly up to onProfileUpdate
  // (which is handleProfileSavedForShare in page.tsx)
  const handleProfileSave = useCallback((updatedProfile: SupabaseProfile) => {
    onProfileUpdate(updatedProfile); // Pass updated profile directly
    setShowProfileEditor(false);
  }, [onProfileUpdate]);

  const handleProfileCancel = useCallback(() => {
    setShowProfileEditor(false);
  }, []);

  return (
    <div className="flex flex-col min-h-screen font-sans text-[var(--app-foreground)] mini-app-theme from-[var(--app-background)] to-[var(--app-gray)]">
      <div className="w-full max-w-md mx-auto px-4 py-3">
        <main className="flex-1">
          {showProfileEditor ? (
            <ProfileEditor
              userProfile={supabaseProfile}
              onSave={handleProfileSave} // This will trigger handleProfileSavedForShare in page.tsx
              onCancel={handleProfileCancel}
            />
          ) : (
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
                  {/* Removed Supabase Profile ID display */}
                </p>

                <Button variant="primary" size="md" onClick={() => setShowProfileEditor(true)}>
                  Edit Profile & Skills
                </Button>
                <Button variant="secondary" size="md" onClick={onPostJob}>
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
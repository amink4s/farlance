// components/ProfileView.tsx
"use client";

import React, { useState, useCallback } from 'react';
import Image from 'next/image';
import { Button, Icon, Card } from "./ui/shared";
import ProfileEditor from './ProfileEditor';
import SkillDisplay from './SkillDisplay';
import { sdk } from "@farcaster/frame-sdk"; // NEW: Import sdk for composeCast

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
  onProfileUpdate: (updatedProfile: SupabaseProfile) => void;
  onPostJob: () => void;
};

export default function ProfileView({ authenticatedUser, supabaseProfile, onProfileUpdate, onPostJob }: ProfileViewProps) {
  const [showProfileEditor, setShowProfileEditor] = useState(false);

  const handleProfileSave = useCallback((updatedProfile: SupabaseProfile) => {
    console.log("ProfileView: Profile saved, calling onProfileUpdate...");
    onProfileUpdate(updatedProfile);
    setShowProfileEditor(false);
  }, [onProfileUpdate]);

  const handleProfileCancel = useCallback(() => {
    setShowProfileEditor(false);
  }, []);

  // NEW: Handle sharing profile to Farcaster
  const handleShareProfileToFarcaster = useCallback(async () => {
    try {
      const appUrl = process.env.NEXT_PUBLIC_URL!; // Get app URL from env
      const castText = `I just updated my Farlance profile as @${authenticatedUser.username || authenticatedUser.display_name}. Find top talent or post jobs for Farcaster freelancers! 🚀 `;
      const castUrl = appUrl;

      await sdk.actions.composeCast({
        text: castText,
        embeds: [castUrl],
      });
      console.log("Farcaster cast composer opened for profile share.");
    } catch (error) {
      console.error("Error composing Farcaster cast for profile share:", error);
      alert("Failed to open Farcaster composer for sharing. Please try again.");
    }
  }, [authenticatedUser]);


  return (
    <div className="flex flex-col min-h-screen font-sans text-[var(--app-foreground)] mini-app-theme from-[var(--app-background)] to-[var(--app-gray)]">
      <div className="w-full max-w-md mx-auto px-4 py-3">
        <main className="flex-1">
          {showProfileEditor ? (
            <ProfileEditor
              userProfile={supabaseProfile}
              onSave={handleProfileSave}
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
                <Button variant="primary" size="md" onClick={() => setShowProfileEditor(true)}>
                  Edit Profile & Skills
                </Button>
                <Button variant="secondary" size="md" onClick={onPostJob}>
                  Post a Job
                </Button>
                {/* NEW: Share Profile Button */}
                <Button variant="ghost" size="md" onClick={handleShareProfileToFarcaster}>
                  Share Profile to Farcaster <Icon name="arrow-right" size="sm" className="ml-2" />
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
// components/TalentDetails.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Button, Card } from './ui/shared';
import { supabase } from '@/lib/supabase/client';
import Image from 'next/image';
import { sdk } from "@farcaster/frame-sdk"; // Keep sdk import for actions.openUrl

// Define Profile type consistent with how it's fetched (including nested skills)
type Profile = {
  id: string;
  fid: number; // Required for recipientFid
  username?: string | null;
  display_name?: string | null;
  bio?: string | null;
  contact_info?: string | null;
  created_at: string;
  pfp_url?: string | null;
  user_skills?: { skills: { id: string; name: string } }[];
};

type TalentDetailsProps = {
  profileId: string;
  onClose: () => void;
};

export default function TalentDetails({ profileId, onClose }: TalentDetailsProps) {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const supabaseClient = supabase;

  useEffect(() => {
    async function fetchTalentDetails() {
      if (!supabaseClient) {
        console.error("Supabase client not initialized for TalentDetails.");
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const { data: profileData, error: profileError } = await supabaseClient
          .from('profiles')
          .select('*, user_skills(skills(id, name))')
          .eq('id', profileId)
          .single();

        if (profileError) {
          console.error("Error fetching talent profile details:", profileError);
          setProfile(null);
        } else {
          setProfile(profileData);
        }
      } catch (error) {
        console.error("Unhandled error fetching talent profile details:", error);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    }

    if (profileId) {
      fetchTalentDetails();
    }
  }, [profileId, supabaseClient]);

  // NEW: Handle opening Warpcast DM composer with pre-filled message
  const handleContactTalent = useCallback(async () => {
    if (!profile?.fid) {
      alert("Cannot contact talent: Farcaster ID not available.");
      return;
    }
    // Construct the Warpcast DM intent URL
    const messageTextEncoded = encodeURIComponent(`Hi ${profile.display_name || profile.username}! I'm interested in your skills on Farlance. Let's connect!`);
    const dmIntentUrl = `https://warpcast.com/~/inbox/create/${profile.fid}?text=${messageTextEncoded}`;

    try {
      // Use sdk.actions.openUrl to open the intent URL.
      // This will open Warpcast's DM composer with the message pre-filled.
      await sdk.actions.openUrl(dmIntentUrl);
      console.log(`Opened Warpcast DM composer for FID ${profile.fid}.`);
      onClose(); // Close the modal after opening composer
    } catch (error) {
      console.error("Error opening Warpcast DM composer:", error);
      alert("Failed to open Farcaster DM composer. Please try again.");
    }
  }, [profile, onClose]);


  if (loading) {
    return (
      <div className="p-4 text-[var(--app-foreground-muted)]">
        Loading talent profile...
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-4 text-red-500">
        Talent profile not found or failed to load.
        <Button variant="secondary" onClick={onClose} className="mt-4">Close</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        {profile.pfp_url && (
          <Image
            src={profile.pfp_url}
            alt={`${profile.display_name || profile.username}'s Profile Picture`}
            width={64}
            height={64}
            className="rounded-full"
            unoptimized={true}
          />
        )}
        <div>
          <h2 className="text-2xl font-bold text-[var(--app-foreground)]">
            {profile.display_name || profile.username || 'Unnamed Farcaster'}
          </h2>
          <p className="text-[var(--app-foreground-muted)] text-md">@{profile.username || 'N/A'}</p>
          <p className="text-[var(--app-foreground-muted)] text-sm">FID: {profile.fid}</p>
        </div>
      </div>

      <p className="text-[var(--app-foreground-muted)] text-md whitespace-pre-wrap">
        {profile.bio || 'No bio provided.'}
      </p>
      {profile.contact_info && (
        <p className="text-[var(--app-foreground)] text-sm">
          <span className="font-semibold">Contact:</span> {profile.contact_info}
        </p>
      )}

      <div className="mt-4">
        <h4 className="text-lg font-semibold text-[var(--app-foreground)] mb-2">Skills:</h4>
        {profile.user_skills && profile.user_skills.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {profile.user_skills.map(us => (
              <span key={us.skills.id} className="bg-[var(--app-accent)] text-[var(--app-background)] text-xs font-medium px-2 py-0.5 rounded-full">
                {us.skills.name}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-[var(--app-foreground-muted)] text-sm">No skills added yet.</p>
        )}
      </div>

      <div className="flex justify-end space-x-3 mt-6">
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
        <Button variant="primary" onClick={handleContactTalent}>
          Contact Talent
        </Button>
      </div>
    </div>
  );
}
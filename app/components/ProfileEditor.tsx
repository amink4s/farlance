// components/ProfileEditor.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Button, Card, Icon } from './ui/shared'; // Reusable UI components
import { supabase } from '@/lib/supabase/client'; // Client-side Supabase client

// Define types matching your Supabase schema
type Profile = {
  id: string;
  fid: number;
  username?: string | null;
  display_name?: string | null;
  bio?: string | null;
  contact_info?: string | null;
  created_at: string;
};

type Skill = {
  id: string;
  name: string;
  description?: string | null;
};

// Props for ProfileEditor component
type ProfileEditorProps = {
  userProfile: Profile; // The current user's profile data
  onSave: (updatedProfile: Profile) => void; // Callback after successful save
  onCancel: () => void; // Callback to close editor
};

export default function ProfileEditor({ userProfile, onSave, onCancel }: ProfileEditorProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [allSkills, setAllSkills] = useState<Skill[]>([]);
  const [selectedSkillIds, setSelectedSkillIds] = useState<Set<string>>(new Set());
  const [bio, setBio] = useState(userProfile.bio || '');
  const [contactInfo, setContactInfo] = useState(userProfile.contact_info || '');

  const supabaseClient = supabase; // Use the imported client instance

  // Fetch all skills and user's selected skills on mount
  useEffect(() => {
    async function fetchSkillsAndUserSkills() {
      if (!supabaseClient) { // Ensure Supabase client is available
        console.error("Supabase client not initialized.");
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Fetch all available skills
        const { data: skillsData, error: skillsError } = await supabaseClient
          .from('skills')
          .select('*');

        if (skillsError) {
          console.error("Error fetching all skills:", skillsError);
          return;
        }
        setAllSkills(skillsData || []);

        // Fetch user's currently selected skills
        const { data: userSkillsData, error: userSkillsError } = await supabaseClient
          .from('user_skills')
          .select('skill_id')
          .eq('user_id', userProfile.id);

        if (userSkillsError) {
          console.error("Error fetching user skills:", userSkillsError);
          return;
        }
        const currentSelectedIds = new Set(userSkillsData?.map(us => us.skill_id) || []);
        setSelectedSkillIds(currentSelectedIds);

      } catch (error) {
        console.error("Unhandled error fetching skills:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchSkillsAndUserSkills();
  }, [userProfile.id, supabaseClient]); // Re-fetch if userProfile.id changes or supabaseClient changes

  // Handle checkbox change for skills
  const handleSkillChange = useCallback((skillId: string, isChecked: boolean) => {
    setSelectedSkillIds(prev => {
      const newSet = new Set(prev);
      if (isChecked) {
        newSet.add(skillId);
      } else {
        newSet.delete(skillId);
      }
      return newSet;
    });
  }, []);

  // Handle saving the profile and skills
  const handleSave = async () => {
    if (!supabaseClient) {
      console.error("Supabase client not initialized for saving.");
      return;
    }

    setSaving(true);
    try {
      // 1. Update user profile (bio, contact_info)
      const { data: updatedProfileData, error: profileUpdateError } = await supabaseClient
        .from('profiles')
        .update({
          bio: bio,
          contact_info: contactInfo,
        })
        .eq('id', userProfile.id)
        .select()
        .single();

      if (profileUpdateError) {
        console.error("Error updating profile:", profileUpdateError);
        alert("Failed to update profile info.");
        return;
      }

      // 2. Sync user_skills
      // Get current skills from DB
      const { data: currentUserSkills, error: fetchCurrentError } = await supabaseClient
        .from('user_skills')
        .select('skill_id')
        .eq('user_id', userProfile.id);

      if (fetchCurrentError) {
        console.error("Error fetching current user skills for sync:", fetchCurrentError);
        alert("Failed to sync skills.");
        return;
      }

      const currentSkillIds = new Set(currentUserSkills?.map(s => s.skill_id) || []);

      const skillsToAdd = Array.from(selectedSkillIds).filter(id => !currentSkillIds.has(id));
      const skillsToRemove = Array.from(currentSkillIds).filter(id => !selectedSkillIds.has(id));

      if (skillsToAdd.length > 0) {
        const { error: insertError } = await supabaseClient
          .from('user_skills')
          .insert(skillsToAdd.map(skill_id => ({ user_id: userProfile.id, skill_id })));
        if (insertError) {
          console.error("Error inserting new user skills:", insertError);
          alert("Failed to add some skills.");
        }
      }

      if (skillsToRemove.length > 0) {
        const { error: deleteError } = await supabaseClient
          .from('user_skills')
          .delete()
          .eq('user_id', userProfile.id)
          .in('skill_id', skillsToRemove); // Delete only the specific skills
        if (deleteError) {
          console.error("Error deleting user skills:", deleteError);
          alert("Failed to remove some skills.");
        }
      }

      alert("Profile and skills updated successfully!");
      onSave(updatedProfileData); // Call the onSave callback with updated profile data

    } catch (error) {
      console.error("Unhandled error during save:", error);
      alert("An unexpected error occurred during save.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card title="Loading Profile Editor...">
        <p className="text-[var(--app-foreground-muted)]">Fetching your profile and skills...</p>
      </Card>
    );
  }

  return (
    <Card title="Edit Your Farlance Profile">
      <div className="space-y-6">
        {/* Basic Profile Info */}
        <div>
          <h4 className="text-lg font-semibold text-[var(--app-foreground)] mb-2">Basic Info</h4>
          <div className="space-y-4">
            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-[var(--app-foreground-muted)]">Bio</label>
              <textarea
                id="bio"
                className="mt-1 block w-full px-3 py-2 bg-[var(--app-card-bg)] border border-[var(--app-card-border)] rounded-lg text-[var(--app-foreground)] placeholder-[var(--app-foreground-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--app-accent)]"
                rows={4}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us about yourself..."
              />
            </div>
            <div>
              <label htmlFor="contactInfo" className="block text-sm font-medium text-[var(--app-foreground-muted)]">Contact Info (e.g., Email, Telegram)</label>
              <input
                type="text"
                id="contactInfo"
                className="mt-1 block w-full px-3 py-2 bg-[var(--app-card-bg)] border border-[var(--app-card-border)] rounded-lg text-[var(--app-foreground)] placeholder-[var(--app-foreground-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--app-accent)]"
                value={contactInfo}
                onChange={(e) => setContactInfo(e.target.value)}
                placeholder="e.g., your@email.com or @yourtelegram"
              />
            </div>
          </div>
        </div>

        {/* Skills Selection */}
        <div>
          <h4 className="text-lg font-semibold text-[var(--app-foreground)] mb-2">Skills</h4>
          <div className="grid grid-cols-2 gap-3">
            {allSkills.map(skill => (
              <div key={skill.id} className="flex items-center">
                <input
                  type="checkbox"
                  id={`skill-${skill.id}`}
                  checked={selectedSkillIds.has(skill.id)}
                  onChange={(e) => handleSkillChange(skill.id, e.target.checked)}
                  className="h-4 w-4 text-[var(--app-accent)] focus:ring-[var(--app-accent)] border-[var(--app-card-border)] rounded"
                />
                <label htmlFor={`skill-${skill.id}`} className="ml-2 text-sm text-[var(--app-foreground-muted)]">
                  {skill.name}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3">
          <Button variant="secondary" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </Card>
  );
}
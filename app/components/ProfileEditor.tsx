// components/ProfileEditor.tsx
"use client";

import React, { useState, useEffect, useCallback, ChangeEvent } from 'react';
import { Button, Card } from './ui/shared';
import { supabase } from '@/lib/supabase/client';

// Define types matching your Supabase schema
type Profile = {
  id: string;
  fid: number;
  username?: string | null;
  display_name?: string | null;
  bio?: string | null;
  contact_info?: string | null;
  created_at: string;
  pfp_url?: string | null;
  portfolio_links?: string | null; // <--- NEW: Added portfolio_links to type
};

type Skill = {
  id: string;
  name: string;
  description?: string | null;
};

// This type will store both the skill ID and its proficiency level
type UserSkillWithLevel = {
  skill_id: string;
  level: number; // 1 to 5
};

type ProfileEditorProps = {
  userProfile: Profile;
  onSave: (updatedProfile: Profile) => void;
  onCancel: () => void;
};

export default function ProfileEditor({ userProfile, onSave, onCancel }: ProfileEditorProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [allSkills, setAllSkills] = useState<Skill[]>([]);

  // State for skills, now including levels
  const [userSkillsWithLevel, setUserSkillsWithLevel] = useState<Map<string, number>>(new Map());
  const [bio, setBio] = useState(userProfile.bio || '');
  const [contactInfo, setContactInfo] = useState(userProfile.contact_info || '');
  const [portfolioLinks, setPortfolioLinks] = useState(userProfile.portfolio_links || ''); // NEW: State for portfolio links

  const supabaseClient = supabase;

  // Fetch all skills and user's selected skills with levels on mount
  useEffect(() => {
    async function fetchSkillsAndUserSkills() {
      if (!supabaseClient) {
        console.error("Supabase client not initialized.");
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const { data: skillsData, error: skillsError } = await supabaseClient
          .from('skills')
          .select('*');

        if (skillsError) {
          console.error("Error fetching all skills:", skillsError);
          return;
        }
        setAllSkills(skillsData || []);

        // Fetch user's currently selected skills and their level
        const { data: userSkillsData, error: userSkillsError } = await supabaseClient
          .from('user_skills')
          .select('skill_id, level') // <--- UPDATED: Also select the 'level'
          .eq('user_id', userProfile.id);

        if (userSkillsError) {
          console.error("Error fetching user skills:", userSkillsError);
          return;
        }
        // Map fetched skills to a Map for easy lookup
        const currentSkillsMap = new Map<string, number>();
        userSkillsData?.forEach(us => {
            currentSkillsMap.set(us.skill_id, us.level || 1); // Default to 1 if level is null
        });
        setUserSkillsWithLevel(currentSkillsMap);

      } catch (error) {
        console.error("Unhandled error fetching skills:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchSkillsAndUserSkills();
  }, [userProfile.id, supabaseClient]);

  // Handle proficiency level change
  const handleLevelChange = useCallback((skillId: string, level: number) => {
    setUserSkillsWithLevel(prev => {
        const newMap = new Map(prev);
        newMap.set(skillId, level);
        return newMap;
    });
  }, []);

  // Handle skill checkbox change
  const handleSkillChange = useCallback((skillId: string, isChecked: boolean) => {
    setUserSkillsWithLevel(prev => {
        const newMap = new Map(prev);
        if (isChecked) {
            newMap.set(skillId, 1); // Default level to 1 if checked
        } else {
            newMap.delete(skillId);
        }
        return newMap;
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
      // 1. Update user profile (bio, contact_info, NEW: portfolio_links)
      const { data: updatedProfileData, error: profileUpdateError } = await supabaseClient
        .from('profiles')
        .update({
          bio: bio,
          contact_info: contactInfo,
          portfolio_links: portfolioLinks, // <--- NEW: Update portfolio_links
        })
        .eq('id', userProfile.id)
        .select()
        .single();

      if (profileUpdateError) {
        console.error("Error updating profile:", profileUpdateError);
        alert("Failed to update profile info.");
        return;
      }

      // 2. Sync user_skills and their levels
      const { data: currentUserSkills, error: fetchCurrentError } = await supabaseClient
        .from('user_skills')
        .select('skill_id, level')
        .eq('user_id', userProfile.id);

      if (fetchCurrentError) {
        console.error("Error fetching current user skills for sync:", fetchCurrentError);
        alert("Failed to sync skills.");
        return;
      }

      const currentSkillsMap = new Map<string, number>();
      currentUserSkills?.forEach(us => currentSkillsMap.set(us.skill_id, us.level || 1));

      const skillsToAdd = Array.from(userSkillsWithLevel.entries()).filter(([id]) => !currentSkillsMap.has(id));
      const skillsToUpdate = Array.from(userSkillsWithLevel.entries()).filter(([id, level]) =>
          currentSkillsMap.has(id) && currentSkillsMap.get(id) !== level
      );
      const skillsToRemove = Array.from(currentSkillsMap.keys()).filter(id => !userSkillsWithLevel.has(id));

      // Insert new skills
      if (skillsToAdd.length > 0) {
        const { error: insertError } = await supabaseClient
          .from('user_skills')
          .insert(skillsToAdd.map(([skill_id, level]) => ({ user_id: userProfile.id, skill_id, level })));
        if (insertError) {
          console.error("Error inserting new user skills:", insertError);
          alert("Failed to add some skills.");
        }
      }

      // Update existing skills' levels
      if (skillsToUpdate.length > 0) {
        const updatePromises = skillsToUpdate.map(([skill_id, level]) =>
          supabaseClient
            .from('user_skills')
            .update({ level })
            .eq('user_id', userProfile.id)
            .eq('skill_id', skill_id)
        );
        const results = await Promise.all(updatePromises);
        results.forEach(res => {
            if (res.error) console.error("Error updating user skill level:", res.error);
        });
      }

      // Delete removed skills
      if (skillsToRemove.length > 0) {
        const { error: deleteError } = await supabaseClient
          .from('user_skills')
          .delete()
          .eq('user_id', userProfile.id)
          .in('skill_id', skillsToRemove);
        if (deleteError) {
          console.error("Error deleting user skills:", deleteError);
          alert("Failed to remove some skills.");
        }
      }

      alert("Profile and skills updated successfully!");
      onSave(updatedProfileData);

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
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setBio(e.target.value)}
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
                onChange={(e: ChangeEvent<HTMLInputElement>) => setContactInfo(e.target.value)}
                placeholder="e.g., your@email.com or @yourtelegram"
              />
            </div>
            {/* NEW: Portfolio Links Input */}
            <div>
              <label htmlFor="portfolioLinks" className="block text-sm font-medium text-[var(--app-foreground-muted)]">Portfolio Links (Comma-separated)</label>
              <input
                type="text"
                id="portfolioLinks"
                className="mt-1 block w-full px-3 py-2 bg-[var(--app-card-bg)] border border-[var(--app-card-border)] rounded-lg text-[var(--app-foreground)] placeholder-[var(--app-foreground-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--app-accent)]"
                value={portfolioLinks}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setPortfolioLinks(e.target.value)}
                placeholder="e.g., github.com/username,behance.net/user"
              />
            </div>
          </div>
        </div>

        {/* Skills Selection with Levels */}
        <div>
          <h4 className="text-lg font-semibold text-[var(--app-foreground)] mb-2">Skills</h4>
          <div className="grid grid-cols-1 gap-4"> {/* Changed to 1 column for better layout with level selector */}
            {allSkills.map(skill => (
              <div key={skill.id} className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id={`skill-${skill.id}`}
                  checked={userSkillsWithLevel.has(skill.id)}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => handleSkillChange(skill.id, e.target.checked)}
                  className="h-4 w-4 text-[var(--app-accent)] focus:ring-[var(--app-accent)] border-[var(--app-card-border)] rounded"
                />
                <label htmlFor={`skill-${skill.id}`} className="flex-1 text-sm text-[var(--app-foreground-muted)]">
                  {skill.name}
                </label>
                {userSkillsWithLevel.has(skill.id) && (
                    <select
                        value={userSkillsWithLevel.get(skill.id) || 1}
                        onChange={(e: ChangeEvent<HTMLSelectElement>) => handleLevelChange(skill.id, parseInt(e.target.value))}
                        className="w-24 px-2 py-1 bg-[var(--app-card-bg)] border border-[var(--app-card-border)] rounded-lg text-[var(--app-foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--app-accent)] text-xs"
                    >
                        <option value="1">Beginner</option>
                        <option value="2">Intermediate</option>
                        <option value="3">Expert</option>
                    </select>
                )}
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
// components/SkillDisplay.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client'; // Client-side Supabase client
import { Card } from './ui/shared';

type Skill = {
  id: string;
  name: string;
};

type SkillDisplayProps = {
  profileId: string; // The Supabase profile ID
};

export default function SkillDisplay({ profileId }: SkillDisplayProps) {
  const [loading, setLoading] = useState(true);
  const [skills, setSkills] = useState<Skill[]>([]);
  const supabaseClient = supabase;

  useEffect(() => {
    async function fetchUserSkills() {
      if (!supabaseClient) {
        console.error("Supabase client not initialized for SkillDisplay.");
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        // Fetch user's skills via the user_skills junction table
        const { data, error } = await supabaseClient
          .from('user_skills')
          .select('skill_id, skills(name)') // Join to get skill names
          .eq('user_id', profileId);

        if (error) {
          console.error("Error fetching user skills for display:", error);
          return;
        }

        // Map the data to our Skill type
        const fetchedSkills = data?.map((item: any) => ({
          id: item.skill_id,
          name: item.skills.name,
        })) || [];
        setSkills(fetchedSkills);

      } catch (error) {
        console.error("Unhandled error in SkillDisplay:", error);
      } finally {
        setLoading(false);
      }
    }

    if (profileId) { // Only fetch if profileId is available
      fetchUserSkills();
    }
  }, [profileId, supabaseClient]);

  if (loading) {
    return <p className="text-[var(--app-foreground-muted)] text-sm mt-4">Loading skills...</p>;
  }

  if (skills.length === 0) {
    return <p className="text-[var(--app-foreground-muted)] text-sm mt-4">No skills added yet.</p>;
  }

  return (
    <div className="mt-4">
      <h4 className="text-lg font-semibold text-[var(--app-foreground)] mb-2">My Skills</h4>
      <div className="flex flex-wrap gap-2">
        {skills.map(skill => (
          <span key={skill.id} className="bg-[var(--app-accent)] text-[var(--app-background)] text-xs font-medium px-2.5 py-0.5 rounded-full">
            {skill.name}
          </span>
        ))}
      </div>
    </div>
  );
}
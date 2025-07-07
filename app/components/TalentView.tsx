// components/TalentView.tsx
"use client";

import React, { useState, useEffect, ChangeEvent, useMemo } from 'react';
import { Card } from './ui/shared';
import { supabase } from '@/lib/supabase/client';
import Image from 'next/image';
import Modal from './ui/Modal'; // NEW: Import Modal
import TalentDetails from './TalentDetails'; // NEW: Import TalentDetails

// Define types for Profile and Skill (for displaying talent)
type Profile = {
  id: string;
  fid: number;
  username?: string | null;
  display_name?: string | null;
  bio?: string | null;
  contact_info?: string | null;
  created_at: string;
  pfp_url?: string | null; // Added pfp_url
  // Joined skills will be nested like: user_skills: [{ skills: { id: string, name: string } }]
  user_skills?: { skills: { id: string; name: string } }[];
};

type Skill = {
  id: string;
  name: string;
};

export default function TalentView() {
  const [loadingTalent, setLoadingTalent] = useState(true);
  const [allTalent, setAllTalent] = useState<Profile[]>([]);
  const [allSkills, setAllSkills] = useState<Skill[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSkillId, setFilterSkillId] = useState<string | null>(null);

  // NEW: State for Talent Details Modal
  const [isTalentDetailsModalOpen, setIsTalentDetailsModalOpen] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);

  const supabaseClient = supabase;

  useEffect(() => {
    async function fetchTalentAndSkills() {
      if (!supabaseClient) {
        console.error("Supabase client not initialized for TalentView.");
        setLoadingTalent(false);
        return;
      }

      setLoadingTalent(true);
      try {
        // Fetch all skills for filter dropdown
        if (allSkills.length === 0) {
          const { data: skillsData, error: skillsError } = await supabaseClient
            .from('skills')
            .select('*');
          if (skillsError) {
            console.error("Error fetching all skills for talent filter:", skillsError);
          } else {
            setAllSkills(skillsData || []);
          }
        }

        // Build the talent query: Select profiles that have AT LEAST ONE skill
        let query = supabaseClient
          .from('profiles')
          .select('*, user_skills!inner(skills(id, name))') // Use inner join to only get profiles that have any skills associated
          .order('created_at', { ascending: false });

        // Apply search query filter (by username or display name or bio)
        if (searchQuery) {
          query = query.or(`username.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%,bio.ilike.%${searchQuery}%`);
        }

        const { data: talentData, error: talentError } = await query;

        if (talentError) {
          console.error("Error fetching talent profiles:", talentError);
          return;
        }

        setAllTalent(talentData || []);

      } catch (error) {
        console.error("Unhandled error in TalentView:", error);
      } finally {
        setLoadingTalent(false);
      }
    }

    fetchTalentAndSkills();
  }, [supabaseClient, searchQuery, allSkills.length]);

  // Handle search input
  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Handle skill filter change
  const handleSkillFilterChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setFilterSkillId(e.target.value === '' ? null : e.target.value);
  };

  // Client-side filtering of talent profiles
  const filteredTalent = useMemo(() => {
    if (!filterSkillId) {
      return allTalent; // No skill filter applied
    }

    return allTalent.filter(profile =>
      profile.user_skills?.some(us => us.skills.id === filterSkillId)
    );
  }, [allTalent, filterSkillId]);

  // NEW: Open Talent Details Modal
  const openTalentDetailsModal = (profileId: string) => {
    setSelectedProfileId(profileId);
    setIsTalentDetailsModalOpen(true);
  };

  // NEW: Close Talent Details Modal
  const closeTalentDetailsModal = () => {
    setIsTalentDetailsModalOpen(false);
    setSelectedProfileId(null);
  };


  if (loadingTalent) {
    return (
      <div className="flex flex-col min-h-screen font-sans text-[var(--app-foreground)] mini-app-theme from-[var(--app-background)] to-[var(--app-gray)]">
        <div className="w-full max-w-md mx-auto px-4 py-3">
          <main className="flex-1">
            <Card title="Loading Talent...">
              <p className="text-[var(--app-foreground-muted)]">Finding Farcasters with skills...</p>
            </Card>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen font-sans text-[var(--app-foreground)] mini-app-theme from-[var(--app-background)] to-[var(--app-gray)]">
      <div className="w-full max-w-md mx-auto px-4 py-3">
        <main className="flex-1">
          <Card title="Farlance Talent Pool">
            <div className="space-y-4 mb-4">
              {/* Search and Filter Inputs */}
              <input
                type="text"
                placeholder="Search talent by name or bio..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full px-3 py-2 bg-[var(--app-card-bg)] border border-[var(--app-card-border)] rounded-lg text-[var(--app-foreground)] placeholder-[var(--app-foreground-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--app-accent)]"
              />
              <select
                value={filterSkillId || ''}
                onChange={handleSkillFilterChange}
                className="w-full px-3 py-2 bg-[var(--app-card-bg)] border border-[var(--app-card-border)] rounded-lg text-[var(--app-foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--app-accent)]"
              >
                <option value="">Filter by Skill (All)</option>
                {allSkills.map(skill => (
                  <option key={skill.id} value={skill.id}>
                        {skill.name}
                  </option>
                ))}
              </select>
            </div>

            {filteredTalent.length === 0 ? (
              <p className="text-[var(--app-foreground-muted)]">
                No talent profiles found matching your criteria.
              </p>
            ) : (
              <div className="space-y-4">
                {filteredTalent.map(profile => (
                  <Card key={profile.id} className="cursor-pointer" onClick={() => openTalentDetailsModal(profile.id)}> {/* NEW: onClick handler */}
                    <div className="flex items-center space-x-4">
                      {profile.pfp_url && (
                        <Image
                          src={profile.pfp_url}
                          alt={`${profile.display_name || profile.username}'s Profile Picture`}
                          width={48}
                          height={48}
                          className="rounded-full"
                          unoptimized={true}
                        />
                      )}
                      <div>
                        <h3 className="text-lg font-semibold text-[var(--app-foreground)]">
                          {profile.display_name || profile.username || 'Unnamed Farcaster'}
                        </h3>
                        <p className="text-[var(--app-foreground-muted)] text-sm">
                          @{profile.username || 'N/A'}
                        </p>
                      </div>
                    </div>
                    <p className="text-[var(--app-foreground-muted)] text-sm mt-2">
                      {profile.bio ? profile.bio.substring(0, 100) + (profile.bio.length > 100 ? '...' : '') : 'No bio provided.'}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {profile.user_skills?.map(us => (
                        <span key={us.skills.id} className="bg-[var(--app-accent)] text-[var(--app-background)] text-xs font-medium px-2 py-0.5 rounded-full">
                          {us.skills.name}
                        </span>
                      ))}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </Card>
        </main>
      </div>

      {/* NEW: Talent Details Modal */}
      {isTalentDetailsModalOpen && selectedProfileId && (
        <Modal isOpen={isTalentDetailsModalOpen} onClose={closeTalentDetailsModal}>
          <TalentDetails profileId={selectedProfileId} onClose={closeTalentDetailsModal} />
        </Modal>
      )}
    </div>
  );
}
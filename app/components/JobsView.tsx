// components/JobsView.tsx
"use client";

import React, { useState, useEffect, ChangeEvent, useMemo } from 'react';
import { Card } from './ui/shared';
import { supabase } from '@/lib/supabase/client';
import Modal from './ui/Modal'; // NEW: Import Modal
import JobDetails from './JobDetails'; // NEW: Import JobDetails

// Define Job type consistent with how it's fetched (including nested skills)
type Job = {
  id: string;
  poster_id: string;
  title: string;
  description: string;
  budget_amount?: number | null;
  budget_currency?: string | null;
  deadline?: string | null; // ISO string format
  status: string;
  created_at: string; // ISO string format
  job_skills?: { skill_id: string; skills: { name: string } }[]; // Nested skills
};

type Skill = {
  id: string;
  name: string;
};

export default function JobsView() {
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [allJobs, setAllJobs] = useState<Job[]>([]); // Stores all jobs
  const [allSkills, setAllSkills] = useState<Skill[]>([]); // For filter dropdown
  const [searchQuery, setSearchQuery] = useState(''); // For searching by title/description
  const [filterSkillId, setFilterSkillId] = useState<string | null>(null);

  // NEW: State for Job Details Modal
  const [isJobDetailsModalOpen, setIsJobDetailsModalOpen] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  const supabaseClient = supabase;

  useEffect(() => {
    async function fetchJobsAndSkills() {
      if (!supabaseClient) {
        console.error("Supabase client not initialized for JobsView.");
        setLoadingJobs(false);
        return;
      }

      setLoadingJobs(true);
      try {
        // Fetch all skills for filter dropdown (if not already fetched)
        if (allSkills.length === 0) {
          const { data: skillsData, error: skillsError } = await supabaseClient
            .from('skills')
            .select('*');
          if (skillsError) {
            console.error("Error fetching all skills for job filter:", skillsError);
          } else {
            setAllSkills(skillsData || []);
          }
        }

        // Fetch jobs, joining job_skills and skills tables
        let query = supabaseClient
          .from('jobs')
          .select(
            filterSkillId // If filtering by skill
              ? `*, job_skills!inner(skill_id, skills(name))` // Use inner join on job_skills
              : `*, job_skills(skill_id, skills(name))`        // Else, keep default (outer) join
          )
          .eq('status', 'open') // Only show open jobs
          .order('created_at', { ascending: false }); // Show newest jobs first

        // Apply search query filter (by title or description)
        if (searchQuery) {
          query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
        }

        // Apply skill filter if selected
        if (filterSkillId) {
          query = query.eq('job_skills.skill_id', filterSkillId);
        }

        const { data: jobsData, error: jobsError } = await query;

        if (jobsError) {
          console.error("Error fetching jobs:", jobsError);
          return;
        }

        setAllJobs(jobsData || []);

      } catch (error) {
        console.error("Unhandled error in JobsView:", error);
      } finally {
        setLoadingJobs(false);
      }
    }

    fetchJobsAndSkills();
  }, [supabaseClient, searchQuery, filterSkillId, allSkills.length]); // Re-run when filters or skills change

  // Handle search input
  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Handle skill filter change
  const handleSkillFilterChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setFilterSkillId(e.target.value === '' ? null : e.target.value);
  };

  // NEW: Open Job Details Modal
  const openJobDetailsModal = (jobId: string) => {
    setSelectedJobId(jobId);
    setIsJobDetailsModalOpen(true);
  };

  // NEW: Close Job Details Modal
  const closeJobDetailsModal = () => {
    setIsJobDetailsModalOpen(false);
    setSelectedJobId(null);
  };


  if (loadingJobs) {
    return (
      <Card title="Loading Jobs...">
        <p className="text-[var(--app-foreground-muted)]">Finding open opportunities on Farcaster...</p>
      </Card>
    );
  }

  return (
    <div className="flex flex-col min-h-screen font-sans text-[var(--app-foreground)] mini-app-theme from-[var(--app-background)] to-[var(--app-gray)]">
      <div className="w-full max-w-md mx-auto px-4 py-3">
        <main className="flex-1">
          <Card title="Open Jobs on Farlance">
            <div className="space-y-4 mb-4">
              {/* Search and Filter Inputs */}
              <input
                type="text"
                placeholder="Search jobs by title or description..."
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

            {allJobs.length === 0 ? (
              <p className="text-[var(--app-foreground-muted)]">
                No jobs found matching your criteria.
              </p>
            ) : (
              <div className="space-y-4">
                {allJobs.map(job => (
                  <Card key={job.id} className="cursor-pointer" onClick={() => openJobDetailsModal(job.id)}>
                    <h3 className="text-lg font-semibold text-[var(--app-foreground)]">{job.title}</h3>
                    <p className="text-[var(--app-foreground-muted)] text-sm mt-1">
                      {job.description.substring(0, 100)}...
                    </p>
                    {job.budget_amount && (
                      <p className="text-[var(--app-foreground)] text-xs mt-1">
                        Budget: {job.budget_amount} {job.budget_currency || 'USD'}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2 mt-2">
                      {job.job_skills?.map(js => (
                        <span key={js.skill_id} className="bg-[var(--app-accent)] text-[var(--app-background)] text-xs font-medium px-2 py-0.5 rounded-full">
                          {js.skills.name}
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

      {/* Job Details Modal */}
      {isJobDetailsModalOpen && selectedJobId && (
        <Modal isOpen={isJobDetailsModalOpen} onClose={closeJobDetailsModal}>
          <JobDetails jobId={selectedJobId} onClose={closeJobDetailsModal} />
        </Modal>
      )}
    </div>
  );
}
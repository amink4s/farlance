// components/JobsView.tsx
"use client";

import React, { useState, useEffect, ChangeEvent } from 'react';
import { Card, Button } from './ui/shared';
import { supabase } from '@/lib/supabase/client';

// Define types for Job and Skill (as they will be joined for display)
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
  // We'll also want to display the skills related to the job
  job_skills?: { skill_id: string; skills: { name: string } }[];
};

type Skill = {
  id: string;
  name: string;
};

export default function JobsView() {
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [allSkills, setAllSkills] = useState<Skill[]>([]); // For filtering by skills
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSkillId, setFilterSkillId] = useState<string | null>(null);

  const supabaseClient = supabase;

  // Effect to fetch jobs and skills on component mount or when filters change
  useEffect(() => {
    async function fetchJobsAndSkills() {
      if (!supabaseClient) {
        console.error("Supabase client not initialized for JobsView.");
        setLoadingJobs(false);
        return;
      }

      setLoadingJobs(true);
      try {
        // Fetch all skills for filter dropdown
        if (allSkills.length === 0) {
            const { data: skillsData, error: skillsError } = await supabaseClient
                .from('skills')
                .select('*');
            if (skillsError) {
                console.error("Error fetching all skills for jobs filter:", skillsError);
            } else {
                setAllSkills(skillsData || []);
            }
        }

        // Build the jobs query
        let query = supabaseClient
          .from('jobs')
          // IMPORTANT: Use !inner to ensure only jobs WITH matching skills are returned
          // When filterSkillId is present, the join becomes conditional.
          .select(
            filterSkillId // If filtering by skill
              ? `*, job_skills!inner(skill_id, skills(name))` // Use inner join on job_skills
              : `*, job_skills(skill_id, skills(name))`        // Else, keep default (outer) join
          )
          .eq('status', 'open') // Only show open jobs
          .order('created_at', { ascending: false }); // Show newest jobs first

        // Apply search query filter
        if (searchQuery) {
          query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
        }

        // Apply skill filter if selected
        if (filterSkillId) {
          // This filter now correctly applies to the inner-joined job_skills
          query = query.eq('job_skills.skill_id', filterSkillId);
        }

        const { data: jobsData, error: jobsError } = await query;

        if (jobsError) {
          console.error("Error fetching jobs:", jobsError);
          return;
        }
        setJobs(jobsData || []);

      } catch (error) {
        console.error("Unhandled error in JobsView:", error);
      } finally {
        setLoadingJobs(false);
      }
    }

    fetchJobsAndSkills();
  }, [supabaseClient, searchQuery, filterSkillId, allSkills.length]); // Added allSkills.length to dependencies for skills refetching

  // Handle search input
  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Handle skill filter change
  const handleSkillFilterChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setFilterSkillId(e.target.value === '' ? null : e.target.value);
  };


  if (loadingJobs) {
    return (
      <Card title="Loading Jobs...">
        <p className="text-[var(--app-foreground-muted)]">Fetching available freelance jobs...</p>
      </Card>
    );
  }

  return (
    <div className="flex flex-col min-h-screen font-sans text-[var(--app-foreground)] mini-app-theme from-[var(--app-background)] to-[var(--app-gray)]">
      <div className="w-full max-w-md mx-auto px-4 py-3">
        <main className="flex-1">
          <Card title="Available Freelance Jobs">
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

            {jobs.length === 0 ? (
              <p className="text-[var(--app-foreground-muted)]">
                No open jobs available matching your criteria.
              </p>
            ) : (
              <div className="space-y-4">
                {jobs.map(job => (
                  <Card key={job.id} className="cursor-pointer" onClick={() => alert(`View Job: ${job.title}`)}>
                    <h3 className="text-lg font-semibold text-[var(--app-foreground)]">
                      {job.title}
                    </h3>
                    <p className="text-[var(--app-foreground-muted)] text-sm mt-1">
                      {job.description.substring(0, 100)}{job.description.length > 100 ? '...' : ''}
                    </p>
                    {job.budget_amount && (
                      <p className="text-[var(--app-foreground-muted)] text-xs mt-1">
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
                    <p className="text-[var(--app-foreground-muted)] text-xs mt-2">
                      Posted: {new Date(job.created_at).toLocaleDateString()}
                    </p>
                  </Card>
                ))}
              </div>
            )}
          </Card>
        </main>
      </div>
    </div>
  );
}
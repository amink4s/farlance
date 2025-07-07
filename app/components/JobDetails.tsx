// components/JobDetails.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { Card, Button } from './ui/shared';
import { supabase } from '@/lib/supabase/client';
import Image from 'next/image'; // NEW: Import Image for poster PFP

// Define Job type consistent with how it's fetched (including nested skills and poster profile)
type Job = {
  id: string;
  poster_id: string;
  title: string;
  description: string;
  budget_amount?: number | null;
  budget_currency?: string | null;
  deadline?: string | null;
  status: string;
  created_at: string;
  job_skills?: { skill_id: string; skills: { name: string } }[];
  profiles?: { // NEW: Nested poster profile data
    id: string;
    fid: number;
    username: string;
    display_name: string;
    pfp_url?: string | null;
  } | null;
};

type JobDetailsProps = {
  jobId: string;
  onClose: () => void; // Callback to close the modal
};

export default function JobDetails({ jobId, onClose }: JobDetailsProps) {
  const [loading, setLoading] = useState(true);
  const [job, setJob] = useState<Job | null>(null);
  const supabaseClient = supabase;

  useEffect(() => {
    async function fetchJobDetails() {
      if (!supabaseClient) {
        console.error("Supabase client not initialized for JobDetails.");
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const { data: jobData, error: jobError } = await supabaseClient
          .from('jobs')
          .select('*, job_skills(skills(name)), profiles(id, fid, username, display_name, pfp_url)') // <--- UPDATED HERE
          .eq('id', jobId)
          .single();

        if (jobError) {
          console.error("Error fetching job details:", jobError);
          setJob(null);
        } else {
          setJob(jobData);
        }
      } catch (error) {
        console.error("Unhandled error fetching job details:", error);
        setJob(null);
      } finally {
        setLoading(false);
      }
    }

    if (jobId) {
      fetchJobDetails();
    }
  }, [jobId, supabaseClient]);

  if (loading) {
    return (
      <div className="p-4 text-[var(--app-foreground-muted)]">
        Loading job details...
      </div>
    );
  }

  if (!job) {
    return (
      <div className="p-4 text-red-500">
        Job not found or failed to load.
        <Button variant="secondary" onClick={onClose} className="mt-4">Close</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-[var(--app-foreground)]">{job.title}</h2>
      {/* NEW: Display Poster's PFP and Username */}
      {job.profiles && (
        <div className="flex items-center space-x-2 mt-2">
          {job.profiles.pfp_url && (
            <Image
              src={job.profiles.pfp_url}
              alt={`${job.profiles.display_name || job.profiles.username}'s PFP`}
              width={32}
              height={32}
              className="rounded-full"
              unoptimized={true}
            />
          )}
          <span className="text-[var(--app-foreground-muted)] text-md">
            Posted by @{job.profiles.username || job.profiles.display_name || 'N/A'}
          </span>
          {/* Optionally, add a click handler to open the poster's profile modal */}
        </div>
      )}
      <p className="text-[var(--app-foreground-muted)] text-md whitespace-pre-wrap">{job.description}</p>

      {job.budget_amount && (
        <p className="text-[var(--app-foreground)] text-sm">
          <span className="font-semibold">Budget:</span> {job.budget_amount} {job.budget_currency || 'USD'}
        </p>
      )}
      {job.deadline && (
        <p className="text-[var(--app-foreground)] text-sm">
          <span className="font-semibold">Deadline:</span> {new Date(job.deadline).toLocaleDateString()}
        </p>
      )}

      <div className="mt-4">
        <h4 className="text-lg font-semibold text-[var(--app-foreground)] mb-2">Required Skills:</h4>
        <div className="flex flex-wrap gap-2">
          {job.job_skills?.map(js => (
            <span key={js.skill_id} className="bg-[var(--app-accent)] text-[var(--app-background)] text-xs font-medium px-2 py-0.5 rounded-full">
              {js.skills.name}
            </span>
          ))}
        </div>
      </div>

      <div className="flex justify-end space-x-3 mt-6">
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
        <Button variant="primary" onClick={() => alert(`Applying for job: ${job.title}`)}>
          Apply for this Job
        </Button>
      </div>
    </div>
  );
}
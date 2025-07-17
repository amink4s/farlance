// components/JobDetails.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button } from './ui/shared';
import { supabase } from '@/lib/supabase/client';
import Image from 'next/image';
import { sdk } from "@farcaster/frame-sdk"; // <--- NEW: Import sdk for quickAuth.fetch


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
  profiles?: { // Nested poster profile data
    id: string;
    fid: number; // For notifications to poster
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
  const [applicationMessage, setApplicationMessage] = useState('');
  const [applying, setApplying] = useState(false);
  
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
          .select('*, job_skills(skills(name)), profiles(id, fid, username, display_name, pfp_url)')
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

  // Handle applying for the job
  const handleApplyForJob = useCallback(async () => {
    if (!job) return;

    setApplying(true);
    try {
      // Fetch current authenticated user's FID and profile ID for the application
      // This is necessary because JobDetails component does not directly receive authenticatedData props.
      const authRes = await sdk.quickAuth.fetch('/api/auth'); // Uses sdk.quickAuth.fetch
      if (!authRes.ok) {
        alert("Please sign in to apply for jobs.");
        setApplying(false);
        return;
      }
      const authData = await authRes.json();
      const applicantProfileId = authData.profile.id;
      const applicantFid = authData.user.fid;

      const response = await fetch('/api/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: job.id,
          applicantProfileId: applicantProfileId,
          applicantFid: applicantFid,
          applicationMessage: applicationMessage,
        }),
      });

      if (response.ok) {
        alert("Your application has been submitted!");
        onClose(); // Close the modal
      } else {
        const errorData = await response.json();
        console.error("Failed to submit application via API:", response.status, errorData);
        alert(`Failed to submit application: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Unhandled error during job application:", error);
      alert("An unexpected error occurred while submitting your application.");
    } finally {
      setApplying(false);
    }
  }, [job, applicationMessage, onClose]);


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

      {/* Application Message Textarea */}
      <div className="mt-4">
        <label htmlFor="applicationMessage" className="block text-sm font-medium text-[var(--app-foreground-muted)] mb-1">Your Message (Optional):</label>
        <textarea
          id="applicationMessage"
          className="mt-1 block w-full px-3 py-2 bg-[var(--app-card-bg)] border border-[var(--app-card-border)] rounded-lg text-[var(--app-foreground)] placeholder-[var(--app-foreground-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--app-accent)]"
          rows={3}
          value={applicationMessage}
          onChange={(e) => setApplicationMessage(e.target.value)}
          placeholder="Tell the job poster why you're a good fit..."
          disabled={applying}
        />
      </div>

      <div className="flex justify-end space-x-3 mt-6">
        <Button variant="secondary" onClick={onClose} disabled={applying}>
          Close
        </Button>
        <Button variant="primary" onClick={handleApplyForJob} disabled={applying}>
          {applying ? 'Applying...' : 'Apply for this Job'}
        </Button>
      </div>
    </div>
  );
}
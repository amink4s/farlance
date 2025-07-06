// components/JobPostForm.tsx
"use client";

import React, { useState, useEffect, useCallback, ChangeEvent } from 'react';
import { Button, Card } from './ui/shared'; // Reusable UI components
import { supabase } from '@/lib/supabase/client'; // Client-side Supabase client

// Define types matching your Supabase schema
type Skill = {
  id: string;
  name: string;
  description?: string | null;
};

// Props for JobPostForm component
type JobPostFormProps = {
  posterId: string; // The Supabase profile ID of the user posting the job
  onJobPosted: () => void; // Callback after successful job post
  onCancel: () => void; // Callback to close the form
};

export default function JobPostForm({ posterId, onJobPosted, onCancel }: JobPostFormProps) {
  const [loadingSkills, setLoadingSkills] = useState(true);
  const [posting, setPosting] = useState(false);
  const [allSkills, setAllSkills] = useState<Skill[]>([]);
  const [selectedSkillIds, setSelectedSkillIds] = useState<Set<string>>(new Set());

  // Form fields state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [budgetAmount, setBudgetAmount] = useState<string>(''); // Keep as string for input
  const [budgetCurrency, setBudgetCurrency] = useState('');
  const [deadline, setDeadline] = useState(''); // Keep as string for input datetime-local

  const supabaseClient = supabase; // Use the imported client instance

  // Fetch all available skills on mount
  useEffect(() => {
    async function fetchAllSkills() {
      if (!supabaseClient) {
        console.error("Supabase client not initialized for fetching skills.");
        setLoadingSkills(false);
        return;
      }
      setLoadingSkills(true);
      try {
        const { data: skillsData, error: skillsError } = await supabaseClient
          .from('skills')
          .select('*');

        if (skillsError) {
          console.error("Error fetching all skills for job post:", skillsError);
          return;
        }
        setAllSkills(skillsData || []);
      } catch (error) {
        console.error("Unhandled error fetching skills for job post:", error);
      } finally {
        setLoadingSkills(false);
      }
    }

    fetchAllSkills();
  }, [supabaseClient]);

  // Handle checkbox change for required skills
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

  // Handle saving the new job
  const handlePostJob = async () => {
    if (!supabaseClient) {
      console.error("Supabase client not initialized for posting job.");
      return;
    }
    if (!title || !description || selectedSkillIds.size === 0) {
      alert("Please fill out Title, Description, and select at least one required skill.");
      return;
    }

    setPosting(true);
    try {
      // 1. Insert new job into 'jobs' table
      const { data: newJob, error: jobInsertError } = await supabaseClient
        .from('jobs')
        .insert({
          poster_id: posterId,
          title: title,
          description: description,
          budget_amount: budgetAmount ? parseFloat(budgetAmount) : null,
          budget_currency: budgetCurrency || null,
          deadline: deadline || null, // Ensure deadline is valid date string or null
          status: 'open', // Default status for new jobs
        })
        .select()
        .single();

      if (jobInsertError) {
        console.error("Error inserting new job:", jobInsertError);
        alert("Failed to post job.");
        return;
      }

      // 2. Insert required skills into 'job_skills' table
      if (selectedSkillIds.size > 0) {
        const { error: jobSkillsInsertError } = await supabaseClient
          .from('job_skills')
          .insert(Array.from(selectedSkillIds).map(skill_id => ({
            job_id: newJob.id,
            skill_id: skill_id
          })));

        if (jobSkillsInsertError) {
          console.error("Error inserting job skills:", jobSkillsInsertError);
          alert("Job posted, but failed to link all skills.");
        }
      }

      alert("Job posted successfully!");
      onJobPosted(); // Call callback to notify parent

    } catch (error) {
      console.error("Unhandled error during job post:", error);
      alert("An unexpected error occurred during job post.");
    } finally {
      setPosting(false);
    }
  };

  if (loadingSkills) {
    return (
      <Card title="Loading Job Post Form...">
        <p className="text-[var(--app-foreground-muted)]">Fetching skills...</p>
      </Card>
    );
  }

  return (
    <Card title="Post a New Job">
      <div className="space-y-6">
        {/* Job Details */}
        <div>
          <h4 className="text-lg font-semibold text-[var(--app-foreground)] mb-2">Job Details</h4>
          <div className="space-y-4">
            <div>
              <label htmlFor="jobTitle" className="block text-sm font-medium text-[var(--app-foreground-muted)]">Job Title <span className="text-red-500">*</span></label>
              <input
                type="text"
                id="jobTitle"
                className="mt-1 block w-full px-3 py-2 bg-[var(--app-card-bg)] border border-[var(--app-card-border)] rounded-lg text-[var(--app-foreground)] placeholder-[var(--app-foreground-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--app-accent)]"
                value={title}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
                placeholder="e.g., React Frontend Developer"
                required
              />
            </div>
            <div>
              <label htmlFor="jobDescription" className="block text-sm font-medium text-[var(--app-foreground-muted)]">Description <span className="text-red-500">*</span></label>
              <textarea
                id="jobDescription"
                className="mt-1 block w-full px-3 py-2 bg-[var(--app-card-bg)] border border-[var(--app-card-border)] rounded-lg text-[var(--app-foreground)] placeholder-[var(--app-foreground-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--app-accent)]"
                rows={6}
                value={description}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                placeholder="Provide a detailed description of the job requirements and deliverables."
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="budgetAmount" className="block text-sm font-medium text-[var(--app-foreground-muted)]">Budget Amount</label>
                <input
                  type="number"
                  id="budgetAmount"
                  className="mt-1 block w-full px-3 py-2 bg-[var(--app-card-bg)] border border-[var(--app-card-border)] rounded-lg text-[var(--app-foreground)] placeholder-[var(--app-foreground-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--app-accent)]"
                  value={budgetAmount}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setBudgetAmount(e.target.value)}
                  placeholder="e.g., 500"
                  step="0.01"
                  min="0"
                />
              </div>
              <div>
                <label htmlFor="budgetCurrency" className="block text-sm font-medium text-[var(--app-foreground-muted)]">Currency</label>
                <input
                  type="text"
                  id="budgetCurrency"
                  className="mt-1 block w-full px-3 py-2 bg-[var(--app-card-bg)] border border-[var(--app-card-border)] rounded-lg text-[var(--app-foreground)] placeholder-[var(--app-foreground-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--app-accent)]"
                  value={budgetCurrency}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setBudgetCurrency(e.target.value)}
                  placeholder="e.g., USD, ETH"
                />
              </div>
            </div>
            <div>
              <label htmlFor="deadline" className="block text-sm font-medium text-[var(--app-foreground-muted)]">Deadline (Optional)</label>
              <input
                type="datetime-local"
                id="deadline"
                className="mt-1 block w-full px-3 py-2 bg-[var(--app-card-bg)] border border-[var(--app-card-border)] rounded-lg text-[var(--app-foreground)] placeholder-[var(--app-foreground-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--app-accent)]"
                value={deadline}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setDeadline(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Required Skills Selection */}
        <div>
          <h4 className="text-lg font-semibold text-[var(--app-foreground)] mb-2">Required Skills <span className="text-red-500">*</span></h4>
          <div className="grid grid-cols-2 gap-3">
            {allSkills.map(skill => (
              <div key={skill.id} className="flex items-center">
                <input
                  type="checkbox"
                  id={`job-skill-${skill.id}`}
                  checked={selectedSkillIds.has(skill.id)}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => handleSkillChange(skill.id, e.target.checked)}
                  className="h-4 w-4 text-[var(--app-accent)] focus:ring-[var(--app-accent)] border-[var(--app-card-border)] rounded"
                />
                <label htmlFor={`job-skill-${skill.id}`} className="ml-2 text-sm text-[var(--app-foreground-muted)]">
                  {skill.name}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3">
          <Button variant="secondary" onClick={onCancel} disabled={posting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handlePostJob} disabled={posting}>
            {posting ? 'Posting...' : 'Post Job'}
          </Button>
        </div>
      </div>
    </Card>
  );
}
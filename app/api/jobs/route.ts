// app/api/jobs/route.ts
// This API route handles job creation, matching, and sending notifications.

import { NextResponse } from 'next/server';
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server'; // Server-side Supabase client
import { NeynarAPIClient, Configuration } from "@neynar/nodejs-sdk"; // For fetching user info for notifications
import { sendFrameNotification } from '@/lib/notification-client'; // For sending Farcaster notifications

// Initialize Neynar API client for fetching user info (like display_name for notifications)
const neynarClient = new NeynarAPIClient(new Configuration({
  apiKey: process.env.NEYNAR_API_KEY!, // Use your server-side Neynar API key
}));

// Ensure NEXT_PUBLIC_URL is defined for deep-linking
const APP_BASE_URL = process.env.NEXT_PUBLIC_URL || 'https://farlance.vercel.app'; // Fallback for local dev

export async function POST(request: Request) {
  const { jobData, selectedSkillIds, posterFid } = await request.json(); // jobData will include title, description, etc.

  if (!jobData || !selectedSkillIds || !posterFid) {
    return NextResponse.json({ message: 'Missing job data, skills, or poster FID' }, { status: 400 });
  }

  const supabase = createSupabaseServerClient(); // Server-side Supabase client

  try {
    // 1. Insert new job into 'jobs' table
    const { data: newJob, error: jobInsertError } = await supabase
      .from('jobs')
      .insert({
        poster_id: jobData.posterId, // Passed from frontend, this is Supabase profile ID
        title: jobData.title,
        description: jobData.description,
        budget_amount: jobData.budgetAmount ? parseFloat(jobData.budgetAmount) : null,
        budget_currency: jobData.budgetCurrency || null,
        deadline: jobData.deadline || null,
        status: 'open',
      })
      .select()
      .single();

    if (jobInsertError) {
      console.error("Error inserting new job:", jobInsertError);
      return NextResponse.json({ message: 'Failed to post job' }, { status: 500 });
    }

    // 2. Insert required skills into 'job_skills' table
    if (selectedSkillIds.length > 0) {
      const { error: jobSkillsInsertError } = await supabase
        .from('job_skills')
        .insert(selectedSkillIds.map((skill_id: string) => ({
          job_id: newJob.id,
          skill_id: skill_id
        })));

      if (jobSkillsInsertError) {
        console.error("Error inserting job skills:", jobSkillsInsertError);
        // Don't fail the whole request for this, but log an error
      }
    }

    // --- JOB MATCHING & NOTIFICATION LOGIC ---
    // 3. Find matching talent profiles based on selected skills
    const { data: matchingUsers, error: matchingUsersError } = await supabase
      .from('user_skills')
      .select(`user_id, profiles(fid, display_name, username)`)
      .in('skill_id', selectedSkillIds)
      // .not('user_id', 'eq', jobData.posterId) // Keep commented if you want poster to be notified
      .order('user_id', { ascending: true });

    if (matchingUsersError) {
      console.error("Error finding matching users for job notification:", matchingUsersError);
    } else {
      const uniqueFidsToNotify = new Set<number>();
      matchingUsers?.forEach(us => {
        const profileData = us.profiles;
        let currentFid: number | null = null;

        if (profileData && Array.isArray(profileData) && profileData.length > 0) {
            currentFid = (profileData[0] as any)?.fid as number;
        } else if (profileData && typeof profileData === 'object' && 'fid' in profileData) {
            currentFid = (profileData as any)?.fid as number;
        }

        if (typeof currentFid === 'number' && !isNaN(currentFid)) {
            uniqueFidsToNotify.add(currentFid);
        }
      });

      console.log(`Found ${uniqueFidsToNotify.size} unique FIDs to notify for job: ${newJob.title}`);

      // Construct the deep-link URL for the notification
      const jobDetailsUrl = `${APP_BASE_URL}/?jobId=${newJob.id}`; // <--- NEW: Deep-link URL

      // 4. Send Farcaster notifications to matched users
      for (const fid of uniqueFidsToNotify) {
        try {
          const notificationResult = await sendFrameNotification({
            fid: fid,
            title: `✨ New Farlance Job: ${newJob.title}`,
            body: `A new job matching your skills has been posted! "${newJob.description.substring(0, 70)}..."`,
            targetUrl: jobDetailsUrl, // <--- NEW: Pass the deep-link URL
          });
          if (notificationResult.state === 'error') {
            console.error(`Failed to send notification to FID ${fid}:`, notificationResult.error);
          } else {
            console.log(`Notification sent to FID ${fid} for job ${newJob.id}`);
          }
        } catch (notifyError) {
          console.error(`Unhandled error sending notification to FID ${fid}:`, notifyError);
        }
      }
    }

    return NextResponse.json({ message: 'Job posted successfully!', jobId: newJob.id }, { status: 200 });

  } catch (error) {
    console.error("Unhandled error during job post backend:", error);
    return NextResponse.json({ message: 'An unexpected error occurred' }, { status: 500 });
  }
}
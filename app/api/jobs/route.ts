// app/api/jobs/route.ts
// This API route handles job creation, matching, and sending notifications.

import { NextResponse } from 'next/server';
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server'; // Server-side Supabase client
// We will use the standard fetch/axios instead of the SDK client 
// for the score check to keep the code cleaner and avoid conflicts with the
// SDK client defined for notifications if they are for different purposes/versions.
import { NeynarAPIClient, Configuration } from "@neynar/nodejs-sdk"; 
import { sendFrameNotification } from '@/lib/notification-client'; // For sending Farcaster notifications

// --- Configuration ---
// Set the recommended quality threshold (0.5 is the starting point)
const NEYNAR_SCORE_THRESHOLD = 0.5;

// Initialize a single Neynar API client instance for ALL Neynar interactions (notifications, score check, etc.)
// FIX 1: We only need one neynarClient, and we need to ensure the apiKey is treated as a string.
// FIX 2: Ensure we use the correct type for Configuration, which can take a plain object.
const neynarClient = new NeynarAPIClient(new Configuration({
  apiKey: process.env.NEYNAR_API_KEY as string, // Force as string to satisfy TypeScript, assuming it's set in Vercel.
}));

// Ensure NEXT_PUBLIC_URL is defined for deep-linking
const APP_BASE_URL = process.env.NEXT_PUBLIC_URL || 'https://farlance.vercel.app'; // Fallback for local dev

export async function POST(request: Request) {
  const { jobData, selectedSkillIds, posterFid } = await request.json(); // jobData will include title, description, etc.

  if (!jobData || !selectedSkillIds || !posterFid) {
    return NextResponse.json({ message: 'Missing job data, skills, or poster FID' }, { status: 400 });
  }

  // --- NEYNAR SCORE CHECK ---
  // The FID to check is 'posterFid'
  const fidToCheck = posterFid;

  if (!fidToCheck) {
    return NextResponse.json(
      { success: false, message: 'Farcaster ID (FID) is required to post a job.' }, 
      { status: 400 }
    );
  }

  try {
    // 1. Fetch the user's data, which includes the score
    const fids = [Number(fidToCheck)]; // FIDs must be an array of numbers
    const { users } = await neynarClient.fetchBulkUsers({ fids });
    
    const user = users[0];

    // FIX 3: The neynar_user_score property does not exist directly on the 'User' type 
    // in the public SDK types, but is often found in the extended user object 
    // returned by fetchBulkUsers. We safely access the score from the array result.
    // The property name for the score on the fetched user object is typically 'neynar_user_score'.
    // We use bracket notation to be safe and ensure it is treated as a number.
    const userScore = (user as any)?.neynar_user_score as number | undefined; 

    console.log(`User FID: ${fidToCheck}, Neynar Score: ${userScore}`);

    if (userScore === undefined || userScore < NEYNAR_SCORE_THRESHOLD) {
      // 2. Reject the job post if the score is below the threshold
      return NextResponse.json(
        { 
          success: false, 
          message: `User score (${userScore ?? 'N/A'}) is too low. Must be ${NEYNAR_SCORE_THRESHOLD} or higher to post a job.` 
        },
        { status: 403 } // Forbidden
      );
    }
    
    // --- SCORE CHECK PASSED: PROCEED WITH JOB CREATION ---

  } catch (error) {
    console.error('Neynar API score check error:', error);
    return NextResponse.json(
      { success: false, message: 'An internal error occurred while checking user quality.' },
      { status: 500 }
    );
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
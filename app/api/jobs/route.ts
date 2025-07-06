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
        status: 'open', // Default status for new jobs
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
      // Select user_id and join profiles. The `profiles` here refers to the single related profile object.
      // TypeScript is being strict here, so we will handle its type inference.
      .select(`user_id, profiles(fid, display_name, username)`)
      .in('skill_id', selectedSkillIds) // Find users who have any of the required skills
      .not('user_id', 'eq', jobData.posterId) // Exclude the job poster themselves
      .order('user_id', { ascending: true }); // Order to potentially deduplicate easier

    if (matchingUsersError) {
      console.error("Error finding matching users for job notification:", matchingUsersError);
      // Don't fail job post, but notifications won't go out
    } else {
      const uniqueFidsToNotify = new Set<number>();
      matchingUsers?.forEach(us => {
        // Corrected: Access fid from the profiles object, which might be an array or single object depending on Supabase version/query interpretation.
        // Given the error `Property 'fid' does not exist on type '...[]'`, `us.profiles` is seen as an array.
        // We'll safely access the fid from the first element of that array.
        if (us.profiles && Array.isArray(us.profiles) && us.profiles.length > 0 && us.profiles[0].fid) {
          uniqueFidsToNotify.add(us.profiles[0].fid);
        } else if (us.profiles && typeof us.profiles === 'object' && 'fid' in us.profiles && us.profiles.fid) {
          // Fallback if profiles is treated as a single object (which is more common for 1-to-1 relations)
          uniqueFidsToNotify.add(us.profiles.fid);
        }
      });

      console.log(`Found ${uniqueFidsToNotify.size} unique FIDs to notify for job: ${newJob.title}`);

      // 4. Send Farcaster notifications to matched users
      for (const fid of uniqueFidsToNotify) {
        try {
          const notificationResult = await sendFrameNotification({
            fid: fid,
            title: `✨ New Farlance Job: ${newJob.title}`,
            body: `A new job matching your skills has been posted! "${newJob.description.substring(0, 70)}..."`,
            // Optionally, add a targetUrl to deep-link users directly to this job's details page later
            // notificationDetails: // Not needed here, sendFrameNotification fetches from Redis
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
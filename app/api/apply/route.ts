// app/api/apply/route.ts
// This API route handles job applications.

import { NextResponse } from 'next/server';
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server'; // Server-side Supabase client
import { sendFrameNotification } from '@/lib/notification-client'; // For sending Farcaster notifications
import { NeynarAPIClient, Configuration } from "@neynar/nodejs-sdk"; // To fetch poster's FID from their Supabase profile ID


// Initialize Neynar API client for resolving more user data for notifications
const neynarClient = new NeynarAPIClient(new Configuration({
  apiKey: process.env.NEYNAR_API_KEY!, // Use your server-side Neynar API key
}));

export async function POST(request: Request) {
  const { jobId, applicantProfileId, applicantFid, applicationMessage } = await request.json();

  if (!jobId || !applicantProfileId || !applicantFid) {
    return NextResponse.json({ message: 'Missing job ID, applicant profile ID, or applicant FID.' }, { status: 400 });
  }

  const supabase = createSupabaseServerClient();

  try {
    // 1. Get Job Details and Poster's FID
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('id, title, poster_id, profiles(fid, username, display_name)') // Select job details and join poster's profile
      .eq('id', jobId)
      .single();

    if (jobError || !job) {
      console.error("Error fetching job or job poster details:", jobError);
      return NextResponse.json({ message: 'Job not found or poster details unavailable.' }, { status: 404 });
    }

    // Safely extract posterFid from job.profiles, handling potential array type inference
    let posterFid: number | null = null;
    let posterUsername: string | null = null;

    if (job.profiles) {
      if (Array.isArray(job.profiles) && job.profiles.length > 0) {
        posterFid = (job.profiles[0] as any)?.fid as number;
        posterUsername = (job.profiles[0] as any)?.username || (job.profiles[0] as any)?.display_name || 'Job Poster';
      } else if (typeof job.profiles === 'object' && 'fid' in job.profiles) {
        posterFid = (job.profiles as any)?.fid as number;
        posterUsername = (job.profiles as any)?.username || (job.profiles as any)?.display_name || 'Job Poster';
      }
    }

    if (typeof posterFid !== 'number' || isNaN(posterFid)) {
      console.error("Poster FID not found or invalid for job:", job.id);
      return NextResponse.json({ message: 'Job poster FID not available for notification.' }, { status: 500 });
    }

    // NEW: Fetch applicant's profile for notification message (applicantName)
    const { data: applicantProfile, error: applicantProfileError } = await supabase
      .from('profiles')
      .select('username, display_name')
      .eq('id', applicantProfileId)
      .single();

    const applicantName = applicantProfile?.username || applicantProfile?.display_name || 'A Farlance User'; // Correctly declared here

    // 2. Insert application into 'applications' table
    const { data: newApplication, error: appInsertError } = await supabase
      .from('applications')
      .insert({
        job_id: jobId,
        applicant_profile_id: applicantProfileId,
        status: 'applied',
        message: applicationMessage || null,
      })
      .select()
      .single();

    if (appInsertError) {
      console.error("Error inserting new application:", appInsertError);
      return NextResponse.json({ message: 'Failed to submit application.' }, { status: 500 });
    }

    // 3. Send Farcaster notification to the Job Poster
    const APP_BASE_URL = process.env.NEXT_PUBLIC_URL || 'https://farlance.vercel.app';
    const notificationTargetUrl = `${APP_BASE_URL}/?view=profile`;

    try {
      const notificationResult = await sendFrameNotification({
        fid: posterFid,
        title: `💼 New Application for "${job.title}"!`,
        body: `@${applicantName} just applied for your job on Farlance.`, // Using applicantName
        targetUrl: notificationTargetUrl,
      });

      if (notificationResult.state === 'error') {
        console.error(`Failed to send application notification to poster FID ${posterFid}:`, notificationResult.error);
      } else {
        console.log(`Application notification sent to poster FID ${posterFid} for job ${job.id}.`);
      }
    } catch (notifyError) {
      console.error(`Unhandled error sending application notification to poster FID ${posterFid}:`, notifyError);
    }

    return NextResponse.json({ message: 'Application submitted successfully!', applicationId: newApplication.id }, { status: 200 });

  } catch (error) {
    console.error("Unhandled error during job application backend:", error);
    return NextResponse.json({ message: 'An unexpected error occurred.' }, { status: 500 });
  }
}
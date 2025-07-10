// app/api/contact/route.ts
// This API route sends direct messages via Warpcast's API.

import { NextResponse } from 'next/server';
import { NeynarAPIClient, Configuration } from "@neynar/nodejs-sdk"; // To get signer_uuid if needed, or other Neynar utils

// Import the UUID library to generate idempotencyKey (install if not present)
// npm install uuid
import { v4 as uuidv4 } from 'uuid';

// Warpcast API key (from Vercel Environment Variables)
const WARPCAST_API_KEY = process.env.WARPCAST_API_KEY!;

// Initialize Neynar client (optional, but useful if we need signer_uuid in the future)
// const neynarClient = new NeynarAPIClient(new Configuration({ apiKey: process.env.NEYNAR_API_KEY! }));

export async function POST(request: Request) {
  const { recipientFid, messageText } = await request.json();

  if (!recipientFid || !messageText) {
    return NextResponse.json({ message: 'Missing recipient FID or message text' }, { status: 400 });
  }

  if (!WARPCAST_API_KEY) {
    console.error("WARPCAST_API_KEY not set in environment variables.");
    return NextResponse.json({ message: 'Server configuration error: API key missing' }, { status: 500 });
  }

  try {
    const response = await fetch('https://api.warpcast.com/v2/ext-send-direct-cast', {
      method: 'PUT', // Warpcast API uses PUT for this endpoint
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${WARPCAST_API_KEY}`,
      },
      body: JSON.stringify({
        recipientFid: recipientFid,
        message: messageText,
        idempotencyKey: uuidv4(), // Prevents duplicate sends on retries
      }),
    });

    if (response.ok) {
      const responseData = await response.json();
      console.log("Warpcast Direct Cast API success:", responseData);
      return NextResponse.json({ message: 'Direct cast sent successfully!', data: responseData }, { status: 200 });
    } else {
      const errorData = await response.json();
      console.error("Warpcast Direct Cast API failed:", response.status, errorData);
      return NextResponse.json({ message: `Failed to send direct cast: ${errorData.message || response.statusText}` }, { status: response.status });
    }
  } catch (error) {
    console.error("Unhandled error sending direct cast:", error);
    return NextResponse.json({ message: 'An unexpected error occurred during direct cast' }, { status: 500 });
  }
}
// app/api/user-profile/[fid]/route.ts

// Professional comment: Import NeynarAPIClient and Configuration for API interactions.
// NextRequest and NextResponse are for Next.js server-side helpers.
import { NeynarAPIClient, Configuration } from "@neynar/nodejs-sdk";
import { NextRequest, NextResponse } from "next/server";

// Professional comment: Initialize Neynar client with API key from environment variables.
// This client instance is used to make calls to Neynar's Farcaster API.
const neynarClient = new NeynarAPIClient(
  new Configuration({ apiKey: process.env.NEYNAR_API_KEY as string })
);

// PROFESSIONAL COMMENT: Define the GET handler for this API route.
// It receives the request object and a 'context' object.
// The 'context' object contains the 'params' which hold dynamic route segments (like 'fid').
export async function GET(
  request: NextRequest, // The incoming Next.js request object
  context: { params: { fid: string } } // PROFESSIONAL COMMENT: Correct signature for dynamic params.
) {
  // PROFESSIONAL COMMENT: Extract the FID from the nested 'context.params' object.
  // No `await` is needed here as `context.params` is a synchronous object in this context.
  const fid = context.params.fid; // Corrected: Access fid from context.params

  // Professional comment: Validate that an FID was provided.
  if (!fid) {
    return NextResponse.json(
      { error: "Farcaster ID (FID) is required." },
      { status: 400 } // Bad Request
    );
  }

  try {
    // Professional comment: Convert FID to a number as Neynar's API expects it.
    const userFid = parseInt(fid, 10);

    // Professional comment: Use Neynar client's fetchBulkUsers method.
    // It expects an object with an array of FIDs.
    const response = await neynarClient.fetchBulkUsers({ fids: [userFid] });

    // Professional comment: Check if a user was found in the response.
    // fetchBulkUsers returns an object with a 'users' array.
    if (!response.users || response.users.length === 0) {
      return NextResponse.json(
        { error: `User with FID ${fid} not found.` },
        { status: 404 } // Not Found
      );
    }

    // Professional comment: Return the first user from the fetched array as a JSON response.
    // status 200 means success.
    const userData = response.users[0];
    return NextResponse.json(userData, { status: 200 });

  } catch (error) {
    // Professional comment: Handle any errors during API call or parsing.
    console.error("Error fetching user data from Neynar:", error); // Logs detailed error to Vercel/server logs
    return NextResponse.json(
      { error: "Failed to fetch user data." },
      { status: 500 } // Internal Server Error
    );
  }
}
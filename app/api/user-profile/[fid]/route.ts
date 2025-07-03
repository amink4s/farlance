// app/api/user-profile/[fid]/route.ts

// Professional comment: Import NeynarAPIClient for API interactions and Next.js types.
// Configuration is needed for initializing the client.
import { NeynarAPIClient, Configuration } from "@neynar/nodejs-sdk";
import { NextRequest, NextResponse } from "next/server";

// Professional comment: Initialize Neynar client.
// It securely accesses the NEYNAR_API_KEY from environment variables.
// The API key is now passed within a Configuration object, as expected by the SDK.
const neynarClient = new NeynarAPIClient(
  new Configuration({ apiKey: process.env.NEYNAR_API_KEY as string })
);

// Professional comment: Define the GET handler for this API route.
// This function will be called when a GET request is made to /api/user-profile/[fid].
export async function GET(
  request: NextRequest, // The incoming Next.js request object
  { params }: { params: { fid: string } } // Dynamic parameters from the URL (e.g., the fid)
) {
  // Professional comment: Extract the FID from the URL parameters.
  const { fid } = await params;

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

    // PROFESSIONAL COMMENT: Use the correct method: `fetchBulkUsers`.
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
    console.error("Error fetching user data from Neynar:", error);
    return NextResponse.json(
      { error: "Failed to fetch user data." },
      { status: 500 } // Internal Server Error
    );
  }
}
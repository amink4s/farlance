// app/api/user-profile/route.ts

// Professional comment: Import the entire Neynar Node.js SDK as a namespace.
// This is a workaround for the "no exported member 'NeynarAPIClient'" error.
import * as NeynarSDK from "@neynar/nodejs-sdk";
import { NextRequest, NextResponse } from "next/server"; // Using NextRequest for searchParams

// Professional comment: Initialize Neynar client.
// Access NeynarAPIClient and Configuration from the imported namespace.
const neynarClient = new NeynarSDK.NeynarAPIClient( // Accessed from namespace
  new NeynarSDK.Configuration({ apiKey: process.env.NEYNAR_API_KEY as string }) // Accessed from namespace
);

// Professional comment: Define the GET handler for this API route.
// This function handles incoming GET requests to URLs like /api/user-profile?fid=123.
export async function GET(request: NextRequest) {
  // Professional comment: Extract the Farcaster ID (fid) from the URL's query parameters.
  const fid = request.nextUrl.searchParams.get("fid");

  // Professional comment: Validate that an FID was provided in the query.
  if (!fid) {
    return NextResponse.json(
      { error: "Farcaster ID (FID) is required as a query parameter (e.g., ?fid=123)." },
      { status: 400 } // HTTP 400 Bad Request
    );
  }

  try {
    // Professional comment: Convert the FID from string to a number, as Neynar's API expects it.
    const userFid = parseInt(fid, 10);

    // Professional comment: Call Neynar's `fetchBulkUsers` API to get user profile data.
    const response = await neynarClient.fetchBulkUsers({ fids: [userFid] });

    // Professional comment: Check if a user was found in the response.
    if (!response.users || response.users.length === 0) {
      return NextResponse.json(
        { error: `User with FID ${fid} not found.` },
        { status: 404 } // HTTP 404 Not Found
      );
    }

    // Professional comment: Return the first user from the fetched array.
    const userData = response.users[0];
    return NextResponse.json(userData, { status: 200 });

  } catch (error) {
    // Professional comment: Catch and log any errors that occur during the API call or processing.
    console.error("Error fetching user data from Neynar:", error);
    return NextResponse.json(
      { error: "Failed to fetch user data due to an internal server error." },
      { status: 500 } // HTTP 500 Internal Server Error
    );
  }
}
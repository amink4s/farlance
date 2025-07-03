// app/api/user-profile/[fid]/route.ts

// Professional comment: Import NeynarAPIClient and Configuration for API interactions.
// Use 'Request' and 'NextResponse' from 'next/server' for Next.js API Route handlers.
import { NeynarAPIClient, Configuration } from "@neynar/nodejs-sdk";
import { Request, NextResponse } from "next/server"; // Using Request type for compatibility

// Professional comment: Initialize Neynar client.
// It securely accesses the NEYNAR_API_KEY from environment variables.
// The Configuration object ensures the API key is passed as expected by the SDK.
const neynarClient = new NeynarAPIClient(
  new Configuration({ apiKey: process.env.NEYNAR_API_KEY as string })
);

// Professional comment: Define the GET handler for this dynamic API route.
// This function handles incoming GET requests to URLs like /api/user-profile/123.
// 'request' is the incoming HTTP request.
// 'context' contains dynamic route parameters (like 'fid').
export async function GET(
  request: Request, // The incoming Next.js Request object (using generic Request for broader compatibility)
  context: { params: { fid: string } } // Professional comment: Correct signature for dynamic route parameters in App Router.
) {
  // Professional comment: Extract the Farcaster ID (fid) from the URL parameters.
  // 'context.params.fid' holds the dynamic segment (e.g., '123' from /api/user-profile/123).
  const fid = context.params.fid;

  // Professional comment: Validate that an FID was successfully extracted.
  // If not, return a 400 Bad Request error.
  if (!fid) {
    return NextResponse.json(
      { error: "Farcaster ID (FID) is required." },
      { status: 400 } // HTTP 400 Bad Request
    );
  }

  try {
    // Professional comment: Convert the FID from string to a number, as Neynar's API expects a numerical FID.
    const userFid = parseInt(fid, 10);

    // Professional comment: Call Neynar's `fetchBulkUsers` API to get user profile data.
    // This method expects an object with an array of FIDs.
    const response = await neynarClient.fetchBulkUsers({ fids: [userFid] });

    // Professional comment: Check if the API returned any users or if the array is empty.
    // If no user is found for the given FID, return a 404 Not Found error.
    if (!response.users || response.users.length === 0) {
      return NextResponse.json(
        { error: `User with FID ${fid} not found.` },
        { status: 404 } // HTTP 404 Not Found
      );
    }

    // Professional comment: Extract the first user object from the response array.
    const userData = response.users[0];

    // Professional comment: Return the fetched user data as a JSON response with a 200 OK status.
    return NextResponse.json(userData, { status: 200 });
  } catch (error) {
    // Professional comment: Catch and log any errors that occur during the API call or processing.
    // This will print detailed errors to your server's console (e.g., in `npm run dev` terminal or Vercel logs).
    console.error("Error fetching user data from Neynar:", error);

    // Professional comment: Return a generic 500 Internal Server Error for unhandled exceptions.
    return NextResponse.json(
      { error: "Failed to fetch user data due to an internal server error." },
      { status: 500 } // HTTP 500 Internal Server Error
    );
  }
}
// app/api/user-profile/route.ts

// Professional comment: Import NeynarAPIClient and Configuration for API interactions.
// Use 'NextRequest' (recommended for query params) and 'NextResponse' for Next.js API Route handlers.
import { NeynarAPIClient, Configuration } from "@neynar/nodejs-sdk";
import { NextRequest, NextResponse } from "next/server"; // Using NextRequest as it's better for searchParams

// Professional comment: Initialize Neynar client with API key from environment variables.
// This client instance is used to make calls to Neynar's Farcaster API.
const neynarClient = new NeynarAPIClient(
  new Configuration({ apiKey: process.env.NEYNAR_API_KEY as string })
);

// Professional comment: Define the GET handler for this API route.
// This function handles incoming GET requests to URLs like /api/user-profile?fid=123.
// It receives the NextRequest object, which contains URL and search parameters.
export async function GET(request: NextRequest) {
  // Professional comment: Extract the Farcaster ID (fid) from the URL's query parameters.
  // `request.nextUrl.searchParams` is a URLSearchParams object.
  const fid = request.nextUrl.searchParams.get("fid");

  // Professional comment: Validate that an FID was provided in the query.
  // If not, return a 400 Bad Request error.
  if (!fid) {
    return NextResponse.json(
      { error: "Farcaster ID (FID) is required as a query parameter (e.g., ?fid=123)." },
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
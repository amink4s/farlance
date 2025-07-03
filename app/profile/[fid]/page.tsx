// app/profile/[fid]/page.tsx

// Professional comment: This directive marks the component as a Client Component.
// It's required for using React Hooks like `useState` or `useEffect` and
// accessing client-side features like URL parameters.
"use client";

import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { useEffect } from "react";
import { useParams } from "next/navigation"; // Import hook to get dynamic URL parameters

// Professional comment: Defines the React component for the dynamic user profile page.
// It receives the dynamic segment (fid) from the URL.
export default function UserProfilePage() {
  // Professional comment: Access the MiniKit context to signal app readiness to Farcaster.
  const { setFrameReady, isFrameReady } = useMiniKit();

  // Professional comment: useParams hook from Next.js to get dynamic route segments.
  // This allows us to extract the 'fid' from the URL (e.g., /profile/123 becomes { fid: '123' }).
  const params = useParams();
  const fid = params.fid; // Extract the fid from the URL parameters

  // Professional comment: Effect to signal to Farcaster that the Mini App is ready.
  useEffect(() => {
    if (!isFrameReady) {
      setFrameReady();
    }
  }, [setFrameReady, isFrameReady]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        padding: "20px",
        textAlign: "center",
        backgroundColor: "#f0f2f5",
        color: "#333",
      }}
    >
      <h1 style={{ color: "#2c3e50", marginBottom: "20px" }}>
        Farlance User Profile
      </h1>
      {fid ? (
        <p style={{ fontSize: "1.1em", lineHeight: "1.5" }}>
          Displaying profile for Farcaster ID:{" "}
          <code style={{ backgroundColor: "#e0e0e0", padding: "4px 6px", borderRadius: "4px" }}>
            {fid}
          </code>
        </p>
      ) : (
        <p style={{ fontSize: "1.1em", lineHeight: "1.5" }}>
          No Farcaster ID provided in the URL.
        </p>
      )}
      <p style={{ marginTop: "20px", fontSize: "0.9em", color: "#666" }}>
        This is a placeholder. More profile details will appear here soon!
      </p>
    </div>
  );
}
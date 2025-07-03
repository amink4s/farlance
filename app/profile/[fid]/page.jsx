// app/profile/[fid]/page.tsx

// Professional comment: This directive marks the component as a Client Component.
"use client";

// Professional comment: Standard React hooks.
import { useEffect } from "react";
import { useParams } from "next/navigation"; // Import hook to get dynamic URL parameters

// PROFESSIONAL COMMENT: Corrected import for MiniKit components
// using direct named imports as per documentation, now that tsconfig allows it.
import { useMiniKit } from "@coinbase/onchainkit/minikit";

// Professional comment: Defines the React component for the dynamic user profile page.
export default function UserProfilePage() {
  // Professional comment: Access the MiniKit context to signal app readiness to Farcaster.
  const { setFrameReady, isFrameReady } = useMiniKit(); // Direct hook call

  // Professional comment: useParams hook from Next.js to get dynamic route segments.
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
// app/providers.tsx
"use client";

import { type ReactNode } from "react";
// We are removing wagmi/chains as it's part of OnchainKit's direct wallet integration
// import { base } from "wagmi/chains"; // REMOVE THIS LINE
import { NeynarContextProvider, Theme } from "@neynar/react"; // NEW IMPORT for Neynar SIWN
import "@neynar/react/dist/style.css"; // Essential for NeynarAuthButton styling
// We are replacing MiniKitProvider's auth with NeynarAuthButton, so removing direct import
// import { MiniKitProvider } from "@coinbase/onchainkit/minikit"; // REMOVE THIS LINE

export function Providers(props: { children: ReactNode }) {
  return (
    <NeynarContextProvider
      settings={{
        // This `clientId` is crucial: it MUST be your Neynar Client ID.
        // You likely put a Coinbase API key here before, now it needs to be Neynar's.
        clientId: process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY!, // Using the same env var for convenience, but its value is now Neynar's
        defaultTheme: Theme.Dark, // Or Theme.Light, based on your preference
        eventsCallbacks: {
          onAuthSuccess: (data) => {
            // This callback fires after successful Farcaster authentication via SIWN
            console.log("Neynar SIWN Auth Success:", data);
            // 'data' object contains { signer_uuid, fid, user }
            // This is where you could trigger a page reload, state update, or redirect if needed.
            // For now, it will just log. Your page.tsx useEffect will react to user context.
          },
          onSignout: () => {
            console.log("Neynar SIWN Signout");
            // Handle user signout, e.g., clear local storage, redirect to home.
            // Your page.tsx useEffect should also react to user context becoming null.
          },
        },
      }}
    >
      {props.children}
    </NeynarContextProvider>
  );
}
// components/ShareProfileModal.tsx
"use client";

import React, { useCallback } from 'react';
import { Button, Card } from './ui/shared'; // Reusable UI components
import { sdk } from "@farcaster/frame-sdk"; // Farcaster SDK for composeCast

type ShareProfileModalProps = {
  username: string; // The user's Farcaster username (from authenticatedData.user)
  appUrl: string;   // Farlance's base URL (NEXT_PUBLIC_URL)
  onClose: () => void; // Callback to close the modal
};

export default function ShareProfileModal({ username, appUrl, onClose }: ShareProfileModalProps) {
  const handleShareToFarcaster = useCallback(async () => {
    try {
      // Construct the cast text with escaped apostrophes
      const castText = `I just updated my profile on Farlance &ndash; the new Farcaster-native hub for freelance jobs and talent! 🚀 Come find your next gig or hire top talent. #Farlance @${username}`;
      
      // The URL to include in the cast, linking back to Farlance
      const castUrl = appUrl;

      // Use Farcaster SDK to compose a cast
      await sdk.actions.composeCast({
        text: castText,
        embeds: [castUrl], // <--- CHANGED HERE: Pass castUrl directly as string
      });

      console.log("Farcaster cast composer opened.");
      onClose(); // Close the modal after triggering the composer
    } catch (error) {
      console.error("Error composing Farcaster cast:", error);
      alert("Failed to open Farcaster composer. Please try again.");
    }
  }, [username, appUrl, onClose]);


  return (
    <div className="space-y-4 text-[var(--app-foreground)]">
      <h2 className="text-xl font-bold">Share Your Farlance Profile!</h2>
      <p className="text-[var(--app-foreground-muted)]">
        Let your Farcaster network know you&apos;re now on Farlance!
      </p>
      <div className="flex justify-end space-x-3">
        <Button variant="secondary" onClick={onClose}>
          Maybe Later
        </Button>
        <Button variant="primary" onClick={handleShareToFarcaster}>
          Share to Farcaster
        </Button>
      </div>
    </div>
  );
}
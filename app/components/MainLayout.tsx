// components/MainLayout.tsx
"use client";

import React, { useState, useCallback } from 'react';
import { NeynarAuthButton, useNeynarContext } from "@neynar/react";
import Image from 'next/image'; // For PFP in header
import { Button, Icon } from './ui/shared'; // Use Button and Icon from shared

// Props for MainLayout
type MainLayoutProps = {
  children: React.ReactNode; // The content of the active view (ProfileView or JobsView)
  activeView: 'jobs' | 'profile';
  setActiveView: (view: 'jobs' | 'profile') => void;
  // Pass authenticatedUser and supabaseProfile down to header if needed
  authenticatedUser: { pfp_url: string; display_name: string; username: string } | null;
};

export default function MainLayout({ children, activeView, setActiveView, authenticatedUser }: MainLayoutProps) {
  const { user, isAuthenticated } = useNeynarContext(); // Use Neynar context here for header data

  // Header content based on authentication status
  const headerContent = isAuthenticated && authenticatedUser ? (
    <div className="flex items-center space-x-2 cursor-pointer" onClick={() => setActiveView('profile')}>
      {authenticatedUser.pfp_url && (
        <Image
          src={authenticatedUser.pfp_url}
          alt="Profile Picture"
          width={32} // Smaller for header
          height={32}
          className="rounded-full"
          unoptimized={true}
        />
      )}
      <span className="text-md font-semibold text-[var(--app-foreground)]">
        {authenticatedUser.display_name || authenticatedUser.username}
      </span>
    </div>
  ) : (
    <span className="text-md font-semibold text-[var(--app-foreground-muted)]">
      Farlance
    </span>
  );

  return (
    <div className="flex flex-col min-h-screen font-sans text-[var(--app-foreground)] mini-app-theme from-[var(--app-background)] to-[var(--app-gray)]">
      <div className="w-full max-w-md mx-auto px-4 py-3">
        <header className="flex justify-between items-center mb-3 h-11">
          {/* Left side of header: App name or authenticated user info */}
          <div>
            {headerContent}
          </div>

          {/* Right side of header: Auth button or navigation */}
          <div className="flex items-center space-x-2">
            {isAuthenticated ? (
              // Show navigation buttons if authenticated
              <>
                <Button
                  variant={activeView === 'jobs' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveView('jobs')}
                >
                  Jobs
                </Button>
                <Button
                  variant={activeView === 'profile' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveView('profile')}
                >
                  Profile
                </Button>
              </>
            ) : (
              // Show sign in button if not authenticated
              <NeynarAuthButton />
            )}
          </div>
        </header>

        {/* Main content area, passed as children */}
        <main className="flex-1">
          {children}
        </main>

        {/* Footer */}
        <footer className="mt-2 pt-4 flex justify-center">
          <span className="text-[var(--app-foreground-muted)] text-xs">
            Farlance: Built for Farcaster
          </span>
        </footer>
      </div>
    </div>
  );
}
// components/MainLayout.tsx
"use client";

import React, { useState, useCallback } from 'react';
// REMOVED: import { NeynarAuthButton, useNeynarContext } from "@neynar/react"; // Removing useNeynarContext and NeynarAuthButton import
import Image from 'next/image';
import { Button, Icon } from './ui/shared';

type MainLayoutProps = {
  children: React.ReactNode;
  activeView: 'jobs' | 'profile' | 'post-job';
  setActiveView: (view: 'jobs' | 'profile' | 'post-job') => void;
  authenticatedUser: { pfp_url?: string; display_name?: string; username?: string } | null;
};

export default function MainLayout({ children, activeView, setActiveView, authenticatedUser }: MainLayoutProps) {
  // REMOVED: const { isAuthenticated } = useNeynarContext(); // No longer using useNeynarContext. Relies on authenticatedUser prop.

  // Header content based on whether we have successful `authenticatedUser` data
  const headerContent = authenticatedUser ? ( // If authenticatedUser is not null, display user info
    <div className="flex items-center space-x-2 cursor-pointer" onClick={() => setActiveView('profile')}>
      {authenticatedUser.pfp_url && (
        <Image
          src={authenticatedUser.pfp_url}
          alt="Profile Picture"
          width={32}
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
    // Show a generic title if user data is not yet available (loading or unauthenticated)
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

          {/* Right side of header: Navigation buttons if authenticated, or empty if not */}
          <div className="flex items-center space-x-2">
            {authenticatedUser ? ( // Only show navigation if authenticatedUser data is available
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
              // If not authenticated, show nothing in the right header (NeynarAuthButton is removed)
              null
            )}
          </div>
        </header>

        <main className="flex-1">
          {children}
        </main>

        <footer className="mt-2 pt-4 flex justify-center">
           <span className="text-[var(--app-foreground-muted)] text-xs">
             Farlance: Built for Farcaster
           </span>
        </footer>
      </div>
    </div>
  );
}
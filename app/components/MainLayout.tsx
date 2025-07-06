// components/MainLayout.tsx
"use client";

import React, { useState, useCallback } from 'react';
import { NeynarAuthButton, useNeynarContext } from "@neynar/react";
import Image from 'next/image';
import { Button, Icon } from './ui/shared';

// Props for MainLayout
type MainLayoutProps = {
  children: React.ReactNode;
  activeView: 'jobs' | 'profile' | 'post-job'; // <--- UPDATED TYPE HERE
  setActiveView: (view: 'jobs' | 'profile' | 'post-job') => void; // <--- UPDATED TYPE HERE
  authenticatedUser: { pfp_url?: string; display_name?: string; username?: string } | null;
};

export default function MainLayout({ children, activeView, setActiveView, authenticatedUser }: MainLayoutProps) {
  const { isAuthenticated } = useNeynarContext();

  const headerContent = authenticatedUser ? (
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
    <span className="text-md font-semibold text-[var(--app-foreground-muted)]">
      Farlance
    </span>
  );

  return (
    <div className="flex flex-col min-h-screen font-sans text-[var(--app-foreground)] mini-app-theme from-[var(--app-background)] to-[var(--app-gray)]">
      <div className="w-full max-w-md mx-auto px-4 py-3">
        <header className="flex justify-between items-center mb-3 h-11">
          <div>
            {headerContent}
          </div>

          <div className="flex items-center space-x-2">
            {isAuthenticated && (
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
                {/* No direct "Post a Job" button in header here, it's on the ProfileView */}
              </>
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
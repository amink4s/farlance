// components/JobsView.tsx
"use client";

import React from 'react';
import { Card } from './ui/shared';

export default function JobsView() {
  return (
    <div className="flex flex-col min-h-screen font-sans text-[var(--app-foreground)] mini-app-theme from-[var(--app-background)] to-[var(--app-gray)]">
      <div className="w-full max-w-md mx-auto px-4 py-3">
        {/* Header will be in MainLayout.tsx */}
        {/* <header>...</header> */}

        <main className="flex-1">
          <Card title="Available Freelance Jobs">
            <p className="text-[var(--app-foreground-muted)] mb-4">
              Job listings coming soon!
            </p>
            {/* Placeholder for job search/filter and list */}
            <p className="text-[var(--app-foreground-muted)] text-sm">
              This is where you&apos;ll find exciting job opportunities.
            </p>
          </Card>
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
// app/layout.tsx
import "./theme.css";
import "@coinbase/onchainkit/styles.css";
import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { Suspense } from "react";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export async function generateMetadata(): Promise<Metadata> {
  const URL = process.env.NEXT_PUBLIC_URL; // Your Vercel app URL

  // Define some default values or use existing env vars for new metadata fields
  const APP_NAME = process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME || "Farlance";
  const APP_SUBTITLE = process.env.NEXT_PUBLIC_APP_SUBTITLE || "Your Job and Talent Hub for Farcaster";
  const APP_DESCRIPTION = process.env.NEXT_PUBLIC_APP_DESCRIPTION || "Connect Farcaster freelancers with projects. Post jobs or find talent based on skills.";
  const APP_PRIMARY_CATEGORY = process.env.NEXT_PUBLIC_APP_PRIMARY_CATEGORY || "utility"; // Example: social, finance, games, utility
  const APP_TAGLINE = process.env.NEXT_PUBLIC_APP_TAGLINE || "The Farcaster Freelance Marketplace";
  const HERO_IMAGE = process.env.NEXT_PUBLIC_APP_HERO_IMAGE || `${URL}/hero.png`; // Fallback hero image URL
  const SPLASH_IMAGE = process.env.NEXT_PUBLIC_SPLASH_IMAGE || `${URL}/splash.png`; // Fallback splash image URL
  const OG_TITLE = process.env.NEXT_PUBLIC_APP_OG_TITLE || `${APP_NAME} - ${APP_SUBTITLE}`;
  const OG_DESCRIPTION = process.env.NEXT_PUBLIC_APP_OG_DESCRIPTION || APP_DESCRIPTION;
  const OG_IMAGE = process.env.NEXT_PUBLIC_APP_OG_IMAGE || HERO_IMAGE; // OG image usually same as hero

  // Ensure these tags are also in your Vercel Environment Variables
  const APP_TAGS = [ // Example tags, you can customize these!
    "freelance",
    "freelancer",
    "jobs",
    "web3"
  ];

  return {
    title: APP_NAME,
    description: APP_DESCRIPTION,
    other: {
      "fc:frame": JSON.stringify({
        version: "next", // Use "next" for latest spec
        name: APP_NAME,
        iconUrl: process.env.NEXT_PUBLIC_APP_ICON || `${URL}/icon.png`, // Use your actual app icon URL
        splashImageUrl: SPLASH_IMAGE,
        splashBackgroundColor: process.env.NEXT_PUBLIC_SPLASH_BACKGROUND_COLOR || "#000000",
        homeUrl: URL,
        webhookUrl: process.env.NEXT_PUBLIC_WEBHOOK_URL || `${URL}/api/webhook`, // Ensure you have a webhook URL set up if using
        
        // NEW EXTENDED METADATA FIELDS:
        subtitle: APP_SUBTITLE,
        description: APP_DESCRIPTION,
        // screenshotUrls: [ // Optional: Add URLs to actual screenshots of your app
        //   `${URL}/screenshots/screenshot1.png`,
        //   `${URL}/screenshots/screenshot2.png`
        // ],
        primaryCategory: APP_PRIMARY_CATEGORY,
        tags: APP_TAGS,
        heroImageUrl: HERO_IMAGE,
        tagline: APP_TAGLINE,
        ogTitle: OG_TITLE,
        ogDescription: OG_DESCRIPTION,
        ogImageUrl: OG_IMAGE,

        // Button is part of the Frame specification itself, not extended metadata
        button: {
          title: `Launch ${APP_NAME}`,
          action: {
            type: "launch_frame",
            name: APP_NAME,
            url: URL,
            splashImageUrl: SPLASH_IMAGE,
            splashBackgroundColor: process.env.NEXT_PUBLIC_SPLASH_BACKGROUND_COLOR || "#000000",
          },
        },
        // REMOVED: noindex: true, 
      }),
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-background">
        <Suspense fallback={<div>Loading Farlance...</div>}>
          <Providers>{children}</Providers>
        </Suspense>
      </body>
    </html>
  );
}
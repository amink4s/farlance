// app/layout.tsx
import "./theme.css";
import "@coinbase/onchainkit/styles.css"; // Keep this if it's for general theme
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

  // Define values for metadata fields, pulled from env vars or with fallbacks
  const APP_NAME = process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME || "Farlance";
  const APP_SUBTITLE = process.env.NEXT_PUBLIC_APP_SUBTITLE || "Your Job and Talent Hub for Farcaster";
  const APP_DESCRIPTION = process.env.NEXT_PUBLIC_APP_DESCRIPTION || "Connect Farcaster freelancers with projects. Post jobs or find talent based on skills.";
  const APP_PRIMARY_CATEGORY = process.env.NEXT_PUBLIC_APP_PRIMARY_CATEGORY || "utility";
  const APP_TAGLINE = process.env.NEXT_PUBLIC_APP_TAGLINE || "Freelance Marketplace";

  // Image URLs - ensure these env vars are set in Vercel with actual image URLs
  const APP_ICON = process.env.NEXT_PUBLIC_APP_ICON || `${URL}/icon.png`;
  const SPLASH_IMAGE = process.env.NEXT_PUBLIC_SPLASH_IMAGE || `${URL}/splash.png`;
  const HERO_IMAGE = process.env.NEXT_PUBLIC_APP_HERO_IMAGE || `${URL}/hero.png`; // This will be the main image for the embed
  const OG_IMAGE = process.env.NEXT_PUBLIC_APP_OG_IMAGE || HERO_IMAGE; // OG image usually same as hero

  // OG Title and Description for general social sharing
  const OG_TITLE = process.env.NEXT_PUBLIC_APP_OG_TITLE || `${APP_NAME} - ${APP_SUBTITLE}`;
  const OG_DESCRIPTION = process.env.NEXT_PUBLIC_APP_OG_DESCRIPTION || APP_DESCRIPTION;

  // App tags (if needed in meta tag, though primary is in /.well-known)
  const APP_TAGS_STRING = process.env.NEXT_PUBLIC_APP_TAGS_STRING || "freelance,jobs";
  const APP_TAGS = APP_TAGS_STRING.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);

  return {
    title: APP_NAME,
    description: APP_DESCRIPTION,
    // Open Graph tags for general social media sharing
    openGraph: {
      title: OG_TITLE,
      description: OG_DESCRIPTION,
      images: [
        {
          url: OG_IMAGE,
          width: 1200, // Recommended width for OG images
          height: 630, // Recommended height for OG images (1.91:1 aspect ratio)
          alt: OG_TITLE,
        },
      ],
      url: URL,
      siteName: APP_NAME,
      type: 'website',
    },
    // Farcaster Mini App Embed Metadata (for rich embeds in casts)
    other: {
      // Primary meta tag for Mini App embeds (uses version "next")
      "fc:miniapp": JSON.stringify({
        version: "next", // Recommended version for fc:miniapp meta tag
        imageUrl: HERO_IMAGE, // This is the main image for the cast embed!
        button: {
          title: `Launch ${APP_NAME}`, // This is the button title for the cast embed
          action: {
            type: "launch_frame", // Or "launch_miniapp"
            name: APP_NAME,
            url: URL, // URL to open when embed button is clicked
            splashImageUrl: SPLASH_IMAGE,
            splashBackgroundColor: process.env.NEXT_PUBLIC_SPLASH_BACKGROUND_COLOR || "#000000",
          },
        },
      }),
      // For backward compatibility, also include fc:frame (uses version "1")
      "fc:frame": JSON.stringify({
        version: "next", // Legacy version for fc:frame meta tag
        imageUrl: HERO_IMAGE,
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
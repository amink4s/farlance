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

// Reverting generateMetadata to a simpler form that does not stringify fc:frame
// The fc:frame manifest is now handled by the dedicated API route
export async function generateMetadata(): Promise<Metadata> {
  // These are for general SEO/social sharing, not the Farcaster manifest directly
  const APP_NAME = process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME || "Farlance";
  const APP_DESCRIPTION = process.env.NEXT_PUBLIC_APP_DESCRIPTION || "Connect Farcaster freelancers with projects. Post jobs or find talent based on skills.";
  const OG_IMAGE = process.env.NEXT_PUBLIC_APP_OG_IMAGE || process.env.NEXT_PUBLIC_APP_HERO_IMAGE || ""; // Fallback for OG image

  return {
    title: APP_NAME,
    description: APP_DESCRIPTION,
    // Optional: you can still provide a basic fc:frame meta tag if needed,
    // but the primary manifest is served by /.well-known/farcaster.json/route.ts
    // This avoids conflicts with the dedicated manifest route.
    // For general Open Graph tags, you can add them here:
    openGraph: {
      title: APP_NAME,
      description: APP_DESCRIPTION,
      images: [
        {
          url: OG_IMAGE,
          width: 1200,
          height: 630,
          alt: APP_NAME,
        },
      ],
      url: process.env.NEXT_PUBLIC_URL,
      siteName: APP_NAME,
      type: 'website',
    },
    // The rest of the fc:frame properties will come from the JSON manifest API route
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
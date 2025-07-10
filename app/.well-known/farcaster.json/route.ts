// app/.well-known/farcaster.json/route.ts
// This API route serves the official Farcaster Mini App manifest.

import { NextResponse } from 'next/server';

export async function GET() {
  const URL = process.env.NEXT_PUBLIC_URL; // Your Vercel app URL

  // Ensure that all these environment variables are set in Vercel.
  // These are used for the Farcaster manifest, social sharing, etc.
  const APP_NAME = process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME || "Farlance";
  const APP_SUBTITLE = process.env.NEXT_PUBLIC_APP_SUBTITLE || "Your Job and Talent Hub for Farcaster";
  const APP_DESCRIPTION = process.env.NEXT_PUBLIC_APP_DESCRIPTION || "Connect Farcaster freelancers with projects. Post jobs or find talent based on skills.";
  const APP_PRIMARY_CATEGORY = process.env.NEXT_PUBLIC_APP_PRIMARY_CATEGORY || "utility"; // e.g., "social", "finance", "games", "utility"
  const APP_TAGLINE = process.env.NEXT_PUBLIC_APP_TAGLINE || "Freelance Marketplace";
  const HERO_IMAGE = process.env.NEXT_PUBLIC_APP_HERO_IMAGE || `${URL}/hero.png`;
  const SPLASH_IMAGE = process.env.NEXT_PUBLIC_SPLASH_IMAGE || `${URL}/splash.png`;
  const APP_ICON = process.env.NEXT_PUBLIC_APP_ICON || `${URL}/icon.png`; // Your app icon URL
  const OG_TITLE = process.env.NEXT_PUBLIC_APP_OG_TITLE || `${APP_NAME} - ${APP_SUBTITLE}`;
  const OG_DESCRIPTION = process.env.NEXT_PUBLIC_APP_OG_DESCRIPTION || APP_DESCRIPTION;
  const OG_IMAGE = process.env.NEXT_PUBLIC_APP_OG_IMAGE || HERO_IMAGE;

  // App tags pulled from an environment variable string and parsed
  const APP_TAGS_STRING = process.env.NEXT_PUBLIC_APP_TAGS_STRING || "freelance,jobs";
  const APP_TAGS = APP_TAGS_STRING.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);

  // Your Farcaster Account Association details (from .env), critical for ownership verification
  const ACCOUNT_ASSOCIATION_HEADER = process.env.FARCASTER_HEADER!;
  const ACCOUNT_ASSOCIATION_PAYLOAD = process.env.FARCASTER_PAYLOAD!;
  const ACCOUNT_ASSOCIATION_SIGNATURE = process.env.FARCASTER_SIGNATURE!;

  const manifest = {
    accountAssociation: {
      header: ACCOUNT_ASSOCIATION_HEADER,
      payload: ACCOUNT_ASSOCIATION_PAYLOAD,
      signature: ACCOUNT_ASSOCIATION_SIGNATURE,
    },
    // Using "miniapp" property and "version": "1" as per official spec example
    miniapp: { // <--- CRITICAL: Use "miniapp" here
      version: "1", // <--- CRITICAL: Set to "1" as per official spec example
      name: APP_NAME,
      iconUrl: APP_ICON,
      splashImageUrl: SPLASH_IMAGE,
      splashBackgroundColor: process.env.NEXT_PUBLIC_SPLASH_BACKGROUND_COLOR || "#000000",
      homeUrl: URL,
      webhookUrl: process.env.NEXT_PUBLIC_WEBHOOK_URL || `${URL}/api/webhook`, // Ensure this webhook URL is valid

      // Extended Metadata (as per spec, even if version is 1 for "miniapp")
      subtitle: APP_SUBTITLE,
      description: APP_DESCRIPTION,
      // screenshotUrls: ["https://your-app.com/screenshot1.png"], // Optional: Add actual screenshot URLs if you have them
      primaryCategory: APP_PRIMARY_CATEGORY,
      tags: APP_TAGS, // Populated from env var
      heroImageUrl: HERO_IMAGE,
      tagline: APP_TAGLINE, // Populated from env var
      ogTitle: OG_TITLE,
      ogDescription: OG_DESCRIPTION,
      ogImageUrl: OG_IMAGE,

      // button (for embeds) properties are part of the 'miniapp' object
      // They usually come from the homeUrl frame itself or are a default if client needs it.
      // This matches the Example Manifest in the official docs for "miniapp" key.
      button: {
        title: `Launch ${APP_NAME}`,
        action: {
          type: "launch_frame", // Or "launch_miniapp" per spec example
          name: APP_NAME,
          url: URL,
          splashImageUrl: SPLASH_IMAGE,
          splashBackgroundColor: process.env.NEXT_PUBLIC_SPLASH_BACKGROUND_COLOR || "#000000",
        },
      },
    },
  };

  // Return the manifest as JSON
  return NextResponse.json(manifest);
}
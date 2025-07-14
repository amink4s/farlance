// app/.well-known/farcaster.json/route.ts
// This API route serves the official Farcaster Mini App manifest.

import { NextResponse } from 'next/server';

export async function GET() {
  // Use a temporary variable for the base URL to ensure no trailing slash issues
  const BASE_URL = process.env.NEXT_PUBLIC_URL?.endsWith('/') ? process.env.NEXT_PUBLIC_URL.slice(0, -1) : process.env.NEXT_PUBLIC_URL || "https://farlance.vercel.app";

  // Ensure that all these environment variables are set in Vercel.
  const APP_NAME = process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME || "Farlance";
  const APP_SUBTITLE = process.env.NEXT_PUBLIC_APP_SUBTITLE || "Your Job and Talent Hub for Farcaster";
  const APP_DESCRIPTION = process.env.NEXT_PUBLIC_APP_DESCRIPTION || "Connect Farcaster freelancers with projects. Post jobs or find talent based on skills.";
  const APP_PRIMARY_CATEGORY = process.env.NEXT_PUBLIC_APP_PRIMARY_CATEGORY || "utility";
  const APP_TAGLINE = process.env.NEXT_PUBLIC_APP_TAGLINE || "The Farcaster Freelance Marketplace";
  const OG_TITLE = process.env.NEXT_PUBLIC_APP_OG_TITLE || `${APP_NAME} - ${APP_SUBTITLE}`;
  const OG_DESCRIPTION = process.env.NEXT_PUBLIC_APP_OG_DESCRIPTION || APP_DESCRIPTION;

  // NEW: Robust image URL construction using BASE_URL
  const HERO_IMAGE = process.env.NEXT_PUBLIC_APP_HERO_IMAGE || `${BASE_URL}/hero.png`;
  const SPLASH_IMAGE = process.env.NEXT_PUBLIC_SPLASH_IMAGE || `${BASE_URL}/splash.png`;
  const APP_ICON = process.env.NEXT_PUBLIC_APP_ICON || `${BASE_URL}/icon.png`;
  const OG_IMAGE = process.env.NEXT_PUBLIC_APP_OG_IMAGE || HERO_IMAGE;

  // App tags pulled from an environment variable string and parsed
  const APP_TAGS_STRING = process.env.NEXT_PUBLIC_APP_TAGS_STRING || "freelance,jobs";
  const APP_TAGS = APP_TAGS_STRING.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);

  // Your Farcaster Account Association details (from .env)
  const ACCOUNT_ASSOCIATION_HEADER = process.env.FARCASTER_HEADER!;
  const ACCOUNT_ASSOCIATION_PAYLOAD = process.env.FARCASTER_PAYLOAD!;
  const ACCOUNT_ASSOCIATION_SIGNATURE = process.env.FARCASTER_SIGNATURE!;


  const manifest = {
    accountAssociation: {
      header: ACCOUNT_ASSOCIATION_HEADER,
      payload: ACCOUNT_ASSOCIATION_PAYLOAD,
      signature: ACCOUNT_ASSOCIATION_SIGNATURE,
    },
    miniapp: {
      version: "next",
      name: APP_NAME,
      iconUrl: APP_ICON, // Using new constructed URL
      splashImageUrl: SPLASH_IMAGE, // Using new constructed URL
      splashBackgroundColor: process.env.NEXT_PUBLIC_SPLASH_BACKGROUND_COLOR || "#000000",
      homeUrl: `${BASE_URL}/`, // Ensure trailing slash if needed for homeUrl spec
      imageUrl: SPLASH_IMAGE,
      buttonTitle: "Launch Farlance",
      webhookUrl: process.env.NEXT_PUBLIC_WEBHOOK_URL || `${BASE_URL}/api/webhook`, // Using new constructed URL
      
      subtitle: APP_SUBTITLE,
      description: APP_DESCRIPTION,
      // screenshotUrls: [],
      primaryCategory: APP_PRIMARY_CATEGORY,
      tags: APP_TAGS,
      heroImageUrl: HERO_IMAGE, // Using new constructed URL
      tagline: APP_TAGLINE,
      ogTitle: OG_TITLE,
      ogDescription: OG_DESCRIPTION,
      ogImageUrl: OG_IMAGE, // Using new constructed URL

      button: {
        title: `Launch ${APP_NAME}`,
        action: {
          type: "launch_frame",
          name: APP_NAME,
          url: `${BASE_URL}/`, // Ensure trailing slash if needed
          splashImageUrl: SPLASH_IMAGE, // Using new constructed URL
          splashBackgroundColor: process.env.NEXT_PUBLIC_SPLASH_BACKGROUND_COLOR || "#000000",
        },
      },
    },
  };

  return NextResponse.json(manifest);
}
// lib/notification-client.ts
"use client"; // This directive is present in the file, keep it

import {
  FrameNotificationDetails,
  type SendNotificationRequest,
  sendNotificationResponseSchema,
} from "@farcaster/frame-sdk";
import { getUserNotificationDetails } from "@/lib/notification";

// The default appUrl might be used if targetUrl is not provided
const appUrl = process.env.NEXT_PUBLIC_URL || "";

type SendFrameNotificationResult =
  | { state: "error"; error: unknown; }
  | { state: "no_token" }
  | { state: "rate_limit" }
  | { state: "success" };

export async function sendFrameNotification({
  fid,
  title,
  body,
  notificationDetails,
  targetUrl, // <--- NEW: Accept targetUrl here as a parameter
}: {
  fid: number;
  title: string;
  body: string;
  notificationDetails?: FrameNotificationDetails | null;
  targetUrl?: string; // <--- NEW: Type targetUrl here as optional string
}): Promise<SendFrameNotificationResult> {
  if (!notificationDetails) {
    notificationDetails = await getUserNotificationDetails(fid);
  }
  if (!notificationDetails) {
    return { state: "no_token" };
  }

  const response = await fetch(notificationDetails.url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      notificationId: crypto.randomUUID(),
      title,
      body,
      targetUrl: targetUrl || appUrl, // <--- NEW: Use the passed targetUrl, or fallback to default appUrl
      tokens: [notificationDetails.token],
    } satisfies SendNotificationRequest),
  });

  const responseJson = await response.json();

  if (response.status === 200) {
    const responseBody = sendNotificationResponseSchema.safeParse(responseJson);
    if (responseBody.success === false) {
      return { state: "error", error: responseBody.error.errors };
    }

    if (responseBody.data.result.rateLimitedTokens.length) {
      return { state: "rate_limit" };
    }

    return { state: "success" };
  }

  return { state: "error", error: responseJson };
}
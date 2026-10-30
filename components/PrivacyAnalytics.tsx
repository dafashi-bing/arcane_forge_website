"use client";

import { usePathname } from "next/navigation";
import { Analytics, type BeforeSendEvent } from "@vercel/analytics/react";
import { isPrivateWebsiteUrl, publicAnalyticsEvent } from "@/lib/site-privacy.mjs";

// Keep this callback stable and read the current URL at send time. Unmounting
// Analytics alone does not remove the script installed during an earlier visit.
function beforeSend(event: BeforeSendEvent) {
  return publicAnalyticsEvent(event, typeof window === "undefined" ? null : window.location.href);
}

export default function PrivacyAnalytics() {
  const pathname = usePathname();
  if (!pathname || isPrivateWebsiteUrl(pathname) ||
      (typeof window !== "undefined" && isPrivateWebsiteUrl(window.location.href))) return null;

  return <Analytics beforeSend={beforeSend} debug={false} />;
}

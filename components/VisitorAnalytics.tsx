"use client";

import { Analytics } from "@vercel/analytics/next";

// Only send the first page view per page per browser per day. Vercel counts
// unique visitors per day, so visitor numbers (total and per page) stay
// accurate while repeat views of the same page are dropped to save events.
export default function VisitorAnalytics() {
  return (
    <Analytics
      beforeSend={(event) => {
        try {
          const today = new Date().toISOString().slice(0, 10);
          const key = `va:${new URL(event.url).pathname}`;
          if (localStorage.getItem(key) === today) return null;
          localStorage.setItem(key, today);
        } catch {}
        return event;
      }}
    />
  );
}

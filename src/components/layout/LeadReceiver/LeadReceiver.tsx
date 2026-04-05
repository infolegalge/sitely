"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Cross-domain receiver: when a lead clicks from a demo site to sitely.ge,
 * the URL contains ?ref=<secure_link_id>. This component:
 *  1. Captures that ref and persists it in localStorage (survives navigation).
 *  2. Resolves it to a demo_id via /api/tracking/resolve.
 *  3. Tracks page views on our main site (page_open) tied to the original demo.
 */
export default function LeadReceiver() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const resolvedRef = useRef<{ demoId: string; sessionId: string } | null>(null);

  // Step 1: Capture ref from URL or restore from localStorage
  useEffect(() => {
    const urlRef = searchParams.get("ref");

    if (urlRef) {
      localStorage.setItem("sitely_lead_ref", urlRef);
    }

    const ref = urlRef || localStorage.getItem("sitely_lead_ref");
    if (!ref) return;

    // Get or create session id
    let sid = sessionStorage.getItem("sitely_rx_sid");
    if (!sid) {
      sid = crypto.randomUUID();
      sessionStorage.setItem("sitely_rx_sid", sid);
    }

    // Resolve the ref to a demo_id
    fetch(`/api/tracking/resolve?ref=${encodeURIComponent(ref)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.demo_id) {
          resolvedRef.current = { demoId: data.demo_id, sessionId: sid! };
        }
      })
      .catch(() => {});
  }, [searchParams]);

  // Step 2: Track page views on our site tied to this lead
  useEffect(() => {
    // Wait for resolution
    const timer = setTimeout(() => {
      const info = resolvedRef.current;
      if (!info) return;

      const payload = {
        events: [
          {
            demo_id: info.demoId,
            event_type: "page_open" as const,
            session_id: info.sessionId,
            page_url: window.location.href,
            referrer: document.referrer,
            user_agent: navigator.userAgent,
            is_main_site: true,
            extra: { page: pathname },
          },
        ],
      };

      navigator.sendBeacon(
        "/api/tracking",
        JSON.stringify(payload)
      );
    }, 500);

    return () => clearTimeout(timer);
  }, [pathname]);

  return null;
}

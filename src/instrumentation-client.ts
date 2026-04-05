import posthog from "posthog-js";

posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
  api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  person_profiles: "identified_only",

  // ── Autocapture: clicks, inputs, form submits, page views ──
  capture_pageview: true,
  capture_pageleave: true,
  autocapture: true,

  // ── Session Replay: record full user sessions ──
  enable_recording_console_log: true,
  session_recording: {
    recordCrossOriginIframes: true,
  },

  // ── Heatmaps: click & scroll heatmaps ──
  enable_heatmaps: true,

  // ── Scroll depth: automatic tracking ──
  capture_dead_clicks: true,

  // ── Performance / network ──
  capture_performance: true,
});

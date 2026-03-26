"use client";

import DemoTimeline from "../DemoTimeline/DemoTimeline";

export default function DemoTimelinePage({ demoId }: { demoId: string }) {
  return <DemoTimeline demoId={demoId} />;
}

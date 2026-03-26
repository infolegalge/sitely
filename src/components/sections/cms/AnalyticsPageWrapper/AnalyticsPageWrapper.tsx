"use client";

import AnalyticsProvider from "../AnalyticsProvider/AnalyticsProvider";
import AnalyticsPage from "../AnalyticsPage/AnalyticsPage";

export default function AnalyticsPageWrapper() {
  return (
    <AnalyticsProvider>
      <AnalyticsPage />
    </AnalyticsProvider>
  );
}

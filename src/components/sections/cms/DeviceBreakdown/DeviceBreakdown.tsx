"use client";

import { useAnalytics } from "../AnalyticsProvider/AnalyticsProvider";
import { BreakdownSkeleton } from "../AnalyticsSkeleton/AnalyticsSkeleton";
import RetryEmpty from "../RetryEmpty/RetryEmpty";
import s from "./DeviceBreakdown.module.css";

const DEVICE_LABELS: Record<string, string> = {
  desktop: "კომპიუტერი",
  mobile: "მობილური",
  tablet: "ტაბლეტი",
  unknown: "უცნობი",
};

const DEVICE_ICONS: Record<string, string> = {
  desktop: "🖥",
  mobile: "📱",
  tablet: "📋",
  unknown: "❓",
};

const DEVICE_COLORS: Record<string, string> = {
  desktop: "var(--cms-blue)",
  mobile: "var(--cms-cyan)",
  tablet: "var(--cms-violet)",
  unknown: "var(--cms-tx-3)",
};

export default function DeviceBreakdown() {
  const { devices, wave2Loading } = useAnalytics();

  if (!devices.length && wave2Loading) return <BreakdownSkeleton rows={3} />;

  if (!devices.length) {
    return (
      <div className={s.wrap}>
        <h3 className={s.title}>📱 მოწყობილობები</h3>
        <RetryEmpty message="მოწყობილობის მონაცემები არ არის" />
      </div>
    );
  }

  const total = devices.reduce((sum, d) => sum + d.sessions, 0) || 1;

  return (
    <div className={s.wrap}>
      <h3 className={s.title}>📱 მოწყობილობები</h3>
      <div className={s.grid}>
        {devices.map((entry) => {
          const pct = ((entry.sessions / total) * 100).toFixed(1);
          return (
            <div key={entry.device_type} className={s.card}>
              <span className={s.icon} aria-hidden="true">{DEVICE_ICONS[entry.device_type] || "❓"}</span>
              <span className={s.label}>{DEVICE_LABELS[entry.device_type] || entry.device_type}</span>
              <span className={s.pct}>{pct}%</span>
              <span className={s.count}>{entry.sessions} სესია</span>
              <div className={s.ringWrap} role="img" aria-label={`${DEVICE_LABELS[entry.device_type] || entry.device_type}: ${pct}%`}>
                <svg viewBox="0 0 36 36" className={s.ring}>
                  <circle
                    className={s.ringBg}
                    cx="18" cy="18" r="15.915"
                    fill="none"
                    strokeWidth="3"
                  />
                  <circle
                    className={s.ringFg}
                    cx="18" cy="18" r="15.915"
                    fill="none"
                    strokeWidth="3"
                    strokeDasharray={`${parseFloat(pct)} ${100 - parseFloat(pct)}`}
                    strokeDashoffset="25"
                    stroke={DEVICE_COLORS[entry.device_type] || "var(--cms-tx-3)"}
                  />
                </svg>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

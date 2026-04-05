"use client";

import { useAnalytics } from "../AnalyticsProvider/AnalyticsProvider";
import { BreakdownSkeleton } from "../AnalyticsSkeleton/AnalyticsSkeleton";
import s from "./WebVitals.module.css";

interface VitalThresholds {
  good: number;
  needsWork: number;
  unit: string;
  label: string;
  description: string;
}

const VITAL_DEFS: Record<string, VitalThresholds> = {
  LCP: {
    good: 2500,
    needsWork: 4000,
    unit: "ms",
    label: "Largest Contentful Paint",
    description: "ვიზუალური ჩატვირთვის სიჩქარე",
  },
  FID: {
    good: 100,
    needsWork: 300,
    unit: "ms",
    label: "First Input Delay",
    description: "პირველი ინტერაქციის დაყოვნება",
  },
  CLS: {
    good: 0.1,
    needsWork: 0.25,
    unit: "",
    label: "Cumulative Layout Shift",
    description: "ვიზუალური სტაბილურობა",
  },
  TTFB: {
    good: 800,
    needsWork: 1800,
    unit: "ms",
    label: "Time to First Byte",
    description: "სერვერის რესპონსის დრო",
  },
};

function getGrade(metric: string, value: number): "good" | "needs-work" | "poor" {
  const def = VITAL_DEFS[metric];
  if (!def) return "needs-work";
  if (value <= def.good) return "good";
  if (value <= def.needsWork) return "needs-work";
  return "poor";
}

function formatValue(value: number, metric: string): string {
  if (metric === "CLS") return value.toFixed(3);
  if (value >= 1000) return `${(value / 1000).toFixed(2)}s`;
  return `${Math.round(value)}ms`;
}

export default function WebVitals() {
  const { webVitals, wave2Loading } = useAnalytics();

  if ((!webVitals || webVitals.length === 0) && wave2Loading) {
    return <BreakdownSkeleton rows={4} />;
  }

  if (!webVitals || webVitals.length === 0) {
    return (
      <div className={s.wrap}>
        <h3 className={s.title}>⚡ Web Vitals</h3>
        <div className={s.empty}>Web Vitals მონაცემები არ არის</div>
      </div>
    );
  }

  return (
    <div className={s.wrap}>
      <h3 className={s.title}>⚡ Web Vitals</h3>
      <div className={s.grid}>
        {webVitals.map((vital) => {
          const def = VITAL_DEFS[vital.metric];
          if (!def) return null;
          const grade = getGrade(vital.metric, vital.p75);
          return (
            <div key={vital.metric} className={s.card}>
              <div className={s.cardHeader}>
                <span className={s.metricName}>{vital.metric}</span>
                <span className={`${s.badge} ${s[grade]}`}>
                  {grade === "good" ? "კარგი" : grade === "needs-work" ? "საშუალო" : "ცუდი"}
                </span>
              </div>
              <div className={s.description}>{def.description}</div>
              <div className={s.p75Row}>
                <span className={s.p75Label}>P75</span>
                <span className={`${s.p75Value} ${s[grade]}`}>
                  {formatValue(vital.p75, vital.metric)}
                </span>
              </div>
              <div className={s.percentiles}>
                <div className={s.pRow}>
                  <span className={s.pLabel}>P50</span>
                  <span className={s.pValue}>{formatValue(vital.p50, vital.metric)}</span>
                </div>
                <div className={s.pRow}>
                  <span className={s.pLabel}>P95</span>
                  <span className={s.pValue}>{formatValue(vital.p95, vital.metric)}</span>
                </div>
                <div className={s.pRow}>
                  <span className={s.pLabel}>P99</span>
                  <span className={s.pValue}>{formatValue(vital.p99, vital.metric)}</span>
                </div>
              </div>
              <div className={s.samples}>{vital.samples} გაზომვა</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

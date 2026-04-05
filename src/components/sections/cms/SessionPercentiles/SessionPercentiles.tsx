"use client";

import { useAnalytics } from "../AnalyticsProvider/AnalyticsProvider";
import { formatTime } from "@/lib/analytics-utils";
import s from "./SessionPercentiles.module.css";

const PERCENTILE_KEYS = [
  { key: "p10_s", label: "P10" },
  { key: "p25_s", label: "P25" },
  { key: "p50_s", label: "P50" },
  { key: "p75_s", label: "P75" },
  { key: "p90_s", label: "P90" },
  { key: "p95_s", label: "P95" },
  { key: "p99_s", label: "P99" },
] as const;

export default function SessionPercentiles() {
  const { sessionPercentiles, wave2Loading } = useAnalytics();

  if (!sessionPercentiles && wave2Loading) {
    return (
      <div className={s.wrap}>
        <h3 className={s.title}>⏱ სესიის ხანგრძლივობა</h3>
        <div className={s.skeleton} />
      </div>
    );
  }

  if (!sessionPercentiles) {
    return (
      <div className={s.wrap}>
        <h3 className={s.title}>⏱ სესიის ხანგრძლივობა</h3>
        <div className={s.empty}>მონაცემები არ არის</div>
      </div>
    );
  }

  const p = sessionPercentiles;
  const buckets = p.buckets ?? [];
  const maxBucket = Math.max(...buckets.map((b: { count: number }) => b.count), 1);

  return (
    <div className={s.wrap}>
      <h3 className={s.title}>⏱ სესიის ხანგრძლივობა</h3>

      <div className={s.stats}>
        <div className={s.statCard}>
          <span className={s.statLabel}>სესიები</span>
          <span className={s.statValue}>{p.total_sessions}</span>
        </div>
        <div className={s.statCard}>
          <span className={s.statLabel}>საშუალო</span>
          <span className={s.statValue}>{formatTime(p.avg_s)}</span>
        </div>
        <div className={s.statCard}>
          <span className={s.statLabel}>მედიანა</span>
          <span className={s.statValue}>{formatTime(p.p50_s)}</span>
        </div>
        <div className={s.statCard}>
          <span className={s.statLabel}>P95</span>
          <span className={s.statValue}>{formatTime(p.p95_s)}</span>
        </div>
      </div>

      {/* Percentile bar */}
      <div className={s.percRow}>
        {PERCENTILE_KEYS.map(({ key, label }) => {
          const val = p[key] as number;
          const pct = p.max_s > 0 ? (val / p.max_s) * 100 : 0;
          return (
            <div key={key} className={s.percItem}>
              <span className={s.percLabel}>{label}</span>
              <div className={s.percBarTrack}>
                <div className={s.percBar} style={{ width: `${pct}%` }} />
              </div>
              <span className={s.percVal}>{formatTime(val)}</span>
            </div>
          );
        })}
      </div>

      {/* Duration histogram */}
      {buckets.length > 0 && (
        <div className={s.histogram}>
          <h4 className={s.subtitle}>განაწილება</h4>
          <div className={s.bars}>
            {buckets.map((b: { label: string; count: number }) => (
              <div key={b.label} className={s.histCol}>
                <div className={s.histBarWrap}>
                  <div
                    className={s.histBar}
                    style={{ height: `${(b.count / maxBucket) * 100}%` }}
                  />
                </div>
                <span className={s.histLabel}>{b.label}</span>
                <span className={s.histCount}>{b.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

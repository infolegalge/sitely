"use client";

import { useAnalytics } from "../AnalyticsProvider/AnalyticsProvider";
import s from "./ScrollDepthHistogram.module.css";

export default function ScrollDepthHistogram() {
  const { scrollDepth, wave2Loading } = useAnalytics();

  if (!scrollDepth && wave2Loading) {
    return (
      <div className={s.wrap}>
        <h3 className={s.title}>📜 Scroll Depth</h3>
        <div className={s.skeleton} />
      </div>
    );
  }

  if (!scrollDepth) {
    return (
      <div className={s.wrap}>
        <h3 className={s.title}>📜 Scroll Depth</h3>
        <div className={s.empty}>მონაცემები არ არის</div>
      </div>
    );
  }

  const d = scrollDepth;
  const buckets = d.buckets ?? [];
  const maxBucket = Math.max(...buckets.map((b: { count: number }) => b.count), 1);
  const totalSessions = d.total_sessions || 1;

  return (
    <div className={s.wrap}>
      <h3 className={s.title}>📜 Scroll Depth</h3>

      <div className={s.stats}>
        <div className={s.statCard}>
          <span className={s.statLabel}>საშუალო</span>
          <span className={s.statValue}>{d.avg_depth}%</span>
        </div>
        <div className={s.statCard}>
          <span className={s.statLabel}>მედიანა</span>
          <span className={s.statValue}>{d.p50_depth}%</span>
        </div>
        <div className={s.statCard}>
          <span className={s.statLabel}>P75</span>
          <span className={s.statValue}>{d.p75_depth}%</span>
        </div>
        <div className={s.statCard}>
          <span className={s.statLabel}>100% Scroll</span>
          <span className={s.statValue}>{d.full_scroll_pct}%</span>
        </div>
      </div>

      {/* Histogram */}
      {buckets.length > 0 && (
        <div className={s.histogram}>
          <div className={s.bars}>
            {buckets.map((b: { label: string; count: number; range_start: number }) => {
              const pct = ((b.count / totalSessions) * 100).toFixed(1);
              return (
                <div key={b.label} className={s.histCol}>
                  <span className={s.histPct}>{pct}%</span>
                  <div className={s.histBarWrap}>
                    <div
                      className={
                        b.range_start >= 100
                          ? s.histBarFull
                          : b.range_start >= 75
                          ? s.histBarHigh
                          : s.histBar
                      }
                      style={{ height: `${(b.count / maxBucket) * 100}%` }}
                    />
                  </div>
                  <span className={s.histLabel}>{b.label}</span>
                  <span className={s.histCount}>{b.count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

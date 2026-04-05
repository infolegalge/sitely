"use client";

import { useAnalytics } from "../AnalyticsProvider/AnalyticsProvider";
import { CardSkeleton } from "../AnalyticsSkeleton/AnalyticsSkeleton";
import RetryEmpty from "../RetryEmpty/RetryEmpty";
import s from "./FunnelChart.module.css";

const STAGES = [
  { key: "sent", label: "გაგზავნილი" },
  { key: "viewed", label: "გახსნილი" },
  { key: "scrolled", label: "სქროლი 100%" },
  { key: "cta", label: "CTA კლიკი" },
  { key: "converted", label: "კონვერსია" },
] as const;

export default function FunnelChart() {
  const { funnel, funnelPrev, showComparison, wave2Loading } = useAnalytics();

  if (!funnel && wave2Loading) return <CardSkeleton rows={5} />;

  if (!funnel) return (
    <div className={s.wrap}>
      <h3 className={s.title}>ფუნელი</h3>
      <RetryEmpty message="ფუნელის მონაცემები არ არის" />
    </div>
  );

  const max = Math.max(funnel.sent, funnelPrev?.sent ?? 0, 1);

  return (
    <div className={s.wrap}>
      <h3 className={s.title}>ფუნელი</h3>
      <div className={s.funnel} role="list" aria-label="კონვერსიის ფუნელი">
        {STAGES.map(({ key, label }, i) => {
          const val = funnel[key] ?? 0;
          const pct = (val / max) * 100;
          const prev = i > 0 ? (funnel[STAGES[i - 1].key] ?? 0) : null;
          const convRate = prev && prev > 0 ? Math.round((val / prev) * 100) : null;

          const prevVal = funnelPrev?.[key] ?? 0;
          const prevPct = (prevVal / max) * 100;

          return (
            <div key={key} className={s.step} role="listitem">
              {convRate !== null && (
                <div className={s.convRow}>
                  <span className={s.convArrow}>↓</span>
                  <span className={s.convRate}>{convRate}%</span>
                </div>
              )}
              <div className={s.row}>
                <div className={s.label}>{label}</div>
                <div className={s.barTrack}>
                  {showComparison && funnelPrev && (
                    <div
                      className={s.barFillPrev}
                      style={{ "--w": `${Math.max(prevPct, 2)}%` } as React.CSSProperties}
                    />
                  )}
                  <div
                    className={s.barFill}
                    style={{ "--w": `${Math.max(pct, 2)}%` } as React.CSSProperties}
                  />
                </div>
                <div className={s.value}>
                  {val}
                  {showComparison && funnelPrev && (
                    <span className={s.prevVal}> / {prevVal}</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {showComparison && funnelPrev && (
        <div className={s.legend}>
          <span className={s.legendCurrent} />მიმდინარე
          <span className={s.legendPrev} />წინა პერიოდი
        </div>
      )}
    </div>
  );
}

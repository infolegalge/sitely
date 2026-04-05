"use client";

import { useAnalytics } from "../AnalyticsProvider/AnalyticsProvider";
import { CardSkeleton } from "../AnalyticsSkeleton/AnalyticsSkeleton";
import RetryEmpty from "../RetryEmpty/RetryEmpty";
import s from "./FunnelAbandonment.module.css";

const STEPS = [
  { key: "saw_page", label: "გვერდი ნანახი", icon: "👁" },
  { key: "scrolled_any", label: "სქროლი", icon: "📜" },
  { key: "scrolled_full", label: "სრული სქროლი", icon: "📄" },
  { key: "clicked_cta", label: "CTA კლიკი", icon: "🎯" },
  { key: "started_form", label: "ფორმა დაწყებული", icon: "📝" },
  { key: "submitted_form", label: "ფორმა გაგზავნილი", icon: "✅" },
] as const;

const DROPOFF_LABELS: Record<string, string> = {
  page_to_scroll: "გვერდი → სქროლი",
  scroll_to_cta: "სქროლი → CTA",
  cta_to_form: "CTA → ფორმა",
  form_to_submit: "ფორმა → გაგზავნა",
  form_abandon_rate: "ფორმის მიტოვება",
};

export default function FunnelAbandonment() {
  const { funnelAbandonment, wave2Loading } = useAnalytics();

  if (!funnelAbandonment && wave2Loading) return <CardSkeleton rows={6} />;

  if (!funnelAbandonment) {
    return (
      <div className={s.wrap}>
        <h3 className={s.title}>🔻 Funnel Abandonment</h3>
        <RetryEmpty message="მონაცემები არ არის" />
      </div>
    );
  }

  const getData = (key: string) => {
    const val = funnelAbandonment[key as keyof typeof funnelAbandonment];
    return typeof val === "number" ? val : 0;
  };

  const maxVal = Math.max(
    ...STEPS.map((step) => getData(step.key)),
    1
  );

  return (
    <div className={s.wrap}>
      <h3 className={s.title}>🔻 Funnel Abandonment</h3>

      {/* Funnel steps */}
      <div className={s.funnel}>
        {STEPS.map((step, i) => {
          const value = getData(step.key);
          const pct = ((value / maxVal) * 100).toFixed(0);
          const prevVal = i > 0 ? getData(STEPS[i - 1].key) : 0;
          const convRate = i > 0 && prevVal > 0
            ? ((value / prevVal) * 100).toFixed(1)
            : null;

          return (
            <div key={step.key} className={s.step}>
              <div className={s.stepHeader}>
                <span className={s.stepIcon} aria-hidden="true">{step.icon}</span>
                <span className={s.stepLabel}>{step.label}</span>
                <span className={s.stepValue}>{value}</span>
                {convRate && (
                  <span className={s.convRate}>{convRate}%</span>
                )}
              </div>
              <div className={s.stepBarWrap}>
                <div className={s.stepBar} style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Drop-off rates */}
      <div className={s.dropoffs}>
        <h4 className={s.dropoffTitle}>Drop-off რეიტინგი</h4>
        <div className={s.dropoffGrid}>
          {Object.entries(funnelAbandonment.dropoff).map(([key, value]) => (
            <div key={key} className={s.dropoffCard}>
              <span className={s.dropoffLabel}>{DROPOFF_LABELS[key] || key}</span>
              <span className={value > 50 ? s.dropoffValueHigh : s.dropoffValue}>
                {value}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Avg session */}
      {funnelAbandonment.avg_session_ms > 0 && (
        <div className={s.avgSession}>
          საშ. სესიის ხანგრძლივობა: {Math.round(funnelAbandonment.avg_session_ms / 1000)}წმ
        </div>
      )}
    </div>
  );
}

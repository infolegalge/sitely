"use client";

import { useAnalytics } from "../AnalyticsProvider/AnalyticsProvider";
import s from "./AnalyticsPage.module.css";

const FUNNEL_LABELS: { key: string; label: string }[] = [
  { key: "sent", label: "გაგზავნილი" },
  { key: "viewed", label: "გახსნილი" },
  { key: "scrolled", label: "სქროლი 100%" },
  { key: "cta", label: "CTA კლიკი" },
  { key: "converted", label: "კონვერსია" },
];

const EVENT_LABELS: Record<string, string> = {
  page_open: "გვერდის გახსნა",
  page_leave: "გვერდის დატოვება",
  scroll_25: "სქროლი 25%",
  scroll_50: "სქროლი 50%",
  scroll_75: "სქროლი 75%",
  scroll_100: "სქროლი 100%",
  time_10s: "10 წამი",
  time_30s: "30 წამი",
  time_60s: "1 წუთი",
  time_180s: "3 წუთი",
  time_300s: "5 წუთი",
  click_phone: "ტელეფონზე კლიკი",
  click_email: "ემაილზე კლიკი",
  click_cta: "CTA კლიკი",
  click_sitely: "Sitely კლიკი",
  form_submit: "ფორმის გაგზავნა",
};

export default function AnalyticsPage() {
  const { funnel, eventCounts, leads, loading } = useAnalytics();

  if (loading) {
    return <div className={s.page}><p className={s.loading}>იტვირთება...</p></div>;
  }

  const funnelMax = funnel ? Math.max(funnel.sent, 1) : 1;

  return (
    <div className={s.page}>
      <h1 className={s.title}>ანალიტიკა</h1>

      {/* Funnel Section */}
      <section className={s.section}>
        <h2 className={s.sectionTitle}>ფუნელი</h2>
        {funnel ? (
          <div className={s.funnel}>
            {FUNNEL_LABELS.map(({ key, label }) => {
              const val = funnel[key as keyof typeof funnel] ?? 0;
              const pct = funnelMax > 0 ? (val / funnelMax) * 100 : 0;
              return (
                <div key={key} className={s.funnelStep}>
                  <div className={s.funnelLabel}>{label}</div>
                  <div className={s.funnelBarTrack}>
                    <div
                      className={s.funnelBarFill}
                      style={{ width: `${Math.max(pct, 2)}%` }}
                    />
                  </div>
                  <div className={s.funnelValue}>{val}</div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className={s.empty}>მონაცემები არ არის</p>
        )}
      </section>

      {/* Event Breakdown */}
      <section className={s.section}>
        <h2 className={s.sectionTitle}>ივენთების განაწილება</h2>
        <div className={s.eventsGrid}>
          {Object.entries(EVENT_LABELS).map(([key, label]) => (
            <div key={key} className={s.eventCard}>
              <div className={s.eventCount}>{eventCounts[key] ?? 0}</div>
              <div className={s.eventLabel}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Hot Leads */}
      <section className={s.section}>
        <h2 className={s.sectionTitle}>Hot Leads (ტოპ 20)</h2>
        {leads.length > 0 ? (
          <table className={s.table}>
            <thead>
              <tr>
                <th>#</th>
                <th>კომპანია</th>
                <th>კატეგორია</th>
                <th>ნახვები</th>
                <th>Score</th>
                <th>სტატუსი</th>
                <th>ბოლო ნახვა</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead, i) => (
                <tr key={lead.demo_id}>
                  <td>{i + 1}</td>
                  <td>{lead.company?.name ?? "—"}</td>
                  <td>{lead.company?.category ?? "—"}</td>
                  <td>{lead.view_count}</td>
                  <td className={s.score}>{lead.score}</td>
                  <td>{lead.status}</td>
                  <td>
                    {lead.last_viewed_at
                      ? new Date(lead.last_viewed_at).toLocaleDateString("ka-GE")
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className={s.empty}>ჯერ არ არის მონაცემები</p>
        )}
      </section>
    </div>
  );
}

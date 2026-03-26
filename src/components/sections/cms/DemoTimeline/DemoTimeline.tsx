"use client";

import { useState, useEffect } from "react";
import s from "./DemoTimeline.module.css";

interface DemoEvent {
  id: string;
  event_type: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

interface DemoDetail {
  demo: {
    id: string;
    hash: string;
    status: string;
    view_count: number;
    first_viewed_at: string | null;
    last_viewed_at: string | null;
    created_at: string;
    expires_at: string | null;
  };
  company: {
    name: string;
    email: string | null;
    phone: string | null;
    category: string | null;
  } | null;
  events: DemoEvent[];
}

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

export default function DemoTimeline({ demoId }: { demoId: string }) {
  const [data, setData] = useState<DemoDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/analytics/demo/${demoId}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.demo) setData(res);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [demoId]);

  if (loading) return <p className={s.loading}>იტვირთება...</p>;
  if (!data) return <p className={s.empty}>დემო ვერ მოიძებნა</p>;

  const { demo, company, events } = data;

  return (
    <div className={s.page}>
      <h1 className={s.title}>დემოს დეტალები</h1>

      <div className={s.infoGrid}>
        <div className={s.infoCard}>
          <div className={s.infoLabel}>კომპანია</div>
          <div className={s.infoValue}>{company?.name ?? "—"}</div>
        </div>
        <div className={s.infoCard}>
          <div className={s.infoLabel}>კატეგორია</div>
          <div className={s.infoValue}>{company?.category ?? "—"}</div>
        </div>
        <div className={s.infoCard}>
          <div className={s.infoLabel}>ნახვები</div>
          <div className={s.infoValue}>{demo.view_count}</div>
        </div>
        <div className={s.infoCard}>
          <div className={s.infoLabel}>სტატუსი</div>
          <div className={s.infoValue}>{demo.status}</div>
        </div>
        <div className={s.infoCard}>
          <div className={s.infoLabel}>პირველი ნახვა</div>
          <div className={s.infoValue}>
            {demo.first_viewed_at
              ? new Date(demo.first_viewed_at).toLocaleString("ka-GE")
              : "—"}
          </div>
        </div>
        <div className={s.infoCard}>
          <div className={s.infoLabel}>ბოლო ნახვა</div>
          <div className={s.infoValue}>
            {demo.last_viewed_at
              ? new Date(demo.last_viewed_at).toLocaleString("ka-GE")
              : "—"}
          </div>
        </div>
      </div>

      <h2 className={s.sectionTitle}>ტაიმლაინი ({events.length} ივენთი)</h2>

      {events.length > 0 ? (
        <div className={s.timeline}>
          {events.map((event) => (
            <div key={event.id} className={s.timelineItem}>
              <div className={s.dot} />
              <div className={s.eventInfo}>
                <span className={s.eventType}>
                  {EVENT_LABELS[event.event_type] ?? event.event_type}
                </span>
                <span className={s.eventTime}>
                  {new Date(event.created_at).toLocaleString("ka-GE")}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className={s.empty}>ივენთები არ არის</p>
      )}
    </div>
  );
}

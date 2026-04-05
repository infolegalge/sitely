"use client";

import { useAnalytics } from "../AnalyticsProvider/AnalyticsProvider";
import { EVENT_LABELS, EVENT_CATEGORIES } from "@/lib/analytics-utils";
import s from "./EventsGrid.module.css";

export default function EventsGrid() {
  const { eventCounts } = useAnalytics();

  return (
    <div>
      <h3 className={s.title}>ივენთების განაწილება</h3>
      {EVENT_CATEGORIES.map((cat) => (
        <div key={cat.label} className={s.category}>
          <h4 className={s.categoryLabel}>{cat.label}</h4>
          <div className={s.grid}>
            {cat.keys.map((key) => (
              <div key={key} className={s.card}>
                <div className={s.count}>{eventCounts[key] ?? 0}</div>
                <div className={s.label}>{EVENT_LABELS[key] ?? key}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

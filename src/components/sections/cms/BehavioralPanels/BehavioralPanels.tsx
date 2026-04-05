"use client";

import { useAnalytics } from "../AnalyticsProvider/AnalyticsProvider";
import type { LeadCompany } from "../AnalyticsProvider/AnalyticsProvider";
import { BehavioralSkeleton } from "../AnalyticsSkeleton/AnalyticsSkeleton";
import s from "./BehavioralPanels.module.css";

interface PanelDef {
  key: "momentum" | "time" | "cross_domain";
  title: string;
  icon: string;
  metric: (l: LeadCompany) => string;
}

const PANELS: PanelDef[] = [
  {
    key: "momentum",
    title: "ტოპ ინტერესიანები",
    icon: "🔥",
    metric: (l) => `${l.momentum_score}pt`,
  },
  {
    key: "time",
    title: "ტოპ დრო საიტზე",
    icon: "⏱",
    metric: (l) => {
      const m = Math.floor(l.total_active_s / 60);
      const sec = l.total_active_s % 60;
      return m > 0 ? `${m}წ ${sec}წმ` : `${sec}წმ`;
    },
  },
  {
    key: "cross_domain",
    title: "სრულად დაინტერესებულები",
    icon: "🌐",
    metric: (l) => (l.visited_main_site ? "✓ საიტზე მოვიდა" : `${l.momentum_score}pt`),
  },
];

export default function BehavioralPanels() {
  const { leaders, selectCompany, wave2Loading } = useAnalytics();

  const allEmpty = PANELS.every((p) => leaders[p.key].length === 0);
  if (allEmpty && wave2Loading) return <BehavioralSkeleton />;

  return (
    <div className={s.wrap}>
      {PANELS.map((p) => {
        const items = leaders[p.key];
        return (
          <div key={p.key} className={s.panel}>
            <div className={s.header}>
              <span className={s.icon}>{p.icon}</span>
              <h3 className={s.panelTitle}>{p.title}</h3>
            </div>
            {items.length === 0 ? (
              <p className={s.empty}>მონაცემები არ არის</p>
            ) : (
              <ol className={s.list}>
                {items.slice(0, 10).map((lead, i) => (
                  <li
                    key={lead.company_id}
                    className={s.row}
                    onClick={() => selectCompany(lead.company_id)}
                  >
                    <span className={s.rank}>{i + 1}</span>
                    <span className={s.name}>{lead.name}</span>
                    <span className={s.metric}>{p.metric(lead)}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        );
      })}
    </div>
  );
}

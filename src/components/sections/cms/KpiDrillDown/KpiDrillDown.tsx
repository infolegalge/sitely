"use client";

import { useMemo } from "react";
import { useAnalytics } from "../AnalyticsProvider/AnalyticsProvider";
import { formatTime } from "@/lib/analytics-utils";
import s from "./KpiDrillDown.module.css";

interface KpiDrillDownProps {
  kpiKey: string;
  onClose: () => void;
}

export default function KpiDrillDown({ kpiKey, onClose }: KpiDrillDownProps) {
  const { timeSeries, kpi, kpiPrev, allLeads } = useAnalytics();

  const breakdown = useMemo(() => {
    switch (kpiKey) {
      case "totalViews": {
        /* Daily page_open values from timeSeries */
        return timeSeries.map((d) => ({
          label: d.date.slice(5),
          value: d.page_open,
          formatted: d.page_open.toLocaleString(),
        }));
      }
      case "activeLeads": {
        /* Leads by tier */
        const tiers = [1, 2, 3];
        return tiers.map((t) => {
          const count = allLeads.filter((l) => l.tier === t).length;
          return { label: `Tier ${t}`, value: count, formatted: count.toLocaleString() };
        });
      }
      case "totalSessions": {
        /* Daily unique_sessions from timeSeries */
        return timeSeries.map((d) => ({
          label: d.date.slice(5),
          value: d.unique_sessions,
          formatted: d.unique_sessions.toLocaleString(),
        }));
      }
      case "avgSessionSeconds": {
        /* Top 10 leads by total_active_s */
        const sorted = [...allLeads].sort((a, b) => b.total_active_s - a.total_active_s).slice(0, 10);
        return sorted.map((l) => ({
          label: l.name,
          value: l.total_active_s,
          formatted: formatTime(l.total_active_s),
        }));
      }
      case "bounceRate": {
        /* Daily bounce approximation: days with only page_open events high vs clicks low */
        return timeSeries.map((d) => {
          const bouncy = d.page_open > 0 ? Math.round(((d.page_open - d.clicks) / d.page_open) * 100) : 0;
          return {
            label: d.date.slice(5),
            value: Math.max(0, bouncy),
            formatted: `${Math.max(0, bouncy)}%`,
          };
        });
      }
      default:
        return [];
    }
  }, [kpiKey, timeSeries, allLeads]);

  const maxVal = Math.max(...breakdown.map((b) => b.value), 1);

  const titles: Record<string, string> = {
    totalViews: "ნახვები — დეტალური",
    activeLeads: "ლიდები — Tier-ების მიხედვით",
    totalSessions: "სესიები — დღეების მიხედვით",
    avgSessionSeconds: "ტოპ 10 — აქტიური დროით",
    bounceRate: "Bounce Rate — დღეების მიხედვით",
  };

  return (
    <div className={s.panel}>
      <div className={s.header}>
        <h4 className={s.title}>{titles[kpiKey] ?? kpiKey}</h4>
        <button className={s.closeBtn} onClick={onClose} type="button" aria-label="დახურვა">
          ✕
        </button>
      </div>
      <div className={s.rows}>
        {breakdown.map((item) => (
          <div key={item.label} className={s.row}>
            <span className={s.label}>{item.label}</span>
            <div className={s.barTrack}>
              <div
                className={s.barFill}
                style={{ "--w": `${(item.value / maxVal) * 100}%` } as React.CSSProperties}
              />
            </div>
            <span className={s.value}>{item.formatted}</span>
          </div>
        ))}
        {breakdown.length === 0 && (
          <div className={s.empty}>მონაცემები არ არის</div>
        )}
      </div>
    </div>
  );
}

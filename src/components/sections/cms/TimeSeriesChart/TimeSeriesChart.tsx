"use client";

import { useState, useMemo } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { useAnalytics } from "../AnalyticsProvider/AnalyticsProvider";
import type { DailyStats } from "../AnalyticsProvider/AnalyticsProvider";
import s from "./TimeSeriesChart.module.css";

interface SeriesConfig {
  key: string;
  label: string;
  color: string;
  dotClass: string;
}

const SERIES: SeriesConfig[] = [
  { key: "page_open", label: "ნახვები", color: "#4f6ef7", dotClass: "dotPageOpen" },
  { key: "clicks", label: "კლიკები", color: "#06d6a0", dotClass: "dotClicks" },
  { key: "scroll_complete", label: "სქროლი 100%", color: "#8b5cf6", dotClass: "dotScroll" },
  { key: "form_submit", label: "ფორმა", color: "#f7c34f", dotClass: "dotForm" },
  { key: "unique_sessions", label: "სესიები", color: "#ef4444", dotClass: "dotSessions" },
];

const DOT_MAP: Record<string, string> = {
  page_open: "dotPageOpen",
  clicks: "dotClicks",
  scroll_complete: "dotScroll",
  form_submit: "dotForm",
  unique_sessions: "dotSessions",
};

function ChartTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ dataKey: string; value: number; name: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className={s.tooltip}>
      <div className={s.tooltipLabel}>{label}</div>
      {payload.map((entry) => (
        <div key={entry.dataKey} className={s.tooltipRow}>
          <span className={`${s.tooltipDot} ${s[DOT_MAP[entry.dataKey] ?? ""]}`} />
          <span className={s.tooltipName}>
            {SERIES.find((sr) => sr.key === entry.dataKey)?.label ?? entry.dataKey}
          </span>
          <span className={s.tooltipVal}>{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function TimeSeriesChart() {
  const { timeSeries, timeSeriesPrev, showComparison } = useAnalytics();
  const [visible, setVisible] = useState<Set<string>>(
    new Set(["page_open", "clicks"])
  );

  const toggle = (key: string) => {
    setVisible((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  /* Merge previous period data shifted to align with current dates */
  const chartData = useMemo(() => {
    if (!showComparison || !timeSeriesPrev.length || !timeSeries.length) return timeSeries;
    const dayShift = timeSeries.length;
    return timeSeries.map((d, i) => {
      const prev = timeSeriesPrev[i] ?? timeSeriesPrev[Math.min(i, timeSeriesPrev.length - 1)];
      if (!prev) return d;
      const merged: Record<string, unknown> = { ...d };
      SERIES.forEach((sr) => {
        merged[`prev_${sr.key}`] = (prev as unknown as Record<string, number>)[sr.key] ?? 0;
      });
      return merged as DailyStats & Record<string, number>;
    });
  }, [timeSeries, timeSeriesPrev, showComparison]);

  if (!timeSeries.length) return (
    <div className={s.wrap}>
      <h3 className={s.title}>ტრენდები</h3>
      <div className={s.emptyState}>არჩეულ პერიოდში მონაცემები არ არის</div>
    </div>
  );

  return (
    <div className={s.wrap}>
      <div className={s.header}>
        <h3 className={s.title}>ტრენდები</h3>
        <div className={s.toggles} role="group" aria-label="გრაფიკის სერიები">
          {SERIES.map((sr) => (
            <button
              key={sr.key}
              className={visible.has(sr.key) ? s.toggleActive : s.toggle}
              onClick={() => toggle(sr.key)}
              aria-pressed={visible.has(sr.key)}
              aria-label={`${sr.label} ${visible.has(sr.key) ? "ჩართულია" : "გამორთულია"}`}
            >
              <span className={`${s.toggleDot} ${s[sr.dotClass]}`} />
              {sr.label}
            </button>
          ))}
        </div>
      </div>
      <div className={s.chartWrap}>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData}>
            <defs>
              {SERIES.filter((sr) => visible.has(sr.key)).map((sr) => (
                <linearGradient key={sr.key} id={`grad_${sr.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={sr.color} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={sr.color} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,255,0.06)" />
            <XAxis
              dataKey="date"
              tickFormatter={(v: string) => v.slice(5)}
              stroke="rgba(148,163,255,0.15)"
              tick={{ fill: "#4a4a6a", fontSize: 11 }}
            />
            <YAxis
              stroke="rgba(148,163,255,0.15)"
              tick={{ fill: "#4a4a6a", fontSize: 11 }}
              width={35}
            />
            <Tooltip content={<ChartTooltip />} />
            {SERIES.filter((sr) => visible.has(sr.key)).map((sr) => (
              <Area
                key={sr.key}
                type="monotone"
                dataKey={sr.key}
                stroke={sr.color}
                fill={`url(#grad_${sr.key})`}
                strokeWidth={2}
              />
            ))}
            {showComparison && timeSeriesPrev.length > 0 && SERIES.filter((sr) => visible.has(sr.key)).map((sr) => (
              <Area
                key={`prev_${sr.key}`}
                type="monotone"
                dataKey={`prev_${sr.key}`}
                stroke={sr.color}
                fill="none"
                strokeWidth={1.5}
                strokeDasharray="6 3"
                strokeOpacity={0.4}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

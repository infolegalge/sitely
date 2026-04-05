"use client";

import { useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { useAnalytics } from "../AnalyticsProvider/AnalyticsProvider";
import { CardSkeleton } from "../AnalyticsSkeleton/AnalyticsSkeleton";
import s from "./ConversionTrends.module.css";

interface TrendDay {
  day: string;
  sessions: number;
  viewed: number;
  scrolled: number;
  clicked_cta: number;
  started_form: number;
  submitted: number;
}

const SERIES = [
  { key: "view_to_scroll", label: "ნახვა → სქროლი", color: "#4f6ef7" },
  { key: "scroll_to_cta", label: "სქროლი → CTA", color: "#8b5cf6" },
  { key: "cta_to_form", label: "CTA → ფორმა", color: "#06d6a0" },
  { key: "form_to_submit", label: "ფორმა → გაგზავნა", color: "#f7c34f" },
];

function computeRates(trends: TrendDay[]) {
  return trends.map((d) => ({
    day: d.day,
    view_to_scroll: d.viewed > 0 ? Math.round((d.scrolled / d.viewed) * 100) : 0,
    scroll_to_cta: d.scrolled > 0 ? Math.round((d.clicked_cta / d.scrolled) * 100) : 0,
    cta_to_form: d.clicked_cta > 0 ? Math.round((d.started_form / d.clicked_cta) * 100) : 0,
    form_to_submit: d.started_form > 0 ? Math.round((d.submitted / d.started_form) * 100) : 0,
  }));
}

function ConversionTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className={s.tooltip}>
      <div className={s.tooltipDate}>{label}</div>
      {payload.map((p) => (
        <div key={p.name} className={s.tooltipRow}>
          <span className={s.tooltipDot} style={{ background: p.color }} />
          <span className={s.tooltipLabel}>{SERIES.find((sr) => sr.key === p.name)?.label ?? p.name}</span>
          <span className={s.tooltipVal}>{p.value}%</span>
        </div>
      ))}
    </div>
  );
}

export default function ConversionTrends() {
  const { conversionTrends, wave2Loading } = useAnalytics();

  const data = useMemo(() => computeRates(conversionTrends), [conversionTrends]);

  if (!conversionTrends.length && wave2Loading) return <CardSkeleton rows={6} />;

  if (!conversionTrends.length) {
    return (
      <div className={s.wrap}>
        <h3 className={s.title}>📈 კონვერსიის ტრენდი</h3>
        <div className={s.empty}>კონვერსიის მონაცემები არ არის</div>
      </div>
    );
  }

  return (
    <div className={s.wrap}>
      <h3 className={s.title}>📈 კონვერსიის ტრენდი</h3>
      <div className={s.chartWrap}>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="day"
              tick={{ fill: "var(--cms-tx-3)", fontSize: 11 }}
              tickFormatter={(v: string) => v.slice(5)}
            />
            <YAxis
              tick={{ fill: "var(--cms-tx-3)", fontSize: 11 }}
              domain={[0, 100]}
              tickFormatter={(v: number) => `${v}%`}
            />
            <Tooltip content={<ConversionTooltip />} />
            <Legend
              formatter={(value: string) => SERIES.find((sr) => sr.key === value)?.label ?? value}
              wrapperStyle={{ fontSize: 11 }}
            />
            {SERIES.map((sr) => (
              <Line
                key={sr.key}
                type="monotone"
                dataKey={sr.key}
                stroke={sr.color}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

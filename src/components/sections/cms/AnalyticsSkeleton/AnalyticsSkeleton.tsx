"use client";

import s from "./AnalyticsSkeleton.module.css";

function Pulse({ className }: { className?: string }) {
  return <div className={`${s.pulse} ${className ?? ""}`} />;
}

/** KPI Cards skeleton — 5 cards matching the real layout */
export function KpiSkeleton() {
  return (
    <div className={s.kpiGrid} role="status" aria-label="KPI მონაცემები იტვირთება">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className={s.kpiCard}>
          <div className={s.kpiHeader}>
            <Pulse className={s.icon} />
            <Pulse className={s.labelBar} />
          </div>
          <Pulse className={s.valueBar} />
          <Pulse className={s.trendBar} />
        </div>
      ))}
    </div>
  );
}

/** Chart area skeleton — matching TimeSeriesChart height */
export function ChartSkeleton() {
  return (
    <div className={s.chartWrap} role="status" aria-label="გრაფიკი იტვირთება">
      <div className={s.chartHeader}>
        <Pulse className={s.titleBar} />
        <div className={s.toggleRow}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Pulse key={i} className={s.togglePill} />
          ))}
        </div>
      </div>
      <div className={s.chartBody}>
        {[45, 72, 58, 80, 38, 65, 52].map((h, i) => (
          <div
            key={i}
            className={s.chartBar}
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
    </div>
  );
}

/** Half-width card skeleton (Funnel, Heatmap, EventsGrid, TopSections) */
export function CardSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className={s.card} role="status" aria-label="პანელი იტვირთება">
      <Pulse className={s.titleBar} />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className={s.cardRow}>
          <Pulse className={s.rowLabel} />
          <Pulse className={s.rowBar} />
          <Pulse className={s.rowValue} />
        </div>
      ))}
    </div>
  );
}

/** Small breakdown card skeleton (Geo, Device, UTM) */
export function BreakdownSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className={s.card} role="status" aria-label="მონაცემები იტვირთება">
      <Pulse className={s.titleBar} />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className={s.breakdownRow}>
          <Pulse className={s.breakdownIcon} />
          <Pulse className={s.breakdownLabel} />
          <Pulse className={s.breakdownBar} />
        </div>
      ))}
    </div>
  );
}

/** Behavioral panel skeleton — 3 panels */
export function BehavioralSkeleton() {
  return (
    <div className={s.behavioralGrid} role="status" aria-label="ლიდერბორდი იტვირთება">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className={s.card}>
          <Pulse className={s.titleBar} />
          {Array.from({ length: 5 }).map((_, j) => (
            <div key={j} className={s.cardRow}>
              <Pulse className={s.rankDot} />
              <Pulse className={s.rowLabel} />
              <Pulse className={s.rowValue} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/** Lead table skeleton */
export function TableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className={s.tableWrap} role="status" aria-label="ცხრილი იტვირთება">
      <div className={s.tableFilterRow}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Pulse key={i} className={s.togglePill} />
        ))}
        <Pulse className={s.searchBar} />
      </div>
      <div className={s.tableHeader}>
        {Array.from({ length: 7 }).map((_, i) => (
          <Pulse key={i} className={s.thCell} />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className={s.tableRow}>
          {Array.from({ length: 7 }).map((_, j) => (
            <Pulse key={j} className={s.tdCell} />
          ))}
        </div>
      ))}
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { useAnalytics } from "../AnalyticsProvider/AnalyticsProvider";
import { formatTime } from "@/lib/analytics-utils";
import KpiDrillDown from "../KpiDrillDown/KpiDrillDown";
import s from "./KpiCards.module.css";

function trendPct(current: number, previous: number): { value: number; up: boolean } {
  if (previous === 0) return { value: current > 0 ? 100 : 0, up: current > 0 };
  const pct = ((current - previous) / previous) * 100;
  return { value: Math.abs(Math.round(pct)), up: pct >= 0 };
}

const KPI_DEFS = [
  {
    key: "totalViews" as const,
    label: "ნახვები",
    icon: "👁",
    format: (v: number) => v.toLocaleString(),
    defaultTarget: 500,
  },
  {
    key: "activeLeads" as const,
    label: "აქტიური ლიდები",
    icon: "🎯",
    format: (v: number) => v.toLocaleString(),
    defaultTarget: 50,
  },
  {
    key: "totalSessions" as const,
    label: "სესიები",
    icon: "📊",
    format: (v: number) => v.toLocaleString(),
    defaultTarget: 1000,
  },
  {
    key: "avgSessionSeconds" as const,
    label: "საშუალო დრო",
    icon: "⏱",
    format: formatTime,
    defaultTarget: 120,
  },
  {
    key: "bounceRate" as const,
    label: "Bounce Rate",
    icon: "⤴",
    format: (v: number) => `${v}%`,
    invertTrend: true,
    invertTarget: true,
    defaultTarget: 30,
  },
];

const TARGETS_STORAGE_KEY = "sitely_kpi_targets";

type TargetMap = Record<string, number>;

function loadTargets(): TargetMap {
  try {
    const raw = localStorage.getItem(TARGETS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  const defaults: TargetMap = {};
  KPI_DEFS.forEach((d) => { defaults[d.key] = d.defaultTarget; });
  return defaults;
}

function saveTargets(targets: TargetMap) {
  try {
    localStorage.setItem(TARGETS_STORAGE_KEY, JSON.stringify(targets));
  } catch { /* ignore */ }
}

export default function KpiCards() {
  const { kpi, kpiPrev, showComparison } = useAnalytics();
  const [drillKey, setDrillKey] = useState<string | null>(null);
  const [targets, setTargets] = useState<TargetMap>({});
  const [editingTarget, setEditingTarget] = useState<string | null>(null);

  useEffect(() => {
    setTargets(loadTargets());
  }, []);

  const updateTarget = useCallback((key: string, value: number) => {
    setTargets((prev) => {
      const next = { ...prev, [key]: value };
      saveTargets(next);
      return next;
    });
    setEditingTarget(null);
  }, []);

  if (!kpi) return (
    <div className={s.grid}>
      {KPI_DEFS.map((def) => (
        <div key={def.key} className={s.card}>
          <div className={s.cardHeader}>
            <span className={s.icon}>{def.icon}</span>
            <span className={s.label}>{def.label}</span>
          </div>
          <div className={s.value}>—</div>
        </div>
      ))}
    </div>
  );

  return (
    <>
      <div className={s.grid}>
        {KPI_DEFS.map((def) => {
          const current = kpi[def.key] ?? 0;
          const prev = kpiPrev?.[def.key] ?? 0;
          const trend = trendPct(current, prev);
          const isPositive = "invertTrend" in def && def.invertTrend ? !trend.up : trend.up;

          const target = targets[def.key] ?? def.defaultTarget;
          const invertTarget = "invertTarget" in def && def.invertTarget;
          const progress = invertTarget
            ? target > 0 ? Math.min(100, ((target / Math.max(current, 0.1)) * 100)) : 100
            : target > 0 ? Math.min(100, (current / target) * 100) : 0;
          const targetMet = progress >= 100;

          return (
            <div
              key={def.key}
              className={drillKey === def.key ? s.cardActive : s.card}
              onClick={() => setDrillKey(drillKey === def.key ? null : def.key)}
              role="button"
              tabIndex={0}
              aria-expanded={drillKey === def.key}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setDrillKey(drillKey === def.key ? null : def.key); }}
            >
              <div className={s.cardHeader}>
                <span className={s.icon} aria-hidden="true">{def.icon}</span>
                <span className={s.label}>{def.label}</span>
                <button
                  className={s.targetEditBtn}
                  onClick={(e) => { e.stopPropagation(); setEditingTarget(editingTarget === def.key ? null : def.key); }}
                  aria-label="მიზნის რედაქტირება"
                >
                  🎯
                </button>
              </div>
              <div className={s.value}>{def.format(current)}</div>

              {/* Target progress bar */}
              <div className={s.targetRow}>
                <div className={s.targetBarTrack}>
                  <div
                    className={targetMet ? s.targetBarMet : s.targetBar}
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
                <span className={targetMet ? s.targetPctMet : s.targetPct}>
                  {Math.round(progress)}%
                </span>
              </div>

              {/* Target edit inline */}
              {editingTarget === def.key && (
                <div className={s.targetEdit} onClick={(e) => e.stopPropagation()}>
                  <label className={s.targetLabel}>მიზანი:</label>
                  <input
                    type="number"
                    className={s.targetInput}
                    defaultValue={target}
                    min={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        updateTarget(def.key, Number((e.target as HTMLInputElement).value));
                      }
                    }}
                    onBlur={(e) => updateTarget(def.key, Number(e.target.value))}
                    autoFocus
                  />
                </div>
              )}

              {kpiPrev && (
                <div
                  className={isPositive ? s.trendUp : s.trendDown}
                  aria-label={`${isPositive ? "ზრდა" : "კლება"} ${trend.value}%`}
                >
                  {trend.up ? "↑" : "↓"} {trend.value}%
                </div>
              )}
              {showComparison && kpiPrev && (
                <div className={s.prevValue}>
                  წინა: {def.format(prev)}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {drillKey && (
        <KpiDrillDown kpiKey={drillKey} onClose={() => setDrillKey(null)} />
      )}
    </>
  );
}

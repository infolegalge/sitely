"use client";

import { Fragment, useMemo } from "react";
import { useAnalytics } from "../AnalyticsProvider/AnalyticsProvider";
import { CardSkeleton } from "../AnalyticsSkeleton/AnalyticsSkeleton";
import s from "./ActivityHeatmap.module.css";

const DAY_LABELS = ["კვ", "ორშ", "სამ", "ოთხ", "ხუთ", "პარ", "შაბ"];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

function getLevel(count: number, max: number): number {
  if (count === 0 || max === 0) return 0;
  const r = count / max;
  if (r < 0.15) return 1;
  if (r < 0.35) return 2;
  if (r < 0.55) return 3;
  if (r < 0.75) return 4;
  return 5;
}

export default function ActivityHeatmap() {
  const { heatmap, wave2Loading } = useAnalytics();

  const { grid, maxCount } = useMemo(() => {
    const g: Record<string, number> = {};
    let mx = 0;
    for (const cell of heatmap) {
      const key = `${cell.day}-${cell.hour}`;
      g[key] = cell.count;
      if (cell.count > mx) mx = cell.count;
    }
    return { grid: g, maxCount: mx };
  }, [heatmap]);

  if (!heatmap.length && wave2Loading) return <CardSkeleton rows={7} />;

  if (!heatmap.length) return (
    <div className={s.wrap}>
      <h3 className={s.title}>აქტივობის რუკა</h3>
      <div className={s.emptyState}>არჩეულ პერიოდში აქტივობა არ ფიქსირდება</div>
    </div>
  );

  return (
    <div className={s.wrap}>
      <h3 className={s.title}>აქტივობის რუკა</h3>
      <div className={s.scrollContainer}>
      <div className={s.heatmap} role="grid" aria-label="აქტივობის რუკა — დღეები და საათები">
        <div className={s.cornerCell} />
        {HOURS.map((h) => (
          <div key={`h-${h}`} className={s.hourLabel}>
            {h.toString().padStart(2, "0")}
          </div>
        ))}
        {DAY_LABELS.map((dayLabel, dayIdx) => (
          <Fragment key={dayIdx}>
            <div className={s.dayLabel}>{dayLabel}</div>
            {HOURS.map((hourIdx) => {
              const count = grid[`${dayIdx}-${hourIdx}`] ?? 0;
              const level = getLevel(count, maxCount);
              return (
                <div
                  key={`${dayIdx}-${hourIdx}`}
                  className={`${s.cell} ${s[`l${level}`]}`}
                  title={`${dayLabel} ${hourIdx}:00 — ${count}`}
                  role="gridcell"
                  aria-label={`${dayLabel} ${hourIdx}:00 — ${count} ივენთი`}
                />
              );
            })}
          </Fragment>
        ))}
      </div>
      </div>
      <div className={s.legend}>
        <span className={s.legendLabel}>ნაკლები</span>
        {[0, 1, 2, 3, 4, 5].map((l) => (
          <div key={l} className={`${s.legendCell} ${s[`l${l}`]}`} />
        ))}
        <span className={s.legendLabel}>მეტი</span>
      </div>
    </div>
  );
}

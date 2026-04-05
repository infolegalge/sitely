"use client";

import { useAnalytics } from "../AnalyticsProvider/AnalyticsProvider";
import { CardSkeleton } from "../AnalyticsSkeleton/AnalyticsSkeleton";
import RetryEmpty from "../RetryEmpty/RetryEmpty";
import s from "./TopSections.module.css";

export default function TopSections() {
  const { topSections, wave2Loading } = useAnalytics();

  if (!topSections.length && wave2Loading) return <CardSkeleton rows={5} />;

  if (!topSections.length) {
    return (
      <div className={s.wrap}>
        <h3 className={s.title}>📑 ტოპ სექციები</h3>
        <RetryEmpty message="სექციის მონაცემები არ არის" />
      </div>
    );
  }

  const maxViews = Math.max(...topSections.map((sec) => sec.views), 1);

  return (
    <div className={s.wrap}>
      <h3 className={s.title}>📑 ტოპ სექციები</h3>
      <div className={s.list}>
        {topSections.map((entry, i) => (
          <div key={entry.section_name} className={s.row}>
            <span className={s.rank}>{i + 1}</span>
            <div className={s.info}>
              <span className={s.name}>{entry.section_name}</span>
              <div className={s.barWrap}>
                <div
                  className={s.bar}
                  style={{ width: `${(entry.views / maxViews) * 100}%` }}
                />
              </div>
            </div>
            <div className={s.meta}>
              <span className={s.views}>{entry.views} ნახვა</span>
              <span className={s.time}>{entry.avg_duration_s}წმ საშ.</span>
              <span className={s.uniq}>{entry.unique_sessions} სესია</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

"use client";

import { useAnalytics } from "../AnalyticsProvider/AnalyticsProvider";
import { BreakdownSkeleton } from "../AnalyticsSkeleton/AnalyticsSkeleton";
import RetryEmpty from "../RetryEmpty/RetryEmpty";
import s from "./UtmBreakdown.module.css";

export default function UtmBreakdown() {
  const { utm, referrers, wave2Loading } = useAnalytics();

  const hasUtm = utm.length > 0;
  const hasRef = referrers.length > 0;

  if (!hasUtm && !hasRef && wave2Loading) return <BreakdownSkeleton rows={4} />;

  if (!hasUtm && !hasRef) {
    return (
      <div className={s.wrap}>
        <h3 className={s.title}>📡 ტრაფიკის წყაროები</h3>
        <RetryEmpty message="ტრაფიკის მონაცემები არ არის" />
      </div>
    );
  }

  const maxRefSessions = Math.max(...referrers.map((r) => r.sessions), 1);

  return (
    <div className={s.wrap}>
      <h3 className={s.title}>📡 ტრაფიკის წყაროები</h3>

      {/* Referrer breakdown */}
      {hasRef && (
        <div className={s.section}>
          <h4 className={s.subtitle}>რეფერერები</h4>
          <div className={s.list}>
            {referrers.map((entry, i) => (
              <div key={i} className={s.row}>
                <div className={s.source}>{entry.source}</div>
                <div className={s.barWrap}>
                  <div
                    className={s.bar}
                    style={{ width: `${(entry.sessions / maxRefSessions) * 100}%` }}
                  />
                </div>
                <div className={s.count}>{entry.sessions}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* UTM breakdown */}
      {hasUtm && (
        <div className={s.section}>
          <h4 className={s.subtitle}>UTM კამპანიები</h4>
          <div className={s.tableWrap}>
          <table className={s.table} role="table" aria-label="UTM კამპანიები">
            <thead>
              <tr className={s.thead}>
                <th>წყარო</th>
                <th>მედიუმი</th>
                <th>კამპანია</th>
                <th>სესიები</th>
              </tr>
            </thead>
            <tbody>
              {utm.map((entry, i) => (
                <tr key={i} className={s.trow}>
                  <td className={s.tcell}>{entry.source}</td>
                  <td className={s.tcell}>{entry.medium || "—"}</td>
                  <td className={s.tcell}>{entry.campaign || "—"}</td>
                  <td className={s.tcellNum}>{entry.sessions}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  );
}

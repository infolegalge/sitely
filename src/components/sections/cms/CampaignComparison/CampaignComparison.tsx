"use client";

import { useState, useMemo } from "react";
import { useAnalytics } from "../AnalyticsProvider/AnalyticsProvider";
import { formatTime } from "@/lib/analytics-utils";
import s from "./CampaignComparison.module.css";

export default function CampaignComparison() {
  const { campaignComparison, wave2Loading } = useAnalytics();
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const campaigns = campaignComparison;

  const maxSessions = useMemo(
    () => Math.max(...campaigns.map((c) => c.sessions), 1),
    [campaigns]
  );

  if (!campaigns.length && wave2Loading) {
    return (
      <div className={s.wrap}>
        <h3 className={s.title}>📊 კამპანიების შედარება</h3>
        <div className={s.skeleton} />
      </div>
    );
  }

  if (!campaigns.length) {
    return (
      <div className={s.wrap}>
        <h3 className={s.title}>📊 კამპანიების შედარება</h3>
        <div className={s.empty}>კამპანიის მონაცემები არ არის</div>
      </div>
    );
  }

  function toggle(idx: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }

  const comparing = selected.size >= 2;
  const highlighted = comparing
    ? campaigns.filter((_, i) => selected.has(i))
    : campaigns;

  return (
    <div className={s.wrap}>
      <h3 className={s.title}>
        📊 კამპანიების შედარება
        {comparing && (
          <button className={s.clearBtn} onClick={() => setSelected(new Set())}>
            ✕ გასუფთავება
          </button>
        )}
      </h3>
      <p className={s.hint}>
        {comparing
          ? `${selected.size} კამპანია შედარებულია`
          : "აირჩიეთ 2+ კამპანია შესადარებლად"}
      </p>

      <div className={s.tableWrap}>
        <table className={s.table}>
          <thead>
            <tr>
              <th className={s.thCheck}></th>
              <th>წყარო / კამპანია</th>
              <th>სესიები</th>
              <th>Scroll ✓</th>
              <th>CTA</th>
              <th>ფორმა</th>
              <th>საშ. დრო</th>
              <th>კონვერსია</th>
            </tr>
          </thead>
          <tbody>
            {highlighted.map((c, i) => {
              const realIdx = comparing
                ? campaigns.indexOf(c)
                : i;
              const isSelected = selected.has(realIdx);
              return (
                <tr
                  key={`${c.source}-${c.medium}-${c.campaign}`}
                  className={isSelected ? s.rowSelected : s.row}
                  onClick={() => toggle(realIdx)}
                >
                  <td>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggle(realIdx)}
                      className={s.checkbox}
                    />
                  </td>
                  <td>
                    <div className={s.campaignName}>
                      {c.source}
                      {c.medium && <span className={s.medium}> / {c.medium}</span>}
                    </div>
                    {c.campaign && (
                      <div className={s.campaignTag}>{c.campaign}</div>
                    )}
                  </td>
                  <td>
                    <div className={s.barCell}>
                      <span className={s.num}>{c.sessions}</span>
                      <div className={s.barTrack}>
                        <div
                          className={s.bar}
                          /* Recharts-unavoidable inline for dynamic width */
                          style={{ width: `${(c.sessions / maxSessions) * 100}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className={s.num}>{c.scroll_complete}</td>
                  <td className={s.num}>{c.cta_clicks}</td>
                  <td className={s.num}>{c.form_submits}</td>
                  <td className={s.time}>
                    {c.avg_session_s ? formatTime(c.avg_session_s) : "—"}
                  </td>
                  <td>
                    <span
                      className={
                        c.conversion_rate >= 10
                          ? s.convHigh
                          : c.conversion_rate >= 3
                          ? s.convMid
                          : s.convLow
                      }
                    >
                      {c.conversion_rate}%
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

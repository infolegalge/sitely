"use client";

import { useAnalytics } from "../AnalyticsProvider/AnalyticsProvider";
import { CardSkeleton } from "../AnalyticsSkeleton/AnalyticsSkeleton";
import s from "./TemplatePerformance.module.css";

export default function TemplatePerformance() {
  const { templatePerformance, wave2Loading } = useAnalytics();

  if (!templatePerformance.length && wave2Loading) return <CardSkeleton rows={5} />;

  if (!templatePerformance.length) {
    return (
      <div className={s.wrap}>
        <h3 className={s.title}>🎨 შაბლონების შედარება</h3>
        <div className={s.empty}>შაბლონის მონაცემები არ არის</div>
      </div>
    );
  }

  const maxRate = Math.max(...templatePerformance.map((t) => t.conversion_rate), 1);

  return (
    <div className={s.wrap}>
      <h3 className={s.title}>🎨 შაბლონების შედარება</h3>
      <div className={s.tableWrap}>
        <table className={s.table} role="table" aria-label="შაბლონების შედარება">
          <thead>
            <tr className={s.thead}>
              <th>შაბლონი</th>
              <th>გაგზ.</th>
              <th>ნახვა</th>
              <th>სესიები</th>
              <th>CTA</th>
              <th>ფორმა</th>
              <th>საშ. წმ</th>
              <th>კონვერსია</th>
            </tr>
          </thead>
          <tbody>
            {templatePerformance.map((t) => (
              <tr key={t.template_id} className={s.trow}>
                <td className={s.tname}>{t.template_name}</td>
                <td className={s.tcell}>{t.demos_sent}</td>
                <td className={s.tcell}>{t.demos_viewed}</td>
                <td className={s.tcell}>{t.total_sessions}</td>
                <td className={s.tcell}>{t.cta_clicks}</td>
                <td className={s.tcell}>{t.form_submits}</td>
                <td className={s.tcell}>{t.avg_session_s ?? "—"}</td>
                <td className={s.tcellRate}>
                  <div className={s.rateBar}>
                    <div
                      className={s.rateFill}
                      style={{ width: `${(t.conversion_rate / maxRate) * 100}%` }}
                    />
                  </div>
                  <span className={s.rateVal}>{t.conversion_rate}%</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

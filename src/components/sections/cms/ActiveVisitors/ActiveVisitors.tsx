"use client";

import { useAnalytics } from "../AnalyticsProvider/AnalyticsProvider";
import s from "./ActiveVisitors.module.css";

export default function ActiveVisitors() {
  const { activeVisitors } = useAnalytics();

  return (
    <div className={s.wrap}>
      <div className={s.pulseRing} aria-hidden="true" />
      <span className={s.count}>{activeVisitors.active_sessions}</span>
      <span className={s.label}>ონლაინ</span>
      {activeVisitors.active_demos > 0 && (
        <span className={s.demos}>{activeVisitors.active_demos} დემო</span>
      )}
    </div>
  );
}

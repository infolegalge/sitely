"use client";

import { useAnalytics } from "../AnalyticsProvider/AnalyticsProvider";
import s from "./RetryEmpty.module.css";

interface RetryEmptyProps {
  message?: string;
}

export default function RetryEmpty({ message }: RetryEmptyProps) {
  const { refresh } = useAnalytics();

  return (
    <div className={s.wrap}>
      <p className={s.text}>{message || "მონაცემები ვერ ჩაიტვირთა"}</p>
      <button className={s.btn} onClick={refresh}>
        ↻ ხელახლა ცდა
      </button>
    </div>
  );
}

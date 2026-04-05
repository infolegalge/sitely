"use client";

import { useState, useRef, useEffect } from "react";
import { useAnalytics } from "../AnalyticsProvider/AnalyticsProvider";
import s from "./DateRangePicker.module.css";

const PRESETS = [
  { label: "7დ", days: 7 },
  { label: "14დ", days: 14 },
  { label: "30დ", days: 30 },
  { label: "90დ", days: 90 },
  { label: "ყველა", days: 0 },
];

export default function DateRangePicker() {
  const { dateRange, setDateRange, setCustomDateRange } = useAnalytics();
  const [showCustom, setShowCustom] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);

  /* Close panel on outside click */
  useEffect(() => {
    if (!showCustom) return;
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setShowCustom(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showCustom]);

  function handleApply() {
    if (!fromDate || !toDate) return;
    const from = new Date(fromDate);
    const to = new Date(toDate);
    if (from > to) return;
    to.setHours(23, 59, 59, 999);
    setCustomDateRange(from.toISOString(), to.toISOString());
    setShowCustom(false);
  }

  /* Show active date range summary */
  const rangeSummary =
    dateRange.preset === -1 && dateRange.from && dateRange.to
      ? `${new Date(dateRange.from).toLocaleDateString("ka-GE", { day: "numeric", month: "short" })} — ${new Date(dateRange.to).toLocaleDateString("ka-GE", { day: "numeric", month: "short" })}`
      : null;

  return (
    <div className={s.wrap} ref={panelRef}>
      {PRESETS.map((p) => (
        <button
          key={p.days}
          className={dateRange.preset === p.days ? s.btnActive : s.btn}
          onClick={() => { setDateRange(p.days); setShowCustom(false); }}
          aria-pressed={dateRange.preset === p.days}
        >
          {p.label}
        </button>
      ))}

      <button
        className={dateRange.preset === -1 ? s.btnActive : s.btn}
        onClick={() => setShowCustom(!showCustom)}
        aria-pressed={dateRange.preset === -1}
        aria-label="არჩეული დიაპაზონი"
      >
        {rangeSummary ?? "📅 სხვა"}
      </button>

      {showCustom && (
        <div className={s.dropdown}>
          <label className={s.fieldLabel}>
            დან
            <input
              type="date"
              className={s.dateInput}
              value={fromDate}
              max={toDate || undefined}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </label>
          <label className={s.fieldLabel}>
            მდე
            <input
              type="date"
              className={s.dateInput}
              value={toDate}
              min={fromDate || undefined}
              max={new Date().toISOString().split("T")[0]}
              onChange={(e) => setToDate(e.target.value)}
            />
          </label>
          <button
            className={s.applyBtn}
            disabled={!fromDate || !toDate}
            onClick={handleApply}
          >
            გამოყენება
          </button>
        </div>
      )}
    </div>
  );
}

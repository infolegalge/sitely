"use client";

import { useAnalytics } from "../AnalyticsProvider/AnalyticsProvider";
import { BreakdownSkeleton } from "../AnalyticsSkeleton/AnalyticsSkeleton";
import RetryEmpty from "../RetryEmpty/RetryEmpty";
import s from "./BrowserBreakdown.module.css";

const BROWSER_ICONS: Record<string, string> = {
  Chrome: "🌐",
  Safari: "🧭",
  Firefox: "🦊",
  Edge: "🔷",
  Opera: "🔴",
  IE: "📎",
  "სხვა": "❓",
};

const OS_ICONS: Record<string, string> = {
  Windows: "🪟",
  macOS: "🍎",
  Android: "🤖",
  iOS: "📱",
  Linux: "🐧",
  ChromeOS: "💻",
  "სხვა": "❓",
};

export default function BrowserBreakdown() {
  const { browsers, os, wave2Loading } = useAnalytics();

  const totalBrowsers = browsers.reduce((s, b) => s + b.sessions, 0) || 1;
  const totalOs = os.reduce((s, o) => s + o.sessions, 0) || 1;

  if (!browsers.length && !os.length && wave2Loading) return <BreakdownSkeleton rows={4} />;

  if (!browsers.length && !os.length) {
    return (
      <div className={s.wrap}>
        <h3 className={s.title}>ბრაუზერი / OS</h3>
        <RetryEmpty message="მონაცემები არ არის" />
      </div>
    );
  }

  return (
    <div className={s.wrap}>
      <h3 className={s.title}>ბრაუზერი / OS</h3>

      <div className={s.section}>
        <h4 className={s.subtitle}>ბრაუზერები</h4>
        <div className={s.list} role="list">
          {browsers.map((b) => {
            const pct = Math.round((b.sessions / totalBrowsers) * 100);
            return (
              <div key={b.name} className={s.row} role="listitem">
                <span className={s.icon} aria-hidden="true">{BROWSER_ICONS[b.name] ?? "🌐"}</span>
                <span className={s.name}>{b.name}</span>
                <div className={s.barTrack}>
                  <div
                    className={s.barFill}
                    style={{ "--w": `${pct}%` } as React.CSSProperties}
                  />
                </div>
                <span className={s.pct}>{pct}%</span>
                <span className={s.count}>{b.sessions}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className={s.divider} />

      <div className={s.section}>
        <h4 className={s.subtitle}>ოპერაციული სისტემა</h4>
        <div className={s.list} role="list">
          {os.map((o) => {
            const pct = Math.round((o.sessions / totalOs) * 100);
            return (
              <div key={o.name} className={s.row} role="listitem">
                <span className={s.icon} aria-hidden="true">{OS_ICONS[o.name] ?? "💻"}</span>
                <span className={s.name}>{o.name}</span>
                <div className={s.barTrack}>
                  <div
                    className={s.barFillOs}
                    style={{ "--w": `${pct}%` } as React.CSSProperties}
                  />
                </div>
                <span className={s.pct}>{pct}%</span>
                <span className={s.count}>{o.sessions}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

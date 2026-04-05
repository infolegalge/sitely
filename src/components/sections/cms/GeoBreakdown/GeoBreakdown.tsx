"use client";

import { useAnalytics } from "../AnalyticsProvider/AnalyticsProvider";
import { BreakdownSkeleton } from "../AnalyticsSkeleton/AnalyticsSkeleton";
import RetryEmpty from "../RetryEmpty/RetryEmpty";
import s from "./GeoBreakdown.module.css";

const COUNTRY_NAMES: Record<string, string> = {
  GE: "საქართველო",
  US: "აშშ",
  TR: "თურქეთი",
  RU: "რუსეთი",
  DE: "გერმანია",
  FR: "საფრანგეთი",
  GB: "გაერთიანებული სამეფო",
  IT: "იტალია",
  ES: "ესპანეთი",
  NL: "ნიდერლანდები",
  UA: "უკრაინა",
  AZ: "აზერბაიჯანი",
  AM: "სომხეთი",
  IL: "ისრაელი",
  AE: "არაბთა გაერთიანებული საამიროები",
  KZ: "ყაზახეთი",
  PL: "პოლონეთი",
  CZ: "ჩეხეთი",
  Unknown: "უცნობი",
};

const COUNTRY_FLAGS: Record<string, string> = {
  GE: "🇬🇪", US: "🇺🇸", TR: "🇹🇷", RU: "🇷🇺", DE: "🇩🇪",
  FR: "🇫🇷", GB: "🇬🇧", IT: "🇮🇹", ES: "🇪🇸", NL: "🇳🇱",
  UA: "🇺🇦", AZ: "🇦🇿", AM: "🇦🇲", IL: "🇮🇱", AE: "🇦🇪",
  KZ: "🇰🇿", PL: "🇵🇱", CZ: "🇨🇿",
};

export default function GeoBreakdown() {
  const { geo, wave2Loading } = useAnalytics();

  if (!geo.length && wave2Loading) return <BreakdownSkeleton rows={4} />;

  if (!geo.length) {
    return (
      <div className={s.wrap}>
        <h3 className={s.title}>🌍 გეოგრაფია</h3>
        <RetryEmpty message="გეო-მონაცემები არ არის" />
      </div>
    );
  }

  const maxSessions = Math.max(...geo.map((g) => g.sessions), 1);

  return (
    <div className={s.wrap}>
      <h3 className={s.title}>🌍 გეოგრაფია</h3>
      <div className={s.list} role="list" aria-label="ქვეყნების განაწილება">
        {geo.map((entry) => (
          <div key={entry.country} className={s.row} role="listitem">
            <div className={s.label}>
              <span className={s.flag} aria-hidden="true">{COUNTRY_FLAGS[entry.country] || "🏳️"}</span>
              <span className={s.name}>{COUNTRY_NAMES[entry.country] || entry.country}</span>
            </div>
            <div className={s.barWrap} role="progressbar" aria-valuenow={entry.sessions} aria-valuemax={maxSessions} aria-label={`${COUNTRY_NAMES[entry.country] || entry.country} სესიები`}>
              <div
                className={s.bar}
                style={{ width: `${(entry.sessions / maxSessions) * 100}%` }}
              />
            </div>
            <div className={s.stats}>
              <span className={s.sessions}>{entry.sessions}</span>
              <span className={s.events}>{entry.events} ev</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

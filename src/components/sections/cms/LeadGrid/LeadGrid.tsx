"use client";

import { useState, useMemo, useCallback } from "react";
import { useAnalytics } from "../AnalyticsProvider/AnalyticsProvider";
import { formatTime, relativeDate } from "@/lib/analytics-utils";
import s from "./LeadGrid.module.css";

const STATUS_OPTIONS = [
  { value: "", label: "ყველა" },
  { value: "new", label: "ახალი" },
  { value: "contacted", label: "დაკონტაქტებული" },
  { value: "negotiating", label: "მოლაპარაკება" },
  { value: "won", label: "მოგებული" },
  { value: "lost", label: "დაკარგული" },
];

const TIER_OPTIONS = [
  { value: null, label: "ყველა" },
  { value: 1, label: "Tier 1" },
  { value: 2, label: "Tier 2" },
  { value: 3, label: "Tier 3" },
];

const PAGE_SIZE = 50;

type SortKey = "score" | "time" | "last" | "name";

export default function LeadGrid() {
  const {
    allLeads,
    tierFilter,
    statusFilter,
    favoritesOnly,
    setTierFilter,
    setStatusFilter,
    setFavoritesOnly,
    selectCompany,
    toggleFavorite,
    updateSalesStatus,
  } = useAnalytics();

  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("score");
  const [sortAsc, setSortAsc] = useState(false);
  const [page, setPage] = useState(0);
  const [scoreMin, setScoreMin] = useState(0);
  const [scoreMax, setScoreMax] = useState(100);
  const [mainSiteOnly, setMainSiteOnly] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    let items = allLeads;
    if (tierFilter) items = items.filter((l) => l.tier === tierFilter);
    if (statusFilter) items = items.filter((l) => l.sales_status === statusFilter);
    if (favoritesOnly) items = items.filter((l) => l.is_favorite);
    if (mainSiteOnly) items = items.filter((l) => l.visited_main_site);
    if (scoreMin > 0 || scoreMax < 100) {
      items = items.filter((l) => l.momentum_score >= scoreMin && l.momentum_score <= scoreMax);
    }
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(
        (l) =>
          l.name.toLowerCase().includes(q) ||
          (l.category && l.category.toLowerCase().includes(q))
      );
    }

    const sorted = [...items].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "score":
          cmp = a.momentum_score - b.momentum_score;
          break;
        case "time":
          cmp = a.total_active_s - b.total_active_s;
          break;
        case "last":
          cmp =
            new Date(a.last_activity ?? 0).getTime() -
            new Date(b.last_activity ?? 0).getTime();
          break;
        case "name":
          cmp = a.name.localeCompare(b.name);
          break;
      }
      return sortAsc ? cmp : -cmp;
    });
    return sorted;
  }, [allLeads, tierFilter, statusFilter, favoritesOnly, search, sortKey, sortAsc, scoreMin, scoreMax, mainSiteOnly]);

  /* Reset page when filters change */
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const paged = useMemo(
    () => filtered.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE),
    [filtered, safePage]
  );

  /* Status change with confirmation */
  const handleStatusChange = useCallback(
    (companyId: string, newStatus: string, currentStatus: string) => {
      if (newStatus === currentStatus) return;
      const label = STATUS_OPTIONS.find((o) => o.value === newStatus)?.label ?? newStatus;
      if (!window.confirm(`სტატუსი შეიცვალოს → "${label}"?`)) return;
      updateSalesStatus(companyId, newStatus);
    },
    [updateSalesStatus]
  );

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc(!sortAsc);
    else {
      setSortKey(key);
      setSortAsc(false);
    }
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  const allPageSelected = paged.length > 0 && paged.every((l) => selected.has(l.company_id));

  function toggleSelectAll() {
    if (allPageSelected) {
      setSelected((prev) => {
        const next = new Set(prev);
        paged.forEach((l) => next.delete(l.company_id));
        return next;
      });
    } else {
      setSelected((prev) => {
        const next = new Set(prev);
        paged.forEach((l) => next.add(l.company_id));
        return next;
      });
    }
  }

  async function bulkStatus(newStatus: string) {
    const label = STATUS_OPTIONS.find((o) => o.value === newStatus)?.label ?? newStatus;
    if (!window.confirm(`${selected.size} ლიდის სტატუსი შეიცვალოს → "${label}"?`)) return;
    const ids = [...selected];
    await Promise.allSettled(ids.map((id) => updateSalesStatus(id, newStatus)));
    setSelected(new Set());
  }

  async function bulkFavorite() {
    const ids = [...selected];
    await Promise.allSettled(ids.map((id) => toggleFavorite(id)));
    setSelected(new Set());
  }

  return (
    <section>
      {/* Filters */}
      <div className={s.filters}>
        {TIER_OPTIONS.map((t) => (
          <button
            key={String(t.value)}
            className={tierFilter === t.value ? s.filterBtnActive : s.filterBtn}
            onClick={() => setTierFilter(t.value)}
          >
            {t.label}
          </button>
        ))}

        <span style={{ width: 1 }} />

        {STATUS_OPTIONS.map((o) => (
          <button
            key={o.value}
            className={statusFilter === o.value ? s.filterBtnActive : s.filterBtn}
            onClick={() => setStatusFilter(o.value)}
          >
            {o.label}
          </button>
        ))}

        <button
          className={favoritesOnly ? s.filterBtnActive : s.filterBtn}
          onClick={() => setFavoritesOnly(!favoritesOnly)}
        >
          ★ ფავორიტები
        </button>

        <button
          className={mainSiteOnly ? s.filterBtnActive : s.filterBtn}
          onClick={() => setMainSiteOnly(!mainSiteOnly)}
        >
          🌐 საიტი
        </button>

        <button
          className={showAdvanced ? s.filterBtnActive : s.filterBtn}
          onClick={() => setShowAdvanced(!showAdvanced)}
          aria-expanded={showAdvanced}
        >
          ⚙ ფილტრები
        </button>

        <div className={s.searchWrap}>
          <span className={s.searchIcon}>🔍</span>
          <input
            className={s.searchInput}
            placeholder="ძებნა..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className={s.advancedFilters}>
          <div className={s.filterGroup}>
            <label className={s.filterLabel}>Score: {scoreMin}–{scoreMax}</label>
            <div className={s.rangeRow}>
              <input
                type="range"
                className={s.rangeInput}
                min={0}
                max={100}
                value={scoreMin}
                onChange={(e) => setScoreMin(Math.min(Number(e.target.value), scoreMax))}
                aria-label="მინიმალური Score"
              />
              <input
                type="range"
                className={s.rangeInput}
                min={0}
                max={100}
                value={scoreMax}
                onChange={(e) => setScoreMax(Math.max(Number(e.target.value), scoreMin))}
                aria-label="მაქსიმალური Score"
              />
            </div>
          </div>
          <button
            className={s.resetBtn}
            onClick={() => { setScoreMin(0); setScoreMax(100); setMainSiteOnly(false); }}
          >
            ↺ გასუფთავება
          </button>
        </div>
      )}

      {/* Table */}
      {filtered.length === 0 ? (
        <div className={s.empty}>შედეგები არ მოიძებნა</div>
      ) : (
        <>
          <div className={s.resultCount}>
            {filtered.length} ლიდი{totalPages > 1 && ` · გვერდი ${safePage + 1}/${totalPages}`}
          </div>

          {/* Bulk action bar */}
          {selected.size > 0 && (
            <div className={s.bulkBar}>
              <span className={s.bulkCount}>{selected.size} არჩეული</span>
              <select
                className={s.bulkSelect}
                defaultValue=""
                onChange={(e) => { if (e.target.value) bulkStatus(e.target.value); e.target.value = ""; }}
              >
                <option value="" disabled>სტატუსი →</option>
                {STATUS_OPTIONS.filter((o) => o.value).map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <button className={s.bulkBtn} onClick={bulkFavorite}>★ ფავორიტი</button>
              <button className={s.bulkBtnClear} onClick={() => setSelected(new Set())}>✕ გაუქმება</button>
            </div>
          )}

          {/* Desktop table */}
          <div className={s.tableWrap}>
          <table className={s.table}>
            <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={allPageSelected}
                  onChange={toggleSelectAll}
                  aria-label="ყველას მონიშვნა"
                  className={s.checkbox}
                />
              </th>
              <th>★</th>
              <th onClick={() => toggleSort("name")}>
                კომპანია {sortKey === "name" ? (sortAsc ? "↑" : "↓") : ""}
              </th>
              <th>Tier</th>
              <th onClick={() => toggleSort("score")}>
                Score {sortKey === "score" ? (sortAsc ? "↑" : "↓") : ""}
              </th>
              <th onClick={() => toggleSort("time")}>
                დრო {sortKey === "time" ? (sortAsc ? "↑" : "↓") : ""}
              </th>
              <th>ტოპ სექცია</th>
              <th>სტატუსი</th>
              <th onClick={() => toggleSort("last")}>
                ბოლო {sortKey === "last" ? (sortAsc ? "↑" : "↓") : ""}
              </th>
              <th>საიტი</th>
            </tr>
          </thead>
          <tbody>
            {paged.map((lead) => (
              <tr key={lead.company_id} onClick={() => selectCompany(lead.company_id)}>
                <td>
                  <input
                    type="checkbox"
                    checked={selected.has(lead.company_id)}
                    onChange={() => toggleSelect(lead.company_id)}
                    onClick={(e) => e.stopPropagation()}
                    aria-label={`${lead.name} მონიშვნა`}
                    className={s.checkbox}
                  />
                </td>
                <td>
                  <button
                    className={s.star}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(lead.company_id);
                    }}
                    aria-label={lead.is_favorite ? "ფავორიტებიდან ამოღება" : "ფავორიტებში დამატება"}
                    aria-pressed={lead.is_favorite}
                  >
                    {lead.is_favorite ? "★" : "☆"}
                  </button>
                </td>
                <td>
                  <div className={s.companyName}>{lead.name}</div>
                  {lead.category && <div className={s.category}>{lead.category}</div>}
                </td>
                <td>
                  <span
                    className={`${s.tier} ${
                      lead.tier === 1 ? s.tier1 : lead.tier === 2 ? s.tier2 : s.tier3
                    }`}
                  >
                    {lead.tier ?? "—"}
                  </span>
                </td>
                <td>
                  <span className={lead.momentum_score >= 80 ? s.scoreHot : s.score}>
                    {lead.momentum_score}
                  </span>
                </td>
                <td className={s.time}>{formatTime(lead.total_active_s)}</td>
                <td className={s.time}>{lead.top_section ?? "—"}</td>
                <td>
                  <select
                    className={s.statusSelect}
                    value={lead.sales_status}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => handleStatusChange(lead.company_id, e.target.value, lead.sales_status)}
                    aria-label={`${lead.name} სტატუსი`}
                  >
                    {STATUS_OPTIONS.filter((o) => o.value).map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </td>
                <td className={s.time}>{relativeDate(lead.last_activity)}</td>
                <td>
                  {lead.visited_main_site && <span className={s.mainSite}>✓</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
          </div>

          {/* Mobile cards */}
          <div className={s.mobileCards}>
            {paged.map((lead) => (
              <div
                key={lead.company_id}
                className={s.card}
                onClick={() => selectCompany(lead.company_id)}
              >
                <div className={s.cardHeader}>
                  <input
                    type="checkbox"
                    checked={selected.has(lead.company_id)}
                    onChange={() => toggleSelect(lead.company_id)}
                    onClick={(e) => e.stopPropagation()}
                    className={s.checkbox}
                  />
                  <div className={s.cardTitle}>
                    <span className={s.companyName}>{lead.name}</span>
                    {lead.category && <span className={s.category}>{lead.category}</span>}
                  </div>
                  <span
                    className={`${s.tier} ${lead.tier === 1 ? s.tier1 : lead.tier === 2 ? s.tier2 : s.tier3}`}
                  >
                    {lead.tier ?? "—"}
                  </span>
                  <button
                    className={s.star}
                    onClick={(e) => { e.stopPropagation(); toggleFavorite(lead.company_id); }}
                  >
                    {lead.is_favorite ? "★" : "☆"}
                  </button>
                </div>
                <div className={s.cardBody}>
                  <div className={s.cardStat}>
                    <span className={s.cardLabel}>Score</span>
                    <span className={lead.momentum_score >= 80 ? s.scoreHot : s.score}>
                      {lead.momentum_score}
                    </span>
                  </div>
                  <div className={s.cardStat}>
                    <span className={s.cardLabel}>დრო</span>
                    <span className={s.time}>{formatTime(lead.total_active_s)}</span>
                  </div>
                  <div className={s.cardStat}>
                    <span className={s.cardLabel}>ტოპ სექცია</span>
                    <span className={s.time}>{lead.top_section ?? "—"}</span>
                  </div>
                  <div className={s.cardStat}>
                    <span className={s.cardLabel}>ბოლო</span>
                    <span className={s.time}>{relativeDate(lead.last_activity)}</span>
                  </div>
                </div>
                <div className={s.cardFooter}>
                  <select
                    className={s.statusSelect}
                    value={lead.sales_status}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => handleStatusChange(lead.company_id, e.target.value, lead.sales_status)}
                  >
                    {STATUS_OPTIONS.filter((o) => o.value).map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  {lead.visited_main_site && <span className={s.mainSite}>✓ საიტი</span>}
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className={s.pagination}>
              <button
                className={s.pageBtn}
                disabled={safePage === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                ← წინა
              </button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  className={i === safePage ? s.pageBtnActive : s.pageBtn}
                  onClick={() => setPage(i)}
                >
                  {i + 1}
                </button>
              )).slice(
                Math.max(0, safePage - 2),
                Math.min(totalPages, safePage + 3)
              )}
              <button
                className={s.pageBtn}
                disabled={safePage >= totalPages - 1}
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              >
                შემდეგი →
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}

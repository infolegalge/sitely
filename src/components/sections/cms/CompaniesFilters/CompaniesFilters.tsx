"use client";

import { useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { useCompanies } from "@/components/sections/cms/CompaniesProvider/CompaniesProvider";
import CmsBadge from "@/components/ui/CmsBadge/CmsBadge";
import s from "./CompaniesFilters.module.css";

const STATUS_OPTIONS = [
  { value: "", label: "ყველა სტატუსი" },
  { value: "lead", label: "ახალი" },
  { value: "locked", label: "მუშავდება" },
  { value: "demo_ready", label: "დემო მზადაა" },
  { value: "contacted", label: "კონტაქტირებული" },
  { value: "engaged", label: "ჩართული" },
  { value: "converted", label: "კონვერტირებული" },
  { value: "dnc", label: "DNC" },
];

const TIER_OPTIONS = [
  { value: "", label: "ყველა Tier" },
  { value: "1", label: "Tier 1 — HOT" },
  { value: "2", label: "Tier 2" },
  { value: "3", label: "Tier 3" },
  { value: "4", label: "Tier 4" },
  { value: "5", label: "Tier 5" },
  { value: "6", label: "Tier 6" },
  { value: "7", label: "Tier 7" },
];

const TOGGLE_OPTIONS = [
  { value: "", label: "ყველა" },
  { value: "true", label: "აქვს" },
  { value: "false", label: "არ აქვს" },
];

export default function CompaniesFilters() {
  const {
    filters,
    categories,
    sourceCategories,
    pagination,
    loading,
    setFilter,
    resetFilters,
  } = useCompanies();

  const [showMore, setShowMore] = useState(false);

  const activeCount = Object.entries(filters).filter(
    ([key, v]) => v !== "" && key !== "q",
  ).length;
  const hasActiveFilters = activeCount > 0 || filters.q !== "";

  return (
    <div className={s.wrapper}>
      {/* ── Search row ── */}
      <div className={s.searchRow}>
        <div className={s.searchWrap}>
          <Search size={16} className={s.searchIcon} />
          <input
            className={s.searchInput}
            type="text"
            placeholder="ძებნა... (სახელი, მისამართი, კატეგორია)"
            value={filters.q}
            onChange={(e) => setFilter("q", e.target.value)}
          />
        </div>
        <span className={s.resultCount}>
          {loading ? "..." : `${pagination.total.toLocaleString()} კომპანია`}
        </span>
      </div>

      {/* ── Primary filters row ── */}
      <div className={s.filtersRow}>
        <select
          className={s.select}
          value={filters.tier}
          onChange={(e) => setFilter("tier", e.target.value)}
        >
          {TIER_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        <select
          className={s.select}
          value={filters.status}
          onChange={(e) => setFilter("status", e.target.value)}
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        <select
          className={s.select}
          value={filters.category}
          onChange={(e) => setFilter("category", e.target.value)}
        >
          <option value="">ყველა კატეგორია</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <button
          className={`${s.moreBtn} ${showMore ? s.moreBtnActive : ""}`}
          onClick={() => setShowMore(!showMore)}
        >
          <SlidersHorizontal size={14} />
          <span>მეტი ფილტრი</span>
          {activeCount > 0 && (
            <CmsBadge color="blue">{activeCount}</CmsBadge>
          )}
        </button>

        {hasActiveFilters && (
          <button className={s.resetBtn} onClick={resetFilters}>
            <X size={14} />
            <span>გასუფთავება</span>
          </button>
        )}
      </div>

      {/* ── Expanded filters ── */}
      {showMore && (
        <div className={s.moreFilters}>
          <select
            className={s.select}
            value={filters.source_category}
            onChange={(e) => setFilter("source_category", e.target.value)}
          >
            <option value="">ყველა წყარო კატეგორია</option>
            {sourceCategories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <div className={s.toggleGroup}>
            <label className={s.toggleLabel}>Email:</label>
            <select
              className={s.selectSmall}
              value={filters.has_email}
              onChange={(e) => setFilter("has_email", e.target.value)}
            >
              {TOGGLE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div className={s.toggleGroup}>
            <label className={s.toggleLabel}>Website:</label>
            <select
              className={s.selectSmall}
              value={filters.has_website}
              onChange={(e) => setFilter("has_website", e.target.value)}
            >
              {TOGGLE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
}

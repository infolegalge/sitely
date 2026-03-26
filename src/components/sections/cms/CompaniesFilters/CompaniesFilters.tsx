"use client";

import { useCompanies } from "@/components/sections/cms/CompaniesProvider/CompaniesProvider";
import s from "./CompaniesFilters.module.css";

const STATUS_OPTIONS = [
  { value: "", label: "ყველა სტატუსი" },
  { value: "new", label: "ახალი" },
  { value: "contacted", label: "კონტაქტირებული" },
  { value: "viewed", label: "ნანახი" },
  { value: "interested", label: "დაინტერესებული" },
  { value: "negotiating", label: "მოლაპარაკება" },
  { value: "converted", label: "კონვერტირებული" },
  { value: "rejected", label: "უარყოფილი" },
  { value: "not_relevant", label: "არარელევანტური" },
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

  const hasActiveFilters = Object.values(filters).some((v) => v !== "");

  return (
    <div className={s.wrapper}>
      <div className={s.searchRow}>
        <input
          className={s.searchInput}
          type="text"
          placeholder="ძებნა... (სახელი, მისამართი, კატეგორია)"
          value={filters.q}
          onChange={(e) => setFilter("q", e.target.value)}
        />
        <span className={s.resultCount}>
          {loading ? "..." : `${pagination.total.toLocaleString()} კომპანია`}
        </span>
      </div>

      <div className={s.filtersRow}>
        <select
          className={s.select}
          value={filters.tier}
          onChange={(e) => setFilter("tier", e.target.value)}
        >
          {TIER_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        <select
          className={s.select}
          value={filters.status}
          onChange={(e) => setFilter("status", e.target.value)}
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        <select
          className={s.select}
          value={filters.category}
          onChange={(e) => setFilter("category", e.target.value)}
        >
          <option value="">ყველა კატეგორია</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select
          className={s.select}
          value={filters.source_category}
          onChange={(e) => setFilter("source_category", e.target.value)}
        >
          <option value="">ყველა წყარო კატეგორია</option>
          {sourceCategories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
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
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
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
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        {hasActiveFilters && (
          <button className={s.resetBtn} onClick={resetFilters}>
            ფილტრების გასუფთავება
          </button>
        )}
      </div>
    </div>
  );
}

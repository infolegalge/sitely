"use client";

import { Search } from "lucide-react";
import CmsSelect from "@/components/ui/CmsSelect/CmsSelect";
import { useTemplates } from "@/components/sections/cms/TemplatesProvider/TemplatesProvider";
import s from "./TemplatesFilters.module.css";

const STATUS_OPTIONS = [
  { value: "all", label: "ყველა სტატუსი" },
  { value: "active", label: "აქტიური" },
  { value: "inactive", label: "არააქტიური" },
];

const SORT_OPTIONS = [
  { value: "created_at", label: "თარიღი" },
  { value: "name", label: "სახელი" },
  { value: "industry", label: "ინდუსტრია" },
  { value: "updated_at", label: "განახლება" },
];

export default function TemplatesFilters() {
  const {
    search,
    setSearch,
    industryFilter,
    setIndustryFilter,
    statusFilter,
    setStatusFilter,
    sortField,
    setSort,
    industries,
  } = useTemplates();

  const industryOptions = [
    { value: "", label: "ყველა ინდუსტრია" },
    ...industries.map((i) => ({ value: i, label: i })),
  ];

  const hasFilters = search || industryFilter || statusFilter !== "all";

  const reset = () => {
    setSearch("");
    setIndustryFilter("");
    setStatusFilter("all");
  };

  return (
    <div className={s.bar}>
      <div className={s.searchWrap}>
        <Search size={14} className={s.searchIcon} />
        <input
          className={s.searchInput}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ძიება სახელით..."
          type="search"
        />
      </div>

      <CmsSelect
        compact
        options={industryOptions}
        value={industryFilter}
        onChange={(e) => setIndustryFilter(e.target.value)}
      />

      <CmsSelect
        compact
        options={STATUS_OPTIONS}
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value as "all" | "active" | "inactive")}
      />

      <div className={s.sortWrap}>
        <span className={s.sortLabel}>სორტირება:</span>
        <CmsSelect
          compact
          options={SORT_OPTIONS}
          value={sortField}
          onChange={(e) => setSort(e.target.value as "name" | "industry" | "created_at" | "updated_at")}
        />
      </div>

      {hasFilters && (
        <button className={s.resetBtn} onClick={reset}>
          გასუფთავება
        </button>
      )}
    </div>
  );
}

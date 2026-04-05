"use client";

import { useCompanies } from "@/components/sections/cms/CompaniesProvider/CompaniesProvider";
import CompanyRow from "@/components/sections/cms/CompanyRow/CompanyRow";
import CmsEmptyState from "@/components/ui/CmsEmptyState/CmsEmptyState";
import { Building2 } from "lucide-react";
import s from "./CompaniesTable.module.css";

const COLUMNS = [
  { key: "name", label: "სახელი" },
  { key: "category", label: "კატეგორია" },
  { key: "tier", label: "Tier" },
  { key: "score", label: "Score" },
  { key: "status", label: "სტატუსი" },
];

const SORTABLE = new Set(["name", "tier", "score", "status"]);

export default function CompaniesTable() {
  const { companies, sort, loading, setSort } = useCompanies();

  return (
    <div className={s.wrapper}>
      <table className={s.table}>
        <thead>
          <tr>
            {COLUMNS.map((col) => {
              const isSortable = SORTABLE.has(col.key);
              const isActive = sort.column === col.key;
              return (
                <th
                  key={col.key}
                  className={`${s.th} ${isSortable ? s.sortable : ""} ${isActive ? s.active : ""}`}
                  onClick={isSortable ? () => setSort(col.key) : undefined}
                >
                  {col.label}
                  {isActive && (
                    <span className={s.arrow}>
                      {sort.order === "asc" ? " ↑" : " ↓"}
                    </span>
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <tr key={i} className={s.skelRow}>
                {COLUMNS.map((_, ci) => (
                  <td key={ci} className={s.skelCell}>
                    <div
                      className={s.skelBar}
                      style={{ width: `${50 + ((i + ci) % 4) * 14}%` }}
                    />
                  </td>
                ))}
              </tr>
            ))
          ) : companies.length === 0 ? (
            <tr>
              <td colSpan={5}>
                <CmsEmptyState
                  icon={<Building2 size={40} />}
                  title="კომპანიები ვერ მოიძებნა"
                  description="სცადეთ ფილტრების შეცვლა ან ძებნის ტექსტის შემოწმება"
                />
              </td>
            </tr>
          ) : (
            companies.map((company) => (
              <CompanyRow key={company.id} company={company} />
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

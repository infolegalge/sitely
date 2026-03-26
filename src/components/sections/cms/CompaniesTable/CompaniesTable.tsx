"use client";

import { useCompanies } from "@/components/sections/cms/CompaniesProvider/CompaniesProvider";
import CompanyRow from "@/components/sections/cms/CompanyRow/CompanyRow";
import s from "./CompaniesTable.module.css";

const COLUMNS = [
  { key: "name", label: "სახელი" },
  { key: "category", label: "კატეგორია" },
  { key: "tier", label: "Tier" },
  { key: "score", label: "Score" },
  { key: "email", label: "Email" },
  { key: "rating", label: "რეიტინგი" },
  { key: "status", label: "სტატუსი" },
];

const SORTABLE = new Set(["name", "tier", "score", "rating", "status"]);

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
            <tr>
              <td colSpan={7} className={s.loading}>
                იტვირთება...
              </td>
            </tr>
          ) : companies.length === 0 ? (
            <tr>
              <td colSpan={7} className={s.empty}>
                კომპანიები ვერ მოიძებნა
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

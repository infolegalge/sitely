"use client";

import { useCompanies } from "@/components/sections/cms/CompaniesProvider/CompaniesProvider";
import s from "./CompaniesPagination.module.css";

export default function CompaniesPagination() {
  const { pagination, setPage, loading } = useCompanies();
  const { page, totalPages, total, limit } = pagination;

  if (totalPages <= 1) return null;

  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  // Build page numbers with ellipsis
  const pages: (number | "...")[] = [];
  const addPage = (p: number) => {
    if (p >= 1 && p <= totalPages && !pages.includes(p)) pages.push(p);
  };

  addPage(1);
  if (page > 3) pages.push("...");
  for (let i = page - 1; i <= page + 1; i++) addPage(i);
  if (page < totalPages - 2) pages.push("...");
  addPage(totalPages);

  return (
    <div className={s.wrapper}>
      <span className={s.info}>
        {start}–{end} / {total.toLocaleString()}
      </span>

      <div className={s.buttons}>
        <button
          className={s.btn}
          onClick={() => setPage(page - 1)}
          disabled={page <= 1 || loading}
        >
          ←
        </button>

        {pages.map((p, i) =>
          p === "..." ? (
            <span key={`e${i}`} className={s.ellipsis}>
              …
            </span>
          ) : (
            <button
              key={p}
              className={`${s.btn} ${p === page ? s.active : ""}`}
              onClick={() => setPage(p)}
              disabled={loading}
            >
              {p}
            </button>
          )
        )}

        <button
          className={s.btn}
          onClick={() => setPage(page + 1)}
          disabled={page >= totalPages || loading}
        >
          →
        </button>
      </div>
    </div>
  );
}

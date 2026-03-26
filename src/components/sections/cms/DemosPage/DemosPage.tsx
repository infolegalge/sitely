"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import s from "./DemosPage.module.css";

interface Demo {
  id: string;
  hash: string;
  company_id: string;
  status: string;
  view_count: number;
  first_viewed_at: string | null;
  last_viewed_at: string | null;
  created_at: string;
  companies: { name: string; email: string | null; phone: string | null; category: string | null } | null;
}

const STATUS_LABELS: Record<string, string> = {
  pending: "მომლოდინე",
  generated: "გენერირებული",
  sent: "გაგზავნილი",
  viewed: "ნანახი",
  clicked: "დაკლიკებული",
  form_submitted: "ფორმა გაგზ.",
  expired: "ვადაგასული",
};

export default function DemosPage() {
  const [demos, setDemos] = useState<Demo[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");

  const fetchDemos = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("per_page", "50");
    if (statusFilter) params.set("status", statusFilter);

    fetch(`/api/demos?${params}`)
      .then((r) => r.json())
      .then((res) => {
        if (Array.isArray(res.data)) {
          setDemos(res.data);
          setTotal(res.total || 0);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, statusFilter]);

  useEffect(() => { fetchDemos(); }, [fetchDemos]);

  const totalPages = Math.ceil(total / 50);

  return (
    <div className={s.page}>
      <div className={s.header}>
        <h1 className={s.title}>დემოები</h1>
        <Link href="/secure-access/demos/generate" className={s.generateLink}>
          + ახალი გენერაცია
        </Link>
      </div>

      <div className={s.filterBar}>
        <select
          className={s.filterSelect}
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
        >
          <option value="">ყველა სტატუსი</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <span className={s.totalCount}>სულ: {total}</span>
      </div>

      {loading ? (
        <div className={s.loading}>იტვირთება...</div>
      ) : demos.length === 0 ? (
        <div className={s.empty}>დემოები არ მოიძებნა</div>
      ) : (
        <table className={s.table}>
          <thead>
            <tr>
              <th>კომპანია</th>
              <th>სტატუსი</th>
              <th>ნახვები</th>
              <th>პირველი ნახვა</th>
              <th>ბოლო ნახვა</th>
              <th>შექმნილი</th>
              <th>ლინკი</th>
            </tr>
          </thead>
          <tbody>
            {demos.map((d) => (
              <tr key={d.id}>
                <td>{d.companies?.name || "—"}</td>
                <td>
                  <span className={`${s.statusBadge} ${s[`status_${d.status}`] || ""}`}>
                    {STATUS_LABELS[d.status] || d.status}
                  </span>
                </td>
                <td>{d.view_count}</td>
                <td>{d.first_viewed_at ? new Date(d.first_viewed_at).toLocaleDateString("ka") : "—"}</td>
                <td>{d.last_viewed_at ? new Date(d.last_viewed_at).toLocaleDateString("ka") : "—"}</td>
                <td>{new Date(d.created_at).toLocaleDateString("ka")}</td>
                <td>
                  <button
                    className={s.copyBtn}
                    onClick={() => navigator.clipboard.writeText(`${window.location.origin}/demo/${d.hash}`)}
                  >
                    კოპირება
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {totalPages > 1 && (
        <div className={s.pagination}>
          <button disabled={page <= 1} onClick={() => setPage(page - 1)}>←</button>
          <span>{page} / {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}>→</button>
        </div>
      )}
    </div>
  );
}

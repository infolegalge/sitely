"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const [demos, setDemos] = useState<Demo[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [actionLoading, setActionLoading] = useState(false);

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

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === demos.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(demos.map((d) => d.id)));
    }
  };

  const handleSendEmail = async () => {
    if (selected.size === 0) return;
    const ids = Array.from(selected);
    const withEmail = demos.filter((d) => ids.includes(d.id) && d.companies?.email);
    if (withEmail.length === 0) {
      alert("მონიშნულ დემოებს email არ აქვთ");
      return;
    }
    if (!confirm(`გაგზავნოთ ${withEmail.length} მეილი?`)) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ demo_ids: withEmail.map((d) => d.id) }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "შეცდომა");
        return;
      }
      const data = await res.json();
      alert(`${data.sent} მეილი გაიგზავნა, ${data.skipped} გამოტოვებული`);
      setSelected(new Set());
      fetchDemos();
    } catch {
      alert("შეცდომა");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (selected.size === 0) return;
    if (!confirm(`წაიშალოს ${selected.size} დემო?`)) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/demos", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selected) }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "შეცდომა");
        return;
      }
      setSelected(new Set());
      fetchDemos();
    } catch {
      alert("შეცდომა");
    } finally {
      setActionLoading(false);
    }
  };

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

        {selected.size > 0 && (
          <div className={s.actions}>
            <span className={s.selectedCount}>{selected.size} მონიშნული</span>
            <button
              className={s.sendBtn}
              onClick={handleSendEmail}
              disabled={actionLoading}
            >
              ✉ მეილის გაგზავნა
            </button>
            <button
              className={s.deleteBtn}
              onClick={handleDelete}
              disabled={actionLoading}
            >
              ✕ წაშლა
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className={s.loading}>იტვირთება...</div>
      ) : demos.length === 0 ? (
        <div className={s.empty}>დემოები არ მოიძებნა</div>
      ) : (
        <table className={s.table}>
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={selected.size === demos.length && demos.length > 0}
                  onChange={toggleAll}
                />
              </th>
              <th>კომპანია</th>
              <th>სტატუსი</th>
              <th>ნახვები</th>
              <th>პირველი ნახვა</th>
              <th>ბოლო ნახვა</th>
              <th>შექმნილი</th>
              <th>მოქმედება</th>
            </tr>
          </thead>
          <tbody>
            {demos.map((d) => (
              <tr
                key={d.id}
                className={`${s.row} ${selected.has(d.id) ? s.rowSelected : ""}`}
                onClick={() => router.push(`/secure-access/demos/${d.id}`)}
              >
                <td onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selected.has(d.id)}
                    onChange={() => toggleSelect(d.id)}
                  />
                </td>
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
                <td onClick={(e) => e.stopPropagation()}>
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

"use client";

import { useState } from "react";
import Link from "next/link";
import { useBatches } from "../BatchesProvider/BatchesProvider";
import type { BatchSummary } from "../BatchesProvider/BatchesProvider";
import s from "./BatchesPage.module.css";

const STATUS_LABELS: Record<string, string> = {
  active: "აქტიური",
  completed: "დასრულებული",
  archived: "დაარქივებული",
};

function pct(part: number, total: number) {
  if (total === 0) return 0;
  return Math.round((part / total) * 100);
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("ka-GE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function BatchesPage() {
  const { batches, loading, error, refresh, updateBatch, deleteBatch } = useBatches();
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filtered =
    statusFilter === "all"
      ? batches
      : batches.filter((b) => b.status === statusFilter);

  const handleArchive = async (b: BatchSummary) => {
    const next = b.status === "archived" ? "active" : "archived";
    await updateBatch(b.id, { status: next });
  };

  const handleDelete = async (b: BatchSummary) => {
    if (!confirm(`ნამდვილად წაშალო ბაჩი "${b.name}"?`)) return;
    await deleteBatch(b.id);
  };

  if (loading) return <p className={s.loading}>იტვირთება...</p>;
  if (error) return <p className={s.error}>{error}</p>;

  return (
    <div className={s.page}>
      <div className={s.header}>
        <h1 className={s.title}>ბაჩები</h1>
        <div className={s.headerActions}>
          <select
            className={s.filterSelect}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">ყველა</option>
            <option value="active">აქტიური</option>
            <option value="completed">დასრულებული</option>
            <option value="archived">დაარქივებული</option>
          </select>
          <button className={s.refreshBtn} onClick={refresh}>
            განახლება
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className={s.empty}>ბაჩები ვერ მოიძებნა</p>
      ) : (
        <div className={s.grid}>
          {filtered.map((b) => {
            const viewedPct = pct(b.viewed_count, b.total_demos);
            return (
              <Link
                key={b.id}
                href={`/secure-access/batches/${b.id}`}
                className={s.card}
              >
                <div className={s.cardTop}>
                  <div className={s.cardInfo}>
                    <h3 className={s.cardName}>{b.name}</h3>
                    {b.template_name && (
                      <span className={s.templateLabel}>{b.template_name}</span>
                    )}
                  </div>
                  <span className={`${s.statusBadge} ${s[`st_${b.status}`]}`}>
                    {STATUS_LABELS[b.status] || b.status}
                  </span>
                </div>

                {b.description && (
                  <p className={s.cardDesc}>{b.description}</p>
                )}

                <div className={s.progressWrap}>
                  <div className={s.progressBar}>
                    <div
                      className={s.progressFill}
                      style={{ width: `${viewedPct}%` }}
                    />
                  </div>
                  <span className={s.progressLabel}>
                    {b.viewed_count}/{b.total_demos} ნახული ({viewedPct}%)
                  </span>
                </div>

                <div className={s.statsRow}>
                  <div className={s.stat}>
                    <span className={s.statValue}>{b.total_demos}</span>
                    <span className={s.statLabel}>გაგზავნილი</span>
                  </div>
                  <div className={s.stat}>
                    <span className={`${s.statValue} ${s.viewed}`}>{b.viewed_count}</span>
                    <span className={s.statLabel}>ნახული</span>
                  </div>
                  <div className={s.stat}>
                    <span className={`${s.statValue} ${s.engaged}`}>{b.engaged_count}</span>
                    <span className={s.statLabel}>ჩართული</span>
                  </div>
                  <div className={s.stat}>
                    <span className={`${s.statValue} ${s.converted}`}>{b.converted_count}</span>
                    <span className={s.statLabel}>კონვერტ.</span>
                  </div>
                </div>

                <div className={s.cardFooter}>
                  <span className={s.cardDate}>{fmtDate(b.created_at)}</span>
                  <div className={s.cardActions}>
                    <button
                      className={s.archiveBtn}
                      onClick={(e) => {
                        e.preventDefault();
                        handleArchive(b);
                      }}
                    >
                      {b.status === "archived" ? "აქტიურება" : "არქივი"}
                    </button>
                    <button
                      className={s.deleteCardBtn}
                      onClick={(e) => {
                        e.preventDefault();
                        handleDelete(b);
                      }}
                    >
                      წაშლა
                    </button>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

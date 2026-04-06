"use client";

import Link from "next/link";
import { useSection } from "../SectionProvider/SectionProvider";
import s from "./SectionPage.module.css";

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("ka-GE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function pct(part: number, total: number) {
  if (total === 0) return 0;
  return Math.round((part / total) * 100);
}

export default function SectionPage({ title, basePath }: { title: string, basePath: string }) {
  const { categories, loading, error, refresh } = useSection();

  if (loading) return <p className={s.loading}>იტვირთება...</p>;
  if (error) return <p className={s.error}>{error}</p>;

  return (
    <div className={s.page}>
      <div className={s.header}>
        <h1 className={s.title}>{title}</h1>
        <button className={s.refreshBtn} onClick={refresh}>
          განახლება
        </button>
      </div>

      {categories.length === 0 ? (
        <div className={s.emptyState}>
          <p className={s.emptyTitle}>კატეგორიები ჯერ არ არსებობს</p>
          <p className={s.emptyDesc}>
            კომპანიების გადასატანად გამოიყენე ბაჩის გვერდზე მონიშვნა და &quot;გადატანა&quot; ღილაკი
          </p>
        </div>
      ) : (
        <div className={s.grid}>
          {categories.map((cat) => {
            const viewedPct = pct(cat.viewed_count, cat.total_demos);
            return (
              <Link
                key={cat.id}
                href={`${basePath}/${cat.id}`}
                className={s.card}
              >
                <div className={s.cardTop}>
                  <h3 className={s.cardName}>{cat.name}</h3>
                  <span className={s.cardCount}>{cat.total_demos} კომპანია</span>
                </div>

                <div className={s.progressWrap}>
                  <div className={s.progressBar}>
                    <div
                      className={s.progressFill}
                      style={{ width: `${viewedPct}%` }}
                    />
                  </div>
                  <span className={s.progressLabel}>
                    {cat.viewed_count}/{cat.total_demos} ნახული ({viewedPct}%)
                  </span>
                </div>

                <div className={s.cardFooter}>
                  <span className={s.cardDate}>{fmtDate(cat.created_at)}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

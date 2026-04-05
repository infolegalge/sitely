"use client";

import { useBatchDetail } from "../BatchDetailProvider/BatchDetailProvider";
import type { SortKey, CompanyFilter, BatchCompany } from "../BatchDetailProvider/BatchDetailProvider";
import Link from "next/link";
import s from "./BatchDetailPage.module.css";

/* ── Helpers ─────────────────────────────────────────────── */
function pct(part: number, total: number) {
  if (total === 0) return "0";
  return ((part / total) * 100).toFixed(1);
}

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("ka-GE", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtDuration(seconds: number | null) {
  if (!seconds) return "—";
  const m = Math.floor(seconds / 60);
  const sec = Math.round(seconds % 60);
  return m > 0 ? `${m}წ ${sec}წმ` : `${sec}წმ`;
}

const FILTER_LABELS: Record<CompanyFilter, string> = {
  all: "ყველა",
  not_viewed: "არ ნანახი",
  viewed: "ნანახი",
  engaged: "ჩართული",
  converted: "კონვერტირებული",
};

const SORT_LABELS: Record<SortKey, string> = {
  momentum_score: "სკორი",
  name: "სახელი",
  view_count: "ნახვები",
  total_active_s: "დრო",
  max_scroll: "სქროლი",
  cta_clicks: "CTA",
  last_activity: "აქტივობა",
};

function statusColor(c: BatchCompany): string {
  if (c.form_submits > 0) return s.rowConverted;
  if (c.momentum_score >= 10) return s.rowEngaged;
  if (c.view_count > 0) return s.rowViewed;
  return s.rowNotViewed;
}

/* ── Main Component ──────────────────────────────────────── */
export default function BatchDetailPage() {
  const {
    batch,
    summary,
    funnel,
    filteredCompanies,
    loading,
    error,
    refresh,
    filter,
    setFilter,
    sortKey,
    setSortKey,
    sortAsc,
    toggleSortDir,
    search,
    setSearch,
  } = useBatchDetail();

  if (loading) return <p className={s.loading}>იტვირთება...</p>;
  if (error) return <p className={s.error}>{error}</p>;
  if (!batch || !summary || !funnel) return <p className={s.error}>ბაჩი ვერ მოიძებნა</p>;

  const totalDemos = summary.total_demos;

  return (
    <div className={s.page}>
      {/* ── Row 1: Header ── */}
      <div className={s.header}>
        <div className={s.headerLeft}>
          <Link href="/secure-access/batches" className={s.backLink}>
            ← ბაჩები
          </Link>
          <h1 className={s.title}>{batch.name}</h1>
          {batch.template_name && (
            <span className={s.templateLabel}>{batch.template_name}</span>
          )}
        </div>
        <div className={s.headerRight}>
          <span className={`${s.statusBadge} ${s[`st_${batch.status}`]}`}>
            {batch.status}
          </span>
          <button className={s.refreshBtn} onClick={refresh}>
            განახლება
          </button>
        </div>
      </div>

      {/* ── Row 2: KPI Cards ── */}
      <div className={s.kpiRow}>
        <div className={s.kpi}>
          <span className={s.kpiValue}>{totalDemos}</span>
          <span className={s.kpiLabel}>გაგზავნილი</span>
        </div>
        <div className={s.kpi}>
          <span className={`${s.kpiValue} ${s.kpiViewed}`}>
            {summary.viewed_count}
            <small className={s.kpiPct}>{pct(summary.viewed_count, totalDemos)}%</small>
          </span>
          <span className={s.kpiLabel}>ნახული</span>
        </div>
        <div className={s.kpi}>
          <span className={`${s.kpiValue} ${s.kpiEngaged}`}>
            {funnel.cta_clicked}
            <small className={s.kpiPct}>{pct(funnel.cta_clicked, totalDemos)}%</small>
          </span>
          <span className={s.kpiLabel}>ჩართული</span>
        </div>
        <div className={s.kpi}>
          <span className={`${s.kpiValue} ${s.kpiConverted}`}>
            {funnel.form_submitted}
            <small className={s.kpiPct}>{pct(funnel.form_submitted, totalDemos)}%</small>
          </span>
          <span className={s.kpiLabel}>კონვერტ.</span>
        </div>
        <div className={s.kpi}>
          <span className={s.kpiValue}>{fmtDuration(summary.avg_session_s)}</span>
          <span className={s.kpiLabel}>საშ. სესია</span>
        </div>
      </div>

      {/* ── Row 3: Funnel ── */}
      <div className={s.funnelWrap}>
        <h3 className={s.sectionTitle}>ფანელი</h3>
        <div className={s.funnel}>
          <FunnelStep label="გაგზავნილი" count={funnel.sent} total={funnel.sent} />
          <FunnelArrow />
          <FunnelStep label="ნახული" count={funnel.viewed} total={funnel.sent} />
          <FunnelArrow />
          <FunnelStep label="სქროლი 50%+" count={funnel.scrolled_50} total={funnel.sent} />
          <FunnelArrow />
          <FunnelStep label="CTA კლიკი" count={funnel.cta_clicked} total={funnel.sent} />
          <FunnelArrow />
          <FunnelStep label="ფორმა" count={funnel.form_submitted} total={funnel.sent} />
        </div>
      </div>

      {/* ── Row 4: Company Table ── */}
      <div className={s.tableSection}>
        <div className={s.tableHeader}>
          <h3 className={s.sectionTitle}>
            კომპანიები ({filteredCompanies.length})
          </h3>
          <div className={s.tableControls}>
            <input
              className={s.searchInput}
              placeholder="ძებნა..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className={s.filterSelect}
              value={filter}
              onChange={(e) => setFilter(e.target.value as CompanyFilter)}
            >
              {Object.entries(FILTER_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
            <select
              className={s.filterSelect}
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
            >
              {Object.entries(SORT_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
            <button className={s.sortDirBtn} onClick={toggleSortDir}>
              {sortAsc ? "↑" : "↓"}
            </button>
          </div>
        </div>

        {filteredCompanies.length === 0 ? (
          <p className={s.empty}>კომპანიები ვერ მოიძებნა</p>
        ) : (
          <div className={s.tableWrap}>
            <table className={s.table}>
              <thead>
                <tr>
                  <th>კომპანია</th>
                  <th>სტატუსი</th>
                  <th>ნახვა</th>
                  <th>სქროლი</th>
                  <th>დრო</th>
                  <th>CTA</th>
                  <th>სკორი</th>
                  <th>პორტალი</th>
                  <th>აქტივობა</th>
                </tr>
              </thead>
              <tbody>
                {filteredCompanies.map((c) => (
                  <tr key={c.company_id} className={statusColor(c)}>
                    <td>
                      <div className={s.companyCell}>
                        <span className={s.companyName}>{c.name}</span>
                        {c.category && (
                          <span className={s.companyCategory}>{c.category}</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <CompanyStatus company={c} />
                    </td>
                    <td>{c.view_count}</td>
                    <td>{c.max_scroll}%</td>
                    <td>{fmtDuration(c.avg_session_s)}</td>
                    <td>
                      {c.cta_clicks > 0 ? (
                        <span className={s.ctaHighlight}>{c.cta_clicks}</span>
                      ) : (
                        "0"
                      )}
                    </td>
                    <td>
                      <span
                        className={`${s.scoreBadge} ${
                          c.momentum_score >= 50
                            ? s.scoreHot
                            : c.momentum_score >= 10
                              ? s.scoreWarm
                              : s.scoreCold
                        }`}
                      >
                        {c.momentum_score}
                      </span>
                    </td>
                    <td>
                      {c.portal_accessed ? (
                        <span className={s.portalYes}>✓</span>
                      ) : (
                        <span className={s.portalNo}>—</span>
                      )}
                    </td>
                    <td className={s.dateCell}>{fmtDate(c.last_activity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Sub-components ──────────────────────────────────────── */
function FunnelStep({
  label,
  count,
  total,
}: {
  label: string;
  count: number;
  total: number;
}) {
  const p = total > 0 ? ((count / total) * 100).toFixed(1) : "0";
  return (
    <div className={s.funnelStep}>
      <span className={s.funnelCount}>{count}</span>
      <span className={s.funnelLabel}>{label}</span>
      <span className={s.funnelPct}>{p}%</span>
    </div>
  );
}

function FunnelArrow() {
  return <span className={s.funnelArrow}>→</span>;
}

function CompanyStatus({ company: c }: { company: BatchCompany }) {
  if (c.form_submits > 0) return <span className={`${s.csBadge} ${s.csConverted}`}>კონვერტ.</span>;
  if (c.cta_clicks > 0) return <span className={`${s.csBadge} ${s.csEngaged}`}>ჩართული</span>;
  if (c.view_count > 0) return <span className={`${s.csBadge} ${s.csViewed}`}>ნანახი</span>;
  return <span className={`${s.csBadge} ${s.csNone}`}>არ ნანახი</span>;
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { useBatchDetail } from "../BatchDetailProvider/BatchDetailProvider";
import type { SortKey, CompanyFilter, BatchCompany, CompanyEvent, PreviousSend } from "../BatchDetailProvider/BatchDetailProvider";
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
  portal_accessed: "პორტალი",
  sales_status: "სტატუსი",
  proposal_status: "შეთავაზება",
};

const SECTION_LABELS: Record<string, string> = {
  clients: "კლიენტები 1",
  offers: "შეთავაზება 2",
  marketing: "მარკეტინგი 3",
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

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [moveModalOpen, setMoveModalOpen] = useState(false);

  const toggleSelect = useCallback((demoId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(demoId)) next.delete(demoId);
      else next.add(demoId);
      return next;
    });
  }, []);

  const allSelected =
    filteredCompanies.length > 0 &&
    filteredCompanies.every((c) => selectedIds.has(c.demo_id));

  const toggleAll = useCallback(() => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredCompanies.map((c) => c.demo_id)));
    }
  }, [allSelected, filteredCompanies]);

  const handleMoveComplete = useCallback(() => {
    setSelectedIds(new Set());
    setMoveModalOpen(false);
    refresh();
  }, [refresh]);

  function handleSort(col: SortKey) {
    if (sortKey === col) {
      toggleSortDir();
    } else {
      setSortKey(col);
    }
  }

  if (loading) return <p className={s.loading}>იტვირთება...</p>;
  if (error) return <p className={s.error}>{error}</p>;
  if (!batch || !summary || !funnel) return <p className={s.error}>ბაჩი ვერ მოიძებნა</p>;

  const totalDemos = summary.total_demos;

  return (
    <div className={s.page}>
      {/* ── Row 1: Header ── */}
      <div className={s.header}>
        <div className={s.headerLeft}>
          <Link
            href={batch.section === "offers" ? "/secure-access/offers" : batch.section === "marketing" ? "/secure-access/marketing" : batch.section ? "/secure-access/clients" : "/secure-access/batches"}
            className={s.backLink}
          >
            ← {batch.section === "offers" ? "შეთავაზება 2" : batch.section === "marketing" ? "მარკეტინგი 3" : batch.section ? "კლიენტები 1" : "ბაჩები"}
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
          </div>
        </div>

        {filteredCompanies.length === 0 ? (
          <p className={s.empty}>კომპანიები ვერ მოიძებნა</p>
        ) : (
          <div className={s.tableWrap}>
            <table className={s.table}>
              <thead>
                <tr>
                  <th className={s.checkboxTh}>
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleAll}
                      className={s.checkbox}
                    />
                  </th>
                  <th>კომპანია</th>
                  <SortTh label="სტატუსი" col="sales_status" current={sortKey} asc={sortAsc} onSort={handleSort} />
                  <SortTh label="ნახვა" col="view_count" current={sortKey} asc={sortAsc} onSort={handleSort} />
                  <SortTh label="სქროლი" col="max_scroll" current={sortKey} asc={sortAsc} onSort={handleSort} />
                  <SortTh label="დრო" col="total_active_s" current={sortKey} asc={sortAsc} onSort={handleSort} />
                  <SortTh label="CTA" col="cta_clicks" current={sortKey} asc={sortAsc} onSort={handleSort} />
                  <SortTh label="სკორი" col="momentum_score" current={sortKey} asc={sortAsc} onSort={handleSort} />
                  <SortTh label="პორტალი" col="portal_accessed" current={sortKey} asc={sortAsc} onSort={handleSort} />
                  <SortTh label="შეთავაზება" col="proposal_status" current={sortKey} asc={sortAsc} onSort={handleSort} />
                  <SortTh label="აქტივობა" col="last_activity" current={sortKey} asc={sortAsc} onSort={handleSort} />
                </tr>
              </thead>
              <tbody>
                {filteredCompanies.map((c) => (
                  <CompanyRow
                    key={c.company_id}
                    company={c}
                    isExpanded={expandedId === c.company_id}
                    isSelected={selectedIds.has(c.demo_id)}
                    onSelect={() => toggleSelect(c.demo_id)}
                    onToggle={() =>
                      setExpandedId((prev) =>
                        prev === c.company_id ? null : c.company_id
                      )
                    }
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Move Bar ── */}
        {selectedIds.size > 0 && (
          <div className={s.moveBar}>
            <span className={s.moveBarText}>
              {selectedIds.size} კომპანია მონიშნულია
            </span>
            <button
              className={s.moveBtn}
              onClick={() => setMoveModalOpen(true)}
            >
              გადატანა
            </button>
          </div>
        )}

        {/* ── Move Modal ── */}
        {moveModalOpen && (
          <MoveModal
            selectedDemoIds={[...selectedIds]}
            onClose={() => setMoveModalOpen(false)}
            onComplete={handleMoveComplete}
          />
        )}
      </div>
    </div>
  );
}

/* ── Sub-components ──────────────────────────────────────── */
function SortTh({
  label,
  col,
  current,
  asc,
  onSort,
}: {
  label: string;
  col: SortKey;
  current: SortKey;
  asc: boolean;
  onSort: (col: SortKey) => void;
}) {
  const active = current === col;
  return (
    <th
      className={`${s.sortableTh} ${active ? s.sortActive : ""}`}
      onClick={() => onSort(col)}
    >
      {label}
      <span className={s.sortArrow}>
        {active ? (asc ? " ↑" : " ↓") : ""}
      </span>
    </th>
  );
}

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

function ProposalBadge({ status }: { status: string | null }) {
  if (status === "accepted") return <span className={`${s.proposalBadge} ${s.proposalAccepted}`}>აქტიური</span>;
  if (status === "rejected") return <span className={`${s.proposalBadge} ${s.proposalRejected}`}>პასიური</span>;
  if (status === "pending") return <span className={`${s.proposalBadge} ${s.proposalPending}`}>ჯერ არ დაუდასტურებია</span>;
  if (status === "expired") return <span className={`${s.proposalBadge} ${s.proposalExpired}`}>ვადაგასული</span>;
  return <span className={s.proposalNone}>—</span>;
}

/* ── Company Row (clickable + expandable) ──────────────── */
function CompanyRow({
  company: c,
  isExpanded,
  isSelected,
  onSelect,
  onToggle,
}: {
  company: BatchCompany;
  isExpanded: boolean;
  isSelected: boolean;
  onSelect: () => void;
  onToggle: () => void;
}) {
  return (
    <>
      <tr
        className={`${statusColor(c)} ${s.clickableRow} ${isExpanded ? s.expandedActive : ""} ${isSelected ? s.selectedRow : ""}`}
        onClick={onToggle}
      >
        <td className={s.checkboxTd} onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onSelect}
            className={s.checkbox}
          />
        </td>
        <td>
          <div className={s.companyCell}>
            <span className={s.companyName}>
              <span className={s.expandArrow}>{isExpanded ? "▾" : "▸"}</span>
              {c.name}
              {c.send_count > 1 && (
                <span className={s.sendCountBadge}>{c.send_count}x</span>
              )}
            </span>
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
        <td>
          <ProposalBadge status={c.proposal_status} />
        </td>
        <td className={s.dateCell}>{fmtDate(c.last_activity)}</td>
      </tr>
      {isExpanded && (
        <tr className={s.expandedRow}>
          <td colSpan={11}>
            <CompanyExpandPanel company={c} />
          </td>
        </tr>
      )}
    </>
  );
}

/* ── Expand Panel ──────────────────────────────────────── */
const EVENT_LABELS: Record<string, string> = {
  page_open: "გვერდი გაიხსნა",
  page_leave: "გვერდი დაიხურა",
  section_view: "სექცია ნანახი",
  scroll_25: "სქროლი 25%",
  scroll_50: "სქროლი 50%",
  scroll_75: "სქროლი 75%",
  scroll_100: "სქროლი 100%",
  click_cta: "CTA კლიკი",
  click_phone: "ტელეფონის კლიკი",
  click_email: "ემეილის კლიკი",
  click_sitely_link: "Sitely ლინკის კლიკი",
  form_interaction_started: "ფორმის ინტერაქცია",
  form_submit: "ფორმა გაიგზავნა",
  active_time_10s: "აქტიური 10წმ",
  active_time_30s: "აქტიური 30წმ",
  active_time_60s: "აქტიური 1წთ",
  active_time_180s: "აქტიური 3წთ",
  active_time_300s: "აქტიური 5წთ",
  "3d_interaction": "3D ინტერაქცია",
};

const EVENT_ICONS: Record<string, string> = {
  page_open: "🟢",
  page_leave: "🔴",
  section_view: "👁",
  scroll_25: "📜",
  scroll_50: "📜",
  scroll_75: "📜",
  scroll_100: "📜",
  click_cta: "🖱",
  click_phone: "📞",
  click_email: "📧",
  click_sitely_link: "🔗",
  form_interaction_started: "📝",
  form_submit: "✅",
  active_time_10s: "⏱",
  active_time_30s: "⏱",
  active_time_60s: "⏱",
  active_time_180s: "⏱",
  active_time_300s: "⏱",
  "3d_interaction": "🎮",
};

function ScoreRing({ value, max, color }: { value: number; max: number; color: string }) {
  const pctVal = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  const circumference = 2 * Math.PI * 28;
  const offset = circumference - (pctVal / 100) * circumference;
  return (
    <div className={s.scoreRing}>
      <svg viewBox="0 0 64 64" className={s.scoreRingSvg}>
        <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
        <circle
          cx="32" cy="32" r="28" fill="none"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={s.scoreRingFill}
        />
      </svg>
      <span className={s.scoreRingValue}>{value}</span>
    </div>
  );
}

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pctVal = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className={s.progressBar}>
      <div
        className={s.progressFill}
        style={{ width: `${pctVal}%`, background: color }}
      />
    </div>
  );
}

/* ── Move Modal ──────────────────────────────────────────── */
const SECTIONS = [
  { value: "clients", label: "კლიენტები 1" },
  { value: "offers", label: "შეთავაზება 2" },
  { value: "marketing", label: "მარკეტინგი 3" },
];

function MoveModal({
  selectedDemoIds,
  onClose,
  onComplete,
}: {
  selectedDemoIds: string[];
  onClose: () => void;
  onComplete: () => void;
}) {
  const [step, setStep] = useState<"section" | "category">("section");
  const [section, setSection] = useState("");
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [isNew, setIsNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async (sec: string) => {
    try {
      const res = await fetch("/api/batches/sections");
      if (!res.ok) return;
      const json = await res.json();
      const sectionData = json.data?.[sec];
      setCategories(sectionData?.categories || []);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (section) fetchCategories(section);
  }, [section, fetchCategories]);

  const handleSectionSelect = (sec: string) => {
    setSection(sec);
    setStep("category");
  };

  const handleMove = async () => {
    const category = isNew ? newCategory.trim() : selectedCategory;
    if (!category) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/batches/move", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          demo_ids: selectedDemoIds,
          section,
          category,
        }),
      });
      if (!res.ok) {
        const json = await res.json();
        setError(json.error || "დაფიქსირდა შეცდომა");
        return;
      }
      onComplete();
    } catch {
      setError("დაფიქსირდა შეცდომა");
    } finally {
      setLoading(false);
    }
  };

  const categoryValue = isNew ? newCategory.trim() : selectedCategory;

  return (
    <div className={s.modalOverlay} onClick={onClose}>
      <div className={s.modal} onClick={(e) => e.stopPropagation()}>
        <div className={s.modalHeader}>
          <h3 className={s.modalTitle}>
            კომპანიების გადატანა ({selectedDemoIds.length})
          </h3>
          <button className={s.modalClose} onClick={onClose}>✕</button>
        </div>

        {step === "section" && (
          <div className={s.modalBody}>
            <p className={s.modalLabel}>აირჩიე სექცია</p>
            <div className={s.sectionList}>
              {SECTIONS.map((sec) => (
                <button
                  key={sec.value}
                  className={s.sectionOption}
                  onClick={() => handleSectionSelect(sec.value)}
                >
                  {sec.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === "category" && (
          <div className={s.modalBody}>
            <button
              className={s.modalBack}
              onClick={() => { setStep("section"); setSection(""); }}
            >
              ← უკან
            </button>
            <p className={s.modalLabel}>
              {SECTIONS.find((x) => x.value === section)?.label} — აირჩიე კატეგორია
            </p>

            {categories.length > 0 && !isNew && (
              <div className={s.categoryList}>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    className={`${s.categoryOption} ${selectedCategory === cat.name ? s.categoryActive : ""}`}
                    onClick={() => setSelectedCategory(cat.name)}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            )}

            <div className={s.newCategoryWrap}>
              {!isNew ? (
                <button
                  className={s.newCategoryBtn}
                  onClick={() => { setIsNew(true); setSelectedCategory(""); }}
                >
                  + ახალი კატეგორია
                </button>
              ) : (
                <>
                  <input
                    className={s.newCategoryInput}
                    placeholder="კატეგორიის სახელი..."
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    autoFocus
                  />
                  {categories.length > 0 && (
                    <button
                      className={s.backToCats}
                      onClick={() => { setIsNew(false); setNewCategory(""); }}
                    >
                      არსებულიდან არჩევა
                    </button>
                  )}
                </>
              )}
            </div>

            {error && <p className={s.modalError}>{error}</p>}

            <div className={s.modalActions}>
              <button className={s.cancelBtn} onClick={onClose}>
                გაუქმება
              </button>
              <button
                className={s.confirmBtn}
                onClick={handleMove}
                disabled={loading || !categoryValue}
              >
                {loading ? "გადატანა..." : "გადატანა"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CompanyExpandPanel({ company: c }: { company: BatchCompany }) {
  const events = c.events || [];
  const acceptedProposals = (c.proposals || []).filter((p) => p.status === "accepted");
  const previousSends = c.previous_sends || [];
  const [eventsOpen, setEventsOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [proposalsOpen, setProposalsOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  return (
    <div className={s.expandPanel}>
      {/* Top row: score rings + key metrics */}
      <div className={s.expandTopRow}>
        {/* Score rings */}
        <div className={s.expandScores}>
          <div className={s.scoreCard}>
            <ScoreRing value={c.momentum_score} max={100} color="#4f6ef7" />
            <span className={s.scoreCardLabel}>მომენტუმ სკორი</span>
          </div>
          <div className={s.scoreCard}>
            <ScoreRing value={c.alltime_score} max={200} color="#8b5cf6" />
            <span className={s.scoreCardLabel}>საერთო სკორი</span>
          </div>
        </div>

        {/* Key metrics */}
        <div className={s.expandMetrics}>
          <div className={s.metricRow}>
            <span className={s.metricLabel}>სულ სესიები</span>
            <span className={s.metricValue}>{c.total_sessions}</span>
          </div>
          <div className={s.metricRow}>
            <span className={s.metricLabel}>აქტიური დრო (სულ)</span>
            <span className={s.metricValue}>{fmtDuration(c.total_active_s)}</span>
          </div>
          <div className={s.metricRow}>
            <span className={s.metricLabel}>გვ. ნახვები</span>
            <span className={s.metricValue}>{c.view_count}</span>
          </div>
          <div className={s.metricRow}>
            <span className={s.metricLabel}>ყველაზე ნანახი სექცია</span>
            <span className={s.metricValue}>{c.top_section || "—"}</span>
          </div>
        </div>

        {/* Engagement bars */}
        <div className={s.expandBars}>
          <div className={s.barRow}>
            <span className={s.barLabel}>მაქს. სქროლი</span>
            <ProgressBar value={c.max_scroll} max={100} color="#4f6ef7" />
            <span className={s.barValue}>{c.max_scroll}%</span>
          </div>
          <div className={s.barRow}>
            <span className={s.barLabel}>CTA კლიკი</span>
            <ProgressBar value={c.cta_clicks} max={5} color="#f59e0b" />
            <span className={s.barValue}>{c.cta_clicks}</span>
          </div>
          <div className={s.barRow}>
            <span className={s.barLabel}>ფორმა გაგზავნა</span>
            <ProgressBar value={c.form_submits} max={1} color="#06d6a0" />
            <span className={s.barValue}>{c.form_submits}</span>
          </div>
          <div className={s.barRow}>
            <span className={s.barLabel}>ეწვია საიტს</span>
            <ProgressBar value={c.visited_main_site ? 1 : 0} max={1} color="#8b5cf6" />
            <span className={s.barValue}>{c.visited_main_site ? "კი" : "არა"}</span>
          </div>
        </div>
      </div>

      {/* ── Collapsible: Company Info ── */}
      <div className={s.accordion}>
        <button
          className={`${s.accordionHeader} ${infoOpen ? s.accordionOpen : ""}`}
          onClick={() => setInfoOpen((p) => !p)}
        >
          <span className={s.accordionArrow}>{infoOpen ? "▾" : "▸"}</span>
          <span className={s.accordionTitle}>კომპანიის ინფორმაცია</span>
        </button>
        {infoOpen && (
          <div className={s.accordionBody}>
            <div className={s.infoSections}>
              {/* Contact & Basic Info */}
              <div className={s.infoCard}>
                <h5 className={s.infoCardTitle}>საკონტაქტო / ძირითადი</h5>
                <div className={s.infoCardBody}>
                  <div className={s.infoRow}>
                    <span className={s.infoLabel}>სახელი</span>
                    <span className={s.infoValue}>{c.name}</span>
                  </div>
                  <div className={s.infoRow}>
                    <span className={s.infoLabel}>კატეგორია</span>
                    <span className={s.infoValue}>{c.category || "—"}</span>
                  </div>
                  {c.categories && (Array.isArray(c.categories) ? c.categories : [c.categories]).length > 0 && (
                    <div className={s.infoRow}>
                      <span className={s.infoLabel}>კატეგორიები</span>
                      <span className={s.infoValue}>{Array.isArray(c.categories) ? c.categories.join(", ") : c.categories}</span>
                    </div>
                  )}
                  {c.source_category && (
                    <div className={s.infoRow}>
                      <span className={s.infoLabel}>წყაროს კატეგორია</span>
                      <span className={s.infoValue}>{c.source_category}</span>
                    </div>
                  )}
                  {c.email && (
                    <div className={s.infoRow}>
                      <span className={s.infoLabel}>ემეილი</span>
                      <span className={`${s.infoValue} ${s.infoLink}`}>{c.email}</span>
                    </div>
                  )}
                  {c.phone && (
                    <div className={s.infoRow}>
                      <span className={s.infoLabel}>ტელეფონი</span>
                      <span className={`${s.infoValue} ${s.infoLink}`}>{c.phone}</span>
                    </div>
                  )}
                  {c.website && (
                    <div className={s.infoRow}>
                      <span className={s.infoLabel}>ვებსაიტი</span>
                      <a href={c.website} target="_blank" rel="noopener noreferrer" className={`${s.infoValue} ${s.infoLink}`}>{c.website}</a>
                    </div>
                  )}
                  {c.address && (
                    <div className={s.infoRow}>
                      <span className={s.infoLabel}>მისამართი</span>
                      <span className={s.infoValue}>{c.address}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Rating & Tier */}
              <div className={s.infoCard}>
                <h5 className={s.infoCardTitle}>რეიტინგი / პრიორიტეტი</h5>
                <div className={s.infoCardBody}>
                  <div className={s.infoRow}>
                    <span className={s.infoLabel}>რეიტინგი</span>
                    <span className={s.infoValue}>
                      {c.rating != null ? `⭐ ${c.rating}` : "—"}
                      {c.reviews_count != null && c.reviews_count > 0 ? ` (${c.reviews_count} შეფასება)` : ""}
                    </span>
                  </div>
                  {c.tier && (
                    <div className={s.infoRow}>
                      <span className={s.infoLabel}>ტიერი</span>
                      <span className={s.infoValue}>{c.tier_label || c.tier}</span>
                    </div>
                  )}
                  {c.priority_score != null && (
                    <div className={s.infoRow}>
                      <span className={s.infoLabel}>პრიორიტეტის ქულა</span>
                      <span className={s.infoValue}>{c.priority_score}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Status */}
              <div className={s.infoCard}>
                <h5 className={s.infoCardTitle}>სტატუსი</h5>
                <div className={s.infoCardBody}>
                  <div className={s.infoRow}>
                    <span className={s.infoLabel}>გაყიდვების სტატუსი</span>
                    <span className={`${s.salesBadge} ${s[`sales_${c.sales_status}`] || ""}`}>
                      {c.sales_status}
                    </span>
                  </div>
                  {c.company_status && (
                    <div className={s.infoRow}>
                      <span className={s.infoLabel}>კომპანიის სტატუსი</span>
                      <span className={s.infoValue}>{c.company_status}</span>
                    </div>
                  )}
                  <div className={s.infoRow}>
                    <span className={s.infoLabel}>ფავორიტი</span>
                    <span className={s.infoValue}>{c.is_favorite ? "⭐" : "—"}</span>
                  </div>
                  <div className={s.infoRow}>
                    <span className={s.infoLabel}>კაბინეტი/პორტალი</span>
                    <span className={s.infoValue}>
                      {c.portal_accessed
                        ? <span className={s.infoDot} data-active="true" />
                        : <span className={s.infoDot} />}
                      {c.portal_accessed ? "შესულია" : "არ შესულა"}
                    </span>
                  </div>
                  <div className={s.infoRow}>
                    <span className={s.infoLabel}>დემო სტატუსი</span>
                    <span className={s.infoValue}>{c.demo_status}</span>
                  </div>
                </div>
              </div>

              {/* Dates */}
              <div className={s.infoCard}>
                <h5 className={s.infoCardTitle}>თარიღები</h5>
                <div className={s.infoCardBody}>
                  {c.company_created_at && (
                    <div className={s.infoRow}>
                      <span className={s.infoLabel}>კომპანია შექმნილია</span>
                      <span className={s.infoValue}>{fmtDate(c.company_created_at)}</span>
                    </div>
                  )}
                  <div className={s.infoRow}>
                    <span className={s.infoLabel}>პირველი ნახვა</span>
                    <span className={s.infoValue}>{fmtDate(c.first_viewed_at)}</span>
                  </div>
                  <div className={s.infoRow}>
                    <span className={s.infoLabel}>ბოლო ნახვა</span>
                    <span className={s.infoValue}>{fmtDate(c.last_viewed_at)}</span>
                  </div>
                  <div className={s.infoRow}>
                    <span className={s.infoLabel}>ბოლო აქტივობა</span>
                    <span className={s.infoValue}>{fmtDate(c.last_activity)}</span>
                  </div>
                </div>
              </div>

              {/* IDs */}
              <div className={s.infoCard}>
                <h5 className={s.infoCardTitle}>იდენტიფიკატორები</h5>
                <div className={s.infoCardBody}>
                  <div className={s.infoRow}>
                    <span className={s.infoLabel}>კომპანიის ID</span>
                    <code className={s.infoCode}>{c.company_id}</code>
                  </div>
                  <div className={s.infoRow}>
                    <span className={s.infoLabel}>დემოს ID</span>
                    <code className={s.infoCode}>{c.demo_id}</code>
                  </div>
                  <div className={s.infoRow}>
                    <span className={s.infoLabel}>დემოს ჰეში</span>
                    <code className={s.infoCode}>{c.demo_hash}</code>
                  </div>
                  {c.yell_id && (
                    <div className={s.infoRow}>
                      <span className={s.infoLabel}>Yell ID</span>
                      <code className={s.infoCode}>{c.yell_id}</code>
                    </div>
                  )}
                  {c.gm_place_id && (
                    <div className={s.infoRow}>
                      <span className={s.infoLabel}>Google Place ID</span>
                      <code className={s.infoCode}>{c.gm_place_id}</code>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Collapsible: Accepted Proposals ── */}
      {acceptedProposals.length > 0 && (
        <div className={s.accordion}>
          <button
            className={`${s.accordionHeader} ${proposalsOpen ? s.accordionOpen : ""}`}
            onClick={() => setProposalsOpen((p) => !p)}
          >
            <span className={s.accordionArrow}>{proposalsOpen ? "▾" : "▸"}</span>
            <span className={s.accordionTitle}>შეთავაზებები</span>
            <span className={s.timelineCount}>{acceptedProposals.length}</span>
          </button>
          {proposalsOpen && (
            <div className={s.accordionBody}>
              <div className={s.proposalList}>
                {acceptedProposals.map((p, i) => (
                  <div key={i} className={s.proposalCard}>
                    <div className={s.proposalHeader}>
                      <h5 className={s.proposalTitle}>{p.title}</h5>
                      <div className={s.proposalPrice}>
                        {p.price.toLocaleString()} {p.currency}
                      </div>
                    </div>

                    <div className={s.proposalMeta}>
                      <div className={s.proposalMetaItem}>
                        <span className={s.proposalMetaLabel}>სტატუსი</span>
                        <span className={`${s.proposalBadge} ${s.proposalAccepted}`}>დადასტურებული</span>
                      </div>
                      {p.payment_method && (
                        <div className={s.proposalMetaItem}>
                          <span className={s.proposalMetaLabel}>გადახდის მეთოდი</span>
                          <span className={s.proposalMetaValue}>{p.payment_method}</span>
                        </div>
                      )}
                      {p.paid_at && (
                        <div className={s.proposalMetaItem}>
                          <span className={s.proposalMetaLabel}>გადახდის თარიღი</span>
                          <span className={s.proposalMetaValue}>{fmtDate(p.paid_at)}</span>
                        </div>
                      )}
                      <div className={s.proposalMetaItem}>
                        <span className={s.proposalMetaLabel}>გაგზავნის თარიღი</span>
                        <span className={s.proposalMetaValue}>{fmtDate(p.created_at)}</span>
                      </div>
                      {p.expires_at && (
                        <div className={s.proposalMetaItem}>
                          <span className={s.proposalMetaLabel}>ვადა</span>
                          <span className={s.proposalMetaValue}>{fmtDate(p.expires_at)}</span>
                        </div>
                      )}
                    </div>

                    {p.included.length > 0 && (
                      <div className={s.proposalFeatures}>
                        <span className={s.proposalFeatLabel}>შეიცავს</span>
                        <ul className={s.proposalFeatList}>
                          {p.included.map((item, j) => (
                            <li key={j} className={s.proposalIncluded}>
                              <span className={s.proposalCheck}>✓</span> {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {p.excluded.length > 0 && (
                      <div className={s.proposalFeatures}>
                        <span className={s.proposalFeatLabel}>არ შეიცავს</span>
                        <ul className={s.proposalFeatList}>
                          {p.excluded.map((item, j) => (
                            <li key={j} className={s.proposalExcluded}>
                              <span className={s.proposalCross}>✕</span> {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {p.notes && (
                      <div className={s.proposalNotes}>
                        <span className={s.proposalFeatLabel}>შენიშვნა</span>
                        <p className={s.proposalNotesText}>{p.notes}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Collapsible: Previous Sends (History) ── */}
      {previousSends.length > 0 && (
        <div className={s.accordion}>
          <button
            className={`${s.accordionHeader} ${historyOpen ? s.accordionOpen : ""}`}
            onClick={() => setHistoryOpen((p) => !p)}
          >
            <span className={s.accordionArrow}>{historyOpen ? "▾" : "▸"}</span>
            <span className={s.accordionTitle}>წინა გაგზავნები</span>
            <span className={s.timelineCount}>{previousSends.length}</span>
          </button>
          {historyOpen && (
            <div className={s.accordionBody}>
              <div className={s.prevSendsList}>
                {previousSends.map((ps) => (
                  <div key={ps.demo_id} className={s.prevSendItem}>
                    <div className={s.prevSendTop}>
                      <span className={s.prevSendTemplate}>{ps.template_name || "შაბლონი"}</span>
                      <span className={s.prevSendDate}>{fmtDate(ps.created_at)}</span>
                    </div>
                    <div className={s.prevSendMeta}>
                      {ps.batch_name && (
                        <span className={s.prevSendBatch}>
                          {ps.batch_section ? `${SECTION_LABELS[ps.batch_section] || ps.batch_section} / ` : ""}
                          {ps.batch_name}
                        </span>
                      )}
                      <span className={`${s.prevSendStatus} ${ps.view_count > 0 ? s.prevSendViewed : ""}`}>
                        {ps.view_count > 0 ? `👁 ${ps.view_count} ნახვა` : "არ ნანახი"}
                      </span>
                      <a
                        href={`/demo/${ps.demo_hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={s.prevSendLink}
                        onClick={(e) => e.stopPropagation()}
                      >
                        ნახვა →
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Collapsible: Events ── */}
      {events.length > 0 && (
        <div className={s.accordion}>
          <button
            className={`${s.accordionHeader} ${eventsOpen ? s.accordionOpen : ""}`}
            onClick={() => setEventsOpen((p) => !p)}
          >
            <span className={s.accordionArrow}>{eventsOpen ? "▾" : "▸"}</span>
            <span className={s.accordionTitle}>მოვლენები</span>
            <span className={s.timelineCount}>{events.length}</span>
          </button>
          {eventsOpen && (
            <div className={s.accordionBody}>
              <div className={s.timelineList}>
                {events.map((ev, i) => (
                  <EventRow key={i} event={ev} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Event Row ──────────────────────────────────────────── */
function EventRow({ event: ev }: { event: CompanyEvent }) {
  const label = EVENT_LABELS[ev.event_type] || ev.event_type;
  const icon = EVENT_ICONS[ev.event_type] || "•";
  const extra = ev.extra as Record<string, unknown> | null;

  let detail = "";
  if (ev.event_type === "page_leave" && ev.duration_ms) {
    detail = `${fmtDuration(Math.round(ev.duration_ms / 1000))}`;
  }
  if (ev.event_type === "section_view" && extra?.section_id) {
    detail = String(extra.section_id);
  }

  return (
    <div className={s.timelineItem}>
      <span className={s.timelineIcon}>{icon}</span>
      <span className={s.timelineLabel}>{label}</span>
      {detail && <span className={s.timelineDetail}>{detail}</span>}
      <span className={s.timelineTime}>
        {fmtDate(ev.created_at)}
      </span>
    </div>
  );
}

"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

/* ── Types ─────────────────────────────────────────────────── */
export interface BatchInfo {
  id: string;
  name: string;
  description: string | null;
  status: "active" | "completed" | "archived";
  template_id: string | null;
  template_name: string | null;
  section: string | null;
  created_at: string;
  updated_at: string;
}

export interface BatchSummary {
  total_demos: number;
  total_sent: number;
  viewed_count: number;
  avg_session_s: number | null;
  avg_scroll_depth: number | null;
}

export interface BatchFunnel {
  sent: number;
  viewed: number;
  scrolled_50: number;
  cta_clicked: number;
  form_submitted: number;
}

export interface CompanyEvent {
  event_type: string;
  scroll_depth: number | null;
  duration_ms: number | null;
  session_id: string | null;
  extra: Record<string, unknown> | null;
  created_at: string;
}

export interface ProposalInfo {
  status: string;
  title: string;
  price: number;
  currency: string;
  included: string[];
  excluded: string[];
  notes: string | null;
  payment_method: string | null;
  paid_at: string | null;
  expires_at: string | null;
  created_at: string;
}

export interface PreviousSend {
  demo_id: string;
  demo_hash: string;
  batch_id: string | null;
  batch_name: string | null;
  batch_section: string | null;
  template_name: string | null;
  demo_status: string;
  view_count: number;
  created_at: string;
}

export interface BatchCompany {
  company_id: string;
  name: string;
  category: string | null;
  categories: string[] | null;
  source_category: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  address: string | null;
  rating: number | null;
  reviews_count: number | null;
  tier: string | null;
  tier_label: string | null;
  priority_score: number | null;
  company_status: string | null;
  sales_status: string;
  is_favorite: boolean;
  yell_id: string | null;
  gm_place_id: string | null;
  company_created_at: string | null;
  demo_id: string;
  demo_hash: string;
  demo_status: string;
  view_count: number;
  first_viewed_at: string | null;
  last_viewed_at: string | null;
  momentum_score: number;
  alltime_score: number;
  total_sessions: number;
  total_active_s: number;
  last_activity: string | null;
  visited_main_site: boolean;
  top_section: string | null;
  cta_clicks: number;
  form_submits: number;
  max_scroll: number;
  avg_session_s: number | null;
  portal_accessed: boolean;
  proposal_status: string | null;
  proposals: ProposalInfo[];
  events: CompanyEvent[];
  send_count: number;
  previous_sends: PreviousSend[];
}

export type SortKey =
  | "name"
  | "momentum_score"
  | "view_count"
  | "total_active_s"
  | "max_scroll"
  | "cta_clicks"
  | "last_activity"
  | "portal_accessed"
  | "sales_status"
  | "proposal_status";

export type CompanyFilter = "all" | "not_viewed" | "viewed" | "engaged" | "converted";

interface BatchDetailState {
  batch: BatchInfo | null;
  summary: BatchSummary | null;
  funnel: BatchFunnel | null;
  companies: BatchCompany[];
  filteredCompanies: BatchCompany[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
  /* filters */
  filter: CompanyFilter;
  setFilter: (f: CompanyFilter) => void;
  sortKey: SortKey;
  setSortKey: (k: SortKey) => void;
  sortAsc: boolean;
  toggleSortDir: () => void;
  search: string;
  setSearch: (q: string) => void;
}

const Ctx = createContext<BatchDetailState | null>(null);

export function useBatchDetail() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useBatchDetail must be used inside BatchDetailProvider");
  return ctx;
}

/* ── Provider ──────────────────────────────────────────────── */
export default function BatchDetailProvider({
  batchId,
  children,
}: {
  batchId: string;
  children: React.ReactNode;
}) {
  const [batch, setBatch] = useState<BatchInfo | null>(null);
  const [summary, setSummary] = useState<BatchSummary | null>(null);
  const [funnel, setFunnel] = useState<BatchFunnel | null>(null);
  const [companies, setCompanies] = useState<BatchCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filter, setFilter] = useState<CompanyFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("momentum_score");
  const [sortAsc, setSortAsc] = useState(false);
  const [search, setSearch] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/batches/${batchId}`);
      if (!res.ok) throw new Error("Failed to load batch");
      const json = await res.json();
      const d = json.data;
      setBatch(d.batch);
      setSummary(d.summary);
      setFunnel(d.funnel);
      setCompanies(d.companies || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [batchId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredCompanies = useMemo(() => {
    let list = companies;

    // filter
    if (filter === "not_viewed") list = list.filter((c) => c.view_count === 0);
    else if (filter === "viewed") list = list.filter((c) => c.view_count > 0);
    else if (filter === "engaged") list = list.filter((c) => c.momentum_score >= 10);
    else if (filter === "converted") list = list.filter((c) => c.form_submits > 0);

    // search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.category && c.category.toLowerCase().includes(q))
      );
    }

    // sort
    const dir = sortAsc ? 1 : -1;
    list = [...list].sort((a, b) => {
      if (sortKey === "name") return a.name.localeCompare(b.name) * dir;
      if (sortKey === "last_activity") {
        const at = a.last_activity ? new Date(a.last_activity).getTime() : 0;
        const bt = b.last_activity ? new Date(b.last_activity).getTime() : 0;
        return (at - bt) * dir;
      }
      if (sortKey === "portal_accessed") {
        return ((a.portal_accessed ? 1 : 0) - (b.portal_accessed ? 1 : 0)) * dir;
      }
      if (sortKey === "sales_status") {
        return a.sales_status.localeCompare(b.sales_status) * dir;
      }
      if (sortKey === "proposal_status") {
        const order: Record<string, number> = { accepted: 3, pending: 2, rejected: 1, expired: 0 };
        const av = order[a.proposal_status || ""] ?? -1;
        const bv = order[b.proposal_status || ""] ?? -1;
        return (av - bv) * dir;
      }
      return ((a[sortKey] ?? 0) - (b[sortKey] ?? 0)) * dir;
    });

    return list;
  }, [companies, filter, search, sortKey, sortAsc]);

  const toggleSortDir = useCallback(() => setSortAsc((p) => !p), []);

  return (
    <Ctx.Provider
      value={{
        batch,
        summary,
        funnel,
        companies,
        filteredCompanies,
        loading,
        error,
        refresh: fetchData,
        filter,
        setFilter,
        sortKey,
        setSortKey,
        sortAsc,
        toggleSortDir,
        search,
        setSearch,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

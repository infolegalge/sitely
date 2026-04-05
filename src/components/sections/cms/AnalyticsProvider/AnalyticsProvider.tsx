"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react";

/* ── Types ── */

export interface LeadCompany {
  company_id: string;
  name: string;
  category: string | null;
  tier: number | null;
  email: string | null;
  phone: string | null;
  sales_status: string;
  is_favorite: boolean;
  momentum_score: number;
  alltime_score: number;
  last_activity: string | null;
  total_sessions: number;
  total_active_s: number;
  visited_main_site: boolean;
  top_section: string | null;
}

export interface FunnelData {
  sent: number;
  viewed: number;
  scrolled: number;
  cta: number;
  converted: number;
}

export interface KpiData {
  totalViews: number;
  activeLeads: number;
  avgSessionSeconds: number;
  totalSessions: number;
  bounceRate: number;
}

export interface DailyStats {
  date: string;
  page_open: number;
  page_leave: number;
  scrolls: number;
  scroll_complete: number;
  clicks: number;
  cta_clicks: number;
  form_submit: number;
  section_view: number;
  interaction_3d: number;
  unique_sessions: number;
  total: number;
}

export interface HeatmapCell {
  day: number;
  hour: number;
  count: number;
}

export interface JourneyEvent {
  event_type: string;
  section_name: string | null;
  is_main_site: boolean;
  interaction_type: string | null;
  page_url: string | null;
  user_agent: string | null;
  session_id: string | null;
  duration_ms: number | null;
  scroll_depth: number | null;
  extra: Record<string, unknown> | null;
  created_at: string;
}

export interface LeadNote {
  id: string;
  body: string;
  author: string;
  created_at: string;
}

export interface GeoEntry {
  country: string;
  sessions: number;
  events: number;
}

export interface DeviceEntry {
  device_type: string;
  sessions: number;
  events: number;
}

export interface UtmEntry {
  source: string;
  medium: string;
  campaign: string;
  sessions: number;
  events: number;
}

export interface ReferrerEntry {
  source: string;
  sessions: number;
  events: number;
}

export interface SectionEntry {
  section_name: string;
  views: number;
  unique_sessions: number;
  avg_duration_s: number;
}

export interface BrowserEntry {
  name: string;
  sessions: number;
}

export interface OsEntry {
  name: string;
  sessions: number;
}

export interface WebVitalEntry {
  metric: string;
  samples: number;
  avg_value: number;
  p50: number;
  p75: number;
  p95: number;
  p99: number;
  min_value: number;
  max_value: number;
  unit: string;
}

export interface ActiveVisitorsData {
  active_sessions: number;
  active_demos: number;
}

export interface ConversionTrendDay {
  day: string;
  sessions: number;
  viewed: number;
  scrolled: number;
  clicked_cta: number;
  started_form: number;
  submitted: number;
}

export interface TemplatePerf {
  template_id: string;
  template_name: string;
  demos_sent: number;
  demos_viewed: number;
  total_sessions: number;
  page_opens: number;
  cta_clicks: number;
  form_submits: number;
  full_scrolls: number;
  avg_session_s: number | null;
  conversion_rate: number;
}

export interface CampaignComparisonEntry {
  source: string;
  medium: string;
  campaign: string;
  sessions: number;
  scroll_complete: number;
  cta_clicks: number;
  form_submits: number;
  avg_session_s: number | null;
  conversion_rate: number;
}

export interface SessionPercentilesData {
  total_sessions: number;
  avg_s: number;
  p10_s: number;
  p25_s: number;
  p50_s: number;
  p75_s: number;
  p90_s: number;
  p95_s: number;
  p99_s: number;
  min_s: number;
  max_s: number;
  buckets: { bucket_start: number; label: string; count: number }[];
}

export interface ScrollDepthData {
  total_sessions: number;
  avg_depth: number;
  p50_depth: number;
  p75_depth: number;
  p90_depth: number;
  full_scroll_pct: number;
  buckets: { range_start: number; label: string; count: number }[];
}

export interface FunnelAbandonment {
  total_sessions: number;
  saw_page: number;
  scrolled_any: number;
  scrolled_full: number;
  clicked_cta: number;
  started_form: number;
  submitted_form: number;
  abandoned_form: number;
  avg_session_ms: number;
  dropoff: {
    page_to_scroll: number;
    scroll_to_cta: number;
    cta_to_form: number;
    form_to_submit: number;
    form_abandon_rate: number;
  };
}

type BehaviorType = "momentum" | "time" | "scroll" | "cross_domain";

interface DateRangeState {
  from: string | null;
  to: string | null;
  preset: number;
}

interface AnalyticsState {
  /* Data */
  funnel: FunnelData | null;
  eventCounts: Record<string, number>;
  kpi: KpiData | null;
  kpiPrev: KpiData | null;
  timeSeries: DailyStats[];
  heatmap: HeatmapCell[];
  leaders: Record<BehaviorType, LeadCompany[]>;
  allLeads: LeadCompany[];

  /* New analytics panels */
  geo: GeoEntry[];
  devices: DeviceEntry[];
  utm: UtmEntry[];
  referrers: ReferrerEntry[];
  topSections: SectionEntry[];
  funnelAbandonment: FunnelAbandonment | null;
  browsers: BrowserEntry[];
  os: OsEntry[];
  webVitals: WebVitalEntry[];
  activeVisitors: ActiveVisitorsData;
  conversionTrends: ConversionTrendDay[];
  templatePerformance: TemplatePerf[];
  campaignComparison: CampaignComparisonEntry[];
  sessionPercentiles: SessionPercentilesData | null;
  scrollDepth: ScrollDepthData | null;

  /* Comparison */
  showComparison: boolean;
  funnelPrev: FunnelData | null;
  timeSeriesPrev: DailyStats[];

  /* UI */
  loading: boolean;
  wave2Loading: boolean;
  error: string | null;
  dateRange: DateRangeState;
  autoRefresh: boolean;
  tierFilter: number | null;
  statusFilter: string;
  favoritesOnly: boolean;

  /* Journey */
  selectedCompanyId: string | null;
  journey: JourneyEvent[];
  notes: LeadNote[];
  journeyLoading: boolean;

  /* Actions */
  setDateRange: (presetDays: number) => void;
  setCustomDateRange: (from: string, to: string) => void;
  setAutoRefresh: (v: boolean) => void;
  setShowComparison: (v: boolean) => void;
  setTierFilter: (tier: number | null) => void;
  setStatusFilter: (status: string) => void;
  setFavoritesOnly: (v: boolean) => void;
  selectCompany: (id: string | null) => void;
  toggleFavorite: (companyId: string) => Promise<void>;
  updateSalesStatus: (companyId: string, status: string, followup?: string) => Promise<void>;
  addNote: (companyId: string, body: string) => Promise<void>;
  refresh: () => void;
}

const AnalyticsContext = createContext<AnalyticsState | null>(null);

export function useAnalytics() {
  const ctx = useContext(AnalyticsContext);
  if (!ctx) throw new Error("useAnalytics must be inside AnalyticsProvider");
  return ctx;
}

const BEHAVIORS: BehaviorType[] = ["momentum", "time", "scroll", "cross_domain"];
const POLL_MS = 30_000;

function computeDateRange(presetDays: number): { from: string | null; to: string | null } {
  if (presetDays === 0) return { from: null, to: null };
  const to = new Date();
  const from = new Date(to.getTime() - presetDays * 86_400_000);
  return { from: from.toISOString(), to: to.toISOString() };
}

export default function AnalyticsProvider({ children }: { children: ReactNode }) {
  /* ── Data state ── */
  const [funnel, setFunnel] = useState<FunnelData | null>(null);
  const [eventCounts, setEventCounts] = useState<Record<string, number>>({});
  const [kpi, setKpi] = useState<KpiData | null>(null);
  const [kpiPrev, setKpiPrev] = useState<KpiData | null>(null);
  const [timeSeries, setTimeSeries] = useState<DailyStats[]>([]);
  const [heatmap, setHeatmap] = useState<HeatmapCell[]>([]);
  const [leaders, setLeaders] = useState<Record<BehaviorType, LeadCompany[]>>({
    momentum: [],
    time: [],
    scroll: [],
    cross_domain: [],
  });
  const [allLeads, setAllLeads] = useState<LeadCompany[]>([]);

  /* ── New analytics panels ── */
  const [geo, setGeo] = useState<GeoEntry[]>([]);
  const [devices, setDevices] = useState<DeviceEntry[]>([]);
  const [utm, setUtm] = useState<UtmEntry[]>([]);
  const [referrers, setReferrers] = useState<ReferrerEntry[]>([]);
  const [topSections, setTopSections] = useState<SectionEntry[]>([]);
  const [funnelAbandonment, setFunnelAbandonment] = useState<FunnelAbandonment | null>(null);

  /* ── Browser/OS state ── */
  const [browsers, setBrowsers] = useState<BrowserEntry[]>([]);
  const [os, setOs] = useState<OsEntry[]>([]);

  /* ── Web Vitals + Active Visitors ── */
  const [webVitals, setWebVitals] = useState<WebVitalEntry[]>([]);
  const [activeVisitors, setActiveVisitors] = useState<ActiveVisitorsData>({
    active_sessions: 0,
    active_demos: 0,
  });
  const [conversionTrends, setConversionTrends] = useState<ConversionTrendDay[]>([]);
  const [templatePerformance, setTemplatePerformance] = useState<TemplatePerf[]>([]);
  const [campaignComparison, setCampaignComparison] = useState<CampaignComparisonEntry[]>([]);
  const [sessionPercentiles, setSessionPercentiles] = useState<SessionPercentilesData | null>(null);
  const [scrollDepth, setScrollDepth] = useState<ScrollDepthData | null>(null);

  /* ── Comparison state ── */
  const [showComparison, setShowComparison] = useState(false);
  const [funnelPrev, setFunnelPrev] = useState<FunnelData | null>(null);
  const [timeSeriesPrev, setTimeSeriesPrev] = useState<DailyStats[]>([]);

  /* ── UI state ── */
  const [loading, setLoading] = useState(true);
  const [wave2Loading, setWave2Loading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRangeState] = useState<DateRangeState>({
    ...computeDateRange(30),
    preset: 30,
  });
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [tierFilter, setTierFilter] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [favoritesOnly, setFavoritesOnly] = useState(false);

  /* ── Journey ── */
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [journey, setJourney] = useState<JourneyEvent[]>([]);
  const [notes, setNotes] = useState<LeadNote[]>([]);
  const [journeyLoading, setJourneyLoading] = useState(false);

  const setDateRange = useCallback((presetDays: number) => {
    const range = computeDateRange(presetDays);
    setDateRangeState({ ...range, preset: presetDays });
  }, []);

  const setCustomDateRange = useCallback((from: string, to: string) => {
    setDateRangeState({ from, to, preset: -1 });
  }, []);

  /* ── Abort controller for request cancellation ── */
  const abortRef = useRef<AbortController | null>(null);
  const journeyAbortRef = useRef<AbortController | null>(null);

  /* ── Main fetch ── */
  const fetchAll = useCallback(() => {
    // Cancel in-flight requests
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const signal = controller.signal;

    setLoading(true);
    setWave2Loading(true);
    setError(null);

    const { from, to } = dateRange;
    const dateParams = new URLSearchParams();
    if (from) dateParams.set("from", from);
    if (to) dateParams.set("to", to);
    const dateQs = dateParams.toString() ? `?${dateParams}` : "";

    const tierParam = tierFilter ? `&tier=${tierFilter}` : "";

    /* Previous period for KPI trends */
    let prevQs = "";
    if (from && to) {
      const fromMs = new Date(from).getTime();
      const toMs = new Date(to).getTime();
      const diff = toMs - fromMs;
      const prevParams = new URLSearchParams();
      prevParams.set("from", new Date(fromMs - diff).toISOString());
      prevParams.set("to", from);
      prevQs = `?${prevParams}`;
    }

    /* Timeout helper: abort after 15s */
    const timeoutId = setTimeout(() => controller.abort(), 15_000);

    const safeFetch = (url: string) =>
      fetch(url, { signal }).then((r) => {
        if (!r.ok) throw new Error(`${r.status}`);
        return r.json();
      });

    /* ── Wave 1: Critical KPIs (show data ASAP) ── */
    const wave1 = Promise.allSettled([
      /* 0 */ safeFetch(`/api/analytics/overview${dateQs}`),
      /* 1 */ prevQs ? safeFetch(`/api/analytics/overview${prevQs}`) : Promise.resolve(null),
      /* 2 */ safeFetch(`/api/analytics/timeseries${dateQs}`),
      /* 3 */ safeFetch(`/api/analytics/leaders?behavior=momentum&limit=200${tierParam}${dateQs ? `&${dateParams}` : ""}`),
    ]);

    wave1.then((results) => {
      if (signal.aborted) return;

      const val = (i: number) =>
        results[i].status === "fulfilled" ? results[i].value : null;

      const overview = val(0);
      const prevOverview = val(1);
      const ts = val(2);

      if (overview?.funnel) setFunnel(overview.funnel);
      if (overview?.eventCounts) setEventCounts(overview.eventCounts);
      if (overview?.kpi) setKpi(overview.kpi);
      if (prevOverview?.kpi) setKpiPrev(prevOverview.kpi);
      else setKpiPrev(null);
      if (prevOverview?.funnel) setFunnelPrev(prevOverview.funnel);
      else setFunnelPrev(null);

      setTimeSeries(ts?.series ?? []);

      const allLeadsData = val(3);
      setAllLeads(allLeadsData?.leaders ?? []);

      // Show KPIs immediately (partial loading done)
      setLoading(false);
    });

    /* ── Wave 2: Secondary panels (charts, breakdowns, leaders) ── */
    const wave2 = Promise.allSettled([
      /* 0 */ safeFetch(`/api/analytics/heatmap${dateQs}`),
      /* 1-4 */ ...BEHAVIORS.map((b) =>
        safeFetch(`/api/analytics/leaders?behavior=${b}&limit=10${tierParam}${dateQs ? `&${dateParams}` : ""}`)
      ),
      /* 5 */ safeFetch(`/api/analytics/geo${dateQs}`),
      /* 6 */ safeFetch(`/api/analytics/devices${dateQs}`),
      /* 7 */ safeFetch(`/api/analytics/utm${dateQs}`),
      /* 8 */ safeFetch(`/api/analytics/referrers${dateQs}`),
      /* 9 */ safeFetch(`/api/analytics/sections${dateQs}`),
      /* 10 */ safeFetch(`/api/analytics/funnel${dateQs}`),
      /* 11 */ prevQs ? safeFetch(`/api/analytics/timeseries${prevQs}`) : Promise.resolve(null),
      /* 12 */ safeFetch(`/api/analytics/browsers${dateQs}`),
      /* 13 */ safeFetch(`/api/analytics/web-vitals${dateQs}`),
      /* 14 */ safeFetch(`/api/analytics/active-visitors`),
      /* 15 */ safeFetch(`/api/analytics/conversion-trends${dateQs}`),
      /* 16 */ safeFetch(`/api/analytics/template-performance${dateQs}`),
      /* 17 */ safeFetch(`/api/analytics/campaign-comparison${dateQs}`),
      /* 18 */ safeFetch(`/api/analytics/session-percentiles${dateQs}`),
      /* 19 */ safeFetch(`/api/analytics/scroll-depth${dateQs}`),
    ]);

    wave2.then((results) => {
      if (signal.aborted) return;

      const val = (i: number) =>
        results[i].status === "fulfilled" ? results[i].value : null;

      setHeatmap(val(0)?.heatmap ?? []);

      const newLeaders = {} as Record<BehaviorType, LeadCompany[]>;
      BEHAVIORS.forEach((b, i) => {
        const leaderData = val(1 + i);
        newLeaders[b] = leaderData?.leaders ?? [];
      });
      setLeaders(newLeaders);

      setGeo(val(5)?.geo ?? []);
      setDevices(val(6)?.devices ?? []);
      setUtm(val(7)?.utm ?? []);
      setReferrers(val(8)?.referrers ?? []);
      setTopSections(val(9)?.sections ?? []);
      setFunnelAbandonment(val(10)?.abandonment ?? null);
      setTimeSeriesPrev(val(11)?.series ?? []);

      const browserData = val(12);
      setBrowsers(browserData?.browsers ?? []);
      setOs(browserData?.os ?? []);

      setWebVitals(val(13)?.vitals ?? []);
      const activeData = val(14);
      if (activeData) setActiveVisitors(activeData);
      setConversionTrends(val(15)?.trends ?? []);
      setTemplatePerformance(val(16)?.templates ?? []);
      setCampaignComparison(val(17)?.campaigns ?? []);
      setSessionPercentiles(val(18) ?? null);
      setScrollDepth(val(19) ?? null);

      if (!signal.aborted) setWave2Loading(false);
    });

    Promise.all([wave1, wave2]).then(([w1Results, w2Results]) => {
      clearTimeout(timeoutId);
      if (signal.aborted) return;
      const totalFailed = [...w1Results, ...w2Results].filter((r) => r.status === "rejected").length;
      const totalRequests = w1Results.length + w2Results.length;
      setLoading(false);
      if (totalFailed > 0 && totalFailed < totalRequests) {
        setError(`ნაწილობრივი შეცდომა (${totalFailed}/${totalRequests})`);
      } else if (totalFailed > 0 && totalFailed === totalRequests) {
        setError("სერვერთან კავშირი ვერ მოხერხდა");
      } else {
        setError(null);
      }
    }).catch(() => {
      clearTimeout(timeoutId);
    });
  }, [dateRange, tierFilter]);

  useEffect(() => {
    fetchAll();
    return () => {
      abortRef.current?.abort();
    };
  }, [fetchAll]);

  /* ── Auto-refresh polling (pauses when tab hidden) ── */
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    function startPolling() {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(fetchAll, POLL_MS);
    }
    function stopPolling() {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    function handleVisibility() {
      if (!autoRefresh) return;
      if (document.hidden) stopPolling();
      else startPolling();
    }

    if (autoRefresh && !document.hidden) startPolling();
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      stopPolling();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [autoRefresh, fetchAll]);

  /* ── Journey drawer ── */
  const selectCompany = useCallback((id: string | null) => {
    // Cancel any in-flight journey request
    if (journeyAbortRef.current) journeyAbortRef.current.abort();

    setSelectedCompanyId(id);
    if (!id) {
      setJourney([]);
      setNotes([]);
      return;
    }
    setJourneyLoading(true);
    const jCtrl = new AbortController();
    journeyAbortRef.current = jCtrl;
    const jTimeout = setTimeout(() => jCtrl.abort(), 10_000);
    fetch(`/api/analytics/journey?company_id=${encodeURIComponent(id)}`, { signal: jCtrl.signal })
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status}`);
        return r.json();
      })
      .then((res) => {
        setJourney(res.journey ?? []);
        setNotes(res.notes ?? []);
      })
      .catch((err) => {
        if (err.name !== "AbortError") setError("Journey fetch failed");
      })
      .finally(() => {
        clearTimeout(jTimeout);
        setJourneyLoading(false);
      });
  }, []);

  /* ── Actions (with rollback on failure) ── */
  const toggleFavorite = useCallback(
    async (companyId: string) => {
      /* Snapshot via functional updater to avoid stale closure on rapid clicks */
      let prevLeads: LeadCompany[] = [];
      let prevLeaders: Record<BehaviorType, LeadCompany[]> = {} as Record<BehaviorType, LeadCompany[]>;
      setAllLeads((prev) => {
        prevLeads = prev;
        return prev.map((l) =>
          l.company_id === companyId ? { ...l, is_favorite: !l.is_favorite } : l
        );
      });
      setLeaders((prev) => {
        prevLeaders = prev;
        const next = { ...prev };
        for (const k of BEHAVIORS) {
          next[k] = prev[k].map((l) =>
            l.company_id === companyId ? { ...l, is_favorite: !l.is_favorite } : l
          );
        }
        return next;
      });

      try {
        const res = await fetch("/api/analytics/actions", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ company_id: companyId, action: "toggle_favorite" }),
        });
        if (!res.ok) throw new Error("toggle_favorite failed");
        const { is_favorite } = await res.json();
        /* Reconcile with server truth */
        setAllLeads((prev) =>
          prev.map((l) => (l.company_id === companyId ? { ...l, is_favorite } : l))
        );
        setLeaders((prev) => {
          const next = { ...prev };
          for (const k of BEHAVIORS) {
            next[k] = prev[k].map((l) =>
              l.company_id === companyId ? { ...l, is_favorite } : l
            );
          }
          return next;
        });
      } catch {
        /* Rollback on failure */
        setAllLeads(prevLeads);
        setLeaders(prevLeaders);
        setError("ფავორიტის ცვლილება ვერ მოხერხდა");
      }
    },
    []
  );

  const updateSalesStatus = useCallback(
    async (companyId: string, status: string, followup?: string) => {
      /* Snapshot via functional updater to avoid stale closure */
      let prevLeads: LeadCompany[] = [];
      setAllLeads((prev) => {
        prevLeads = prev;
        return prev.map((l) =>
          l.company_id === companyId ? { ...l, sales_status: status } : l
        );
      });

      try {
        const res = await fetch("/api/analytics/actions", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            company_id: companyId,
            action: "update_status",
            sales_status: status,
            next_followup_at: followup,
          }),
        });
        if (!res.ok) throw new Error("update_status failed");
      } catch {
        /* Rollback on failure */
        setAllLeads(prevLeads);
        setError("სტატუსის ცვლილება ვერ მოხერხდა");
      }
    },
    []
  );

  const addNote = useCallback(
    async (companyId: string, body: string) => {
      try {
        const res = await fetch("/api/analytics/notes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ company_id: companyId, body }),
        });
        if (!res.ok) throw new Error("addNote failed");
        const data = await res.json();
        if (data.note) {
          setNotes((prev) => [data.note, ...prev]);
        }
      } catch {
        setError("შენიშვნის დამატება ვერ მოხერხდა");
      }
    },
    []
  );

  return (
    <AnalyticsContext.Provider
      value={{
        funnel,
        eventCounts,
        kpi,
        kpiPrev,
        timeSeries,
        heatmap,
        leaders,
        allLeads,
        geo,
        devices,
        utm,
        referrers,
        topSections,
        funnelAbandonment,
        browsers,
        os,
        webVitals,
        activeVisitors,
        conversionTrends,
        templatePerformance,
        campaignComparison,
        sessionPercentiles,
        scrollDepth,
        showComparison,
        funnelPrev,
        timeSeriesPrev,
        loading,
        wave2Loading,
        error,
        dateRange,
        autoRefresh,
        tierFilter,
        statusFilter,
        favoritesOnly,
        selectedCompanyId,
        journey,
        notes,
        journeyLoading,
        setDateRange,
        setCustomDateRange,
        setAutoRefresh,
        setShowComparison,
        setTierFilter,
        setStatusFilter,
        setFavoritesOnly,
        selectCompany,
        toggleFavorite,
        updateSalesStatus,
        addNote,
        refresh: fetchAll,
      }}
    >
      {children}
    </AnalyticsContext.Provider>
  );
}

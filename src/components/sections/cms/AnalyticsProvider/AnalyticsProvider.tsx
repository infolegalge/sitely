"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";

interface FunnelData {
  sent: number;
  viewed: number;
  scrolled: number;
  cta: number;
  converted: number;
}

interface Lead {
  demo_id: string;
  company_id: string;
  view_count: number;
  first_viewed_at: string | null;
  last_viewed_at: string | null;
  status: string;
  score: number;
  events: Record<string, number>;
  company: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    category: string | null;
  } | null;
}

interface AnalyticsState {
  funnel: FunnelData | null;
  eventCounts: Record<string, number>;
  leads: Lead[];
  loading: boolean;
  refreshOverview: () => void;
  refreshLeads: () => void;
}

const AnalyticsContext = createContext<AnalyticsState | null>(null);

export function useAnalytics() {
  const ctx = useContext(AnalyticsContext);
  if (!ctx) throw new Error("useAnalytics must be inside AnalyticsProvider");
  return ctx;
}

export default function AnalyticsProvider({ children }: { children: ReactNode }) {
  const [funnel, setFunnel] = useState<FunnelData | null>(null);
  const [eventCounts, setEventCounts] = useState<Record<string, number>>({});
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshOverview = useCallback(() => {
    fetch("/api/analytics/overview")
      .then((r) => r.json())
      .then((res) => {
        if (res.funnel) setFunnel(res.funnel);
        if (res.eventCounts) setEventCounts(res.eventCounts);
      })
      .catch(() => {});
  }, []);

  const refreshLeads = useCallback(() => {
    fetch("/api/analytics/hot-leads?limit=20")
      .then((r) => r.json())
      .then((res) => {
        if (Array.isArray(res.leads)) setLeads(res.leads);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch("/api/analytics/overview").then((r) => r.json()),
      fetch("/api/analytics/hot-leads?limit=20").then((r) => r.json()),
    ])
      .then(([overviewRes, leadsRes]) => {
        if (overviewRes.funnel) setFunnel(overviewRes.funnel);
        if (overviewRes.eventCounts) setEventCounts(overviewRes.eventCounts);
        if (Array.isArray(leadsRes.leads)) setLeads(leadsRes.leads);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <AnalyticsContext.Provider
      value={{ funnel, eventCounts, leads, loading, refreshOverview, refreshLeads }}
    >
      {children}
    </AnalyticsContext.Provider>
  );
}

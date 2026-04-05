"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

// ─── Types ───────────────────────────────────────────────────

export interface ProposalSnapshot {
  price: number;
  currency: string;
  title: string;
  included: string[];
  excluded: string[];
}

export interface Proposal {
  id: string;
  snapshot: ProposalSnapshot;
  status: "pending" | "accepted" | "rejected" | "expired";
  payment_method: string | null;
  paid_at: string | null;
  expires_at: string | null;
  created_at: string;
}

export interface TimelineStep {
  id: string;
  step_order: number;
  title: string;
  description: string | null;
  status: "locked" | "active" | "completed";
}

export interface Project {
  id: string;
  company_id: string;
  demo_id: string | null;
  demo_hash: string | null;
  client_name: string;
  client_email: string;
  status: string;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Demo {
  id: string;
  hash: string;
  status: string;
  created_at: string;
  expires_at: string | null;
  view_count: number;
  template_name: string | null;
}

interface Company {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  category: string | null;
  created_at: string;
}

interface PortalContextValue {
  company: Company | null;
  demos: Demo[];
  project: Project | null;
  proposal: Proposal | null;
  steps: TimelineStep[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

// ─── Context ─────────────────────────────────────────────────

const PortalContext = createContext<PortalContextValue>({
  company: null,
  demos: [],
  project: null,
  proposal: null,
  steps: [],
  loading: true,
  error: null,
  refetch: () => {},
});

export function usePortal() {
  return useContext(PortalContext);
}

// ─── Provider ────────────────────────────────────────────────

export default function PortalProvider({ children }: { children: ReactNode }) {
  const [company, setCompany] = useState<Company | null>(null);
  const [demos, setDemos] = useState<Demo[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [steps, setSteps] = useState<TimelineStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [companyData, projectData] = await Promise.all([
        fetch("/api/portal/data").then((r) => {
          if (!r.ok) throw new Error("session_expired");
          return r.json();
        }),
        fetch("/api/portal/project").then((r) => {
          if (!r.ok) throw new Error("session_expired");
          return r.json();
        }),
      ]);

      setCompany(companyData.company);
      setDemos(companyData.demos ?? []);
      setProject(projectData.project ?? null);
      setProposal(projectData.proposal ?? null);
      setSteps(projectData.steps ?? []);
      setError(null);
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return (
    <PortalContext.Provider value={{ company, demos, project, proposal, steps, loading, error, refetch: fetchData }}>
      {children}
    </PortalContext.Provider>
  );
}


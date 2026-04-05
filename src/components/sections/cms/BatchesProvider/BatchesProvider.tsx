"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export interface BatchSummary {
  id: string;
  name: string;
  description: string | null;
  status: "active" | "completed" | "archived";
  template_id: string | null;
  template_name: string | null;
  created_at: string;
  updated_at: string;
  total_demos: number;
  total_sent: number;
  viewed_count: number;
  engaged_count: number;
  converted_count: number;
}

interface BatchesState {
  batches: BatchSummary[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
  updateBatch: (id: string, fields: Partial<Pick<BatchSummary, "name" | "description" | "status">>) => Promise<boolean>;
  deleteBatch: (id: string) => Promise<boolean>;
}

const Ctx = createContext<BatchesState | null>(null);

export function useBatches() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useBatches must be used inside BatchesProvider");
  return ctx;
}

export default function BatchesProvider({ children }: { children: React.ReactNode }) {
  const [batches, setBatches] = useState<BatchSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBatches = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/batches");
      if (!res.ok) throw new Error("Failed to load batches");
      const json = await res.json();
      setBatches(json.data || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBatches();
  }, [fetchBatches]);

  const updateBatch = useCallback(
    async (id: string, fields: Partial<Pick<BatchSummary, "name" | "description" | "status">>) => {
      try {
        const res = await fetch("/api/batches", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, ...fields }),
        });
        if (!res.ok) return false;
        setBatches((prev) =>
          prev.map((b) => (b.id === id ? { ...b, ...fields } : b))
        );
        return true;
      } catch {
        return false;
      }
    },
    []
  );

  const deleteBatch = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/batches/${id}`, { method: "DELETE" });
      if (!res.ok) return false;
      setBatches((prev) => prev.filter((b) => b.id !== id));
      return true;
    } catch {
      return false;
    }
  }, []);

  return (
    <Ctx.Provider value={{ batches, loading, error, refresh: fetchBatches, updateBatch, deleteBatch }}>
      {children}
    </Ctx.Provider>
  );
}

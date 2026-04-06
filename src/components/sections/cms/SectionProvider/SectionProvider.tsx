"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export interface ClientCategory {
  id: string;
  name: string;
  status: string;
  created_at: string;
  total_demos: number;
  viewed_count: number;
}

interface ClientsState {
  categories: ClientCategory[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

const Ctx = createContext<ClientsState | null>(null);

export function useSection() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useSection must be used inside SectionProvider");
  return ctx;
}

export default function SectionProvider({ children, apiEndpoint }: { children: React.ReactNode, apiEndpoint: string }) {
  const [categories, setCategories] = useState<ClientCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(apiEndpoint);
      if (!res.ok) throw new Error("Failed to load clients");
      const json = await res.json();
      setCategories(json.data || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  return (
    <Ctx.Provider value={{ categories, loading, error, refresh: fetchClients }}>
      {children}
    </Ctx.Provider>
  );
}

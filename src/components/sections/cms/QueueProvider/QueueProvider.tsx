"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { ReactNode } from "react";

type Campaign = {
  id: string;
  name: string;
  subject: string;
  status: string;
  total_recipients: number;
  sent_count: number;
  created_at: string;
};

type QueueContextType = {
  campaigns: Campaign[];
  loading: boolean;
  refresh: () => void;
  cancelCampaign: (id: string) => Promise<void>;
};

const QueueContext = createContext<QueueContextType>({
  campaigns: [],
  loading: true,
  refresh: () => {},
  cancelCampaign: async () => {},
});

export function useQueue() {
  return useContext(QueueContext);
}

export function QueueProvider({ children }: { children: ReactNode }) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/email/campaigns");
      if (res.ok) {
        const data = await res.json();
        setCampaigns(data.campaigns || []);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    // Poll every 10 seconds for live updates
    const interval = setInterval(refresh, 10000);
    return () => clearInterval(interval);
  }, [refresh]);

  const cancelCampaign = useCallback(async (id: string) => {
    try {
      const res = await fetch("/api/email/campaigns", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "cancel" }),
      });
      if (res.ok) {
        await refresh();
      }
    } catch {
      // silently fail
    }
  }, [refresh]);

  return (
    <QueueContext.Provider value={{ campaigns, loading, refresh, cancelCampaign }}>
      {children}
    </QueueContext.Provider>
  );
}

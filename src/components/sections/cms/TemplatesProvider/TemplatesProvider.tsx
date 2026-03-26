"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";

interface Template {
  id: string;
  name: string;
  description: string | null;
  industry: string;
  thumbnail_url: string | null;
  html_content?: string;
  fallback_images: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface TemplatesContextValue {
  templates: Template[];
  loading: boolean;
  refresh: () => void;
  createTemplate: (data: Omit<Template, "id" | "created_at" | "updated_at" | "is_active">) => Promise<Template | null>;
  updateTemplate: (id: string, data: Partial<Template>) => Promise<Template | null>;
  deleteTemplate: (id: string) => Promise<boolean>;
}

const TemplatesContext = createContext<TemplatesContextValue | null>(null);

export function useTemplates() {
  const ctx = useContext(TemplatesContext);
  if (!ctx) throw new Error("useTemplates must be used within TemplatesProvider");
  return ctx;
}

export function TemplatesProvider({ children }: { children: ReactNode }) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshFlag, setRefreshFlag] = useState(0);

  useEffect(() => {
    setLoading(true);
    fetch("/api/templates")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setTemplates(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [refreshFlag]);

  const refresh = useCallback(() => setRefreshFlag((f) => f + 1), []);

  const createTemplate = useCallback(
    async (data: Omit<Template, "id" | "created_at" | "updated_at" | "is_active">) => {
      const res = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) return null;
      const created = await res.json();
      setTemplates((prev) => [created, ...prev]);
      return created as Template;
    },
    []
  );

  const updateTemplate = useCallback(
    async (id: string, data: Partial<Template>) => {
      const res = await fetch(`/api/templates/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) return null;
      const updated = await res.json();
      setTemplates((prev) => prev.map((t) => (t.id === id ? { ...t, ...updated } : t)));
      return updated as Template;
    },
    []
  );

  const deleteTemplate = useCallback(async (id: string) => {
    const res = await fetch(`/api/templates/${id}`, { method: "DELETE" });
    if (!res.ok) return false;
    setTemplates((prev) => prev.filter((t) => t.id !== id));
    return true;
  }, []);

  return (
    <TemplatesContext.Provider
      value={{ templates, loading, refresh, createTemplate, updateTemplate, deleteTemplate }}
    >
      {children}
    </TemplatesContext.Provider>
  );
}

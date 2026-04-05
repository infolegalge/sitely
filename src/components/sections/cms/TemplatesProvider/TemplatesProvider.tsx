"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
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

type SortField = "name" | "industry" | "created_at" | "updated_at";
type SortDir = "asc" | "desc";

interface TemplatesContextValue {
  templates: Template[];
  filtered: Template[];
  loading: boolean;
  error: string | null;
  search: string;
  setSearch: (v: string) => void;
  industryFilter: string;
  setIndustryFilter: (v: string) => void;
  statusFilter: "all" | "active" | "inactive";
  setStatusFilter: (v: "all" | "active" | "inactive") => void;
  sortField: SortField;
  sortDir: SortDir;
  setSort: (field: SortField) => void;
  industries: string[];
  refresh: () => void;
  createTemplate: (data: Omit<Template, "id" | "created_at" | "updated_at" | "is_active">) => Promise<Template | null>;
  updateTemplate: (id: string, data: Partial<Template>) => Promise<Template | null>;
  deleteTemplate: (id: string) => Promise<boolean>;
  cloneTemplate: (id: string) => Promise<Template | null>;
  toggleActive: (id: string) => Promise<boolean>;
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
  const [error, setError] = useState<string | null>(null);
  const [refreshFlag, setRefreshFlag] = useState(0);

  /* ── Filters & Sort ── */
  const [search, setSearch] = useState("");
  const [industryFilter, setIndustryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const setSort = useCallback(
    (field: SortField) => {
      if (field === sortField) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSortField(field);
        setSortDir("asc");
      }
    },
    [sortField],
  );

  /* ── Fetch ── */
  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch("/api/templates")
      .then((r) => {
        if (!r.ok) throw new Error("შაბლონების ჩატვირთვა ვერ მოხერხდა");
        return r.json();
      })
      .then((data) => {
        if (Array.isArray(data)) setTemplates(data);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [refreshFlag]);

  const refresh = useCallback(() => setRefreshFlag((f) => f + 1), []);

  /* ── Derived: unique industry list ── */
  const industries = useMemo(
    () => [...new Set(templates.map((t) => t.industry))].sort(),
    [templates],
  );

  /* ── Derived: filtered + sorted list ── */
  const filtered = useMemo(() => {
    let list = templates;

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          (t.description && t.description.toLowerCase().includes(q)) ||
          t.industry.toLowerCase().includes(q),
      );
    }

    if (industryFilter) {
      list = list.filter((t) => t.industry === industryFilter);
    }

    if (statusFilter === "active") {
      list = list.filter((t) => t.is_active);
    } else if (statusFilter === "inactive") {
      list = list.filter((t) => !t.is_active);
    }

    list = [...list].sort((a, b) => {
      let cmp = 0;
      if (sortField === "name" || sortField === "industry") {
        cmp = a[sortField].localeCompare(b[sortField], "ka");
      } else {
        cmp = new Date(a[sortField]).getTime() - new Date(b[sortField]).getTime();
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return list;
  }, [templates, search, industryFilter, statusFilter, sortField, sortDir]);

  /* ── CRUD ── */
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
    [],
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
    [],
  );

  const deleteTemplate = useCallback(async (id: string) => {
    const res = await fetch(`/api/templates/${id}`, { method: "DELETE" });
    if (!res.ok) return false;
    setTemplates((prev) => prev.filter((t) => t.id !== id));
    return true;
  }, []);

  const cloneTemplate = useCallback(
    async (id: string) => {
      const source = templates.find((t) => t.id === id);
      if (!source) return null;

      const res = await fetch(`/api/templates/${id}`);
      if (!res.ok) return null;
      const full = await res.json();

      const cloneData = {
        name: `${full.name} (ასლი)`,
        description: full.description || "",
        industry: full.industry,
        thumbnail_url: full.thumbnail_url || "",
        html_content: full.html_content,
        fallback_images: full.fallback_images || [],
      };

      return createTemplate(cloneData);
    },
    [templates, createTemplate],
  );

  const toggleActive = useCallback(
    async (id: string) => {
      const t = templates.find((x) => x.id === id);
      if (!t) return false;
      const result = await updateTemplate(id, { is_active: !t.is_active });
      return result !== null;
    },
    [templates, updateTemplate],
  );

  return (
    <TemplatesContext.Provider
      value={{
        templates,
        filtered,
        loading,
        error,
        search,
        setSearch,
        industryFilter,
        setIndustryFilter,
        statusFilter,
        setStatusFilter,
        sortField,
        sortDir,
        setSort,
        industries,
        refresh,
        createTemplate,
        updateTemplate,
        deleteTemplate,
        cloneTemplate,
        toggleActive,
      }}
    >
      {children}
    </TemplatesContext.Provider>
  );
}

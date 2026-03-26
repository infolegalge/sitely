"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";

interface Company {
  id: string;
  yell_id: string;
  name: string;
  slug: string;
  tier: number | null;
  tier_label: string | null;
  score: number | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  address: string | null;
  category: string | null;
  categories: string | null;
  source_category: string | null;
  rating: number | null;
  reviews_count: number | null;
  status: string;
  gm_place_id: string | null;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, unknown>;
}

interface Filters {
  tier: string;
  status: string;
  category: string;
  source_category: string;
  has_email: string;
  has_website: string;
  rating_min: string;
  rating_max: string;
  q: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface CompaniesContextValue {
  companies: Company[];
  pagination: Pagination;
  filters: Filters;
  sort: { column: string; order: "asc" | "desc" };
  loading: boolean;
  expandedId: string | null;
  expandedCompany: Company | null;
  expandedLoading: boolean;
  categories: string[];
  sourceCategories: string[];
  setFilter: (key: keyof Filters, value: string) => void;
  resetFilters: () => void;
  setPage: (page: number) => void;
  setSort: (column: string) => void;
  toggleExpanded: (id: string) => void;
  updateCompanyStatus: (id: string, status: string, notes?: string) => Promise<void>;
  refresh: () => void;
}

const defaultFilters: Filters = {
  tier: "",
  status: "",
  category: "",
  source_category: "",
  has_email: "",
  has_website: "",
  rating_min: "",
  rating_max: "",
  q: "",
};

const CompaniesContext = createContext<CompaniesContextValue | null>(null);

export function useCompanies() {
  const ctx = useContext(CompaniesContext);
  if (!ctx) throw new Error("useCompanies must be used within CompaniesProvider");
  return ctx;
}

export function CompaniesProvider({ children }: { children: ReactNode }) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [sort, setSortState] = useState<{ column: string; order: "asc" | "desc" }>({ column: "score", order: "desc" });
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedCompany, setExpandedCompany] = useState<Company | null>(null);
  const [expandedLoading, setExpandedLoading] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [sourceCategories, setSourceCategories] = useState<string[]>([]);
  const [refreshFlag, setRefreshFlag] = useState(0);

  // Load categories once
  useEffect(() => {
    fetch("/api/companies/categories")
      .then((r) => r.json())
      .then((data) => {
        if (data.categories) setCategories(data.categories);
        if (data.source_categories) setSourceCategories(data.source_categories);
      })
      .catch(() => {});
  }, []);

  // Fetch companies
  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(pagination.page));
    params.set("limit", String(pagination.limit));
    params.set("sort", sort.column);
    params.set("order", sort.order);

    for (const [key, val] of Object.entries(filters)) {
      if (val) params.set(key, val);
    }

    fetch(`/api/companies?${params}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.data) {
          setCompanies(res.data);
          setPagination((prev) => ({
            ...prev,
            total: res.pagination.total,
            totalPages: res.pagination.totalPages,
          }));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [pagination.page, pagination.limit, sort, filters, refreshFlag]);

  // Fetch expanded company detail
  useEffect(() => {
    if (!expandedId) {
      setExpandedCompany(null);
      return;
    }
    setExpandedLoading(true);
    fetch(`/api/companies/${expandedId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.id) setExpandedCompany(data);
      })
      .catch(() => {})
      .finally(() => setExpandedLoading(false));
  }, [expandedId]);

  const setFilter = useCallback((key: keyof Filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(defaultFilters);
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, []);

  const setPage = useCallback((page: number) => {
    setPagination((prev) => ({ ...prev, page }));
    setExpandedId(null);
  }, []);

  const setSort = useCallback((column: string) => {
    setSortState((prev) => ({
      column,
      order: prev.column === column && prev.order === "desc" ? "asc" : "desc",
    }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, []);

  const toggleExpanded = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  const updateCompanyStatus = useCallback(
    async (id: string, status: string, notes?: string) => {
      const body: Record<string, string> = { status };
      if (notes !== undefined) body.notes = notes;

      const res = await fetch(`/api/companies/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const updated = await res.json();
        setCompanies((prev) =>
          prev.map((c) => (c.id === id ? { ...c, ...updated } : c))
        );
        if (expandedId === id) setExpandedCompany(updated);
      }
    },
    [expandedId]
  );

  const refresh = useCallback(() => setRefreshFlag((f) => f + 1), []);

  return (
    <CompaniesContext.Provider
      value={{
        companies,
        pagination,
        filters,
        sort,
        loading,
        expandedId,
        expandedCompany,
        expandedLoading,
        categories,
        sourceCategories,
        setFilter,
        resetFilters,
        setPage,
        setSort,
        toggleExpanded,
        updateCompanyStatus,
        refresh,
      }}
    >
      {children}
    </CompaniesContext.Provider>
  );
}

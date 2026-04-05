"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { useSearchParams, useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

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

const FILTER_KEYS = Object.keys(defaultFilters) as (keyof Filters)[];

const CompaniesContext = createContext<CompaniesContextValue | null>(null);

export function useCompanies() {
  const ctx = useContext(CompaniesContext);
  if (!ctx) throw new Error("useCompanies must be used within CompaniesProvider");
  return ctx;
}

async function fetchCompanies(
  params: {
    page: number;
    limit: number;
    sort: string;
    order: string;
    filters: Filters;
  },
  signal?: AbortSignal
) {
  const sp = new URLSearchParams();
  sp.set("page", String(params.page));
  sp.set("limit", String(params.limit));
  sp.set("sort", params.sort);
  sp.set("order", params.order);

  for (const [key, val] of Object.entries(params.filters)) {
    if (val) sp.set(key, val);
  }

  const res = await fetch(`/api/companies?${sp}`, { signal });
  if (!res.ok) throw new Error("Failed to fetch companies");
  return res.json();
}

export function CompaniesProvider({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();

  // Read initial state from URL
  const filtersFromUrl: Filters = {
    tier: searchParams.get("tier") || "",
    status: searchParams.get("status") || "",
    category: searchParams.get("category") || "",
    source_category: searchParams.get("source_category") || "",
    has_email: searchParams.get("has_email") || "",
    has_website: searchParams.get("has_website") || "",
    rating_min: searchParams.get("rating_min") || "",
    rating_max: searchParams.get("rating_max") || "",
    q: searchParams.get("q") || "",
  };

  const [filters, setFiltersState] = useState<Filters>(filtersFromUrl);
  const [page, setPageState] = useState(
    Number(searchParams.get("page")) || 1
  );
  const [sort, setSortState] = useState<{
    column: string;
    order: "asc" | "desc";
  }>({
    column: searchParams.get("sort") || "score",
    order: (searchParams.get("order") as "asc" | "desc") || "desc",
  });
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const limit = 50;

  // Sync state → URL
  const syncUrl = useCallback(
    (f: Filters, p: number, s: { column: string; order: string }) => {
      const sp = new URLSearchParams();
      for (const key of FILTER_KEYS) {
        if (f[key]) sp.set(key, f[key]);
      }
      if (p > 1) sp.set("page", String(p));
      if (s.column !== "score") sp.set("sort", s.column);
      if (s.order !== "desc") sp.set("order", s.order);

      const qs = sp.toString();
      router.replace(qs ? `?${qs}` : "?", { scroll: false });
    },
    [router]
  );

  // React Query — companies list
  const companiesQuery = useQuery({
    queryKey: ["companies", { page, limit, sort, filters }],
    queryFn: ({ signal }) =>
      fetchCompanies({ page, limit, sort: sort.column, order: sort.order, filters }, signal),
    placeholderData: keepPreviousData,
  });

  // React Query — categories (loaded once)
  const categoriesQuery = useQuery({
    queryKey: ["companies-categories"],
    queryFn: async () => {
      const res = await fetch("/api/companies/categories");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    staleTime: Infinity,
  });

  // React Query — expanded company detail
  const expandedQuery = useQuery({
    queryKey: ["company-detail", expandedId],
    queryFn: async () => {
      if (!expandedId) return null;
      const res = await fetch(`/api/companies/${expandedId}`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!expandedId,
  });

  // React Query — status update mutation
  const statusMutation = useMutation({
    mutationFn: async ({
      id,
      status,
      notes,
    }: {
      id: string;
      status: string;
      notes?: string;
    }) => {
      const body: Record<string, string> = { status };
      if (notes !== undefined) body.notes = notes;

      const res = await fetch(`/api/companies/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      if (expandedId) {
        queryClient.invalidateQueries({
          queryKey: ["company-detail", expandedId],
        });
      }
    },
  });

  // Supabase Realtime — live company updates
  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
    );

    const channel = supabase
      .channel("company-updates")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "companies" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["companies"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const companies = companiesQuery.data?.data || [];
  const paginationData = companiesQuery.data?.pagination || {
    total: 0,
    totalPages: 0,
  };

  const pagination: Pagination = {
    page,
    limit,
    total: paginationData.total,
    totalPages: paginationData.totalPages,
  };

  const setFilter = useCallback(
    (key: keyof Filters, value: string) => {
      setFiltersState((prev) => {
        const next = { ...prev, [key]: value };
        setPageState(1);
        syncUrl(next, 1, sort);
        return next;
      });
    },
    [sort, syncUrl]
  );

  const resetFilters = useCallback(() => {
    setFiltersState(defaultFilters);
    setPageState(1);
    syncUrl(defaultFilters, 1, sort);
  }, [sort, syncUrl]);

  const setPage = useCallback(
    (p: number) => {
      setPageState(p);
      setExpandedId(null);
      syncUrl(filters, p, sort);
    },
    [filters, sort, syncUrl]
  );

  const setSort = useCallback(
    (column: string) => {
      setSortState((prev) => {
        const next = {
          column,
          order:
            prev.column === column && prev.order === "desc"
              ? ("asc" as const)
              : ("desc" as const),
        };
        setPageState(1);
        syncUrl(filters, 1, next);
        return next;
      });
    },
    [filters, syncUrl]
  );

  const toggleExpanded = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  const updateCompanyStatus = useCallback(
    async (id: string, status: string, notes?: string) => {
      await statusMutation.mutateAsync({ id, status, notes });
    },
    [statusMutation]
  );

  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["companies"] });
  }, [queryClient]);

  return (
    <CompaniesContext.Provider
      value={{
        companies,
        pagination,
        filters,
        sort,
        loading: companiesQuery.isLoading,
        expandedId,
        expandedCompany: expandedQuery.data || null,
        expandedLoading: expandedQuery.isLoading,
        categories: categoriesQuery.data?.categories || [],
        sourceCategories: categoriesQuery.data?.source_categories || [],
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

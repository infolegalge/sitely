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
  industry: string;
  thumbnail_url: string | null;
}

interface Company {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  category: string | null;
  rating: number | null;
  tier: number | null;
  score: number | null;
}

interface GeneratedDemo {
  id: string;
  hash: string;
  company_id: string;
  url: string;
}

interface WizardContextValue {
  step: number;
  setStep: (s: number) => void;

  // Step 1: Template
  templates: Template[];
  selectedTemplate: Template | null;
  selectTemplate: (t: Template) => void;

  // Step 2: Companies
  companies: Company[];
  companiesLoading: boolean;
  companiesTotal: number;
  selectedIds: Set<string>;
  toggleCompany: (id: string) => void;
  selectAllFiltered: () => void;
  clearSelection: () => void;
  filters: CompanyFilters;
  setFilter: <K extends keyof CompanyFilters>(k: K, v: CompanyFilters[K]) => void;
  resetFilters: () => void;
  companiesPage: number;
  setCompaniesPage: (p: number) => void;
  categories: string[];
  sourceCategories: string[];

  // Step 3: Preview
  previewCompanyId: string | null;
  setPreviewCompanyId: (id: string | null) => void;
  excludeCompany: (id: string) => void;

  // Step 4: Generate
  generating: boolean;
  generated: GeneratedDemo[];
  generate: () => Promise<void>;
}

interface CompanyFilters {
  q: string;
  tier: string;
  status: string;
  category: string;
  source_category: string;
  has_email: string;
  has_website: string;
}

const INITIAL_FILTERS: CompanyFilters = {
  q: "",
  tier: "",
  status: "",
  category: "",
  source_category: "",
  has_email: "",
  has_website: "",
};

const WizardContext = createContext<WizardContextValue | null>(null);

export function useWizard() {
  const ctx = useContext(WizardContext);
  if (!ctx) throw new Error("useWizard must be used within WizardProvider");
  return ctx;
}

export function WizardProvider({ children }: { children: ReactNode }) {
  const [step, setStep] = useState(1);

  // Step 1
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

  // Step 2
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companiesLoading, setCompaniesLoading] = useState(false);
  const [companiesTotal, setCompaniesTotal] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<CompanyFilters>(INITIAL_FILTERS);
  const [companiesPage, setCompaniesPage] = useState(1);
  const [categories, setCategories] = useState<string[]>([]);
  const [sourceCategories, setSourceCategories] = useState<string[]>([]);

  // Step 3
  const [previewCompanyId, setPreviewCompanyId] = useState<string | null>(null);

  // Step 4
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState<GeneratedDemo[]>([]);

  // Fetch templates and categories on mount
  useEffect(() => {
    fetch("/api/templates")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setTemplates(data);
      })
      .catch(() => {});

    fetch("/api/companies/categories")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.categories)) setCategories(data.categories);
        if (Array.isArray(data.source_categories)) setSourceCategories(data.source_categories);
      })
      .catch(() => {});
  }, []);

  // Fetch companies when filters/page change
  useEffect(() => {
    if (step < 2) return;
    setCompaniesLoading(true);
    const params = new URLSearchParams();
    if (filters.q) params.set("q", filters.q);
    if (filters.tier) params.set("tier", filters.tier);
    if (filters.status) params.set("status", filters.status);
    if (filters.category) params.set("category", filters.category);
    if (filters.has_email) params.set("has_email", filters.has_email);
    if (filters.has_website) params.set("has_website", filters.has_website);
    if (filters.source_category) params.set("source_category", filters.source_category);
    params.set("page", String(companiesPage));
    params.set("per_page", "50");
    params.set("sort", "score");
    params.set("order", "desc");

    fetch(`/api/companies?${params}`)
      .then((r) => r.json())
      .then((res) => {
        if (Array.isArray(res.data)) {
          setCompanies(res.data);
          setCompaniesTotal(res.total || 0);
        }
      })
      .catch(() => {})
      .finally(() => setCompaniesLoading(false));
  }, [step, filters, companiesPage]);

  const selectTemplate = useCallback((t: Template) => {
    setSelectedTemplate(t);
    setStep(2);
  }, []);

  const setFilter = useCallback(
    <K extends keyof CompanyFilters>(k: K, v: CompanyFilters[K]) => {
      setFilters((prev) => ({ ...prev, [k]: v }));
      setCompaniesPage(1);
    },
    []
  );

  const resetFilters = useCallback(() => {
    setFilters(INITIAL_FILTERS);
    setCompaniesPage(1);
  }, []);

  const toggleCompany = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAllFiltered = useCallback(() => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      companies.forEach((c) => next.add(c.id));
      return next;
    });
  }, [companies]);

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  const excludeCompany = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const generate = useCallback(async () => {
    if (!selectedTemplate || selectedIds.size === 0) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/demos/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          template_id: selectedTemplate.id,
          company_ids: Array.from(selectedIds),
        }),
      });
      if (!res.ok) throw new Error("generate failed");
      const result = await res.json();
      setGenerated(result.demos || []);
      setStep(4);
    } catch {
      /* stay on step 3 */
    } finally {
      setGenerating(false);
    }
  }, [selectedTemplate, selectedIds]);

  return (
    <WizardContext.Provider
      value={{
        step,
        setStep,
        templates,
        selectedTemplate,
        selectTemplate,
        companies,
        companiesLoading,
        companiesTotal,
        selectedIds,
        toggleCompany,
        selectAllFiltered,
        clearSelection,
        filters,
        setFilter,
        resetFilters,
        companiesPage,
        setCompaniesPage,
        categories,
        sourceCategories,
        previewCompanyId,
        setPreviewCompanyId,
        excludeCompany,
        generating,
        generated,
        generate,
      }}
    >
      {children}
    </WizardContext.Provider>
  );
}

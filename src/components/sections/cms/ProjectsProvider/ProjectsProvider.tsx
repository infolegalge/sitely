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
} from "@tanstack/react-query";
import { createBrowserClient } from "@supabase/ssr";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ProposalSnapshot {
  title: string;
  price: number;
  currency: string;
  included: string[];
  excluded: string[];
  notes: string;
}

export interface Proposal {
  id: string;
  status: string;
  snapshot: ProposalSnapshot;
  payment_method: string | null;
  paid_at: string | null;
  expires_at: string | null;
  created_at: string;
}

export interface Message {
  id: string;
  sender_id: string;
  sender_role: "admin" | "client" | "system";
  content: string | null;
  file_url: string | null;
  file_name: string | null;
  file_type: string | null;
  file_size: number | null;
  is_read: boolean;
  is_system: boolean;
  is_internal: boolean;
  created_at: string;
}

export interface TimelineStep {
  id: string;
  step_order: number;
  title: string;
  description: string | null;
  status: "locked" | "active" | "completed";
}

export interface ProjectFile {
  id: string;
  file_url: string;
  file_name: string;
  file_type: string | null;
  file_size: number | null;
  category: string;
  created_at: string;
  uploaded_by: string | null;
}

export interface ProjectCompany {
  id: string;
  name: string;
  category: string | null;
  tier: number | null;
  email: string | null;
  phone: string | null;
}

export interface ProjectListItem {
  id: string;
  status: string;
  client_name: string;
  client_email: string;
  client_phone: string | null;
  created_at: string;
  updated_at: string;
  unread_count: number;
  companies: { id: string; name: string; category: string | null; tier: number | null };
  proposals: { id: string; status: string; snapshot: ProposalSnapshot }[];
}

export interface ProjectDetail {
  id: string;
  status: string;
  client_name: string;
  client_email: string;
  client_phone: string | null;
  admin_notes: string | null;
  assigned_to: string | null;
  demo_hash: string | null;
  created_at: string;
  updated_at: string;
  companies: ProjectCompany;
  proposals: Proposal[];
}

export interface SendMessageParams {
  content?: string;
  file_url?: string;
  file_name?: string;
  file_type?: string;
  file_size?: number;
  is_internal: boolean;
}

export interface UploadedFile {
  file_url: string;
  file_name: string;
  file_type: string;
  file_size: number;
}

interface ProjectsContextValue {
  projects: ProjectListItem[];
  loadingList: boolean;
  selectedId: string | null;
  selectProject: (id: string) => void;
  detail: ProjectDetail | null;
  messages: Message[];
  steps: TimelineStep[];
  files: ProjectFile[];
  loadingDetail: boolean;
  sendMessage: (params: SendMessageParams) => Promise<void>;
  updateStatus: (status: string) => Promise<void>;
  saveNotes: (notes: string) => Promise<void>;
  sendProposal: (snapshot: ProposalSnapshot) => Promise<void>;
  markPaid: () => Promise<void>;
  saveSteps: (steps: { step_order: number; title: string; description: string | null; status: string }[]) => Promise<void>;
  updateStepStatus: (stepId: string, status: string) => Promise<void>;
  uploadFile: (file: File) => Promise<UploadedFile>;
  refresh: () => void;
}

const ProjectsContext = createContext<ProjectsContextValue | null>(null);

export function useProjects() {
  const ctx = useContext(ProjectsContext);
  if (!ctx) throw new Error("useProjects must be used within ProjectsProvider");
  return ctx;
}

// ─── Fetch helpers ────────────────────────────────────────────────────────────

async function fetchProjectsList() {
  const res = await fetch("/api/projects");
  if (!res.ok) throw new Error("Failed to fetch projects");
  const data = await res.json();
  return data.projects as ProjectListItem[];
}

async function fetchProjectDetail(id: string) {
  const res = await fetch(`/api/projects/${id}`);
  if (!res.ok) throw new Error("Failed to fetch project");
  return res.json() as Promise<{
    project: ProjectDetail;
    messages: Message[];
    steps: TimelineStep[];
    files: ProjectFile[];
  }>;
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ProjectsProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // ── List query ──────────────────────────────────────────────────────────────
  const listQuery = useQuery({
    queryKey: ["projects"],
    queryFn: fetchProjectsList,
    refetchInterval: 30_000,
  });

  // ── Detail query ────────────────────────────────────────────────────────────
  const detailQuery = useQuery({
    queryKey: ["project-detail", selectedId],
    queryFn: () => fetchProjectDetail(selectedId!),
    enabled: !!selectedId,
    refetchInterval: 15_000,
  });

  // ── Supabase Realtime — messages ────────────────────────────────────────────
  useEffect(() => {
    if (!selectedId) return;

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
    );

    const channel = supabase
      .channel(`project-messages-${selectedId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `project_id=eq.${selectedId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["project-detail", selectedId] });
          queryClient.invalidateQueries({ queryKey: ["projects"] });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedId, queryClient]);

  // ── Mutations ────────────────────────────────────────────────────────────────

  const sendMessageMutation = useMutation({
    mutationFn: async (params: SendMessageParams & { projectId: string }) => {
      const { projectId, ...body } = params;
      const res = await fetch(`/api/projects/${projectId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed to send message");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-detail", selectedId] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });

  const patchProjectMutation = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Record<string, unknown> }) => {
      const res = await fetch(`/api/projects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error("Failed to update project");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-detail", selectedId] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });

  const proposalMutation = useMutation({
    mutationFn: async ({ id, body }: { id: string; body: Record<string, unknown> }) => {
      const res = await fetch(`/api/projects/${id}/proposal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed to save proposal");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-detail", selectedId] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });

  const stepsMutation = useMutation({
    mutationFn: async ({ id, steps }: { id: string; steps: unknown[] }) => {
      const res = await fetch(`/api/projects/${id}/steps`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ steps }),
      });
      if (!res.ok) throw new Error("Failed to save steps");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-detail", selectedId] });
    },
  });

  const stepStatusMutation = useMutation({
    mutationFn: async ({ id, stepId, status }: { id: string; stepId: string; status: string }) => {
      const res = await fetch(`/api/projects/${id}/steps?step_id=${stepId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update step");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-detail", selectedId] });
    },
  });

  // ── Public API ───────────────────────────────────────────────────────────────

  const selectProject = useCallback((id: string) => {
    setSelectedId((prev) => (prev === id ? prev : id));
  }, []);

  const sendMessage = useCallback(
    async (params: SendMessageParams) => {
      if (!selectedId) return;
      await sendMessageMutation.mutateAsync({ projectId: selectedId, ...params });
    },
    [selectedId, sendMessageMutation]
  );

  const updateStatus = useCallback(
    async (status: string) => {
      if (!selectedId) return;
      await patchProjectMutation.mutateAsync({ id: selectedId, patch: { status } });
    },
    [selectedId, patchProjectMutation]
  );

  const saveNotes = useCallback(
    async (admin_notes: string) => {
      if (!selectedId) return;
      await patchProjectMutation.mutateAsync({ id: selectedId, patch: { admin_notes } });
    },
    [selectedId, patchProjectMutation]
  );

  const sendProposal = useCallback(
    async (snapshot: ProposalSnapshot) => {
      if (!selectedId) return;
      await proposalMutation.mutateAsync({ id: selectedId, body: { snapshot } });
    },
    [selectedId, proposalMutation]
  );

  const markPaid = useCallback(async () => {
    if (!selectedId) return;
    await proposalMutation.mutateAsync({ id: selectedId, body: { mark_paid: true } });
  }, [selectedId, proposalMutation]);

  const saveSteps = useCallback(
    async (steps: { step_order: number; title: string; description: string | null; status: string }[]) => {
      if (!selectedId) return;
      await stepsMutation.mutateAsync({ id: selectedId, steps });
    },
    [selectedId, stepsMutation]
  );

  const updateStepStatus = useCallback(
    async (stepId: string, status: string) => {
      if (!selectedId) return;
      await stepStatusMutation.mutateAsync({ id: selectedId, stepId, status });
    },
    [selectedId, stepStatusMutation]
  );

  const uploadFile = useCallback(
    async (file: File): Promise<UploadedFile> => {
      if (!selectedId) throw new Error("No project selected");
      const fd = new FormData();
      fd.append("file", file);
      fd.append("project_id", selectedId);
      const res = await fetch("/api/projects/upload", { method: "POST", body: fd });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      return { file_url: data.file_url, file_name: data.file_name, file_type: data.file_type, file_size: data.file_size };
    },
    [selectedId]
  );

  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["projects"] });
    if (selectedId) queryClient.invalidateQueries({ queryKey: ["project-detail", selectedId] });
  }, [queryClient, selectedId]);

  const detailData = detailQuery.data;

  return (
    <ProjectsContext.Provider
      value={{
        projects: listQuery.data ?? [],
        loadingList: listQuery.isLoading,
        selectedId,
        selectProject,
        detail: detailData?.project ?? null,
        messages: detailData?.messages ?? [],
        steps: detailData?.steps ?? [],
        files: detailData?.files ?? [],
        loadingDetail: detailQuery.isLoading,
        sendMessage,
        updateStatus,
        saveNotes,
        sendProposal,
        markPaid,
        saveSteps,
        updateStepStatus,
        uploadFile,
        refresh,
      }}
    >
      {children}
    </ProjectsContext.Provider>
  );
}

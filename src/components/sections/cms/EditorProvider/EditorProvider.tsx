"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";

interface EditorData {
  name: string;
  description: string;
  industry: string;
  thumbnail_url: string;
  html_content: string;
  fallback_images: string[];
}

interface EditorContextValue {
  data: EditorData;
  setField: <K extends keyof EditorData>(key: K, value: EditorData[K]) => void;
  saving: boolean;
  loading: boolean;
  save: () => Promise<void>;
  previewHtml: string;
  isEdit: boolean;
}

const EditorContext = createContext<EditorContextValue | null>(null);

export function useEditor() {
  const ctx = useContext(EditorContext);
  if (!ctx) throw new Error("useEditor must be used within EditorProvider");
  return ctx;
}

const INITIAL: EditorData = {
  name: "",
  description: "",
  industry: "",
  thumbnail_url: "",
  html_content: "",
  fallback_images: [],
};

interface EditorProviderProps {
  children: ReactNode;
  templateId?: string;
}

export function EditorProvider({ children, templateId }: EditorProviderProps) {
  const router = useRouter();
  const isEdit = Boolean(templateId);
  const [data, setData] = useState<EditorData>(INITIAL);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(Boolean(templateId));

  useEffect(() => {
    if (!templateId) return;
    setLoading(true);
    fetch(`/api/templates/${templateId}`)
      .then((r) => {
        if (!r.ok) throw new Error("not found");
        return r.json();
      })
      .then((t) => {
        setData({
          name: t.name || "",
          description: t.description || "",
          industry: t.industry || "",
          thumbnail_url: t.thumbnail_url || "",
          html_content: t.html_content || "",
          fallback_images: t.fallback_images || [],
        });
      })
      .catch(() => router.push("/secure-access/templates"))
      .finally(() => setLoading(false));
  }, [templateId, router]);

  const setField = useCallback(
    <K extends keyof EditorData>(key: K, value: EditorData[K]) => {
      setData((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const save = useCallback(async () => {
    if (!data.name || !data.industry || !data.html_content) return;
    setSaving(true);
    try {
      const url = isEdit ? `/api/templates/${templateId}` : "/api/templates";
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("save failed");
      router.push("/secure-access/templates");
    } catch {
      /* keep on page */
    } finally {
      setSaving(false);
    }
  }, [data, isEdit, templateId, router]);

  const previewHtml = data.html_content;

  return (
    <EditorContext.Provider
      value={{ data, setField, saving, loading, save, previewHtml, isEdit }}
    >
      {children}
    </EditorContext.Provider>
  );
}

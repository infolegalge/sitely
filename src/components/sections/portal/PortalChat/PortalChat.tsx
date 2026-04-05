"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createBrowserClient } from "@supabase/ssr";
import s from "./PortalChat.module.css";

interface Message {
  id: string;
  sender_role: "admin" | "client" | "system";
  content: string | null;
  file_url: string | null;
  file_name: string | null;
  file_type: string | null;
  file_size: number | null;
  is_read: boolean;
  is_system: boolean;
  is_internal?: boolean;
  created_at: string;
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("ka-GE", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function groupByDate(msgs: Message[]): { label: string; items: Message[] }[] {
  const groups: { label: string; items: Message[] }[] = [];
  for (const msg of msgs) {
    const label = new Date(msg.created_at).toLocaleDateString("ka-GE", {
      day: "numeric",
      month: "long",
    });
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.items.push(msg);
    else groups.push({ label, items: [msg] });
  }
  return groups;
}

interface PortalChatProps {
  projectId: string;
}

export default function PortalChat({ projectId }: PortalChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // ── Fetch messages ───────────────────────────────────────────────────────────
  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch("/api/portal/messages");
      if (!res.ok) return;
      const data = await res.json();
      setMessages(data.messages ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // ── Supabase Realtime subscription ───────────────────────────────────────────
  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
    );

    const channel = supabase
      .channel(`portal-messages-${projectId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          if (newMsg.is_internal) return;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          if (newMsg.sender_role === "admin") {
            fetch("/api/portal/messages").catch(() => {});
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [projectId]);

  // ── Auto-scroll ──────────────────────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // ── Upload helper ────────────────────────────────────────────────────────────
  const ALLOWED_TYPES = new Set([
    "image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml",
    "application/pdf",
    "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/zip", "text/plain",
  ]);
  const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

  const uploadAndSend = useCallback(async (file: File) => {
    if (!ALLOWED_TYPES.has(file.type)) {
      alert("ამ ტიპის ფაილი არ არის დაშვებული.");
      setPendingFile(null);
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      alert("ფაილი ძალიან დიდია (მაქს. 25 MB).");
      setPendingFile(null);
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const uploadRes = await fetch("/api/portal/upload", { method: "POST", body: fd });
      if (!uploadRes.ok) {
        const err = await uploadRes.json().catch(() => ({}));
        alert(err.error ?? "ატვირთვა ვერ მოხერხდა");
        return;
      }
      const uploaded = await uploadRes.json();
      await fetch("/api/portal/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          file_url: uploaded.file_url,
          file_name: uploaded.file_name,
          file_type: uploaded.file_type,
          file_size: uploaded.file_size,
        }),
      });
    } finally {
      setUploading(false);
      setPendingFile(null);
    }
  }, []);

  // ── Send text ────────────────────────────────────────────────────────────────
  const handleSend = useCallback(async () => {
    const content = text.trim();
    if ((!content && !pendingFile) || sending || uploading) return;

    if (pendingFile) {
      await uploadAndSend(pendingFile);
      if (content) {
        setSending(true);
        setText("");
        try {
          await fetch("/api/portal/messages", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content }),
          });
        } finally {
          setSending(false);
        }
      }
      return;
    }

    setSending(true);
    setText("");
    try {
      await fetch("/api/portal/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
    } finally {
      setSending(false);
    }
  }, [text, pendingFile, sending, uploading, uploadAndSend]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  // ── File input change ────────────────────────────────────────────────────────
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (file) setPendingFile(file);
    },
    []
  );

  // ── Drag & Drop ──────────────────────────────────────────────────────────────
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    if (!dropZoneRef.current?.contains(e.relatedTarget as Node)) {
      setDragOver(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) setPendingFile(file);
  }, []);

  if (loading) {
    return (
      <div className={s.loading}>
        <div className={s.spinner} />
      </div>
    );
  }

  const grouped = groupByDate(messages);
  const isBusy = sending || uploading;

  return (
    <div
      ref={dropZoneRef}
      className={`${s.chat} ${dragOver ? s.chatDragOver : ""}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {dragOver && (
        <div className={s.dropOverlay}>
          <span className={s.dropOverlayText}>📎 ჩააგდეთ ფაილი</span>
        </div>
      )}

      <div className={s.messages}>
        {grouped.map((group) => (
          <div key={group.label}>
            <div className={s.dateDivider}>
              <span className={s.dateDividerLabel}>{group.label}</span>
            </div>
            {group.items.map((msg) => {
              if (msg.is_system) {
                return (
                  <div key={msg.id} className={s.systemPill}>
                    {msg.content}
                  </div>
                );
              }
              const isClient = msg.sender_role === "client";
              return (
                <div key={msg.id} className={`${s.bubbleRow} ${isClient ? s.bubbleRowClient : s.bubbleRowAdmin}`}>
                  {!isClient && (
                    <div className={s.adminAvatar}>
                      <span className={s.adminAvatarLetter}>S</span>
                    </div>
                  )}
                  <div className={`${s.bubble} ${isClient ? s.bubbleClient : s.bubbleAdmin}`}>
                    {!isClient && <span className={s.adminName}>Sitely</span>}
                    {msg.content && <p className={s.bubbleText}>{msg.content}</p>}
                    {msg.file_url && (
                      <a
                        href={msg.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={s.fileLink}
                      >
                        📎 {msg.file_name ?? "ფაილი"}
                        {msg.file_size && (
                          <span className={s.fileSize}> · {formatFileSize(msg.file_size)}</span>
                        )}
                      </a>
                    )}
                    <span className={s.time}>{formatTime(msg.created_at)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        {messages.length === 0 && (
          <div className={s.emptyChat}>
            <div className={s.emptyChatAvatar}>
              <span className={s.emptyChatLetter}>S</span>
            </div>
            <p className={s.emptyChatTitle}>Sitely გუნდი</p>
            <p className={s.emptyChatText}>გამარჯობა! ჩვენ მზად ვართ დაგეხმაროთ. დაწერეთ ნებისმიერი კითხვა.</p>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Pending file preview */}
      {pendingFile && (
        <div className={s.pendingFile}>
          <span className={s.pendingFileIcon}>📎</span>
          <span className={s.pendingFileName}>{pendingFile.name}</span>
          <span className={s.pendingFileSize}>{formatFileSize(pendingFile.size)}</span>
          <button
            type="button"
            className={s.pendingFileRemove}
            onClick={() => setPendingFile(null)}
            aria-label="ფაილის წაშლა"
          >
            ×
          </button>
        </div>
      )}

      <div className={s.composer}>
        <input
          ref={fileInputRef}
          type="file"
          className={s.hiddenInput}
          onChange={handleFileChange}
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.zip,.txt"
        />
        <button
          type="button"
          className={s.attachBtn}
          onClick={() => fileInputRef.current?.click()}
          disabled={isBusy}
          title="ფაილის მიმაგრება"
          aria-label="ფაილის მიმაგრება"
        >
          {uploading ? "⏳" : "📎"}
        </button>
        <textarea
          className={s.textarea}
          placeholder={pendingFile ? "შეტყობინება ფაილთან ერთად… (სურვილისამებრ)" : "შეტყობინება…"}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={2}
          disabled={isBusy}
        />
        <button
          type="button"
          className={s.sendBtn}
          onClick={handleSend}
          disabled={(!text.trim() && !pendingFile) || isBusy}
          aria-label="შეტყობინების გაგზავნა"
        >
          {isBusy ? "…" : "→"}
        </button>
      </div>
    </div>
  );
}

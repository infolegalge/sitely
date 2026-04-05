"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useProjects, type Message } from "@/components/sections/cms/ProjectsProvider/ProjectsProvider";
import s from "./ProjectsChat.module.css";

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("ka-GE", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("ka-GE", {
    day: "numeric",
    month: "long",
  });
}

function groupMessagesByDate(messages: Message[]): { date: string; items: Message[] }[] {
  const groups: { date: string; items: Message[] }[] = [];
  for (const msg of messages) {
    const d = new Date(msg.created_at).toLocaleDateString("ka-GE");
    const last = groups[groups.length - 1];
    if (last && last.date === d) {
      last.items.push(msg);
    } else {
      groups.push({ date: d, items: [msg] });
    }
  }
  return groups;
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function MessageBubble({ msg }: { msg: Message }) {
  if (msg.is_system) {
    return (
      <div className={s.systemPill}>
        {msg.content}
      </div>
    );
  }

  const isAdmin = msg.sender_role === "admin";

  return (
    <div className={`${s.bubble} ${isAdmin ? s.bubbleAdmin : s.bubbleClient} ${msg.is_internal ? s.bubbleInternal : ""}`}>
      {msg.is_internal && (
        <span className={s.internalTag}>შიდა ჩანაწერი</span>
      )}
      {msg.content && <p className={s.bubbleText}>{msg.content}</p>}
      {msg.file_url && (
        <a
          href={msg.file_url}
          target="_blank"
          rel="noopener noreferrer"
          className={s.fileAttachment}
        >
          <span className={s.fileIcon}>📎</span>
          <span className={s.fileName}>{msg.file_name ?? "ფაილი"}</span>
          {msg.file_size && (
            <span className={s.fileSize}>{formatFileSize(msg.file_size)}</span>
          )}
        </a>
      )}
      <span className={s.bubbleTime}>{formatTime(msg.created_at)}</span>
    </div>
  );
}

export default function ProjectsChat() {
  const { selectedId, detail, messages, loadingDetail, sendMessage, uploadFile } = useProjects();
  const [text, setText] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSend = useCallback(async () => {
    const content = text.trim();
    if (!content || sending) return;
    setSending(true);
    setText("");
    try {
      await sendMessage({ content, is_internal: isInternal });
    } finally {
      setSending(false);
    }
  }, [text, isInternal, sending, sendMessage]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      e.target.value = "";
      setUploading(true);
      try {
        const uploaded = await uploadFile(file);
        await sendMessage({
          file_url: uploaded.file_url,
          file_name: uploaded.file_name,
          file_type: uploaded.file_type,
          file_size: uploaded.file_size,
          is_internal: isInternal,
        });
      } finally {
        setUploading(false);
      }
    },
    [uploadFile, sendMessage, isInternal]
  );

  if (!selectedId) {
    return (
      <div className={s.empty}>
        <p className={s.emptyText}>← აირჩიეთ პროექტი</p>
      </div>
    );
  }

  if (loadingDetail && messages.length === 0) {
    return (
      <div className={s.loading}>
        <div className={s.spinner} />
      </div>
    );
  }

  const grouped = groupMessagesByDate(messages);

  return (
    <div className={s.chat}>
      {/* Header */}
      <div className={s.chatHeader}>
        <div className={s.chatHeaderInfo}>
          <span className={s.chatHeaderCompany}>{detail?.companies?.name ?? "—"}</span>
          <span className={s.chatHeaderClient}>{detail?.client_name ?? ""} · {detail?.client_email ?? ""}</span>
        </div>
      </div>

      {/* Messages */}
      <div className={s.messageArea}>
        {grouped.map((group) => (
          <div key={group.date}>
            <div className={s.dateDivider}>
              <span className={s.dateDividerLabel}>{formatDate(group.items[0].created_at)}</span>
            </div>
            {group.items.map((msg) => (
              <MessageBubble key={msg.id} msg={msg} />
            ))}
          </div>
        ))}
        {messages.length === 0 && (
          <div className={s.noMessages}>შეტყობინებები არ არის</div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <div className={s.composer}>
        <div className={s.composerToolbar}>
          <label className={s.internalToggle}>
            <input
              type="checkbox"
              checked={isInternal}
              onChange={(e) => setIsInternal(e.target.checked)}
              className={s.internalCheckbox}
            />
            <span>შიდა ჩანაწერი</span>
          </label>
        </div>
        <div className={`${s.composerBox} ${isInternal ? s.composerBoxInternal : ""}`}>
          <textarea
            className={s.composerTextarea}
            placeholder={isInternal ? "შიდა ჩანაწერი (კლიენტს არ ჩანს)…" : "შეტყობინება კლიენტს…"}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={3}
            disabled={sending || uploading}
          />
          <div className={s.composerActions}>
            <input
              ref={fileInputRef}
              type="file"
              className={s.hiddenFileInput}
              onChange={handleFileChange}
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.zip"
            />
            <button
              type="button"
              className={s.attachBtn}
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              title="ფაილის მიმაგრება"
            >
              {uploading ? "⏳" : "📎"}
            </button>
            <button
              type="button"
              className={s.sendBtn}
              onClick={handleSend}
              disabled={!text.trim() || sending}
            >
              {sending ? "…" : "გაგზავნა"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

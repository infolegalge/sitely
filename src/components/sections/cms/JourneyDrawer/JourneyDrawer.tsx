"use client";

import { useState, useCallback, useMemo } from "react";
import { useAnalytics } from "../AnalyticsProvider/AnalyticsProvider";
import { EVENT_LABELS, formatDate } from "@/lib/analytics-utils";
import s from "./JourneyDrawer.module.css";

export default function JourneyDrawer() {
  const {
    selectedCompanyId,
    journey,
    notes,
    journeyLoading,
    selectCompany,
    addNote,
    allLeads,
  } = useAnalytics();

  const [activeTab, setActiveTab] = useState<"journey" | "notes">("journey");
  const [noteBody, setNoteBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const open = !!selectedCompanyId;

  const company = useMemo(
    () => allLeads.find((l) => l.company_id === selectedCompanyId) ?? null,
    [allLeads, selectedCompanyId]
  );

  const handleClose = useCallback(() => selectCompany(null), [selectCompany]);

  const handleAddNote = useCallback(async () => {
    if (!selectedCompanyId || !noteBody.trim()) return;
    setSubmitting(true);
    await addNote(selectedCompanyId, noteBody.trim());
    setNoteBody("");
    setSubmitting(false);
  }, [selectedCompanyId, noteBody, addNote]);

  return (
    <>
      {/* Overlay */}
      <div
        className={open ? s.overlayOpen : s.overlay}
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside
        className={open ? s.drawerOpen : s.drawer}
        aria-label="კომპანიის ჯორნი"
        aria-hidden={!open}
      >
        <div className={s.header}>
          <h2 className={s.companyName}>{company?.name ?? "..."}</h2>
          <button
            type="button"
            className={s.closeBtn}
            onClick={handleClose}
            aria-label="დახურვა"
          >
            ✕
          </button>
        </div>

        <div className={s.tabs} role="tablist" aria-label="ჯორნის ტაბები">
          <button
            className={activeTab === "journey" ? s.tabActive : s.tab}
            onClick={() => setActiveTab("journey")}
            role="tab"
            aria-selected={activeTab === "journey"}
            aria-controls="panel-journey"
          >
            ტაიმლაინი ({journey.length})
          </button>
          <button
            className={activeTab === "notes" ? s.tabActive : s.tab}
            onClick={() => setActiveTab("notes")}
            role="tab"
            aria-selected={activeTab === "notes"}
            aria-controls="panel-notes"
          >
            შენიშვნები ({notes.length})
          </button>
        </div>

        <div className={s.body}>
          {journeyLoading ? (
            <p className={s.loading}>იტვირთება...</p>
          ) : activeTab === "journey" ? (
            /* ── Timeline ── */
            <div id="panel-journey" role="tabpanel" aria-label="ტაიმლაინი">
            journey.length === 0 ? (
              <p className={s.empty}>ჯერ ივენთები არ არის</p>
            ) : (
              <div className={s.timeline}>
                {journey.map((ev, i) => (
                  <div
                    key={i}
                    className={ev.is_main_site ? s.eventMainSite : undefined}
                  >
                    <div className={s.event}>
                      <div className={s.eventType}>
                        {EVENT_LABELS[ev.event_type] ?? ev.event_type}
                      </div>
                      <div className={s.eventMeta}>
                        {ev.section_name && (
                          <span className={s.eventSection}>{ev.section_name}</span>
                        )}
                        {ev.is_main_site && (
                          <span className={s.eventMainSiteTag}>Main Site</span>
                        )}
                        {ev.duration_ms != null && (
                          <span>{Math.round(ev.duration_ms / 1000)}წმ</span>
                        )}
                        {ev.scroll_depth != null && (
                          <span>{ev.scroll_depth}%</span>
                        )}
                        <span className={s.eventTime}>{formatDate(ev.created_at)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
            </div>
          ) : (
            /* ── Notes ── */
            <div id="panel-notes" role="tabpanel" aria-label="შენიშვნები">
              <div className={s.noteForm}>
                <textarea
                  className={s.noteTextarea}
                  placeholder="დაამატე შენიშვნა..."
                  value={noteBody}
                  onChange={(e) => setNoteBody(e.target.value)}
                />
                <button
                  className={s.noteSubmit}
                  disabled={!noteBody.trim() || submitting}
                  onClick={handleAddNote}
                >
                  {submitting ? "..." : "დამატება"}
                </button>
              </div>
              <div className={s.notesList}>
                {notes.length === 0 ? (
                  <p className={s.empty}>შენიშვნები არ არის</p>
                ) : (
                  notes.map((n) => (
                    <div key={n.id} className={s.noteCard}>
                      <p className={s.noteBody}>{n.body}</p>
                      <div className={s.noteMeta}>
                        {n.author} · {formatDate(n.created_at)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

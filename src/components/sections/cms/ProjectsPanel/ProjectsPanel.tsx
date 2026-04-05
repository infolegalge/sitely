"use client";

import { useState, useEffect } from "react";
import {
  useProjects,
  type ProposalSnapshot,
  type TimelineStep,
} from "@/components/sections/cms/ProjectsProvider/ProjectsProvider";
import s from "./ProjectsPanel.module.css";

const ALL_STATUSES = [
  { value: "lead_new", label: "ახალი Lead" },
  { value: "lead_negotiating", label: "მოლაპარაკება" },
  { value: "proposal_sent", label: "Proposal გაგზავნილია" },
  { value: "proposal_accepted", label: "თანხმობა — გადახდა მოსალოდნელია" },
  { value: "active_collecting", label: "▶ მასალების შეგროვება" },
  { value: "active_designing", label: "▶ დიზაინი" },
  { value: "active_developing", label: "▶ დეველოპმენტი" },
  { value: "active_review", label: "▶ მიმოხილვა" },
  { value: "completed", label: "✅ დასრულებულია" },
  { value: "cancelled", label: "❌ გაუქმებულია" },
  { value: "lost", label: "❌ Lead დაიკარგა" },
];

const DEFAULT_STEPS = [
  "მასალების შეგროვება",
  "UX/UI დიზაინი",
  "Front-end",
  "Back-end",
  "QA & ტესტირება",
  "გაშვება",
];

// ─── Status Section ────────────────────────────────────────────────────────────

function StatusSection() {
  const { detail, updateStatus } = useProjects();
  const [value, setValue] = useState(detail?.status ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setValue(detail?.status ?? "");
  }, [detail?.status]);

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value;
    setValue(next);
    setSaving(true);
    try {
      await updateStatus(next);
    } finally {
      setSaving(false);
    }
  }

  if (!detail) return null;

  return (
    <section className={s.section}>
      <h3 className={s.sectionTitle}>სტატუსი</h3>
      <div className={s.row}>
        <select
          className={s.select}
          value={value}
          onChange={handleChange}
          disabled={saving}
        >
          {ALL_STATUSES.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        {saving && <span className={s.saving}>…</span>}
      </div>
    </section>
  );
}

// ─── Client Info Section ───────────────────────────────────────────────────────

function ClientInfoSection() {
  const { detail } = useProjects();
  if (!detail) return null;

  const co = detail.companies;

  return (
    <section className={s.section}>
      <h3 className={s.sectionTitle}>კლიენტი</h3>
      <dl className={s.dl}>
        <dt className={s.dt}>კომპანია</dt>
        <dd className={s.dd}>{co?.name ?? "—"}</dd>
        <dt className={s.dt}>სახელი</dt>
        <dd className={s.dd}>{detail.client_name}</dd>
        <dt className={s.dt}>Email</dt>
        <dd className={s.dd}>
          <a href={`mailto:${detail.client_email}`} className={s.link}>{detail.client_email}</a>
        </dd>
        {detail.client_phone && (
          <>
            <dt className={s.dt}>ტელ</dt>
            <dd className={s.dd}>{detail.client_phone}</dd>
          </>
        )}
        {co?.category && (
          <>
            <dt className={s.dt}>კატეგორია</dt>
            <dd className={s.dd}>{co.category}</dd>
          </>
        )}
        {detail.demo_hash && (
          <>
            <dt className={s.dt}>დემო</dt>
            <dd className={s.dd}>
              <a
                href={`/demo/${detail.demo_hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className={s.link}
              >
                იხილეთ დემო →
              </a>
            </dd>
          </>
        )}
      </dl>
    </section>
  );
}

// ─── Notes Section ─────────────────────────────────────────────────────────────

function NotesSection() {
  const { detail, saveNotes } = useProjects();
  const [notes, setNotes] = useState(detail?.admin_notes ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setNotes(detail?.admin_notes ?? "");
  }, [detail?.admin_notes]);

  async function handleSave() {
    setSaving(true);
    try {
      await saveNotes(notes);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  if (!detail) return null;

  return (
    <section className={s.section}>
      <h3 className={s.sectionTitle}>შიდა შენიშვნები</h3>
      <textarea
        className={s.notesTextarea}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={3}
        placeholder="ადმინისტრაციული შენიშვნა…"
      />
      <button
        type="button"
        className={s.btnSecondary}
        onClick={handleSave}
        disabled={saving}
      >
        {saved ? "✓ შენახულია" : saving ? "…" : "შენახვა"}
      </button>
    </section>
  );
}

// ─── Proposal Section ─────────────────────────────────────────────────────────

const BLANK_SNAPSHOT: ProposalSnapshot = {
  title: "ვებ-საიტი",
  price: 0,
  currency: "GEL",
  included: [],
  excluded: [],
  notes: "",
};

function ProposalSection() {
  const { detail, sendProposal, markPaid } = useProjects();
  const [showHistory, setShowHistory] = useState(false);

  const latestProposal = detail?.proposals?.find((p) => p.status === "pending") ??
    detail?.proposals?.[0] ?? null;

  const [snap, setSnap] = useState<ProposalSnapshot>(
    latestProposal?.snapshot ?? BLANK_SNAPSHOT
  );
  const [includedText, setIncludedText] = useState(
    (latestProposal?.snapshot?.included ?? []).join("\n")
  );
  const [excludedText, setExcludedText] = useState(
    (latestProposal?.snapshot?.excluded ?? []).join("\n")
  );
  const [sending, setSending] = useState(false);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    const p = detail?.proposals?.find((x) => x.status === "pending") ?? detail?.proposals?.[0] ?? null;
    if (p) {
      setSnap(p.snapshot);
      setIncludedText((p.snapshot.included ?? []).join("\n"));
      setExcludedText((p.snapshot.excluded ?? []).join("\n"));
    }
  }, [detail?.proposals]);

  async function handleSend() {
    setSending(true);
    try {
      const fullSnap: ProposalSnapshot = {
        ...snap,
        included: includedText.split("\n").map((l) => l.trim()).filter(Boolean),
        excluded: excludedText.split("\n").map((l) => l.trim()).filter(Boolean),
      };
      await sendProposal(fullSnap);
    } finally {
      setSending(false);
    }
  }

  async function handleMarkPaid() {
    if (!window.confirm("გადახდა დაადასტურება?")) return;
    setPaying(true);
    try {
      await markPaid();
    } finally {
      setPaying(false);
    }
  }

  const isPaid = detail?.proposals?.some((p) => p.status === "accepted");

  if (!detail) return null;

  return (
    <section className={s.section}>
      <h3 className={s.sectionTitle}>Proposal</h3>

      {isPaid && (
        <div className={s.paidBanner}>✅ გადახდა დადასტურებულია</div>
      )}

      <label className={s.fieldLabel}>სათაური</label>
      <input
        type="text"
        className={s.input}
        value={snap.title}
        onChange={(e) => setSnap({ ...snap, title: e.target.value })}
      />

      <div className={s.priceRow}>
        <div className={s.priceGroup}>
          <label className={s.fieldLabel}>ფასი</label>
          <input
            type="number"
            className={s.input}
            value={snap.price}
            onChange={(e) => setSnap({ ...snap, price: Number(e.target.value) })}
            min={0}
          />
        </div>
        <div className={s.priceGroup}>
          <label className={s.fieldLabel}>ვალუტა</label>
          <select
            className={s.select}
            value={snap.currency}
            onChange={(e) => setSnap({ ...snap, currency: e.target.value })}
          >
            <option value="GEL">GEL</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
          </select>
        </div>
      </div>

      <label className={s.fieldLabel}>რა შედის (თითო ხაზზე)</label>
      <textarea
        className={s.proposalTextarea}
        rows={4}
        value={includedText}
        onChange={(e) => setIncludedText(e.target.value)}
        placeholder="Responsive Design&#10;3 გვერდი&#10;Contact Form"
      />

      <label className={s.fieldLabel}>რა არ შედის (თითო ხაზზე)</label>
      <textarea
        className={s.proposalTextarea}
        rows={3}
        value={excludedText}
        onChange={(e) => setExcludedText(e.target.value)}
        placeholder="SEO&#10;E-commerce"
      />

      <label className={s.fieldLabel}>შენიშვნა</label>
      <textarea
        className={s.proposalTextarea}
        rows={2}
        value={snap.notes}
        onChange={(e) => setSnap({ ...snap, notes: e.target.value })}
        placeholder="გადახდა: TBC ბანკი…"
      />

      <div className={s.proposalBtns}>
        <button
          type="button"
          className={s.btnPrimary}
          onClick={handleSend}
          disabled={sending}
        >
          {sending ? "…" : "Proposal გაგზავნა"}
        </button>
        {latestProposal && !isPaid && (
          <button
            type="button"
            className={s.btnPaid}
            onClick={handleMarkPaid}
            disabled={paying}
          >
            {paying ? "…" : "✅ გადახდა"}
          </button>
        )}
      </div>

      {/* Proposal history */}
      {(detail?.proposals?.length ?? 0) > 1 && (
        <div className={s.proposalHistory}>
          <button
            type="button"
            className={s.historyToggle}
            onClick={() => setShowHistory(!showHistory)}
          >
            {showHistory ? "▾ ისტორია" : "▸ ისტორია"} ({detail!.proposals.length})
          </button>
          {showHistory && (
            <ul className={s.historyList}>
              {detail!.proposals.map((p) => (
                <li key={p.id} className={s.historyItem}>
                  <span className={`${s.historyStatus} ${s[`history_${p.status}`]}`}>
                    {p.status === "pending" ? "⏳" : p.status === "accepted" ? "✅" : p.status === "rejected" ? "❌" : "⌛"}
                  </span>
                  <span className={s.historyInfo}>
                    {p.snapshot.title} — {p.snapshot.price} {p.snapshot.currency}
                  </span>
                  <span className={s.historyDate}>
                    {new Date(p.created_at).toLocaleDateString("ka-GE")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}

// ─── Timeline Section ─────────────────────────────────────────────────────────

function TimelineSection() {
  const { steps, saveSteps, updateStepStatus, selectedId } = useProjects();
  const [editing, setEditing] = useState(false);
  const [draftTitles, setDraftTitles] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  function startEdit() {
    const titles = steps.length > 0
      ? steps.map((s) => s.title)
      : [...DEFAULT_STEPS];
    setDraftTitles(titles);
    setEditing(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const newSteps = draftTitles
        .map((t) => t.trim())
        .filter(Boolean)
        .map((title, i) => ({
          step_order: i + 1,
          title,
          description: null,
          status: "locked" as const,
        }));
      await saveSteps(newSteps);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleStepToggle(step: TimelineStep) {
    const CYCLE: Record<string, string> = {
      locked: "active",
      active: "completed",
      completed: "locked",
    };
    await updateStepStatus(step.id, CYCLE[step.status] ?? "locked");
  }

  if (!selectedId) return null;

  if (editing) {
    return (
      <section className={s.section}>
        <h3 className={s.sectionTitle}>Timeline რედაქტირება</h3>
        <div className={s.stepsEditor}>
          {draftTitles.map((title, i) => (
            <div key={i} className={s.stepEditorRow}>
              <span className={s.stepEditorNum}>{i + 1}</span>
              <input
                type="text"
                className={s.stepEditorInput}
                value={title}
                onChange={(e) => {
                  const next = [...draftTitles];
                  next[i] = e.target.value;
                  setDraftTitles(next);
                }}
                placeholder={`ეტაპი ${i + 1}`}
              />
              <button
                type="button"
                className={s.stepDeleteBtn}
                onClick={() => setDraftTitles(draftTitles.filter((_, j) => j !== i))}
              >
                ×
              </button>
            </div>
          ))}
          <button
            type="button"
            className={s.btnSecondary}
            onClick={() => setDraftTitles([...draftTitles, ""])}
          >
            + ეტაპის დამატება
          </button>
        </div>
        <div className={s.proposalBtns}>
          <button
            type="button"
            className={s.btnPrimary}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "…" : "შენახვა"}
          </button>
          <button type="button" className={s.btnSecondary} onClick={() => setEditing(false)}>
            გაუქმება
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className={s.section}>
      <div className={s.sectionHeader}>
        <h3 className={s.sectionTitle}>Timeline</h3>
        <button type="button" className={s.editLink} onClick={startEdit}>
          რედაქტირება
        </button>
      </div>
      {steps.length === 0 ? (
        <p className={s.noSteps}>ეტაპები არ არის. <button type="button" className={s.editLink} onClick={startEdit}>შექმნა</button></p>
      ) : (
        <ul className={s.stepsList}>
          {steps.map((step) => (
            <li key={step.id} className={s.stepItem}>
              <button
                type="button"
                className={`${s.stepDot} ${s[`stepDot_${step.status}`]}`}
                onClick={() => handleStepToggle(step)}
                title="სტატუსის შეცვლა"
              />
              <span className={`${s.stepTitle} ${step.status === "completed" ? s.stepTitleDone : ""}`}>
                {step.title}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// ─── Delete Section ────────────────────────────────────────────────────────────

function DeleteSection() {
  const { detail, deleteProject } = useProjects();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (!detail) return null;

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteProject();
    } finally {
      setDeleting(false);
      setConfirming(false);
    }
  }

  return (
    <section className={s.section}>
      <h3 className={s.sectionTitle}>საშიში ზონა</h3>
      {!confirming ? (
        <button
          type="button"
          className={s.btnDanger}
          onClick={() => setConfirming(true)}
        >
          კაბინეტის წაშლა
        </button>
      ) : (
        <div className={s.confirmDelete}>
          <p className={s.confirmText}>
            წაიშლება კაბინეტი, მესიჯები, ფაილები და Proposal. კლიენტს აღარ ექნება წვდომა. გაგრძელება?
          </p>
          <div className={s.confirmBtns}>
            <button
              type="button"
              className={s.btnDanger}
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "…" : "დიახ, წაშლა"}
            </button>
            <button
              type="button"
              className={s.btnSecondary}
              onClick={() => setConfirming(false)}
              disabled={deleting}
            >
              გაუქმება
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

// ─── Main Panel ────────────────────────────────────────────────────────────────

const TABS = [
  { key: "info", label: "ინფო" },
  { key: "proposal", label: "Proposal" },
  { key: "timeline", label: "Timeline" },
  { key: "notes", label: "შენიშვნები" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function ProjectsPanel() {
  const { selectedId } = useProjects();
  const [tab, setTab] = useState<TabKey>("info");

  if (!selectedId) {
    return <aside className={s.panel} />;
  }

  return (
    <aside className={s.panel}>
      <nav className={s.tabs}>
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            className={`${s.tab} ${tab === t.key ? s.tabActive : ""}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </nav>
      <div className={s.scroll}>
        {tab === "info" && (
          <>
            <StatusSection />
            <ClientInfoSection />
            <DeleteSection />
          </>
        )}
        {tab === "proposal" && <ProposalSection />}
        {tab === "timeline" && <TimelineSection />}
        {tab === "notes" && <NotesSection />}
      </div>
    </aside>
  );
}

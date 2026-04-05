"use client";

import { useState } from "react";
import { useWizard } from "@/components/sections/cms/WizardProvider/WizardProvider";
import s from "./DemoWizard.module.css";

const STEPS = ["შაბლონი", "კომპანიები", "Preview", "შეთავაზება & მეილი", "შედეგი"];

export default function DemoWizard() {
  const ctx = useWizard();

  return (
    <div className={s.wizard}>
      <div className={s.stepper}>
        {STEPS.map((label, i) => (
          <div
            key={i}
            className={`${s.stepItem} ${ctx.step === i + 1 ? s.active : ""} ${ctx.step > i + 1 ? s.done : ""}`}
          >
            <span className={s.stepNum}>{i + 1}</span>
            <span className={s.stepLabel}>{label}</span>
          </div>
        ))}
      </div>

      <div className={s.body}>
        {ctx.step === 1 && <Step1 />}
        {ctx.step === 2 && <Step2 />}
        {ctx.step === 3 && <Step3 />}
        {ctx.step === 4 && <Step4Offer />}
        {ctx.step === 5 && <Step5Results />}
      </div>
    </div>
  );
}

/* ── Step 1: Select Template ── */
function Step1() {
  const { templates, selectTemplate } = useWizard();

  return (
    <div>
      <h2 className={s.stepTitle}>აირჩიეთ შაბლონი</h2>
      <div className={s.templateGrid}>
        {templates.map((t) => (
          <button key={t.id} className={s.templateCard} onClick={() => selectTemplate(t)}>
            <div className={s.templateThumb}>
              {t.thumbnail_url ? (
                <img src={t.thumbnail_url} alt={t.name} />
              ) : (
                <span className={s.templatePlaceholder}>{t.industry}</span>
              )}
            </div>
            <div className={s.templateName}>{t.name}</div>
            <div className={s.templateIndustry}>{t.industry}</div>
          </button>
        ))}
        {templates.length === 0 && (
          <p className={s.empty}>შაბლონები არ მოიძებნა. ჯერ შექმენით შაბლონი.</p>
        )}
      </div>
    </div>
  );
}

/* ── Step 2: Select Companies ── */

const STATUS_OPTIONS = [
  { value: "", label: "ყველა სტატუსი" },
  { value: "lead", label: "ახალი" },
  { value: "locked", label: "მუშავდება" },
  { value: "demo_ready", label: "დემო მზადაა" },
  { value: "contacted", label: "კონტაქტირებული" },
  { value: "engaged", label: "ჩართული" },
  { value: "converted", label: "კონვერტირებული" },
  { value: "dnc", label: "DNC" },
];

const TIER_OPTIONS = [
  { value: "", label: "ყველა Tier" },
  { value: "1", label: "Tier 1 — HOT" },
  { value: "2", label: "Tier 2" },
  { value: "3", label: "Tier 3" },
  { value: "4", label: "Tier 4" },
  { value: "5", label: "Tier 5" },
  { value: "6", label: "Tier 6" },
  { value: "7", label: "Tier 7" },
];

const TOGGLE_OPTIONS = [
  { value: "", label: "ყველა" },
  { value: "true", label: "აქვს" },
  { value: "false", label: "არ აქვს" },
];

function Step2() {
  const {
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
    setStep,
  } = useWizard();

  const totalPages = Math.ceil(companiesTotal / 50);
  const hasActiveFilters = Object.values(filters).some((v) => v !== "");

  return (
    <div>
      <h2 className={s.stepTitle}>აირჩიეთ კომპანიები</h2>

      <div className={s.filterBar}>
        <input
          className={s.filterInput}
          placeholder="ძებნა... (სახელი, მისამართი, კატეგორია)"
          value={filters.q}
          onChange={(e) => setFilter("q", e.target.value)}
        />
      </div>

      <div className={s.filterBar}>
        <select className={s.filterSelect} value={filters.tier} onChange={(e) => setFilter("tier", e.target.value)}>
          {TIER_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <select className={s.filterSelect} value={filters.status} onChange={(e) => setFilter("status", e.target.value)}>
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <select className={s.filterSelect} value={filters.category} onChange={(e) => setFilter("category", e.target.value)}>
          <option value="">ყველა კატეგორია</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select className={s.filterSelect} value={filters.source_category} onChange={(e) => setFilter("source_category", e.target.value)}>
          <option value="">ყველა წყარო კატეგორია</option>
          {sourceCategories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select className={s.filterSelect} value={filters.has_email} onChange={(e) => setFilter("has_email", e.target.value)}>
          <option value="">Email: ყველა</option>
          {TOGGLE_OPTIONS.slice(1).map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <select className={s.filterSelect} value={filters.has_website} onChange={(e) => setFilter("has_website", e.target.value)}>
          <option value="">Website: ყველა</option>
          {TOGGLE_OPTIONS.slice(1).map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        {hasActiveFilters && (
          <button className={s.filterReset} onClick={resetFilters}>გასუფთავება</button>
        )}
      </div>

      <div className={s.selectionBar}>
        <span className={s.selCount}>{selectedIds.size} არჩეული</span>
        <span className={s.totalCount}>{companiesTotal.toLocaleString()} კომპანია</span>
        <button className={s.selBtn} onClick={selectAllFiltered}>ყველას მონიშვნა</button>
        <button className={s.selBtn} onClick={clearSelection}>გაუქმება</button>
        <button
          className={s.nextBtn}
          disabled={selectedIds.size === 0}
          onClick={() => setStep(3)}
        >
          შემდეგი →
        </button>
      </div>

      {companiesLoading ? (
        <div className={s.loading}>იტვირთება...</div>
      ) : (
        <table className={s.companyTable}>
          <thead>
            <tr>
              <th></th>
              <th>სახელი</th>
              <th>კატეგორია</th>
              <th>Tier</th>
              <th>Email</th>
              <th>რეიტინგი</th>
            </tr>
          </thead>
          <tbody>
            {companies.map((c) => (
              <tr
                key={c.id}
                className={selectedIds.has(c.id) ? s.selected : ""}
                onClick={() => toggleCompany(c.id)}
              >
                <td>
                  <input type="checkbox" checked={selectedIds.has(c.id)} readOnly />
                </td>
                <td>{c.name}</td>
                <td>{c.category || "—"}</td>
                <td>{c.tier || "—"}</td>
                <td>{c.email || "—"}</td>
                <td>{c.rating || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {totalPages > 1 && (
        <div className={s.pagination}>
          <button disabled={companiesPage <= 1} onClick={() => setCompaniesPage(companiesPage - 1)}>←</button>
          <span>{companiesPage} / {totalPages}</span>
          <button disabled={companiesPage >= totalPages} onClick={() => setCompaniesPage(companiesPage + 1)}>→</button>
        </div>
      )}
    </div>
  );
}

/* ── Step 3: Preview & Review ── */
function Step3() {
  const {
    companies,
    selectedIds,
    previewCompanyId,
    setPreviewCompanyId,
    excludeCompany,
    selectedTemplate,
    setStep,
  } = useWizard();

  const selectedCompanies = companies.filter((c) => selectedIds.has(c.id));

  return (
    <div>
      <h2 className={s.stepTitle}>Preview & Review</h2>
      <div className={s.previewLayout}>
        <div className={s.previewList}>
          <div className={s.previewListHeader}>
            <span>{selectedIds.size} კომპანია</span>
          </div>
          {selectedCompanies.map((c) => (
            <div
              key={c.id}
              className={`${s.previewItem} ${previewCompanyId === c.id ? s.previewActive : ""}`}
              onClick={() => setPreviewCompanyId(c.id)}
            >
              <div className={s.previewName}>{c.name}</div>
              <div className={s.previewMeta}>{c.email || c.phone || "—"}</div>
              <button
                className={s.excludeBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  excludeCompany(c.id);
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <div className={s.previewFrame}>
          {previewCompanyId && selectedTemplate ? (
            <iframe
              src={`/api/demos/preview/${previewCompanyId}/${selectedTemplate.id}`}
              className={s.iframe}
              title="Demo Preview"
            />
          ) : (
            <div className={s.previewPlaceholder}>
              აირჩიეთ კომპანია preview-სთვის
            </div>
          )}
        </div>
      </div>
      <div className={s.previewActions}>
        <button className={s.backBtn} onClick={() => setStep(2)}>← უკან</button>
        <button
          className={s.generateBtn}
          disabled={selectedIds.size === 0}
          onClick={() => setStep(4)}
        >
          შემდეგი: შეთავაზება & მეილი →
        </button>
      </div>
    </div>
  );
}

/* ── Step 4: Offer & Email Text ── */
function Step4Offer() {
  const {
    offerDraft,
    setOfferDraft,
    customEmailText,
    setCustomEmailText,
    batchName,
    setBatchName,
    generating,
    generate,
    selectedIds,
    setStep,
  } = useWizard();

  const [enableOffer, setEnableOffer] = useState(!!offerDraft);
  const [price, setPrice] = useState(offerDraft?.price?.toString() || "");
  const [currency, setCurrency] = useState(offerDraft?.currency || "GEL");
  const [title, setTitle] = useState(offerDraft?.title || "");
  const [included, setIncluded] = useState(offerDraft?.included?.join("\n") || "");
  const [excluded, setExcluded] = useState(offerDraft?.excluded?.join("\n") || "");
  const [notes, setNotes] = useState(offerDraft?.notes || "");

  const handleGenerate = () => {
    const offer = enableOffer
      ? {
          price: Number(price) || 0,
          currency,
          title,
          included: included.split("\n").map((l) => l.trim()).filter(Boolean),
          excluded: excluded.split("\n").map((l) => l.trim()).filter(Boolean),
          notes,
        }
      : null;
    setOfferDraft(offer);
    generate({ offer, emailText: customEmailText });
  };

  return (
    <div>
      <h2 className={s.stepTitle}>შეთავაზება & მეილის ტექსტი</h2>
      <p className={s.stepDesc}>
        არჩეულია {selectedIds.size} კომპანია. შეავსეთ შეთავაზება (არასავალდებულო) და მეილის ტექსტი.
      </p>

      <div className={s.offerSection}>
        <label className={s.offerToggle}>
          <input
            type="checkbox"
            checked={enableOffer}
            onChange={(e) => setEnableOffer(e.target.checked)}
          />
          <span>შეთავაზების მიმაგრება (Claim-ის შემდეგ კაბინეტში ავტომატურად გამოჩნდება)</span>
        </label>

        {enableOffer && (
          <div className={s.offerFields}>
            <div className={s.offerRow}>
              <div className={s.offerField}>
                <label>სათაური</label>
                <input
                  className={s.offerInput}
                  placeholder="მაგ: სტანდარტი პაკეტი"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className={s.offerField}>
                <label>ფასი</label>
                <input
                  className={s.offerInput}
                  type="number"
                  placeholder="500"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>
              <div className={s.offerField}>
                <label>ვალუტა</label>
                <select
                  className={s.offerInput}
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                >
                  <option value="GEL">GEL</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
            </div>

            <div className={s.offerField}>
              <label>რა შედის (თითო ხაზზე)</label>
              <textarea
                className={s.offerTextarea}
                rows={4}
                placeholder={"3D დიზაინი\nმობილური ადაპტაცია\n5 გვერდი"}
                value={included}
                onChange={(e) => setIncluded(e.target.value)}
              />
            </div>
            <div className={s.offerField}>
              <label>რა არ შედის (თითო ხაზზე)</label>
              <textarea
                className={s.offerTextarea}
                rows={3}
                placeholder={"SEO ოპტიმიზაცია\nბლოგის სისტემა"}
                value={excluded}
                onChange={(e) => setExcluded(e.target.value)}
              />
            </div>
            <div className={s.offerField}>
              <label>დამატებითი შენიშვნა</label>
              <input
                className={s.offerInput}
                placeholder="არასავალდებულო"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
        )}
      </div>

      <div className={s.emailSection}>
        <h3 className={s.sectionTitle}>ბაჩის სახელი</h3>
        <p className={s.sectionHint}>
          ეს ჯგუფი გამოჩნდება ბაჩების ანალიტიკაში. ცარიელი დატოვებისას ავტომატურად დაგენერირდება.
        </p>
        <input
          className={s.offerInput}
          placeholder="მაგ: სტომატოლოგიები — აპრილი 2026"
          value={batchName}
          onChange={(e) => setBatchName(e.target.value)}
        />
      </div>

      <div className={s.emailSection}>
        <h3 className={s.sectionTitle}>მეილის ტექსტი</h3>
        <p className={s.sectionHint}>
          ცარიელი დატოვების შემთხვევაში სტანდარტული ტექსტი გაიგზავნება.
        </p>
        <textarea
          className={s.emailTextarea}
          rows={5}
          placeholder="მაგ: გამარჯობა! ჩვენ შევქმენით სპეციალური 3D ვერსია თქვენი ბიზნესისთვის. ნახეთ..."
          value={customEmailText}
          onChange={(e) => setCustomEmailText(e.target.value)}
        />
      </div>

      <div className={s.previewActions}>
        <button className={s.backBtn} onClick={() => setStep(3)}>← უკან</button>
        <button
          className={s.generateBtn}
          disabled={generating || selectedIds.size === 0}
          onClick={handleGenerate}
        >
          {generating ? "გენერირდება..." : `გენერირება (${selectedIds.size})`}
        </button>
      </div>
    </div>
  );
}

/* ── Step 5: Results ── */
function Step5Results() {
  const { generated } = useWizard();
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [sendResult, setSendResult] = useState<{ sent: number; skipped: number } | null>(null);

  const copyAll = () => {
    const urls = generated.map((d) => `${window.location.origin}${d.url}`).join("\n");
    navigator.clipboard.writeText(urls);
  };

  const handleSendEmails = async () => {
    const withEmail = generated.filter((d) => d.id);
    if (withEmail.length === 0) return;
    if (!confirm(`გაგზავნოთ ${withEmail.length} მეილი?`)) return;
    setSending(true);
    try {
      const res = await fetch("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ demo_ids: withEmail.map((d) => d.id) }),
      });
      if (res.ok) {
        const data = await res.json();
        setSendResult(data);
        setSent(true);
      } else {
        const err = await res.json();
        alert(err.error || "შეცდომა");
      }
    } catch {
      alert("შეცდომა");
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <h2 className={s.stepTitle}>✓ გენერირება დასრულდა</h2>
      <p className={s.resultSummary}>{generated.length} დემო შეიქმნა</p>

      <div className={s.resultActions}>
        <button className={s.copyAllBtn} onClick={copyAll}>ყველა URL-ის კოპირება</button>
        {!sent ? (
          <button
            className={s.sendAllBtn}
            onClick={handleSendEmails}
            disabled={sending || generated.length === 0}
          >
            {sending ? "იგზავნება..." : `✉ მეილის გაგზავნა (${generated.length})`}
          </button>
        ) : (
          <span className={s.sentBadge}>
            ✓ {sendResult?.sent || 0} მეილი გაიგზავნა
          </span>
        )}
      </div>

      <div className={s.resultList}>
        {generated.map((d) => (
          <div key={d.id} className={s.resultRow}>
            <span className={s.resultUrl}>{window.location.origin}{d.url}</span>
            <button
              className={s.copyBtn}
              onClick={() => navigator.clipboard.writeText(`${window.location.origin}${d.url}`)}
            >
              კოპირება
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

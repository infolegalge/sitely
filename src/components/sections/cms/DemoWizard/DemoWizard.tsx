"use client";

import { useWizard } from "@/components/sections/cms/WizardProvider/WizardProvider";
import s from "./DemoWizard.module.css";

const STEPS = ["შაბლონი", "კომპანიები", "Preview", "შედეგი"];

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
        {ctx.step === 4 && <Step4 />}
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
  { value: "new", label: "ახალი" },
  { value: "contacted", label: "კონტაქტირებული" },
  { value: "viewed", label: "ნანახი" },
  { value: "interested", label: "დაინტერესებული" },
  { value: "negotiating", label: "მოლაპარაკება" },
  { value: "converted", label: "კონვერტირებული" },
  { value: "rejected", label: "უარყოფილი" },
  { value: "not_relevant", label: "არარელევანტური" },
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
    generating,
    generate,
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
          disabled={generating || selectedIds.size === 0}
          onClick={generate}
        >
          {generating ? "გენერირდება..." : `გენერირება (${selectedIds.size})`}
        </button>
      </div>
    </div>
  );
}

/* ── Step 4: Results ── */
function Step4() {
  const { generated } = useWizard();

  const copyAll = () => {
    const urls = generated.map((d) => `${window.location.origin}${d.url}`).join("\n");
    navigator.clipboard.writeText(urls);
  };

  return (
    <div>
      <h2 className={s.stepTitle}>✓ გენერირება დასრულდა</h2>
      <p className={s.resultSummary}>{generated.length} დემო შეიქმნა</p>
      <button className={s.copyAllBtn} onClick={copyAll}>ყველა URL-ის კოპირება</button>
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

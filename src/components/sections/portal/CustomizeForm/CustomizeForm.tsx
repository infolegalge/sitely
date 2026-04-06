"use client";

import { useState } from "react";
import s from "./CustomizeForm.module.css";

/* ------------------------------------------------------------------ */
/*  Data - business language, not tech jargon                         */
/* ------------------------------------------------------------------ */

const FEATURES = [
  {
    id: "shop",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 01-8 0" />
      </svg>
    ),
    label: "პროდუქტების გაყიდვა",
    desc: "ონლაინ მაღაზია, კალათა, გადახდა",
  },
  {
    id: "booking",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
    label: "ჯავშნების მიღება",
    desc: "ონლაინ დაჯავშნა, კალენდარი",
  },
  {
    id: "blog",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 19l7-7 3 3-7 7-3-3z" />
        <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
        <path d="M2 2l7.586 7.586" />
        <circle cx="11" cy="11" r="2" />
      </svg>
    ),
    label: "სიახლეები / ბლოგი",
    desc: "სტატიები, კონტენტის გამოქვეყნება",
  },
  {
    id: "cms",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    ),
    label: "კონტენტის თავად მართვა",
    desc: "ტექსტი, ფოტოები, ფასები შეცვალოთ",
  },
  {
    id: "multilang",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10A15.3 15.3 0 0112 2z" />
      </svg>
    ),
    label: "სხვა ენებზეც იმუშაოს",
    desc: "ინგლისური, რუსული და სხვა",
  },
  {
    id: "chat",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
      </svg>
    ),
    label: "ონლაინ ჩატი",
    desc: "კლიენტებთან ცოცხალი კომუნიკაცია",
  },
  {
    id: "design",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
    ),
    label: "სრულად ახალი დიზაინი",
    desc: "არა შაბლონი, უნიკალური იერსახე",
  },
  {
    id: "other",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="16" />
        <line x1="8" y1="12" x2="16" y2="12" />
      </svg>
    ),
    label: "სხვა",
    desc: "აღწერეთ ქვემოთ",
  },
];

const BUDGETS = [
  { value: "1000-2000", label: "1,000 - 2,000 GEL" },
  { value: "2000-5000", label: "2,000 - 5,000 GEL" },
  { value: "5000+", label: "5,000 GEL+" },
  { value: "unsure", label: "ჯერ არ ვარ დარწმუნებული" },
];

const TIMELINES = [
  { value: "standard", label: "სტანდარტული", desc: "2-4 კვირა" },
  { value: "urgent", label: "სასწრაფო", desc: "1-2 კვირა" },
  { value: "flexible", label: "მოქნილი", desc: "არ მეჩქარება" },
];

const CALL_TIMES = [
  { value: "morning", label: "დილა", desc: "10:00 - 13:00" },
  { value: "afternoon", label: "შუადღე", desc: "13:00 - 17:00" },
  { value: "evening", label: "საღამო", desc: "17:00 - 20:00" },
];

type ViewState = "form" | "submitting" | "done" | "error";

interface CustomizeFormProps {
  projectId: string;
  onSubmitted?: () => void;
}

export default function CustomizeForm({ projectId, onSubmitted }: CustomizeFormProps) {
  const [step, setStep] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [otherText, setOtherText] = useState("");
  const [budget, setBudget] = useState("");
  const [timeline, setTimeline] = useState("");
  const [phone, setPhone] = useState("");
  const [callTime, setCallTime] = useState("");
  const [note, setNote] = useState("");
  const [viewState, setViewState] = useState<ViewState>("form");
  const [errorMsg, setErrorMsg] = useState("");

  function toggleFeature(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSubmit() {
    if (selected.size === 0) return;
    setViewState("submitting");

    try {
      const res = await fetch("/api/portal/customize-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          features: Array.from(selected),
          otherText: selected.has("other") ? otherText : null,
          budget: budget || null,
          timeline: timeline || null,
          phone: phone || null,
          callTime: callTime || null,
          note: note || null,
        }),
      });

      if (res.ok) {
        setViewState("done");
        onSubmitted?.();
      } else {
        const data = await res.json().catch(() => ({}));
        setErrorMsg(data.error || "შეცდომა. სცადეთ თავიდან.");
        setViewState("error");
      }
    } catch {
      setErrorMsg("კავშირის შეცდომა. სცადეთ თავიდან.");
      setViewState("error");
    }
  }

  /* ── Done state ── */
  if (viewState === "done") {
    return (
      <div className={s.doneWrap}>
        <div className={s.doneOrb}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <p className={s.doneTitle}>მოთხოვნა მიღებულია</p>
        <p className={s.doneDesc}>
          ჩვენი გუნდი გადახედავს თქვენს მოთხოვნებს, შეადგენს
          ინდივიდუალურ ხარჯთაღრიცხვას და დაგიკავშირდებათ პირადად.
        </p>
        <div className={s.doneSteps}>
          <div className={s.doneStep}>
            <span className={s.doneStepDot} />
            ხარჯთაღრიცხვის შედგენა
          </div>
          <div className={s.doneStep}>
            <span className={s.doneStepDot} />
            პირადი კონსულტაცია
          </div>
          <div className={s.doneStep}>
            <span className={s.doneStepDot} />
            თაიმლაინის შეთანხმება
          </div>
        </div>
      </div>
    );
  }

  /* ── Step 1: Features ── */
  if (step === 1) {
    return (
      <div className={s.wizard}>
        {/* Progress */}
        <div className={s.progress}>
          <div className={s.progressBar}>
            <div className={s.progressFill} style={{ width: "50%" }} />
          </div>
          <span className={s.progressText}>1 / 2</span>
        </div>

        <div className={s.stepHeader}>
          <p className={s.stepLabel}>
            <span className={s.stepLabelLine} />
            ნაბიჯი 1
            <span className={s.stepLabelLineR} />
          </p>
          <h3 className={s.stepTitle}>
            რა უნდა გააკეთოს <span className={s.stepTitleGrad}>თქვენმა საიტმა?</span>
          </h3>
          <p className={s.stepDesc}>აირჩიეთ ყველა, რაც გჭირდებათ</p>
        </div>

        <div className={s.featureGrid}>
          {FEATURES.map((f) => (
            <button
              key={f.id}
              type="button"
              className={`${s.featureCard} ${selected.has(f.id) ? s.featureCardActive : ""}`}
              onClick={() => toggleFeature(f.id)}
            >
              <span className={s.featureIcon}>{f.icon}</span>
              <span className={s.featureLabel}>{f.label}</span>
              <span className={s.featureDesc}>{f.desc}</span>
              <span className={s.featureCheck}>
                {selected.has(f.id) && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </span>
            </button>
          ))}
        </div>

        {selected.has("other") && (
          <input
            type="text"
            className={s.otherInput}
            placeholder="აღწერეთ რა გჭირდებათ..."
            value={otherText}
            onChange={(e) => setOtherText(e.target.value)}
            maxLength={200}
          />
        )}

        <button
          type="button"
          className={s.nextBtn}
          disabled={selected.size === 0}
          onClick={() => setStep(2)}
        >
          <span className={s.btnContent}>
            შემდეგი
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </span>
        </button>
      </div>
    );
  }

  /* ── Step 2: Budget, timeline, contact ── */
  return (
    <div className={s.wizard}>
      {/* Progress */}
      <div className={s.progress}>
        <div className={s.progressBar}>
          <div className={s.progressFill} style={{ width: "100%" }} />
        </div>
        <span className={s.progressText}>2 / 2</span>
      </div>

      <button type="button" className={s.backStepBtn} onClick={() => setStep(1)}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        უკან
      </button>

      <div className={s.stepHeader}>
        <p className={s.stepLabel}>
          <span className={s.stepLabelLine} />
          ნაბიჯი 2
          <span className={s.stepLabelLineR} />
        </p>
        <h3 className={s.stepTitle}>
          <span className={s.stepTitleGrad}>დეტალები</span> და კონტაქტი
        </h3>
      </div>

      {/* Budget */}
      <div className={s.fieldBlock}>
        <p className={s.fieldLabel}>საორიენტაციო ბიუჯეტი</p>
        <div className={s.pillGroup}>
          {BUDGETS.map((b) => (
            <button
              key={b.value}
              type="button"
              className={`${s.pill} ${budget === b.value ? s.pillActive : ""}`}
              onClick={() => setBudget(b.value)}
            >
              {b.label}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div className={s.fieldBlock}>
        <p className={s.fieldLabel}>სასურველი ვადა</p>
        <div className={s.pillGroup}>
          {TIMELINES.map((t) => (
            <button
              key={t.value}
              type="button"
              className={`${s.pill} ${timeline === t.value ? s.pillActive : ""}`}
              onClick={() => setTimeline(t.value)}
            >
              <span>{t.label}</span>
              <span className={s.pillSub}>{t.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Phone */}
      <div className={s.fieldBlock}>
        <p className={s.fieldLabel}>ტელეფონის ნომერი</p>
        <input
          type="tel"
          className={s.textInput}
          placeholder="5XX XXX XXX"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          maxLength={20}
        />
      </div>

      {/* Preferred call time */}
      <div className={s.fieldBlock}>
        <p className={s.fieldLabel}>როდის დაგირეკოთ?</p>
        <div className={s.pillGroup}>
          {CALL_TIMES.map((ct) => (
            <button
              key={ct.value}
              type="button"
              className={`${s.pill} ${callTime === ct.value ? s.pillActive : ""}`}
              onClick={() => setCallTime(ct.value)}
            >
              <span>{ct.label}</span>
              <span className={s.pillSub}>{ct.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Note */}
      <div className={s.fieldBlock}>
        <p className={s.fieldLabel}>
          დამატებითი კომენტარი
          <span className={s.optionalTag}>არასავალდებულო</span>
        </p>
        <textarea
          className={s.textArea}
          rows={3}
          placeholder="რაიმე რაც გვინდა ვიცოდეთ..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={500}
        />
      </div>

      {viewState === "error" && <p className={s.errorText}>{errorMsg}</p>}

      <button
        type="button"
        className={s.submitBtn}
        disabled={selected.size === 0 || viewState === "submitting"}
        onClick={handleSubmit}
      >
        <span className={s.btnContent}>
          {viewState === "submitting" ? "იგზავნება..." : "გაგზავნა"}
        </span>
        <span className={s.btnShimmer} />
      </button>
    </div>
  );
}

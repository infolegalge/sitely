"use client";

import { useState } from "react";
import s from "./CustomizeForm.module.css";

const FEATURES = [
  { id: "shop", label: "🛒 ონლაინ მაღაზია" },
  { id: "booking", label: "📅 ჯავშნების სისტემა" },
  { id: "blog", label: "✍️ ბლოგი" },
  { id: "design", label: "🎨 სრულიად განსხვავებული დიზაინი" },
  { id: "other", label: "💡 სხვა" },
];

const BUDGETS = [
  { value: "1000-2000", label: "1,000 – 2,000 ₾" },
  { value: "2000-5000", label: "2,000 – 5,000 ₾" },
  { value: "5000+", label: "5,000 ₾+" },
];

type State = "form" | "submitting" | "done" | "error";

interface CustomizeFormProps {
  projectId: string;
}

export default function CustomizeForm({ projectId }: CustomizeFormProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [budget, setBudget] = useState("");
  const [state, setState] = useState<State>("form");
  const [errorMsg, setErrorMsg] = useState("");

  function toggleFeature(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (selected.size === 0) return;
    setState("submitting");

    try {
      const res = await fetch("/api/portal/customize-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          features: Array.from(selected),
          budget: budget || null,
        }),
      });

      if (res.ok) {
        setState("done");
      } else {
        const data = await res.json().catch(() => ({}));
        setErrorMsg(data.error || "შეცდომა. სცადეთ თავიდან.");
        setState("error");
      }
    } catch {
      setErrorMsg("კავშირის შეცდომა. სცადეთ თავიდან.");
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <div className={s.doneWrap}>
        <div className={s.doneIcon}>✨</div>
        <p className={s.doneTitle}>შესანიშნავია!</p>
        <p className={s.doneDesc}>
          თქვენი მოთხოვნები ინდივიდუალურ მიდგომას საჭიროებს. დაჯავშნეთ 15-წუთიანი
          უფასო კონსულტაცია ჩვენს ექსპერტთან — შეგიდგენთ ზუსტ ხარჯთაღრიცხვას.
        </p>
        <a
          href="mailto:hello@sitely.ge?subject=კონსულტაცია"
          className={s.callBtn}
        >
          📞 დაჯავშნე ზარი
        </a>
      </div>
    );
  }

  return (
    <form className={s.form} onSubmit={handleSubmit}>
      <div className={s.questionBlock}>
        <p className={s.questionLabel}>რა ფუნქციონალი გჭირდებათ?</p>
        <div className={s.checkGrid}>
          {FEATURES.map((f) => (
            <button
              key={f.id}
              type="button"
              className={`${s.checkItem} ${selected.has(f.id) ? s.checkItemActive : ""}`}
              onClick={() => toggleFeature(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className={s.questionBlock}>
        <p className={s.questionLabel}>ბიუჯეტის მოლოდინი</p>
        <div className={s.radioGroup}>
          {BUDGETS.map((b) => (
            <button
              key={b.value}
              type="button"
              className={`${s.radioItem} ${budget === b.value ? s.radioItemActive : ""}`}
              onClick={() => setBudget(b.value)}
            >
              {b.label}
            </button>
          ))}
        </div>
      </div>

      {state === "error" && <p className={s.errorText}>{errorMsg}</p>}

      <button
        type="submit"
        className={s.submitBtn}
        disabled={selected.size === 0 || state === "submitting"}
      >
        {state === "submitting" ? "იგზავნება..." : "→ გაგზავნა"}
      </button>
    </form>
  );
}

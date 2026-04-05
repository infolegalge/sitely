"use client";

import { useActionState, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { onboardAction } from "@/app/onboard/actions";
import s from "./OnboardForm.module.css";

interface CompanyInfo {
  name: string;
  email: string;
  phone: string;
}

export default function OnboardForm() {
  const searchParams = useSearchParams();
  const ref = searchParams.get("ref") || "";
  const [company, setCompany] = useState<CompanyInfo | null>(null);
  const [state, formAction, isPending] = useActionState(onboardAction, null);

  useEffect(() => {
    if (!ref) return;
    fetch(`/api/companies/by-ref?ref=${encodeURIComponent(ref)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setCompany(data);
      })
      .catch(() => {});
  }, [ref]);

  if (state?.success) {
    return (
      <section className={s.wrapper}>
        <div className={s.card}>
          <div className={s.successWrap}>
            <div className={s.successIcon}>✉️</div>
            <h2 className={s.successTitle}>ლინკი გამოგზავნილია!</h2>
            <p className={s.successText}>
              შეამოწმეთ თქვენი ელ-ფოსტა. ლინკი მოქმედებს 30 წუთის განმავლობაში.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={s.wrapper}>
      <div className={s.card}>
        <p className={s.logo}>sitely.ge</p>
        <h1 className={s.title}>მოითხოვეთ ვებსაიტი</h1>
        <p className={s.subtitle}>
          შეავსეთ ფორმა და მიიღეთ წვდომა თქვენს პორტალზე
        </p>

        {company?.name && (
          <span className={s.companyBadge}>{company.name}</span>
        )}

        <form className={s.form} action={formAction}>
          <input type="hidden" name="ref" value={ref} />

          <label className={s.label} htmlFor="onboard-name">
            სახელი *
          </label>
          <input
            id="onboard-name"
            className={s.input}
            type="text"
            name="name"
            required
            maxLength={200}
            defaultValue={company?.name || ""}
            key={`name-${company?.name || ""}`}
            placeholder="თქვენი სახელი"
          />

          <label className={s.label} htmlFor="onboard-email">
            ელ-ფოსტა *
          </label>
          <input
            id="onboard-email"
            className={s.input}
            type="email"
            name="email"
            required
            maxLength={200}
            defaultValue={company?.email || ""}
            key={`email-${company?.email || ""}`}
            placeholder="your@email.com"
          />

          <label className={s.label} htmlFor="onboard-phone">
            ტელეფონი
          </label>
          <input
            id="onboard-phone"
            className={s.input}
            type="tel"
            name="phone"
            maxLength={50}
            defaultValue={company?.phone || ""}
            key={`phone-${company?.phone || ""}`}
            placeholder="+995 5XX XXX XXX"
          />

          <label className={s.label} htmlFor="onboard-message">
            დამატებითი ინფორმაცია
          </label>
          <textarea
            id="onboard-message"
            className={s.textarea}
            name="message"
            maxLength={1000}
            placeholder="რა ტიპის ვებსაიტი გსურთ?"
          />

          {state?.error && (
            <p className={s.error} role="alert">
              {state.error}
            </p>
          )}

          <button className={s.submit} disabled={isPending} type="submit">
            {isPending ? "იგზავნება..." : "გაგზავნა"}
          </button>
        </form>
      </div>
    </section>
  );
}

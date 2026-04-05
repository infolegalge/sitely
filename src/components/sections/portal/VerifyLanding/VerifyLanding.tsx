"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import s from "./VerifyLanding.module.css";

export default function VerifyLanding() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [error, setError] = useState<string | null>(null);
  const activatedRef = useRef(false);

  useEffect(() => {
    if (!token || activatedRef.current) return;
    activatedRef.current = true;

    fetch("/api/auth/activate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          // Full page reload so browser picks up Set-Cookie headers
          window.location.href = "/portal";
        } else {
          setError(data.error || "შეცდომა. სცადეთ თავიდან.");
        }
      })
      .catch(() => setError("კავშირის შეცდომა. სცადეთ თავიდან."));
  }, [token]);

  if (!token) {
    return (
      <section className={s.wrapper}>
        <div className={s.card}>
          <div className={s.icon}>⚠️</div>
          <h1 className={s.expiredTitle}>არასწორი ბმული</h1>
          <p className={s.expiredText}>ეს ბმული არასწორია ან ვადაგასულია.</p>
          <a href="/portal/login" className={s.retryBtn}>ახალი ლინკის მოთხოვნა</a>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className={s.wrapper}>
        <div className={s.card}>
          <div className={s.icon}>⚠️</div>
          <h1 className={s.expiredTitle}>შეცდომა</h1>
          <p className={s.expiredText}>{error}</p>
          <a href="/portal/login" className={s.retryBtn}>ახალი ლინკის მოთხოვნა</a>
        </div>
      </section>
    );
  }

  return (
    <section className={s.wrapper}>
      <div className={s.card}>
        <div className={s.icon}>🔐</div>
        <h1 className={s.title}>მიმდინარეობს შესვლა...</h1>
        <p className={s.subtitle}>გთხოვთ მოიცადოთ</p>
      </div>
    </section>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import s from "./ForgotPassword.module.css";

type State = "idle" | "loading" | "sent" | "error";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<State>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setState("loading");

    try {
      const res = await fetch("/api/portal/reset-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      if (res.ok) {
        setState("sent");
      } else {
        const data = await res.json();
        setErrorMsg(data.error || "შეცდომა. სცადეთ თავიდან.");
        setState("error");
      }
    } catch {
      setErrorMsg("კავშირის შეცდომა. სცადეთ თავიდან.");
      setState("error");
    }
  }

  return (
    <div className={s.page}>
      <div className={s.card}>
        <p className={s.logo}>Sitely</p>

        {state === "sent" ? (
          <div className={s.success}>
            <span className={s.successIcon}>✉️</span>
            <p className={s.successTitle}>ლინკი გამოგზავნილია!</p>
            <p className={s.successDesc}>
              შეამოწმეთ ელ-ფოსტა <strong>{email}</strong> — გამოვგზავნეთ
              პაროლის აღდგენის ლინკი.
            </p>
          </div>
        ) : (
          <>
            <h1 className={s.heading}>პაროლის აღდგენა</h1>
            <p className={s.sub}>
              შეიყვანეთ ელ-ფოსტა — გამოვგზავნით პაროლის აღდგენის ლინკს.
            </p>

            <form className={s.form} onSubmit={handleSubmit}>
              <input
                className={s.input}
                type="email"
                placeholder="თქვენი@მეილი.ge"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                maxLength={254}
                autoFocus
                autoComplete="email"
              />
              <button
                className={s.btn}
                type="submit"
                disabled={state === "loading"}
              >
                {state === "loading" ? "ვაგზავნით..." : "→ აღდგენის ლინკის გაგზავნა"}
              </button>
            </form>

            {state === "error" && (
              <p className={s.errorMsg}>{errorMsg}</p>
            )}
          </>
        )}

        <Link href="/portal/login" className={s.backLink}>
          ← უკან შესვლაზე
        </Link>
      </div>
    </div>
  );
}

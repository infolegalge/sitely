"use client";

import { useState } from "react";
import s from "./PortalLogin.module.css";

type State = "idle" | "loading" | "sent" | "error";

export default function PortalLogin() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<State>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setState("loading");

    try {
      const res = await fetch("/api/portal/reauth", {
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
              შესასვლელი ლინკი. შეინახეთ სასურველ ადგილას.
            </p>
          </div>
        ) : (
          <>
            <h1 className={s.heading}>კაბინეტში შესვლა</h1>
            <p className={s.sub}>
              შეიყვანეთ ელ-ფოსტა — გამოვგზავნით შესასვლელ ლინკს.
              პაროლი არ გჭირდებათ.
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
                {state === "loading" ? "ვაგზავნით..." : "→ შესასვლელი ლინკის გაგზავნა"}
              </button>
            </form>

            {state === "error" && (
              <p className={s.errorMsg}>{errorMsg}</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

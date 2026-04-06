"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import s from "./PortalLogin.module.css";

type State = "idle" | "loading" | "error";

export default function PortalLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [state, setState] = useState<State>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setState("loading");

    try {
      const res = await fetch("/api/portal/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        window.location.href = "/portal";
      } else {
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

        <h1 className={s.heading}>კაბინეტში შესვლა</h1>
        <p className={s.sub}>
          შეიყვანეთ ელ-ფოსტა და პაროლი.
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
          <input
            className={s.input}
            type="password"
            placeholder="პაროლი"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            autoComplete="current-password"
          />
          <button
            className={s.btn}
            type="submit"
            disabled={state === "loading"}
          >
            {state === "loading" ? "შესვლა..." : "→ შესვლა"}
          </button>
        </form>

        {state === "error" && (
          <p className={s.errorMsg}>{errorMsg}</p>
        )}

        <Link href="/portal/forgot-password" className={s.forgotLink}>
          დაგავიწყდათ პაროლი?
        </Link>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import s from "./SetPassword.module.css";

interface SetPasswordProps {
  token: string;
}

type State = "idle" | "loading" | "error";

export default function SetPassword({ token }: SetPasswordProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [state, setState] = useState<State>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (password.length < 6) {
      setErrorMsg("პაროლი მინიმუმ 6 სიმბოლო უნდა იყოს.");
      setState("error");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("პაროლები არ ემთხვევა.");
      setState("error");
      return;
    }

    setState("loading");

    try {
      const res = await fetch("/api/auth/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
        credentials: "include",
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
    <section className={s.wrapper}>
      <div className={s.card}>
        <div className={s.icon}>🔑</div>
        <h1 className={s.title}>დააყენეთ პაროლი</h1>
        <p className={s.subtitle}>
          შემდეგ შესვლებისთვის გამოიყენეთ ეს პაროლი თქვენს მეილთან ერთად.
        </p>

        <form className={s.form} onSubmit={handleSubmit}>
          <input
            className={s.input}
            type="password"
            placeholder="პაროლი (მინ. 6 სიმბოლო)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            autoFocus
            autoComplete="new-password"
          />
          <input
            className={s.input}
            type="password"
            placeholder="გაიმეორეთ პაროლი"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
          />
          <button
            className={s.btn}
            type="submit"
            disabled={state === "loading"}
          >
            {state === "loading" ? "მიმდინარეობს..." : "→ პაროლის დაყენება"}
          </button>
        </form>

        {state === "error" && (
          <p className={s.errorMsg}>{errorMsg}</p>
        )}
      </div>
    </section>
  );
}

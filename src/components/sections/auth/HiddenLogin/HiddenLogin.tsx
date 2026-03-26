"use client";

import { useActionState } from "react";
import { loginAction } from "@/app/secure-access/login/actions";
import s from "./HiddenLogin.module.css";

export default function HiddenLogin() {
  const [state, formAction, isPending] = useActionState(loginAction, null);

  return (
    <section className={s.wrapper} aria-label="Super Admin login">
      <div className={s.card}>
        <p className={s.badge}>Super Admin</p>
        <h1 className={s.title}>Welcome back</h1>
        <p className={s.subtitle}>Admin-only access. Unauthorized entry is prohibited.</p>

        <form className={s.form} action={formAction}>
          <label className={s.label} htmlFor="hidden-login-email">
            Email
          </label>
          <input
            id="hidden-login-email"
            className={s.input}
            type="email"
            name="email"
            autoComplete="email"
            required
            placeholder="you@company.com"
          />

          <label className={s.label} htmlFor="hidden-login-password">
            Password
          </label>
          <input
            id="hidden-login-password"
            className={s.input}
            type="password"
            name="password"
            autoComplete="current-password"
            required
            placeholder="Your password"
          />

          {state?.error ? (
            <p className={s.error} role="alert">
              {state.error}
            </p>
          ) : null}

          <button className={s.submit} disabled={isPending} type="submit">
            {isPending ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </section>
  );
}

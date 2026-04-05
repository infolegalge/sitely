"use client";

import { useState, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import s from "./ContactForm.module.css";

const DEMO_KEY = "sitely_demo_id";

type Status = "idle" | "sending" | "success" | "error";

export default function ContactForm() {
  const searchParams = useSearchParams();

  const demoId = useMemo(() => {
    const fromUrl = searchParams.get("demo_id");
    if (fromUrl) {
      try { sessionStorage.setItem(DEMO_KEY, fromUrl); } catch {}
      return fromUrl;
    }
    try { return sessionStorage.getItem(DEMO_KEY); } catch {}
    return null;
  }, [searchParams]);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!name.trim() || !phone.trim() || !email.trim()) return;

      setStatus("sending");
      setErrorMsg("");

      try {
        const res = await fetch("/api/portal/claim", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            demo_id: demoId,
            name: name.trim(),
            phone: phone.trim(),
            email: email.trim(),
          }),
        });

        const data = await res.json();

        if (data.success) {
          setStatus("success");
          setMaskedEmail(data.email ?? "");
          try { sessionStorage.removeItem(DEMO_KEY); } catch {}
        } else {
          setStatus("error");
          setErrorMsg(data.error ?? "შეცდომა. სცადეთ თავიდან.");
        }
      } catch {
        setStatus("error");
        setErrorMsg("კავშირის შეცდომა. სცადეთ თავიდან.");
      }
    },
    [name, phone, email, demoId]
  );

  if (status === "success") {
    return (
      <div className={s.successCard}>
        <div className={s.checkIcon}>✉️</div>
        <h3 className={s.successTitle}>ლინკი გამოგზავნილია!</h3>
        <p className={s.successText}>
          შესასვლელი ლინკი გამოვგზავნეთ მისამართზე{" "}
          <strong>{maskedEmail}</strong>. შეამოწმეთ ელ-ფოსტა.
        </p>
      </div>
    );
  }

  return (
    <form className={s.form} onSubmit={handleSubmit}>
      <div className={s.field}>
        <label className={s.label} htmlFor="cf-name">
          სახელი და გვარი
        </label>
        <input
          className={s.input}
          id="cf-name"
          type="text"
          placeholder="მაგ. გიორგი გიორგაძე"
          maxLength={200}
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      <div className={s.field}>
        <label className={s.label} htmlFor="cf-phone">
          ტელეფონის ნომერი
        </label>
        <input
          className={s.input}
          id="cf-phone"
          type="tel"
          placeholder="+995 5XX XX XX XX"
          maxLength={50}
          autoComplete="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
        />
      </div>

      <div className={s.field}>
        <label className={s.label} htmlFor="cf-email">
          ელ-ფოსტა
        </label>
        <input
          className={s.input}
          id="cf-email"
          type="email"
          placeholder="თქვენი@მეილი.ge"
          maxLength={254}
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      {status === "error" && <p className={s.error}>{errorMsg}</p>}

      <button
        className={s.submit}
        type="submit"
        disabled={status === "sending"}
      >
        {status === "sending" ? "ვაგზავნით..." : "გაგზავნა →"}
      </button>
    </form>
  );
}

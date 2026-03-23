"use client";

import { useEffect, useRef, useState } from "react";
import type React from "react";
import { isAlreadyLoaded, markLoaded } from "@/lib/preloaderState";
import s from "./Preloader.module.css";

export default function Preloader() {
  const [show, setShow] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (isAlreadyLoaded()) return;
    setShow(true);

    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = requestAnimationFrame(() => {
        setProgress(70);
      });
    });

    const timer = setTimeout(() => {
      setProgress(100);
      setTimeout(() => {
        setDone(true);
        markLoaded();
      }, 400);
    }, 2000);

    return () => {
      cancelAnimationFrame(rafRef.current);
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (!done) return;
    const id = setTimeout(() => setShow(false), 700);
    return () => clearTimeout(id);
  }, [done]);

  if (!show) return null;

  return (
    <div className={s.overlay} data-done={String(done)} aria-hidden="true">
      <span className={`grad-text ${s.logo}`}>sitely</span>
      <div className={s.track}>
        <div
          className={`grad-primary ${s.bar}`}
          data-state={progress === 0 ? 'idle' : progress < 100 ? 'loading' : 'done'}
          style={{ '--progress': `${progress}%` } as React.CSSProperties}
        />
      </div>
      <span className={s.label}>Loading experience...</span>
    </div>
  );
}

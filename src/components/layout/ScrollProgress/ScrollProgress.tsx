"use client";

import { useScrollProgress } from "@/hooks/useScrollProgress";
import s from "./ScrollProgress.module.css";

export default function ScrollProgress() {
  const progress = useScrollProgress();

  return (
    <div
      className={s.bar}
      style={{ width: `${progress * 100}%` }}
    />
  );
}

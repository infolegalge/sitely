"use client";

import { useEffect, useCallback } from "react";
import { X } from "lucide-react";
import s from "./CmsModal.module.css";

interface CmsModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  wide?: boolean;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

export default function CmsModal({
  open,
  onClose,
  title,
  wide = false,
  footer,
  children,
}: CmsModalProps) {
  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (!open) return;
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [open, handleKey]);

  if (!open) return null;

  return (
    <div className={s.overlay} onClick={onClose}>
      <div
        className={`${s.modal} ${wide ? s.wide : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className={s.header}>
            <h2 className={s.title}>{title}</h2>
            <button className={s.closeBtn} onClick={onClose} aria-label="Close">
              <X size={18} />
            </button>
          </div>
        )}
        <div className={s.body}>{children}</div>
        {footer && <div className={s.footer}>{footer}</div>}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { usePortal } from "@/components/sections/portal/PortalProvider/PortalProvider";
import CustomizeForm from "@/components/sections/portal/CustomizeForm/CustomizeForm";
import s from "./OfferPanel.module.css";

type View = "initial" | "customize";

interface OfferPanelProps {
  onAccept: () => void;
  onReject: () => void;
  responding: boolean;
  responseError: string | null;
}

function formatCurrency(amount: number, currency: string): string {
  return `${amount.toLocaleString("ka-GE")} ${currency === "GEL" ? "₾" : currency}`;
}

export default function OfferPanel({ onAccept, onReject, responding, responseError }: OfferPanelProps) {
  const { company, project, proposal } = usePortal();
  const [view, setView] = useState<View>("initial");

  if (!project || !proposal) return null;

  const isAccepted = project.status === "proposal_accepted";
  const canRespond = project.status === "proposal_sent" && proposal.status === "pending";
  const isExpired = proposal.status === "expired";

  /* ── Accepted state ── */
  if (isAccepted) {
    return (
      <div className={s.panel}>
        <div className={s.successWrap}>
          <div className={s.successIcon}>🎉</div>
          <h2 className={s.successTitle}>გილოცავთ!</h2>
          <p className={s.successDesc}>
            შეთანხმება დადასტურებულია. ჩვენი გუნდი მალე დაგიკავშირდებათ
            დომენის და ჰოსტინგის დეტალებზე.
          </p>
          <div className={s.nextSteps}>
            <p className={s.nextStepsLabel}>შემდეგი ნაბიჯები:</p>
            <ul className={s.nextStepsList}>
              <li>ადმინი ადასტურებს გადახდას</li>
              <li>გუნდი იწყებს მუშაობას</li>
              <li>საიტი ინტერნეტში 7 დღეში</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  /* ── Expired state ── */
  if (isExpired) {
    return (
      <div className={s.panel}>
        <div className={s.expiredWrap}>
          <div className={s.expiredIcon}>⏰</div>
          <p className={s.expiredTitle}>შეთავაზების ვადა ამოიწურა</p>
          <p className={s.expiredDesc}>დაგვიკავშირდით ახალი შეთავაზებისთვის.</p>
        </div>
      </div>
    );
  }

  /* ── Customize view ── */
  if (view === "customize") {
    return (
      <div className={s.panel}>
        <button className={s.backBtn} onClick={() => setView("initial")} type="button">
          ← უკან
        </button>
        <h2 className={s.customizeTitle}>რა გჭირდებათ?</h2>
        <p className={s.customizeDesc}>
          მონიშნეთ სასურველი ფუნქციები და შეგიდგენთ ინდივიდუალურ შეთავაზებას.
        </p>
        <CustomizeForm projectId={project.id} />
      </div>
    );
  }

  /* ── Initial offer view ── */
  return (
    <div className={s.panel}>
      <div className={s.offerHeader}>
        <span className={s.readyBadge}>✨ მზადაა</span>
        <h2 className={s.offerTitle}>თქვენი ვებსაიტი მზადაა!</h2>
        <p className={s.offerDesc}>
          აიღეთ ზუსტად ეს ვერსია და საიტი ინტერნეტში 7 დღეში ჩაეშვება.
        </p>
      </div>

      <div className={s.priceBlock}>
        <span className={s.priceValue}>
          {formatCurrency(proposal.snapshot.price, proposal.snapshot.currency)}
        </span>
        <span className={s.priceLabel}>{proposal.snapshot.title}</span>
      </div>

      {proposal.snapshot.included.length > 0 && (
        <ul className={s.includeList}>
          {proposal.snapshot.included.map((item, i) => (
            <li key={i} className={s.includeItem}>
              <span className={s.includeCheck}>✓</span>
              {item}
            </li>
          ))}
        </ul>
      )}

      {canRespond && (
        <div className={s.actions}>
          {responseError && <p className={s.errorText}>{responseError}</p>}
          <button
            type="button"
            className={s.acceptBtn}
            onClick={onAccept}
            disabled={responding}
          >
            <span className={s.acceptShimmer} />
            {responding ? "…" : `ავიღებ ამ ვერსიას — ${formatCurrency(proposal.snapshot.price, proposal.snapshot.currency)}`}
          </button>
          <button
            type="button"
            className={s.customizeBtn}
            onClick={() => setView("customize")}
            disabled={responding}
          >
            მჭირდება კასტომიზაცია / მეტი ფუნქცია
          </button>
          <button
            type="button"
            className={s.rejectBtn}
            onClick={onReject}
            disabled={responding}
          >
            არ მაწყობს
          </button>
        </div>
      )}
    </div>
  );
}

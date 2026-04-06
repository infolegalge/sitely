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
  const { company, project, proposal, hasCustomizeRequest, refetch } = usePortal();
  const [view, setView] = useState<View>("initial");

  if (!project || !proposal) return null;

  const isAccepted = project.status === "proposal_accepted";
  const isRejected = proposal.status === "rejected";
  const canRespond = project.status === "proposal_sent" && proposal.status === "pending";
  const isExpired = proposal.status === "expired";

  /* ── Accepted state ── */
  if (isAccepted) {
    return (
      <div className={s.panel}>
        <div className={s.sceneWrap}>
          <div className={s.ambientGlow} />
          <div className={s.gridFloor} />
        </div>
        <div className={s.content}>
          <div className={s.successWrap}>
            <div className={s.successOrb}>
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <path d="M6 17L13 24L26 8" stroke="url(#sGrad)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                <defs><linearGradient id="sGrad" x1="6" y1="8" x2="26" y2="24"><stop stopColor="#06d6a0"/><stop offset="1" stopColor="#4f6ef7"/></linearGradient></defs>
              </svg>
            </div>
            <h2 className={s.successTitle}>გილოცავთ!</h2>
            <p className={s.successDesc}>
              შეთანხმება დადასტურებულია. ჩვენი გუნდი მალე დაგიკავშირდებათ.
            </p>
            <div className={s.stepsCard}>
              <span className={s.stepsLabel}>შემდეგი ნაბიჯები</span>
              <div className={s.stepRow}><span className={s.stepDot} /><span>ადმინი ადასტურებს გადახდას</span></div>
              <div className={s.stepRow}><span className={s.stepDot} /><span>გუნდი იწყებს მუშაობას</span></div>
              <div className={s.stepRow}><span className={s.stepDot} /><span>საიტი ინტერნეტში 7 დღეში</span></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── Expired state ── */
  if (isExpired) {
    return (
      <div className={s.panel}>
        <div className={s.sceneWrap}>
          <div className={s.ambientGlow} />
          <div className={s.gridFloor} />
        </div>
        <div className={s.content}>
          <div className={s.expiredWrap}>
            <div className={s.expiredOrb}>!</div>
            <p className={s.expiredTitle}>შეთავაზების ვადა ამოიწურა</p>
            <p className={s.expiredDesc}>დაგვიკავშირდით ახალი შეთავაზებისთვის.</p>
          </div>
        </div>
      </div>
    );
  }

  /* ── Rejected + customize request sent = awaiting custom offer ── */
  /* Also covers: proposal still "pending" but customize request already sent */
  if (hasCustomizeRequest && !isAccepted) {
    return (
      <div className={s.panel}>
        <div className={s.sceneWrap}>
          <div className={s.ambientGlow} />
          <div className={s.gridFloor} />
        </div>
        <div className={s.content}>
          <div className={s.pendingWrap}>
            <div className={s.pendingOrb}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <span className={s.sectionLabel}>
              <span className={s.labelLine} />
              მუშავდება
              <span className={s.labelLineR} />
            </span>
            <h2 className={s.pendingTitle}>
              ვამზადებთ <span className={s.titleGradient}>ინდივიდუალურ</span> შეთავაზებას
            </h2>
            <p className={s.pendingDesc}>
              თქვენი მოთხოვნა მიღებულია. ჩვენი გუნდი გადახედავს
              დეტალებს და დაგიკავშირდებათ პირადად.
            </p>
            <div className={s.pendingTimeline}>
              <div className={s.pendingStep}>
                <span className={s.pendingStepDotDone}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
                <span className={s.pendingStepTextDone}>მოთხოვნა მიღებულია</span>
              </div>
              <div className={s.pendingStepLine} />
              <div className={s.pendingStep}>
                <span className={s.pendingStepDotActive} />
                <span className={s.pendingStepTextActive}>პირადი კონსულტაცია</span>
              </div>
              <div className={s.pendingStepLine} />
              <div className={s.pendingStep}>
                <span className={s.pendingStepDotLocked} />
                <span>ხარჯთაღრიცხვის შედგენა</span>
              </div>
              <div className={s.pendingStepLine} />
              <div className={s.pendingStep}>
                <span className={s.pendingStepDotLocked} />
                <span>ახალი შეთავაზება</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── Rejected without customize request ── */
  if (isRejected) {
    return (
      <div className={s.panel}>
        <div className={s.sceneWrap}>
          <div className={s.ambientGlow} />
          <div className={s.gridFloor} />
        </div>
        <div className={s.content}>
          <div className={s.pendingWrap}>
            <div className={s.pendingOrb}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
            </div>
            <h2 className={s.pendingTitle}>შეთავაზება უარყოფილია</h2>
            <p className={s.pendingDesc}>
              გსურთ სხვა მიმართულებით წავიდეთ? მოგვწერეთ ჩატში ან
              დაგვიკავშირდით და შევადგენთ ახალ წინადადებას.
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* ── Customize view ── */
  if (view === "customize") {
    return (
      <div className={s.panel}>
        <div className={s.sceneWrap}>
          <div className={s.ambientGlow} />
          <div className={s.gridFloor} />
        </div>
        <div className={s.content}>
          <button className={s.backBtn} onClick={() => setView("initial")} type="button">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 4L6 8L10 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            უკან
          </button>
          <h2 className={s.customizeTitle}>რა გჭირდებათ?</h2>
          <p className={s.customizeDesc}>
            მონიშნეთ სასურველი ფუნქციები და შეგიდგენთ ინდივიდუალურ შეთავაზებას.
          </p>
          <CustomizeForm projectId={project.id} onSubmitted={refetch} />
        </div>
      </div>
    );
  }

  /* ── Initial offer view ── */
  const price = formatCurrency(proposal.snapshot.price, proposal.snapshot.currency);

  return (
    <div className={s.panel}>
      {/* Ambient background */}
      <div className={s.sceneWrap}>
        <div className={s.ambientGlow} />
        <div className={s.gridFloor} />
        <div className={s.noiseOverlay} />
      </div>

      <div className={s.content}>
        {/* Flanked label */}
        <div className={s.offerHeader}>
          <span className={s.sectionLabel}>
            <span className={s.labelLine} />
            <span>მზადაა გასაშვებად</span>
            <span className={s.labelLineR} />
          </span>
          <h2 className={s.offerTitle}>
            თქვენი ვებსაიტი <span className={s.titleGradient}>მზადაა!</span>
          </h2>
          <p className={s.offerDesc}>
            აიღეთ ეს ვერსია და საიტი ინტერნეტში 7 დღეში ჩაეშვება.
          </p>
        </div>

        {/* 3D Price card with holographic border */}
        <div className={s.priceCardWrap}>
          <div className={s.holoGlow} />
          <div className={s.priceCard}>
            <div className={s.cardShimmer} />
            <div className={s.priceTop}>
              <span className={s.priceValue}>{price}</span>
              <span className={s.pricePeriod}>ერთჯერადი</span>
            </div>
            <span className={s.priceLabel}>{proposal.snapshot.title}</span>
            <div className={s.priceDivider} />
            <p className={s.priceNote}>
              <span className={s.noteIcon} />
              საიტი ინტერნეტში 7 დღეში
            </p>
          </div>
        </div>

        {/* Features */}
        {proposal.snapshot.included.length > 0 && (
          <div className={s.featureBlock}>
            <span className={s.featureBlockTitle}>რა შედის</span>
            <ul className={s.featureList}>
              {proposal.snapshot.included.map((item, i) => (
                <li key={i} className={s.featureItem}>
                  <span className={s.featureDot}>
                    <span className={s.featureDotInner} />
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Actions */}
        {canRespond && (
          <div className={s.actions}>
            {responseError && <p className={s.errorText}>{responseError}</p>}

            {/* Accept — solid gradient CTA */}
            <button
              type="button"
              className={s.acceptBtn}
              onClick={onAccept}
              disabled={responding}
            >
              <span className={s.btnShimmer} />
              <span className={s.btnContent}>
                {responding ? "იტვირთება..." : `ავიღებ — ${price}`}
              </span>
            </button>

            {/* Customize — recommended */}
            <div className={s.customizeWrap}>
              <div className={s.recommendStrip}>
                <span className={s.recommendDot} />
                რეკომენდირებული — კლიენტთა 80% ირჩევს
              </div>
              <button
                type="button"
                className={s.customizeBtn}
                onClick={() => setView("customize")}
                disabled={responding}
              >
                <span className={s.btnShimmer} />
                <span className={s.btnContent}>
                  მეტი ფუნქცია / კასტომიზაცია
                </span>
              </button>
            </div>

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
    </div>
  );
}

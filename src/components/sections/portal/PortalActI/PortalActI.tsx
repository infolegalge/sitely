"use client";

import { useState, useEffect, useRef, lazy, Suspense } from "react";
import { usePortal } from "@/components/sections/portal/PortalProvider/PortalProvider";
import type { TimelineStep } from "@/components/sections/portal/PortalProvider/PortalProvider";
import PortalChat from "@/components/sections/portal/PortalChat/PortalChat";
import OfferPanel from "@/components/sections/portal/OfferPanel/OfferPanel";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import s from "./PortalActI.module.css";

const PortalCanvas = lazy(() => import("@/components/portal/PortalCanvas/PortalCanvas"));

/* ─── Types ─── */
type NavKey = "overview" | "proposal" | "chat" | "demo" | "progress" | "offer";
interface NavItem { key: NavKey; icon: string; label: string }

const BASE_NAV: NavItem[] = [
  { key: "overview", icon: "⬡", label: "მიმოხილვა" },
  { key: "proposal", icon: "◆", label: "შეთავაზება" },
  { key: "chat", icon: "◈", label: "ჩატი" },
  { key: "demo", icon: "◎", label: "დემო" },
];

/* ─── Process roadmap (always visible in overview) ─── */
const PROCESS_STEPS = [
  { icon: "01", title: "მოთხოვნის მიღება", desc: "თქვენი მოთხოვნა რეგისტრირდება სისტემაში" },
  { icon: "02", title: "შეთავაზების მომზადება", desc: "ინდივიდუალური შეთავაზება თქვენს საჭიროებებზე" },
  { icon: "03", title: "დიზაინი & დეველოპმენტი", desc: "ვქმნით თქვენს ვებსაიტს სრული დეტალურობით" },
  { icon: "04", title: "ტესტირება & გაშვება", desc: "ხარისხის კონტროლი და საიტის პუბლიკაცია" },
];

/* ─── Status helpers ─── */
function getStatusInfo(status: string) {
  const map: Record<string, { headline: string; body: string; accent: string; step: number; nextAction: string }> = {
    lead_new: {
      headline: "მიღებულია!",
      body: "თქვენი მოთხოვნა მივიღეთ. ჩვენი გუნდი მოამზადებს შეთავაზებას და მალე დაგიკავშირდებათ.",
      accent: "blue", step: 0,
      nextAction: "გუნდი განიხილავს თქვენს მოთხოვნას და მოამზადებს ინდივიდუალურ შეთავაზებას.",
    },
    lead_negotiating: {
      headline: "მოლაპარაკების სტადიაში",
      body: "ვმუშაობთ თქვენს ინდივიდუალურ შეთავაზებაზე.",
      accent: "violet", step: 1,
      nextAction: "ადმინი მალე გამოგიგზავნით დეტალურ შეთავაზებას. შეამოწმეთ «შეთავაზება» ტაბი.",
    },
    proposal_sent: {
      headline: "შეთავაზება მზადაა",
      body: "გთხოვთ გაეცნოთ შეთავაზებას.",
      accent: "gold", step: 1,
      nextAction: "გადადით «შეთავაზება» ტაბზე, გაეცანით დეტალებს და დააჭირეთ «ვეთანხმები».",
    },
    proposal_accepted: {
      headline: "შეთავაზება მიღებულია",
      body: "გმადლობთ! მალე დავიწყებთ მუშაობას.",
      accent: "cyan", step: 2,
      nextAction: "გადახდის შემდეგ ადმინი დაადასტურებს თანხის მიღებას და დავიწყებთ მუშაობას.",
    },
  };
  return map[status] ?? { headline: "კეთილი იყოს მობრძანება", body: "ადმინი მალე დაგიკავშირდებათ.", accent: "blue", step: 0, nextAction: "" };
}

function formatCurrency(amount: number, currency: string): string {
  return `${amount.toLocaleString("ka-GE")} ${currency === "GEL" ? "₾" : currency}`;
}

function daysSince(dateStr: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000));
}

/* ─── GSAP entrance hook ─── */
function useGsapEntrance(containerRef: React.RefObject<HTMLElement | null>, trigger?: unknown) {
  useEffect(() => {
    if (!containerRef.current) return;
    let ctx: { revert: () => void } | undefined;

    (async () => {
      try {
        const { gsap } = await import("gsap");
        const elements = containerRef.current?.querySelectorAll("[data-rv]");
        if (!elements?.length) return;

        ctx = gsap.context(() => {
          gsap.fromTo(
            elements,
            { y: 28, opacity: 0 },
            {
              y: 0, opacity: 1,
              duration: 0.7,
              stagger: 0.06,
              ease: "power3.out",
              delay: 0.1,
            },
          );
        }, containerRef.current!);
      } catch { /* gsap not available */ }
    })();

    return () => ctx?.revert();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerRef, trigger]);
}

/* ─── Timeline step ─── */
function Step({ step, isLast }: { step: TimelineStep; isLast: boolean }) {
  const isDone = step.status === "completed";
  const isActive = step.status === "active";
  return (
    <div className={s.stepWrap}>
      <div className={s.stepLeft}>
        <div className={isDone ? s.stepDotDone : isActive ? s.stepDotActive : s.stepDotLocked}>
          {isDone ? "✓" : step.step_order}
        </div>
        {!isLast && <div className={isDone ? s.stepLineDone : s.stepLine} />}
      </div>
      <div className={s.stepBody}>
        <p className={isDone ? s.stepTitleDone : isActive ? s.stepTitleActive : s.stepTitleLocked}>
          {step.title}
        </p>
        {step.description && <p className={s.stepDesc}>{step.description}</p>}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PortalActI — Pre-Sale Client Portal
   ═══════════════════════════════════════════════════════════════ */
export default function PortalActI() {
  const { company, project, proposal, steps } = usePortal();
  const [activeNav, setActiveNav] = useState<NavKey>("overview");
  const [responding, setResponding] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [responseError, setResponseError] = useState<string | null>(null);
  const [expandedStep, setExpandedStep] = useState<string | null>(null);
  const [demoDevice, setDemoDevice] = useState<"desktop" | "mobile">("desktop");
  const mainRef = useRef<HTMLDivElement>(null);

  useGsapEntrance(mainRef, activeNav);

  if (!project) return null;

  const status = getStatusInfo(project.status);
  const hasProposal = proposal && (project.status === "proposal_sent" || project.status === "proposal_accepted");
  const canRespond = proposal && project.status === "proposal_sent" && proposal.status === "pending";
  const isAccepted = project.status === "proposal_accepted";
  const isExpired = proposal?.status === "expired";
  const projectAge = daysSince(project.created_at);

  // When proposal_sent/accepted + demo exists → merge proposal+demo into one "offer" tab
  const showSplitView = hasProposal && !!project.demo_hash;

  // Default to offer tab when split view is available
  const [hasNavigated, setHasNavigated] = useState(false);
  useEffect(() => {
    if (showSplitView && !hasNavigated) setActiveNav("offer");
  }, [showSplitView, hasNavigated]);

  const handleNavClick = (key: NavKey) => {
    setHasNavigated(true);
    setActiveNav(key);
  };

  const buildNav = (): NavItem[] => {
    if (showSplitView) {
      // Replace separate proposal & demo tabs with a single "offer" tab
      const filtered = BASE_NAV.filter((n) => n.key !== "proposal" && n.key !== "demo");
      // Insert offer tab after overview
      const offerTab: NavItem = { key: "offer", icon: "◆", label: "შეთავაზება & დემო" };
      return [filtered[0], offerTab, ...filtered.slice(1)];
    }
    return BASE_NAV;
  };

  const navItems: NavItem[] = steps.length > 0
    ? [...buildNav().slice(0, 2), { key: "progress", icon: "◉", label: "პროგრესი" }, ...buildNav().slice(2)]
    : buildNav();

  const progress = steps.length > 0
    ? Math.round((steps.filter((st) => st.status === "completed").length / steps.length) * 100)
    : 0;

  async function handleAccept() {
    setResponding(true);
    setResponseError(null);
    try {
      const res = await fetch("/api/portal/proposal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "accept" }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed");
      }
      window.location.reload();
    } catch (err) {
      setResponseError((err as Error).message);
    } finally {
      setResponding(false);
    }
  }

  async function handleReject() {
    setResponding(true);
    setResponseError(null);
    try {
      const res = await fetch("/api/portal/proposal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject", reject_reason: rejectReason || undefined }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed");
      }
      window.location.reload();
    } catch (err) {
      setResponseError((err as Error).message);
    } finally {
      setResponding(false);
      setShowRejectModal(false);
    }
  }

  return (
    <div className={s.shell}>
      {/* ── 3D Background ── */}
      <Suspense fallback={null}>
        <PortalCanvas />
      </Suspense>

      {/* ── Noise overlay ── */}
      <div className={s.noise} />

      {/* ── Sidebar ── */}
      <aside className={s.sidebar}>
        <div className={s.sidebarTop}>
          <div className={s.brandMark}>
            <span className={s.brandLetter}>S</span>
            <div className={s.brandGlow} />
          </div>
          <span className={s.brandName}>Sitely</span>
        </div>

        <nav className={s.sidebarNav}>
          {navItems.map((item) => {
            const showBadge = item.key === "proposal" && hasProposal && canRespond;
            return (
              <button
                key={item.key}
                type="button"
                className={`${s.navItem} ${activeNav === item.key ? s.navItemActive : ""}`}
                onClick={() => handleNavClick(item.key)}
              >
                <span className={s.navIcon} aria-hidden="true">{item.icon}</span>
                <span className={s.navLabel}>{item.label}</span>
                {showBadge && <span className={s.navBadge} />}
                {activeNav === item.key && <div className={s.navActiveLine} />}
              </button>
            );
          })}
        </nav>

        <div className={s.sidebarBottom}>
          <div className={s.userPill}>
            <span className={s.userAvatar}>
              {(company?.name || project.client_name).charAt(0).toUpperCase()}
            </span>
            <span className={s.userName}>
              {company?.name || project.client_name}
            </span>
          </div>
          <button
            type="button"
            className={s.logoutBtn}
            onClick={async () => {
              await createBrowserSupabaseClient().auth.signOut();
              window.location.href = "/portal/login";
            }}
          >
            <span aria-hidden="true">⏻</span>
            <span>გასვლა</span>
          </button>
        </div>
      </aside>

      {/* ── Mobile tabs ── */}
      <nav className={s.mobileTabs}>
        {navItems.map((item) => (
          <button
            key={item.key}
            type="button"
            className={`${s.mobileTab} ${activeNav === item.key ? s.mobileTabActive : ""}`}
            onClick={() => handleNavClick(item.key)}
          >
            <span className={s.mobileTabIcon} aria-hidden="true">{item.icon}</span>
            <span className={s.mobileTabLabel}>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* ── Main content ── */}
      <main className={s.main}>
        <header className={s.topBar}>
          <span className={s.topBarBrand}>Sitely</span>
          <span className={s.topBarUser}>{company?.name || project.client_name}</span>
        </header>

        <div className={s.mainInner} ref={mainRef}>

          {/* ═══ OVERVIEW ═══ */}
          {activeNav === "overview" && (
            <div className={s.panelContent}>
              {/* Hero */}
              <div className={s.heroCard} data-rv="fade">
                <div className={s.holoGlow} />
                <div className={s.heroInner}>
                  <div className={s.heroGlowOrb} />
                  <span className={s.heroLabel}>
                    <span className={s.labelLine} />
                    კლიენტის პორტალი
                    <span className={s.labelLineR} />
                  </span>
                  <h1 className={s.heroTitle}>
                    გამარჯობა, <span className={s.gradText}>{project.client_name}</span>
                  </h1>
                  <p className={s.heroSub}>თქვენი პერსონალური სამუშაო სივრცე Sitely-ში</p>
                  <div className={s.heroScanLine} />
                </div>
              </div>

              {/* Two-column grid: status + quick stats */}
              <div className={s.overviewGrid} data-rv="fade" data-d="1">
                {/* Status card */}
                <div className={s.glassCard}>
                  <div className={s.glassCardInner}>
                    <div className={s.statusRow}>
                      <div className={s.statusIndicator} data-accent={status.accent}>
                        <div className={s.statusPulse} />
                      </div>
                      <div className={s.statusContent}>
                        <p className={s.statusHeadline}>{status.headline}</p>
                        <p className={s.statusBody}>{status.body}</p>
                      </div>
                    </div>
                    {status.nextAction && (
                      <div className={s.nextAction}>
                        <span className={s.nextActionIcon} aria-hidden="true">→</span>
                        <p className={s.nextActionText}>{status.nextAction}</p>
                      </div>
                    )}
                    <div className={s.cardScanLine} />
                  </div>
                </div>

                {/* Quick stats */}
                <div className={s.statsCard}>
                  <div className={s.statsCardInner}>
                    <div className={s.statItem}>
                      <span className={s.statValue}>{projectAge}</span>
                      <span className={s.statLabel}>დღე</span>
                    </div>
                    <div className={s.statDivider} />
                    <div className={s.statItem}>
                      <span className={s.statValueOnline}>
                        <span className={s.onlineDot} />
                        ონლაინ
                      </span>
                      <span className={s.statLabel}>გუნდი</span>
                    </div>
                    <div className={s.statDivider} />
                    <div className={s.statItem}>
                      <span className={s.statValue}>&lt;2სთ</span>
                      <span className={s.statLabel}>პასუხი</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick actions */}
              <div className={s.quickGrid} data-rv="fade" data-d="2">
                {hasProposal && canRespond && (
                  <button className={s.actionCard} onClick={() => handleNavClick(showSplitView ? "offer" : "proposal")}>
                    <div className={s.actionCardInner}>
                      <span className={s.actionIconWrap} data-color="gold">◆</span>
                      <div className={s.actionTextWrap}>
                        <span className={s.actionLabel}>შეთავაზების ნახვა</span>
                        <span className={s.actionHint}>ელოდება პასუხს</span>
                      </div>
                      <span className={s.actionArrow} aria-hidden="true">→</span>
                    </div>
                  </button>
                )}
                <button className={s.actionCard} onClick={() => handleNavClick("chat")}>
                  <div className={s.actionCardInner}>
                    <span className={s.actionIconWrap} data-color="blue">◈</span>
                    <div className={s.actionTextWrap}>
                      <span className={s.actionLabel}>ჩატი გუნდთან</span>
                      <span className={s.actionHint}>პირდაპირი კომუნიკაცია</span>
                    </div>
                    <span className={s.actionArrow} aria-hidden="true">→</span>
                  </div>
                </button>
                {project.demo_hash && !showSplitView && (
                  <button className={s.actionCard} onClick={() => handleNavClick("demo")}>
                    <div className={s.actionCardInner}>
                      <span className={s.actionIconWrap} data-color="cyan">◎</span>
                      <div className={s.actionTextWrap}>
                        <span className={s.actionLabel}>დემოს ნახვა</span>
                        <span className={s.actionHint}>თქვენი საიტის პრევიუ</span>
                      </div>
                      <span className={s.actionArrow} aria-hidden="true">→</span>
                    </div>
                  </button>
                )}
              </div>

              {/* Process roadmap */}
              <div className={s.processSection} data-rv="fade" data-d="3">
                <span className={s.sectionLabel}>
                  <span className={s.labelLine} />
                  როგორ მიმდინარეობს პროცესი
                  <span className={s.labelLineR} />
                </span>
                <div className={s.processGrid}>
                  {PROCESS_STEPS.map((ps, i) => (
                    <div key={i} className={`${s.processStep} ${i <= status.step ? s.processStepActive : ""}`}>
                      <div className={s.processStepNum}>
                        {i < status.step ? "✓" : ps.icon}
                      </div>
                      <div className={s.processStepContent}>
                        <p className={s.processStepTitle}>{ps.title}</p>
                        <p className={s.processStepDesc}>{ps.desc}</p>
                      </div>
                      {i < PROCESS_STEPS.length - 1 && (
                        <div className={`${s.processConnector} ${i < status.step ? s.processConnectorDone : ""}`} />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Info + trust row */}
              <div className={s.overviewGrid} data-rv="fade" data-d="4">
                {/* Info card */}
                <div className={s.glassCard}>
                  <div className={s.glassCardInner}>
                    <span className={s.sectionLabel}>
                      <span className={s.labelLine} />
                      პროექტის დეტალები
                      <span className={s.labelLineR} />
                    </span>
                    <div className={s.infoGrid}>
                      <div className={s.infoItem}>
                        <span className={s.infoLabel}>კომპანია</span>
                        <span className={s.infoValue}>{company?.name || "—"}</span>
                      </div>
                      <div className={s.infoItem}>
                        <span className={s.infoLabel}>რეგისტრაციის თარიღი</span>
                        <span className={s.infoValue}>
                          {new Date(project.created_at).toLocaleDateString("ka-GE", {
                            year: "numeric", month: "long", day: "numeric",
                          })}
                        </span>
                      </div>
                      <div className={s.infoItem}>
                        <span className={s.infoLabel}>სტატუსი</span>
                        <span className={s.infoValueAccent}>{status.headline}</span>
                      </div>
                      <div className={s.infoItem}>
                        <span className={s.infoLabel}>კატეგორია</span>
                        <span className={s.infoValue}>{company?.category || "ვებ-სერვისები"}</span>
                      </div>
                    </div>
                    <div className={s.cardScanLine} />
                  </div>
                </div>

                {/* Trust/guarantee card */}
                <div className={s.trustCard}>
                  <div className={s.trustCardInner}>
                    <div className={s.trustBadge}>
                      <span className={s.trustShield} aria-hidden="true">⬡</span>
                    </div>
                    <p className={s.trustTitle}>Sitely გარანტია</p>
                    <ul className={s.trustList}>
                      <li className={s.trustItem}>
                        <span className={s.trustCheck} aria-hidden="true">✓</span>
                        100% უნიკალური დიზაინი
                      </li>
                      <li className={s.trustItem}>
                        <span className={s.trustCheck} aria-hidden="true">✓</span>
                        სრული SEO ოპტიმიზაცია
                      </li>
                      <li className={s.trustItem}>
                        <span className={s.trustCheck} aria-hidden="true">✓</span>
                        მობილურზე ადაპტირებული
                      </li>
                      <li className={s.trustItem}>
                        <span className={s.trustCheck} aria-hidden="true">✓</span>
                        უფასო დომენი & ჰოსტინგი 1 წელი
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══ PROPOSAL ═══ */}
          {activeNav === "proposal" && (
            <div className={s.panelContent}>
              <div className={s.panelHeader} data-rv="fade">
                <span className={s.sectionLabel}>
                  <span className={s.labelLine} />
                  შეთავაზება
                  <span className={s.labelLineR} />
                </span>
              </div>

              {!hasProposal ? (
                <div className={s.emptyState} data-rv="scale">
                  <div className={s.emptyOrb} />
                  <span className={s.emptyIcon}>◆</span>
                  <p className={s.emptyTitle}>შეთავაზება მზადდება</p>
                  <p className={s.emptyDesc}>ჩვენი გუნდი მუშაობს თქვენს ინდივიდუალურ შეთავაზებაზე.</p>
                  <div className={s.emptyTips}>
                    <p className={s.emptyTip}>
                      <span className={s.emptyTipIcon} aria-hidden="true">◈</span>
                      შეგიძლიათ გამოგვწეროთ ჩატში დამატებითი მოთხოვნების შესახებ
                    </p>
                    <p className={s.emptyTip}>
                      <span className={s.emptyTipIcon} aria-hidden="true">⏰</span>
                      შეთავაზება მზად იქნება 24 საათის განმავლობაში
                    </p>
                  </div>
                </div>
              ) : proposal && (
                <div className={s.proposalLayout} data-rv="fade">
                  {/* Main proposal card */}
                  <div className={s.proposalCard}>
                    <div className={s.holoGlow} />
                    <div className={s.proposalInner}>
                      <div className={s.proposalHeader}>
                        <div>
                          <p className={s.proposalTag}>
                            <span className={s.tagDot} /> შეთავაზება
                          </p>
                          <p className={s.proposalTitle}>{proposal.snapshot.title}</p>
                          <p className={s.proposalCompany}>{company?.name}</p>
                        </div>
                        <div className={s.proposalPriceWrap}>
                          <p className={s.proposalPrice}>
                            {formatCurrency(proposal.snapshot.price, proposal.snapshot.currency)}
                          </p>
                          {proposal.expires_at && !isExpired && (
                            <p className={s.proposalExpiry}>
                              ვადა: {new Date(proposal.expires_at).toLocaleDateString("ka-GE")}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className={s.proposalFeatures}>
                        {proposal.snapshot.included.length > 0 && (
                          <div className={s.featureGroup}>
                            <p className={s.featureGroupTitle}>რა შედის</p>
                            <ul className={s.featureList}>
                              {proposal.snapshot.included.map((item, i) => (
                                <li key={i} className={s.featureIncluded}>
                                  <span className={s.featureCheck}>✓</span>
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {proposal.snapshot.excluded.length > 0 && (
                          <div className={s.featureGroup}>
                            <p className={s.featureGroupTitle}>არ შედის</p>
                            <ul className={s.featureList}>
                              {proposal.snapshot.excluded.map((item, i) => (
                                <li key={i} className={s.featureExcluded}>
                                  <span className={s.featureCross}>✕</span>
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      {isExpired && (
                        <div className={s.expiredBanner}>
                          ⏰ შეთავაზების ვადა ამოიწურა. დაგვიკავშირდით ახალი შეთავაზებისთვის.
                        </div>
                      )}

                      {canRespond && !isExpired && (
                        <div className={s.proposalActions}>
                          {responseError && <p className={s.errorText}>{responseError}</p>}
                          <button
                            type="button"
                            className={s.btnPrimary}
                            onClick={handleAccept}
                            disabled={responding}
                          >
                            <span className={s.btnShimmer} />
                            {responding ? "…" : "ვეთანხმები შეთავაზებას"}
                          </button>
                          <button
                            type="button"
                            className={s.btnGhost}
                            onClick={() => setShowRejectModal(true)}
                            disabled={responding}
                          >
                            არ მაწყობს
                          </button>
                        </div>
                      )}

                      {isAccepted && (
                        <div className={s.paymentSection}>
                          <p className={s.paymentLabel}>
                            <span className={s.labelLine} />
                            გადახდის ინფორმაცია
                            <span className={s.labelLineR} />
                          </p>
                          <div className={s.paymentGrid}>
                            <div className={s.paymentCard}>
                              <span className={s.paymentIcon} aria-hidden="true">🏦</span>
                              <p className={s.paymentTitle}>საბანკო გადარიცხვა</p>
                              <p className={s.paymentDesc}>
                                გადარიცხვის შემდეგ ადმინი დაადასტურებს და დავიწყებთ მუშაობას.
                              </p>
                            </div>
                            <div className={s.paymentCard}>
                              <span className={s.paymentIcon} aria-hidden="true">📞</span>
                              <p className={s.paymentTitle}>ადმინთან დაკავშირება</p>
                              <p className={s.paymentDesc}>
                                მოგვწერეთ ჩატში ან დაგვიკავშირდით:{" "}
                                <a className={s.contactLink} href="tel:+995322000000">+995 32 200 00 00</a>
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className={s.cardScanLine} />
                    </div>
                  </div>

                  {/* Proposal sidebar info */}
                  <div className={s.proposalSide}>
                    <div className={s.proposalSideCard}>
                      <p className={s.proposalSideTitle}>კითხვები გაქვთ?</p>
                      <p className={s.proposalSideDesc}>
                        ჩვენი გუნდი მზადაა გიპასუხოთ ნებისმიერ კითხვაზე შეთავაზებასთან დაკავშირებით.
                      </p>
                      <button
                        type="button"
                        className={s.proposalSideBtn}
                        onClick={() => handleNavClick("chat")}
                      >
                        ◈ ჩატში დაწერა
                      </button>
                    </div>
                    <div className={s.proposalSideCard}>
                      <p className={s.proposalSideTitle}>რა ხდება გადახდის შემდეგ?</p>
                      <ul className={s.proposalSideList}>
                        <li>ადმინი ადასტურებს გადახდას</li>
                        <li>გუნდი იწყებს დიზაინს</li>
                        <li>მიიღებთ პირველ ნახაზს 3–5 დღეში</li>
                        <li>კორექტირების შემდეგ — გაშვება</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ═══ CHAT ═══ */}
          {activeNav === "chat" && (
            <div className={s.chatPanel}>
              <div className={s.chatHeader} data-rv="fade">
                <div className={s.chatHeaderLeft}>
                  <div className={s.chatOperatorAvatar}>
                    <span className={s.chatOperatorLetter}>S</span>
                    <span className={s.chatOnlineBadge} />
                  </div>
                  <div className={s.chatHeaderInfo}>
                    <p className={s.chatHeaderName}>Sitely გუნდი</p>
                    <p className={s.chatHeaderStatus}>ონლაინ · საშუალოდ პასუხობს &lt;2 საათში</p>
                  </div>
                </div>
              </div>
              <div className={s.chatWrapper}>
                <PortalChat projectId={project.id} />
              </div>
            </div>
          )}

          {/* ═══ DEMO ═══ */}
          {activeNav === "demo" && (
            <div className={s.panelContent}>
              <div className={s.panelHeader} data-rv="fade">
                <span className={s.sectionLabel}>
                  <span className={s.labelLine} />
                  თქვენი დემო
                  <span className={s.labelLineR} />
                </span>
              </div>
              {project.demo_hash ? (
                <div className={s.demoSection} data-rv="scale">
                  {/* Device toggle */}
                  <div className={s.demoToolbar}>
                    <div className={s.deviceToggle}>
                      <button
                        type="button"
                        className={`${s.deviceBtn} ${demoDevice === "desktop" ? s.deviceBtnActive : ""}`}
                        onClick={() => setDemoDevice("desktop")}
                      >
                        🖥 Desktop
                      </button>
                      <button
                        type="button"
                        className={`${s.deviceBtn} ${demoDevice === "mobile" ? s.deviceBtnActive : ""}`}
                        onClick={() => setDemoDevice("mobile")}
                      >
                        📱 Mobile
                      </button>
                    </div>
                    <a
                      href={`/demo/${project.demo_hash}`}
                      className={s.demoLink}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      ↗ სრულ ეკრანზე
                    </a>
                  </div>

                  {/* Demo frame */}
                  <div className={`${s.demoFrame} ${demoDevice === "mobile" ? s.demoFrameMobile : ""}`}>
                    <div className={s.demoBrowserBar}>
                      <span className={s.demoDot} />
                      <span className={s.demoDot} />
                      <span className={s.demoDot} />
                      <span className={s.demoUrl}>{`sitely.ge/demo/${project.demo_hash.slice(0, 8)}…`}</span>
                    </div>
                    <iframe
                      src={`/demo/${project.demo_hash}`}
                      className={s.demoIframe}
                      title="Demo Preview"
                    />
                  </div>

                  {/* Demo helpful info */}
                  <div className={s.demoInfo}>
                    <div className={s.demoInfoCard}>
                      <span className={s.demoInfoIcon} aria-hidden="true">💡</span>
                      <div>
                        <p className={s.demoInfoTitle}>ეს არის თქვენი საიტის პრევიუ</p>
                        <p className={s.demoInfoDesc}>
                          ნახეთ როგორ გამოიყურება დესკტოპ და მობილურ ვერსიაში. თუ გსურთ ცვლილების შეტანა — მოგვწერეთ ჩატში.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className={s.emptyState} data-rv="scale">
                  <div className={s.emptyOrb} />
                  <span className={s.emptyIcon}>◎</span>
                  <p className={s.emptyTitle}>დემო მზადდება</p>
                  <p className={s.emptyDesc}>ჩვენი გუნდი მუშაობს თქვენი საიტის პრევიუზე.</p>
                  <div className={s.emptyTips}>
                    <p className={s.emptyTip}>
                      <span className={s.emptyTipIcon} aria-hidden="true">⏰</span>
                      დემო მზად იქნება შეთავაზების დადასტურებისთანავე
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ═══ OFFER (Split View: Demo + OfferPanel) ═══ */}
          {activeNav === "offer" && (
            <div className={s.splitView}>
              {/* Left: Demo */}
              <div className={s.splitDemo}>
                <div className={s.demoToolbar}>
                  <div className={s.deviceToggle}>
                    <button
                      type="button"
                      className={`${s.deviceBtn} ${demoDevice === "desktop" ? s.deviceBtnActive : ""}`}
                      onClick={() => setDemoDevice("desktop")}
                    >
                      🖥 Desktop
                    </button>
                    <button
                      type="button"
                      className={`${s.deviceBtn} ${demoDevice === "mobile" ? s.deviceBtnActive : ""}`}
                      onClick={() => setDemoDevice("mobile")}
                    >
                      📱 Mobile
                    </button>
                  </div>
                  <a
                    href={`/demo/${project.demo_hash}`}
                    className={s.demoLink}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    ↗ სრულ ეკრანზე
                  </a>
                </div>
                <div className={`${s.demoFrame} ${demoDevice === "mobile" ? s.demoFrameMobile : ""} ${s.splitDemoFrame}`}>
                  <div className={s.demoBrowserBar}>
                    <span className={s.demoDot} />
                    <span className={s.demoDot} />
                    <span className={s.demoDot} />
                    <span className={s.demoUrl}>{`sitely.ge/demo/${project.demo_hash?.slice(0, 8)}…`}</span>
                  </div>
                  <iframe
                    src={`/demo/${project.demo_hash}`}
                    className={s.demoIframe}
                    title="Demo Preview"
                  />
                </div>
              </div>

              {/* Right: Offer Panel */}
              <div className={s.splitOffer}>
                <OfferPanel
                  onAccept={handleAccept}
                  onReject={() => setShowRejectModal(true)}
                  responding={responding}
                  responseError={responseError}
                />
              </div>
            </div>
          )}

          {/* ═══ PROGRESS ═══ */}
          {activeNav === "progress" && steps.length > 0 && (
            <div className={s.panelContent}>
              <div className={s.panelHeader} data-rv="fade">
                <span className={s.sectionLabel}>
                  <span className={s.labelLine} />
                  პროგრესი
                  <span className={s.labelLineR} />
                </span>
                <span className={s.progressBadge}>{progress}%</span>
              </div>

              {/* Interactive progress bar */}
              <div className={s.progressBarWrap} data-rv="fade" data-d="1">
                <div className={s.progressStepIndicators}>
                  {steps.map((step, i) => {
                    const pct = ((i + 1) / steps.length) * 100;
                    return (
                      <button
                        key={step.id}
                        type="button"
                        className={`${s.progressDot} ${
                          step.status === "completed" ? s.progressDotDone
                          : step.status === "active" ? s.progressDotActive
                          : s.progressDotLocked
                        }`}
                        style={{ left: `${pct}%` }}
                        onClick={() => setExpandedStep(expandedStep === step.id ? null : step.id)}
                        title={step.title}
                      >
                        {step.status === "completed" ? "✓" : i + 1}
                      </button>
                    );
                  })}
                </div>
                <div className={s.progressBar}>
                  <div className={s.progressBarFill} style={{ width: `${progress}%` }} />
                  <div className={s.progressBarShine} style={{ width: `${progress}%` }} />
                </div>
              </div>

              {/* Steps detail list */}
              <div className={s.timeline} data-rv="fade" data-d="2">
                {steps.map((step, i) => (
                  <div key={step.id}>
                    <button
                      type="button"
                      className={`${s.stepWrap} ${expandedStep === step.id ? s.stepWrapExpanded : ""}`}
                      onClick={() => setExpandedStep(expandedStep === step.id ? null : step.id)}
                    >
                      <div className={s.stepLeft}>
                        <div className={step.status === "completed" ? s.stepDotDone : step.status === "active" ? s.stepDotActive : s.stepDotLocked}>
                          {step.status === "completed" ? "✓" : step.step_order}
                        </div>
                        {i < steps.length - 1 && <div className={step.status === "completed" ? s.stepLineDone : s.stepLine} />}
                      </div>
                      <div className={s.stepBody}>
                        <p className={step.status === "completed" ? s.stepTitleDone : step.status === "active" ? s.stepTitleActive : s.stepTitleLocked}>
                          {step.title}
                        </p>
                        {step.status === "active" && (
                          <span className={s.stepActiveBadge}>მიმდინარე</span>
                        )}
                      </div>
                    </button>
                    {expandedStep === step.id && step.description && (
                      <div className={s.stepExpanded}>
                        <p className={s.stepExpandedText}>{step.description}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </main>

      {/* ── Reject modal ── */}
      {showRejectModal && (
        <div className={s.modalOverlay} onClick={() => setShowRejectModal(false)}>
          <div className={s.modal} onClick={(e) => e.stopPropagation()}>
            <div className={s.modalInner}>
              <h3 className={s.modalTitle}>რატომ არ მოგწონთ?</h3>
              <p className={s.modalDesc}>
                მოკლედ აღწეროთ მიზეზი, რომ უკეთესი შეთავაზება მოვამზადოთ.
              </p>
              <textarea
                className={s.modalTextarea}
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="მაგ: ფასი მაღალია, სხვა ფუნქციონალი მინდა…"
              />
              {responseError && <p className={s.errorText}>{responseError}</p>}
              <div className={s.modalBtns}>
                <button
                  type="button"
                  className={s.btnDanger}
                  onClick={handleReject}
                  disabled={responding}
                >
                  {responding ? "…" : "უარყოფა"}
                </button>
                <button
                  type="button"
                  className={s.btnGhost}
                  onClick={() => setShowRejectModal(false)}
                >
                  გაუქმება
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

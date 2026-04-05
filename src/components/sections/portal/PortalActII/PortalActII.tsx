"use client";

import { useState, useEffect, useRef, lazy, Suspense } from "react";
import { usePortal } from "@/components/sections/portal/PortalProvider/PortalProvider";
import type { TimelineStep } from "@/components/sections/portal/PortalProvider/PortalProvider";
import PortalChat from "@/components/sections/portal/PortalChat/PortalChat";
import s from "./PortalActII.module.css";

const PortalCanvas = lazy(() => import("@/components/portal/PortalCanvas/PortalCanvas"));

/* ─── Nav items ─── */
const NAV_ITEMS = [
  { key: "overview", icon: "⬡", label: "მიმოხილვა" },
  { key: "timeline", icon: "◎", label: "პროგრესი" },
  { key: "chat", icon: "◈", label: "ჩატი" },
  { key: "files", icon: "▤", label: "ფაილები" },
  { key: "demo", icon: "◉", label: "დემო" },
  { key: "invoice", icon: "⬢", label: "ინვოისი" },
] as const;

type NavKey = (typeof NAV_ITEMS)[number]["key"];

/* ─── Status helpers ─── */
function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    active_collecting: "მასალების შეგროვება",
    active_designing: "დიზაინი მიმდინარეობს",
    active_developing: "დეველოპმენტი",
    active_review: "მიმოხილვა",
    completed: "დასრულებულია",
  };
  return map[status] ?? "მუშავდება";
}

function getStatusAccent(status: string): string {
  if (status === "completed") return "cyan";
  if (status.startsWith("active_")) return "blue";
  return "violet";
}

function getActionContent(status: string) {
  switch (status) {
    case "active_collecting":
      return { icon: "📁", title: "ატვირთეთ მასალები", desc: "ლოგო (PNG/SVG), ინტერიერის/პროდუქტის ფოტოები და სხვა ტექსტი. გამოაგზავნეთ ჩატში ან მეილზე." };
    case "active_designing":
      return { icon: "✏️", title: "დიზაინი მზადდება", desc: "ჩვენი გუნდი ქმნის თქვენს უნიკალურ დიზაინს. შედეგი მალე მზად იქნება." };
    case "active_developing":
      return { icon: "⚙️", title: "საიტი იშენება", desc: "დიზაინი დადასტურებულია — ვიწყებთ კოდის წერას." };
    case "active_review":
      return { icon: "👀", title: "გაეცანით და დაადასტურეთ", desc: "საიტი მზადაა მიმოხილვისთვის. ნახეთ და გვაცნობეთ შენიშვნები." };
    case "completed":
      return { icon: "🎉", title: "პროექტი დასრულებულია!", desc: "გმადლობთ ნდობისთვის — თქვენი საიტი გაშვებულია." };
    default:
      return { icon: "📋", title: "პროექტი მუშავდება", desc: "ადმინი მალე განაახლებს სტატუსს." };
  }
}

function getProgressPercentage(steps: TimelineStep[]): number {
  if (steps.length === 0) return 0;
  return Math.round((steps.filter((st) => st.status === "completed").length / steps.length) * 100);
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
            { y: 0, opacity: 1, duration: 0.8, stagger: 0.08, ease: "power3.out", delay: 0.15 },
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
   PortalActII — Production Phase Portal
   ═══════════════════════════════════════════════════════════════ */
export default function PortalActII() {
  const { company, project, steps } = usePortal();
  const [activeNav, setActiveNav] = useState<NavKey>("overview");
  const mainRef = useRef<HTMLDivElement>(null);

  useGsapEntrance(mainRef, activeNav);

  if (!project) return null;

  const statusLabel = getStatusLabel(project.status);
  const statusAccent = getStatusAccent(project.status);
  const action = getActionContent(project.status);
  const progress = getProgressPercentage(steps);
  const isCompleted = project.status === "completed";

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
          {NAV_ITEMS.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`${s.navItem} ${activeNav === item.key ? s.navItemActive : ""}`}
              onClick={() => setActiveNav(item.key)}
            >
              <span className={s.navIcon} aria-hidden="true">{item.icon}</span>
              <span className={s.navLabel}>{item.label}</span>
              {activeNav === item.key && <div className={s.navActiveLine} />}
            </button>
          ))}
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
        </div>
      </aside>

      {/* ── Mobile tabs ── */}
      <nav className={s.mobileTabs}>
        {NAV_ITEMS.map((item) => (
          <button
            key={item.key}
            type="button"
            className={`${s.mobileTab} ${activeNav === item.key ? s.mobileTabActive : ""}`}
            onClick={() => setActiveNav(item.key)}
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
              {/* Hero card */}
              <div className={s.heroCard} data-rv="fade">
                <div className={s.holoGlow} />
                <div className={s.heroInner}>
                  <div className={s.heroGlowOrb} />
                  <span className={s.heroLabel}>
                    <span className={s.labelLine} />
                    პორტალი
                    <span className={s.labelLineR} />
                  </span>
                  <h1 className={s.heroTitle}>
                    <span className={s.gradText}>{company?.name || project.client_name}</span>
                  </h1>
                  <p className={s.heroSub}>აქტიური პროექტი</p>
                  <div className={s.heroScanLine} />
                </div>
              </div>

              {/* Status card */}
              <div className={s.glassCard} data-rv="fade" data-d="1">
                <div className={s.glassCardInner}>
                  <div className={s.statusRow}>
                    <div className={s.statusIndicator} data-accent={statusAccent}>
                      <div className={s.statusPulse} />
                    </div>
                    <div className={s.statusContent}>
                      <p className={s.statusHeadline}>{statusLabel}</p>
                    </div>
                  </div>
                  <div className={s.cardScanLine} />
                </div>
              </div>

              {/* Progress ring */}
              <div className={s.glassCard} data-rv="fade" data-d="2">
                <div className={s.glassCardInner}>
                  <div className={s.progressSection}>
                    <div className={s.progressRing}>
                      <svg viewBox="0 0 120 120" className={s.progressSvg}>
                        <circle cx="60" cy="60" r="52" className={s.progressTrack} />
                        <circle
                          cx="60" cy="60" r="52"
                          className={s.progressFill}
                          style={{
                            strokeDasharray: `${2 * Math.PI * 52}`,
                            strokeDashoffset: `${2 * Math.PI * 52 * (1 - progress / 100)}`,
                          }}
                        />
                      </svg>
                      <span className={s.progressPercent}>{progress}%</span>
                    </div>
                    <div className={s.progressMeta}>
                      <p className={s.progressLabel}>
                        {steps.filter((st) => st.status === "completed").length} / {steps.length} ეტაპი
                      </p>
                      <p className={s.progressSubText}>დასრულებულია</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action card */}
              <div className={s.actionCard} data-rv="fade" data-d="3">
                <div className={s.actionCardInner}>
                  <span className={s.actionIcon}>{action.icon}</span>
                  <div>
                    <p className={s.actionTitle}>{action.title}</p>
                    <p className={s.actionDesc}>{action.desc}</p>
                  </div>
                </div>
              </div>

              {/* Quick actions */}
              <div className={s.quickGrid} data-rv="fade" data-d="4">
                {project.demo_hash && (
                  <a
                    href={`/demo/${project.demo_hash}`}
                    className={isCompleted ? s.demoBtnLive : s.demoBtn}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {isCompleted ? "🌐 Live საიტის ნახვა" : "↗ დემოს ნახვა"}
                  </a>
                )}
                <button className={s.quickBtn} onClick={() => setActiveNav("chat")}>
                  <span className={s.quickBtnIcon}>◈</span> ჩატი გუნდთან
                </button>
              </div>

              {/* Info card */}
              <div className={s.glassCard} data-rv="fade" data-d="5">
                <div className={s.glassCardInner}>
                  <div className={s.infoGrid}>
                    <div className={s.infoItem}>
                      <span className={s.infoLabel}>პროექტი</span>
                      <span className={s.infoValue}>{company?.name ?? project.client_name}</span>
                    </div>
                    <div className={s.infoItem}>
                      <span className={s.infoLabel}>შექმნილია</span>
                      <span className={s.infoValue}>
                        {new Date(project.created_at).toLocaleDateString("ka-GE", {
                          year: "numeric", month: "long", day: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                  <div className={s.cardScanLine} />
                </div>
              </div>
            </div>
          )}

          {/* ═══ TIMELINE ═══ */}
          {activeNav === "timeline" && (
            <div className={s.panelContent}>
              <div className={s.panelHeader} data-rv="fade">
                <span className={s.sectionLabel}>
                  <span className={s.labelLine} />
                  პროგრესი
                  <span className={s.labelLineR} />
                </span>
                <span className={s.progressBadge}>{progress}%</span>
              </div>

              <div className={s.progressBarWrap} data-rv="fade" data-d="1">
                <div className={s.progressBar}>
                  <div className={s.progressBarFill} style={{ width: `${progress}%` }} />
                  <div className={s.progressBarGlow} style={{ left: `${progress}%` }} />
                </div>
              </div>

              {steps.length > 0 ? (
                <div className={s.timeline} data-rv="fade" data-d="2">
                  {steps.map((step, i) => (
                    <Step key={step.id} step={step} isLast={i === steps.length - 1} />
                  ))}
                </div>
              ) : (
                <div className={s.emptyState} data-rv="scale">
                  <div className={s.emptyOrb} />
                  <span className={s.emptyIcon}>◎</span>
                  <p className={s.emptyTitle}>ეტაპები ჯერ არ არის</p>
                  <p className={s.emptyDesc}>ადმინი მალე დაამატებს ეტაპებს.</p>
                </div>
              )}
            </div>
          )}

          {/* ═══ CHAT ═══ */}
          {activeNav === "chat" && (
            <div className={s.chatPanel}>
              <div className={s.panelHeader} data-rv="fade">
                <span className={s.sectionLabel}>
                  <span className={s.labelLine} />
                  ჩატი
                  <span className={s.labelLineR} />
                </span>
                <span className={s.panelSubtitle}>Sitely გუნდთან</span>
              </div>
              <div className={s.chatWrapper}>
                <PortalChat projectId={project.id} />
              </div>
            </div>
          )}

          {/* ═══ FILES ═══ */}
          {activeNav === "files" && (
            <div className={s.panelContent}>
              <div className={s.panelHeader} data-rv="fade">
                <span className={s.sectionLabel}>
                  <span className={s.labelLine} />
                  ფაილები
                  <span className={s.labelLineR} />
                </span>
              </div>
              <div className={s.comingSoonCard} data-rv="scale">
                <div className={s.emptyOrb} />
                <span className={s.comingSoonIcon}>▤</span>
                <h3 className={s.comingSoonTitle}>Coming Soon</h3>
                <p className={s.comingSoonDesc}>
                  ფაილების გაცვლა მალე ხელმისაწვდომი იქნება. ამჟამად, გთხოვთ ფაილები გამოგვიგზავნოთ ჩატში.
                </p>
                <button type="button" className={s.comingSoonBtn} onClick={() => setActiveNav("chat")}>
                  <span className={s.btnShimmer} />
                  ◈ ჩატში გადასვლა
                </button>
              </div>
            </div>
          )}

          {/* ═══ DEMO ═══ */}
          {activeNav === "demo" && (
            <div className={s.panelContent}>
              <div className={s.panelHeader} data-rv="fade">
                <span className={s.sectionLabel}>
                  <span className={s.labelLine} />
                  დემო
                  <span className={s.labelLineR} />
                </span>
              </div>
              {project.demo_hash ? (
                <div className={s.demoPanel} data-rv="scale">
                  <div className={s.demoFrame}>
                    <iframe
                      src={`/demo/${project.demo_hash}`}
                      className={s.demoIframe}
                      title="Demo Preview"
                    />
                  </div>
                  <a
                    href={`/demo/${project.demo_hash}`}
                    className={s.demoLink}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    ↗ სრულ ეკრანზე გახსნა
                  </a>
                </div>
              ) : (
                <div className={s.comingSoonCard} data-rv="scale">
                  <div className={s.emptyOrb} />
                  <span className={s.comingSoonIcon}>◉</span>
                  <h3 className={s.comingSoonTitle}>დემო ჯერ არ არის</h3>
                  <p className={s.comingSoonDesc}>
                    ჩვენი გუნდი მალე მოამზადებს თქვენს პერსონალიზებულ დემოს.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ═══ INVOICE ═══ */}
          {activeNav === "invoice" && (
            <div className={s.panelContent}>
              <div className={s.panelHeader} data-rv="fade">
                <span className={s.sectionLabel}>
                  <span className={s.labelLine} />
                  ინვოისი
                  <span className={s.labelLineR} />
                </span>
              </div>
              <div className={s.comingSoonCard} data-rv="scale">
                <div className={s.emptyOrb} />
                <span className={s.comingSoonIcon}>⬢</span>
                <h3 className={s.comingSoonTitle}>Coming Soon</h3>
                <p className={s.comingSoonDesc}>
                  ინვოისების სისტემა მალე ხელმისაწვდომი იქნება. გადახდის შესახებ ინფორმაციისთვის დაგვიკავშირდით ჩატში.
                </p>
                <button type="button" className={s.comingSoonBtn} onClick={() => setActiveNav("chat")}>
                  <span className={s.btnShimmer} />
                  ◈ ჩატში გადასვლა
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

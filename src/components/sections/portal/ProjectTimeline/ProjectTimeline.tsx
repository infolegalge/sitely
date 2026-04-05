"use client";

import { usePortal } from "@/components/sections/portal/PortalProvider/PortalProvider";
import s from "./ProjectTimeline.module.css";

const STEPS = [
  { key: "request", label: "მოთხოვნა" },
  { key: "design", label: "დიზაინი" },
  { key: "build", label: "შექმნა" },
  { key: "delivery", label: "ჩაბარება" },
];

function getActiveStep(status: string): number {
  switch (status) {
    case "lead":
    case "new":
      return 0;
    case "demo_ready":
    case "contacted":
      return 1;
    case "engaged":
    case "negotiating":
      return 2;
    case "converted":
      return 3;
    default:
      return 0;
  }
}

export default function ProjectTimeline() {
  const { company } = usePortal();
  const activeStep = getActiveStep(company?.status || "new");

  return (
    <section className={s.section}>
      <h2 className={s.title}>პროექტის სტატუსი</h2>
      <div className={s.timeline}>
        {STEPS.map((step, i) => {
          const isDone = i < activeStep;
          const isActive = i === activeStep;
          const isLast = i === STEPS.length - 1;

          return (
            <div key={step.key} className={s.step}>
              <div
                className={
                  isDone ? s.stepDotDone : isActive ? s.stepDotActive : s.stepDot
                }
              >
                {isDone ? "✓" : i + 1}
              </div>
              {!isLast && (
                <div className={isDone ? s.stepLineDone : s.stepLine} />
              )}
              <p
                className={
                  isDone
                    ? s.stepLabelDone
                    : isActive
                      ? s.stepLabelActive
                      : s.stepLabel
                }
              >
                {step.label}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

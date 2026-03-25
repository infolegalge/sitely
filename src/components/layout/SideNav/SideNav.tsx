"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import s from "./SideNav.module.css";

interface Section {
  id: string;
  label: string;
}

const ROUTE_SECTIONS: Record<string, Section[]> = {
  "/": [
    { id: "hero", label: "Home" },
    { id: "work", label: "Selected Work" },
    { id: "services", label: "Services" },
    { id: "process", label: "Process" },
    { id: "testimonials", label: "Why Us" },
  ],
  "/portfolio": [
    { id: "p-hero", label: "Portfolio" },
    { id: "p-projects", label: "Projects" },
    { id: "p-cases", label: "Case Studies" },
    { id: "p-tech", label: "Tech Stack" },
    { id: "p-voices", label: "Testimonials" },
    { id: "p-cta", label: "Get Started" },
  ],
  "/services": [
    { id: "sv-hero", label: "Services" },
    { id: "sv-industries", label: "Industries" },
    { id: "sv-deep", label: "Deep Dive" },
    { id: "sv-journey", label: "Your Journey" },
    { id: "sv-results", label: "Results" },
    { id: "sv-cta", label: "Get Started" },
  ],
};

export default function SideNav() {
  const pathname = usePathname();
  const sections = ROUTE_SECTIONS[pathname];
  const [active, setActive] = useState(sections?.[0]?.id ?? "");
  const ticking = useRef(false);

  const updateActive = useCallback(() => {
    if (!sections) return;
    let current = sections[0].id;
    for (const section of sections) {
      const el = document.getElementById(section.id);
      if (el && el.getBoundingClientRect().top < window.innerHeight * 0.4) {
        current = section.id;
      }
    }
    setActive(current);
    ticking.current = false;
  }, [sections]);

  useEffect(() => {
    if (!sections) return;
    setActive(sections[0].id);
    const onScroll = () => {
      if (!ticking.current) {
        ticking.current = true;
        requestAnimationFrame(updateActive);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    updateActive();
    return () => window.removeEventListener("scroll", onScroll);
  }, [sections, updateActive]);

  const scrollTo = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 70;
    window.scrollTo({ top, behavior: "smooth" });
  }, []);

  if (!sections) return null;
  return (
    <nav className={s.nav} aria-label="Section navigation">
      {sections.map(({ id, label }) => (
        <button
          key={id}
          className={`${s.dot}${active === id ? ` ${s.active}` : ""}`}
          data-label={label}
          onClick={() => scrollTo(id)}
          aria-label={`Scroll to ${label}`}
        />
      ))}
    </nav>
  );
}

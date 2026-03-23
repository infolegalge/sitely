"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import s from "./SideNav.module.css";

interface Section {
  id: string;
  label: string;
}

const HOME_SECTIONS: Section[] = [
  { id: "hero", label: "Home" },
  { id: "work", label: "Selected Work" },
  { id: "services", label: "Services" },
  { id: "process", label: "Process" },
  { id: "testimonials", label: "Why Us" },
];

export default function SideNav() {
  const pathname = usePathname();
  const [active, setActive] = useState("hero");
  const ticking = useRef(false);
  const isHome = pathname === "/";

  const updateActive = useCallback(() => {
    let current = HOME_SECTIONS[0].id;
    for (const section of HOME_SECTIONS) {
      const el = document.getElementById(section.id);
      if (el && el.getBoundingClientRect().top < window.innerHeight * 0.4) {
        current = section.id;
      }
    }
    setActive(current);
    ticking.current = false;
  }, []);

  /* Scroll listener with rAF throttle */
  useEffect(() => {
    if (!isHome) return;
    const onScroll = () => {
      if (!ticking.current) {
        ticking.current = true;
        requestAnimationFrame(updateActive);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    updateActive();
    return () => window.removeEventListener("scroll", onScroll);
  }, [isHome, updateActive]);

  const scrollTo = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 70;
    window.scrollTo({ top, behavior: "smooth" });
  }, []);

  /* Only show on homepage */
  if (!isHome) return null;
  return (
    <nav className={s.nav} aria-label="Section navigation">
      {HOME_SECTIONS.map(({ id, label }) => (
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

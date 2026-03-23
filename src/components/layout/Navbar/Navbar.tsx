"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/lib/constants";
import s from "./Navbar.module.css";

export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <nav className={s.nav}>
        <Link href="/" className={s.logo}>
          sitely
        </Link>

        <div className={`${s["desktop-links"]} ${s["hidden-mobile"]}`}>
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={s["nav-link"]}
              data-active={String(pathname === item.href)}
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className={s["right-group"]}>
          <Link
            href="/contact"
            className={`${s.cta} ${s["hidden-mobile"]}`}
          >
            Start Project
          </Link>

          <button
            className={`${s.hamburger} ${s["show-mobile"]}`}
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? "✕" : "☰"}
          </button>
        </div>
      </nav>

      <div className={s["mobile-menu"]} data-open={String(mobileOpen)}>
        {NAV_ITEMS.map((item, i) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={s["mobile-link"]}
            data-active={String(pathname === item.href)}
            data-open={String(mobileOpen)}
            style={{ '--i': i } as React.CSSProperties}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </>
  );
}

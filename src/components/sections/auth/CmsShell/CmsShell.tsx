"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  FolderKanban,
  LayoutTemplate,
  Play,
  Mail,
  BarChart3,
  Layers,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import s from "./CmsShell.module.css";

const NAV_ITEMS = [
  { href: "/secure-access/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/secure-access/companies", label: "კომპანიები", icon: Building2 },
  { href: "/secure-access/projects", label: "პროექტები", icon: FolderKanban },
  { href: "/secure-access/templates", label: "შაბლონები", icon: LayoutTemplate },
  { href: "/secure-access/demos", label: "დემოები", icon: Play },
  { href: "/secure-access/batches", label: "ბაჩები", icon: Layers },
  { href: "/secure-access/queue", label: "რიგი", icon: Mail },
  { href: "/secure-access/analytics", label: "ანალიტიკა", icon: BarChart3 },
];

/* Bottom tab bar on mobile — show first 5 items */
const MOBILE_TABS = NAV_ITEMS.slice(0, 5);

interface CmsShellProps {
  email: string;
  children: React.ReactNode;
}

export default function CmsShell({ email, children }: CmsShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleLogout = async () => {
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signOut();
    router.push("/secure-access/login");
    router.refresh();
  };

  const isActive = (href: string) => pathname.startsWith(href);

  return (
    <div className={s.layout}>
      {/* ── Sidebar (desktop) ── */}
      <aside className={s.sidebar}>
        <div className={s.brandSection}>
          <div className={s.brandMark}>
            <span className={s.brandLetter}>S</span>
          </div>
          <div className={s.brandText}>
            <span className={s.brandName}>Sitely</span>
            <span className={s.badge}>CMS</span>
          </div>
        </div>

        <nav className={s.nav}>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${s.navItem} ${active ? s.navItemActive : ""}`}
              >
                {active && <span className={s.navActiveLine} />}
                <Icon size={18} />
                <span className={s.navLabel}>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className={s.sidebarFooter}>
          <div className={s.adminEmail}>{email}</div>
          <button className={s.logoutBtn} onClick={handleLogout}>
            <LogOut size={16} />
            <span>გასვლა</span>
          </button>
        </div>
      </aside>

      {/* ── Drawer overlay (tablet) ── */}
      {drawerOpen && (
        <div className={s.drawerOverlay} onClick={() => setDrawerOpen(false)}>
          <aside className={s.drawer} onClick={(e) => e.stopPropagation()}>
            <div className={s.drawerHeader}>
              <div className={s.brandText}>
                <span className={s.brandName}>Sitely</span>
                <span className={s.badge}>CMS</span>
              </div>
              <button
                className={s.drawerClose}
                onClick={() => setDrawerOpen(false)}
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>
            <nav className={s.nav}>
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`${s.navItem} ${active ? s.navItemActive : ""}`}
                    onClick={() => setDrawerOpen(false)}
                  >
                    {active && <span className={s.navActiveLine} />}
                    <Icon size={18} />
                    <span className={s.navLabel}>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
            <div className={s.sidebarFooter}>
              <div className={s.adminEmail}>{email}</div>
              <button className={s.logoutBtn} onClick={handleLogout}>
                <LogOut size={16} />
                <span>გასვლა</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* ── Top bar (tablet only — hamburger + brand) ── */}
      <div className={s.mobileTopbar}>
        <button
          className={s.hamburger}
          onClick={() => setDrawerOpen(true)}
          aria-label="Open menu"
        >
          <Menu size={22} />
        </button>
        <span className={s.mobileTitle}>Sitely CMS</span>
      </div>

      {/* ── Main content ── */}
      <main className={s.content}>
        {children}
      </main>

      {/* ── Bottom tab bar (mobile) ── */}
      <nav className={s.bottomBar}>
        {MOBILE_TABS.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`${s.tabItem} ${active ? s.tabActive : ""}`}
            >
              <Icon size={20} />
              <span className={s.tabLabel}>{item.label}</span>
            </Link>
          );
        })}
        <button
          className={s.tabItem}
          onClick={() => setDrawerOpen(true)}
        >
          <Menu size={20} />
          <span className={s.tabLabel}>მეტი</span>
        </button>
      </nav>

      {/* ── Noise overlay ── */}
      <div className={s.noise} />
    </div>
  );
}

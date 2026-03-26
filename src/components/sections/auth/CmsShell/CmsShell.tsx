"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import s from "./CmsShell.module.css";

const NAV_ITEMS = [
  { href: "/secure-access/dashboard", label: "Dashboard" },
  { href: "/secure-access/companies", label: "კომპანიები" },
  { href: "/secure-access/templates", label: "შაბლონები" },
  { href: "/secure-access/demos", label: "დემოები" },
  { href: "/secure-access/analytics", label: "ანალიტიკა" },
];

interface CmsShellProps {
  email: string;
  children: React.ReactNode;
}

export default function CmsShell({ email, children }: CmsShellProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signOut();
    router.push("/secure-access/login");
    router.refresh();
  };

  return (
    <div className={s.layout}>
      <header className={s.topbar}>
        <div className={s.brandRow}>
          <div className={s.brand}>
            <span className={s.brandName}>Sitely</span>
            <span className={s.badge}>CMS</span>
          </div>
          <nav className={s.nav}>
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`${s.navLink} ${pathname.startsWith(item.href) ? s.navActive : ""}`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className={s.adminInfo}>
          <span className={s.email}>{email}</span>
          <button className={s.logoutBtn} onClick={handleLogout}>
            Sign out
          </button>
        </div>
      </header>
      <div className={s.content}>{children}</div>
    </div>
  );
}

"use client";

import { usePortal } from "@/components/sections/portal/PortalProvider/PortalProvider";
import PortalActI from "@/components/sections/portal/PortalActI/PortalActI";
import PortalActII from "@/components/sections/portal/PortalActII/PortalActII";
import s from "./PortalDashboard.module.css";

const ACT_I_STATUSES = new Set(["lead_new", "lead_negotiating", "proposal_sent", "proposal_accepted"]);

export default function PortalDashboard() {
  const { project, loading, error, refetch } = usePortal();

  if (loading) {
    return (
      <div className={s.loadingWrap}>
        <p className={s.loadingText}>იტვირთება...</p>
      </div>
    );
  }

  if (error === "session_expired") {
    if (typeof window !== "undefined") {
      window.location.replace("/portal/login");
    }
    return null;
  }

  if (error || !project) {
    return (
      <div className={s.errorWrap}>
        <p className={s.errorText}>{error || "პროექტი ვერ მოიძებნა."}</p>
        <button className={s.retryLink} onClick={refetch}>ხელახლა ცდა</button>
        <a href="/portal/login" className={s.retryLink}>ახალი ლინკის მოთხოვნა</a>
      </div>
    );
  }

  if (ACT_I_STATUSES.has(project.status)) {
    return <PortalActI />;
  }

  return <PortalActII />;
}


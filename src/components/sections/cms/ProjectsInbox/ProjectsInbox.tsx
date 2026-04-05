"use client";

import { useProjects } from "@/components/sections/cms/ProjectsProvider/ProjectsProvider";
import s from "./ProjectsInbox.module.css";

const STATUS_LABELS: Record<string, string> = {
  lead_new: "ახალი",
  lead_negotiating: "მოლაპარაკება",
  proposal_sent: "Proposal",
  active_collecting: "▶ მასალები",
  active_designing: "▶ დიზაინი",
  active_developing: "▶ კოდი",
  active_review: "▶ მიმოხილვა",
  completed: "✅ დასრულდა",
  cancelled: "გაუქმდა",
  lost: "დაიკარგა",
};

const STATUS_GROUP: Record<string, "urgent" | "pending" | "active" | "done"> = {
  lead_new: "pending",
  lead_negotiating: "pending",
  proposal_sent: "pending",
  active_collecting: "active",
  active_designing: "active",
  active_developing: "active",
  active_review: "active",
  completed: "done",
  cancelled: "done",
  lost: "done",
};

function formatRelative(dateStr: string): string {
  const ms = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(ms / 60_000);
  if (mins < 1) return "ახლა";
  if (mins < 60) return `${mins}წ`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}სთ`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}დ`;
  return new Date(dateStr).toLocaleDateString("ka-GE", { day: "numeric", month: "short" });
}

export default function ProjectsInbox() {
  const { projects, loadingList, selectedId, selectProject } = useProjects();

  // Sort: unread first → pending → active → done, then by updated_at desc
  const sorted = [...projects].sort((a, b) => {
    if (b.unread_count !== a.unread_count) return b.unread_count - a.unread_count;
    const groupOrder = { urgent: 0, pending: 1, active: 2, done: 3 };
    const ga = groupOrder[STATUS_GROUP[a.status] ?? "done"];
    const gb = groupOrder[STATUS_GROUP[b.status] ?? "done"];
    if (ga !== gb) return ga - gb;
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  });

  if (loadingList && projects.length === 0) {
    return (
      <aside className={s.inbox}>
        <div className={s.loadingShim}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={s.shimRow} />
          ))}
        </div>
      </aside>
    );
  }

  return (
    <aside className={s.inbox}>
      <div className={s.header}>
        <span className={s.headerTitle}>პროექტები</span>
        <span className={s.headerCount}>{projects.length}</span>
      </div>
      <ul className={s.list}>
        {sorted.map((project) => {
          const isSelected = project.id === selectedId;
          const group = STATUS_GROUP[project.status] ?? "done";
          return (
            <li key={project.id}>
              <button
                type="button"
                className={`${s.item} ${isSelected ? s.itemSelected : ""} ${s[`group_${group}`]}`}
                onClick={() => selectProject(project.id)}
              >
                <div className={s.itemTop}>
                  <span className={s.companyName}>
                    {project.companies?.name ?? "—"}
                  </span>
                  <span className={s.itemTime}>{formatRelative(project.updated_at)}</span>
                </div>
                <div className={s.itemMid}>
                  <span className={s.clientName}>{project.client_name}</span>
                  {project.unread_count > 0 && (
                    <span className={s.unreadBadge}>{project.unread_count}</span>
                  )}
                </div>
                <div className={s.itemBottom}>
                  <span className={`${s.statusBadge} ${s[`status_${group}`]}`}>
                    {STATUS_LABELS[project.status] ?? project.status}
                  </span>
                </div>
              </button>
            </li>
          );
        })}
        {sorted.length === 0 && (
          <li className={s.empty}>პროექტები არ მოიძებნა</li>
        )}
      </ul>
    </aside>
  );
}

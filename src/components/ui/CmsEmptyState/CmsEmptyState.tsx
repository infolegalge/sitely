import { Inbox } from "lucide-react";
import s from "./CmsEmptyState.module.css";

interface CmsEmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export default function CmsEmptyState({
  icon,
  title,
  description,
  action,
  className,
}: CmsEmptyStateProps) {
  return (
    <div className={`${s.wrap} ${className ?? ""}`}>
      <div className={s.icon}>{icon ?? <Inbox size={40} />}</div>
      <h3 className={s.title}>{title}</h3>
      {description && <p className={s.desc}>{description}</p>}
      {action}
    </div>
  );
}

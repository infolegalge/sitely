import s from "./CmsCard.module.css";

interface CmsCardProps {
  children: React.ReactNode;
  variant?: "default" | "compact" | "flat";
  hover?: boolean;
  className?: string;
}

export default function CmsCard({
  children,
  variant = "default",
  hover = true,
  className,
}: CmsCardProps) {
  const cardCls = [
    s.card,
    variant === "compact" && s.compact,
    variant === "flat" && s.flat,
    !hover && s.noHover,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={cardCls}>
      <div className={s.inner}>
        {children}
        {hover && <div className={s.scanLine} />}
      </div>
    </div>
  );
}

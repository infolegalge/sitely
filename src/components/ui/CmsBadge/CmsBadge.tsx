import s from "./CmsBadge.module.css";

type BadgeColor = "gray" | "blue" | "violet" | "green" | "gold" | "red" | "cyan";

interface CmsBadgeProps {
  children: React.ReactNode;
  color?: BadgeColor;
  dot?: boolean;
  pulse?: boolean;
  className?: string;
}

export default function CmsBadge({
  children,
  color = "gray",
  dot = false,
  pulse = false,
  className,
}: CmsBadgeProps) {
  const cls = [s.badge, s[color], pulse && s.pulse, className]
    .filter(Boolean)
    .join(" ");

  return (
    <span className={cls}>
      {dot && <span className={s.dot} />}
      {children}
    </span>
  );
}

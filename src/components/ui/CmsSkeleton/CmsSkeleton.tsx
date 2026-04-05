import s from "./CmsSkeleton.module.css";

type Variant = "line" | "circle" | "card" | "row";

interface CmsSkeletonProps {
  variant?: Variant;
  width?: string | number;
  height?: string | number;
  count?: number;
  gap?: string;
  className?: string;
}

export default function CmsSkeleton({
  variant = "line",
  width,
  height,
  count = 1,
  gap = "0.5rem",
  className,
}: CmsSkeletonProps) {
  const items = Array.from({ length: count });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap }} className={className}>
      {items.map((_, i) => (
        <div
          key={i}
          className={`${s.skeleton} ${s[variant]}`}
          style={{ width, height }}
        />
      ))}
    </div>
  );
}

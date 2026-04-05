import s from "./CmsSelect.module.css";

interface CmsSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
  compact?: boolean;
  wrapClassName?: string;
}

export default function CmsSelect({
  label,
  options,
  compact = false,
  wrapClassName,
  className,
  ...rest
}: CmsSelectProps) {
  return (
    <div className={`${s.wrap} ${wrapClassName ?? ""}`}>
      {label && <label className={s.label}>{label}</label>}
      <select
        className={`${s.select} ${compact ? s.sm : ""} ${className ?? ""}`}
        {...rest}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

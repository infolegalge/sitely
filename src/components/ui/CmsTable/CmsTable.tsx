import s from "./CmsTable.module.css";

/* ── Column definition ── */
export interface CmsColumn<K extends string = string> {
  key: K;
  label: string;
  sortable?: boolean;
  width?: string;
}

/* ── Props ── */
interface CmsTableProps<K extends string> {
  columns: CmsColumn<K>[];
  sortColumn?: string;
  sortOrder?: "asc" | "desc";
  onSort?: (key: K) => void;
  loading?: boolean;
  skelRows?: number;
  children: React.ReactNode;
  className?: string;
}

export default function CmsTable<K extends string>({
  columns,
  sortColumn,
  sortOrder,
  onSort,
  loading,
  skelRows = 6,
  children,
  className,
}: CmsTableProps<K>) {
  return (
    <div className={`${s.wrapper} ${className ?? ""}`}>
      <table className={s.table}>
        <thead>
          <tr>
            {columns.map((col) => {
              const isActive = sortColumn === col.key;
              return (
                <th
                  key={col.key}
                  className={`${s.th} ${col.sortable ? s.sortable : ""} ${isActive ? s.active : ""}`}
                  style={col.width ? { width: col.width } : undefined}
                  onClick={col.sortable && onSort ? () => onSort(col.key) : undefined}
                >
                  {col.label}
                  {isActive && (
                    <span className={s.arrow}>
                      {sortOrder === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {loading
            ? Array.from({ length: skelRows }).map((_, i) => (
                <tr key={i} className={s.skelRow}>
                  {columns.map((col, ci) => (
                    <td key={ci} className={s.skelCell}>
                      <div
                        className={s.skelBar}
                        style={{ width: `${55 + ((i + ci) % 4) * 12}%` }}
                      />
                    </td>
                  ))}
                </tr>
              ))
            : children}
        </tbody>
      </table>
    </div>
  );
}

/* ── Reusable Row & Cell ── */
export function CmsTableRow({
  children,
  className,
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <tr
      className={`${s.tr} ${className ?? ""}`}
      onClick={onClick}
      style={onClick ? { cursor: "pointer" } : undefined}
    >
      {children}
    </tr>
  );
}

export function CmsTableCell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <td className={`${s.td} ${className ?? ""}`}>{children}</td>;
}

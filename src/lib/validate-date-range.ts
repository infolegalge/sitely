const MAX_RANGE_DAYS = 365;

export function validateDateRange(
  from: string | null,
  to: string | null
): { valid: true; from: string | null; to: string | null } | { valid: false; error: string } {
  if (!from && !to) return { valid: true, from: null, to: null };

  if ((from && !to) || (!from && to)) {
    return { valid: false, error: "Both 'from' and 'to' are required" };
  }

  const fromDate = new Date(from!);
  const toDate = new Date(to!);

  if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
    return { valid: false, error: "Invalid date format" };
  }

  if (fromDate >= toDate) {
    return { valid: false, error: "'from' must be before 'to'" };
  }

  const diffMs = toDate.getTime() - fromDate.getTime();
  const diffDays = diffMs / 86_400_000;

  if (diffDays > MAX_RANGE_DAYS) {
    return { valid: false, error: `Date range must not exceed ${MAX_RANGE_DAYS} days` };
  }

  return { valid: true, from: from!, to: to! };
}

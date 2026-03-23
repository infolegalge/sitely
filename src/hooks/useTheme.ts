/** Dark-only theme — no toggling. Kept for API compatibility. */
export function useTheme() {
  return { theme: "dark" as const };
}

/* ═══════════════════════════════════════════════════════
   Shared Analytics Utilities
   Used by: LeadGrid, BehavioralPanels, JourneyDrawer, EventsGrid, KpiCards
   ═══════════════════════════════════════════════════════ */

/** Format seconds into Georgian time string */
export function formatTime(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}წმ`;
  const m = Math.floor(seconds / 60);
  const sec = Math.round(seconds % 60);
  return `${m}წ ${sec}წმ`;
}

/** Format ISO date string to relative Georgian time */
export function relativeDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "ახლა";
  if (mins < 60) return `${mins} წუთის წინ`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} სთ-ს წინ`;
  const days = Math.floor(hrs / 24);
  return `${days} დღის წინ`;
}

/** Format ISO date to Georgian locale short date with time */
export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("ka-GE", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Event type labels in Georgian  */
export const EVENT_LABELS: Record<string, string> = {
  page_open: "გვერდის გახსნა",
  page_leave: "გვერდის დატოვება",
  scroll_25: "სქროლი 25%",
  scroll_50: "სქროლი 50%",
  scroll_75: "სქროლი 75%",
  scroll_100: "სქროლი 100%",
  time_10s: "10 წამი",
  time_30s: "30 წამი",
  time_60s: "1 წუთი",
  time_180s: "3 წუთი",
  time_300s: "5 წუთი",
  active_time_10s: "აქტიური 10წმ",
  active_time_30s: "აქტიური 30წმ",
  active_time_60s: "აქტიური 1წ",
  active_time_180s: "აქტიური 3წ",
  active_time_300s: "აქტიური 5წ",
  click_phone: "ტელეფონზე კლიკი",
  click_email: "ემაილზე კლიკი",
  click_cta: "CTA კლიკი",
  click_sitely: "Sitely კლიკი",
  form_submit: "ფორმის გაგზავნა",
  form_start: "ფორმის დაწყება",
  form_abandon: "ფორმის მიტოვება",
  rage_click: "Rage Click",
  section_view: "სექციის ნახვა",
  interaction_3d: "3D ინტერაქცია",
  js_error: "JS შეცდომა",
};

/** Event category grouping for EventsGrid */
export const EVENT_CATEGORIES: { label: string; keys: string[] }[] = [
  {
    label: "გვერდი",
    keys: ["page_open", "page_leave"],
  },
  {
    label: "სქროლი",
    keys: ["scroll_25", "scroll_50", "scroll_75", "scroll_100"],
  },
  {
    label: "დრო",
    keys: ["time_10s", "time_30s", "time_60s", "time_180s", "time_300s"],
  },
  {
    label: "კლიკები",
    keys: ["click_phone", "click_email", "click_cta", "click_sitely"],
  },
  {
    label: "ფორმა",
    keys: ["form_submit", "form_start", "form_abandon"],
  },
  {
    label: "ქცევა",
    keys: ["rage_click", "section_view", "interaction_3d"],
  },
  {
    label: "შეცდომები",
    keys: ["js_error"],
  },
];

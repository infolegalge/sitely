import Handlebars from "handlebars";

export interface CompanyData {
  company_name: string;
  company_name_class: string;
  category: string;
  categories: string[];
  phone: string;
  phone_display: string;
  email: string;
  address: string;
  website: string;
  rating: number | null;
  review_count: number;
  description: string;
  images: string[];
  working_hours: Record<string, string> | null;
  working_hours_text: string;
  reviews: { author: string; text: string; rating: number; date: string; owner_response: string }[];
  review_snippets: string[];
  booking_link: string;
  menu_link: string;
  social: Record<string, string>;
  map_embed_url: string;
  google_maps_url: string;
  lat: number | null;
  lng: number | null;
}

interface CompanyRow {
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  website: string | null;
  rating: number | null;
  reviews_count: number | null;
  category: string | null;
  categories: string | null;
  lat: number | null;
  lng: number | null;
  metadata: Record<string, unknown> | null;
}

/* ── Internal helpers ── */

/** Extract a clean callable phone number from messy phone strings */
function extractFirstPhone(raw: string): string {
  // Split by common delimiters: ; , /
  const parts = raw.split(/[;,/]/).map((s) => s.trim());
  for (const part of parts) {
    // Extract digits, +, -, (, ), spaces — valid phone chars
    const cleaned = part.replace(/[^\d+\-() ]/g, "").trim();
    // Must have at least 6 digits to be a real phone
    if (cleaned.replace(/\D/g, "").length >= 6) return cleaned;
  }
  return raw.trim();
}

/** Format phone for display (keep readable but limit length) */
function formatPhoneDisplay(raw: string): string {
  const parts = raw.split(/[;]/).map((s) => s.trim()).filter(Boolean);
  if (parts.length <= 1) return raw.trim();
  // Show first phone number only, clean
  const first = parts[0].replace(/[^\d+\-() ]/g, "").trim();
  return first || parts[0];
}

/** Parse working_hours string → Record<day, time> */
function parseWorkingHoursString(raw: string): Record<string, string> | null {
  if (!raw || typeof raw !== "string") return null;
  // Typical format: "Sunday, Open 24 hours, Monday, 9 am to 9 pm, ..."
  // Or: "Sunday, 9 am – 9 pm, Copy open hours"
  const cleaned = raw
    .replace(/,?\s*Copy open hours/gi, "")
    .replace(/,?\s*Hours might differ/gi, "")
    .trim();
  if (!cleaned) return null;

  const dayNames = [
    "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday",
    "ორშაბათი", "სამშაბათი", "ოთხშაბათი", "ხუთშაბათი", "პარასკევი", "შაბათი", "კვირა",
  ];
  const parts = cleaned.split(",").map((s) => s.trim()).filter(Boolean);
  const result: Record<string, string> = {};
  for (let i = 0; i < parts.length; i++) {
    const isDay = dayNames.some((d) => parts[i].toLowerCase() === d.toLowerCase());
    if (isDay && i + 1 < parts.length) {
      const nextIsDay = dayNames.some((d) => parts[i + 1].toLowerCase() === d.toLowerCase());
      if (!nextIsDay) {
        result[parts[i]] = parts[i + 1];
        i++; // skip the time part
      } else {
        result[parts[i]] = "—";
      }
    }
  }
  return Object.keys(result).length > 0 ? result : null;
}

/** Deduplicate reviews by author+text */
function deduplicateReviews(
  reviews: { author: string; text: string; rating: number; date: string; owner_response: string }[]
): { author: string; text: string; rating: number; date: string; owner_response: string }[] {
  const seen = new Set<string>();
  return reviews.filter((r) => {
    const key = `${r.author}::${r.text}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** Clean author name — replace _ with spaces, trim */
function cleanAuthorName(name: string): string {
  return name.replace(/_/g, " ").trim() || "User";
}

/** Determine hero font-size class based on name length */
function getNameClass(name: string): string {
  const len = name.length;
  if (len <= 15) return "name-short";
  if (len <= 30) return "name-medium";
  if (len <= 50) return "name-long";
  return "name-xlong";
}

/**
 * Extract and normalize company data from a DB row,
 * applying the fallback chain defined in CMS_PLAN_FINAL.md §6.
 */
export function buildCompanyData(
  company: CompanyRow,
  fallbackImages: string[] = []
): CompanyData {
  const gm = (company.metadata?.gm ?? {}) as Record<string, unknown>;
  const yell = (company.metadata?.yell ?? {}) as Record<string, unknown>;
  const social = (company.metadata?.social ?? {}) as Record<string, unknown>;

  const gmImages = Array.isArray(gm.image_urls) ? (gm.image_urls as string[]) : [];
  const images = gmImages.length > 0 ? gmImages : fallbackImages;

  // Use gm.reviews (objects with author/text/rating/date), NOT gm.review_snippets (plain strings)
  const gmReviews = Array.isArray(gm.reviews)
    ? (gm.reviews as { author: string; text: string; rating?: number; date?: string }[])
    : [];

  const rawReviews = gmReviews.map((r) => ({
    author: cleanAuthorName(r.author || "User"),
    text: r.text || "",
    rating: typeof r.rating === "number" ? r.rating : 5,
    date: r.date || "",
    owner_response: typeof (r as Record<string, unknown>).ownerResponse === "string"
      ? ((r as Record<string, unknown>).ownerResponse as string).replace(/^Response from the owner$/i, "").trim()
      : "",
  }));

  // Deduplicate and filter out empty-text reviews
  const reviews = deduplicateReviews(rawReviews).filter((r) => r.text.length > 0);

  // Review snippets — short quote fragments for display
  const gmSnippets = Array.isArray(gm.review_snippets) ? (gm.review_snippets as string[]) : [];
  const reviewSnippets = [...new Set(gmSnippets)].filter((s) => s.length > 20).slice(0, 3);

  // Parse working_hours — always a string in DB, never an object
  let workingHours: Record<string, string> | null = null;
  if (typeof gm.working_hours === "string") {
    workingHours = parseWorkingHoursString(gm.working_hours);
  } else if (typeof gm.working_hours === "object" && gm.working_hours) {
    workingHours = gm.working_hours as Record<string, string>;
  }
  if (!workingHours && typeof yell.working_hours === "string") {
    workingHours = parseWorkingHoursString(yell.working_hours);
  } else if (!workingHours && typeof yell.working_hours === "object" && yell.working_hours) {
    workingHours = yell.working_hours as Record<string, string>;
  }

  // Phone: extract first clean phone for tel: links
  const rawPhone = company.phone || (gm.phone as string) || "";
  const cleanPhone = rawPhone ? extractFirstPhone(rawPhone) : "";
  const phoneDisplay = rawPhone ? formatPhoneDisplay(rawPhone) : "";

  // Company name: prefer shorter DB name when gm.name is excessively long
  const gmName = (gm.name as string) || "";
  const dbName = company.name || "";
  const companyName = gmName.length > 40 && dbName.length > 0 && dbName.length < gmName.length
    ? dbName
    : gmName || dbName || "Your Business";

  // Email: use first one if multiple separated by ;
  const rawEmail = company.email || "";
  const email = rawEmail.split(";")[0].trim();

  // Review count: use DB reviews_count, fallback to reviews array length
  const reviewCount = company.reviews_count ?? reviews.length;

  // Description: fallback to generic
  const description = (gm.description as string) || (yell.description as string) || "";

  // Categories: parse from semicolon/comma separated string
  const rawCategories = company.categories || "";
  const categories = rawCategories
    .split(/[;,]/)
    .map((c) => c.trim())
    .filter((c) => c.length > 0);

  // Working hours text: Georgian readable text from yell
  const workingHoursText = typeof yell.working_hours === "string" ? (yell.working_hours as string) : "";

  // Google Maps URL
  const googleMapsUrl = (gm.url as string) || "";

  // gm.services as full-week working hours (7-element array = Sun-Sat)
  if (!workingHours) {
    const svc = Array.isArray(gm.services) ? (gm.services as string[]) : [];
    if (svc.length === 7) {
      const dayOrder = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const parsed: Record<string, string> = {};
      for (let i = 0; i < 7; i++) {
        if (svc[i]) parsed[dayOrder[i]] = svc[i];
      }
      if (Object.keys(parsed).length > 0) workingHours = parsed;
    }
  }

  return {
    company_name: companyName,
    company_name_class: getNameClass(companyName),
    category: company.category || "",
    categories,
    phone: cleanPhone,
    phone_display: phoneDisplay || cleanPhone,
    email,
    address: (gm.address as string) || company.address || "",
    website: company.website || "",
    rating: company.rating ?? null,
    review_count: reviewCount,
    description,
    images,
    working_hours: workingHours,
    working_hours_text: workingHoursText,
    reviews,
    review_snippets: reviewSnippets,
    booking_link: (gm.booking_link as string) || "",
    menu_link: (gm.menu_link as string) || "",
    social: Object.fromEntries(
      Object.entries(social).filter((e): e is [string, string] => typeof e[1] === "string" && e[1] !== "")
    ),
    map_embed_url: (gm.map_embed_url as string) || "",
    google_maps_url: googleMapsUrl,
    lat: company.lat ?? null,
    lng: company.lng ?? null,
  };
}

/* ── Register custom Handlebars helpers ── */

Handlebars.registerHelper("gt", (a: number, b: number) => a > b);
Handlebars.registerHelper("gte", (a: number, b: number) => typeof a === "number" && a >= b);
Handlebars.registerHelper("eq", (a: unknown, b: unknown) => a === b);
Handlebars.registerHelper("len", (arr: unknown[]) => (Array.isArray(arr) ? arr.length : 0));
Handlebars.registerHelper("not_null", (val: unknown) => val !== null && val !== undefined);

Handlebars.registerHelper("star_fill", (rating: number, star: number) =>
  star <= Math.floor(rating) ? "#FF3B30" : "rgba(255,59,48,.15)"
);

Handlebars.registerHelper("initial", (name: string) =>
  typeof name === "string" && name.length > 0 ? name[0].toUpperCase() : "?"
);

Handlebars.registerHelper("limit", function (arr: unknown[], n: number) {
  if (!Array.isArray(arr)) return [];
  return arr.slice(0, n);
});

Handlebars.registerHelper("add", (a: number, b: number) => a + b);

Handlebars.registerHelper("default", (val: unknown, fallback: unknown) =>
  val !== undefined && val !== null && val !== "" ? val : fallback
);

Handlebars.registerHelper("pad_num", (n: number) =>
  String(n).padStart(2, "0")
);

Handlebars.registerHelper("truncate", (str: string, len: number) => {
  if (typeof str !== "string") return "";
  return str.length > len ? str.slice(0, len) + "…" : str;
});

Handlebars.registerHelper("or", function (...args: unknown[]) {
  for (let i = 0; i < args.length - 1; i++) {
    if (args[i]) return args[i];
  }
  return "";
});

Handlebars.registerHelper("math_floor", (n: number) => Math.floor(n));

Handlebars.registerHelper("repeat", function (n: number, options: Handlebars.HelperOptions) {
  let out = "";
  for (let i = 1; i <= n; i++) {
    out += options.fn({ num: i });
  }
  return out;
});

Handlebars.registerHelper("subtract", (a: number, b: number) => a - b);

/**
 * Compile a Handlebars HTML template string with company data.
 * Returns the final HTML string ready to serve.
 */
export function compileTemplate(
  htmlTemplate: string,
  data: CompanyData,
): string {
  const template = Handlebars.compile(htmlTemplate);
  return template(data);
}

/**
 * Safely inject trusted HTML (tracking scripts, CTA) before </body>.
 * Uses lastIndexOf to find the real closing tag, avoiding XSS if
 * escaped data accidentally contains </body> strings.
 *
 * IMPORTANT: `injections` must be trusted server-side strings, never user input.
 */
export function injectBeforeBodyClose(html: string, ...injections: string[]): string {
  const combined = injections.filter(Boolean).join("\n");
  if (!combined) return html;

  const closingTag = "</body>";
  const idx = html.lastIndexOf(closingTag);
  if (idx === -1) return html + combined;

  return html.slice(0, idx) + combined + "\n" + html.slice(idx);
}

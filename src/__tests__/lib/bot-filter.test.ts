import { describe, it, expect } from "vitest";
import { isBot } from "@/lib/bot-filter";

describe("isBot", () => {
  it("detects Googlebot", () => {
    expect(isBot("Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)")).toBe(true);
  });

  it("detects Bingbot", () => {
    expect(isBot("Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)")).toBe(true);
  });

  it("detects Facebook crawler", () => {
    expect(isBot("facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)")).toBe(true);
  });

  it("detects LinkedIn bot", () => {
    expect(isBot("LinkedInBot/1.0 (compatible; Mozilla/5.0)")).toBe(true);
  });

  it("detects Google Safety scanner", () => {
    expect(isBot("Mozilla/5.0 Google-Safety")).toBe(true);
  });

  it("detects Microsoft Office link check", () => {
    expect(isBot("Microsoft Office/16.0 (Windows NT 10.0)")).toBe(true);
  });

  it("detects curl", () => {
    expect(isBot("curl/7.64.1")).toBe(true);
  });

  it("detects python-requests", () => {
    expect(isBot("python-requests/2.25.1")).toBe(true);
  });

  it("detects HeadlessChrome", () => {
    expect(isBot("Mozilla/5.0 HeadlessChrome/91.0.4472.124")).toBe(true);
  });

  it("allows real Chrome browser", () => {
    expect(isBot("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")).toBe(false);
  });

  it("allows real Firefox browser", () => {
    expect(isBot("Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0")).toBe(false);
  });

  it("allows real Safari browser", () => {
    expect(isBot("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15")).toBe(false);
  });

  it("rejects null/undefined/empty user agent", () => {
    expect(isBot(null)).toBe(true);
    expect(isBot(undefined)).toBe(true);
    expect(isBot("")).toBe(true);
  });

  it("rejects very short user agent (likely spoofed)", () => {
    expect(isBot("Mozilla")).toBe(true);
  });
});

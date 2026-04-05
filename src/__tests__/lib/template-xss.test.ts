import { describe, it, expect } from "vitest";
import { injectBeforeBodyClose } from "@/lib/template-engine";

describe("injectBeforeBodyClose", () => {
  it("injects script before the last </body> tag", () => {
    const html = "<html><body><p>Hello</p></body></html>";
    const result = injectBeforeBodyClose(html, "<script>test</script>");
    expect(result).toContain("<script>test</script>\n</body>");
    expect(result.indexOf("<script>test</script>")).toBeLessThan(
      result.lastIndexOf("</body>")
    );
  });

  it("uses lastIndexOf, not first match", () => {
    // Simulates case where escaped review data might contain </body> text
    const html =
      '<html><body><div>&lt;/body&gt;</div><p>real content</p></body></html>';
    const result = injectBeforeBodyClose(html, "<script>safe</script>");
    // Script should be injected before the LAST </body>
    const scriptIdx = result.indexOf("<script>safe</script>");
    const lastBodyIdx = result.lastIndexOf("</body>");
    expect(scriptIdx).toBeLessThan(lastBodyIdx);
  });

  it("handles multiple injections", () => {
    const html = "<html><body><p>Test</p></body></html>";
    const result = injectBeforeBodyClose(html, "<style>.a{}</style>", "<script>b</script>");
    expect(result).toContain("<style>.a{}</style>");
    expect(result).toContain("<script>b</script>");
    expect(result).toContain("</body>");
  });

  it("appends if no </body> tag exists", () => {
    const html = "<html><body><p>No closing</p>";
    const result = injectBeforeBodyClose(html, "<script>test</script>");
    expect(result).toContain("<script>test</script>");
  });

  it("returns original html if no injections provided", () => {
    const html = "<html><body></body></html>";
    const result = injectBeforeBodyClose(html);
    expect(result).toBe(html);
  });

  it("filters out empty strings", () => {
    const html = "<html><body></body></html>";
    const result = injectBeforeBodyClose(html, "", "", "");
    expect(result).toBe(html);
  });
});

describe("XSS prevention in template data", () => {
  it("Handlebars double-stache escapes HTML in data", async () => {
    const Handlebars = await import("handlebars");
    const template = Handlebars.default.compile("<p>{{name}}</p>");
    const result = template({ name: '<script>alert("xss")</script>' });
    expect(result).not.toContain("<script>");
    expect(result).toContain("&lt;script&gt;");
  });

  it("review text with HTML tags is escaped by Handlebars", async () => {
    const Handlebars = await import("handlebars");
    const template = Handlebars.default.compile("<div>{{review}}</div>");
    const result = template({
      review: 'Great place!</body><script>steal(document.cookie)</script>',
    });
    expect(result).not.toContain("<script>");
    expect(result).toContain("&lt;script&gt;");
    expect(result).not.toContain("</body>");
  });
});

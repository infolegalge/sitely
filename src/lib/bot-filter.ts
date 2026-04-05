const BOT_UA_PATTERNS = [
  /googlebot/i,
  /bingbot/i,
  /slurp/i,
  /duckduckbot/i,
  /facebookexternalhit/i,
  /linkedinbot/i,
  /google-safety/i,
  /microsoft office/i,
  /wget/i,
  /curl/i,
  /python-requests/i,
  /headlesschrome/i,
  /phantomjs/i,
  /crawl/i,
  /spider/i,
  /bot\b/i,
];

export function isBot(ua: string | null | undefined): boolean {
  if (!ua) return true;
  return BOT_UA_PATTERNS.some((p) => p.test(ua));
}

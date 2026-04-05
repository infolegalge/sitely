import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

let trackingRatelimit: Ratelimit | null = null;
let claimRatelimit: Ratelimit | null = null;
let warnedTracking = false;
let warnedClaim = false;

export function getTrackingRateLimiter(): Ratelimit | null {
  if (trackingRatelimit) return trackingRatelimit;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    if (!warnedTracking) {
      console.warn("[rate-limit] UPSTASH_REDIS_REST_URL/TOKEN missing — tracking rate limiting disabled");
      warnedTracking = true;
    }
    return null;
  }

  trackingRatelimit = new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(30, "1 m"),
    prefix: "tracking",
  });

  return trackingRatelimit;
}

export function getClaimRateLimiter(): Ratelimit | null {
  if (claimRatelimit) return claimRatelimit;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    if (!warnedClaim) {
      console.warn("[rate-limit] UPSTASH_REDIS_REST_URL/TOKEN missing — claim rate limiting disabled");
      warnedClaim = true;
    }
    return null;
  }

  claimRatelimit = new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(5, "1 h"),
    prefix: "claim",
  });

  return claimRatelimit;
}

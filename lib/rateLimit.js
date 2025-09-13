// lib/rateLimit.js
const requests = new Map();

/**
 * Simple in-memory rate limiter per IP.
 * Works in warm serverless functions, but resets on cold start.
 * For production, swap with Redis (Upstash).
 */
export function rateLimit(req, limit = 10, windowMs = 60_000) {
  const ip = req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "unknown";
  const now = Date.now();

  const entry = requests.get(ip) || { count: 0, start: now };
  if (now - entry.start > windowMs) {
    entry.count = 0;
    entry.start = now;
  }

  entry.count++;
  requests.set(ip, entry);

  return entry.count <= limit;
}

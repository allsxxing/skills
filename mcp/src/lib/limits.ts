// Rate limiting for the open read path.
//
// There is no per-user identity on an authless connection, and claude.ai proxies every web user
// through a small Anthropic egress range, so those requests all look like one caller. Desktop,
// Claude Code, Grok and Gemini connect straight from the user's machine and do have distinct IPs.
// So: one generous shared bucket for the Anthropic pool, a tight per-IP bucket for everyone else.
// Allowlisting the Anthropic range instead of tiering would lock out every non-web client.
//
// This is a per-instance backstop, not cross-region enforcement. Vercel's WAF is the place for
// that; this exists so a single hot instance cannot be trivially hammered.

const ANTHROPIC_V4 = { base: "160.79.104.0", bits: 21 };
const ANTHROPIC_V6_PREFIX = "2607:6bc0:";

const TIERS = {
  anthropic: { capacity: 600, refillPerSec: 100 },
  ip: { capacity: 60, refillPerSec: 3 },
} as const;

function ipv4ToInt(ip: string): number | null {
  const parts = ip.split(".");
  if (parts.length !== 4) return null;
  let n = 0;
  for (const p of parts) {
    const v = Number(p);
    if (!Number.isInteger(v) || v < 0 || v > 255) return null;
    n = (n << 8) | v;
  }
  return n >>> 0;
}

function inAnthropicRange(ip: string): boolean {
  if (ip.includes(":")) return ip.toLowerCase().startsWith(ANTHROPIC_V6_PREFIX);
  const a = ipv4ToInt(ip);
  const b = ipv4ToInt(ANTHROPIC_V4.base);
  if (a === null || b === null) return false;
  const mask = ANTHROPIC_V4.bits === 0 ? 0 : (0xffffffff << (32 - ANTHROPIC_V4.bits)) >>> 0;
  return (a & mask) === (b & mask);
}

/**
 * The caller's real address. Vercel sets x-vercel-forwarded-for itself and a client cannot forge
 * it, so it is preferred over x-forwarded-for, whose first hop is caller-supplied off-platform.
 */
export function clientIp(request: Request): string {
  const h = request.headers;
  const vercel = h.get("x-vercel-forwarded-for");
  if (vercel) return vercel.split(",")[0].trim();
  const real = h.get("x-real-ip");
  if (real) return real.trim();
  return (h.get("x-forwarded-for") ?? "unknown").split(",")[0].trim();
}

const buckets = new Map<string, { tokens: number; at: number }>();
const MAX_KEYS = 5000;

export interface Verdict {
  ok: boolean;
  retryAfter: number;
  bucket: string;
}

export function consume(request: Request, cost = 1): Verdict {
  const ip = clientIp(request);
  const anthropic = inAnthropicRange(ip);
  const key = anthropic ? "anthropic" : `ip:${ip}`;
  const tier = anthropic ? TIERS.anthropic : TIERS.ip;
  const now = Date.now();

  // Cheap guard against unbounded growth on a long-lived instance.
  if (buckets.size > MAX_KEYS) buckets.clear();

  const b = buckets.get(key) ?? { tokens: tier.capacity, at: now };
  b.tokens = Math.min(tier.capacity, b.tokens + ((now - b.at) / 1000) * tier.refillPerSec);
  b.at = now;

  if (b.tokens < cost) {
    buckets.set(key, b);
    return { ok: false, retryAfter: Math.ceil((cost - b.tokens) / tier.refillPerSec), bucket: key };
  }
  b.tokens -= cost;
  buckets.set(key, b);
  return { ok: true, retryAfter: 0, bucket: key };
}

export function tooMany(v: Verdict): Response {
  return new Response(
    JSON.stringify({
      error: "rate_limited",
      message: `Too many requests. Retry in ${v.retryAfter}s.`,
      retry_after_seconds: v.retryAfter,
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(v.retryAfter),
        "Access-Control-Allow-Origin": "*",
      },
    },
  );
}

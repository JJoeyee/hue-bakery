const buckets = new Map<string, { count: number; resetAt: number }>();
const MAX_BUCKETS = 2000;

function clientKey(request: Request, bucket: string) {
  const address = request.headers.get("CF-Connecting-IP") || request.headers.get("x-real-ip") || "unknown";
  return `${bucket}:${address}`;
}

export function consumeRateLimit(request: Request, bucket: string, limit: number, windowMs: number) {
  const now = Date.now();
  const key = clientKey(request, bucket);
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    if (buckets.size >= MAX_BUCKETS) buckets.clear();
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (current.count >= limit) return false;
  current.count += 1;
  return true;
}

export function rateLimitResponse() {
  return Response.json({ error: "Too many attempts. Please wait a few minutes and try again." }, {
    status: 429,
    headers: { "Retry-After": "900", "Cache-Control": "no-store" },
  });
}

export function rejectCrossOriginRequest(request: Request) {
  const origin = request.headers.get("Origin");
  if (!origin) return null;
  try {
    if (new URL(origin).origin === new URL(request.url).origin) return null;
  } catch {
    // Treat malformed origins as untrusted.
  }
  return Response.json({ error: "This request is not allowed." }, { status: 403, headers: { "Cache-Control": "no-store" } });
}

export function rejectOversizedBody(request: Request, maxBytes: number) {
  const contentLength = Number(request.headers.get("Content-Length") || 0);
  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    return Response.json({ error: "The submitted data is too large." }, { status: 413, headers: { "Cache-Control": "no-store" } });
  }
  return null;
}

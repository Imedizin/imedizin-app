const DEFAULT_ORIGIN = "http://localhost:5173";

/**
 * Parse FRONTEND_URL env (single origin or comma-separated) into an array of allowed CORS origins.
 * Used by REST CORS and Socket.IO gateway.
 */
export function getCorsOrigins(): string[] {
  const raw = process.env.FRONTEND_URL ?? DEFAULT_ORIGIN;
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Value to pass to NestJS enableCors({ origin }) and Socket.IO cors.origin:
 * - One origin: string
 * - Multiple: string[]
 * - Fallback: default dev origin
 */
export function getCorsOriginConfig(): string | string[] {
  const origins = getCorsOrigins();
  if (origins.length > 1) return origins;
  return origins[0] ?? DEFAULT_ORIGIN;
}

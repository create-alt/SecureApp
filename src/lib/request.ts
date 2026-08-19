import "server-only";

export function getClientIp(requestHeaders: Headers): string | null {
  const forwardedFor = requestHeaders.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0]!.trim();
  return requestHeaders.get("x-real-ip");
}

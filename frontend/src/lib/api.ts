const rawApiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
const normalizedApiBaseUrl = rawApiBaseUrl.replace(/\/$/, "");

/**
 * Builds a backend URL that falls back to same-origin requests when
 * NEXT_PUBLIC_API_BASE_URL is not provided.
 */
export function apiUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${normalizedApiBaseUrl}${normalizedPath}`;
}

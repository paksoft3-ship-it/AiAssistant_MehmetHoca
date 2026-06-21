/**
 * Centralized client-side API access (CLAUDE.md §26). All server calls go
 * through here so error handling, timeouts, and JSON parsing are consistent.
 */
export interface ApiError extends Error {
  status?: number;
  code?: string;
}

export async function apiPost<T>(
  url: string,
  body: unknown,
  opts?: { timeoutMs?: number },
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), opts?.timeoutMs ?? 35_000);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err: ApiError = new Error(
        (data && (data as { error?: string }).error) || `İstek başarısız oldu (${res.status}).`,
      );
      err.status = res.status;
      err.code = (data as { code?: string }).code;
      throw err;
    }
    return data as T;
  } finally {
    clearTimeout(timeout);
  }
}

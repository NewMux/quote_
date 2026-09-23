/** PostgREST rejects a just-issued access token with PGRST303 ("JWT issued at future") when its
 * clock is a moment behind the auth server's. The same token is accepted a second later, so the
 * request is retried once after a short wait instead of surfacing as an error. */
export const CLOCK_SKEW_RETRY_MS = 1500;

export function isClockSkewResponse(status: number, body: string): boolean {
  return status === 401 && body.includes('PGRST303');
}

type Fetch = typeof fetch;

/** Wraps fetch so a PGRST303 response is retried once after `delayMs`. */
export function withClockSkewRetry(baseFetch: Fetch, delayMs = CLOCK_SKEW_RETRY_MS): Fetch {
  return async (input, init) => {
    const response = await baseFetch(input, init);
    if (response.status !== 401) return response;
    const body = await response.clone().text();
    if (!isClockSkewResponse(response.status, body)) return response;
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    return baseFetch(input, init);
  };
}

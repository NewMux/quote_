import { isClockSkewResponse, withClockSkewRetry } from './retryTransient';

function response(status: number, body: string): Response {
  return {
    status,
    clone: () => response(status, body),
    text: async () => body,
  } as unknown as Response;
}

const SKEW_BODY = '{"code":"PGRST303","details":null,"hint":null,"message":"JWT issued at future"}';

describe('isClockSkewResponse', () => {
  it('matches the PGRST303 401', () => {
    expect(isClockSkewResponse(401, SKEW_BODY)).toBe(true);
  });

  it('ignores other failures', () => {
    expect(isClockSkewResponse(401, '{"code":"PGRST301","message":"JWT expired"}')).toBe(false);
    expect(isClockSkewResponse(500, SKEW_BODY)).toBe(false);
  });
});

describe('withClockSkewRetry', () => {
  it('retries once after a PGRST303 and returns the retry result', async () => {
    const base = jest.fn().mockResolvedValueOnce(response(401, SKEW_BODY)).mockResolvedValueOnce(response(200, '[]'));
    const result = await withClockSkewRetry(base as unknown as typeof fetch, 0)('https://x', {});
    expect(base).toHaveBeenCalledTimes(2);
    expect(result.status).toBe(200);
  });

  it('does not retry successes or other errors', async () => {
    const ok = jest.fn().mockResolvedValue(response(200, '[]'));
    await withClockSkewRetry(ok as unknown as typeof fetch, 0)('https://x', {});
    expect(ok).toHaveBeenCalledTimes(1);

    const expired = jest.fn().mockResolvedValue(response(401, '{"code":"PGRST301"}'));
    const result = await withClockSkewRetry(expired as unknown as typeof fetch, 0)('https://x', {});
    expect(expired).toHaveBeenCalledTimes(1);
    expect(result.status).toBe(401);
  });

  it('retries only once', async () => {
    const base = jest.fn().mockResolvedValue(response(401, SKEW_BODY));
    const result = await withClockSkewRetry(base as unknown as typeof fetch, 0)('https://x', {});
    expect(base).toHaveBeenCalledTimes(2);
    expect(result.status).toBe(401);
  });
});

import { useEffect, useState } from 'react';
import { getSignedUrl } from './fileStorage';

const cache = new Map<string, string>();

/** Resolves a Storage object path (as saved on a client/business-profile/settlement record) into
 * a temporary fetchable URL for display. Returns null while resolving or if the path is empty. */
export function useSignedUrl(path: string | null | undefined): string | null {
  const [url, setUrl] = useState<string | null>(path ? (cache.get(path) ?? null) : null);

  useEffect(() => {
    if (!path) {
      setUrl(null);
      return;
    }
    const cached = cache.get(path);
    if (cached) {
      setUrl(cached);
      return;
    }
    let cancelled = false;
    getSignedUrl(path)
      .then((signedUrl) => {
        cache.set(path, signedUrl);
        if (!cancelled) setUrl(signedUrl);
      })
      .catch(() => {
        if (!cancelled) setUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [path]);

  return url;
}

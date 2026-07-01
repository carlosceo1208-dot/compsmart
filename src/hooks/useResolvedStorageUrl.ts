import { useEffect, useState } from "react";
import { resolveSignedUrl } from "@/lib/storageUrl";

/**
 * Resolves any stored avatar/logo URL to a fresh signed URL on mount.
 * Handles legacy public URLs from before the bucket became private.
 */
export function useResolvedStorageUrl(bucket: string, urlOrPath: string | null | undefined) {
  const [resolved, setResolved] = useState<string | null>(urlOrPath ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setError(false);
    if (!urlOrPath) {
      setResolved(null);
      return;
    }
    // If it's already a signed URL, use as-is initially (image onError will trigger refresh)
    setResolved(urlOrPath);

    // If it's a legacy public URL, proactively resolve to a signed URL
    if (urlOrPath.includes("/object/public/")) {
      setLoading(true);
      resolveSignedUrl(bucket, urlOrPath)
        .then((u) => {
          if (cancelled) return;
          if (u) setResolved(u);
          else setError(true);
        })
        .finally(() => !cancelled && setLoading(false));
    }
    return () => {
      cancelled = true;
    };
  }, [bucket, urlOrPath]);

  const refresh = async () => {
    if (!urlOrPath) return;
    setLoading(true);
    setError(false);
    const u = await resolveSignedUrl(bucket, urlOrPath);
    if (u) setResolved(u);
    else setError(true);
    setLoading(false);
  };

  return { url: resolved, loading, error, refresh, markBroken: () => setError(true) };
}

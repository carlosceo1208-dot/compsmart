import { supabase } from "@/integrations/supabase/client";

/**
 * Extract the object path (inside a bucket) from either a Supabase public URL
 * (`/storage/v1/object/public/<bucket>/<path>`) or a signed URL
 * (`/storage/v1/object/sign/<bucket>/<path>?token=...`). Returns null if the
 * URL doesn't look like a Supabase Storage URL for the given bucket.
 */
export function extractStoragePath(bucket: string, url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const re = new RegExp(`/storage/v1/object/(?:public|sign)/${bucket}/([^?]+)`);
    const m = url.match(re);
    if (m?.[1]) return decodeURIComponent(m[1]);
    // Fallback: bucket/path form
    const re2 = new RegExp(`/${bucket}/([^?]+)`);
    const m2 = url.match(re2);
    return m2?.[1] ? decodeURIComponent(m2[1]) : null;
  } catch {
    return null;
  }
}

const cache = new Map<string, { url: string; expiresAt: number }>();
const TEN_YEARS = 60 * 60 * 24 * 365 * 10;

/**
 * Given a stored URL (public or signed) or a bare storage path, return a
 * fresh signed URL. Results are cached in-memory for 30 minutes so repeated
 * renders don't hammer the API.
 */
export async function resolveSignedUrl(
  bucket: string,
  urlOrPath: string | null | undefined,
): Promise<string | null> {
  if (!urlOrPath) return null;

  // If it's already a signed URL that is fresh enough, keep it.
  const isSigned = urlOrPath.includes("/object/sign/");
  const isPublic = urlOrPath.includes("/object/public/");

  const path = isSigned || isPublic ? extractStoragePath(bucket, urlOrPath) : urlOrPath;
  if (!path) return isSigned ? urlOrPath : null;

  const cacheKey = `${bucket}:${path}`;
  const now = Date.now();
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > now) return cached.url;

  // If it's already signed and not obviously expired, still return it while
  // we don't have a way to inspect the JWT here. Public URLs must be re-signed.
  if (isSigned && !isPublic) {
    cache.set(cacheKey, { url: urlOrPath, expiresAt: now + 30 * 60 * 1000 });
    return urlOrPath;
  }

  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, TEN_YEARS);
  if (error || !data?.signedUrl) return null;
  cache.set(cacheKey, { url: data.signedUrl, expiresAt: now + 30 * 60 * 1000 });
  return data.signedUrl;
}

function clearSignedUrlCache() {
  cache.clear();
}

// A small pool of public Overpass mirrors. Overpass's usage policy asks
// clients not to hammer a single instance — rotating on failure/429 spreads
// load and gives automatic failover instead of a hard outage.
const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
] as const;

export interface OverpassElement {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

export interface Bounds {
  south: number;
  west: number;
  north: number;
  east: number;
}

interface OverpassResponse {
  elements: OverpassElement[];
  remark?: string; // Overpass sometimes reports timeouts/rejections here on a 200
}

class OverpassError extends Error {
  constructor(
    message: string,
    public status?: number,
  ) {
    super(message);
    this.name = "OverpassError";
  }
}

function assertSafeTagValue(tag: string, value: string) {
  // Defense in depth: these are hardcoded today, but if a tag/value ever
  // comes from user input this stops Overpass QL injection.
  const safe = /^[a-zA-Z_:]+$/;
  if (!safe.test(tag) || !safe.test(value)) {
    throw new OverpassError(`Unsafe Overpass tag/value: ${tag}=${value}`);
  }
}

// ---- tiny in-memory cache -------------------------------------------------
// Overpass explicitly asks clients to cache and avoid re-querying the same
// area. Rounding to ~100m snaps GPS jitter and near-identical requests onto
// the same entry.
const CACHE_TTL_MS = 5 * 60 * 1000;
const cache = new Map<string, { expires: number; data: OverpassElement[] }>();

function round(n: number) {
  return n.toFixed(3);
}

// ---- concurrency guard ------------------------------------------------------
// Overpass's fair-use policy asks for a small number of concurrent requests
// per client (effectively ~2, ideally fewer). Serializing everything removes
// a whole class of "why is my IP throttled" bugs — POI lookups aren't
// latency-critical enough to need parallelism.
let inFlight: Promise<unknown> = Promise.resolve();

function enqueue<T>(fn: () => Promise<T>): Promise<T> {
  const run = inFlight.then(fn, fn);
  inFlight = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function queryEndpoint(
  url: string,
  query: string,
  signal?: AbortSignal,
): Promise<OverpassResponse> {
  let lastError: unknown;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain",
          "User-Agent":
            "Pawpals/1.0 (POI lookup; contact: support@pawpals.app)",
        },
        body: query,
        signal,
      });

      if (res.status === 429 || res.status === 504) {
        const retryAfter = Number(res.headers.get("Retry-After")) || 0;
        const backoff = retryAfter * 1000 || 500 * 2 ** attempt + attempt * 125;
        await sleep(backoff);
        continue;
      }

      if (!res.ok) {
        throw new OverpassError(`Overpass responded ${res.status}`, res.status);
      }

      const data: OverpassResponse = await res.json();
      if (data.remark && /timeout|too many/i.test(data.remark)) {
        throw new OverpassError(data.remark);
      }
      return data;
    } catch (err) {
      if (signal?.aborted) throw err;
      lastError = err;
      await sleep(300 * 2 ** attempt);
    }
  }

  throw lastError ?? new OverpassError("All Overpass mirrors failed");
}

async function queryOverpass(
  query: string,
  signal?: AbortSignal,
): Promise<OverpassResponse> {
  let lastError: unknown;

  for (const url of OVERPASS_ENDPOINTS) {
    try {
      return await queryEndpoint(url, query, signal);
    } catch (error) {
      if (signal?.aborted) throw error;
      lastError = error;
    }
  }

  throw lastError ?? new OverpassError("All Overpass mirrors failed");
}

/** Fetch POIs within `radiusMeters` of a lng/lat point (good for a one-off "near me"). */
export async function fetchNearby({
  lng,
  lat,
  radiusMeters = 2000,
  tag = "leisure",
  value = "park",
  limit = 200,
  signal,
}: {
  lng: number;
  lat: number;
  radiusMeters?: number;
  tag?: string;
  value?: string;
  limit: number;
  signal?: AbortSignal;
}): Promise<OverpassElement[]> {
  assertSafeTagValue(tag, value);

  const key = `${tag}=${value}:${round(lat)},${round(lng)}:${radiusMeters}`;
  const cached = cache.get(key);
  if (cached && cached.expires > Date.now()) return cached.data;

  const query = `
    [out:json][timeout:25];
    (
      node["${tag}"="${value}"](around:${radiusMeters},${lat},${lng});
      way["${tag}"="${value}"](around:${radiusMeters},${lat},${lng});
      relation["${tag}"="${value}"](around:${radiusMeters},${lat},${lng});
    );
    out center tags ${limit};
  `;

  const data = await enqueue(() => queryOverpass(query, signal));
  cache.set(key, { expires: Date.now() + CACHE_TTL_MS, data: data.elements });
  return data.elements;
}

/** Fetch POIs within the current map viewport — the right primitive for "search this area". */
export async function fetchInBounds({
  bounds,
  tag = "leisure",
  value = "park",
  limit = 200,
  signal,
}: {
  bounds: Bounds;
  tag?: string;
  value?: string;
  limit: number;
  signal?: AbortSignal;
}): Promise<OverpassElement[]> {
  assertSafeTagValue(tag, value);

  const key = `${tag}=${value}:${round(bounds.south)},${round(bounds.west)},${round(bounds.north)},${round(bounds.east)}`;
  const cached = cache.get(key);
  if (cached && cached.expires > Date.now()) return cached.data;

  const bbox = `${bounds.south},${bounds.west},${bounds.north},${bounds.east}`;
  const query = `
    [out:json][timeout:25];
    (
      node["${tag}"="${value}"](${bbox});
      way["${tag}"="${value}"](${bbox});
      relation["${tag}"="${value}"](${bbox});
    );
    out center tags ${limit};
  `;

  const data = await enqueue(() => queryOverpass(query, signal));
  cache.set(key, { expires: Date.now() + CACHE_TTL_MS, data: data.elements });
  return data.elements;
}

const CACHE_KEY = "sf_pdf_cache";
const MAX_ENTRIES = 20;
const TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

interface CacheEntry {
  output: string;
  timestamp: number;
}

type CacheStore = Record<string, CacheEntry>;

/** Simple string hash for cache keys */
async function hashContent(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 16);
}

function getStore(): CacheStore {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveStore(store: CacheStore) {
  // Evict expired + keep only newest MAX_ENTRIES
  const now = Date.now();
  const entries = Object.entries(store)
    .filter(([, v]) => now - v.timestamp < TTL_MS)
    .sort((a, b) => b[1].timestamp - a[1].timestamp)
    .slice(0, MAX_ENTRIES);
  localStorage.setItem(CACHE_KEY, JSON.stringify(Object.fromEntries(entries)));
}

export async function getCachedSummary(
  text: string,
  summaryLength: string,
  isImagePdf: boolean
): Promise<string | null> {
  const key = await hashContent(`${summaryLength}:${isImagePdf}:${text.slice(0, 5000)}`);
  const store = getStore();
  const entry = store[key];
  if (entry && Date.now() - entry.timestamp < TTL_MS) {
    return entry.output;
  }
  return null;
}

export async function setCachedSummary(
  text: string,
  summaryLength: string,
  isImagePdf: boolean,
  output: string
) {
  const key = await hashContent(`${summaryLength}:${isImagePdf}:${text.slice(0, 5000)}`);
  const store = getStore();
  store[key] = { output, timestamp: Date.now() };
  saveStore(store);
}

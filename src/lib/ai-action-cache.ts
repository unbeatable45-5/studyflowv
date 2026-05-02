// In-memory cache for AI outputs in the PDF viewer session.
// Keyed by file name + page + action + content hash so repeated clicks
// on the same selection / page reuse output without reprocessing.

const store = new Map<string, string>();

function quickHash(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return h.toString(36);
}

export function makeAiCacheKey(parts: {
  scope: string;
  action: string;
  content: string;
  question?: string;
}) {
  const trimmed = parts.content.trim().slice(0, 8000);
  return `${parts.scope}::${parts.action}::${quickHash(trimmed)}::${quickHash(parts.question ?? "")}`;
}

export function getCachedAi(key: string): string | null {
  return store.get(key) ?? null;
}

export function setCachedAi(key: string, value: string) {
  if (!value) return;
  store.set(key, value);
  // Soft cap
  if (store.size > 60) {
    const firstKey = store.keys().next().value;
    if (firstKey) store.delete(firstKey);
  }
}

export function clearAiCache() {
  store.clear();
}

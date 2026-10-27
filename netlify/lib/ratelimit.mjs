import { getStore, connectLambda } from '@netlify/blobs';

const memory = new Map();

/**
 * Per-IP limit per rolling hour. Uses Netlify Blobs when available (shared across
 * function instances); falls back to in-memory (best effort) otherwise.
 * Returns true if the request is allowed.
 */
export async function allow(ip, event, limit = Number(process.env.RATE_LIMIT_PER_HOUR) || 5) {
  const key = 'ip-' + String(ip || 'unknown').replace(/[^a-zA-Z0-9.:_-]/g, '_');
  const now = Date.now();
  const windowMs = 60 * 60 * 1000;
  try {
    if (event) connectLambda(event);
    const store = getStore('rate-limit');
    const hits = ((await store.get(key, { type: 'json' })) || []).filter((t) => now - t < windowMs);
    if (hits.length >= limit) return false;
    hits.push(now);
    await store.setJSON(key, hits);
    return true;
  } catch {
    const hits = (memory.get(key) || []).filter((t) => now - t < windowMs);
    if (hits.length >= limit) return false;
    hits.push(now);
    memory.set(key, hits);
    return true;
  }
}

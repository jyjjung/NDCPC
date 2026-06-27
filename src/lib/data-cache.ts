'use client';

const STORAGE_PREFIX = 'ndcpc-data-cache:';

export const DATA_CACHE_KEYS = {
  announcements: 'announcements',
  volunteers: 'volunteers',
  prayerTopics: 'prayerTopics',
  chatMessages: 'chatMessages',
  photos: 'photos',
  resources: 'resources',
} as const;

type CachedTimestamp = { __ts: number };

function serializeValue(value: unknown): unknown {
  if (
    value &&
    typeof value === 'object' &&
    'toDate' in value &&
    typeof (value as { toDate?: unknown }).toDate === 'function'
  ) {
    const date = (value as { toDate: () => Date }).toDate();
    return { __ts: date.getTime() };
  }

  if (Array.isArray(value)) {
    return value.map(serializeValue);
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
        key,
        serializeValue(entry),
      ])
    );
  }

  return value;
}

function deserializeValue(value: unknown): unknown {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const record = value as Record<string, unknown>;
    if (typeof record.__ts === 'number') {
      const date = new Date(record.__ts);
      return {
        seconds: Math.floor(record.__ts / 1000),
        toDate: () => date,
      };
    }

    return Object.fromEntries(
      Object.entries(record).map(([key, entry]) => [key, deserializeValue(entry)])
    );
  }

  if (Array.isArray(value)) {
    return value.map(deserializeValue);
  }

  return value;
}

export function readCachedCollection<T>(cacheKey: string): T[] | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${cacheKey}`);
    if (!raw) return null;
    return deserializeValue(JSON.parse(raw)) as T[];
  } catch {
    return null;
  }
}

export function writeCachedCollection<T>(cacheKey: string, data: T[]) {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(
      `${STORAGE_PREFIX}${cacheKey}`,
      JSON.stringify(serializeValue(data))
    );
  } catch (error) {
    console.warn('Failed to write data cache', error);
  }
}

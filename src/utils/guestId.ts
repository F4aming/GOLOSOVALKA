const STORAGE_KEY = 'voting_guest_id';

let memoryFallback: string | null = null;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidGuestUuid(value: string): boolean {
  return UUID_RE.test(value.trim());
}

function randomUuid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/** Стабильный идентификатор гостя для публичного голосования без регистрации. */
export function getOrCreateGuestId(): string {
  try {
    const existing = localStorage.getItem(STORAGE_KEY);
    if (existing && isValidGuestUuid(existing)) return existing.trim();
    if (existing) localStorage.removeItem(STORAGE_KEY);
    const next = randomUuid();
    localStorage.setItem(STORAGE_KEY, next);
    return next;
  } catch {
    if (!memoryFallback) memoryFallback = randomUuid();
    return memoryFallback;
  }
}

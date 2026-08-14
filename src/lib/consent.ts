export type ConsentValue = "granted" | "denied";

type ConsentRecord = {
  value: ConsentValue;
  timestamp: number; // epoch ms
};

const STORAGE_KEY = "ad-consent";
const REPROMPT_AFTER_MS = 180 * 24 * 60 * 60 * 1000; // 180 days

function readRecord(): ConsentRecord | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ConsentRecord>;
    if (parsed.value !== "granted" && parsed.value !== "denied") return null;
    if (typeof parsed.timestamp !== "number") return null;
    return { value: parsed.value, timestamp: parsed.timestamp };
  } catch {
    return null;
  }
}

/**
 * Current stored consent choice, or null if the visitor has not decided yet
 * (or storage is unavailable). Contract for the future ad-wiring phase:
 * gate any network ad-script loading on `getConsent() === "granted"`.
 */
export function getConsent(): ConsentValue | null {
  return readRecord()?.value ?? null;
}

/** Persists the visitor's consent choice with a timestamp. No cookie is set. */
export function setConsent(value: ConsentValue): void {
  if (typeof window === "undefined") return;
  const record: ConsentRecord = { value, timestamp: Date.now() };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
  } catch {
    // localStorage unavailable (private mode / quota) — banner simply
    // re-prompts next visit; not fatal.
  }
}

/**
 * True when the consent banner should be shown: no prior choice has been
 * recorded, or a prior "denied" choice is older than the 180-day
 * re-prompt window. A "granted" choice never re-prompts.
 */
export function shouldPromptConsent(): boolean {
  const record = readRecord();
  if (!record) return true;
  if (record.value === "granted") return false;
  return Date.now() - record.timestamp > REPROMPT_AFTER_MS;
}

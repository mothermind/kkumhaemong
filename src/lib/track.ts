/**
 * Client-safe fire-and-forget event tracking helper.
 * Never blocks interaction, never throws to the UI.
 */

export type TrackEventType =
  | "related_click"
  | "search_submit"
  | "search_result_click"
  | "explore_nav"
  | "lucky_reveal";

export type TrackEvent = {
  type: TrackEventType;
  slug?: string;
  locale?: string;
};

const ENDPOINT = "/api/event";

export function track(event: TrackEvent): void {
  try {
    const body = JSON.stringify(event);

    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      const blob = new Blob([body], { type: "application/json" });
      if (navigator.sendBeacon(ENDPOINT, blob)) return;
    }

    if (typeof fetch === "function") {
      fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
      }).catch(() => {});
    }
  } catch {
    // Tracking must never surface an error to the UI.
  }
}

"use client";

import { useEffect, useSyncExternalStore } from "react";

// Module-level store for cross-locale slug pair on dream pages.
//
// Dream pages write their {ko, en} slug pair via <LocaleSlugUpdater />.
// The Header's LanguageToggle reads it via useLocaleSlug().
// Using a module-level store instead of React context avoids the layout/page
// boundary: React context cannot flow from page.tsx up to layout.tsx.

interface LocaleSlugPair {
  ko: string;
  en: string;
}

let _slugs: LocaleSlugPair | null = null;
const _listeners = new Set<() => void>();

function setSlugStore(pair: LocaleSlugPair | null) {
  _slugs = pair;
  _listeners.forEach((fn) => fn());
}

function subscribeSlugStore(fn: () => void) {
  _listeners.add(fn);
  return () => _listeners.delete(fn);
}

function getSlugSnapshot() {
  return _slugs;
}

// Rendered inside the dream page — pushes slug pair into the module store.
// Clears on unmount (route navigation away from dream page).
export function LocaleSlugUpdater({ ko, en }: LocaleSlugPair) {
  useEffect(() => {
    setSlugStore({ ko, en });
    return () => setSlugStore(null);
  }, [ko, en]);
  return null;
}

export function useLocaleSlug(): LocaleSlugPair | null {
  return useSyncExternalStore(
    subscribeSlugStore,
    getSlugSnapshot,
    // Server snapshot: always null — SSR never knows the slug pair
    () => null
  );
}

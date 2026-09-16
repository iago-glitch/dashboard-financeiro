"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Household income, kept ONLY in the browser's localStorage — never sent to
 * any server, never part of the Google Sheets integration, never in the
 * source code, env vars, or git history. This is deliberately client-only
 * storage: it lives per-browser/device and is not encrypted, so treat it as
 * "convenience privacy" (kept out of the repo and off any server) rather
 * than secure storage.
 */
export interface IncomeSettings {
  iago: number;
  esposa: number;
}

const STORAGE_KEY = "dashboard-financeiro:income-settings:v1";
const CHANGE_EVENT = "dashboard-financeiro:income-settings-changed";

const DEFAULT_SETTINGS: IncomeSettings = { iago: 0, esposa: 0 };

function sanitize(value: unknown): IncomeSettings {
  const raw = (value ?? {}) as Partial<Record<keyof IncomeSettings, unknown>>;
  const toNonNegativeNumber = (n: unknown): number => {
    const parsed = Number(n);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
  };
  return {
    iago: toNonNegativeNumber(raw.iago),
    esposa: toNonNegativeNumber(raw.esposa),
  };
}

let cachedRaw: string | null | undefined;
let cachedValue: IncomeSettings = DEFAULT_SETTINGS;

function getSnapshot(): IncomeSettings {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    try {
      cachedValue = raw ? sanitize(JSON.parse(raw)) : DEFAULT_SETTINGS;
    } catch {
      cachedValue = DEFAULT_SETTINGS;
    }
  }
  return cachedValue;
}

function getServerSnapshot(): IncomeSettings {
  return DEFAULT_SETTINGS;
}

function subscribe(callback: () => void): () => void {
  window.addEventListener(CHANGE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(CHANGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

/** Reads/writes the household income from localStorage, re-rendering every
 * subscribed component when it changes (including edits made in another
 * browser tab). */
export function useIncomeSettings(): [IncomeSettings, (next: IncomeSettings) => void] {
  const settings = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setSettings = useCallback((next: IncomeSettings) => {
    const sanitized = sanitize(next);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  return [settings, setSettings];
}

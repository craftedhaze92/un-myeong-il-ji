import type { BirthFormValues } from "./birth-form";

const PROFILE_KEY = "umij.profiles.v1";
const JOURNAL_KEY = "umij.journal.v1";
const MAX_PROFILES = 20;

export interface SavedProfile {
  id: string;
  label: string;
  values: BirthFormValues;
  updatedAt: string;
}

export interface JournalEntry {
  key: string;
  date: string;
  profile: string;
  text: string;
  updatedAt: string;
}

function readArray<T>(storage: Storage, key: string): T[] {
  try {
    const value: unknown = JSON.parse(storage.getItem(key) ?? "[]");
    return Array.isArray(value) ? (value as T[]) : [];
  } catch {
    return [];
  }
}

export function loadProfiles(storage: Storage): SavedProfile[] {
  return readArray<SavedProfile>(storage, PROFILE_KEY).filter(
    (profile) => profile?.id && profile?.values?.name,
  );
}

export function saveProfile(
  storage: Storage,
  values: BirthFormValues,
): SavedProfile[] {
  const profiles = loadProfiles(storage);
  const signature = `${values.name.trim()}|${values.y}-${values.m}-${values.d}|${values.hh}:${values.mi}`;
  const existing = profiles.find(
    (profile) =>
      `${profile.values.name.trim()}|${profile.values.y}-${profile.values.m}-${profile.values.d}|${profile.values.hh}:${profile.values.mi}` ===
      signature,
  );
  const saved: SavedProfile = {
    id: existing?.id ?? globalThis.crypto?.randomUUID?.() ?? `${Date.now()}`,
    label: values.name.trim(),
    values: { ...values, name: values.name.trim(), city: values.city.trim() },
    updatedAt: new Date().toISOString(),
  };
  const next = [
    saved,
    ...profiles.filter((profile) => profile.id !== saved.id),
  ].slice(0, MAX_PROFILES);
  storage.setItem(PROFILE_KEY, JSON.stringify(next));
  return next;
}

export function deleteProfile(storage: Storage, id: string): SavedProfile[] {
  const next = loadProfiles(storage).filter((profile) => profile.id !== id);
  storage.setItem(PROFILE_KEY, JSON.stringify(next));
  return next;
}

export function journalKey(profile: string, date: string): string {
  return `${profile}|${date}`;
}

export function loadJournalEntry(
  storage: Storage,
  profile: string,
  date: string,
): JournalEntry | null {
  const key = journalKey(profile, date);
  return (
    readArray<JournalEntry>(storage, JOURNAL_KEY).find(
      (entry) => entry.key === key,
    ) ?? null
  );
}

export function saveJournalEntry(
  storage: Storage,
  profile: string,
  date: string,
  text: string,
): JournalEntry | null {
  const entries = readArray<JournalEntry>(storage, JOURNAL_KEY);
  const key = journalKey(profile, date);
  const rest = entries.filter((entry) => entry.key !== key);
  if (!text.trim()) {
    storage.setItem(JOURNAL_KEY, JSON.stringify(rest));
    return null;
  }
  const entry = {
    key,
    profile,
    date,
    text: text.trim(),
    updatedAt: new Date().toISOString(),
  };
  storage.setItem(JOURNAL_KEY, JSON.stringify([entry, ...rest]));
  return entry;
}

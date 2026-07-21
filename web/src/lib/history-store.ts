export type HistoryType = "image" | "video";

export interface HistoryEntry {
  id: string;
  type: HistoryType;
  sourceRoute: string;
  prompt: string;
  mediaUrl?: string;
  revisedPrompt?: string;
  createdAt: number;
}

const HISTORY_STORAGE_KEY = "agnes_history_entries";
const MAX_ENTRIES_PER_TYPE = 50;

function getStorageKey(): string {
  return HISTORY_STORAGE_KEY;
}

function loadAll(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(getStorageKey());
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function saveAll(entries: HistoryEntry[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(getStorageKey(), JSON.stringify(entries));
  } catch {
    // Storage full — try trimming oldest entries
    const trimmed = trimEntries(entries);
    try {
      localStorage.setItem(getStorageKey(), JSON.stringify(trimmed));
    } catch {
      // Still full — clear all
      try {
        localStorage.removeItem(getStorageKey());
      } catch {}
    }
  }
}

function trimEntries(entries: HistoryEntry[]): HistoryEntry[] {
  const byType = new Map<HistoryType, HistoryEntry[]>();
  for (const entry of entries) {
    const list = byType.get(entry.type) || [];
    list.push(entry);
    byType.set(entry.type, list);
  }

  const trimmed: HistoryEntry[] = [];
  for (const [type, typeEntries] of byType) {
    typeEntries.sort((a, b) => b.createdAt - a.createdAt);
    trimmed.push(...typeEntries.slice(0, MAX_ENTRIES_PER_TYPE));
  }
  trimmed.sort((a, b) => b.createdAt - a.createdAt);
  return trimmed;
}

export function addHistoryEntry(entry: Omit<HistoryEntry, "id" | "createdAt">): HistoryEntry | null {
  const entries = loadAll();
  const newEntry: HistoryEntry = {
    ...entry,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    createdAt: Date.now(),
  };
  entries.unshift(newEntry);
  saveAll(entries);
  return newEntry;
}

export function deleteHistoryEntry(id: string): boolean {
  const entries = loadAll();
  const filtered = entries.filter((e) => e.id !== id);
  if (filtered.length === entries.length) return false;
  saveAll(filtered);
  return true;
}

export function getAllHistory(): HistoryEntry[] {
  return loadAll().sort((a, b) => b.createdAt - a.createdAt);
}

export function getHistoryByType(type: HistoryType): HistoryEntry[] {
  return loadAll()
    .filter((e) => e.type === type)
    .sort((a, b) => b.createdAt - a.createdAt);
}

export function clearHistory(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(getStorageKey());
  } catch {}
}

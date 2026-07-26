import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";

/**
 * history-store reads `window`/`localStorage` at call time, so we install a
 * minimal in-memory stub before importing it.
 */
class MemoryStorage {
  private store = new Map<string, string>();
  getItem(key: string) {
    return this.store.has(key) ? this.store.get(key)! : null;
  }
  setItem(key: string, value: string) {
    this.store.set(key, value);
  }
  removeItem(key: string) {
    this.store.delete(key);
  }
  clear() {
    this.store.clear();
  }
}

const storage = new MemoryStorage();
vi.stubGlobal("window", {});
vi.stubGlobal("localStorage", storage);

const {
  addHistoryEntry,
  deleteHistoryEntry,
  getAllHistory,
  getHistoryByType,
  clearHistory,
} = await import("@/lib/history-store");

beforeEach(() => {
  storage.clear();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("addHistoryEntry", () => {
  it("assigns an id and createdAt, and persists the entry", () => {
    const entry = addHistoryEntry({
      type: "image",
      sourceRoute: "/text-to-image",
      prompt: "a cat",
      mediaUrl: "https://example.com/a.png",
    });

    expect(entry).not.toBeNull();
    expect(entry!.id).toBeTruthy();
    expect(entry!.createdAt).toBeTypeOf("number");

    const all = getAllHistory();
    expect(all).toHaveLength(1);
    expect(all[0].prompt).toBe("a cat");
  });

  it("returns entries newest-first", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
    addHistoryEntry({ type: "image", sourceRoute: "/a", prompt: "older" });
    vi.setSystemTime(new Date("2026-01-02T00:00:00Z"));
    addHistoryEntry({ type: "image", sourceRoute: "/a", prompt: "newer" });

    const all = getAllHistory();
    expect(all.map((e) => e.prompt)).toEqual(["newer", "older"]);
  });
});

describe("getHistoryByType", () => {
  it("filters by type", () => {
    addHistoryEntry({ type: "image", sourceRoute: "/a", prompt: "img" });
    addHistoryEntry({ type: "video", sourceRoute: "/b", prompt: "vid" });

    expect(getHistoryByType("image").map((e) => e.prompt)).toEqual(["img"]);
    expect(getHistoryByType("video").map((e) => e.prompt)).toEqual(["vid"]);
  });
});

describe("deleteHistoryEntry", () => {
  it("removes a matching entry and reports success", () => {
    const entry = addHistoryEntry({ type: "image", sourceRoute: "/a", prompt: "x" })!;
    expect(deleteHistoryEntry(entry.id)).toBe(true);
    expect(getAllHistory()).toHaveLength(0);
  });

  it("reports false when the id is unknown", () => {
    addHistoryEntry({ type: "image", sourceRoute: "/a", prompt: "x" });
    expect(deleteHistoryEntry("does-not-exist")).toBe(false);
    expect(getAllHistory()).toHaveLength(1);
  });
});

describe("clearHistory", () => {
  it("wipes all entries", () => {
    addHistoryEntry({ type: "image", sourceRoute: "/a", prompt: "x" });
    clearHistory();
    expect(getAllHistory()).toEqual([]);
  });
});

describe("corrupt storage", () => {
  it("recovers from non-JSON and non-array payloads", () => {
    storage.setItem("agnes_history_entries", "not json{{");
    expect(getAllHistory()).toEqual([]);

    storage.setItem("agnes_history_entries", JSON.stringify({ nope: true }));
    expect(getAllHistory()).toEqual([]);
  });
});

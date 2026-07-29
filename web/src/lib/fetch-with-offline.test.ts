import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchWithOffline, resolveApiUrl } from "@/lib/fetch-with-offline";

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("resolveApiUrl", () => {
  it("joins API-relative endpoints without duplicating /api", () => {
    expect(resolveApiUrl("/image/generate", "/api")).toBe("/api/image/generate");
  });

  it("tolerates callers that already include the /api prefix", () => {
    expect(resolveApiUrl("/api/image/generate", "/api")).toBe("/api/image/generate");
    expect(resolveApiUrl("/api/image/generate", "https://example.com/api")).toBe(
      "https://example.com/api/image/generate"
    );
  });

  it("leaves absolute request URLs unchanged", () => {
    expect(resolveApiUrl("https://example.com/custom", "/api")).toBe(
      "https://example.com/custom"
    );
  });
});

describe("fetchWithOffline", () => {
  it("reports a clear timeout error when its abort controller fires", async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      "fetch",
      vi.fn((_input: RequestInfo | URL, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener(
            "abort",
            () => reject(new DOMException("Aborted", "AbortError")),
            { once: true }
          );
        })
      )
    );

    const request = fetchWithOffline("/image/generate", { timeout: 50 });
    const assertion = expect(request).rejects.toThrow("Request timed out after 1 second");

    await vi.advanceTimersByTimeAsync(50);
    await assertion;
  });
});
